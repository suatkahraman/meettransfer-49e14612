import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  role: 'admin' | 'driver' | 'customer'
  name: string
  phone: string
  region?: string
  commission_rate?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create regular client for auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the calling user is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if calling user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      console.error('Role check failed:', roleError)
      return new Response(
        JSON.stringify({ error: 'Only admins can create user accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: CreateUserRequest = await req.json()
    const { email, password, role, name, phone, region, commission_rate } = body

    console.log(`Creating ${role} account for: ${email}`)

    // Validate required fields
    if (!email || !password || !role || !name || !phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, role, name, phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    if (!['admin', 'driver', 'customer'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin, driver, or customer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create auth user using admin client
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: name
      }
    })

    if (createError) {
      console.error('Error creating auth user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = authData.user.id
    console.log(`Auth user created with ID: ${newUserId}`)

    // Update profile with phone
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: name, phone })
      .eq('id', newUserId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Continue anyway, profile may have been created by trigger
    }

    // Update role (trigger creates customer role by default)
    if (role !== 'customer') {
      // Delete the default customer role
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', newUserId)

      // Insert the correct role
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUserId, role })

      if (roleInsertError) {
        console.error('Error setting role:', roleInsertError)
        return new Response(
          JSON.stringify({ error: 'User created but failed to set role: ' + roleInsertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // If driver, create driver record
    if (role === 'driver') {
      const { error: driverError } = await supabaseAdmin
        .from('drivers')
        .insert({
          user_id: newUserId,
          name,
          phone,
          region: region || null,
          commission_rate: commission_rate || 10.00,
          active: true
        })

      if (driverError) {
        console.error('Error creating driver record:', driverError)
        return new Response(
          JSON.stringify({ error: 'User created but failed to create driver record: ' + driverError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Driver record created successfully')
    }

    // Server-side audit log for user creation
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    const user_agent = req.headers.get('user-agent') || 'unknown'
    
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        action: 'CREATE_USER',
        table_name: role === 'driver' ? 'drivers' : 'user_roles',
        record_id: newUserId,
        new_data: {
          email,
          name,
          phone,
          role,
          region: region || null,
          commission_rate: commission_rate || null,
        },
        ip_address,
        user_agent,
      })

    console.log(`${role} account created successfully for: ${email}`)
    console.log(`Audit log created for user creation by ${user.email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
        user_id: newUserId 
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