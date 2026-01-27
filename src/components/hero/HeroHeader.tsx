import { memo } from "react";
import { Shield, Zap, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Logo - inline for LCP optimization
import meetTransferLogo from "@/assets/meet-transfer-logo.webp";

interface HeroHeaderProps {
  language: string;
}

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
            {/* Compact badges */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs md:text-sm font-medium">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">{t("safe")}</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-accent/10 text-accent rounded-full px-2 py-0.5 text-xs md:text-sm font-medium">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">{t("fast")}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust Badges Row - Prominent */}
      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 rounded-full px-3 py-1.5">
          <Check className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
          <span className="text-[13px] md:text-sm font-semibold text-green-600 dark:text-green-400">{t("fixedPrice")}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/15 border border-primary/30 rounded-full px-3 py-1.5">
          <Check className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <span className="text-[13px] md:text-sm font-semibold text-primary">{t("freeCancel")}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-accent/15 border border-accent/30 rounded-full px-3 py-1.5">
          <Check className="h-4 w-4 md:h-5 md:w-5 text-accent" />
          <span className="text-[13px] md:text-sm font-semibold text-accent">{t("proDriver")}</span>
        </div>
      </div>
    </div>
  );
});

HeroHeader.displayName = "HeroHeader";
