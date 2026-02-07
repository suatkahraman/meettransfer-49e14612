import { memo } from "react";

// Use public folder path for hero image - matches <link rel="preload"> in index.html
const heroImageWebP = "/hero-bg-futuristic.webp";

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
      {/* Static background - immediate render, mobile-first */}
      <div className="absolute inset-0 z-0 bg-background" />
      
      {/* Desktop only: Hero background image - hidden on mobile for faster LCP
          LCP Optimization:
          - <link rel="preload"> in index.html pre-fetches this image
          - fetchpriority="high" + loading="eager" ensures fastest possible load
          - Explicit width/height prevent CLS
          - decoding="sync" on desktop ensures image is ready before paint
          - Removed <picture> wrapper to match preload href exactly (avoids double-fetch)
      */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <img
          src={heroImageWebP}
          alt=""
          role="presentation"
          width={1920}
          height={1080}
          // @ts-expect-error - React uses fetchPriority but DOM expects fetchpriority
          fetchpriority="high"
          loading="eager"
          decoding="sync"
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
