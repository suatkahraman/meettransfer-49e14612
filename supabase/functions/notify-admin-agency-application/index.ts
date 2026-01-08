import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyAdminRequest {
  agency_name: string
  contact_name: string
  email: string
  phone: string
  currency: string
  comments?: string
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: NotifyAdminRequest = await req.json()
    const { agency_name, contact_name, email, phone, currency, comments } = body

    console.log('Sending notification email to admin for new agency application:', agency_name)

    const adminEmail = 'sautkahraman@gmail.com'

    const emailResponse = await resend.emails.send({
      from: 'Meet Transfer <info@meettransfer.app>',
      to: [adminEmail],
      subject: `🏢 Yeni Acenta Başvurusu: ${agency_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">🏢 Yeni Acenta Başvurusu</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">İncelemenizi bekliyor</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin: 0; color: #1565c0; font-weight: bold; font-size: 18px;">${agency_name}</p>
              <p style="margin: 5px 0 0; color: #666;">Yeni acenta başvurusu aldınız</p>
            </div>

            <h3 style="color: #111; margin-bottom: 15px; border-bottom: 2px solid #2196f3; padding-bottom: 10px;">Başvuru Detayları</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Acenta Adı</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${agency_name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Yetkili Kişi</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${contact_name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>E-posta</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color: #2196f3;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Telefon</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><a href="tel:${phone}" style="color: #2196f3;">${phone}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Para Birimi</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${currency}</td>
              </tr>
              ${comments ? `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; vertical-align: top;"><strong>Notlar</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${comments}</td>
              </tr>
              ` : ''}
            </table>

            <div style="text-align: center; margin-top: 25px;">
              <a href="https://meettransfer.app/admin/agency-applications" style="display: inline-block; background: #fdd835; color: #111; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Başvuruyu İncele</a>
            </div>

            <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
              <p>Bu e-posta, yeni acenta başvurusu alındığında otomatik olarak gönderilmektedir.</p>
              <p>© 2025 Meet Transfer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    console.log('Admin notification email sent successfully:', emailResponse)

    return new Response(
      JSON.stringify({ success: true, message: 'Admin notification sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error sending admin notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
