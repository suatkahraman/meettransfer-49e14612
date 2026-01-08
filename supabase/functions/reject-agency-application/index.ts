import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RejectApplicationRequest {
  application_id: string
  rejection_reason?: string
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
        JSON.stringify({ error: 'Only admins can reject agency applications' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: RejectApplicationRequest = await req.json()
    const { application_id, rejection_reason } = body

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: 'application_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Rejecting agency application: ${application_id}`)

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

    // Update application status
    const { error: updateError } = await supabaseAdmin
      .from('agency_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        comments: rejection_reason ? `Red Nedeni: ${rejection_reason}` : application.comments,
        password_hash: '***CLEARED***' // Clear the plain password for security
      })
      .eq('id', application_id)

    if (updateError) {
      console.error('Error updating application status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update application status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send rejection email
    try {
      await resend.emails.send({
        from: 'Meet Transfer <info@meettransfer.app>',
        to: [application.email],
        subject: '❌ Acenta Başvurunuz Hakkında - Meet Transfer',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">Başvurunuz Değerlendirildi</h1>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #333; font-size: 16px;">Merhaba ${application.contact_name},</p>
              
              <p style="color: #666;">
                "${application.agency_name}" adlı acenta başvurunuz değerlendirilmiş olup, 
                maalesef bu aşamada onaylanamamıştır.
              </p>

              ${rejection_reason ? `
              <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                <p style="margin: 0; color: #e65100; font-weight: bold;">Değerlendirme Notu:</p>
                <p style="margin: 10px 0 0; color: #333;">${rejection_reason}</p>
              </div>
              ` : ''}

              <p style="color: #666;">
                Sorularınız veya yeni bir başvuru için bizimle iletişime geçebilirsiniz.
              </p>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      })
      console.log('Rejection email sent successfully')
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError)
    }

    // Create audit log
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    const user_agent = req.headers.get('user-agent') || 'unknown'
    
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        action: 'REJECT_AGENCY_APPLICATION',
        table_name: 'agency_applications',
        record_id: application_id,
        new_data: {
          agency_name: application.agency_name,
          email: application.email,
          rejection_reason,
        },
        ip_address,
        user_agent,
      })

    console.log(`Agency application rejected for: ${application.email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agency application rejected successfully'
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
