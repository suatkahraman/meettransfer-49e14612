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

const getEmailContent = (otp: string, role: string, language: string = 'en') => {
  const roleLabels: Record<string, Record<string, string>> = {
    admin: { tr: 'Admin', en: 'Admin' },
    agency: { tr: 'Acenta', en: 'Agency' },
    driver: { tr: 'Şoför', en: 'Driver' },
  };
  
  const roleLabel = roleLabels[role]?.[language] || role;
  
  if (language === 'tr') {
    return {
      subject: `Meet Transfer - ${roleLabel} Girişi Doğrulama Kodu`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0;">
                  🔐 İki Faktörlü Doğrulama
                </h1>
                <p style="color: #71717a; font-size: 14px; margin-top: 8px;">
                  ${roleLabel} paneline giriş için doğrulama kodunuz
                </p>
              </div>
              
              <div style="background: linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;">
                <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #18181b; font-family: monospace;">
                  ${otp}
                </div>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  ⏱️ Bu kod <strong>5 dakika</strong> içinde geçerliliğini yitirecektir.
                </p>
              </div>
              
              <p style="color: #71717a; font-size: 13px; text-align: center; margin: 0;">
                Bu girişi siz yapmadıysanız, lütfen şifrenizi değiştirin.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                Meet Transfer - Güvenli Transfer Hizmetleri
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }
  
  return {
    subject: `Meet Transfer - ${roleLabel} Login Verification Code`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0;">
                🔐 Two-Factor Authentication
              </h1>
              <p style="color: #71717a; font-size: 14px; margin-top: 8px;">
                Your verification code for ${roleLabel} panel login
              </p>
            </div>
            
            <div style="background: linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;">
              <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #18181b; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                ⏱️ This code will expire in <strong>5 minutes</strong>.
              </p>
            </div>
            
            <p style="color: #71717a; font-size: 13px; text-align: center; margin: 0;">
              If you didn't request this login, please change your password.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
              Meet Transfer - Secure Transfer Services
            </p>
          </div>
        </div>
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

    if (!userId || !email || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email content based on language and role
    const emailContent = getEmailContent(otp, role, language);

    // Send OTP via email
    const emailResponse = await resend.emails.send({
      from: "Meet Transfer <security@meettransfer.app>",
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("2FA OTP email sent:", { email, role });

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-2fa-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
