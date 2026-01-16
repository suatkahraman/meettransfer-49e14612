import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

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

const normalizeE164 = (raw: string) => {
  const s = String(raw ?? '').trim().replace(/^whatsapp:/i, '')
  const only = s.replace(/[^\d+]/g, '')
  if (!only) return ''
  return only.startsWith('+') ? only : `+${only}`
}

const maskPhone = (e164: string) => {
  const s = e164.replace(/[^\d+]/g, '')
  if (s.length <= 7) return s
  return `${s.slice(0, 4)}***${s.slice(-4)}`
}

const safeJson = async (res: Response) => {
  const text = await res.text()
  try {
    return { json: JSON.parse(text), text }
  } catch {
    return { json: null, text }
  }
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create client with user's token to get their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      console.error('Failed to get user:', userError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: NotifyAdminRequest = await req.json()
    const { reservation_id, customer_name, pickup, dropoff, pickup_date, send_whatsapp } = body
    const shouldSendWhatsApp = send_whatsapp !== false

    if (!reservation_id) {
      return new Response(JSON.stringify({ error: 'reservation_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify the user owns this reservation
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('customer_id, reservation_code')
      .eq('id', reservation_id)
      .maybeSingle()

    if (reservationError) {
      console.error('Error fetching reservation:', reservationError)
      return new Response(JSON.stringify({ error: 'Failed to verify reservation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!reservation) {
      return new Response(JSON.stringify({ error: 'Reservation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (reservation.customer_id !== user.id) {
      console.error('User does not own this reservation:', { userId: user.id, customerId: reservation.customer_id })
      return new Response(JSON.stringify({ error: 'Forbidden: You can only trigger notifications for your own reservations' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find all admin users
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (rolesError) {
      console.error('Error finding admins:', rolesError)
      return new Response(JSON.stringify({ error: 'Failed to find admins' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No admins to notify' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create in-app notifications for all admins
    const notifications = adminRoles.map((admin) => ({
      user_id: admin.user_id,
      reservation_id,
      title: 'New Reservation Request',
      message: 'A customer has requested a transfer price.',
      type: 'reservation_created',
      read: false,
    }))

    const { error: insertError } = await supabaseAdmin.from('notifications').insert(notifications)
    if (insertError) {
      console.error('Error creating notifications:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create notifications' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // WhatsApp attempt summary
    let whatsappAttempted = 0
    let whatsappSent = 0
    let whatsappFailed = 0
    let whatsappSkippedNoPhone = 0
    let whatsappSkippedNotConfigured = 0

    let whatsappSender: string | null = null
    const whatsappErrors: Array<{ user_id: string; status: number; code?: number; message?: string }> = []
    const whatsappResults: Array<{
      user_id: string
      to_masked: string
      sid?: string
      status?: string
      status_after?: string
      error_code?: number
      error_message?: string
    }> = []

    if (shouldSendWhatsApp) {
      const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')?.trim()
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')?.trim()
      const twilioWhatsAppNumberRaw = Deno.env.get('TWILIO_WHATSAPP_NUMBER')?.trim()

      const fromE164 = twilioWhatsAppNumberRaw ? normalizeE164(twilioWhatsAppNumberRaw) : ''

      if (!twilioAccountSid || !twilioAuthToken || !fromE164) {
        console.warn('WhatsApp not sent: Twilio credentials not configured')
        whatsappSkippedNotConfigured = adminRoles.length
      } else {
        whatsappSender = `whatsapp:${fromE164}`

        const adminIds = adminRoles.map((a) => a.user_id)
        const { data: adminProfiles, error: adminProfilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, phone')
          .in('id', adminIds)

        if (adminProfilesError) {
          console.error('Failed to fetch admin phones:', adminProfilesError)
          whatsappFailed = adminRoles.length
          whatsappErrors.push({ user_id: 'ALL', status: 500, message: 'Failed to fetch admin phones' })
        } else {
          const phoneByUserId = new Map<string, string>()
          for (const p of adminProfiles || []) {
            if (p?.id && p?.phone) phoneByUserId.set(p.id, p.phone)
          }

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
              continue
            }

            const toE164 = normalizeE164(phoneRaw)
            const toMasked = maskPhone(toE164)

            const formData = new URLSearchParams()
            formData.append('From', whatsappSender)
            formData.append('To', `whatsapp:${toE164}`)
            formData.append('Body', fullMessage)

            const sendResp = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            })

            const { json: sendJson, text: sendText } = await safeJson(sendResp)

            if (!sendResp.ok) {
              whatsappFailed++
              whatsappErrors.push({
                user_id: admin.user_id,
                status: sendResp.status,
                code: sendJson?.code,
                message: sendJson?.message || sendText?.slice(0, 300) || 'Failed to send',
              })
              continue
            }

            whatsappSent++
            const sid = sendJson?.sid as string | undefined
            const status = sendJson?.status as string | undefined

            // Best-effort: re-check status shortly after queueing (detect sandbox / invalid recipient errors)
            let statusAfter: string | undefined
            let errorCode: number | undefined
            let errorMessage: string | undefined

            if (sid) {
              try {
                await new Promise((r) => setTimeout(r, 1500))
                const checkUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages/${sid}.json`
                const checkResp = await fetch(checkUrl, {
                  method: 'GET',
                  headers: { Authorization: `Basic ${credentials}` },
                })
                if (checkResp.ok) {
                  const checkJson: any = await checkResp.json()
                  statusAfter = checkJson?.status
                  errorCode = checkJson?.error_code ?? undefined
                  errorMessage = checkJson?.error_message ?? undefined
                }
              } catch (e) {
                console.warn('Twilio status re-check failed:', String(e))
              }
            }

            if (statusAfter === 'failed' || statusAfter === 'undelivered') {
              whatsappFailed++
              whatsappErrors.push({
                user_id: admin.user_id,
                status: 200,
                code: errorCode,
                message: errorMessage || `Twilio status: ${statusAfter}`,
              })
            }

            whatsappResults.push({
              user_id: admin.user_id,
              to_masked: toMasked,
              sid,
              status,
              status_after: statusAfter,
              error_code: errorCode,
              error_message: errorMessage,
            })
          }
        }
      }
    }

    // Persist attempt summary (so we can debug even without edge logs)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_admin_notify',
        table_name: 'reservations',
        record_id: reservation_id,
        user_id: user.id,
        user_agent: req.headers.get('user-agent'),
        ip_address: req.headers.get('x-forwarded-for'),
        new_data: {
          reservation_code: reservation?.reservation_code,
          whatsapp: {
            enabled: shouldSendWhatsApp,
            sender: whatsappSender,
            attempted: whatsappAttempted,
            sent: whatsappSent,
            failed: whatsappFailed,
            skipped_no_phone: whatsappSkippedNoPhone,
            skipped_not_configured: whatsappSkippedNotConfigured,
            results: whatsappResults,
            errors: whatsappErrors,
          },
        },
      })
    } catch (e) {
      console.warn('Failed to write audit log for WhatsApp attempt:', String(e))
    }

    // Send email notification to admin
    let emailSent = false
    let emailError: string | null = null
    
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      const adminEmail = Deno.env.get('ADMIN') || 'sautkahraman@gmail.com'
      
      if (resendApiKey) {
        const resend = new Resend(resendApiKey)
        
        const vehicleLabels: Record<string, string> = {
          'mercedes-vito': 'Mercedes Vito',
          'mercedes-vclass': 'VIP Mercedes Vito',
          'vip-mercedes': 'VIP Mercedes Vito',
          'maybach': 'Mercedes Maybach Minivan',
          'maybach-minibus': 'Mercedes Maybach Minivan',
          'minibus': 'Minibus',
        }
        
        // Fetch full reservation details for email
        const { data: fullReservation } = await supabaseAdmin
          .from('reservations')
          .select('*')
          .eq('id', reservation_id)
          .single()
        
        const vehicleType = fullReservation?.vehicle_type || 'Unknown'
        const vehicleLabel = vehicleLabels[vehicleType] || vehicleType
        const flightNumber = fullReservation?.flight_number || '-'
        const passengerPhone = fullReservation?.customer_phone || '-'
        const paymentType = fullReservation?.payment_type === 'cash' ? 'Cash to Driver' : 'Online Payment'
        const passengerNames = fullReservation?.passenger_names?.join(', ') || customer_name
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">🚗 New Price Request</h1>
              <p style="margin: 10px 0 0 0;">Customer Reservation Request</p>
            </div>
            
            <div style="padding: 20px; background-color: #f8f9fa;">
              <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <h2 style="color: #1a365d; margin-top: 0;">📍 Transfer Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Reservation Code:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${reservation?.reservation_code || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Pickup:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${pickup}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Dropoff:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${dropoff}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Date:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${pickup_date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Time:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${fullReservation?.pickup_time || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Vehicle:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${vehicleLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Flight Number:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${flightNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Payment Type:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${paymentType}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: white; border-radius: 8px; padding: 20px;">
                <h2 style="color: #1a365d; margin-top: 0;">👤 Customer Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Name:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${customer_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">All Passengers:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${passengerNames}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Phone:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${passengerPhone}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <p style="color: #666; font-size: 14px;">
                  Please set a price for this reservation in the admin panel.
                </p>
              </div>
            </div>
            
            <div style="background-color: #1a365d; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">Meet Transfer - Customer Price Request Notification</p>
            </div>
          </div>
        `
        
        const { error: sendError } = await resend.emails.send({
          from: 'Meet Transfer <noreply@mail.meettransfer.app>',
          to: [adminEmail],
          subject: `🚗 New Price Request - ${customer_name} (${pickup_date})`,
          html: emailHtml,
        })
        
        if (sendError) {
          console.error('Email send error:', sendError)
          emailError = sendError.message || 'Failed to send email'
        } else {
          emailSent = true
          console.log('Email notification sent to:', adminEmail)
        }
      } else {
        console.warn('RESEND_API_KEY not configured, skipping email notification')
        emailError = 'RESEND_API_KEY not configured'
      }
    } catch (e) {
      console.error('Email notification error:', e)
      emailError = String(e)
    }

    return new Response(
      JSON.stringify({
        success: true,
        admins_notified: adminRoles.length,
        email: {
          sent: emailSent,
          error: emailError,
        },
        whatsapp: {
          enabled: shouldSendWhatsApp,
          attempted: whatsappAttempted,
          sent: whatsappSent,
          failed: whatsappFailed,
          skipped_no_phone: whatsappSkippedNoPhone,
          skipped_not_configured: whatsappSkippedNotConfigured,
          sender: whatsappSender,
          results: whatsappResults.slice(0, 3),
          errors: whatsappErrors.slice(0, 3),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
