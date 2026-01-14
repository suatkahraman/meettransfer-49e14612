import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Briefcase, Star, Check, ChevronLeft, ChevronRight, Snowflake, Wifi, Sparkles, Crown, Tv } from "lucide-react";
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
}: {
  vehicle: VehicleTypeInfo;
  price?: number;
  currency?: string;
  isSelected?: boolean;
  onSelect?: () => void;
  language: string;
  discountPercentage?: number;
  isRecommended?: boolean;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const currencySymbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative bg-background rounded-xl border overflow-hidden cursor-pointer transition-all",
        isSelected 
          ? "border-primary ring-2 ring-primary/20 shadow-lg" 
          : "border-border hover:border-primary/50 hover:shadow-md"
      )}
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center gap-1">
          <Star className="h-2.5 w-2.5 fill-current" />
          {language === "TR" ? "Önerilen" : "Recommended"}
        </div>
      )}

      {/* Selected Check */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}

      {/* Image Carousel - Compact */}
      <div className="relative h-24 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={imageIndex}
            src={vehicle.images[imageIndex]?.src}
            alt={vehicle.images[imageIndex]?.alt || vehicle.label}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>
        
        {/* Navigation Arrows */}
        {vehicle.images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity"
            >
              <ChevronLeft className="h-3 w-3 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity"
            >
              <ChevronRight className="h-3 w-3 text-white" />
            </button>
          </>
        )}

        {/* Image Dots */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {vehicle.images.slice(0, 3).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 h-1 rounded-full transition-all",
                i === imageIndex ? "bg-white w-2" : "bg-white/50"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5">
        {/* Vehicle Name */}
        <h4 className="font-semibold text-sm leading-tight">{vehicle.label}</h4>
        
        {/* Capacity */}
        <div className="flex items-center gap-3 mt-1.5 text-muted-foreground text-[11px]">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {vehicle.passengers}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {vehicle.luggage}
          </span>
        </div>

        {/* Key Features - Just icons */}
        <div className="flex items-center gap-1.5 mt-1.5">
          {vehicle.features.slice(0, 4).map((feature, i) => (
            <div 
              key={i}
              className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              title={language === "TR" ? feature.labelTr : feature.label}
            >
              {featureIcons[feature.icon] || <Sparkles className="h-3 w-3" />}
            </div>
          ))}
        </div>

        {/* Price */}
        {price !== undefined && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            <div className="flex items-baseline gap-1">
              {originalPrice && (
                <span className="text-[11px] text-muted-foreground line-through">
                  {currencySymbol}{originalPrice}
                </span>
              )}
              <span className="font-bold text-primary text-base">
                {currencySymbol}{displayPrice}
              </span>
            </div>
            {discountPercentage && (
              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-semibold rounded">
                -{discountPercentage}%
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
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
}: ChatVehicleCardsProps) {
  const availableVehicles = getAvailableVehicles(passengers, passengers);

  // Get recommended vehicle - Vito for standard, Sprinter for 7+
  const recommendedVehicle = passengers >= 7 ? "minibus" : "mercedes-vito";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-2"
    >
      <div className="text-xs text-muted-foreground font-medium px-1">
        {language === "TR" 
          ? `${passengers >= 7 ? "7+ yolcu için:" : "Araç seçeneklerimiz:"}` 
          : `${passengers >= 7 ? "For 7+ passengers:" : "Our vehicle options:"}`
        }
      </div>
      
      <div className={cn(
        "grid gap-2",
        availableVehicles.length === 1 ? "grid-cols-1" : "grid-cols-2"
      )}>
        {availableVehicles.map((vehicle) => (
          <ChatVehicleCard
            key={vehicle.value}
            vehicle={vehicle}
            price={prices?.[vehicle.value]}
            currency={currency}
            isSelected={selectedVehicle === vehicle.value}
            onSelect={() => onSelectVehicle?.(vehicle.value)}
            language={language}
            discountPercentage={discountPercentage}
            isRecommended={vehicle.value === recommendedVehicle}
          />
        ))}
      </div>
    </motion.div>
  );
});

export default ChatVehicleCards;
