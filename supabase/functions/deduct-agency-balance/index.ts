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

    const companyAmount = agencyDetail?.company_amount || 0;
    const agencyCurrency = agencyDetail?.agency_price_currency || 'TRY';

    if (companyAmount <= 0) {
      console.log('No company amount to add');
      return new Response(
        JSON.stringify({ message: 'No company amount to add' }),
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

    // Add the company_amount to agency balance (in agency's currency)
    const newBalance = (agency.balance || 0) + companyAmount;

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

    // Create transaction record
    const { error: txError } = await supabase
      .from('agency_transactions')
      .insert({
        agency_id: agency.id,
        amount: companyAmount,
        type: 'reservation_completed',
        description: `Transfer tamamlandı - ${currencySymbol}${companyAmount.toFixed(2)}`,
        balance_after: newBalance,
        reservation_id: reservation_id,
      });

    if (txError) {
      console.error('Failed to create transaction:', txError);
    }

    console.log(`Added ${currencySymbol}${companyAmount} to ${agency.agency_name}. New balance: ${currencySymbol}${newBalance}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        added_amount: companyAmount,
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
