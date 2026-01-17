import { memo, lazy, Suspense, useState, useCallback, useRef, useMemo } from "react";
import { Users, Check, Briefcase, Snowflake, Wifi, Star, Tv, Crown, Armchair, Sparkles, Wine, Droplets, Luggage, BatteryCharging } from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES, VehicleTypeInfo } from "@/lib/vehicleTypes";
import { DUBAI_VEHICLE_TYPES } from "@/lib/dubaiVehicleTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { VehiclePrice } from "./types";

// Feature icon mapping - extended for Dubai vehicles
const featureIcons: Record<string, React.ElementType> = {
  'snowflake': Snowflake,
  'armchair': Armchair,
  'wifi': Wifi,
  'stars': Star,
  'tv': Tv,
  'crown': Crown,
  'sparkles': Sparkles,
  'wine': Wine,
  'droplets': Droplets,
  'luggage': Luggage,
  'battery-charging': BatteryCharging,
};

// Vehicle images
import vitoImg from "@/assets/vito-1.jpg";
import vitoVipImg from "@/assets/vito-vip-1.jpg";
import maybachImg from "@/assets/maybach-1.jpg";
import sprinterImg from "@/assets/sprinter-1.jpg";
import sedanImg from "@/assets/sedan-airport-1.jpg";

// Dubai vehicle images
import dubaiSedanImg from "@/assets/dubai/dubai-sedan-private.jpg";
import dubaiSuburbanImg from "@/assets/dubai/dubai-suburban.jpg";
import dubaiVipVanImg from "@/assets/dubai/dubai-vip-mercedes-van.jpg";
import dubaiVClassImg from "@/assets/dubai/dubai-v-class.jpg";

// Lazy load heavy components
const VehicleImageCarousel = lazy(() => import("@/components/website/VehicleImageCarousel").then(m => ({ default: m.VehicleImageCarousel })));

const vehicleImages: Record<string, string> = {
  'sedan': sedanImg,
  'mercedes-vito': vitoImg,
  'vip-mercedes': vitoVipImg,
  'maybach-minibus': maybachImg,
  'sprinter-minibus': sprinterImg,
  'minibus': sprinterImg,
  // Dubai vehicles - matching DUBAI_VEHICLE_TYPES values
  'dubai-private-sedan': dubaiSedanImg,
  'dubai-premium-van': dubaiVClassImg,
  'dubai-suburban-suv': dubaiSuburbanImg,
  'dubai-vip-sprinter': dubaiVipVanImg,
};

interface VehicleSelectorProps {
  selectedVehicle: string;
  onSelectVehicle: (value: string) => void;
  passengers: string;
  prices: VehiclePrice[];
  loadingPrices: boolean;
  hasRoute: boolean;
  language: string;
  currency?: string;
  isDubai?: boolean; // Use isDubai from edge function instead of local detection
}

export const VehicleSelector = memo(({
  selectedVehicle,
  onSelectVehicle,
  passengers,
  prices,
  loadingPrices,
  hasRoute,
  language,
  currency = "EUR",
  isDubai = false
}: VehicleSelectorProps) => {
  const [hoveredVehicle, setHoveredVehicle] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use isDubai prop from edge function - this is the authoritative source
  const vehicleList: VehicleTypeInfo[] = useMemo(() => {
    return isDubai ? DUBAI_VEHICLE_TYPES : VEHICLE_TYPES;
  }, [isDubai]);

  // Simple click handler
  const handleVehicleClick = useCallback((vehicle: VehicleTypeInfo, isDisabled: boolean) => {
    if (isDisabled) return;
    onSelectVehicle(vehicle.value);
  }, [onSelectVehicle]);

  // Hover handlers for desktop carousel
  const handleMouseEnter = useCallback((vehicleValue: string) => {
    setHoveredVehicle(vehicleValue);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredVehicle(null);
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {vehicleList.map((vehicle, index) => {
        const vehiclePrice = prices.find(v => v.vehicleType === vehicle.value);
        const isSelected = selectedVehicle === vehicle.value;
        const isDisabled = vehicle.passengers < parseInt(passengers);
        const isHovered = hoveredVehicle === vehicle.value;
        
        return (
          <div 
            key={vehicle.value}
            className="relative"
            data-vehicle-card
            onMouseEnter={() => handleMouseEnter(vehicle.value)}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => handleVehicleClick(vehicle, isDisabled)}
              disabled={isDisabled}
              className={cn(
                "w-full rounded-xl border-2 p-3 sm:p-2.5 text-center overflow-hidden",
                "transition-all duration-200 ease-out select-none",
                "active:scale-[0.97] active:opacity-90",
                "shadow-sm hover:shadow-md",
                isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                isSelected 
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-primary/20" 
                  : "border-border bg-card hover:border-primary/50 active:border-primary"
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Vehicle Image - Square aspect ratio with carousel */}
              <div className="w-full aspect-[4/3] sm:aspect-square rounded-lg overflow-hidden mb-2 sm:mb-2 bg-muted relative">
                <Suspense fallback={
                  <img 
                    src={vehicleImages[vehicle.value]} 
                    alt={vehicle.label}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                }>
                  <VehicleImageCarousel
                    images={vehicle.images.slice(0, 4).map(img => img.src)}
                    alt={vehicle.label}
                    className="w-full h-full"
                    interval={4000}
                    isHovered={isHovered}
                  />
                </Suspense>
                
                {/* Selected Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/25 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Vehicle Name - Full label */}
              <div className="text-sm sm:text-sm font-bold truncate mb-1.5 pointer-events-none text-foreground leading-tight">
                {vehicle.label}
              </div>
              
              {/* Feature Icons Row */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-1.5 mb-1.5 pointer-events-none">
                {vehicle.features.slice(0, 3).map((feature, idx) => {
                  const IconComponent = featureIcons[feature.icon];
                  return IconComponent ? (
                    <div 
                      key={idx} 
                      className="w-5 h-5 sm:w-5 sm:h-5 rounded-full bg-muted/80 flex items-center justify-center"
                      title={language === 'TR' ? feature.labelTr : feature.label}
                    >
                      <IconComponent className="h-3 w-3 sm:h-3 sm:w-3 text-primary" />
                    </div>
                  ) : null;
                })}
              </div>
              
              {/* Passenger & Luggage Count */}
              <div className="flex items-center justify-center gap-3 text-xs sm:text-xs text-muted-foreground pointer-events-none">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                  <span className="font-medium">{vehicle.passengers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                  <span className="font-medium">{vehicle.luggage}</span>
                </div>
              </div>
              
              {/* Price */}
              <div className="pointer-events-none mt-1.5">
                {vehiclePrice ? (
                  <div className="text-sm sm:text-sm font-bold text-primary">
                    {currency === "EUR" ? "€" : currency}{vehiclePrice.price}
                  </div>
                ) : loadingPrices && hasRoute ? (
                  <div className="h-5 sm:h-5 flex items-center justify-center">
                    <Skeleton className="h-4 sm:h-4 w-12 sm:w-10" />
                  </div>
                ) : (
                  <div className="h-5 sm:h-5" />
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
});

VehicleSelector.displayName = "VehicleSelector";
