import { memo, lazy, Suspense, useState, useCallback, useEffect, useRef } from "react";
import { Users, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES } from "@/lib/vehicleTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { VehiclePrice } from "./types";

// Vehicle images
import vitoImg from "@/assets/vito-1.jpg";
import vitoVipImg from "@/assets/vito-vip-1.jpg";
import maybachImg from "@/assets/maybach-1.jpg";
import sprinterImg from "@/assets/sprinter-1.jpg";

const VehicleTooltip = lazy(() => import("@/components/VehicleTooltip").then(m => ({ default: m.VehicleTooltip })));
const VehicleImageCarousel = lazy(() => import("@/components/website/VehicleImageCarousel").then(m => ({ default: m.VehicleImageCarousel })));
const VehicleDetailModal = lazy(() => import("@/components/website/VehicleDetailModal").then(m => ({ default: m.VehicleDetailModal })));

const vehicleImages: Record<string, string> = {
  'mercedes-vito': vitoImg,
  'vip-mercedes': vitoVipImg,
  'maybach-minibus': maybachImg,
  'sprinter-minibus': sprinterImg,
  'minibus': sprinterImg,
};

// Hook to detect touch device - with passive event check
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    // Check on mount without causing reflow
    const checkTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(checkTouch());
  }, []);
  
  return isTouch;
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
  const [tappedVehicle, setTappedVehicle] = useState<string | null>(null);
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<typeof VEHICLE_TYPES[0] | null>(null);
  const [isVehicleDetailOpen, setIsVehicleDetailOpen] = useState(false);
  const isTouchDevice = useIsTouchDevice();
  const containerRef = useRef<HTMLDivElement>(null);

  // Use passive event listeners for touch/mouse events
  useEffect(() => {
    if (!tappedVehicle || !containerRef.current) return;
    
    const handleClickOutside = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-vehicle-card]')) {
        setTappedVehicle(null);
      }
    };
    
    // Add passive listeners for better scroll performance
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tappedVehicle]);

  // Optimized vehicle tap handler - instant selection on mobile
  const handleVehicleTap = useCallback((vehicle: typeof VEHICLE_TYPES[0], isDisabled: boolean) => {
    if (isDisabled) return;
    
    // On mobile: single tap selects, no double-tap needed
    if (isTouchDevice) {
      onSelectVehicle(vehicle.value);
      setTappedVehicle(null);
    } else {
      onSelectVehicle(vehicle.value);
    }
  }, [isTouchDevice, onSelectVehicle]);

  // Long press for tooltip on mobile
  const handleLongPress = useCallback((vehicleValue: string) => {
    if (isTouchDevice) {
      setTappedVehicle(vehicleValue);
    }
  }, [isTouchDevice]);

  // Optimized hover handlers
  const handleMouseEnter = useCallback((vehicleValue: string, isDisabled: boolean) => {
    if (!isTouchDevice && !isDisabled) {
      setHoveredVehicle(vehicleValue);
    }
  }, [isTouchDevice]);

  const handleMouseLeave = useCallback(() => {
    if (!isTouchDevice) {
      setHoveredVehicle(null);
    }
  }, [isTouchDevice]);

  // Optimized info button handler
  const handleInfoClick = useCallback((e: React.MouseEvent | React.TouchEvent, vehicle: typeof VEHICLE_TYPES[0]) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedVehicleForDetail(vehicle);
    setIsVehicleDetailOpen(true);
  }, []);

  return (
    <>
      <div ref={containerRef} className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {VEHICLE_TYPES.map((vehicle, index) => {
          const vehiclePrice = prices.find(v => v.vehicleType === vehicle.value);
          const isSelected = selectedVehicle === vehicle.value;
          const isDisabled = vehicle.passengers < parseInt(passengers);
          const isHovered = hoveredVehicle === vehicle.value;
          const isTapped = tappedVehicle === vehicle.value;
          
          // Show tooltip on hover (desktop) or long-tap (mobile)
          const showTooltip = (isHovered || isTapped) && !isDisabled;
          
          // Determine tooltip position based on vehicle index to prevent off-screen
          const isRightSide = index >= 2;
          
          return (
            <div 
              key={vehicle.value}
              className="relative"
              data-vehicle-card
              onMouseEnter={() => handleMouseEnter(vehicle.value, isDisabled)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Tooltip - with proper alignment for right-side items */}
              <Suspense fallback={null}>
                <VehicleTooltip 
                  vehicleType={vehicle.value}
                  isVisible={showTooltip}
                  position="top"
                  isTurkish={language === 'TR'}
                  alignRight={isRightSide}
                  onSelect={isTouchDevice ? () => {
                    onSelectVehicle(vehicle.value);
                    setTappedVehicle(null);
                  } : undefined}
                  isSelected={isSelected}
                />
              </Suspense>
              
              <button
                type="button"
                onClick={() => handleVehicleTap(vehicle, isDisabled)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleLongPress(vehicle.value);
                }}
                disabled={isDisabled}
                className={cn(
                  "w-full rounded-lg border p-1 sm:p-1.5 text-center overflow-hidden touch-manipulation",
                  "transition-all duration-150 ease-out",
                  "active:scale-[0.96]",
                  isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                  isSelected 
                    ? "border-primary bg-primary/10 ring-1 ring-primary shadow-md" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {/* Vehicle Image - Static on mobile for performance */}
                <div className="w-full aspect-[16/10] rounded-md overflow-hidden mb-1 bg-muted relative group/image">
                  {/* Mobile: Static image only */}
                  <img 
                    src={vehicleImages[vehicle.value]} 
                    alt={vehicle.label}
                    className="w-full h-full object-cover sm:hidden"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  
                  {/* Desktop: Carousel */}
                  <div className="hidden sm:block w-full h-full">
                    <Suspense fallback={
                      <img 
                        src={vehicleImages[vehicle.value]} 
                        alt={vehicle.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
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
                  </div>
                  
                  {/* Info Button - Larger touch target on mobile */}
                  <button
                    type="button"
                    onClick={(e) => handleInfoClick(e, vehicle)}
                    onTouchEnd={(e) => handleInfoClick(e, vehicle)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-100 sm:opacity-0 sm:group-hover/image:opacity-100 transition-opacity z-20 touch-manipulation"
                  >
                    <Info className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                  </button>
                  
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10">
                      <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Vehicle Name - Compact on mobile */}
                <div className="text-[10px] sm:text-xs font-semibold truncate mb-0.5">
                  {vehicle.label.split(' ').pop()}
                </div>
                
                {/* Passenger Count - Smaller on mobile */}
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[10px] text-muted-foreground">
                  <Users className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span>{vehicle.passengers}</span>
                </div>
                
                {/* Price */}
                {vehiclePrice ? (
                  <div className="text-[10px] sm:text-xs font-bold text-primary mt-0.5">
                    {currency === "EUR" ? "€" : currency}{vehiclePrice.price}
                  </div>
                ) : loadingPrices && hasRoute ? (
                  <div className="h-3 sm:h-4 flex items-center justify-center mt-0.5">
                    <Skeleton className="h-2.5 sm:h-3 w-6 sm:w-8" />
                  </div>
                ) : (
                  <div className="h-3 sm:h-4" />
                )}
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
