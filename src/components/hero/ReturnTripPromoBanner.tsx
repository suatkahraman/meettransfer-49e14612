import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface ReturnTripPromoBannerProps {
  language: string;
  onApplyPromoCode?: (code: string) => void;
}

// Countdown hook
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

export const ReturnTripPromoBanner = memo(({ language, onApplyPromoCode }: ReturnTripPromoBannerProps) => {
  const promoCode = "RETURN30";
  const expiryDate = new Date("2026-03-31T23:59:59");
  const timeLeft = useCountdown(expiryDate);

  const handleClick = () => {
    if (onApplyPromoCode) {
      onApplyPromoCode(promoCode);
      
      // Confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b']
      });
      
      toast.success(
        language === 'TR' 
          ? `Promo kodu "${promoCode}" uygulandı! Dönüş yolculuğunuzda %30 indirim kazandınız.`
          : `Promo code "${promoCode}" applied! You'll get 30% off on your return trip.`
      );
    }
  };

  const formatTimeUnit = (value: number) => value.toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mb-3 relative overflow-hidden"
    >
      <button
        type="button"
        onClick={handleClick}
        className="w-full text-left relative bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 rounded-xl px-3 md:px-4 py-2 md:py-2.5 backdrop-blur-sm hover:border-green-500/50 hover:from-green-500/15 hover:to-green-500/15 transition-all cursor-pointer group"
      >
        {/* Animated background shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          {/* Top Row - Promo Info */}
          <div className="flex items-center justify-between md:justify-start gap-2">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-base md:text-lg"
              >
                🎁
              </motion.span>
              <span className="font-bold text-green-700 dark:text-green-400 text-xs md:text-sm">
                {language === 'TR' ? 'Dönüş' : 'Return'}: 
                <span className="ml-1 text-sm md:text-base">%30 {language === 'TR' ? 'İndirim' : 'OFF'}</span>
              </span>
            </div>
            
            {/* Promo Code - Visible on all screens */}
            <div className="flex items-center gap-1 bg-green-500/20 rounded-lg px-2 py-1 group-hover:bg-green-500/30 transition-colors">
              <span className="text-[10px] md:text-xs text-green-700 dark:text-green-300 font-medium">
                {language === 'TR' ? 'Kod' : 'Code'}:
              </span>
              <code className="font-mono font-bold text-green-700 dark:text-green-300 text-xs md:text-sm">
                {promoCode}
              </code>
            </div>
          </div>
          
          {/* Bottom Row - Countdown Timer */}
          <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3">
            {/* Countdown Timer */}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <div className="flex items-center gap-0.5 text-[10px] md:text-xs font-mono">
                <span className="bg-muted/60 px-1.5 py-0.5 rounded text-foreground font-bold">
                  {formatTimeUnit(timeLeft.days)}{language === 'TR' ? 'g' : 'd'}
                </span>
                <span className="text-muted-foreground">:</span>
                <span className="bg-muted/60 px-1.5 py-0.5 rounded text-foreground font-bold">
                  {formatTimeUnit(timeLeft.hours)}{language === 'TR' ? 's' : 'h'}
                </span>
                <span className="text-muted-foreground">:</span>
                <span className="bg-muted/60 px-1.5 py-0.5 rounded text-foreground font-bold">
                  {formatTimeUnit(timeLeft.minutes)}{language === 'TR' ? 'd' : 'm'}
                </span>
                <span className="text-muted-foreground hidden md:inline">:</span>
                <span className="bg-muted/60 px-1.5 py-0.5 rounded text-foreground font-bold hidden md:inline">
                  {formatTimeUnit(timeLeft.seconds)}{language === 'TR' ? 'sn' : 's'}
                </span>
              </div>
            </div>
            
            {/* Click hint - Desktop only */}
            <motion.span
              className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-medium hidden md:inline-flex items-center gap-1"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {language === 'TR' ? 'Tıkla →' : 'Click →'}
            </motion.span>
          </div>
        </div>
      </button>
    </motion.div>
  );
});

ReturnTripPromoBanner.displayName = "ReturnTripPromoBanner";
