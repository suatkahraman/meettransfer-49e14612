import { memo } from "react";
import { Shield, Zap, Star, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoogleReviewStats } from "@/hooks/useGoogleReviewStats";

// Logo
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";

interface HeroHeaderProps {
  language: string;
}

export const HeroHeader = memo(({ language }: HeroHeaderProps) => {
  const { t } = useLanguage();
  const { rating } = useGoogleReviewStats();
  
  return (
    <div className="mb-3 md:mb-5">
      {/* Compact Header Row - Logo, Title, Badges all in one line on mobile */}
      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
        {/* CLS fix: Explicit width/height to reserve space */}
        <img 
          src={meetTransferLogo} 
          alt="Meet Transfer" 
          width={48}
          height={48}
          loading="eager"
          decoding="async"
          className="h-8 w-8 md:h-12 md:w-12 rounded-lg object-cover shadow-lg ring-1 ring-primary/30 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-base md:text-xl lg:text-2xl font-bold text-foreground leading-tight whitespace-nowrap">
              <span className="text-primary">Meet</span> Transfer
            </h1>
            {/* Inline badges on mobile */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-1 text-[10px] md:text-xs font-medium">
                <Shield className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">{t("safe")}</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-accent/10 text-accent rounded-full px-2 py-1 text-[10px] md:text-xs font-medium">
                <Zap className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">{t("fast")}</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-600 rounded-full px-2 py-1 text-[10px] md:text-xs font-medium">
                <Star className="h-3 w-3 md:h-4 md:w-4 fill-current" />
                {rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust Badges Row */}
      <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Check className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
          <span>{t("fixedPrice")}</span>
        </div>
        <span className="text-border">•</span>
        <div className="flex items-center gap-1">
          <Check className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
          <span>{t("freeCancel")}</span>
        </div>
        <span className="text-border">•</span>
        <div className="flex items-center gap-1">
          <Check className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
          <span>{t("proDriver")}</span>
        </div>
      </div>
    </div>
  );
});

HeroHeader.displayName = "HeroHeader";
