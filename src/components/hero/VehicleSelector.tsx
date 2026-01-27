import { memo, useState, useCallback, useRef, useMemo } from "react";
import { Users, Check, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { VehicleTypeInfo } from "@/lib/vehicleTypes";
import { getRegionVehicles, VehicleRegion } from "@/lib/vehicleRegions";
import { Skeleton } from "@/components/ui/skeleton";
import { VehiclePrice } from "./types";

// Vehicle images - optimized WebP 480x360
import vitoImg from "@/assets/vehicles/vito-hero-optimized.webp";
import vitoVipImg from "@/assets/vehicles/vito-vip-hero-optimized.webp";
import maybachImg from "@/assets/vehicles/maybach-hero-optimized.webp";
import sprinterImg from "@/assets/vehicles/sprinter-hero-optimized.webp";
import sedanImg from "@/assets/vehicles/sedan-hero-optimized.webp";

// Dubai vehicle images - WebP optimized
import dubaiVipVanImg from "@/assets/dubai/dubai-vip-mercedes-van.webp";

const vehicleImages: Record<string, string> = {
  'sedan': sedanImg,
  'mercedes-vito': vitoImg,
  'vip-mercedes': vitoVipImg,
  'maybach-minibus': maybachImg,
  'sprinter-minibus': sprinterImg,
  'minibus': sprinterImg,
  // Dubai vehicles
  'dubai-private-sedan': sedanImg,
  'dubai-premium-van': vitoVipImg,
  'dubai-suburban-suv': vitoImg,
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
  region?: VehicleRegion;
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
  region = 'default'
}: VehicleSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const vehicleList: VehicleTypeInfo[] = useMemo(() => {
    return getRegionVehicles(region);
  }, [region]);

  const handleVehicleClick = useCallback((vehicle: VehicleTypeInfo, isDisabled: boolean) => {
    if (isDisabled) return;
    onSelectVehicle(vehicle.value);
  }, [onSelectVehicle]);

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {vehicleList.map((vehicle, index) => {
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
                "w-full rounded-xl border-2 p-2.5 text-center overflow-hidden",
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
              {/* Vehicle Image - Simple static image */}
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-muted relative">
                <img 
                  src={vehicleImages[vehicle.value]} 
                  alt={vehicle.label}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
                
                {/* Selected Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/25 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Vehicle Name */}
              <div className="text-sm font-bold truncate mb-1 pointer-events-none text-foreground leading-tight">
                {vehicle.label}
              </div>
              
              {/* Passenger & Luggage Count */}
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pointer-events-none">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-medium">{vehicle.passengers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="font-medium">{vehicle.luggage}</span>
                </div>
              </div>
              
              {/* Price */}
              <div className="pointer-events-none mt-1.5">
                {vehiclePrice ? (
                  <div className="text-sm font-bold text-primary">
                    {currency === "EUR" ? "€" : currency}{vehiclePrice.price}
                  </div>
                ) : loadingPrices && hasRoute ? (
                  <div className="h-5 flex items-center justify-center">
                    <Skeleton className="h-4 w-12" />
                  </div>
                ) : (
                  <div className="h-5" />
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
