import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  userId: string;
  email: string;
  role: string;
  language?: string;
}

// Rate limiting: max 5 OTP requests per email per 10 minutes
const otpRateLimit = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (email: string): { allowed: boolean; remaining: number; resetIn: number } => {
  const now = Date.now();
  const limit = otpRateLimit.get(email);
  const maxRequests = 5;
  const windowMs = 600000; // 10 minutes
  
  if (!limit || now > limit.resetAt) {
    otpRateLimit.set(email, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }
  
  if (limit.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: limit.resetAt - now };
  }
  
  limit.count++;
  return { allowed: true, remaining: maxRequests - limit.count, resetIn: limit.resetAt - now };
};

const getEmailContent = (otp: string, role: string, language: string = 'en') => {
  const roleLabels: Record<string, Record<string, string>> = {
    admin: { tr: 'Yönetici', en: 'Admin' },
    agency: { tr: 'Acenta', en: 'Agency' },
    driver: { tr: 'Şoför', en: 'Driver' },
    customer: { tr: 'Müşteri', en: 'Customer' },
  };
  
  const roleLabel = roleLabels[role]?.[language] || roleLabels[role]?.['en'] || role;
  
  // OTP code formatted with spaces for readability
  const formattedOtp = otp.slice(0, 3) + ' ' + otp.slice(3);
  
  if (language === 'tr') {
    return {
      subject: `${otp} - Meet Transfer Doğrulama Kodunuz`,
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Doğrulama Kodu</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 48px 40px;">
                      <!-- Header -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px; text-align: center; vertical-align: middle;">
                                  <span style="font-size: 32px; line-height: 64px;">🔐</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom: 8px;">
                            <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
                              Güvenlik Doğrulaması
                            </h1>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom: 32px;">
                            <p style="color: #64748b; font-size: 15px; margin: 0; line-height: 1.6;">
                              ${roleLabel} paneline giriş için tek kullanımlık doğrulama kodunuz
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- OTP Code -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="padding: 24px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px;">
                              <tr>
                                <td style="padding: 24px 40px;">
                                  <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #0f172a; font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;">
                                    ${otp}
                                  </span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Warning -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="padding: 24px 0;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0;">
                              <tr>
                                <td style="padding: 16px;">
                                  <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                                    ⏱️ Bu kod <strong>5 dakika</strong> içinde geçerliliğini yitirecektir. Kodu kimseyle paylaşmayın.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Security Notice -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="padding-top: 16px;">
                            <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.6;">
                              Bu girişi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin ve hesabınızın güvenliği için şifrenizi değiştirin.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                              Meet Transfer • Güvenli VIP Transfer Hizmetleri
                            </p>
                            <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0 0;">
                              Bu otomatik bir güvenlik bildirimidir.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  }
  
  return {
    subject: `${otp} - Your Meet Transfer Verification Code`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Verification Code</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 48px 40px;">
                    <!-- Header -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 32px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px; text-align: center; vertical-align: middle;">
                                <span style="font-size: 32px; line-height: 64px;">🔐</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 8px;">
                          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
                            Security Verification
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 32px;">
                          <p style="color: #64748b; font-size: 15px; margin: 0; line-height: 1.6;">
                            Your one-time verification code for ${roleLabel} panel login
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- OTP Code -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding: 24px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px;">
                            <tr>
                              <td style="padding: 24px 40px;">
                                <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #0f172a; font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;">
                                  ${otp}
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Warning -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 24px 0;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0;">
                            <tr>
                              <td style="padding: 16px;">
                                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                                  ⏱️ This code expires in <strong>5 minutes</strong>. Never share this code with anyone.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Security Notice -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-top: 16px;">
                          <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.6;">
                            If you didn't request this login, please ignore this email and consider changing your password for security.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center">
                          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            Meet Transfer • Premium VIP Transfer Services
                          </p>
                          <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0 0;">
                            This is an automated security notification.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

// Send email using Resend API with fetch for better control
async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  // Use Resend's default sender for development, or verified domain for production
  const fromEmail = "Meet Transfer <onboarding@resend.dev>";
  
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      return { success: false, error: data.message || "Email sending failed" };
    }

    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error("Email fetch error:", error);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { userId, email, role, language = 'tr' }: OTPRequest = body;

    // Validate required fields
    if (!userId || !email || !role) {
      console.error("Missing required fields:", { userId: !!userId, email: !!email, role: !!role });
      return new Response(
        JSON.stringify({ success: false, error: "missing_fields", message: "Eksik alanlar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_email", message: "Geçersiz email formatı" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role
    const validRoles = ['admin', 'agency', 'driver', 'customer'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_role", message: "Geçersiz rol" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      const waitMinutes = Math.ceil(rateLimit.resetIn / 60000);
      console.warn(`Rate limit exceeded for email: ${email}, reset in ${waitMinutes} minutes`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "rate_limit", 
          message: language === 'tr' 
            ? `Çok fazla istek. ${waitMinutes} dakika bekleyin.`
            : `Too many requests. Please wait ${waitMinutes} minutes.`,
          resetIn: rateLimit.resetIn
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client info for logging
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Generate OTP using the database function
    const { data: otp, error: otpError } = await supabase.rpc('generate_otp', {
      p_user_id: userId,
      p_email: email,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    });

    if (otpError) {
      console.error("OTP generation error:", otpError);
      return new Response(
        JSON.stringify({ success: false, error: "otp_generation_failed", message: "Kod oluşturulamadı" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otp) {
      console.error("OTP generation returned null");
      return new Response(
        JSON.stringify({ success: false, error: "otp_generation_failed", message: "Kod oluşturulamadı" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email content based on language and role
    const emailContent = getEmailContent(otp, role, language);

    // Send OTP via email
    const emailResult = await sendEmail(email, emailContent.subject, emailContent.html);

    if (!emailResult.success) {
      console.error("Email sending failed:", emailResult.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "email_failed", 
          message: language === 'tr' 
            ? "Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin."
            : "Failed to send verification code. Please try again."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`2FA OTP sent successfully: ${email} (role: ${role}, messageId: ${emailResult.messageId}, duration: ${duration}ms)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: language === 'tr' ? "Doğrulama kodu gönderildi" : "Verification code sent",
        remaining: rateLimit.remaining
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-2fa-otp function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "internal_error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
