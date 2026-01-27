import { memo } from "react";
import { Check } from "lucide-react";
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
      {/* Header Row - Logo left, Title center */}
      <div className="flex items-center gap-4 mb-3 md:mb-4">
        {/* Left - Large Logo */}
        <img 
          src={meetTransferLogo} 
          alt="Meet Transfer" 
          width={80}
          height={80}
          loading="eager"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 rounded-xl object-cover shadow-xl ring-2 ring-primary/40 flex-shrink-0"
        />
        {/* Center - Title */}
        <div className="flex-1 text-center">
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight" role="heading" aria-level={1}>
            <span className="text-primary">Meet</span> Transfer
          </div>
        </div>
      </div>
      
      {/* Trust Badges Row - Centered */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
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
