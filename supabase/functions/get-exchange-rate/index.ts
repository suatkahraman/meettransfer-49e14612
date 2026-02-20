import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Free exchange rate API - no key required
const EXCHANGE_API_URL = 'https://api.frankfurter.app'

interface ExchangeRateResponse {
  rate: number
  from: string
  to: string
  date: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { from_currency, to_currency = 'TRY', amount } = await req.json()

    if (!from_currency) {
      return new Response(
        JSON.stringify({ error: 'from_currency is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If same currency, no conversion needed
    if (from_currency === to_currency) {
      return new Response(
        JSON.stringify({
          rate: 1,
          from: from_currency,
          to: to_currency,
          date: new Date().toISOString().split('T')[0],
          converted_amount: amount || null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Fetching exchange rate: ${from_currency} -> ${to_currency}`)

    // Fetch current exchange rate from Frankfurter API
    const response = await fetch(
      `${EXCHANGE_API_URL}/latest?from=${from_currency}&to=${to_currency}`
    )

    if (!response.ok) {
      console.error('Exchange API error:', response.status, await response.text())
      
      // Fallback rates (Base: EUR) - Updated Feb 2026
      const eurRates: Record<string, number> = {
        'EUR': 1,
        'TRY': 38.5,
        'USD': 1.09,
        'GBP': 0.85,
        'AED': 4.0,
        'AUD': 1.65,
        'RUB': 100.0,
        'CNY': 7.9,
      }

      if (eurRates[from_currency] && eurRates[to_currency]) {
        // Calculate cross rate via EUR
        // Rate = (EUR -> TO) / (EUR -> FROM)
        const rate = eurRates[to_currency] / eurRates[from_currency];
        
        console.log(`Using fallback rate for ${from_currency} -> ${to_currency}: ${rate}`)
        
        return new Response(
          JSON.stringify({
            rate,
            from: from_currency,
            to: to_currency,
            date: new Date().toISOString().split('T')[0],
            converted_amount: amount ? amount * rate : null,
            is_fallback: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      throw new Error('Failed to fetch exchange rate and no fallback available')
    }

    const data = await response.json()
    const rate = data.rates[to_currency]

    if (!rate) {
      throw new Error(`Rate not found for ${to_currency}`)
    }

    console.log(`Exchange rate ${from_currency} -> ${to_currency}: ${rate}`)

    const result: ExchangeRateResponse & { converted_amount?: number } = {
      rate,
      from: from_currency,
      to: to_currency,
      date: data.date,
      converted_amount: amount ? amount * rate : undefined
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-exchange-rate:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get exchange rate'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
