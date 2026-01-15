import { memo, useCallback } from "react";
import { Users, Briefcase, Check } from "lucide-react";
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
    triggerHaptic('medium');
    onSelect?.();
  }, [onSelect]);

  return (
    <div
      className={cn(
        "relative bg-background rounded-lg border overflow-hidden cursor-pointer transition-all duration-150 group aspect-square flex flex-col",
        isSelected
          ? "border-foreground/20 bg-muted shadow-sm"
          : "border-border hover:border-foreground/10 hover:shadow-sm active:scale-[0.98]"
      )}
      onClick={handleClick}
    >
      {/* Selected Check - Top Left */}

      {/* Selected Check */}
      {isSelected && (
        <div className="absolute top-1 right-1 z-10 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}

      {/* Image - Square aspect */}
      <div className="relative h-16 overflow-hidden flex-shrink-0">
        <img
          src={vehicle.images[0]?.src}
          alt={vehicle.images[0]?.alt || vehicle.label}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-1.5 flex-1 flex flex-col">
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
                <span className="font-bold text-foreground text-xs">{currencySymbol}{totalPrice}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-0.5">
                {originalPrice && (
                  <span className="text-[8px] text-muted-foreground line-through">
                    {currencySymbol}{originalPrice}
                  </span>
                )}
                <span className="font-bold text-foreground text-xs">
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
  const isTurkish = language === "TR";

  // Always show exactly 4 vehicles for 1-6 passengers: sedan, vito, vip, maybach
  // For 7+ passengers, show only minibus
  const displayVehicles = passengers >= 7
    ? VEHICLE_TYPES.filter(v => v.value === 'minibus')
    : VEHICLE_TYPES.filter(v => ['sedan', 'mercedes-vito', 'vip-mercedes', 'maybach-minibus'].includes(v.value));

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
      
      {/* 2x2 Grid - Always show all 4 vehicles */}
      <div className="grid grid-cols-2 gap-2">
        {displayVehicles.map((vehicle) => (
          <div key={vehicle.value}>
            <ChatVehicleCard
              vehicle={vehicle}
              price={prices?.[vehicle.value]}
              currency={currency}
              isSelected={selectedVehicle === vehicle.value}
              onSelect={() => onSelectVehicle?.(vehicle.value)}
              language={language}
              discountPercentage={discountPercentage}
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