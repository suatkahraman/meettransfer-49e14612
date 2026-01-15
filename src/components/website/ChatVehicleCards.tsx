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
        "relative bg-background rounded-lg border overflow-hidden cursor-pointer transition-all group aspect-square flex flex-col",
        isSelected 
          ? "border-primary ring-2 ring-primary/20 shadow-lg" 
          : "border-border hover:border-primary/50 hover:shadow-md",
        isPopular && !isSelected && "border-primary/50 ring-1 ring-primary/20"
      )}
      onClick={onSelect}
    >
      {/* Badge Stack - Top Left */}
      <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-0.5">
        {/* Most Popular Badge */}
        {isPopular && (
          <div className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full flex items-center gap-0.5">
            <Award className="h-2 w-2" />
            {isTurkish ? "Popüler" : "Popular"}
          </div>
        )}
        
        {/* Recommended Badge */}
        {isRecommended && !isPopular && (
          <div className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full flex items-center gap-0.5">
            <Star className="h-2 w-2 fill-current" />
            {isTurkish ? "Önerilen" : "Best"}
          </div>
        )}

        {/* Best Value Badge */}
        {isBestValue && (
          <div className="px-1.5 py-0.5 bg-green-500 text-white text-[8px] font-bold rounded-full flex items-center gap-0.5">
            <TrendingDown className="h-2 w-2" />
            {isTurkish ? "Uygun" : "Value"}
          </div>
        )}
      </div>

      {/* Selected Check */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}

      {/* Image - Square aspect */}
      <div className="relative h-20 overflow-hidden flex-shrink-0">
        <img
          src={vehicle.images[0]?.src}
          alt={vehicle.images[0]?.alt || vehicle.label}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-2 flex-1 flex flex-col">
        {/* Vehicle Name */}
        <h4 className="font-bold text-xs leading-tight line-clamp-1">{vehicle.label}</h4>
        
        {/* Capacity */}
        <div className="flex items-center gap-2 mt-1 text-muted-foreground text-[10px]">
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {vehicle.passengers}
          </span>
          <span className="flex items-center gap-0.5">
            <Briefcase className="h-3 w-3" />
            {vehicle.luggage}
          </span>
        </div>

        {/* Price Section - Compact */}
        {price !== undefined && (
          <div className="mt-auto pt-1.5 border-t border-border">
            {hasReturnTrip ? (
              <div className="text-center">
                <span className="font-bold text-primary text-sm">{currencySymbol}{totalPrice}</span>
                <span className="text-[9px] text-muted-foreground ml-1">{isTurkish ? "toplam" : "total"}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1">
                {originalPrice && (
                  <span className="text-[10px] text-muted-foreground line-through">
                    {currencySymbol}{originalPrice}
                  </span>
                )}
                <span className="font-bold text-primary text-sm">
                  {currencySymbol}{displayPrice}
                </span>
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
    <div className="mt-4 space-y-3">
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
    </div>
  );
});

export default ChatVehicleCards;
