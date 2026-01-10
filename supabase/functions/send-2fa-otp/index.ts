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

const getEmailContent = (otp: string, role: string, language: string = 'en', expiryMinutes: number = 5) => {
  const roleLabels: Record<string, Record<string, string>> = {
    admin: { tr: 'Yönetici', en: 'Admin' },
    agency: { tr: 'Acenta', en: 'Agency' },
    driver: { tr: 'Şoför', en: 'Driver' },
    customer: { tr: 'Müşteri', en: 'Customer' },
  };
  
  const roleLabel = roleLabels[role]?.[language] || roleLabels[role]?.['en'] || role;
  
  if (language === 'tr') {
    return {
      subject: `${otp} - Meet Transfer Doğrulama Kodunuz`,
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Doğrulama Kodu</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 48px 40px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 32px;">
                            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px; display: inline-block; text-align: center; line-height: 64px; font-size: 32px;">🔐</div>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom: 8px;">
                            <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">Güvenlik Doğrulaması</h1>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom: 32px;">
                            <p style="color: #64748b; font-size: 15px; margin: 0;">${roleLabel} paneline giriş için doğrulama kodunuz</p>
                          </td>
                        </tr>
                      </table>
                      
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="padding: 24px 0;">
                            <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 24px 40px; display: inline-block;">
                              <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #0f172a; font-family: monospace;">${otp}</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="padding: 24px 0;">
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px;">
                              <p style="color: #92400e; font-size: 14px; margin: 0;">⏱️ Bu kod <strong>${expiryMinutes} dakika</strong> içinde geçerliliğini yitirecektir.</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="padding-top: 16px;">
                            <p style="color: #94a3b8; font-size: 13px; margin: 0;">Bu girişi siz yapmadıysanız bu e-postayı görmezden gelin.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">Meet Transfer • VIP Transfer Hizmetleri</p>
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
        <title>Verification Code</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 48px 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 32px;">
                          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px; display: inline-block; text-align: center; line-height: 64px; font-size: 32px;">🔐</div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 8px;">
                          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">Security Verification</h1>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 32px;">
                          <p style="color: #64748b; font-size: 15px; margin: 0;">Your verification code for ${roleLabel} panel login</p>
                        </td>
                      </tr>
                    </table>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding: 24px 0;">
                          <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 24px 40px; display: inline-block;">
                            <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #0f172a; font-family: monospace;">${otp}</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 24px 0;">
                          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px;">
                            <p style="color: #92400e; font-size: 14px; margin: 0;">⏱️ This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-top: 16px;">
                          <p style="color: #94a3b8; font-size: 13px; margin: 0;">If you didn't request this, please ignore this email.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center">
                          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Meet Transfer • VIP Transfer Services</p>
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

// Try multiple email sending methods
async function sendEmailWithFallback(
  supabase: any,
  email: string, 
  subject: string, 
  html: string,
  otp: string
): Promise<{ success: boolean; method?: string; error?: string }> {
  
  // Method 1: Try Resend API if configured with verified domain
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL"); // e.g., "noreply@meettransfer.app"
  
  if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Meet Transfer <${RESEND_FROM_EMAIL}>`,
          to: [email],
          subject,
          html,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Email sent via Resend:", data.id);
        return { success: true, method: 'resend' };
      }
      
      console.warn("Resend API failed, trying fallback:", data);
    } catch (error: any) {
      console.warn("Resend API error, trying fallback:", error.message);
    }
  }

  // Method 2: Try Supabase built-in email (using auth.admin)
  try {
    // Use Supabase's auth email for sending OTP
    // This uses the configured SMTP settings in Supabase dashboard
    const { error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        data: { otp_code: otp }
      }
    });
    
    // Note: This doesn't actually send an email, it generates a link
    // We'll use a different approach
  } catch (error) {
    console.warn("Supabase auth fallback failed:", error);
  }

  // Method 3: Fallback to onboarding@resend.dev (limited - only owner email)
  if (RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Meet Transfer <onboarding@resend.dev>",
          to: [email],
          subject,
          html,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Email sent via Resend (fallback):", data.id);
        return { success: true, method: 'resend-fallback' };
      }
      
      // If we hit the domain verification error, log it clearly
      if (data.message?.includes('verify a domain')) {
        console.error("Domain verification required for Resend. Add RESEND_FROM_EMAIL with verified domain.");
        return { 
          success: false, 
          error: "Email domain not verified. Please verify domain at resend.com/domains" 
        };
      }
      
      return { success: false, error: data.message || "Email sending failed" };
    } catch (error: any) {
      console.error("Resend fallback error:", error);
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: "No email service configured" };
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

    console.log("2FA OTP request received:", { userId, email: email?.substring(0, 5) + '***', role, language });

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

    // Get OTP settings from database
    const { data: settings } = await supabase
      .from('otp_settings')
      .select('setting_key, setting_value');
    
    const settingsMap: Record<string, string> = {};
    if (settings) {
      settings.forEach((s: { setting_key: string; setting_value: string }) => {
        settingsMap[s.setting_key] = s.setting_value;
      });
    }
    
    const otpExpiryMinutes = parseInt(settingsMap['otp_expiry_minutes'] || '5', 10);
    const otpLength = parseInt(settingsMap['otp_length'] || '6', 10);
    
    console.log("OTP settings loaded:", { otpExpiryMinutes, otpLength });

    // Get client info for logging
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Generate OTP using the database function (uses settings from otp_settings table)
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

    console.log("OTP generated successfully for:", email.substring(0, 5) + '***', { length: otp.length, expiryMinutes: otpExpiryMinutes });

    // Get email content based on language, role and expiry time
    const emailContent = getEmailContent(otp, role, language, otpExpiryMinutes);

    // Send OTP via email with fallback methods
    const emailResult = await sendEmailWithFallback(supabase, email, emailContent.subject, emailContent.html, otp);

    if (!emailResult.success) {
      console.error("All email methods failed:", emailResult.error);
      
      // Store OTP anyway - user can see it in logs for now (dev mode)
      // In production, this should fail
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "email_failed", 
          message: language === 'tr' 
            ? "Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin."
            : "Failed to send verification code. Please try again.",
          details: emailResult.error
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`2FA OTP sent successfully: ${email.substring(0, 5)}*** (role: ${role}, method: ${emailResult.method}, duration: ${duration}ms)`);

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
