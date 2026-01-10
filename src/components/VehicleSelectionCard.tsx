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
import { Skeleton } from "@/components/ui/skeleton";

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

// Skeleton Loading Component
export function VehicleSelectionCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-border/60 bg-gradient-to-br from-muted/80 via-muted/50 to-background">
      <div className="relative p-4 sm:p-5">
        <div className="flex gap-4">
          {/* Image Skeleton */}
          <Skeleton className="w-32 sm:w-40 h-24 sm:h-28 rounded-xl flex-shrink-0" />
          
          {/* Details Skeleton */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              {/* Title */}
              <Skeleton className="h-6 w-32 mb-2" />
              
              {/* Capacity Pills */}
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-6 w-14 rounded-lg" />
              </div>
            </div>
            
            {/* Feature Icons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-6 w-18 rounded-md" />
            </div>
          </div>
        </div>
        
        {/* Price Section Skeleton */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        
        {/* Description Skeleton */}
        <div className="mt-3 space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

interface VehicleSelectionCardProps {
  vehicleType: string;
  isSelected: boolean;
  onSelect: (vehicleType: string) => void;
  price?: number | null;
  currency?: string;
  showPrice?: boolean;
  isRecommended?: boolean;
  available?: boolean;
  previousPrice?: number | null;
  showDiscountAnimation?: boolean;
  isLoading?: boolean;
}

export function VehicleSelectionCard({
  vehicleType,
  isSelected,
  onSelect,
  price,
  currency = "EUR",
  showPrice = false,
  isRecommended = false,
  available = true,
  previousPrice,
  showDiscountAnimation = false,
  isLoading = false,
}: VehicleSelectionCardProps) {
  const { t, language } = useLanguage();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  
  const vehicleInfo = VEHICLE_TYPE_MAP[vehicleType];
  
  // Show skeleton if loading
  if (isLoading) {
    return <VehicleSelectionCardSkeleton />;
  }
  
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
        onClick={() => available && onSelect(vehicleType)}
        className={`
          relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 group
          ${isSelected 
            ? 'ring-3 ring-primary shadow-2xl scale-[1.02] z-10' 
            : available 
              ? 'hover:shadow-xl hover:scale-[1.01] hover:ring-2 hover:ring-primary/30' 
              : 'opacity-50 cursor-not-allowed grayscale'
          }
        `}
      >
        {/* Gradient Background - More vibrant */}
        <div className={`
          absolute inset-0 transition-all duration-300
          ${isSelected 
            ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5' 
            : isRecommended
              ? 'bg-gradient-to-br from-green-500/15 via-green-500/10 to-emerald-500/5 group-hover:from-green-500/20'
              : 'bg-gradient-to-br from-muted via-muted/70 to-background group-hover:from-muted/90'
          }
        `} />
        
        {/* Border - More prominent */}
        <div className={`
          absolute inset-0 rounded-2xl border-2 transition-all duration-300
          ${isSelected 
            ? 'border-primary shadow-inner' 
            : isRecommended
              ? 'border-green-500/50 group-hover:border-green-500/70'
              : 'border-border group-hover:border-primary/50'
          }
        `} />
        
        {/* Selection Indicator - Larger and more visible */}
        {isSelected && (
          <div className="absolute top-3 right-3 z-10">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg animate-scale-in">
              <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        )}
        
        {/* Recommended Badge - More prominent */}
        {isRecommended && (
          <div className="absolute top-0 left-0 z-10">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-2 rounded-br-2xl rounded-tl-2xl shadow-lg">
              <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                <ThumbsUp className="h-4 w-4" />
                {isTurkish ? "Önerilen" : "Recommended"}
              </span>
            </div>
          </div>
        )}
        
        <div className="relative p-5 sm:p-6">
          <div className="flex gap-5">
            {/* Vehicle Image - Larger */}
            <div 
              className="w-36 sm:w-44 h-28 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer shadow-lg ring-1 ring-border/50"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-3">
                    <span className="flex items-center gap-1.5 text-white text-xs font-semibold bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                      <ZoomIn className="h-3.5 w-3.5" />
                      {isTurkish ? "Galeri" : "View Gallery"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Car className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Vehicle Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
              {/* Header: Name */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-bold text-lg sm:text-xl leading-tight">
                    {vehicleInfo.label}
                  </h4>
                </div>
                
                {/* Capacity Pills - More prominent */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-sm font-bold shadow-sm">
                    <Users className="h-4 w-4" />
                    <span>{vehicleInfo.passengers}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/15 text-accent-foreground text-sm font-bold shadow-sm">
                    <Briefcase className="h-4 w-4" />
                    <span>{vehicleInfo.luggage}</span>
                  </div>
                </div>
              </div>
              
              {/* Feature Icons - Colorful and more visible */}
              {vehicleInfo.features && vehicleInfo.features.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {vehicleInfo.features.slice(0, 4).map((feature, idx) => {
                    const { icon: FeatureIcon, color } = getFeatureIconWithColor(feature.icon);
                    return (
                      <div 
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/90 border border-border/60 text-xs font-medium hover:border-primary/40 hover:bg-background transition-colors shadow-sm"
                        title={isTurkish ? feature.labelTr : feature.label}
                      >
                        <FeatureIcon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                        <span className="hidden sm:inline truncate max-w-[80px] text-muted-foreground">
                          {isTurkish ? feature.labelTr : feature.label}
                        </span>
                      </div>
                    );
                  })}
                  {vehicleInfo.features.length > 4 && (
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">
                      +{vehicleInfo.features.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Price Section - MUCH more prominent */}
          {showPrice && (
            <div className={`
              mt-5 pt-4 border-t-2 flex items-center justify-between transition-all duration-500
              ${isSelected ? 'border-primary/30' : 'border-border/60'}
              ${showDiscountAnimation && previousPrice ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 -mx-2' : ''}
            `}>
              <span className="text-sm text-muted-foreground font-medium">
                {isTurkish ? "Tek yön transfer" : "One-way transfer"}
              </span>
              {available && price ? (
                <div className="text-right flex items-center gap-3">
                  {/* Show old price strikethrough when discount just applied */}
                  {showDiscountAnimation && previousPrice && previousPrice > price && (
                    <span className="text-lg line-through text-muted-foreground/70">
                      {getCurrencySymbol(currency)}{previousPrice}
                    </span>
                  )}
                  <div className={`
                    relative px-5 py-2 rounded-xl transition-all duration-300
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : showDiscountAnimation && previousPrice 
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-primary/10 text-primary'
                    }
                  `}>
                    <span className={`
                      text-2xl sm:text-3xl font-extrabold tracking-tight
                      ${showDiscountAnimation && previousPrice ? 'animate-pulse' : ''}
                    `}>
                      {getCurrencySymbol(currency)}{price}
                    </span>
                  </div>
                  {/* Discount badge */}
                  {showDiscountAnimation && previousPrice && previousPrice > price && (
                    <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full font-bold animate-bounce shadow-md">
                      -{getCurrencySymbol(currency)}{previousPrice - price}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic bg-muted px-3 py-2 rounded-lg">
                  {available ? (isTurkish ? "Fiyat bekleniyor" : "Price pending") : (isTurkish ? "Uygun değil" : "Not available")}
                </span>
              )}
            </div>
          )}
          
          {/* Description - Slightly larger */}
          <p className="text-sm text-muted-foreground mt-4 line-clamp-2 leading-relaxed">
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
