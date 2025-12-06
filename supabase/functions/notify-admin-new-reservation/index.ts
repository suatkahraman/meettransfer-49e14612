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

    const body: NotifyAdminRequest = await req.json()
    const { reservation_id, customer_name, pickup, dropoff, pickup_date } = body

    console.log(`Notifying admins about new reservation: ${reservation_id}`)

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
      title: 'New Reservation Received',
      message: `New booking from ${customer_name} – ${pickup} to ${dropoff} on ${pickup_date}.`,
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

    return new Response(
      JSON.stringify({ success: true, admins_notified: adminRoles.length }),
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