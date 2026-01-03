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

    // Get passenger cash amount from reservation (this reduces agency debt)
    const { data: reservationDetails } = await supabase
      .from('reservations')
      .select('passenger_cash_amount, passenger_cash_currency')
      .eq('id', reservation_id)
      .single();

    const companyAmount = agencyDetail?.company_amount || 0;
    const agencyCurrency = agencyDetail?.agency_price_currency || 'TRY';
    const passengerCashAmount = reservationDetails?.passenger_cash_amount || 0;
    const passengerCashCurrency = reservationDetails?.passenger_cash_currency || agencyCurrency;

    // Net amount to add = company_amount - passenger_cash_amount
    // (passenger pays cash directly to driver, so agency owes less)
    const netAmountToAdd = companyAmount - passengerCashAmount;

    console.log(`Company amount: ${companyAmount}, Passenger cash: ${passengerCashAmount}, Net to add: ${netAmountToAdd}`);

    if (netAmountToAdd <= 0 && companyAmount <= 0) {
      console.log('No amount to add to agency balance');
      return new Response(
        JSON.stringify({ message: 'No amount to add to agency balance' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current agency with balance and currency
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, agency_name, balance, currency')
      .eq('id', reservation.agency_id)
      .single();

    if (agencyError || !agency) {
      console.error('Agency not found:', agencyError);
      return new Response(
        JSON.stringify({ error: 'Agency not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add the net amount to agency balance (in agency's currency)
    // Net = company_amount - passenger_cash_amount
    const newBalance = (agency.balance || 0) + netAmountToAdd;

    // Update agency balance
    const { error: updateError } = await supabase
      .from('agencies')
      .update({ balance: newBalance })
      .eq('id', agency.id);

    if (updateError) {
      console.error('Failed to update balance:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get currency symbol for description
    const currencySymbols: Record<string, string> = {
      'TRY': '₺',
      'EUR': '€',
      'USD': '$',
      'GBP': '£'
    };
    const currencySymbol = currencySymbols[agencyCurrency] || agencyCurrency;
    const passengerCashSymbol = currencySymbols[passengerCashCurrency] || passengerCashCurrency;

    // Create transaction record with detailed description
    let description = `Transfer tamamlandı - ${currencySymbol}${companyAmount.toFixed(2)}`;
    if (passengerCashAmount > 0) {
      description += ` (Yolcu nakit: ${passengerCashSymbol}${passengerCashAmount.toFixed(2)} düşüldü)`;
    }

    const { error: txError } = await supabase
      .from('agency_transactions')
      .insert({
        agency_id: agency.id,
        amount: netAmountToAdd,
        type: 'reservation_completed',
        description: description,
        balance_after: newBalance,
        reservation_id: reservation_id,
      });

    if (txError) {
      console.error('Failed to create transaction:', txError);
    }

    console.log(`Added net ${currencySymbol}${netAmountToAdd} to ${agency.agency_name}. Company: ${companyAmount}, Passenger cash: ${passengerCashAmount}, New balance: ${currencySymbol}${newBalance}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        company_amount: companyAmount,
        passenger_cash_amount: passengerCashAmount,
        net_added_amount: netAmountToAdd,
        currency: agencyCurrency,
        new_balance: newBalance,
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
