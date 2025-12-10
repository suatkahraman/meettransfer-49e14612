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

    console.log('Processing deduction for reservation:', reservation_id);

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
      console.log('No agency linked, skipping deduction');
      return new Response(
        JSON.stringify({ message: 'No agency linked to this reservation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agency details
    const { data: agencyDetail, error: detailError } = await supabase
      .from('agency_reservation_details')
      .select('company_amount')
      .eq('reservation_id', reservation_id)
      .maybeSingle();

    const companyAmount = agencyDetail?.company_amount || 0;

    if (companyAmount <= 0) {
      console.log('No company amount to deduct');
      return new Response(
        JSON.stringify({ message: 'No company amount to deduct' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current agency balance
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, agency_name, balance')
      .eq('id', reservation.agency_id)
      .single();

    if (agencyError || !agency) {
      console.error('Agency not found:', agencyError);
      return new Response(
        JSON.stringify({ error: 'Agency not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newBalance = (agency.balance || 0) - companyAmount;

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

    // Create transaction record
    const { error: txError } = await supabase
      .from('agency_transactions')
      .insert({
        agency_id: agency.id,
        amount: companyAmount,
        type: 'deduction',
        description: `Transfer completed - Reservation ${reservation_id.slice(0, 8)}`,
        balance_after: newBalance,
        reservation_id: reservation_id,
      });

    if (txError) {
      console.error('Failed to create transaction:', txError);
    }

    console.log(`Deducted ₺${companyAmount} from ${agency.agency_name}. New balance: ₺${newBalance}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deducted: companyAmount,
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
