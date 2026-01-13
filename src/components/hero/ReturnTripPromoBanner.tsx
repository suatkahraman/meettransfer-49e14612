import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { tr, enUS } from "date-fns/locale";

interface ReturnTripPromoBannerProps {
  language: string;
  onApplyPromoCode?: (code: string) => void;
}

interface PromoCodeData {
  code: string;
  discount_percentage: number;
  valid_until: string | null;
  description: string | null;
}

export const ReturnTripPromoBanner = memo(({ language, onApplyPromoCode }: ReturnTripPromoBannerProps) => {
  const [promoData, setPromoData] = useState<PromoCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPromoCode = async () => {
      try {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('code, discount_percentage, valid_until, description')
          .eq('is_active', true)
          .eq('applies_to', 'return_transfer')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching promo code:', error);
          return;
        }

        if (data) {
          setPromoData(data);
        }
      } catch (err) {
        console.error('Failed to fetch promo code:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromoCode();
  }, []);

  const handleClick = () => {
    if (onApplyPromoCode && promoData) {
      onApplyPromoCode(promoData.code);
      
      // Confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b']
      });
      
      toast.success(
        language === 'TR' 
          ? `Promo kodu "${promoData.code}" uygulandı! Dönüş yolculuğunuzda %${promoData.discount_percentage} indirim kazandınız.`
          : `Promo code "${promoData.code}" applied! You'll get ${promoData.discount_percentage}% off on your return trip.`
      );
    }
  };

  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return format(date, 'dd.MM.yyyy', { locale: language === 'TR' ? tr : enUS });
    } catch {
      return null;
    }
  };

  // CLS fix: Reserve space with min-height even during loading
  // Don't render if no promo data, but show placeholder during loading
  if (!promoData) {
    if (isLoading) {
      // Reserve space during loading to prevent CLS
      return <div className="mb-3 h-[52px] md:h-[48px]" aria-hidden="true" />;
    }
    return null;
  }

  const expiryDate = formatExpiryDate(promoData.valid_until);

  return (
    // CLS fix: Use CSS animation instead of framer-motion y offset
    <div
      className="mb-3 relative overflow-hidden animate-fade-in"
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
                <span className="ml-1 text-sm md:text-base">%{promoData.discount_percentage} {language === 'TR' ? 'İndirim' : 'OFF'}</span>
              </span>
            </div>
            
            {/* Promo Code - Visible on all screens */}
            <div className="flex items-center gap-1 bg-green-500/20 rounded-lg px-2 py-1 group-hover:bg-green-500/30 transition-colors">
              <span className="text-[10px] md:text-xs text-green-700 dark:text-green-300 font-medium">
                {language === 'TR' ? 'Kod' : 'Code'}:
              </span>
              <code className="font-mono font-bold text-green-700 dark:text-green-300 text-xs md:text-sm">
                {promoData.code}
              </code>
            </div>
          </div>
          
          {/* Bottom Row - Expiry Date */}
          <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3">
            {/* Expiry Date Display */}
            {expiryDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  {language === 'TR' ? 'Son Geçerlilik:' : 'Valid until:'}
                </span>
                <span className="text-[10px] md:text-xs font-bold text-foreground">
                  {expiryDate}
                </span>
              </div>
            )}
            
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
    </div>
  );
});

ReturnTripPromoBanner.displayName = "ReturnTripPromoBanner";
