import { memo } from "react";
import { Shield, Star, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEFAULT_RATING, DEFAULT_TOTAL_REVIEWS } from "@/constants/ratings";

// Use static values for critical path - no API calls during first paint
// Live rating updates happen in HeroVisualSection (lazy loaded)
export const HeroTrustBadges = memo(() => {
  const { t } = useLanguage();
  
  return (
    // CLS fix: Remove initial y offset animation, use opacity only
    <div 
      className="flex flex-wrap items-center justify-center gap-3 mt-4 animate-fade-in"
      style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
    >
      <div 
        className="flex items-center gap-1.5 bg-green-500/10 rounded-full px-3 py-1.5 hover:scale-105 transition-transform"
      >
        <Shield className="h-3.5 w-3.5 text-green-500" />
        <span className="text-xs font-medium text-green-600">
          {t("freeCancellation")}
        </span>
      </div>
      <div 
        className="flex items-center gap-1.5 bg-yellow-500/10 rounded-full px-3 py-1.5 hover:scale-105 transition-transform"
      >
        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
        <span className="text-xs font-medium text-yellow-600">{DEFAULT_RATING.toFixed(1)}/5 ({DEFAULT_TOTAL_REVIEWS.toLocaleString()}+ {t("reviews") || "reviews"})</span>
      </div>
      <div 
        className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5 hover:scale-105 transition-transform"
      >
        <Check className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-primary">
          {t("fixedPrice")}
        </span>
      </div>
    </div>
  );
});

HeroTrustBadges.displayName = "HeroTrustBadges";
