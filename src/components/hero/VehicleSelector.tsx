import { memo, lazy, Suspense, useState, useCallback, useRef } from "react";
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
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<typeof VEHICLE_TYPES[0] | null>(null);
  const [isVehicleDetailOpen, setIsVehicleDetailOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple direct click handler - no complex touch detection
  const handleVehicleClick = useCallback((vehicle: typeof VEHICLE_TYPES[0], isDisabled: boolean) => {
    if (isDisabled) return;
    onSelectVehicle(vehicle.value);
  }, [onSelectVehicle]);

  // Info button handler - stops propagation properly
  const handleInfoClick = useCallback((e: React.MouseEvent, vehicle: typeof VEHICLE_TYPES[0]) => {
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
          
          return (
            <div 
              key={vehicle.value}
              className="relative"
              data-vehicle-card
            >
              <button
                type="button"
                onClick={() => handleVehicleClick(vehicle, isDisabled)}
                disabled={isDisabled}
                className={cn(
                  "w-full rounded-lg border p-1 sm:p-1.5 text-center overflow-hidden",
                  "transition-all duration-150 ease-out select-none",
                  "active:scale-[0.97] active:opacity-90",
                  isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                  isSelected 
                    ? "border-primary bg-primary/10 ring-1 ring-primary shadow-md" 
                    : "border-border bg-card hover:border-primary/50 active:border-primary"
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Vehicle Image */}
                <div className="w-full aspect-[16/10] rounded-md overflow-hidden mb-1 bg-muted relative">
                  <img 
                    src={vehicleImages[vehicle.value]} 
                    alt={vehicle.label}
                    className="w-full h-full object-cover pointer-events-none"
                    loading={index === 0 ? "eager" : "lazy"}
                    draggable={false}
                  />
                  
                  {/* Info Button - Only on desktop hover */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleInfoClick(e, vehicle)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInfoClick(e as unknown as React.MouseEvent, vehicle)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white z-20 cursor-pointer"
                  >
                    <Info className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                  </div>
                  
                  {/* Selected Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10 pointer-events-none">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Vehicle Name */}
                <div className="text-[10px] sm:text-xs font-semibold truncate mb-0.5 pointer-events-none">
                  {vehicle.label.split(' ').pop()}
                </div>
                
                {/* Passenger Count */}
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[10px] text-muted-foreground pointer-events-none">
                  <Users className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span>{vehicle.passengers}</span>
                </div>
                
                {/* Price */}
                <div className="pointer-events-none">
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
