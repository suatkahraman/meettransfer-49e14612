import { memo } from "react";
import { motion } from "framer-motion";
import { Shield, Star, Check } from "lucide-react";

interface HeroTrustBadgesProps {
  language: string;
}

export const HeroTrustBadges = memo(({ language }: HeroTrustBadgesProps) => {
  return (
    <motion.div 
      className="flex flex-wrap items-center justify-center gap-3 mt-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <motion.div 
        className="flex items-center gap-1.5 bg-green-500/10 rounded-full px-3 py-1.5"
        whileHover={{ scale: 1.05 }}
      >
        <Shield className="h-3.5 w-3.5 text-green-500" />
        <span className="text-xs font-medium text-green-600">
          {language === 'TR' ? 'Ücretsiz İptal' : 'Free Cancellation'}
        </span>
      </motion.div>
      <motion.div 
        className="flex items-center gap-1.5 bg-yellow-500/10 rounded-full px-3 py-1.5"
        whileHover={{ scale: 1.05 }}
      >
        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
        <span className="text-xs font-medium text-yellow-600">4.9/5 (2,500+)</span>
      </motion.div>
      <motion.div 
        className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5"
        whileHover={{ scale: 1.05 }}
      >
        <Check className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-primary">
          {language === 'TR' ? 'Sabit Fiyat' : 'Fixed Price'}
        </span>
      </motion.div>
    </motion.div>
  );
});

HeroTrustBadges.displayName = "HeroTrustBadges";
