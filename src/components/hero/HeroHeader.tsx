import { memo } from "react";
import { Shield, Zap, Star, Check } from "lucide-react";
import { VEHICLE_TYPES } from "@/lib/vehicleTypes";

// Vehicle images
import vitoImg from "@/assets/vito-1.jpg";
import vitoVipImg from "@/assets/vito-vip-1.jpg";
import maybachImg from "@/assets/maybach-1.jpg";
import sprinterImg from "@/assets/sprinter-1.jpg";
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";

const vehicleImages: Record<string, string> = {
  'mercedes-vito': vitoImg,
  'vip-mercedes': vitoVipImg,
  'maybach-minibus': maybachImg,
  'sprinter-minibus': sprinterImg,
  'minibus': sprinterImg,
};

interface HeroHeaderProps {
  language: string;
}

export const HeroHeader = memo(({ language }: HeroHeaderProps) => {
  return (
    <div className="mb-3 md:mb-5">
      {/* Compact Header Row - Logo, Title, Badges all in one line on mobile */}
      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
        <img 
          src={meetTransferLogo} 
          alt="Meet Transfer" 
          width={40}
          height={40}
          loading="eager"
          className="h-8 w-8 md:h-12 md:w-12 rounded-lg object-cover shadow-lg ring-1 ring-primary/30 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-base md:text-xl lg:text-2xl font-bold text-foreground leading-tight whitespace-nowrap">
              {language === 'TR' ? (
                <><span className="text-primary">Lüks</span> Transfer</>
              ) : (
                <><span className="text-primary">VIP</span> Transfer</>
              )}
            </h1>
            {/* Inline badges on mobile */}
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[8px] md:text-[10px] font-medium">
                <Shield className="h-2.5 w-2.5 md:h-3 md:w-3" />
                <span className="hidden xs:inline">{language === 'TR' ? 'Güvenli' : 'Safe'}</span>
              </span>
              <span className="inline-flex items-center gap-0.5 bg-accent/10 text-accent rounded-full px-1.5 py-0.5 text-[8px] md:text-[10px] font-medium">
                <Zap className="h-2.5 w-2.5 md:h-3 md:w-3" />
                <span className="hidden xs:inline">{language === 'TR' ? 'Hızlı' : 'Fast'}</span>
              </span>
              <span className="inline-flex items-center gap-0.5 bg-yellow-500/10 text-yellow-600 rounded-full px-1.5 py-0.5 text-[8px] md:text-[10px] font-medium">
                <Star className="h-2.5 w-2.5 md:h-3 md:w-3 fill-current" />
                4.9
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust Badges Row - More compact */}
      <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] text-muted-foreground">
        <div className="flex items-center gap-0.5">
          <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-green-500" />
          <span>{language === 'TR' ? 'Sabit Fiyat' : 'Fixed Price'}</span>
        </div>
        <span className="text-border">•</span>
        <div className="flex items-center gap-0.5">
          <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-green-500" />
          <span>{language === 'TR' ? 'Ücretsiz İptal' : 'Free Cancel'}</span>
        </div>
        <span className="text-border">•</span>
        <div className="flex items-center gap-0.5">
          <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-green-500" />
          <span>{language === 'TR' ? 'Pro Şoför' : 'Pro'}</span>
        </div>
      </div>
    </div>
  );
});

HeroHeader.displayName = "HeroHeader";
