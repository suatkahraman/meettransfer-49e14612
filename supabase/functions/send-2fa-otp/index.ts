import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const checkRateLimit = (email: string): boolean => {
  const now = Date.now();
  const limit = otpRateLimit.get(email);
  
  if (!limit || now > limit.resetAt) {
    otpRateLimit.set(email, { count: 1, resetAt: now + 600000 }); // 10 minutes
    return true;
  }
  
  if (limit.count >= 5) {
    return false;
  }
  
  limit.count++;
  return true;
};

const getEmailContent = (otp: string, role: string, language: string = 'en') => {
  const roleLabels: Record<string, Record<string, string>> = {
    admin: { tr: 'Admin', en: 'Admin' },
    agency: { tr: 'Acenta', en: 'Agency' },
    driver: { tr: 'Şoför', en: 'Driver' },
    customer: { tr: 'Müşteri', en: 'Customer' },
  };
  
  const roleLabel = roleLabels[role]?.[language] || role;
  
  if (language === 'tr') {
    return {
      subject: `Meet Transfer - ${roleLabel} Girişi Doğrulama Kodu`,
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Doğrulama Kodu</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                  <tr>
                    <td style="padding: 48px 40px;">
                      <!-- Header -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="padding-bottom: 32px;">
                            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                              <span style="font-size: 32px;">🔐</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom: 8px;">
                            <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
                              İki Faktörlü Doğrulama
                            </h1>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom: 32px;">
                            <p style="color: #64748b; font-size: 15px; margin: 0; line-height: 1.6;">
                              ${roleLabel} paneline giriş için doğrulama kodunuz aşağıdadır
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- OTP Code -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="padding: 24px 0;">
                            <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 24px 32px; display: inline-block;">
                              <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;">
                                ${otp}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Warning -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 24px 0;">
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0;">
                              <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                                ⏱️ Bu kod <strong>5 dakika</strong> içinde geçerliliğini yitirecektir.
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Security Notice -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="padding-top: 16px;">
                            <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.5;">
                              Bu girişi siz yapmadıysanız, bu emaili görmezden gelin<br>ve şifrenizi değiştirmeyi düşünün.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                              Meet Transfer • Güvenli Transfer Hizmetleri
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
    subject: `Meet Transfer - ${roleLabel} Login Verification Code`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <tr>
                  <td style="padding: 48px 40px;">
                    <!-- Header -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding-bottom: 32px;">
                          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 32px;">🔐</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 8px;">
                          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
                            Two-Factor Authentication
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 32px;">
                          <p style="color: #64748b; font-size: 15px; margin: 0; line-height: 1.6;">
                            Your verification code for ${roleLabel} panel login
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- OTP Code -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding: 24px 0;">
                          <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 24px 32px; display: inline-block;">
                            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;">
                              ${otp}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Warning -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 24px 0;">
                          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0;">
                            <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                              ⏱️ This code will expire in <strong>5 minutes</strong>.
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Security Notice -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding-top: 16px;">
                          <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.5;">
                            If you didn't request this login, please ignore this email<br>and consider changing your password.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            Meet Transfer • Secure Transfer Services
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, role, language = 'tr' }: OTPRequest = await req.json();

    // Validate required fields
    if (!userId || !email || !role) {
      console.error("Missing required fields:", { userId: !!userId, email: !!email, role: !!role });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    if (!checkRateLimit(email)) {
      console.warn(`Rate limit exceeded for email: ${email}`);
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please wait 10 minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate OTP using the database function
    const { data: otp, error: otpError } = await supabase.rpc('generate_otp', {
      p_user_id: userId,
      p_email: email,
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      p_user_agent: req.headers.get('user-agent'),
    });

    if (otpError) {
      console.error("OTP generation error:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP", details: otpError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otp) {
      console.error("OTP generation returned null");
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email content based on language and role
    const emailContent = getEmailContent(otp, role, language);

    // Send OTP via email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Meet Transfer <security@meettransfer.app>",
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (emailError) {
      console.error("Email sending error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send verification email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`2FA OTP email sent successfully: ${email} (role: ${role}, messageId: ${emailData?.id})`);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-2fa-otp function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
