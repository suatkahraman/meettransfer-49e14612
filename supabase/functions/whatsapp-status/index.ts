import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppStatusRequest {
  reservation_id: string
  message_sid: string
}

const maskPhone = (value: string) => {
  const s = value.replace(/[^\d+]/g, '')
  if (s.length <= 7) return s
  return `${s.slice(0, 4)}***${s.slice(-4)}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: WhatsAppStatusRequest = await req.json()
    const reservationId = body?.reservation_id
    const messageSid = String(body?.message_sid ?? '').trim()

    if (!reservationId || !messageSid) {
      return new Response(JSON.stringify({ error: 'reservation_id and message_sid are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Allow reservation owner OR admin to check status
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('customer_id, reservation_code')
      .eq('id', reservationId)
      .maybeSingle()

    if (reservationError || !reservation) {
      return new Response(JSON.stringify({ error: 'Reservation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let isAdmin = false
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    isAdmin = !!adminRole

    if (!isAdmin && reservation.customer_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')?.trim()
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')?.trim()

    if (!twilioAccountSid || !twilioAuthToken) {
      return new Response(JSON.stringify({ error: 'Twilio credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
    const checkUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages/${encodeURIComponent(messageSid)}.json`

    const checkResp = await fetch(checkUrl, {
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    })

    const text = await checkResp.text()
    let json: any = null
    try {
      json = JSON.parse(text)
    } catch {
      // ignore
    }

    if (!checkResp.ok) {
      console.error('Twilio status check failed:', { status: checkResp.status, body: json || text })
      return new Response(JSON.stringify({ error: 'Twilio status check failed', details: json || text }), {
        status: checkResp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = {
      reservation_id: reservationId,
      reservation_code: reservation.reservation_code,
      sid: json?.sid,
      status: json?.status,
      error_code: json?.error_code ?? null,
      error_message: json?.error_message ?? null,
      from: json?.from ? maskPhone(String(json.from)) : null,
      to: json?.to ? maskPhone(String(json.to)) : null,
      date_created: json?.date_created ?? null,
      date_updated: json?.date_updated ?? null,
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in whatsapp-status:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
