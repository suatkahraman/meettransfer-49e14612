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
      {/* Logo - Left aligned */}
      <div className="flex justify-start mb-3 md:mb-4">
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
          className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 rounded-xl object-cover shadow-xl ring-2 ring-primary/40"
        />
      </div>
      
      {/* Title - Centered */}
      <div className="text-center mb-3 md:mb-4">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
          <span className="text-primary">Meet</span> Transfer
        </h1>
      </div>
      
      {/* Trust Badges Row - Centered with consistent spacing */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-xs md:text-sm font-medium text-primary">{t("fixedPrice")}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-xs md:text-sm font-medium text-primary">{t("freeCancel")}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-xs md:text-sm font-medium text-primary">{t("proDriver")}</span>
        </div>
      </div>
    </div>
  );
});

HeroHeader.displayName = "HeroHeader";
