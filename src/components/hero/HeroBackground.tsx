import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { CityVideo } from "./types";
import heroMercedes from "@/assets/hero-mercedes-vito.jpg";

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
  return (
    <div className="absolute inset-0 z-0">
      {/* Video Background - Desktop */}
      <div className="absolute inset-0 hidden md:block">
        {videosLoaded && cityVideos.length > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentVideoIndex}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Poster image for instant display */}
                <img
                  src={cityVideos[currentVideoIndex].poster}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-35"
                  loading="eager"
                />
                {/* Video loads on top */}
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster={cityVideos[currentVideoIndex].poster}
                  className="absolute inset-0 w-full h-full object-cover opacity-35"
                  onLoadedData={(e) => {
                    // Fade in video smoothly once loaded
                    (e.target as HTMLVideoElement).style.opacity = '0.35';
                  }}
                >
                  <source src={cityVideos[currentVideoIndex].src} type="video/mp4" />
                </video>
              </motion.div>
            </AnimatePresence>
            
            {/* City Label Badge */}
            <motion.div
              key={`label-${currentVideoIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="absolute bottom-8 right-8 z-20"
            >
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md rounded-full px-4 py-2 border border-primary/30 shadow-xl">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {language === 'TR' 
                    ? cityVideos[currentVideoIndex].labelTR 
                    : cityVideos[currentVideoIndex].label}
                </span>
              </div>
            </motion.div>
            
            {/* Video Navigation Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {cityVideos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentVideoIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    currentVideoIndex === index 
                      ? "bg-primary w-6" 
                      : "bg-foreground/30 hover:bg-foreground/50"
                  )}
                  aria-label={`Go to video ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          <img
            src={heroMercedes}
            alt="VIP Transfer"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
        )}
      </div>
      
      {/* Mobile - Static Image */}
      <div className="absolute inset-0 md:hidden">
        <img
          src={heroMercedes}
          alt="VIP Transfer"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
      </div>
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaC0ydjJoMnYtMmgydi0yaC0yem0tMiAydi0yaC0ydjJoMnptMi0yaDJ2LTJoLTJ2MnptLTItNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0yLTJoMnYtMmgtMnYyem0tMiAydjJoLTJ2Mmgydi0yaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
    </div>
  );
});

HeroBackground.displayName = "HeroBackground";
