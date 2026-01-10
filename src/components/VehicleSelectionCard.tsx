import { Users, Car, CheckCircle2, ZoomIn, Briefcase, Snowflake, Wifi, BatteryCharging, Droplets, Sparkles, Tv, Crown, Wine, Armchair, Stars, ThumbsUp } from "lucide-react";
import { VEHICLE_TYPE_MAP, VehicleTypeInfo } from "@/lib/vehicleTypes";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

// Icon mapping for vehicle features with colors
const getFeatureIconWithColor = (iconName: string) => {
  const iconConfig: Record<string, { icon: typeof Snowflake; color: string }> = {
    'snowflake': { icon: Snowflake, color: 'text-sky-500' },
    'armchair': { icon: Armchair, color: 'text-amber-600' },
    'wifi': { icon: Wifi, color: 'text-blue-500' },
    'battery-charging': { icon: BatteryCharging, color: 'text-green-500' },
    'droplets': { icon: Droplets, color: 'text-cyan-500' },
    'luggage': { icon: Briefcase, color: 'text-orange-500' },
    'stars': { icon: Stars, color: 'text-yellow-500' },
    'wine': { icon: Wine, color: 'text-rose-500' },
    'sparkles': { icon: Sparkles, color: 'text-purple-500' },
    'crown': { icon: Crown, color: 'text-yellow-600' },
    'tv': { icon: Tv, color: 'text-indigo-500' },
    'champagne': { icon: Wine, color: 'text-pink-500' },
  };
  return iconConfig[iconName] || { icon: Sparkles, color: 'text-purple-500' };
};

interface VehicleSelectionCardProps {
  vehicleType: string;
  isSelected: boolean;
  onSelect: (vehicleType: string) => void;
  price?: number | null;
  currency?: string;
  showPrice?: boolean;
  isRecommended?: boolean;
}

export function VehicleSelectionCard({
  vehicleType,
  isSelected,
  onSelect,
  price,
  currency = "EUR",
  showPrice = false,
  isRecommended = false,
}: VehicleSelectionCardProps) {
  const { t, language } = useLanguage();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  
  const vehicleInfo = VEHICLE_TYPE_MAP[vehicleType];
  
  if (!vehicleInfo) return null;
  
  const vehicleImages = vehicleInfo.images || [];
  const isTurkish = language === 'TR';

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      EUR: "€",
      USD: "$",
      GBP: "£",
      TRY: "₺",
    };
    return symbols[curr] || curr;
  };

  return (
    <>
      <div
        onClick={() => onSelect(vehicleType)}
        className={`
          relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 group
          ${isSelected 
            ? 'ring-2 ring-primary shadow-xl scale-[1.01]' 
            : 'hover:shadow-lg hover:scale-[1.005]'
          }
        `}
      >
        {/* Gradient Background */}
        <div className={`
          absolute inset-0 transition-all duration-300
          ${isSelected 
            ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-background' 
            : isRecommended
              ? 'bg-gradient-to-br from-green-500/10 via-green-500/5 to-background group-hover:from-green-500/15'
              : 'bg-gradient-to-br from-muted/80 via-muted/50 to-background group-hover:from-muted'
          }
        `} />
        
        {/* Border */}
        <div className={`
          absolute inset-0 rounded-2xl border-2 transition-colors duration-300
          ${isSelected 
            ? 'border-primary' 
            : isRecommended
              ? 'border-green-500/40 group-hover:border-green-500/60'
              : 'border-border/60 group-hover:border-primary/40'
          }
        `} />
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 z-10">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
        
        {/* Recommended Badge */}
        {isRecommended && (
          <div className="absolute top-0 left-0 z-10">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-br-xl rounded-tl-xl shadow-lg">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
                <ThumbsUp className="h-3.5 w-3.5" />
                {isTurkish ? "Önerilen" : "Recommended"}
              </span>
            </div>
          </div>
        )}
        
        <div className="relative p-4 sm:p-5">
          <div className="flex gap-4">
            {/* Vehicle Image */}
            <div 
              className="w-32 sm:w-40 h-24 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                if (vehicleImages.length > 0) {
                  setImageModalOpen(true);
                }
              }}
            >
              {vehicleImages.length > 0 ? (
                <>
                  <Carousel 
                    className="w-full h-full"
                    plugins={[Autoplay({ delay: 3500, stopOnInteraction: false })]}
                    opts={{ loop: true }}
                  >
                    <CarouselContent className="h-full">
                      {vehicleImages.slice(0, 4).map((img, idx) => (
                        <CarouselItem key={idx} className="h-full">
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                  {/* Zoom overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-2">
                    <span className="flex items-center gap-1 text-white text-xs font-medium">
                      <ZoomIn className="h-3.5 w-3.5" />
                      {isTurkish ? "Galeri" : "View Gallery"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Car className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Vehicle Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              {/* Header: Name */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-base sm:text-lg leading-tight">
                    {vehicleInfo.label}
                  </h4>
                </div>
                
                {/* Capacity Pills */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                    <Users className="h-3.5 w-3.5" />
                    {vehicleInfo.passengers}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 text-accent-foreground text-xs font-semibold">
                    <Briefcase className="h-3.5 w-3.5" />
                    {vehicleInfo.luggage}
                  </div>
                </div>
              </div>
              
              {/* Feature Icons - Colorful */}
              {vehicleInfo.features && vehicleInfo.features.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {vehicleInfo.features.slice(0, 4).map((feature, idx) => {
                    const { icon: FeatureIcon, color } = getFeatureIconWithColor(feature.icon);
                    return (
                      <div 
                        key={idx}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 border border-border/50 text-xs hover:border-border transition-colors"
                        title={isTurkish ? feature.labelTr : feature.label}
                      >
                        <FeatureIcon className={`h-3 w-3 flex-shrink-0 ${color}`} />
                        <span className="hidden sm:inline truncate max-w-[80px] text-muted-foreground">
                          {isTurkish ? feature.labelTr : feature.label}
                        </span>
                      </div>
                    );
                  })}
                  {vehicleInfo.features.length > 4 && (
                    <span className="text-xs text-muted-foreground">
                      +{vehicleInfo.features.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Price Section - Only show if showPrice is true */}
          {showPrice && (
            <div className={`
              mt-4 pt-3 border-t flex items-center justify-between transition-all duration-500
              ${isSelected ? 'border-primary/20' : 'border-border/40'}
            `}>
              <span className="text-sm text-muted-foreground">
                {isTurkish ? "Tek yön transfer" : "One-way transfer"}
              </span>
              {price ? (
                <span className={`
                  text-2xl sm:text-3xl font-extrabold tracking-tight transition-all duration-300
                  ${isSelected ? 'text-primary' : 'text-foreground'}
                `}>
                  {getCurrencySymbol(currency)}{price}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  {isTurkish ? "Fiyat bekleniyor" : "Price pending"}
                </span>
              )}
            </div>
          )}
          
          {/* Description */}
          <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
            {isTurkish ? vehicleInfo.descriptionTr : vehicleInfo.description}
          </p>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogClose className="absolute right-4 top-4 z-50">
            <Button variant="secondary" size="icon" className="rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">{vehicleInfo.label}</h3>
            
            {vehicleImages.length > 0 && (
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {vehicleImages.map((img, idx) => (
                    <CarouselItem key={idx}>
                      <div className="aspect-video rounded-xl overflow-hidden">
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )}
            
            {/* Features list in modal */}
            <div className="mt-4 flex flex-wrap gap-2">
              {vehicleInfo.features.map((feature, idx) => {
                const { icon: FeatureIcon, color } = getFeatureIconWithColor(feature.icon);
                return (
                  <div 
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm"
                  >
                    <FeatureIcon className={`h-4 w-4 ${color}`} />
                    <span>{isTurkish ? feature.labelTr : feature.label}</span>
                  </div>
                );
              })}
            </div>
            
            <p className="text-muted-foreground mt-4">
              {isTurkish ? vehicleInfo.descriptionTr : vehicleInfo.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
