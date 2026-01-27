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
      {/* Horizontal layout - Logo left, Title & Badges right */}
      <div className="flex items-center gap-4">
        {/* Logo */}
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
          className="h-14 w-14 md:h-18 md:w-18 lg:h-20 lg:w-20 rounded-xl object-cover shadow-xl ring-2 ring-primary/40 flex-shrink-0"
        />
        
        {/* Title & Badges */}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
            <span className="text-primary">Meet</span> Transfer
          </h1>
          
          {/* Trust Badges - Horizontal */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-1">
              <Check className="h-3 w-3 text-primary" />
              <span className="text-[10px] md:text-xs font-medium text-primary">{t("fixedPrice")}</span>
            </div>
            <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-1">
              <Check className="h-3 w-3 text-primary" />
              <span className="text-[10px] md:text-xs font-medium text-primary">{t("freeCancel")}</span>
            </div>
            <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-1">
              <Check className="h-3 w-3 text-primary" />
              <span className="text-[10px] md:text-xs font-medium text-primary">{t("proDriver")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

HeroHeader.displayName = "HeroHeader";
