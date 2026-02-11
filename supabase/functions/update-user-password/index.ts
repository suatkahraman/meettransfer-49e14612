import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdatePasswordRequest {
  user_id?: string
  new_password?: string
}

function jsonResponse(body: { success: boolean; message?: string; error?: string }) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return jsonResponse({ success: false, error: 'Unauthorized' })
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return jsonResponse({ success: false, error: 'Unauthorized' })
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      console.error('Role check failed:', roleError)
      return jsonResponse({ success: false, error: 'Only admins can update user passwords' })
    }

    let body: UpdatePasswordRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ success: false, error: 'Invalid request body' })
    }

    const user_id = body?.user_id
    const new_password = body?.new_password

    if (!user_id || !new_password) {
      return jsonResponse({ success: false, error: 'Missing required fields: user_id, new_password' })
    }

    if (new_password.length < 6) {
      return jsonResponse({ success: false, error: 'Şifre en az 6 karakter olmalıdır' })
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: new_password,
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      let errMsg = updateError.message
      if (updateError.message?.toLowerCase().includes('weak') || updateError.message?.toLowerCase().includes('easy to guess')) {
        errMsg = 'Şifre çok zayıf. En az 6 karakter, büyük/küçük harf ve rakam içeren daha güçlü bir şifre kullanın (örn: Sofor2024!).'
      } else if (updateError.message?.toLowerCase().includes('pwned') || updateError.message?.toLowerCase().includes('breach')) {
        errMsg = 'Bu şifre veri ihlallerinde bulundu. Daha benzersiz bir şifre seçin.'
      }
      return jsonResponse({ success: false, error: errMsg })
    }

    try {
      const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
      const user_agent = req.headers.get('user-agent') || 'unknown'
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action: 'UPDATE_PASSWORD',
        table_name: 'auth.users',
        record_id: user_id,
        new_data: { password_changed: true },
        ip_address,
        user_agent,
      })
    } catch (auditErr) {
      console.error('Audit log insert failed (password was updated):', auditErr)
    }

    console.log(`Password updated successfully for user: ${user_id}`)
    return jsonResponse({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return jsonResponse({ success: false, error: 'Internal server error' })
  }
})
