import { memo } from "react";
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
  return (
    <>
      {/* Static off-white background - no images for performance */}
      <div className="absolute inset-0 z-0 bg-background" />
      
      {/* Desktop: Subtle gradient accent - CSS only, no images */}
      <div className="absolute inset-0 z-0 hidden md:block">
        {/* Primary gradient - warm premium feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        {/* Left fade for form readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        
        {/* Bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
        
        {/* Subtle pattern overlay - inline SVG for zero network requests */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </>
  );
});

HeroBackground.displayName = "HeroBackground";
