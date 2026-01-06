import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback exchange rates
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  'EUR': { 'USD': 1.08, 'TRY': 37.5, 'GBP': 0.85, 'AED': 3.97, 'AUD': 1.65 },
  'USD': { 'EUR': 0.93, 'TRY': 34.5, 'GBP': 0.79, 'AED': 3.67, 'AUD': 1.53 },
  'TRY': { 'EUR': 0.027, 'USD': 0.029, 'GBP': 0.023, 'AED': 0.11, 'AUD': 0.044 },
  'GBP': { 'EUR': 1.18, 'USD': 1.27, 'TRY': 44.1, 'AED': 4.67, 'AUD': 1.94 },
  'AED': { 'EUR': 0.25, 'USD': 0.27, 'TRY': 9.4, 'GBP': 0.21, 'AUD': 0.42 },
  'AUD': { 'EUR': 0.61, 'USD': 0.65, 'TRY': 22.5, 'GBP': 0.52, 'AED': 2.40 },
};

// Convert €3 to target currency
async function convertEuroToTargetCurrency(targetCurrency: string): Promise<number> {
  const discountEuros = 3;
  
  if (targetCurrency === 'EUR') {
    return discountEuros;
  }
  
  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=EUR&to=${targetCurrency}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (response.ok) {
      const data = await response.json();
      const rate = data.rates[targetCurrency];
      if (rate) {
        return Math.round(discountEuros * rate);
      }
    }
  } catch (e) {
    console.error("Currency conversion API error:", e);
  }
  
  // Fallback
  const rate = FALLBACK_RATES['EUR']?.[targetCurrency] || 1;
  console.log(`Using fallback rate for discount: EUR -> ${targetCurrency} = ${rate}`);
  return Math.round(discountEuros * rate);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reservation_id, quick_booking_id } = await req.json();
    
    if (!reservation_id && !quick_booking_id) {
      return new Response(
        JSON.stringify({ error: 'reservation_id or quick_booking_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing auto discount for reservation: ${reservation_id}, quick_booking: ${quick_booking_id}`);

    // Check how many times the price was rejected for this booking
    const { data: rejectionHistory, error: historyError } = await supabase
      .from('price_history')
      .select('*')
      .eq(reservation_id ? 'reservation_id' : 'quick_booking_id', reservation_id || quick_booking_id)
      .eq('action', 'rejected')
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching rejection history:', historyError);
      throw historyError;
    }

    const rejectionCount = rejectionHistory?.length || 0;
    console.log(`Rejection count: ${rejectionCount}`);

    // If already rejected once (this is the second rejection), don't apply discount
    if (rejectionCount > 1) {
      console.log('Already applied discount once, no more discounts');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Maximum discounts already applied',
          can_reject_again: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current booking details
    let currentPrice: number;
    let currentCurrency: string;
    let bookingType: 'reservation' | 'quick_booking';

    if (reservation_id) {
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('price, price_currency')
        .eq('id', reservation_id)
        .single();

      if (resError || !reservation?.price) {
        throw new Error('Reservation not found or no price set');
      }

      currentPrice = reservation.price;
      currentCurrency = reservation.price_currency || 'EUR';
      bookingType = 'reservation';
    } else {
      const { data: quickBooking, error: qbError } = await supabase
        .from('quick_booking_requests')
        .select('price, price_currency')
        .eq('id', quick_booking_id)
        .single();

      if (qbError || !quickBooking?.price) {
        throw new Error('Quick booking not found or no price set');
      }

      currentPrice = quickBooking.price;
      currentCurrency = quickBooking.price_currency || 'EUR';
      bookingType = 'quick_booking';
    }

    console.log(`Current price: ${currentPrice} ${currentCurrency}`);

    // Calculate discount in target currency (€3 equivalent)
    const discountAmount = await convertEuroToTargetCurrency(currentCurrency);
    const newPrice = Math.max(currentPrice - discountAmount, 1); // Ensure price doesn't go below 1

    console.log(`Discount: ${discountAmount} ${currentCurrency}, New price: ${newPrice}`);

    // Update the booking with new price and reset status
    if (bookingType === 'reservation') {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          price: newPrice,
          status: 'waiting_for_customer_approval',
          discount_amount: discountAmount,
        })
        .eq('id', reservation_id);

      if (updateError) throw updateError;

      // Record in price history
      await supabase.from('price_history').insert({
        reservation_id: reservation_id,
        price: newPrice,
        price_currency: currentCurrency,
        action: 'auto_discount',
        customer_note: `Otomatik indirim: €3 = ${discountAmount} ${currentCurrency}`,
      });

      // Notify admins
      await supabase.functions.invoke('create-notification', {
        body: {
          type: 'auto_discount_applied',
          title: 'Auto Discount Applied',
          message: `Customer rejected price. Auto discount of €3 (${discountAmount} ${currentCurrency}) applied. New price: ${newPrice} ${currentCurrency}`,
          notify_admins: true,
          reservation_id: reservation_id,
          send_push: true,
        }
      });
    } else {
      const { error: updateError } = await supabase
        .from('quick_booking_requests')
        .update({ 
          price: newPrice,
          status: 'price_sent',
        })
        .eq('id', quick_booking_id);

      if (updateError) throw updateError;

      // Record in price history
      await supabase.from('price_history').insert({
        quick_booking_id: quick_booking_id,
        price: newPrice,
        price_currency: currentCurrency,
        action: 'auto_discount',
        customer_note: `Otomatik indirim: €3 = ${discountAmount} ${currentCurrency}`,
      });

      // Notify admins
      await supabase.functions.invoke('create-notification', {
        body: {
          type: 'auto_discount_applied',
          title: 'Auto Discount Applied (Quick Booking)',
          message: `Customer rejected price. Auto discount of €3 (${discountAmount} ${currentCurrency}) applied. New price: ${newPrice} ${currentCurrency}`,
          notify_admins: true,
          send_push: true,
        }
      });
    }

    console.log('Auto discount applied successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        original_price: currentPrice,
        discount_amount: discountAmount,
        new_price: newPrice,
        currency: currentCurrency,
        can_reject_again: false, // After discount applied, no more rejections allowed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error applying auto discount:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
