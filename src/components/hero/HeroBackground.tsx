import { memo } from "react";

// Use public folder path for hero image - enables browser preload matching
const heroImage = "/hero-bg-futuristic.webp";

interface HeroBackgroundProps {
  videosLoaded?: boolean;
  cityVideos?: unknown[];
  currentVideoIndex?: number;
  setCurrentVideoIndex?: (index: number) => void;
  language?: string;
}

export const HeroBackground = memo(({}: HeroBackgroundProps) => {
  return (
    <>
      {/* Static background - immediate render */}
      <div className="absolute inset-0 z-0 bg-background" />
      
      {/* Desktop: Hero background image - LCP optimized with high priority */}
      <div className="absolute inset-0 z-0 hidden md:block">
        {/* 
          LCP Optimization:
          - Using img element instead of CSS background for browser prioritization
          - fetchPriority="high" tells browser to load this first
          - loading="eager" ensures no lazy loading
          - Explicit width/height prevent CLS
          - decoding="async" allows non-blocking decode
          - WebP format for optimal compression
        */}
        <img
          src={heroImage}
          alt=""
          role="presentation"
          width={1920}
          height={1080}
          // @ts-expect-error - React uses fetchPriority but DOM expects fetchpriority
          fetchpriority="high"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-right opacity-30"
        />
        
        {/* Left fade for form readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        
        {/* Bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" />
      </div>
    </>
  );
});

HeroBackground.displayName = "HeroBackground";
