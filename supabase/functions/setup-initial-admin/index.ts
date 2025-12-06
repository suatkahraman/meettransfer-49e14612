import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SetupAdminRequest {
  email: string
  password: string
  name: string
  phone: string
  setupKey: string
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

    const body: SetupAdminRequest = await req.json()
    const { email, password, name, phone, setupKey } = body

    // Simple setup key validation - change this to a more secure method in production
    // This prevents random people from creating admin accounts
    if (setupKey !== 'MEET_TRANSFER_SETUP_2025') {
      console.error('Invalid setup key provided')
      return new Response(
        JSON.stringify({ error: 'Invalid setup key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Setting up initial admin account...')

    // Check if any admin already exists
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (checkError) {
      console.error('Error checking existing admins:', checkError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing admins' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingAdmins && existingAdmins.length > 0) {
      console.log('Admin already exists, skipping creation')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'An admin account already exists. Please login with existing admin credentials.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    if (!email || !password || !name || !phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, name, phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create auth user using admin client
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
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
    console.log(`Admin auth user created with ID: ${newUserId}`)

    // Update profile with phone
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: name, phone })
      .eq('id', newUserId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    // Delete the default customer role created by trigger
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', newUserId)

    // Insert admin role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUserId, role: 'admin' })

    if (roleInsertError) {
      console.error('Error setting admin role:', roleInsertError)
      return new Response(
        JSON.stringify({ error: 'User created but failed to set admin role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin account created successfully!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin account created successfully! You can now login.',
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