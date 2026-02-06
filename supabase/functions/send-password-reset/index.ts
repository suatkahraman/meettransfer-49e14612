import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Primary domain used when a reset request originates from preview/temporary domains.
// This prevents emails from sending users to a Lovable preview domain.
const PRIMARY_APP_ORIGIN = "https://meettransfer.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordResetRequest {
  email: string;
  redirect_url?: string;
  language?: string;
}

const translations: Record<
  string,
  {
    subject: string;
    title: string;
    greeting: string;
    message: string;
    buttonText: string;
    expiry: string;
    ignore: string;
    footer: string;
    allRights: string;
  }
> = {
  en: {
    subject: "🔐 Reset Your Password - Meet Transfer",
    title: "Password Reset Request",
    greeting: "Hello,",
    message:
      "We received a request to reset your password for your Meet Transfer account. Click the button below to create a new password:",
    buttonText: "Reset My Password",
    expiry:
      "This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.",
    ignore:
      "If you didn't make this request, please ignore this email. Your password will remain unchanged.",
    footer:
      "For your security, this email was sent automatically. Please do not reply to this email.",
    allRights: "All rights reserved.",
  },
  tr: {
    subject: "🔐 Şifrenizi Sıfırlayın - Meet Transfer",
    title: "Şifre Sıfırlama İsteği",
    greeting: "Merhaba,",
    message:
      "Meet Transfer hesabınız için şifre sıfırlama talebi aldık. Yeni bir şifre oluşturmak için aşağıdaki düğmeye tıklayın:",
    buttonText: "Şifremi Sıfırla",
    expiry:
      "Bu bağlantı 1 saat içinde geçerliliğini yitirecektir. Şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz.",
    ignore:
      "Bu isteği siz yapmadıysanız, lütfen bu e-postayı görmezden gelin. Şifreniz değişmeyecektir.",
    footer:
      "Güvenliğiniz için bu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postayı yanıtlamayın.",
    allRights: "Tüm hakları saklıdır.",
  },
  de: {
    subject: "🔐 Passwort zurücksetzen - Meet Transfer",
    title: "Passwort-Zurücksetzungsanfrage",
    greeting: "Hallo,",
    message:
      "Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts für Ihr Meet Transfer-Konto erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu erstellen:",
    buttonText: "Mein Passwort zurücksetzen",
    expiry:
      "Dieser Link läuft in 1 Stunde ab. Wenn Sie keine Passwort-Zurücksetzung angefordert haben, können Sie diese E-Mail ignorieren.",
    ignore:
      "Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie bitte diese E-Mail. Ihr Passwort bleibt unverändert.",
    footer:
      "Zu Ihrer Sicherheit wurde diese E-Mail automatisch gesendet. Bitte antworten Sie nicht auf diese E-Mail.",
    allRights: "Alle Rechte vorbehalten.",
  },
  fr: {
    subject: "🔐 Réinitialisez votre mot de passe - Meet Transfer",
    title: "Demande de réinitialisation du mot de passe",
    greeting: "Bonjour,",
    message:
      "Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Meet Transfer. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :",
    buttonText: "Réinitialiser mon mot de passe",
    expiry:
      "Ce lien expirera dans 1 heure. Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet e-mail en toute sécurité.",
    ignore:
      "Si vous n'avez pas fait cette demande, veuillez ignorer cet e-mail. Votre mot de passe restera inchangé.",
    footer:
      "Pour votre sécurité, cet e-mail a été envoyé automatiquement. Veuillez ne pas répondre à cet e-mail.",
    allRights: "Tous droits réservés.",
  },
  ru: {
    subject: "🔐 Сбросить пароль - Meet Transfer",
    title: "Запрос на сброс пароля",
    greeting: "Здравствуйте,",
    message:
      "Мы получили запрос на сброс пароля для вашей учетной записи Meet Transfer. Нажмите кнопку ниже, чтобы создать новый пароль:",
    buttonText: "Сбросить пароль",
    expiry:
      "Эта ссылка истечет через 1 час. Если вы не запрашивали сброс пароля, вы можете проигнорировать это письмо.",
    ignore:
      "Если вы не делали этот запрос, пожалуйста, проигнорируйте это письмо. Ваш пароль останется без изменений.",
    footer:
      "Для вашей безопасности это письмо было отправлено автоматически. Пожалуйста, не отвечайте на это письмо.",
    allRights: "Все права защищены.",
  },
  ar: {
    subject: "🔐 إعادة تعيين كلمة المرور - Meet Transfer",
    title: "طلب إعادة تعيين كلمة المرور",
    greeting: "مرحباً،",
    message:
      "لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحساب Meet Transfer الخاص بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:",
    buttonText: "إعادة تعيين كلمة المرور",
    expiry:
      "سينتهي صلاحية هذا الرابط خلال ساعة واحدة. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان.",
    ignore:
      "إذا لم تقم بهذا الطلب، يرجى تجاهل هذا البريد الإلكتروني. ستظل كلمة المرور الخاصة بك بدون تغيير.",
    footer:
      "لأمانك، تم إرسال هذا البريد الإلكتروني تلقائياً. يرجى عدم الرد على هذا البريد الإلكتروني.",
    allRights: "جميع الحقوق محفوظة.",
  },
};

function getTranslation(lang: string): typeof translations.en {
  const normalizedLang = (lang || "en").substring(0, 2).toLowerCase();
  return translations[normalizedLang] || translations.en;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeRedirectUrl(raw: string | undefined): string {
  // Default route supports PKCE code exchange and shows reset UI.
  const fallback = `${PRIMARY_APP_ORIGIN}/login?type=recovery`;
  if (!raw) return fallback;

  try {
    // Support absolute and relative URLs.
    const parsed = new URL(raw, PRIMARY_APP_ORIGIN);
    const host = parsed.hostname.toLowerCase();

    const isPreviewDomain =
      host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com") || host === "localhost";

    const baseOrigin = isPreviewDomain ? PRIMARY_APP_ORIGIN : parsed.origin;

    // Keep the original path + query, but ensure it has a concrete route.
    const pathname = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/login";
    const search = parsed.search || "";

    return `${baseOrigin}${pathname}${search}`;
  } catch {
    return fallback;
  }
}

function generateEmailTemplate(resetUrl: string, lang: string): string {
  const t = getTranslation(lang);
  const isRtl = lang === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  // Important: many email clients break URLs if & is not HTML-escaped in attributes.
  const safeResetUrl = escapeHtmlAttr(resetUrl);

  return `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; direction: ${dir};">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="https://meettransfer.app/images/meet-transfer-logo.png" alt="Meet Transfer" style="height: 40px; margin-bottom: 15px;">
        <h1 style="color: #fdd835; margin: 0; font-size: 24px;">🔐 ${t.title}</h1>
      </div>

      <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">${t.greeting}</p>

        <p style="font-size: 15px; margin-bottom: 25px;">${t.message}</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${safeResetUrl}" style="display: inline-block; background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: #fff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">${t.buttonText}</a>
        </div>

        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; font-size: 14px; color: #666;">⏰ ${t.expiry}</p>
        </div>

        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #666;">${t.ignore}</p>
        </div>

        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">${t.footer}</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <p style="margin: 0; color: #888; font-size: 11px;">© ${new Date().getFullYear()} Meet Transfer. ${t.allRights}</p>
      </div>
    </body>
    </html>
  `;
}

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

    const { email, redirect_url, language }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing password reset request for:", email);

    // Create admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Normalize redirect target to avoid preview-domain links in emails (and prevent malformed URLs)
    const redirectTo = normalizeRedirectUrl(redirect_url);
    try {
      console.log("Password reset redirect host:", new URL(redirectTo).hostname);
    } catch {
      // ignore
    }

    // Generate password reset link
    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    if (resetError || !data) {
      console.error("Failed to generate reset link:", resetError);
      // Don't reveal if user exists or not
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account exists, a password reset email has been sent.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resetUrl = data.properties?.action_link;

    if (!resetUrl) {
      console.error("No action_link in response:", data);
      throw new Error("Failed to generate reset link");
    }

    console.log("Generated reset URL for:", email);

    // Detect language from email preferences or use provided
    const lang = language || "en";
    const t = getTranslation(lang);

    // Send email
    const resend = new Resend(RESEND_API_KEY);

    const emailResult = await resend.emails.send({
      from: "Meet Transfer <security@mail.meettransfer.app>",
      reply_to: "info@meettransfer.app",
      to: [email],
      subject: t.subject,
      html: generateEmailTemplate(resetUrl, lang),
    });

    console.log("Password reset email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, message: "Password reset email sent" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);

    // Always return success to prevent email enumeration
    return new Response(
      JSON.stringify({ success: true, message: "If an account exists, a password reset email has been sent." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);
