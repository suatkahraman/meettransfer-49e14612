import { Users, Car, CheckCircle2, ZoomIn, Briefcase, Snowflake, Wifi, BatteryCharging, Droplets, Sparkles, Tv, Crown, Wine, Armchair, Stars, ThumbsUp, TrendingUp, Award, Gem, Heart } from "lucide-react";
import { VEHICLE_TYPE_MAP, VehicleTypeInfo } from "@/lib/vehicleTypes";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
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

// Skeleton Loading Component - Mobile optimized
export function VehicleSelectionCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border sm:border-2 border-border/60 bg-gradient-to-br from-muted/80 via-muted/50 to-background">
      <div className="relative p-3 sm:p-5">
        <div className="flex gap-3 sm:gap-5">
          {/* Image Skeleton */}
          <Skeleton className="w-24 h-20 sm:w-36 sm:h-28 rounded-lg sm:rounded-xl flex-shrink-0" />
          
          {/* Details Skeleton */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              {/* Title */}
              <Skeleton className="h-4 sm:h-6 w-24 sm:w-32 mb-1.5 sm:mb-2" />
              
              {/* Capacity Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 rounded-md sm:rounded-lg" />
                <Skeleton className="h-5 sm:h-6 w-10 sm:w-14 rounded-md sm:rounded-lg" />
              </div>
            </div>
            
            {/* Feature Icons */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <Skeleton className="h-5 sm:h-6 w-6 sm:w-20 rounded-md" />
              <Skeleton className="h-5 sm:h-6 w-6 sm:w-16 rounded-md" />
              <Skeleton className="h-5 sm:h-6 w-6 sm:w-18 rounded-md" />
            </div>
          </div>
        </div>
        
        {/* Price Section Skeleton */}
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border/40 flex items-center justify-between">
          <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
          <Skeleton className="h-7 sm:h-8 w-16 sm:w-20" />
        </div>
      </div>
    </div>
  );
}

// Badge types for vehicle cards
export type VehicleBadgeType = 'popular' | 'best-value' | 'premium' | 'family-friendly' | 'luxury' | null;

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
  badge?: VehicleBadgeType;
  badgeAnimationDelay?: number; // Stagger delay in ms for badge animation
}

// Badge configuration
const getBadgeConfig = (badge: VehicleBadgeType, isTurkish: boolean) => {
  const configs: Record<NonNullable<VehicleBadgeType>, { label: string; labelTr: string; icon: typeof TrendingUp; gradient: string; textColor: string }> = {
    'popular': {
      label: 'Most Popular',
      labelTr: 'En Popüler',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-indigo-600',
      textColor: 'text-white'
    },
    'best-value': {
      label: 'Best Value',
      labelTr: 'En İyi Değer',
      icon: Award,
      gradient: 'from-amber-500 to-orange-600',
      textColor: 'text-white'
    },
    'premium': {
      label: 'Premium',
      labelTr: 'Premium',
      icon: Crown,
      gradient: 'from-purple-500 to-violet-600',
      textColor: 'text-white'
    },
    'family-friendly': {
      label: 'Family Choice',
      labelTr: 'Aile Tercihi',
      icon: Heart,
      gradient: 'from-pink-500 to-rose-600',
      textColor: 'text-white'
    },
    'luxury': {
      label: 'Luxury',
      labelTr: 'Lüks',
      icon: Gem,
      gradient: 'from-yellow-500 to-amber-600',
      textColor: 'text-white'
    }
  };
  return badge ? configs[badge] : null;
};

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
  badge = null,
  badgeAnimationDelay = 0,
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
          relative overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer group
          transition-all duration-500 ease-out
          ${isSelected 
            ? 'ring-2 sm:ring-3 ring-primary shadow-xl sm:shadow-2xl scale-[1.02] sm:scale-[1.03] z-10 animate-[selectedPop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]' 
            : available 
              ? 'hover:shadow-2xl sm:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] hover:ring-1 sm:hover:ring-2 hover:ring-primary/40' 
              : 'opacity-50 cursor-not-allowed grayscale'
          }
        `}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
        onMouseMove={(e) => {
          if (!available || isSelected) return;
          const card = e.currentTarget;
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = (y - centerY) / 20;
          const rotateY = (centerX - x) / 20;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        }}
        onMouseLeave={(e) => {
          if (!available || isSelected) return;
          const card = e.currentTarget;
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        }}
      >
        {/* 3D Hover Shine Effect */}
        <div 
          className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl sm:rounded-2xl overflow-hidden"
        >
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[cardShine_1.5s_ease-in-out_infinite]"
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
        
        {/* Animated Glow Effect for Selected */}
        {isSelected && (
          <div 
            className="absolute -inset-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary via-primary/80 to-primary opacity-30 blur-md z-0 animate-[selectedGlow_2s_ease-in-out_infinite]"
          />
        )}
        
        {/* Gradient Background */}
        <div className={`
          absolute inset-0 transition-all duration-500
          ${isSelected 
            ? 'bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5' 
            : isRecommended
              ? 'bg-gradient-to-br from-green-500/15 via-green-500/10 to-emerald-500/5 group-hover:from-green-500/20'
              : 'bg-gradient-to-br from-muted via-muted/70 to-background group-hover:from-primary/5'
          }
        `} />
        
        {/* Animated Border for Selected */}
        <div className={`
          absolute inset-0 rounded-xl sm:rounded-2xl border sm:border-2 transition-all duration-300
          ${isSelected 
            ? 'border-primary shadow-inner' 
            : isRecommended
              ? 'border-green-500/50 group-hover:border-green-500/70'
              : 'border-border group-hover:border-primary/50'
          }
        `}>
          {isSelected && (
            <div 
              className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-primary/50"
              style={{ animation: 'borderPulse 1.5s ease-in-out infinite' }}
            />
          )}
        </div>
        
        {/* Selection Indicator - Enhanced with animation */}
        {isSelected && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
            <div className="relative">
              {/* Ripple effect */}
              <div 
                className="absolute inset-0 rounded-full bg-primary"
                style={{ animation: 'rippleOut 1s ease-out infinite' }}
              />
              {/* Main badge */}
              <div 
                className="relative h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg"
                style={{ animation: 'checkBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <CheckCircle2 
                  className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" 
                  style={{ animation: 'checkmarkPop 0.3s ease-out 0.2s both' }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Recommended Badge - Compact on mobile */}
        {isRecommended && !badge && (
          <div className="absolute top-0 left-0 z-10">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2.5 py-1 sm:px-5 sm:py-2 rounded-br-xl sm:rounded-br-2xl rounded-tl-xl sm:rounded-tl-2xl shadow-lg">
              <span className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold uppercase tracking-wide">
                <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">{isTurkish ? "Önerilen" : "Recommended"}</span>
                <span className="xs:hidden">★</span>
              </span>
            </div>
          </div>
        )}
        
        {/* Custom Badge - Popular, Best Value, Premium, etc. with staggered animation */}
        {badge && (() => {
          const badgeConfig = getBadgeConfig(badge, isTurkish);
          if (!badgeConfig) return null;
          const BadgeIcon = badgeConfig.icon;
          return (
            <div 
              className="absolute top-0 left-0 z-10 opacity-0"
              style={{ 
                animation: `badgeSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${badgeAnimationDelay}ms forwards`
              }}
            >
              <div className={`bg-gradient-to-r ${badgeConfig.gradient} ${badgeConfig.textColor} px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-br-xl sm:rounded-br-2xl rounded-tl-xl sm:rounded-tl-2xl shadow-lg relative overflow-hidden`}>
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmerBadge_2s_ease-in-out_infinite]"
                />
                <span className="relative flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                  <BadgeIcon 
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-[iconPop_0.3s_ease-out_both]"
                  />
                  <span>{isTurkish ? badgeConfig.labelTr : badgeConfig.label}</span>
                </span>
              </div>
            </div>
          );
        })()}
        
        <div className="relative p-3 sm:p-5">
          <div className="flex gap-3 sm:gap-5">
            {/* Vehicle Image - Compact on mobile */}
            <div 
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer shadow-md sm:shadow-lg ring-1 ring-border/50"
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
                    className="w-full h-full absolute inset-0"
                    plugins={[Fade(), Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: false })]}
                    opts={{ loop: true }}
                  >
                    <CarouselContent className="h-full ml-0">
                      {vehicleImages.slice(0, 4).map((img, idx) => (
                        <CarouselItem key={idx} className="h-full pl-0 basis-full">
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover object-center"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                  {/* Zoom overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-1.5 sm:pb-3 z-10">
                    <span className="flex items-center gap-1 text-white text-[10px] sm:text-xs font-semibold bg-black/30 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm">
                      <ZoomIn className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden sm:inline">{isTurkish ? "Galeri" : "Gallery"}</span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Car className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Vehicle Details - Compact layout */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              {/* Header: Name */}
              <div>
                <h4 className="font-bold text-sm sm:text-lg leading-tight mb-1.5 sm:mb-3 line-clamp-1">
                  {vehicleInfo.label}
                </h4>
                
                {/* Capacity Pills - Compact on mobile */}
                <div className="flex items-center gap-1.5 sm:gap-3 mb-2 sm:mb-4">
                  <div className="inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg bg-primary/15 text-primary text-xs sm:text-sm font-bold">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{vehicleInfo.passengers}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg bg-accent/15 text-accent-foreground text-xs sm:text-sm font-bold">
                    <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{vehicleInfo.luggage}</span>
                  </div>
                </div>
              </div>
              
              {/* Feature Icons - Compact on mobile, icons only */}
              {vehicleInfo.features && vehicleInfo.features.length > 0 && (
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  {vehicleInfo.features.slice(0, 3).map((feature, idx) => {
                    const { icon: FeatureIcon, color } = getFeatureIconWithColor(feature.icon);
                    return (
                      <div 
                        key={idx}
                        className="flex items-center gap-1 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg bg-background/90 border border-border/60 text-[10px] sm:text-xs font-medium"
                        title={isTurkish ? feature.labelTr : feature.label}
                      >
                        <FeatureIcon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 ${color}`} />
                        <span className="hidden sm:inline truncate max-w-[60px] text-muted-foreground">
                          {isTurkish ? feature.labelTr : feature.label}
                        </span>
                      </div>
                    );
                  })}
                  {vehicleInfo.features.length > 3 && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium bg-muted px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                      +{vehicleInfo.features.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Price Section - Compact on mobile */}
          {showPrice && (
            <div className={`
              mt-3 sm:mt-5 pt-3 sm:pt-4 border-t sm:border-t-2 flex items-center justify-between transition-all duration-500
              ${isSelected ? 'border-primary/30' : 'border-border/60'}
              ${showDiscountAnimation && previousPrice ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg sm:rounded-xl p-2 sm:p-4 -mx-1 sm:-mx-2' : ''}
            `}>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                {isTurkish ? "Tek yön" : "One-way"}
              </span>
              {available && price ? (
                <div className="text-right flex items-center gap-2 sm:gap-3">
                  {showDiscountAnimation && previousPrice && previousPrice > price && (
                    <span className="text-sm sm:text-lg line-through text-muted-foreground/70">
                      {getCurrencySymbol(currency)}{previousPrice}
                    </span>
                  )}
                  <div className={`
                    relative px-3 py-1.5 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : showDiscountAnimation && previousPrice 
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-primary/10 text-primary'
                    }
                  `}>
                    <span className={`
                      text-lg sm:text-2xl font-extrabold tracking-tight
                      ${showDiscountAnimation && previousPrice ? 'animate-pulse' : ''}
                    `}>
                      {getCurrencySymbol(currency)}{price}
                    </span>
                  </div>
                  {showDiscountAnimation && previousPrice && previousPrice > price && (
                    <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-[10px] sm:text-xs bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-bold animate-bounce shadow-md">
                      -{getCurrencySymbol(currency)}{previousPrice - price}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs sm:text-sm text-muted-foreground italic bg-muted px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg">
                  {available ? (isTurkish ? "Fiyat bekleniyor" : "Pending") : (isTurkish ? "Uygun değil" : "N/A")}
                </span>
              )}
            </div>
          )}
          
          {/* Description - Hidden on mobile, visible on larger screens */}
          <p className="hidden sm:block text-sm text-muted-foreground mt-4 line-clamp-2 leading-relaxed">
            {isTurkish ? vehicleInfo.descriptionTr : vehicleInfo.description}
          </p>
        </div>
      </div>

      {/* Image Gallery Modal - Optimized for mobile viewport */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden mx-2 sm:mx-auto rounded-2xl">
          <DialogClose className="absolute right-2 top-2 sm:right-4 sm:top-4 z-50">
            <Button variant="secondary" size="icon" className="rounded-full h-8 w-8 sm:h-10 sm:w-10 shadow-lg">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          
          <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
            {/* Header with vehicle name */}
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 pr-10">{vehicleInfo.label}</h3>
            
            {/* Image carousel */}
            {vehicleImages.length > 0 && (
              <Carousel 
                className="w-full" 
                opts={{ loop: true }}
                plugins={[Fade(), Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true })]}
              >
                <CarouselContent>
                  {vehicleImages.map((img, idx) => (
                    <CarouselItem key={idx}>
                      <div className="relative aspect-[4/3] sm:aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-muted">
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="w-full h-full object-contain sm:object-cover"
                          loading="lazy"
                        />
                        {/* Image Caption */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4">
                          <p className="text-white text-xs sm:text-sm font-medium drop-shadow-lg line-clamp-2">
                            {img.alt}
                          </p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )}
            
            {/* Features list - scrollable on mobile */}
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
              {vehicleInfo.features.map((feature, idx) => {
                const { icon: FeatureIcon, color } = getFeatureIconWithColor(feature.icon);
                return (
                  <div 
                    key={idx}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-muted text-xs sm:text-sm"
                  >
                    <FeatureIcon className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${color}`} />
                    <span className="whitespace-nowrap">{isTurkish ? feature.labelTr : feature.label}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Description with better readability */}
            <p className="text-sm sm:text-base text-muted-foreground mt-3 sm:mt-4 leading-relaxed">
              {isTurkish ? vehicleInfo.descriptionTr : vehicleInfo.description}
            </p>
            
            {/* Capacity info */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="font-medium">{vehicleInfo.passengers} {isTurkish ? 'Yolcu' : 'Passengers'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="font-medium">{vehicleInfo.luggage} {isTurkish ? 'Bavul' : 'Luggage'}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
