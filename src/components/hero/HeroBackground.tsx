import { memo, useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { CityVideo } from "./types";

// Only import the FIRST (LCP) image statically - others loaded dynamically
import heroFuturisticCity from "@/assets/hero/hero-futuristic-city.webp";

// Background images configuration - paths for dynamic loading
const HERO_BACKGROUND_PATHS = [
  { src: heroFuturisticCity, label: "Futuristic City", labelTR: "Fütüristik Şehir" },
  { path: "/src/assets/hero/hero-airport-fleet.webp", label: "Airport Fleet", labelTR: "Havalimanı Filosu" },
  { path: "/src/assets/hero/hero-city-skyline.webp", label: "City Skyline", labelTR: "Şehir Silüeti" },
  { path: "/src/assets/hero/hero-futuristic-1.webp", label: "VIP Transfer", labelTR: "VIP Transfer" },
  { path: "/src/assets/hero/hero-futuristic-2.webp", label: "Luxury Journey", labelTR: "Lüks Yolculuk" },
  { path: "/src/assets/hero/hero-mercedes-vito.webp", label: "Mercedes Vito", labelTR: "Mercedes Vito" },
];

interface HeroBackgroundProps {
  videosLoaded: boolean;
  cityVideos: CityVideo[];
  currentVideoIndex: number;
  setCurrentVideoIndex: (index: number) => void;
  language: string;
}

export const HeroBackground = memo(({
  language
}: HeroBackgroundProps) => {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<string[]>([heroFuturisticCity]);
  const [slideshowReady, setSlideshowReady] = useState(false);

  // Defer slideshow initialization - don't block LCP
  useEffect(() => {
    // Wait for page to be interactive before loading slideshow images
    const initSlideshow = async () => {
      // Dynamically import remaining images
      const imports = await Promise.all([
        import("@/assets/hero/hero-airport-fleet.webp"),
        import("@/assets/hero/hero-city-skyline.webp"),
        import("@/assets/hero/hero-futuristic-1.webp"),
        import("@/assets/hero/hero-futuristic-2.webp"),
        import("@/assets/hero/hero-mercedes-vito.webp"),
      ]);
      
      setLoadedImages([
        heroFuturisticCity,
        imports[0].default,
        imports[1].default,
        imports[2].default,
        imports[3].default,
        imports[4].default,
      ]);
      setSlideshowReady(true);
    };

    // Use requestIdleCallback to load after main content is painted
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initSlideshow(), { timeout: 3000 });
    } else {
      setTimeout(initSlideshow, 2000);
    }
  }, []);

  // Auto-rotate only when slideshow is ready
  useEffect(() => {
    if (!slideshowReady) return;
    
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % loadedImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slideshowReady, loadedImages.length]);

  const currentBg = HERO_BACKGROUND_PATHS[currentBgIndex];
  const currentSrc = loadedImages[currentBgIndex] || heroFuturisticCity;

  return (
    <>
      {/* Mobile Background - Simple solid color, no images */}
      <div className="absolute inset-0 z-0 md:hidden bg-muted/40" />

      {/* Desktop Image Background - CSS transitions instead of framer-motion */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <div className="absolute inset-0">
          {/* Primary LCP Image - Always visible as base */}
          <img
            src={heroFuturisticCity}
            alt="VIP Transfer Background"
            className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-105 saturate-110"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          
          {/* Slideshow overlay - CSS transition for crossfade */}
          {slideshowReady && currentBgIndex > 0 && (
            <img
              key={currentBgIndex}
              src={currentSrc}
              alt={language === 'TR' ? currentBg.labelTR : currentBg.label}
              className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-105 saturate-110 animate-fade-in"
              loading="lazy"
              decoding="async"
            />
          )}
          
          {/* Background Label Badge - Desktop - Simple CSS animation */}
          <div 
            className={cn(
              "absolute bottom-8 right-8 z-20 transition-all duration-300",
              slideshowReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <div className="flex items-center gap-2 bg-background/90 backdrop-blur-md rounded-full px-4 py-2 border border-primary/30 shadow-xl">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {language === 'TR' ? currentBg.labelTR : currentBg.label}
              </span>
            </div>
          </div>
          
          {/* Navigation Dots - Desktop - Only show when slideshow ready */}
          {slideshowReady && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {loadedImages.map((_, index) => (
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
          )}
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
