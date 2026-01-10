import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordChangeNotificationRequest {
  email: string;
  user_name?: string;
  language?: 'en' | 'tr';
  ip_address?: string;
  user_agent?: string;
}

const translations = {
  en: {
    subject: "🔐 Your Password Has Been Changed",
    title: "Password Changed Successfully",
    greeting: (name: string) => `Hello${name ? ` ${name}` : ''},`,
    message: "Your Meet Transfer account password has been successfully changed.",
    whenChanged: "This change was made on",
    deviceInfo: "Device Information",
    ipAddress: "IP Address",
    browser: "Browser/Device",
    notYou: "If you didn't make this change",
    securityWarning: "If you did not change your password, please take the following actions immediately:",
    action1: "Reset your password immediately",
    action2: "Check your account for any unauthorized activity",
    action3: "Contact our support team",
    resetPassword: "Reset Password",
    contactSupport: "Contact Support",
    footer: "For your security, this email was sent automatically. Please do not reply to this email.",
    allRights: "All rights reserved.",
  },
  tr: {
    subject: "🔐 Şifreniz Değiştirildi",
    title: "Şifre Başarıyla Değiştirildi",
    greeting: (name: string) => `Merhaba${name ? ` ${name}` : ''},`,
    message: "Meet Transfer hesap şifreniz başarıyla değiştirildi.",
    whenChanged: "Bu değişiklik şu tarihte yapıldı:",
    deviceInfo: "Cihaz Bilgileri",
    ipAddress: "IP Adresi",
    browser: "Tarayıcı/Cihaz",
    notYou: "Bu değişikliği siz yapmadıysanız",
    securityWarning: "Şifrenizi siz değiştirmediyseniz, lütfen hemen aşağıdaki işlemleri yapın:",
    action1: "Şifrenizi hemen sıfırlayın",
    action2: "Hesabınızda yetkisiz işlem olup olmadığını kontrol edin",
    action3: "Destek ekibimizle iletişime geçin",
    resetPassword: "Şifreyi Sıfırla",
    contactSupport: "Destek İle İletişim",
    footer: "Güvenliğiniz için bu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postayı yanıtlamayın.",
    allRights: "Tüm hakları saklıdır.",
  }
};

const formatDate = (date: Date, language: 'en' | 'tr') => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  
  return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', options);
};

const parseUserAgent = (userAgent: string | undefined): string => {
  if (!userAgent) return 'Unknown Device';
  
  // Simple browser detection
  if (userAgent.includes('Chrome')) return 'Chrome Browser';
  if (userAgent.includes('Firefox')) return 'Firefox Browser';
  if (userAgent.includes('Safari')) return 'Safari Browser';
  if (userAgent.includes('Edge')) return 'Edge Browser';
  if (userAgent.includes('Opera')) return 'Opera Browser';
  
  // Device detection
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Android')) return 'Android Device';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux PC';
  
  return 'Unknown Device';
};

const generateEmailTemplate = (data: PasswordChangeNotificationRequest) => {
  const lang = data.language || 'en';
  const t = translations[lang];
  const changeDate = formatDate(new Date(), lang);
  const deviceInfo = parseUserAgent(data.user_agent);
  const baseUrl = "https://meettransfer.app";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="https://meettransfer.app/images/meet-transfer-logo.png" alt="Meet Transfer" style="height: 40px; margin-bottom: 15px;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🔐 ${t.title}</h1>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">${t.greeting(data.user_name || '')}</p>
        
        <p style="font-size: 15px; margin-bottom: 25px;">${t.message}</p>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4caf50;">
          <p style="margin: 0 0 10px; font-weight: bold; color: #2e7d32;">${t.whenChanged}</p>
          <p style="margin: 0; font-size: 14px; color: #333;">${changeDate}</p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <p style="margin: 0 0 15px; font-weight: bold; color: #333;">📱 ${t.deviceInfo}</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 40%;">${t.ipAddress}:</td>
              <td style="padding: 8px 0; font-family: monospace; color: #333;">${data.ip_address || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">${t.browser}:</td>
              <td style="padding: 8px 0; color: #333;">${deviceInfo}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ff9800;">
          <p style="margin: 0 0 15px; font-weight: bold; color: #e65100;">⚠️ ${t.notYou}</p>
          <p style="margin: 0 0 10px; font-size: 14px; color: #666;">${t.securityWarning}</p>
          <ul style="margin: 10px 0; padding-left: 20px; color: #666; font-size: 14px;">
            <li style="margin-bottom: 5px;">${t.action1}</li>
            <li style="margin-bottom: 5px;">${t.action2}</li>
            <li style="margin-bottom: 5px;">${t.action3}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/auth?type=recovery" style="display: inline-block; background: #f44336; color: #fff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin: 5px;">${t.resetPassword}</a>
          <a href="https://wa.me/15558051101" style="display: inline-block; background: #25D366; color: #fff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin: 5px;">${t.contactSupport}</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="margin: 0; color: #999; font-size: 12px;">${t.footer}</p>
          <p style="margin: 10px 0 0; color: #888; font-size: 12px;">© ${new Date().getFullYear()} Meet Transfer. ${t.allRights}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service not configured");
    }

    const requestData: PasswordChangeNotificationRequest = await req.json();

    console.log("Sending password change notification to:", requestData.email);

    const lang = requestData.language || 'en';
    const t = translations[lang];

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Meet Transfer <security@mail.meettransfer.app>",
        reply_to: "info@meettransfer.app",
        to: [requestData.email],
        subject: t.subject,
        html: generateEmailTemplate(requestData),
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Password change notification sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailResult }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-change-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
