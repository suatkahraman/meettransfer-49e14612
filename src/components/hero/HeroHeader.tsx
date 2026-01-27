import { memo } from "react";
import { Check, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Logo - inline for LCP optimization
import meetTransferLogo from "@/assets/meet-transfer-logo.webp";

interface HeroHeaderProps {
  language: string;
}

// Hardcoded rating to avoid API call blocking LCP
const CACHED_RATING = 4.7;

export const HeroHeader = memo(({ language }: HeroHeaderProps) => {
  const { t } = useLanguage();
  
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
          onError={(e) => {
            // Never block/blank the hero if the logo fails to load
            e.currentTarget.style.display = "none";
          }}
          className="h-8 w-8 md:h-12 md:w-12 rounded-lg object-cover shadow-lg ring-1 ring-primary/30 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight whitespace-nowrap" role="heading" aria-level={1}>
              <span className="text-primary">Meet</span> Transfer
            </div>
            {/* Rating badge - simple and clean */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">{CACHED_RATING}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust Badges Row - Simplified red/white */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2.5 py-1">
          <Check className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs md:text-sm font-medium text-primary">{t("fixedPrice")}</span>
        </div>
        <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2.5 py-1">
          <Check className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs md:text-sm font-medium text-primary">{t("freeCancel")}</span>
        </div>
        <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2.5 py-1">
          <Check className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs md:text-sm font-medium text-primary">{t("proDriver")}</span>
        </div>
      </div>
    </div>
  );
});

HeroHeader.displayName = "HeroHeader";
