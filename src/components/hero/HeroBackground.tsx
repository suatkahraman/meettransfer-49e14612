import { memo, useState, useEffect } from "react";
import { CityVideo } from "./types";

// Lazy load the background image
const heroBgUrl = new URL("@/assets/hero-bg-futuristic.webp", import.meta.url).href;

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
  const [bgLoaded, setBgLoaded] = useState(false);

  // Lazy load background image after initial paint
  useEffect(() => {
    const timer = setTimeout(() => {
      const img = new Image();
      img.onload = () => setBgLoaded(true);
      img.src = heroBgUrl;
    }, 100); // Small delay to prioritize critical content

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Static off-white background - no images for performance */}
      <div className="absolute inset-0 z-0 bg-background" />
      
      {/* Desktop: Futuristic background image with lazy loading */}
      <div className="absolute inset-0 z-0 hidden md:block">
        {/* Lazy loaded futuristic background */}
        {bgLoaded && (
          <div 
            className="absolute inset-0 opacity-30 transition-opacity duration-700"
            style={{
              backgroundImage: `url(${heroBgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
        
        {/* Left fade for form readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        
        {/* Bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" />
        
      </div>
    </>
  );
});

HeroBackground.displayName = "HeroBackground";
