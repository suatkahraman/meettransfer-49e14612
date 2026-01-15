import { memo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus, Shield, Clock, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Google icon component
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface ChatRedirectButtonProps {
  language: string;
  onRedirect: () => void;
  onGoogleLogin?: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
  bookingToken?: string;
}

export const ChatRedirectButton = memo(function ChatRedirectButton({
  language,
  onRedirect,
  onGoogleLogin,
  isLoading = false,
  className,
  bookingToken,
}: ChatRedirectButtonProps) {
  const isTurkish = language === "TR";
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (onGoogleLogin) {
      setGoogleLoading(true);
      try {
        await onGoogleLogin();
      } finally {
        setGoogleLoading(false);
      }
      return;
    }

    // Default Google login behavior
    setGoogleLoading(true);
    try {
      // Store booking token for after login
      if (bookingToken) {
        localStorage.setItem('pending_booking_token', bookingToken);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/customer`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google login error:', error);
      }
    } catch (err) {
      console.error('Google login error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mt-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20", className)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <h4 className="font-semibold text-sm">
          {isTurkish ? "Rezervasyonunuz Hazır!" : "Your Booking is Ready!"}
        </h4>
      </div>

      {/* Info Section */}
      <div className="text-[11px] text-muted-foreground space-y-1.5 mb-4">
        <p className="flex items-start gap-2">
          <Shield className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
          {isTurkish 
            ? "Tüm bilgileriniz güvenli şekilde kaydedildi" 
            : "All your information is securely saved"
          }
        </p>
        <p className="flex items-start gap-2">
          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
          {isTurkish 
            ? "Sadece birkaç saniye içinde tamamlayın" 
            : "Complete in just a few seconds"
          }
        </p>
      </div>

      {/* Action Buttons - Reordered: Continue first, then Google */}
      <div className="space-y-3">
        {/* Continue as Guest / Go to Booking Page - Primary Action */}
        <Button
          onClick={onRedirect}
          disabled={isLoading || googleLoading}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25"
        >
          <motion.div
            className="flex items-center gap-2"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <UserPlus className="h-4 w-4" />
            <span>
              {isTurkish ? "Devam Et & Rezervasyonu Tamamla" : "Continue & Complete Booking"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </motion.div>
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground font-medium">
            {isTurkish ? "veya" : "or"}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google Login Button - More Prominent at Bottom */}
        <Button
          onClick={handleGoogleLogin}
          disabled={googleLoading || isLoading}
          variant="outline"
          className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-primary/30 hover:border-primary font-medium rounded-xl shadow-md flex items-center justify-center gap-3 transition-all"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              <span className="font-semibold">
                {isTurkish ? "Google ile Hızlı Giriş" : "Quick Sign in with Google"}
              </span>
            </>
          )}
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-center text-[10px] text-muted-foreground mt-3">
        {isTurkish 
          ? "Google ile giriş yaparak müşteri panelinize erişebilir, rezervasyonlarınızı takip edebilirsiniz" 
          : "Sign in with Google to access your customer panel and track your bookings"
        }
      </p>
    </motion.div>
  );
});

export default ChatRedirectButton;
