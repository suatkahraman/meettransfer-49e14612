import { memo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { CityVideo } from "./types";

// Futuristic hero backgrounds - local assets for fast loading
import heroFuturistic1 from "@/assets/hero-futuristic-1.jpg";
import heroFuturistic2 from "@/assets/hero-futuristic-2.jpg";
import heroFuturistic3 from "@/assets/hero-futuristic-3.jpg";
import heroFuturistic4 from "@/assets/hero-futuristic-4.jpg";
import heroMercedes from "@/assets/hero-mercedes-vito.jpg";

// Background images configuration - optimized for fast loading
const HERO_BACKGROUNDS = [
  { src: heroFuturistic1, label: "City Night", labelTR: "Gece Şehir" },
  { src: heroFuturistic2, label: "Airport Transfer", labelTR: "Havalimanı Transfer" },
  { src: heroFuturistic3, label: "VIP Interior", labelTR: "VIP İç Mekan" },
  { src: heroFuturistic4, label: "Luxury Fleet", labelTR: "Lüks Filo" },
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

  // Preload all images immediately for instant transitions
  useEffect(() => {
    const preloadImages = async () => {
      const promises = HERO_BACKGROUNDS.map((bg) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = bg.src;
        });
      });
      await Promise.all(promises);
      setImagesPreloaded(true);
    };
    preloadImages();
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
    <div className="absolute inset-0 z-0">
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
          className="absolute bottom-8 right-8 z-20 hidden md:block"
        >
          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-md rounded-full px-4 py-2 border border-primary/30 shadow-xl">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {language === 'TR' ? currentBg.labelTR : currentBg.label}
            </span>
          </div>
        </motion.div>
        
        {/* Navigation Dots - Desktop */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden md:flex gap-2">
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
  );
});

HeroBackground.displayName = "HeroBackground";
