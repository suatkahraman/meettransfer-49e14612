import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reservation_id } = await req.json();

    if (!reservation_id) {
      return new Response(
        JSON.stringify({ error: 'reservation_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing agency balance update for reservation:', reservation_id);

    // Get reservation with agency info
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('id, agency_id, status')
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) {
      console.error('Reservation not found:', resError);
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip if no agency linked
    if (!reservation.agency_id) {
      console.log('No agency linked, skipping balance update');
      return new Response(
        JSON.stringify({ message: 'No agency linked to this reservation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agency reservation details with amount and currency
    const { data: agencyDetail, error: detailError } = await supabase
      .from('agency_reservation_details')
      .select('company_amount, agency_price_currency')
      .eq('reservation_id', reservation_id)
      .maybeSingle();

    // Get passenger cash amount from reservation (this is INCOME for agency - reduces their debt)
    const { data: reservationDetails } = await supabase
      .from('reservations')
      .select('passenger_cash_amount, passenger_cash_currency, price, price_currency')
      .eq('id', reservation_id)
      .single();

    // Admin fiyatı = Acenta'nın gideri (company_amount veya reservation price)
    // Yolcu nakit = Acenta'nın geliri (passenger_cash_amount)
    const adminPrice = agencyDetail?.company_amount || reservationDetails?.price || 0;
    const agencyCurrency = agencyDetail?.agency_price_currency || reservationDetails?.price_currency || 'EUR';
    const passengerCashAmount = reservationDetails?.passenger_cash_amount || 0;
    const passengerCashCurrency = reservationDetails?.passenger_cash_currency || agencyCurrency;

    // Net amount to add to agency debt:
    // Gider (admin fiyatı) - Gelir (yolcu nakit) = Net borç artışı
    // Eğer yolcu nakit >= admin fiyatı ise, acenta borcuna ekleme yapılmaz
    const netAmountToAdd = Math.max(0, adminPrice - passengerCashAmount);

    console.log(`Admin Price (expense): ${adminPrice} ${agencyCurrency}, Passenger cash (income): ${passengerCashAmount}, Net debt to add: ${netAmountToAdd}`);

    if (netAmountToAdd <= 0) {
      console.log('No amount to add to agency balance (passenger cash covers the price)');
      return new Response(
        JSON.stringify({ 
          message: 'No amount to add - passenger cash covers the price',
          admin_price: adminPrice,
          passenger_cash: passengerCashAmount,
          net_debt: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agency info
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, agency_name')
      .eq('id', reservation.agency_id)
      .single();

    if (agencyError || !agency) {
      console.error('Agency not found:', agencyError);
      return new Response(
        JSON.stringify({ error: 'Agency not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate current balance for this specific currency from transactions
    const { data: existingTransactions } = await supabase
      .from('agency_transactions')
      .select('amount, type, currency')
      .eq('agency_id', agency.id)
      .eq('currency', agencyCurrency);

    let currentCurrencyBalance = 0;
    if (existingTransactions) {
      existingTransactions.forEach(tx => {
        if (tx.type === 'top_up') {
          currentCurrencyBalance += tx.amount;
        } else {
          currentCurrencyBalance -= Math.abs(tx.amount);
        }
      });
    }

    // New balance for this currency after adding the net amount
    const newCurrencyBalance = currentCurrencyBalance + netAmountToAdd;

    // Get currency symbol for description
    const currencySymbols: Record<string, string> = {
      'TRY': '₺',
      'EUR': '€',
      'USD': '$',
      'GBP': '£'
    };
    const currencySymbol = currencySymbols[agencyCurrency] || agencyCurrency;
    const passengerCashSymbol = currencySymbols[passengerCashCurrency] || passengerCashCurrency;

    // Create transaction record with detailed description and currency
    let description = `Transfer tamamlandı - Gider: ${currencySymbol}${adminPrice.toFixed(2)}`;
    if (passengerCashAmount > 0) {
      description += ` | Gelir (Yolcu nakit): ${passengerCashSymbol}${passengerCashAmount.toFixed(2)}`;
      description += ` | Net Borç: ${currencySymbol}${netAmountToAdd.toFixed(2)}`;
    }

    const { error: txError } = await supabase
      .from('agency_transactions')
      .insert({
        agency_id: agency.id,
        amount: netAmountToAdd,
        type: 'reservation_completed',
        description: description,
        balance_after: newCurrencyBalance,
        reservation_id: reservation_id,
        currency: agencyCurrency,
      });

    if (txError) {
      console.error('Failed to create transaction:', txError);
    }

    console.log(`Added net ${currencySymbol}${netAmountToAdd} (${agencyCurrency}) to ${agency.agency_name}. Admin price: ${adminPrice}, Passenger cash: ${passengerCashAmount}, New ${agencyCurrency} balance: ${newCurrencyBalance}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        admin_price: adminPrice,
        passenger_cash_amount: passengerCashAmount,
        net_added_amount: netAmountToAdd,
        currency: agencyCurrency,
        new_currency_balance: newCurrencyBalance,
        agency_name: agency.agency_name 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
