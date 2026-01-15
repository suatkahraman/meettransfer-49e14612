import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Briefcase, Star, Check, ChevronLeft, ChevronRight, Snowflake, Wifi, Sparkles, Crown, Tv, TrendingDown, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES, getAvailableVehicles, VehicleTypeInfo } from "@/lib/vehicleTypes";

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

// Icon mapping for features
const featureIcons: Record<string, React.ReactNode> = {
  snowflake: <Snowflake className="h-3 w-3" />,
  wifi: <Wifi className="h-3 w-3" />,
  sparkles: <Sparkles className="h-3 w-3" />,
  stars: <Star className="h-3 w-3" />,
  crown: <Crown className="h-3 w-3" />,
  tv: <Tv className="h-3 w-3" />,
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
  lowestPrice,
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
  lowestPrice?: number;
  hasReturnTrip?: boolean;
  returnDiscountPercentage?: number;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const currencySymbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
  const isTurkish = language === "TR";

  const nextImage = () => {
    setImageIndex((prev) => (prev + 1) % Math.min(vehicle.images.length, 3));
  };

  const prevImage = () => {
    setImageIndex((prev) => (prev - 1 + Math.min(vehicle.images.length, 3)) % Math.min(vehicle.images.length, 3));
  };

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
  
  // Calculate price difference from lowest
  const priceDiff = price && lowestPrice ? price - lowestPrice : 0;

  return (
    <div
      className={cn(
        "relative bg-background rounded-xl border overflow-hidden cursor-pointer transition-all group",
        isSelected 
          ? "border-primary ring-2 ring-primary/20 shadow-lg" 
          : "border-border hover:border-primary/50 hover:shadow-md",
        isPopular && !isSelected && "border-amber-500/50 ring-1 ring-amber-500/20"
      )}
      onClick={onSelect}
    >
      {/* Badge Stack - Top Left */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {/* Most Popular Badge */}
        {isPopular && (
          <div className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1">
            <Award className="h-2.5 w-2.5" />
            {isTurkish ? "En Popüler" : "Most Popular"}
          </div>
        )}
        
        {/* Recommended Badge */}
        {isRecommended && !isPopular && (
          <div className="px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center gap-1">
            <Star className="h-2.5 w-2.5 fill-current" />
            {isTurkish ? "Önerilen" : "Recommended"}
          </div>
        )}

        {/* Best Value Badge */}
        {isBestValue && (
          <div className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1">
            <TrendingDown className="h-2.5 w-2.5" />
            {isTurkish ? "En Uygun" : "Best Value"}
          </div>
        )}
      </div>

      {/* Selected Check */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}

      {/* Image Carousel - Compact */}
      <div className="relative h-28 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={imageIndex}
            src={vehicle.images[imageIndex]?.src}
            alt={vehicle.images[imageIndex]?.alt || vehicle.label}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>
        
        {/* Navigation Arrows */}
        {vehicle.images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity"
            >
              <ChevronRight className="h-3.5 w-3.5 text-white" />
            </button>
          </>
        )}

        {/* Image Dots */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {vehicle.images.slice(0, 3).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === imageIndex ? "bg-white w-3" : "bg-white/50"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Vehicle Name */}
        <h4 className="font-bold text-sm leading-tight">{vehicle.label}</h4>
        
        {/* Capacity */}
        <div className="flex items-center gap-4 mt-2 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {vehicle.passengers}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            {vehicle.luggage}
          </span>
        </div>

        {/* Key Features - Just icons */}
        <div className="flex items-center gap-1.5 mt-2">
          {vehicle.features.slice(0, 4).map((feature, i) => (
            <div 
              key={i}
              className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              title={language === "TR" ? feature.labelTr : feature.label}
            >
              {featureIcons[feature.icon] || <Sparkles className="h-3 w-3" />}
            </div>
          ))}
        </div>

        {/* Price Section with Comparison */}
        {price !== undefined && (
          <div className="mt-3 pt-3 border-t border-border">
            {hasReturnTrip ? (
              // Show total with return trip breakdown
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{isTurkish ? "Gidiş" : "Outbound"}</span>
                  <span>{currencySymbol}{displayPrice || price}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {isTurkish ? "Dönüş" : "Return"} 
                    <span className="text-[10px] bg-green-500/10 text-green-600 px-1 rounded">-{returnDiscountPercentage}%</span>
                  </span>
                  <span className="text-green-600">{currencySymbol}{returnPrice}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-border">
                  <span className="font-semibold text-sm">{isTurkish ? "Toplam" : "Total"}</span>
                  <span className="font-bold text-primary text-lg">{currencySymbol}{totalPrice}</span>
                </div>
              </div>
            ) : (
              // Original single-trip view
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  {originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {currencySymbol}{originalPrice}
                    </span>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-primary text-lg">
                      {currencySymbol}{displayPrice}
                    </span>
                    {discountPercentage && (
                      <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-bold rounded">
                        -{discountPercentage}%
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Price comparison indicator */}
                {priceDiff > 0 && lowestPrice && (
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground">
                      +{currencySymbol}{priceDiff}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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
  const currencySymbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
  const availableVehicles = getAvailableVehicles(passengers, passengers);
  const isTurkish = language === "TR";

  // Get recommended vehicle - Vito for standard, Sprinter for 7+
  const recommendedVehicle = passengers >= 7 ? "minibus" : "mercedes-vito";
  
  // Most popular vehicle - VIP Mercedes for 1-6, Sprinter for 7+
  const popularVehicle = passengers >= 7 ? "minibus" : "vip-mercedes";
  
  // Find lowest price for comparison
  const lowestPrice = prices ? Math.min(...Object.values(prices).filter(p => p > 0)) : undefined;
  
  // Best value is the lowest priced vehicle
  const bestValueVehicle = prices 
    ? Object.entries(prices).reduce((a, b) => b[1] < a[1] ? b : a)?.[0]
    : "mercedes-vito";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-3"
    >
      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-muted-foreground font-medium">
          {isTurkish 
            ? `${passengers >= 7 ? "7+ yolcu için araç:" : "Araç seçeneklerimiz:"}` 
            : `${passengers >= 7 ? "For 7+ passengers:" : "Our vehicle options:"}`
          }
        </div>
        {showPriceComparison && prices && Object.keys(prices).length > 1 && (
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {isTurkish ? "Fiyatları karşılaştırın" : "Compare prices"}
          </span>
        )}
      </div>
      
      <div className={cn(
        "grid gap-3",
        availableVehicles.length === 1 ? "grid-cols-1" : "grid-cols-2"
      )}>
        {availableVehicles.map((vehicle) => (
          <div key={vehicle.value}>
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
              lowestPrice={showPriceComparison ? lowestPrice : undefined}
              hasReturnTrip={hasReturnTrip}
              returnDiscountPercentage={returnDiscountPercentage}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
});

export default ChatVehicleCards;
