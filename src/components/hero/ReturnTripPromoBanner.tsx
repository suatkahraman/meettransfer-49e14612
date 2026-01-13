import { memo } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { toast } from "sonner";

interface ReturnTripPromoBannerProps {
  language: string;
  onApplyPromoCode?: (code: string) => void;
}

export const ReturnTripPromoBanner = memo(({ language, onApplyPromoCode }: ReturnTripPromoBannerProps) => {
  const promoCode = "RETURN30";
  const expiryDate = "31.03.2026";

  const handleClick = () => {
    if (onApplyPromoCode) {
      onApplyPromoCode(promoCode);
      toast.success(
        language === 'TR' 
          ? `Promo kodu "${promoCode}" uygulandı! Dönüş yolculuğunuzda %30 indirim kazandınız.`
          : `Promo code "${promoCode}" applied! You'll get 30% off on your return trip.`
      );
    }
  };

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
        className="w-full text-left relative bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5 backdrop-blur-sm hover:border-green-500/50 hover:from-green-500/15 hover:to-green-500/15 transition-all cursor-pointer group"
      >
        {/* Animated background shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg"
            >
              🎁
            </motion.span>
            <div>
              <span className="font-bold text-green-700 dark:text-green-400 text-sm md:text-base">
                {language === 'TR' ? 'Dönüş Yolculuğu' : 'Return Trip'}: 
                <span className="ml-1 text-base md:text-lg">%30 {language === 'TR' ? 'İndirim' : 'OFF'}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Promo Code */}
            <div className="flex items-center gap-1.5 bg-green-500/20 rounded-lg px-2.5 py-1.5 group-hover:bg-green-500/30 transition-colors">
              <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                {language === 'TR' ? 'Kod' : 'Code'}:
              </span>
              <code className="font-mono font-bold text-green-700 dark:text-green-300 text-sm">
                {promoCode}
              </code>
            </div>
            
            {/* Expiry Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{language === 'TR' ? 'Son' : 'Valid until'}: {expiryDate}</span>
            </div>
            
            {/* Click hint */}
            <motion.span
              className="text-xs text-green-600 dark:text-green-400 font-medium hidden md:inline-flex items-center gap-1"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {language === 'TR' ? 'Tıkla Uygula →' : 'Click to Apply →'}
            </motion.span>
          </div>
        </div>
      </button>
    </motion.div>
  );
});

ReturnTripPromoBanner.displayName = "ReturnTripPromoBanner";
