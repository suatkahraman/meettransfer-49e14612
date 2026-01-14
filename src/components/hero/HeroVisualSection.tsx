import { memo, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Plane, Star, Check, Wifi, Baby, Briefcase, ChevronLeft, ChevronRight, Play, Image } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { CityVideo } from "./types";
import heroMercedes from "@/assets/hero-mercedes-vito.jpg";

// Optimized WebP hero images for gallery
import heroAirportFleet from "@/assets/hero/hero-airport-fleet.webp";
import heroSkyline from "@/assets/hero/hero-city-skyline.webp";
import heroFuturistic1 from "@/assets/hero-futuristic-1.jpg";
import heroFuturistic2 from "@/assets/hero-futuristic-2.jpg";

// Gallery images configuration with optimized local assets - multilingual labels
type GalleryLabels = Record<string, string>;
const GALLERY_IMAGES: { src: string; labels: GalleryLabels }[] = [
  { 
    src: heroMercedes, 
    labels: { EN: "Mercedes Vito", TR: "Mercedes Vito", DE: "Mercedes Vito", FR: "Mercedes Vito", RU: "Mercedes Vito", IT: "Mercedes Vito", ES: "Mercedes Vito", AR: "مرسيدس فيتو", UK: "Mercedes Vito", JA: "メルセデス Vito" }
  },
  { 
    src: heroAirportFleet, 
    labels: { EN: "Airport Fleet", TR: "Havalimanı Filosu", DE: "Flughafenflotte", FR: "Flotte aéroport", RU: "Автопарк аэропорта", IT: "Flotta aeroporto", ES: "Flota aeropuerto", AR: "أسطول المطار", UK: "Автопарк аеропорту", JA: "空港車両" }
  },
  { 
    src: heroSkyline, 
    labels: { EN: "City Skyline", TR: "Şehir Silüeti", DE: "Stadtskyline", FR: "Horizon urbain", RU: "Городской пейзаж", IT: "Skyline città", ES: "Horizonte urbano", AR: "أفق المدينة", UK: "Міський пейзаж", JA: "都市スカイライン" }
  },
  { 
    src: heroFuturistic1, 
    labels: { EN: "VIP Transfer", TR: "VIP Transfer", DE: "VIP Transfer", FR: "Transfert VIP", RU: "VIP трансфер", IT: "Trasferimento VIP", ES: "Transfer VIP", AR: "نقل VIP", UK: "VIP трансфер", JA: "VIPトランスファー" }
  },
  { 
    src: heroFuturistic2, 
    labels: { EN: "Luxury Journey", TR: "Lüks Yolculuk", DE: "Luxusreise", FR: "Voyage de luxe", RU: "Люксовая поездка", IT: "Viaggio di lusso", ES: "Viaje de lujo", AR: "رحلة فاخرة", UK: "Люксова подорож", JA: "豪華な旅" }
  },
];

// Helper function to get label by language
const getGalleryLabel = (labels: GalleryLabels, language: string): string => {
  return labels[language] || labels.EN;
};

// Media item type for unified carousel
type MediaItem = 
  | { type: 'video'; video: CityVideo; index: number }
  | { type: 'image'; src: string; labels: GalleryLabels; index: number };

interface HeroVisualSectionProps {
  videosLoaded: boolean;
  cityVideos: CityVideo[];
  currentVideoIndex: number;
  language: string;
  t: (key: string) => string;
}

export const HeroVisualSection = memo(({
  videosLoaded,
  cityVideos,
  currentVideoIndex,
  language,
  t
}: HeroVisualSectionProps) => {
  // Mobile: Always show static image for performance
  const [isMobile, setIsMobile] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile image slider state
  const [mobileImageIndex, setMobileImageIndex] = useState(0);

  // Combine videos and images into unified media array
  const mediaItems: MediaItem[] = useMemo(() => {
    const items: MediaItem[] = [];
    
    // Add videos first (if loaded on desktop)
    if (!isMobile && videosLoaded && cityVideos.length > 0) {
      cityVideos.forEach((video, idx) => {
        items.push({ type: 'video', video, index: idx });
      });
    }
    
    // Add gallery images
    GALLERY_IMAGES.forEach((img, idx) => {
      items.push({ type: 'image', ...img, index: idx });
    });
    
    return items;
  }, [isMobile, videosLoaded, cityVideos]);

  // Auto-rotate mobile images
  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(() => {
      setMobileImageIndex((prev) => (prev + 1) % GALLERY_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isMobile]);

  const currentMedia = mediaItems[currentMediaIndex] || mediaItems[0];

  // Auto-rotate through all media (videos + images)
  useEffect(() => {
    if (isMobile || mediaItems.length <= 1) return;
    
    // Longer interval for videos, shorter for images
    const intervalTime = currentMedia?.type === 'video' ? 6000 : 4000;
    
    const interval = setInterval(() => {
      setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [isMobile, mediaItems.length, currentMedia?.type]);

  // Reset index when media items change
  useEffect(() => {
    if (currentMediaIndex >= mediaItems.length) {
      setCurrentMediaIndex(0);
    }
  }, [mediaItems.length, currentMediaIndex]);

  const nextMedia = () => setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
  const prevMedia = () => setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);

  const currentMobileImage = GALLERY_IMAGES[mobileImageIndex];
  const nextMobileImage = useCallback(() => setMobileImageIndex((prev) => (prev + 1) % GALLERY_IMAGES.length), []);
  const prevMobileImage = useCallback(() => setMobileImageIndex((prev) => (prev - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length), []);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextMobileImage,
    onSwipedRight: prevMobileImage,
    trackMouse: false,
    trackTouch: true,
    delta: 30,
    preventScrollOnSwipe: true,
  });

  return (
    <>
      {/* Mobile Visual Section - Image Slider with Swipe */}
      <div className="order-2 md:hidden">
        <div {...swipeHandlers} className="relative rounded-xl overflow-hidden shadow-lg touch-pan-y">
          <div className="relative h-40">
            {/* Base fallback image */}
            <img
              src={heroMercedes}
              alt="VIP Transfer"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            
            {/* Animated image slider */}
            <AnimatePresence mode="wait">
              <motion.img
                key={mobileImageIndex}
                src={currentMobileImage.src}
                alt={getGalleryLabel(currentMobileImage.labels, language)}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                loading="eager"
              />
            </AnimatePresence>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Navigation arrows */}
            <button
              onClick={prevMobileImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white z-10"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMobileImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white z-10"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            
            {/* Image label */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 z-10">
              <Image className="h-2.5 w-2.5 text-yellow-400" />
              <span className="text-[10px] text-white font-medium">
                {getGalleryLabel(currentMobileImage.labels, language)}
              </span>
            </div>
            
            {/* Dots navigation */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {GALLERY_IMAGES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setMobileImageIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === mobileImageIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <div className="text-white">
                <h3 className="text-xs font-bold mb-1">{t("premiumFleet") || "Premium Mercedes Fleet"}</h3>
                <div className="flex flex-wrap gap-1">
                  <div className="flex items-center gap-0.5 text-[9px] bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <Wifi className="h-2 w-2" />
                    <span>{t("freeWifi") || "WiFi"}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[9px] bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <Baby className="h-2 w-2" />
                    <span>{t("babySeatLabel") || "Baby"}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[9px] bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <Briefcase className="h-2 w-2" />
                    <span>{t("meetGreet") || "Meet"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Stats Row - More compact */}
          <div className="flex items-center justify-around bg-card p-2 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-3 w-3 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">100+</div>
                <div className="text-[8px] text-muted-foreground">{t("cities") || "Cities"}</div>
              </div>
            </div>
            <div className="w-px h-6 bg-border/50" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                <Plane className="h-3 w-3 text-accent" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">670+</div>
                <div className="text-[8px] text-muted-foreground">{t("airports") || "Airports"}</div>
              </div>
            </div>
            <div className="w-px h-6 bg-border/50" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">4.9</div>
                <div className="text-[8px] text-muted-foreground">{t("googleReviews") || "Google"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Visual Section - Mixed Video + Gallery Carousel */}
      <motion.div 
        className="order-3 hidden md:block md:col-span-2 lg:col-span-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="relative">
          {/* Main Video/Image Carousel */}
          <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <div className="relative w-full h-48 md:h-56 lg:h-80 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
              {/* Fallback image */}
              <img
                src={heroMercedes}
                alt="VIP Transfer"
                className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-105 z-0"
                loading="eager"
              />
              
              {/* Render all media items with crossfade */}
              <AnimatePresence mode="wait">
                {currentMedia?.type === 'video' ? (
                  <motion.div
                    key={`video-${currentMediaIndex}`}
                    className="absolute inset-0 w-full h-full z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      poster={currentMedia.video.poster}
                      className="w-full h-full object-cover brightness-110 contrast-105"
                      onLoadedData={(e) => {
                        const videoEl = e.target as HTMLVideoElement;
                        videoEl.play().catch(() => {});
                      }}
                    >
                      <source src={currentMedia.video.src} type="video/mp4" />
                    </video>
                  </motion.div>
                ) : currentMedia?.type === 'image' ? (
                  <motion.img
                    key={`image-${currentMediaIndex}`}
                    src={currentMedia.src}
                    alt={getGalleryLabel(currentMedia.labels, language)}
                    className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-105 z-10"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    loading="eager"
                    decoding="async"
                  />
                ) : null}
              </AnimatePresence>
              
              {/* Media label badge */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 z-20 border border-white/20">
                {currentMedia?.type === 'video' ? (
                  <>
                    <Play className="h-3.5 w-3.5 text-white fill-white" />
                    <span className="text-xs text-white font-semibold">
                      {language === 'TR' ? currentMedia.video.labelTR : currentMedia.video.label}
                    </span>
                  </>
                ) : currentMedia?.type === 'image' ? (
                  <>
                    <Image className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="text-xs text-white font-semibold">
                      {getGalleryLabel(currentMedia.labels, language)}
                    </span>
                  </>
                ) : null}
              </div>
              
              {/* Navigation dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                {mediaItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentMediaIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                      idx === currentMediaIndex 
                        ? 'bg-white w-4' 
                        : item.type === 'video' 
                          ? 'bg-primary/60 hover:bg-primary/80 w-2' 
                          : 'bg-white/40 hover:bg-white/60 w-2'
                    }`}
                    aria-label={`Go to ${item.type} ${idx + 1}`}
                  />
                ))}
              </div>
              
              {/* Navigation arrows */}
              <button
                onClick={prevMedia}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors z-20 border border-white/20"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextMedia}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors z-20 border border-white/20"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            {/* Lighter gradient for better image visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent pointer-events-none" />
            
            {/* Overlay Content - with better contrast */}
            <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-6 z-20">
              <div className="text-white drop-shadow-lg">
                <h3 className="text-sm lg:text-lg font-bold mb-1 lg:mb-2 drop-shadow-md">{t("premiumFleet") || "Premium Mercedes Fleet"}</h3>
                  <div className="flex flex-wrap gap-1.5 lg:gap-3">
                    <div className="flex items-center gap-1 text-xs lg:text-sm bg-black/40 backdrop-blur-md rounded-full px-2.5 lg:px-3.5 py-1 lg:py-1.5 border border-white/20">
                      <Wifi className="h-3 lg:h-3.5 w-3 lg:w-3.5" />
                      <span className="hidden lg:inline font-medium">{t("freeWifi") || "Free WiFi"}</span>
                      <span className="lg:hidden font-medium">{t("freeWifi") || "WiFi"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs lg:text-sm bg-black/40 backdrop-blur-md rounded-full px-2.5 lg:px-3.5 py-1 lg:py-1.5 border border-white/20">
                      <Baby className="h-3 lg:h-3.5 w-3 lg:w-3.5" />
                      <span className="hidden lg:inline font-medium">{t("babySeat") || "Baby Seat"}</span>
                      <span className="lg:hidden font-medium">{t("babySeatLabel") || "Baby"}</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-1.5 text-sm bg-black/40 backdrop-blur-md rounded-full px-3.5 py-1.5 border border-white/20">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span className="font-medium">{t("meetGreet") || "Meet & Greet"}</span>
                    </div>
                  </div>
              </div>
            </div>
          </div>

          {/* Floating Stats Cards */}
          <motion.div 
            className="absolute -top-2 lg:-top-4 -right-2 lg:-right-4 bg-card rounded-lg lg:rounded-xl shadow-xl p-2 lg:p-4 border border-border/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-7 h-7 lg:w-10 lg:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-3.5 lg:h-5 w-3.5 lg:w-5 text-primary" />
              </div>
              <div>
                <div className="text-base lg:text-xl font-bold text-foreground">100+</div>
                <div className="text-[10px] lg:text-xs text-muted-foreground">{t("cities") || "Cities"}</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="absolute -bottom-2 lg:-bottom-4 -left-2 lg:-left-4 bg-card rounded-lg lg:rounded-xl shadow-xl p-2 lg:p-4 border border-border/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-7 h-7 lg:w-10 lg:h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Plane className="h-3.5 lg:h-5 w-3.5 lg:w-5 text-accent" />
              </div>
              <div>
                <div className="text-base lg:text-xl font-bold text-foreground">670+</div>
                <div className="text-[10px] lg:text-xs text-muted-foreground">{t("airports") || "Airports"}</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="absolute top-1/2 -right-6 bg-card rounded-xl shadow-xl p-4 border border-border/50 hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">4.9</div>
                <div className="text-xs text-muted-foreground">{t("googleReviews") || "Google"}</div>
              </div>
            </div>
          </motion.div>

          {/* Destination Cities Row */}
          <div className="mt-4 lg:mt-6 hidden lg:block">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-medium">{t("serviceLocations") || "We Serve"}:</span>
              <span>Antalya • Bodrum • Dalaman • İzmir • Dubai • Cyprus</span>
            </div>
          </div>

          {/* Feature List */}
          <div className="mt-4 lg:mt-6 grid grid-cols-2 gap-2 lg:gap-3">
            <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
              <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-sm text-foreground truncate">{t("freeCancellation") || "Free Cancel"}</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
              <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-sm text-foreground truncate">{t("flightTracking") || "Flight Track"}</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
              <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-sm text-foreground truncate">{t("noHiddenFees") || "No Hidden Fees"}</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
              <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-sm text-foreground truncate">24/7 {t("support") || "Support"}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
});

HeroVisualSection.displayName = "HeroVisualSection";
