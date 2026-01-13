import { memo, lazy, Suspense, useState } from "react";
import { motion } from "framer-motion";
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

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {VEHICLE_TYPES.map((vehicle, index) => {
          const vehiclePrice = prices.find(v => v.vehicleType === vehicle.value);
          const isSelected = selectedVehicle === vehicle.value;
          const isDisabled = vehicle.passengers < parseInt(passengers);
          const isHovered = hoveredVehicle === vehicle.value;
          
          // Determine tooltip position based on vehicle index to prevent off-screen
          // For 4 columns: items 0,1 (left side) use top, items 2,3 (right side) use top-left alignment
          const isRightSide = index >= 2;
          
          return (
            <motion.div 
              key={vehicle.value}
              className="relative"
              onMouseEnter={() => !isDisabled && setHoveredVehicle(vehicle.value)}
              onMouseLeave={() => setHoveredVehicle(null)}
            >
              {/* Tooltip */}
              <Suspense fallback={null}>
                <VehicleTooltip 
                  vehicleType={vehicle.value}
                  isVisible={isHovered && !isDisabled}
                  position="top"
                  isTurkish={language === 'TR'}
                  className={isRightSide ? "!left-auto !right-0 !translate-x-0" : ""}
                />
              </Suspense>
              
              <motion.button
                type="button"
                onClick={() => !isDisabled && onSelectVehicle(vehicle.value)}
                disabled={isDisabled}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ scale: isDisabled ? 1 : 1.03, y: isDisabled ? 0 : -3 }}
                whileTap={{ scale: isDisabled ? 1 : 0.97 }}
                className={cn(
                  "w-full rounded-xl border p-2 transition-all text-center overflow-hidden",
                  isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVehicleForDetail(vehicle);
                      setIsVehicleDetailOpen(true);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover/image:opacity-100 transition-opacity z-20"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  
                  {isSelected && (
                    <motion.div 
                      className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className="text-xs font-semibold truncate mb-0.5">{vehicle.label.split(' ').pop()}</div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{vehicle.passengers} pax</span>
                </div>
                {vehiclePrice ? (
                  <motion.div 
                    className="text-xs font-bold text-primary"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {currency === "EUR" ? "€" : currency}{vehiclePrice.price}
                  </motion.div>
                ) : loadingPrices && hasRoute ? (
                  <div className="h-4 flex items-center justify-center">
                    <Skeleton className="h-3 w-8" />
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </motion.button>
            </motion.div>
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
