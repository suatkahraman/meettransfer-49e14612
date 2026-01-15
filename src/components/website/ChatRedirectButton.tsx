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

interface BookingDataForStorage {
  pickup?: string;
  dropoff?: string;
  date?: string;
  time?: string;
  passengers?: number;
  vehicleType?: string;
  estimatedPrice?: number;
  currency?: string;
}

interface ChatRedirectButtonProps {
  language: string;
  onRedirect: () => void;
  onGoogleLogin?: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
  bookingToken?: string;
  bookingData?: BookingDataForStorage;
}

export const ChatRedirectButton = memo(function ChatRedirectButton({
  language,
  onRedirect,
  onGoogleLogin,
  isLoading = false,
  className,
  bookingToken,
  bookingData,
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
      
      // Also store booking data for redirect after login (when no token exists)
      if (bookingData) {
        localStorage.setItem('pending_booking_data', JSON.stringify(bookingData));
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
      className={cn("mt-4 p-5 bg-gradient-to-br from-green-50 via-background to-primary/10 rounded-2xl border-2 border-green-500/30 shadow-xl", className)}
    >
      {/* Success Header - More Prominent */}
      <motion.div 
        className="flex items-center gap-3 mb-4 pb-3 border-b border-green-500/20"
        initial={{ x: -20 }}
        animate={{ x: 0 }}
      >
        <motion.div
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/40"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <CheckCircle className="h-6 w-6 text-white" />
        </motion.div>
        <div>
          <h4 className="font-bold text-base text-foreground">
            {isTurkish ? "Rezervasyonunuz Hazır!" : "Your Booking is Ready!"}
          </h4>
          <p className="text-xs text-muted-foreground">
            {isTurkish ? "Son adım: Onaylayın ve tamamlayın" : "Final step: Confirm and complete"}
          </p>
        </div>
      </motion.div>

      {/* Info Section - Enhanced */}
      <div className="text-xs text-muted-foreground space-y-2 mb-5 bg-white/50 rounded-xl p-3 border border-border/50">
        <p className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-green-600" />
          </div>
          <span className="font-medium">
            {isTurkish 
              ? "Tüm bilgileriniz güvenli şekilde kaydedildi" 
              : "All your information is securely saved"
            }
          </span>
        </p>
        <p className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span className="font-medium">
            {isTurkish 
              ? "Sadece birkaç saniye içinde tamamlayın" 
              : "Complete in just a few seconds"
            }
          </span>
        </p>
      </div>

      {/* Action Buttons - Enhanced */}
      <div className="space-y-3">
        {/* Continue as Guest / Go to Booking Page - Primary Action */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={onRedirect}
            disabled={isLoading || googleLoading}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold text-base rounded-xl shadow-xl shadow-primary/30 transition-all"
          >
            <motion.div
              className="flex items-center gap-3"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <UserPlus className="h-5 w-5" />
              <span>
                {isTurkish ? "Devam Et & Rezervasyonu Tamamla" : "Continue & Complete Booking"}
              </span>
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-4 py-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            {isTurkish ? "veya" : "or"}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Google Login Button - Enhanced */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleGoogleLogin}
            disabled={googleLoading || isLoading}
            variant="outline"
            className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-primary/50 font-semibold text-base rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                <span>
                  {isTurkish ? "Google ile Hızlı Giriş" : "Quick Sign in with Google"}
                </span>
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Helper text - Enhanced */}
      <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          {isTurkish 
            ? "💡 Google ile giriş yaparak müşteri panelinize erişebilir ve tüm rezervasyonlarınızı kolayca takip edebilirsiniz" 
            : "💡 Sign in with Google to access your customer panel and easily track all your bookings"
          }
        </p>
      </div>
    </motion.div>
  );
});

export default ChatRedirectButton;
