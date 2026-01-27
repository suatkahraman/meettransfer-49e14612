import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { Users, Check, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
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

// Additional vehicle images for carousel
import vitoAirportPremium from "@/assets/vehicles/vito-airport-premium.webp";
import vipVitoStarlight from "@/assets/vehicles/vip-vito-starlight.webp";
import maybachLuxury from "@/assets/vehicles/maybach-luxury.webp";
import sprinterArrival from "@/assets/vehicles/sprinter-arrival.webp";

// Turkey-specific sedan images (Renault Megane, Toyota Corolla)
import sedanRenaultMegane from "@/assets/vehicles/sedan-renault-megane.webp";
import sedanToyotaCorolla from "@/assets/vehicles/sedan-toyota-corolla.webp";

// Maybach Minivan luxury images
import maybachInteriorLuxury from "@/assets/vehicles/maybach-interior-luxury.webp";
import maybachMinivanExterior from "@/assets/vehicles/maybach-minivan-exterior.webp";
import maybachInteriorRear from "@/assets/vehicles/maybach-interior-rear.webp";

// Dubai vehicle images - WebP optimized
import dubaiVipVanImg from "@/assets/dubai/dubai-vip-mercedes-van.webp";

// Auto-rotate interval in milliseconds
const AUTO_ROTATE_INTERVAL = 3000;

// Vehicle images map with multiple images per vehicle for carousel
const vehicleImageSets: Record<string, string[]> = {
  // Turkey sedan - Renault Megane & Toyota Corolla
  'sedan': [sedanRenaultMegane, sedanToyotaCorolla, sedanImg],
  'mercedes-vito': [vitoImg, vitoAirportPremium],
  'vip-mercedes': [vitoVipImg, vipVitoStarlight],
  // Maybach Minivan - luxury exterior and interior images
  'maybach-minibus': [maybachMinivanExterior, maybachInteriorLuxury, maybachInteriorRear, maybachImg, maybachLuxury],
  'sprinter-minibus': [sprinterImg, sprinterArrival],
  'minibus': [sprinterImg, sprinterArrival],
  // Dubai vehicles
  'dubai-private-sedan': [sedanRenaultMegane, sedanToyotaCorolla],
  'dubai-premium-van': [vitoVipImg, vipVitoStarlight],
  'dubai-suburban-suv': [vitoImg, vitoAirportPremium],
  'dubai-vip-sprinter': [dubaiVipVanImg, sprinterArrival],
};

// Single image fallback
const vehicleImages: Record<string, string> = {
  'sedan': sedanRenaultMegane,
  'mercedes-vito': vitoImg,
  'vip-mercedes': vitoVipImg,
  'maybach-minibus': maybachMinivanExterior,
  'sprinter-minibus': sprinterImg,
  'minibus': sprinterImg,
  'dubai-private-sedan': sedanRenaultMegane,
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

// Vehicle Card with Carousel
const VehicleCard = memo(({
  vehicle,
  isSelected,
  isDisabled,
  vehiclePrice,
  loadingPrices,
  hasRoute,
  currency,
  onClick,
  index,
}: {
  vehicle: VehicleTypeInfo;
  isSelected: boolean;
  isDisabled: boolean;
  vehiclePrice: VehiclePrice | undefined;
  loadingPrices: boolean;
  hasRoute: boolean;
  currency: string;
  onClick: () => void;
  index: number;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const images = vehicleImageSets[vehicle.value] || [vehicleImages[vehicle.value]];
  const hasMultipleImages = images.length > 1;
  
  // Auto-rotate images
  useEffect(() => {
    if (!hasMultipleImages || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, AUTO_ROTATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [hasMultipleImages, images.length, isPaused]);
  
  const nextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  }, [images.length]);
  
  const prevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  return (
    <div 
      className="relative"
      data-vehicle-card
      onMouseEnter={() => { setIsHovered(true); setIsPaused(true); }}
      onMouseLeave={() => { setIsHovered(false); setIsPaused(false); }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          "w-full rounded-xl border-2 p-2.5 text-center overflow-hidden",
          "transition-all duration-300 ease-out select-none",
          "active:scale-[0.97] active:opacity-90",
          isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
          isSelected 
            ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-lg shadow-primary/20 scale-[1.02]" 
            : "border-border bg-card hover:border-primary/50 hover:shadow-md hover:scale-[1.01] active:border-primary"
        )}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* Vehicle Image with Carousel */}
        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-muted relative group">
          <img 
            src={images[currentImageIndex]} 
            alt={vehicle.label}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              isHovered && "scale-110"
            )}
            loading={index === 0 ? "eager" : "lazy"}
            draggable={false}
          />
          
          {/* Carousel Navigation - only show on hover with multiple images */}
          {hasMultipleImages && isHovered && !isDisabled && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {/* Image indicators */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === currentImageIndex ? "bg-white w-3" : "bg-white/50"
                    )} 
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Image indicators - always visible */}
          {hasMultipleImages && !isHovered && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === currentImageIndex ? "bg-white w-3" : "bg-white/50"
                  )} 
                />
              ))}
            </div>
          )}
          
          {/* Selected Overlay */}
          {isSelected && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10 pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg animate-scale-in">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>
        
        {/* Vehicle Name - Vertical layout */}
        <div className="text-xs font-bold pointer-events-none text-foreground leading-tight mb-1 min-h-[2rem] flex flex-col items-center justify-center">
          {vehicle.label.split(' ').map((word, i) => (
            <span key={i} className="block">{word}</span>
          ))}
        </div>
        
        {/* Passenger & Luggage Count */}
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pointer-events-none">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{vehicle.passengers}</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5 text-primary" />
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
});

VehicleCard.displayName = "VehicleCard";

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
  const vehicleList: VehicleTypeInfo[] = useMemo(() => {
    return getRegionVehicles(region);
  }, [region]);

  const handleVehicleClick = useCallback((vehicle: VehicleTypeInfo, isDisabled: boolean) => {
    if (isDisabled) return;
    onSelectVehicle(vehicle.value);
  }, [onSelectVehicle]);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {vehicleList.map((vehicle, index) => {
        const vehiclePrice = prices.find(v => v.vehicleType === vehicle.value);
        const isSelected = selectedVehicle === vehicle.value;
        const isDisabled = vehicle.passengers < parseInt(passengers);
        
        return (
          <VehicleCard
            key={vehicle.value}
            vehicle={vehicle}
            isSelected={isSelected}
            isDisabled={isDisabled}
            vehiclePrice={vehiclePrice}
            loadingPrices={loadingPrices}
            hasRoute={hasRoute}
            currency={currency}
            onClick={() => handleVehicleClick(vehicle, isDisabled)}
            index={index}
          />
        );
      })}
    </div>
  );
});

VehicleSelector.displayName = "VehicleSelector";
