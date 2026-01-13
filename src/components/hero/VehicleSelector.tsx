import { memo, lazy, Suspense, useState, useCallback, useRef } from "react";
import { Users, Check, Info, Briefcase, Snowflake, Wifi, Star, Tv, Crown, Armchair } from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES } from "@/lib/vehicleTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { VehiclePrice } from "./types";

// Feature icon mapping
const featureIcons: Record<string, React.ElementType> = {
  'snowflake': Snowflake,
  'armchair': Armchair,
  'wifi': Wifi,
  'stars': Star,
  'tv': Tv,
  'crown': Crown,
};

// Vehicle images
import vitoImg from "@/assets/vito-1.jpg";
import vitoVipImg from "@/assets/vito-vip-1.jpg";
import maybachImg from "@/assets/maybach-1.jpg";
import sprinterImg from "@/assets/sprinter-1.jpg";

// Lazy load heavy components
const VehicleImageCarousel = lazy(() => import("@/components/website/VehicleImageCarousel").then(m => ({ default: m.VehicleImageCarousel })));
const VehicleDetailModal = lazy(() => import("@/components/website/VehicleDetailModal").then(m => ({ default: m.VehicleDetailModal })));

const vehicleImages: Record<string, string> = {
  'mercedes-vito': vitoImg,
  'vip-mercedes': vitoVipImg,
  'maybach-minibus': maybachImg,
  'sprinter-minibus': sprinterImg,
  'minibus': sprinterImg,
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
}

export const VehicleSelector = memo(({
  selectedVehicle,
  onSelectVehicle,
  passengers,
  prices,
  loadingPrices,
  hasRoute,
  language,
  currency = "EUR"
}: VehicleSelectorProps) => {
  const [hoveredVehicle, setHoveredVehicle] = useState<string | null>(null);
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<typeof VEHICLE_TYPES[0] | null>(null);
  const [isVehicleDetailOpen, setIsVehicleDetailOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple click handler
  const handleVehicleClick = useCallback((vehicle: typeof VEHICLE_TYPES[0], isDisabled: boolean) => {
    if (isDisabled) return;
    onSelectVehicle(vehicle.value);
  }, [onSelectVehicle]);

  // Info button handler
  const handleInfoClick = useCallback((e: React.MouseEvent, vehicle: typeof VEHICLE_TYPES[0]) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedVehicleForDetail(vehicle);
    setIsVehicleDetailOpen(true);
  }, []);

  // Hover handlers for desktop carousel
  const handleMouseEnter = useCallback((vehicleValue: string) => {
    setHoveredVehicle(vehicleValue);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredVehicle(null);
  }, []);

  return (
    <>
      <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3">
        {VEHICLE_TYPES.map((vehicle, index) => {
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
                  "w-full rounded-xl border-2 p-2.5 sm:p-2 text-center overflow-hidden",
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
                <div className="w-full aspect-square rounded-lg overflow-hidden mb-1.5 sm:mb-2 bg-muted relative">
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
                  
                  {/* Info Button */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleInfoClick(e, vehicle)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInfoClick(e as unknown as React.MouseEvent, vehicle)}
                    className="absolute top-1 right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white z-20 cursor-pointer backdrop-blur-sm"
                  >
                    <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </div>
                  
                  {/* Selected Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/25 flex items-center justify-center z-10 pointer-events-none">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <Check className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Vehicle Name - Full label */}
                <div className="text-xs sm:text-sm font-bold truncate mb-1 pointer-events-none text-foreground">
                  {vehicle.label}
                </div>
                
                {/* Feature Icons Row */}
                <div className="flex items-center justify-center gap-1.5 mb-1 pointer-events-none">
                  {vehicle.features.slice(0, 3).map((feature, idx) => {
                    const IconComponent = featureIcons[feature.icon];
                    return IconComponent ? (
                      <div 
                        key={idx} 
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-muted/80 flex items-center justify-center"
                        title={language === 'TR' ? feature.labelTr : feature.label}
                      >
                        <IconComponent className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                      </div>
                    ) : null;
                  })}
                </div>
                
                {/* Passenger & Luggage Count */}
                <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground pointer-events-none">
                  <div className="flex items-center gap-0.5">
                    <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>{vehicle.passengers}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>{vehicle.luggage}</span>
                  </div>
                </div>
                
                {/* Price */}
                <div className="pointer-events-none mt-1">
                  {vehiclePrice ? (
                    <div className="text-xs sm:text-sm font-bold text-primary">
                      {currency === "EUR" ? "€" : currency}{vehiclePrice.price}
                    </div>
                  ) : loadingPrices && hasRoute ? (
                    <div className="h-4 sm:h-5 flex items-center justify-center">
                      <Skeleton className="h-3 sm:h-4 w-8 sm:w-10" />
                    </div>
                  ) : (
                    <div className="h-4 sm:h-5" />
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Vehicle Detail Modal */}
      <Suspense fallback={null}>
        <VehicleDetailModal
          vehicle={selectedVehicleForDetail}
          isOpen={isVehicleDetailOpen}
          onClose={() => setIsVehicleDetailOpen(false)}
          onSelect={() => {
            if (selectedVehicleForDetail) {
              onSelectVehicle(selectedVehicleForDetail.value);
            }
          }}
          isSelected={selectedVehicleForDetail ? selectedVehicle === selectedVehicleForDetail.value : false}
          price={selectedVehicleForDetail ? prices.find(v => v.vehicleType === selectedVehicleForDetail.value)?.price : undefined}
          currency={currency}
          isTurkish={language === 'TR'}
        />
      </Suspense>
    </>
  );
});

VehicleSelector.displayName = "VehicleSelector";
