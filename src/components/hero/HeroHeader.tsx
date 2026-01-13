import { memo } from "react";
import { motion } from "framer-motion";
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
    <motion.div 
      className="mb-5"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo + Title Row */}
      <div className="flex items-start gap-3 mb-4">
        <motion.img 
          src={meetTransferLogo} 
          alt="Meet Transfer" 
          width={56}
          height={56}
          loading="eager"
          className="h-14 w-14 rounded-xl object-cover shadow-xl ring-2 ring-primary/30"
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        />
        <div className="flex-1">
          <motion.h1 
            className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {language === 'TR' ? (
              <>
                <span className="text-primary">Lüks VIP</span> Transfer
              </>
            ) : (
              <>
                <span className="text-primary">Premium VIP</span> Transfer
              </>
            )}
          </motion.h1>
          <motion.p 
            className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
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
          </motion.p>
        </div>
      </div>
      
      {/* Trust Badges Row */}
      <motion.div 
        className="flex items-center gap-2 mb-3 flex-wrap"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Check className="h-3 w-3 text-green-500" />
          <span>{language === 'TR' ? 'Sabit Fiyat' : 'Fixed Price'}</span>
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Check className="h-3 w-3 text-green-500" />
          <span>{language === 'TR' ? 'Ücretsiz İptal' : 'Free Cancellation'}</span>
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Check className="h-3 w-3 text-green-500" />
          <span>{language === 'TR' ? 'Profesyonel Şoför' : 'Pro Chauffeur'}</span>
        </div>
      </motion.div>
      
      {/* Vehicle Fleet Showcase */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {VEHICLE_TYPES.slice(0, 4).map((vehicle, index) => (
          <motion.div
            key={vehicle.value}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 * index + 0.5, duration: 0.3, type: "spring" }}
            whileHover={{ scale: 1.05, y: -2 }}
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
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

HeroHeader.displayName = "HeroHeader";
