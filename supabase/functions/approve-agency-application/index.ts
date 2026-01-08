import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApproveApplicationRequest {
  application_id: string
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

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
        JSON.stringify({ error: 'Only admins can approve agency applications' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: ApproveApplicationRequest = await req.json()
    const { application_id } = body

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: 'application_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Approving agency application: ${application_id}`)

    // Get the application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('agency_applications')
      .select('*')
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      console.error('Error fetching application:', appError)
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (application.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Application is not pending' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === application.email)
    
    let newUserId: string
    
    if (existingUser) {
      console.log(`User already exists with email: ${application.email}, using existing user ID: ${existingUser.id}`)
      newUserId = existingUser.id
      
      // Update the user's password to the one from the application
      const { error: updatePwError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: application.password_hash,
        user_metadata: {
          full_name: application.agency_name
        }
      })
      
      if (updatePwError) {
        console.error('Error updating user password:', updatePwError)
      }
    } else {
      // Create auth user using admin client
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: application.email,
        password: application.password_hash,
        email_confirm: true,
        user_metadata: {
          full_name: application.agency_name
        }
      })

      if (createError) {
        console.error('Error creating auth user:', createError)
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      newUserId = authData.user.id
    }
    console.log(`Auth user created with ID: ${newUserId}`)

    // Update profile with phone
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: application.agency_name, phone: application.phone })
      .eq('id', newUserId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    // Delete the default customer role
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', newUserId)

    // Insert the agency role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUserId, role: 'agency' })

    if (roleInsertError) {
      console.error('Error setting role:', roleInsertError)
      return new Response(
        JSON.stringify({ error: 'User created but failed to set role: ' + roleInsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create agency record
    const { data: newAgency, error: createAgencyError } = await supabaseAdmin
      .from('agencies')
      .insert({
        agency_name: application.agency_name,
        comments: application.comments || null,
        balance: 0,
        user_id: newUserId,
        currency: application.currency || 'EUR'
      })
      .select('id')
      .single()

    if (createAgencyError) {
      console.error('Error creating agency record:', createAgencyError)
      return new Response(
        JSON.stringify({ error: 'User created but failed to create agency: ' + createAgencyError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Agency record created successfully with ID:', newAgency.id)

    // Update application status
    const { error: updateError } = await supabaseAdmin
      .from('agency_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        password_hash: '***CLEARED***' // Clear the plain password for security
      })
      .eq('id', application_id)

    if (updateError) {
      console.error('Error updating application status:', updateError)
    }

    // Send approval email
    const baseUrl = 'https://meettransfer.app'
    
    try {
      await resend.emails.send({
        from: 'Meet Transfer <noreply@mail.meettransfer.app>',
        to: [application.email],
        subject: '✅ Acenta Başvurunuz Onaylandı - Meet Transfer',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">✅ Başvurunuz Onaylandı!</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Meet Transfer acenta programına hoş geldiniz</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <p style="margin: 0; color: #2e7d32; font-weight: bold; font-size: 18px;">Merhaba ${application.contact_name},</p>
                <p style="margin: 10px 0 0; color: #333;">"${application.agency_name}" adlı acenta hesabınız başarıyla oluşturuldu!</p>
              </div>

              <h3 style="color: #111; margin-bottom: 15px;">Giriş Bilgileriniz</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>E-posta</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-family: monospace;">${application.email}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Şifre</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">Başvuru sırasında belirlediğiniz şifre</td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${baseUrl}/login" style="display: inline-block; background: #fdd835; color: #111; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Giriş Yap</a>
              </div>

              <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                <h4 style="color: #111; margin: 0 0 10px;">Acenta Panelinden Yapabilecekleriniz:</h4>
                <ul style="color: #666; margin: 0; padding-left: 20px;">
                  <li>Yeni transfer rezervasyonları oluşturun</li>
                  <li>Tüm rezervasyonlarınızı takip edin</li>
                  <li>Müşteri bilgilerini yönetin</li>
                  <li>Kazanç raporlarınızı görüntüleyin</li>
                </ul>
              </div>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>Sorularınız için bizimle iletişime geçin.</p>
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      })
      console.log('Approval email sent successfully')
    } catch (emailError) {
      console.error('Error sending approval email:', emailError)
      // Don't fail the whole operation if email fails
    }

    // Create audit log
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    const user_agent = req.headers.get('user-agent') || 'unknown'
    
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        action: 'APPROVE_AGENCY_APPLICATION',
        table_name: 'agency_applications',
        record_id: application_id,
        new_data: {
          agency_name: application.agency_name,
          email: application.email,
          agency_id: newAgency.id,
          user_id: newUserId,
        },
        ip_address,
        user_agent,
      })

    console.log(`Agency application approved successfully for: ${application.email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agency application approved successfully',
        agency_id: newAgency.id,
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
