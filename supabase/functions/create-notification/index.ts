import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateNotificationRequest {
  user_id?: string
  reservation_id?: string
  title: string
  message: string
  type: string
  notify_admins?: boolean
  send_push?: boolean
}

async function sendPushToUser(supabase: any, userId: string, title: string, body: string, url?: string) {
  try {
    console.log(`Attempting to send push notification to user ${userId}`);
    
    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError) {
      console.error('Error fetching push subscriptions:', subError);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    console.log(`Found ${subscriptions.length} push subscription(s) for user ${userId}`);

    // Trigger push notification function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        title,
        body,
        url: url || '/',
      }),
    });

    if (!pushResponse.ok) {
      const errorText = await pushResponse.text();
      console.error('Push notification request failed:', errorText);
    } else {
      console.log('Push notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
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
        persistSession: false
      }
    })

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: CreateNotificationRequest = await req.json()
    const { user_id, reservation_id, title, message, type, notify_admins, send_push } = body

    // If notify_admins is true, send notification to all admin users
    if (notify_admins) {
      console.log(`User ${user.id} sending notification to all admins: ${title}`)

      // Get all admin user IDs
      const { data: adminRoles, error: adminError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')

      if (adminError) {
        console.error('Error fetching admin users:', adminError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch admin users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!adminRoles || adminRoles.length === 0) {
        console.warn('No admin users found')
        return new Response(
          JSON.stringify({ success: true, message: 'No admin users to notify' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create notifications for all admins
      const notifications = adminRoles.map(admin => ({
        user_id: admin.user_id,
        reservation_id: reservation_id || null,
        title,
        message,
        type,
        read: false
      }))

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)
        .select()

      if (error) {
        console.error('Error creating notifications:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Created ${data.length} notifications for admins`)

      // Send push notifications to all admins
      for (const admin of adminRoles) {
        await sendPushToUser(supabaseAdmin, admin.user_id, title, message, reservation_id ? `/admin/reservations/${reservation_id}` : '/admin/reservations');
      }

      return new Response(
        JSON.stringify({ success: true, notifications: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For direct user_id notifications, check if caller is admin OR is the reservation customer
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required when notify_admins is false' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      console.warn(`Non-admin user ${user.id} attempted to create direct notification`)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin role required for direct notifications' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Admin ${user.id} creating notification for user ${user_id}: ${title}`)

    // Create the notification using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        reservation_id: reservation_id || null,
        title,
        message,
        type,
        read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Notification created successfully:', data.id)

    // Send push notification if requested or by default for direct notifications
    if (send_push !== false) {
      const urlPath = reservation_id 
        ? (roleData ? `/admin/reservations/${reservation_id}` : `/customer/reservation/${reservation_id}`)
        : '/';
      await sendPushToUser(supabaseAdmin, user_id, title, message, urlPath);
    }

    return new Response(
      JSON.stringify({ success: true, notification: data }),
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
