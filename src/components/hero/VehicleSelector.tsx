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

  // Optimized vehicle tap handler with RAF for smooth updates
  const handleVehicleTap = useCallback((vehicle: typeof VEHICLE_TYPES[0], isDisabled: boolean) => {
    if (isDisabled) return;
    
    // Use requestAnimationFrame to batch state updates
    requestAnimationFrame(() => {
      if (isTouchDevice) {
        if (tappedVehicle === vehicle.value) {
          onSelectVehicle(vehicle.value);
          setTappedVehicle(null);
        } else {
          setTappedVehicle(vehicle.value);
        }
      } else {
        onSelectVehicle(vehicle.value);
      }
    });
  }, [isTouchDevice, tappedVehicle, onSelectVehicle]);

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
  const handleInfoClick = useCallback((e: React.MouseEvent, vehicle: typeof VEHICLE_TYPES[0]) => {
    e.stopPropagation();
    setSelectedVehicleForDetail(vehicle);
    setIsVehicleDetailOpen(true);
  }, []);

  return (
    <>
      <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {VEHICLE_TYPES.map((vehicle, index) => {
          const vehiclePrice = prices.find(v => v.vehicleType === vehicle.value);
          const isSelected = selectedVehicle === vehicle.value;
          const isDisabled = vehicle.passengers < parseInt(passengers);
          const isHovered = hoveredVehicle === vehicle.value;
          const isTapped = tappedVehicle === vehicle.value;
          
          // Show tooltip on hover (desktop) or tap (mobile)
          const showTooltip = (isHovered || isTapped) && !isDisabled;
          
          // Determine tooltip position based on vehicle index to prevent off-screen
          const isRightSide = index >= 2;
          
          return (
            <div 
              key={vehicle.value}
              className="relative animate-fade-in"
              style={{ animationDelay: `${0.05 * index}s` }}
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
                disabled={isDisabled}
                className={cn(
                  "w-full rounded-xl border p-2 text-center overflow-hidden touch-manipulation",
                  "transition-all duration-200 ease-out",
                  "hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.97]",
                  isDisabled ? "opacity-40 cursor-not-allowed hover:scale-100 hover:translate-y-0" : "cursor-pointer",
                  isSelected 
                    ? "border-primary bg-primary/10 ring-2 ring-primary shadow-lg" 
                    : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                )}
              >
                {/* Vehicle Image with Carousel */}
                <div className="w-full aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-muted relative group/image">
                  <Suspense fallback={
                    <img 
                      src={vehicleImages[vehicle.value]} 
                      alt={vehicle.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  }>
                    <VehicleImageCarousel
                      images={vehicle.images.slice(0, 5).map(img => img.src)}
                      alt={vehicle.label}
                      className="w-full h-full"
                      interval={3000}
                      isHovered={isHovered}
                    />
                  </Suspense>
                  
                  {/* Info Button */}
                  <button
                    type="button"
                    onClick={(e) => handleInfoClick(e, vehicle)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover/image:opacity-100 transition-opacity z-20 touch-manipulation"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10 animate-fade-in">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold truncate mb-0.5">{vehicle.label.split(' ').pop()}</div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{vehicle.passengers} pax</span>
                </div>
                {vehiclePrice ? (
                  <div className="text-xs font-bold text-primary">
                    {currency === "EUR" ? "€" : currency}{vehiclePrice.price}
                  </div>
                ) : loadingPrices && hasRoute ? (
                  <div className="h-4 flex items-center justify-center">
                    <Skeleton className="h-3 w-8" />
                  </div>
                ) : (
                  <div className="h-4" />
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
