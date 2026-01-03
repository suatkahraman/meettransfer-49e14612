import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Frankfurter API for exchange rates
const EXCHANGE_API_URL = 'https://api.frankfurter.app'

// Fallback rates (approximate)
const FALLBACK_RATES: Record<string, number> = {
  'EUR': 37.5,
  'USD': 34.5,
  'GBP': 43.5,
  'AED': 9.4,
  'AUD': 22.0,
}

async function getExchangeRate(fromCurrency: string): Promise<{ rate: number; isFallback: boolean }> {
  if (fromCurrency === 'TRY') {
    return { rate: 1, isFallback: false }
  }

  try {
    const response = await fetch(`${EXCHANGE_API_URL}/latest?from=${fromCurrency}&to=TRY`)
    
    if (!response.ok) {
      console.error('Exchange API error, using fallback')
      const fallbackRate = FALLBACK_RATES[fromCurrency]
      if (fallbackRate) {
        return { rate: fallbackRate, isFallback: true }
      }
      throw new Error(`No fallback rate for ${fromCurrency}`)
    }

    const data = await response.json()
    const rate = data.rates?.TRY
    
    if (!rate) {
      throw new Error('TRY rate not found in response')
    }

    return { rate, isFallback: false }
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    const fallbackRate = FALLBACK_RATES[fromCurrency]
    if (fallbackRate) {
      return { rate: fallbackRate, isFallback: true }
    }
    throw error
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { reservation_id } = await req.json()

    if (!reservation_id) {
      return new Response(
        JSON.stringify({ error: 'reservation_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch agency reservation details
    const { data: agencyDetail, error: fetchError } = await supabaseClient
      .from('agency_reservation_details')
      .select('id, company_amount, agency_price_currency, company_amount_try')
      .eq('reservation_id', reservation_id)
      .single()

    if (fetchError || !agencyDetail) {
      console.log('No agency details found for reservation:', reservation_id)
      return new Response(
        JSON.stringify({ message: 'No agency details found', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If already converted, skip
    if (agencyDetail.company_amount_try) {
      console.log('Already converted:', reservation_id)
      return new Response(
        JSON.stringify({ 
          message: 'Already converted',
          company_amount_try: agencyDetail.company_amount_try 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currency = agencyDetail.agency_price_currency || 'TRY'
    const amount = agencyDetail.company_amount || 0

    // Get exchange rate
    const { rate, isFallback } = await getExchangeRate(currency)
    const tryAmount = amount * rate
    const today = new Date().toISOString().split('T')[0]

    console.log(`Converting ${amount} ${currency} to TRY at rate ${rate}: ${tryAmount}`)

    // Update the agency reservation details with TRY amount
    const { error: updateError } = await supabaseClient
      .from('agency_reservation_details')
      .update({
        company_amount_try: tryAmount,
        exchange_rate_used: rate,
        conversion_date: today
      })
      .eq('id', agencyDetail.id)

    if (updateError) {
      console.error('Error updating agency details:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        reservation_id,
        original_amount: amount,
        original_currency: currency,
        exchange_rate: rate,
        try_amount: tryAmount,
        conversion_date: today,
        is_fallback_rate: isFallback
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in convert-agency-price-to-try:', error)
    const errorMessage = error instanceof Error ? error.message : 'Conversion failed'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})