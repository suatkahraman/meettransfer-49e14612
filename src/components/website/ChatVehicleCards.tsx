import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Briefcase, Star, Check, TrendingDown, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES, VehicleTypeInfo } from "@/lib/vehicleTypes";

interface ChatVehicleCardsProps {
  passengers: number;
  prices?: Record<string, number>;
  currency?: string;
  selectedVehicle?: string;
  onSelectVehicle?: (vehicleType: string) => void;
  language: string;
  compact?: boolean;
  discountPercentage?: number;
  showPriceComparison?: boolean;
  hasReturnTrip?: boolean;
  returnDiscountPercentage?: number;
}

// Haptic feedback helper
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30]
    };
    navigator.vibrate(patterns[type]);
  }
};

const ChatVehicleCard = memo(function ChatVehicleCard({
  vehicle,
  price,
  currency = "EUR",
  isSelected,
  onSelect,
  language,
  discountPercentage,
  isRecommended,
  isPopular,
  isBestValue,
  hasReturnTrip = false,
  returnDiscountPercentage = 25,
}: {
  vehicle: VehicleTypeInfo;
  price?: number;
  currency?: string;
  isSelected?: boolean;
  onSelect?: () => void;
  language: string;
  discountPercentage?: number;
  isRecommended?: boolean;
  isPopular?: boolean;
  isBestValue?: boolean;
  hasReturnTrip?: boolean;
  returnDiscountPercentage?: number;
}) {
  const currencySymbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
  const isTurkish = language === "TR";

  const displayPrice = discountPercentage && price 
    ? Math.round(price * (1 - discountPercentage / 100)) 
    : price;
  const originalPrice = discountPercentage && price ? price : null;
  
  // Calculate return trip price with discount
  const returnPrice = hasReturnTrip && price 
    ? Math.round(price * (1 - returnDiscountPercentage / 100)) 
    : 0;
  
  // Calculate total price (outbound + discounted return)
  const totalPrice = hasReturnTrip && price 
    ? (displayPrice || price) + returnPrice 
    : displayPrice || price || 0;

  const handleClick = useCallback(() => {
    triggerHaptic(isSelected ? 'light' : 'medium');
    onSelect?.();
  }, [isSelected, onSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative bg-background rounded-lg border overflow-hidden cursor-pointer transition-colors group aspect-square flex flex-col",
        isSelected 
          ? "border-primary ring-2 ring-primary/30 shadow-lg" 
          : "border-border hover:border-primary/50 hover:shadow-md",
        isPopular && !isSelected && "border-primary/50 ring-1 ring-primary/20"
      )}
      onClick={handleClick}
    >
      {/* Selection animation overlay */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 500 }}
            className="absolute inset-0 bg-primary/5 z-0"
          />
        )}
      </AnimatePresence>

      {/* Badge Stack - Top Left */}
      <div className="absolute top-1 left-1 z-10 flex flex-col gap-0.5">
        {/* Most Popular Badge */}
        {isPopular && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="px-1 py-0.5 bg-primary text-primary-foreground text-[7px] font-bold rounded-full flex items-center gap-0.5"
          >
            <Award className="h-2 w-2" />
            {isTurkish ? "Pop" : "Top"}
          </motion.div>
        )}
        
        {/* Recommended Badge */}
        {isRecommended && !isPopular && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="px-1 py-0.5 bg-primary text-primary-foreground text-[7px] font-bold rounded-full flex items-center gap-0.5"
          >
            <Star className="h-2 w-2 fill-current" />
            {isTurkish ? "Öner" : "Best"}
          </motion.div>
        )}

        {/* Best Value Badge */}
        {isBestValue && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="px-1 py-0.5 bg-green-500 text-white text-[7px] font-bold rounded-full flex items-center gap-0.5"
          >
            <TrendingDown className="h-2 w-2" />
            {isTurkish ? "₺" : "€"}
          </motion.div>
        )}
      </div>

      {/* Selected Check with animation */}
      <AnimatePresence>
        {isSelected && (
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute top-1 right-1 z-10 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg"
          >
            <Check className="h-3 w-3 text-primary-foreground" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image - Square aspect */}
      <div className="relative h-16 overflow-hidden flex-shrink-0">
        <motion.img
          src={vehicle.images[0]?.src}
          alt={vehicle.images[0]?.alt || vehicle.label}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Content */}
      <div className="p-1.5 flex-1 flex flex-col relative z-10">
        {/* Vehicle Name */}
        <h4 className="font-bold text-[10px] leading-tight line-clamp-1">{vehicle.label}</h4>
        
        {/* Capacity */}
        <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground text-[8px]">
          <span className="flex items-center gap-0.5">
            <Users className="h-2.5 w-2.5" />
            {vehicle.passengers}
          </span>
          <span className="flex items-center gap-0.5">
            <Briefcase className="h-2.5 w-2.5" />
            {vehicle.luggage}
          </span>
        </div>

        {/* Price Section - Compact */}
        {price !== undefined && (
          <div className="mt-auto pt-1 border-t border-border">
            {hasReturnTrip ? (
              <div className="text-center">
                <span className="font-bold text-primary text-xs">{currencySymbol}{totalPrice}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-0.5">
                {originalPrice && (
                  <span className="text-[8px] text-muted-foreground line-through">
                    {currencySymbol}{originalPrice}
                  </span>
                )}
                <span className="font-bold text-primary text-xs">
                  {currencySymbol}{displayPrice}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export const ChatVehicleCards = memo(function ChatVehicleCards({
  passengers,
  prices,
  currency = "EUR",
  selectedVehicle,
  onSelectVehicle,
  language,
  compact = true,
  discountPercentage,
  showPriceComparison = true,
  hasReturnTrip = false,
  returnDiscountPercentage = 25,
}: ChatVehicleCardsProps) {
  const isTurkish = language === "TR";

  // Always show exactly 4 vehicles for 1-6 passengers: sedan, vito, vip, maybach
  // For 7+ passengers, show only minibus
  const displayVehicles = passengers >= 7 
    ? VEHICLE_TYPES.filter(v => v.value === 'minibus')
    : VEHICLE_TYPES.filter(v => ['sedan', 'mercedes-vito', 'vip-mercedes', 'maybach-minibus'].includes(v.value));

  // Get recommended vehicle - Vito for standard, Sprinter for 7+
  const recommendedVehicle = passengers >= 7 ? "minibus" : "mercedes-vito";
  
  // Most popular vehicle - VIP Mercedes for 1-6, Sprinter for 7+
  const popularVehicle = passengers >= 7 ? "minibus" : "vip-mercedes";
  
  // Find lowest price for comparison
  const lowestPrice = prices ? Math.min(...Object.values(prices).filter(p => p > 0)) : undefined;
  
  // Best value is the lowest priced vehicle
  const bestValueVehicle = prices 
    ? Object.entries(prices).reduce((a, b) => b[1] < a[1] ? b : a)?.[0]
    : "sedan";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-muted-foreground font-medium">
          {isTurkish 
            ? `${passengers >= 7 ? "7+ yolcu:" : "Araç seçin:"}` 
            : `${passengers >= 7 ? "7+ passengers:" : "Select vehicle:"}`
          }
        </div>
      </div>
      
      <motion.div 
        className="grid grid-cols-2 gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
      >
        {displayVehicles.map((vehicle) => (
          <motion.div 
            key={vehicle.value}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <ChatVehicleCard
              vehicle={vehicle}
              price={prices?.[vehicle.value]}
              currency={currency}
              isSelected={selectedVehicle === vehicle.value}
              onSelect={() => onSelectVehicle?.(vehicle.value)}
              language={language}
              discountPercentage={discountPercentage}
              isRecommended={vehicle.value === recommendedVehicle}
              isPopular={vehicle.value === popularVehicle}
              isBestValue={showPriceComparison && vehicle.value === bestValueVehicle}
              hasReturnTrip={hasReturnTrip}
              returnDiscountPercentage={returnDiscountPercentage}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
});

export default ChatVehicleCards;