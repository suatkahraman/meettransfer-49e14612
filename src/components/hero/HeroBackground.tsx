import { memo, useState, useEffect } from "react";
import { CityVideo } from "./types";

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

  // Load background image after 2 seconds (way after LCP) for desktop only
  useEffect(() => {
    // Skip on mobile for better performance
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const timer = setTimeout(() => {
      const img = new Image();
      img.onload = () => setBgLoaded(true);
      // Dynamic import to avoid bundling the image in critical path
      img.src = new URL("@/assets/hero-bg-futuristic.webp", import.meta.url).href;
    }, 2000); // 2s delay - well after LCP

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Static background - immediate render */}
      <div className="absolute inset-0 z-0 bg-background" />
      
      {/* Desktop: Futuristic background image - deferred loading */}
      <div className="absolute inset-0 z-0 hidden md:block">
        {bgLoaded && (
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${new URL("@/assets/hero-bg-futuristic.webp", import.meta.url).href})`,
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
