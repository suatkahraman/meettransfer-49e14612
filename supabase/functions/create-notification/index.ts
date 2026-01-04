import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateNotificationRequest {
  // snake_case (preferred)
  user_id?: string
  reservation_id?: string
  notify_admins?: boolean
  send_push?: boolean
  send_whatsapp?: boolean

  // camelCase (backwards-compatible)
  userId?: string
  reservationId?: string
  notifyAdmins?: boolean
  sendPush?: boolean
  sendWhatsapp?: boolean

  title: string
  message: string
  type: string
}

function normalizeRequest(raw: CreateNotificationRequest) {
  const user_id = raw.user_id ?? raw.userId
  const reservation_id = raw.reservation_id ?? raw.reservationId
  const notify_admins = raw.notify_admins ?? raw.notifyAdmins
  const send_push = raw.send_push ?? raw.sendPush
  const send_whatsapp = raw.send_whatsapp ?? raw.sendWhatsapp

  return {
    user_id,
    reservation_id,
    notify_admins,
    send_push,
    send_whatsapp,
    title: raw.title,
    message: raw.message,
    type: raw.type,
  }
}

async function sendPushToUser(
  supabaseAdmin: any,
  userId: string,
  title: string,
  message: string,
  url?: string,
) {
  try {
    console.log(`Sending push notification to user ${userId}`)

    const { data, error } = await supabaseAdmin.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title,
        body: message,
        url: url || '/',
      },
    })

    if (error) {
      console.error('Push notification invoke failed:', error)
      return
    }

    console.log('Push invoke result:', data)
  } catch (error) {
    console.error('Error sending push notification:', error)
  }
}

async function sendWhatsAppToUser(supabaseAdmin: any, userId: string, title: string, message: string) {
  try {
    console.log(`Sending WhatsApp message to user ${userId}`)

    const { data, error } = await supabaseAdmin.functions.invoke('send-whatsapp', {
      body: {
        user_id: userId,
        title,
        message,
      },
    })

    if (error) {
      console.error('WhatsApp invoke failed:', error)
      return
    }

    console.log('WhatsApp invoke result:', data)
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const raw: CreateNotificationRequest = await req.json()
    const { user_id, reservation_id, title, message, type, notify_admins, send_push, send_whatsapp } =
      normalizeRequest(raw)

    // If notify_admins is true, send notification to all admin users
    if (notify_admins) {
      console.log(`User ${user.id} sending notification to all admins: ${title}`)

      const { data: adminRoles, error: adminError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')

      if (adminError) {
        console.error('Error fetching admin users:', adminError)
        return new Response(JSON.stringify({ error: 'Failed to fetch admin users' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!adminRoles || adminRoles.length === 0) {
        console.warn('No admin users found')
        return new Response(JSON.stringify({ success: true, message: 'No admin users to notify' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const notifications = adminRoles.map((admin) => ({
        user_id: admin.user_id,
        reservation_id: reservation_id || null,
        title,
        message,
        type,
        read: false,
      }))

      const { data, error } = await supabaseAdmin.from('notifications').insert(notifications).select()

      if (error) {
        console.error('Error creating notifications:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`Created ${data.length} notifications for admins`)

      // Default to push ON unless explicitly disabled
      if (send_push !== false) {
        console.log('Sending push notifications to all admins...')
        for (const admin of adminRoles) {
          await sendPushToUser(
            supabaseAdmin,
            admin.user_id,
            title,
            message,
            reservation_id ? `/admin/reservations/${reservation_id}` : '/admin/reservations',
          )
        }
      }

      if (send_whatsapp) {
        for (const admin of adminRoles) {
          await sendWhatsAppToUser(supabaseAdmin, admin.user_id, title, message)
        }
      }

      return new Response(JSON.stringify({ success: true, notifications: data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required when notify_admins is false' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Direct user notifications require admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      console.warn(`Non-admin user ${user.id} attempted to create direct notification`)
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required for direct notifications' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Admin ${user.id} creating notification for user ${user_id}: ${title}`)

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        reservation_id: reservation_id || null,
        title,
        message,
        type,
        read: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Notification created successfully:', data.id)

    // Default to push ON unless explicitly disabled
    if (send_push !== false) {
      const urlPath = reservation_id ? `/admin/reservations/${reservation_id}` : '/'
      await sendPushToUser(supabaseAdmin, user_id, title, message, urlPath)
    }

    return new Response(JSON.stringify({ success: true, notification: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
