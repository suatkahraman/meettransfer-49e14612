import { memo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { CityVideo } from "./types";

// Optimized WebP hero backgrounds - local assets for fast loading
import heroAirportFleet from "@/assets/hero/hero-airport-fleet.webp";
import heroSkylane from "@/assets/hero/hero-city-skyline.webp";
import heroFuturistic1 from "@/assets/hero/hero-futuristic-1.webp";
import heroFuturistic2 from "@/assets/hero/hero-futuristic-2.webp";
import heroMercedes from "@/assets/hero/hero-mercedes-vito.webp";
import heroFuturisticCity from "@/assets/hero/hero-futuristic-city.webp";

// Background images configuration - optimized WebP format for fast loading
const HERO_BACKGROUNDS = [
  { src: heroFuturisticCity, label: "Futuristic City", labelTR: "Fütüristik Şehir" },
  { src: heroAirportFleet, label: "Airport Fleet", labelTR: "Havalimanı Filosu" },
  { src: heroSkylane, label: "City Skyline", labelTR: "Şehir Silüeti" },
  { src: heroFuturistic1, label: "VIP Transfer", labelTR: "VIP Transfer" },
  { src: heroFuturistic2, label: "Luxury Journey", labelTR: "Lüks Yolculuk" },
  { src: heroMercedes, label: "Mercedes Vito", labelTR: "Mercedes Vito" },
];

interface HeroBackgroundProps {
  videosLoaded: boolean;
  cityVideos: CityVideo[];
  currentVideoIndex: number;
  setCurrentVideoIndex: (index: number) => void;
  language: string;
}

export const HeroBackground = memo(({
  videosLoaded,
  cityVideos,
  currentVideoIndex,
  setCurrentVideoIndex,
  language
}: HeroBackgroundProps) => {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // Defer preloading of non-LCP images to avoid bandwidth competition
  useEffect(() => {
    // First image is LCP - already loading, skip preloading others initially
    const preloadRemainingImages = () => {
      // Start from index 1 to skip the first (LCP) image
      HERO_BACKGROUNDS.slice(1).forEach((bg, index) => {
        // Stagger loading to avoid bandwidth competition
        setTimeout(() => {
          const img = new Image();
          img.src = bg.src;
        }, (index + 1) * 500); // 500ms delay between each
      });
      setImagesPreloaded(true);
    };
    
    // Wait for LCP image to likely be loaded before preloading others
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadRemainingImages(), { timeout: 2000 });
    } else {
      setTimeout(preloadRemainingImages, 1500);
    }
  }, []);

  // Auto-rotate through backgrounds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % HERO_BACKGROUNDS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentBg = HERO_BACKGROUNDS[currentBgIndex];

  return (
    <>
      {/* Mobile Background */}
      <div className="absolute inset-0 z-0 md:hidden bg-muted/40" />

      {/* Desktop Image Slideshow Background */}
      <div className="absolute inset-0 z-0 hidden md:block">
        {/* Static Backgrounds - Fast Loading with Local Assets */}
        <div className="absolute inset-0">
          {/* First image loads immediately as base layer */}
          <img
            src={HERO_BACKGROUNDS[0].src}
            alt="VIP Transfer Background"
            className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-105 saturate-110"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          
          {/* Animated crossfade between backgrounds */}
          <AnimatePresence mode="wait">
            <motion.img
              key={currentBgIndex}
              src={currentBg.src}
              alt={language === 'TR' ? currentBg.labelTR : currentBg.label}
              className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-105 saturate-110"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              loading="eager"
              decoding="async"
            />
          </AnimatePresence>
          
          {/* Background Label Badge - Desktop */}
          <motion.div
            key={`label-${currentBgIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="absolute bottom-8 right-8 z-20"
          >
            <div className="flex items-center gap-2 bg-background/90 backdrop-blur-md rounded-full px-4 py-2 border border-primary/30 shadow-xl">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {language === 'TR' ? currentBg.labelTR : currentBg.label}
              </span>
            </div>
          </motion.div>
          
          {/* Navigation Dots - Desktop */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {HERO_BACKGROUNDS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBgIndex(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-md",
                  currentBgIndex === index 
                    ? "bg-primary w-7" 
                    : "bg-white/60 hover:bg-white/80"
                )}
                aria-label={`Go to background ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/20 to-transparent" />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaC0ydjJoMnYtMmgydi0yaC0yem0tMiAydi0yaC0ydjJoMnptMi0yaDJ2LTJoLTJ2MnptLTItNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0yLTJoMnYtMmgtMnYyem0tMiAydjJoLTJ2Mmgydi0yaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
      </div>
    </>
  );
});

HeroBackground.displayName = "HeroBackground";
