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
    <div className="mb-4 md:mb-5">
      {/* Logo + Title Row */}
      <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
        <img 
          src={meetTransferLogo} 
          alt="Meet Transfer" 
          width={48}
          height={48}
          loading="eager"
          className="h-10 w-10 md:h-14 md:w-14 rounded-lg md:rounded-xl object-cover shadow-xl ring-2 ring-primary/30"
        />
        <div className="flex-1">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-0.5 md:mb-1">
            {language === 'TR' ? (
              <>
                <span className="text-primary">Lüks VIP</span> Transfer
              </>
            ) : (
              <>
                <span className="text-primary">Premium VIP</span> Transfer
              </>
            )}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
              <Shield className="h-3 w-3" />
              {language === 'TR' ? 'Güvenli' : 'Safe'}
            </span>
            <span className="inline-flex items-center gap-1 bg-accent/10 text-accent rounded-full px-2 py-0.5 text-[10px] font-medium">
              <Zap className="h-3 w-3" />
              {language === 'TR' ? 'Hızlı' : 'Fast'}
            </span>
            <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-600 rounded-full px-2 py-0.5 text-[10px] font-medium">
              <Star className="h-3 w-3 fill-current" />
              4.9
            </span>
          </p>
        </div>
      </div>
      
      {/* Trust Badges Row - Horizontal scroll on mobile */}
      <div className="flex items-center gap-2 md:gap-2 mb-2 md:mb-3 overflow-x-auto scrollbar-none pb-1">
        <div className="flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[10px] text-muted-foreground whitespace-nowrap">
          <Check className="h-3 w-3 text-green-500" />
          <span>{language === 'TR' ? 'Sabit Fiyat' : 'Fixed Price'}</span>
        </div>
        <div className="w-px h-3 bg-border flex-shrink-0" />
        <div className="flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[10px] text-muted-foreground whitespace-nowrap">
          <Check className="h-3 w-3 text-green-500" />
          <span>{language === 'TR' ? 'Ücretsiz İptal' : 'Free Cancel'}</span>
        </div>
        <div className="w-px h-3 bg-border flex-shrink-0" />
        <div className="flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[10px] text-muted-foreground whitespace-nowrap">
          <Check className="h-3 w-3 text-green-500" />
          <span>{language === 'TR' ? 'Pro Şoför' : 'Pro Chauffeur'}</span>
        </div>
      </div>
      
      {/* Vehicle Fleet Showcase - Hidden on small mobile */}
      <div className="hidden xs:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {VEHICLE_TYPES.slice(0, 4).map((vehicle) => (
          <div
            key={vehicle.value}
            className="flex-shrink-0"
          >
            <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm rounded-full pl-1 pr-2.5 py-1 border border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-default">
              <div className="relative">
                <img 
                  src={vehicleImages[vehicle.value]} 
                  alt={vehicle.label}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
              </div>
              <span className="text-[10px] font-medium text-foreground whitespace-nowrap">
                {vehicle.label.split(' ').pop()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

HeroHeader.displayName = "HeroHeader";
