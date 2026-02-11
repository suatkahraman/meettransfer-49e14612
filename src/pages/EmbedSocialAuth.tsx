/**
 * Embeddable Social Auth Buttons for External Websites
 * 
 * This page provides Google and Apple Sign-In buttons that can be embedded on partner websites.
 * After successful authentication, users are redirected back to the partner site or meettransfer.app
 * 
 * Usage:
 * <iframe src="https://meettransfer.app/embed/auth" width="100%" height="200" frameborder="0"></iframe>
 * 
 * Optional URL parameters:
 * - ?lang=TR|EN|DE|FR|RU|ES|IT|AR|PL|PT|NL (default: EN)
 * - ?theme=light|dark (default: light)
 * - ?redirect=https://partner-site.com/callback (redirect after auth)
 * - ?mode=login|signup (default: login)
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { startOAuthSignIn } from "@/lib/oauthSignIn";

// Google Icon SVG component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Apple Sign-In - geçici olarak kaldırıldı

// Translations
const EMBED_AUTH_TRANSLATIONS: Record<string, Record<string, string>> = {
  EN: {
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    redirecting: "Redirecting...",
    loginFailed: "Login failed. Please try again.",
    or: "or",
    poweredBy: "Powered by Meet Transfer",
  },
  TR: {
    continueWithGoogle: "Google ile devam et",
    continueWithApple: "Apple ile devam et",
    redirecting: "Yönlendiriliyor...",
    loginFailed: "Giriş başarısız. Lütfen tekrar deneyin.",
    or: "veya",
    poweredBy: "Meet Transfer ile güçlendirildi",
  },
  DE: {
    continueWithGoogle: "Mit Google fortfahren",
    continueWithApple: "Mit Apple fortfahren",
    redirecting: "Weiterleitung...",
    loginFailed: "Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    or: "oder",
    poweredBy: "Powered by Meet Transfer",
  },
  FR: {
    continueWithGoogle: "Continuer avec Google",
    continueWithApple: "Continuer avec Apple",
    redirecting: "Redirection...",
    loginFailed: "Échec de la connexion. Veuillez réessayer.",
    or: "ou",
    poweredBy: "Propulsé par Meet Transfer",
  },
  RU: {
    continueWithGoogle: "Продолжить с Google",
    continueWithApple: "Продолжить с Apple",
    redirecting: "Перенаправление...",
    loginFailed: "Ошибка входа. Попробуйте снова.",
    or: "или",
    poweredBy: "Работает на Meet Transfer",
  },
  ES: {
    continueWithGoogle: "Continuar con Google",
    continueWithApple: "Continuar con Apple",
    redirecting: "Redirigiendo...",
    loginFailed: "Error de inicio de sesión. Inténtelo de nuevo.",
    or: "o",
    poweredBy: "Desarrollado por Meet Transfer",
  },
  IT: {
    continueWithGoogle: "Continua con Google",
    continueWithApple: "Continua con Apple",
    redirecting: "Reindirizzamento...",
    loginFailed: "Accesso fallito. Riprova.",
    or: "o",
    poweredBy: "Powered by Meet Transfer",
  },
  AR: {
    continueWithGoogle: "متابعة مع Google",
    continueWithApple: "متابعة مع Apple",
    redirecting: "جاري التحويل...",
    loginFailed: "فشل تسجيل الدخول. حاول مرة أخرى.",
    or: "أو",
    poweredBy: "مدعوم من Meet Transfer",
  },
  PL: {
    continueWithGoogle: "Kontynuuj z Google",
    continueWithApple: "Kontynuuj z Apple",
    redirecting: "Przekierowywanie...",
    loginFailed: "Logowanie nie powiodło się. Spróbuj ponownie.",
    or: "lub",
    poweredBy: "Obsługiwane przez Meet Transfer",
  },
  PT: {
    continueWithGoogle: "Continuar com Google",
    continueWithApple: "Continuar com Apple",
    redirecting: "Redirecionando...",
    loginFailed: "Falha no login. Tente novamente.",
    or: "ou",
    poweredBy: "Desenvolvido por Meet Transfer",
  },
  NL: {
    continueWithGoogle: "Doorgaan met Google",
    continueWithApple: "Doorgaan met Apple",
    redirecting: "Omleiden...",
    loginFailed: "Inloggen mislukt. Probeer opnieuw.",
    or: "of",
    poweredBy: "Powered by Meet Transfer",
  },
};

const EmbedSocialAuth = () => {
  const [searchParams] = useSearchParams();
  
  // Get language from URL params (default: EN)
  const langParam = (searchParams.get("lang") || "EN").toUpperCase();
  const language = EMBED_AUTH_TRANSLATIONS[langParam] ? langParam : "EN";
  const t = EMBED_AUTH_TRANSLATIONS[language];
  
  // Theme from URL params
  const theme = searchParams.get("theme") || "light";
  
  // Auth state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Apply theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await startOAuthSignIn('google');
      
      if (error) {
        console.error('Google OAuth error:', error);
        toast.error(error.message || t.loginFailed);
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(t.loginFailed);
      setIsGoogleLoading(false);
    }
  };

  const isLoading = isGoogleLoading;
  
  // RTL support for Arabic
  const isRTL = language === "AR";
  
  return (
    <div 
      className={cn(
        "min-h-screen bg-background p-4 flex flex-col items-center justify-center",
        isRTL && "rtl"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Toaster />
      
      {/* Auth Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg border p-6 space-y-4">
        {/* Google Sign-In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-xl text-base font-medium bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span className="ml-2">
            {isGoogleLoading ? t.redirecting : t.continueWithGoogle}
          </span>
        </Button>

        {/* Apple Sign-In - geçici olarak kaldırıldı */}
        
        {/* Powered By */}
        <div className="text-center pt-2">
          <a 
            href="https://meettransfer.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.poweredBy}
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmbedSocialAuth;
