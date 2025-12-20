import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyAdminRequest {
  reservation_id: string
  customer_name: string
  pickup: string
  dropoff: string
  pickup_date: string
  /** When true, also send WhatsApp to admins (defaults to true). */
  send_whatsapp?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to get their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      console.error('Failed to get user:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: NotifyAdminRequest = await req.json()
    const { reservation_id, customer_name, pickup, dropoff, pickup_date, send_whatsapp } = body
    const shouldSendWhatsApp = send_whatsapp !== false

    if (!reservation_id) {
      console.error('No reservation_id provided')
      return new Response(
        JSON.stringify({ error: 'reservation_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the user owns this reservation
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('customer_id, reservation_code')
      .eq('id', reservation_id)
      .maybeSingle()

    if (reservationError) {
      console.error('Error fetching reservation:', reservationError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify reservation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!reservation) {
      console.error('Reservation not found:', reservation_id)
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the authenticated user is the owner of the reservation
    if (reservation.customer_id !== user.id) {
      console.error('User does not own this reservation:', { userId: user.id, customerId: reservation.customer_id })
      return new Response(
        JSON.stringify({ error: 'Forbidden: You can only trigger notifications for your own reservations' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Ownership verified, notifying admins about reservation: ${reservation_id}`)

    // Find all admin users
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (rolesError) {
      console.error('Error finding admins:', rolesError)
      return new Response(
        JSON.stringify({ error: 'Failed to find admins' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log('No admins found to notify')
      return new Response(
        JSON.stringify({ success: true, message: 'No admins to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notifications for all admins
    const notifications = adminRoles.map(admin => ({
      user_id: admin.user_id,
      reservation_id,
      title: 'New Reservation Request',
      message: 'A customer has requested a transfer price.',
      type: 'reservation_created',
      read: false
    }))

    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      console.error('Error creating notifications:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create notifications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Notified ${adminRoles.length} admin(s) about new reservation`)

    // Optional: also send WhatsApp to admins
    let whatsappAttempted = 0
    let whatsappSent = 0
    let whatsappFailed = 0
    let whatsappSkippedNoPhone = 0
    let whatsappSkippedNotConfigured = 0

    if (shouldSendWhatsApp) {
      const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
      const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

      if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
        console.warn('WhatsApp not sent: Twilio credentials not configured')
        whatsappSkippedNotConfigured = adminRoles.length
      } else {
        const adminIds = adminRoles.map(a => a.user_id)

        const { data: adminProfiles, error: adminProfilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, phone')
          .in('id', adminIds)

        if (adminProfilesError) {
          console.error('Failed to fetch admin phones:', adminProfilesError)
          whatsappFailed = adminRoles.length
        } else {
          const phoneByUserId = new Map<string, string>()
          for (const p of adminProfiles || []) {
            if (p?.id && p?.phone) phoneByUserId.set(p.id, p.phone)
          }

          const from = twilioWhatsAppNumber.startsWith('whatsapp:')
            ? twilioWhatsAppNumber
            : `whatsapp:${twilioWhatsAppNumber}`

          const title = 'New Reservation Request'
          const details = [
            `Customer: ${customer_name}`,
            `Date: ${pickup_date}`,
            `Pickup: ${pickup}`,
            `Dropoff: ${dropoff}`,
            reservation?.reservation_code ? `Code: ${reservation.reservation_code}` : null,
          ].filter(Boolean).join('\n')

          const fullMessage = `*${title}*\n\n${details}`

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
          const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

          for (const admin of adminRoles) {
            whatsappAttempted++

            const phoneRaw = phoneByUserId.get(admin.user_id)
            if (!phoneRaw) {
              whatsappSkippedNoPhone++
              console.log(`Skipping WhatsApp: no phone on profile for admin ${admin.user_id}`)
              continue
            }

            const digits = phoneRaw.replace(/[^\d+]/g, '')
            const formattedPhone = digits.startsWith('+') ? digits : `+${digits}`

            const formData = new URLSearchParams()
            formData.append('From', from)
            formData.append('To', `whatsapp:${formattedPhone}`)
            formData.append('Body', fullMessage)

            const twilioResponse = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            })

            const twilioText = await twilioResponse.text()
            let twilioJson: any = null
            try {
              twilioJson = JSON.parse(twilioText)
            } catch {
              // ignore parse failure
            }

            if (!twilioResponse.ok) {
              whatsappFailed++
              console.error('Twilio WhatsApp error:', { status: twilioResponse.status, body: twilioJson || twilioText })
              continue
            }

            whatsappSent++
            console.log('WhatsApp message sent successfully:', twilioJson?.sid)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        admins_notified: adminRoles.length,
        whatsapp: {
          enabled: shouldSendWhatsApp,
          attempted: whatsappAttempted,
          sent: whatsappSent,
          failed: whatsappFailed,
          skipped_no_phone: whatsappSkippedNoPhone,
          skipped_not_configured: whatsappSkippedNotConfigured,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})