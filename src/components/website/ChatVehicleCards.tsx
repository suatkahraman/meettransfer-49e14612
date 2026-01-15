import { memo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Users, Briefcase, Star, Check, TrendingDown, Award, ChevronLeft, ChevronRight } from "lucide-react";
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
        "relative bg-background rounded-lg border overflow-hidden cursor-pointer transition-colors group aspect-square flex flex-col min-w-0",
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
  const [currentPage, setCurrentPage] = useState(0);
  
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

  // Carousel logic - 2 vehicles per page
  const vehiclesPerPage = 2;
  const totalPages = Math.ceil(displayVehicles.length / vehiclesPerPage);
  const showCarousel = displayVehicles.length > vehiclesPerPage;
  
  // Get current page vehicles
  const currentVehicles = showCarousel 
    ? displayVehicles.slice(currentPage * vehiclesPerPage, (currentPage + 1) * vehiclesPerPage)
    : displayVehicles;

  // Swipe handling
  const x = useMotionValue(0);
  const dragThreshold = 50;

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -dragThreshold || velocity < -500) {
      // Swipe left - next page
      if (currentPage < totalPages - 1) {
        triggerHaptic('light');
        setCurrentPage(prev => prev + 1);
      }
    } else if (offset > dragThreshold || velocity > 500) {
      // Swipe right - previous page
      if (currentPage > 0) {
        triggerHaptic('light');
        setCurrentPage(prev => prev - 1);
      }
    }
  }, [currentPage, totalPages]);

  const goToPage = useCallback((page: number) => {
    triggerHaptic('light');
    setCurrentPage(page);
  }, []);

  // Auto-scroll to selected vehicle's page
  useEffect(() => {
    if (selectedVehicle && showCarousel) {
      const vehicleIndex = displayVehicles.findIndex(v => v.value === selectedVehicle);
      if (vehicleIndex >= 0) {
        const targetPage = Math.floor(vehicleIndex / vehiclesPerPage);
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
        }
      }
    }
  }, [selectedVehicle, displayVehicles, showCarousel, vehiclesPerPage, currentPage]);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-muted-foreground font-medium">
          {isTurkish 
            ? `${passengers >= 7 ? "7+ yolcu:" : "Araç seçin:"}` 
            : `${passengers >= 7 ? "7+ passengers:" : "Select vehicle:"}`
          }
        </div>
        {/* Page indicator */}
        {showCarousel && (
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-200",
                  idx === currentPage 
                    ? "bg-primary w-3" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        {/* Navigation Arrows - Desktop only */}
        {showCarousel && (
          <>
            <button
              onClick={() => currentPage > 0 && goToPage(currentPage - 1)}
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center transition-opacity hidden md:flex",
                currentPage === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-muted"
              )}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => currentPage < totalPages - 1 && goToPage(currentPage + 1)}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center transition-opacity hidden md:flex",
                currentPage === totalPages - 1 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-muted"
              )}
              disabled={currentPage === totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Swipeable Cards Container */}
        <motion.div
          drag={showCarousel ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="touch-pan-y"
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentPage}
              className="grid grid-cols-2 gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentVehicles.map((vehicle) => (
                <ChatVehicleCard
                  key={vehicle.value}
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
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Swipe hint - Mobile only */}
        {showCarousel && currentPage === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-muted-foreground md:hidden"
          >
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: 3, duration: 0.6 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
});

export default ChatVehicleCards;