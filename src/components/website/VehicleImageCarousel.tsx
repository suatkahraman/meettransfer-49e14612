import { useState, useEffect, useRef, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSwipeable } from "react-swipeable";

// Generate srcset for responsive images - optimized for carousel use
const generateCarouselSrcSet = (src: string): string | undefined => {
  // Skip for data URLs or already processed URLs
  if (src.startsWith('data:') || src.includes('?')) return undefined;
  
  // For Supabase storage with image transformation
  if (src.includes('supabase.co/storage')) {
    const widths = [320, 480, 640, 800];
    return widths.map(w => `${src}?width=${w}&quality=75 ${w}w`).join(', ');
  }
  
  return undefined;
};

// Default sizes attribute for carousel images
const CAROUSEL_SIZES = "(max-width: 480px) 320px, (max-width: 768px) 480px, (max-width: 1024px) 640px, 800px";

// Fixed dimensions for LCP image to prevent CLS - optimized for fast loading
const LCP_IMAGE_WIDTH = 480;
const LCP_IMAGE_HEIGHT = 360;

interface VehicleImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  interval?: number;
  isHovered?: boolean;
  /** Explicit width for CLS prevention */
  width?: number;
  /** Explicit height for CLS prevention */
  height?: number;
}

export const VehicleImageCarousel = memo(({ 
  images, 
  alt, 
  className = "",
  interval = 3000,
  isHovered = false,
  width = LCP_IMAGE_WIDTH,
  height = LCP_IMAGE_HEIGHT
}: VehicleImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0]));
  const [isPaused, setIsPaused] = useState(false);
  // Track if secondary images should be rendered (deferred after first paint)
  const [shouldRenderSecondary, setShouldRenderSecondary] = useState(false);
  const preloadedRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Navigate to next/previous image with direction tracking
  const goToNext = useCallback(() => {
    setSlideDirection('left');
    setPrevIndex(currentIndex);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length, currentIndex]);

  const goToPrev = useCallback(() => {
    setSlideDirection('right');
    setPrevIndex(currentIndex);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length, currentIndex]);

  // Go to specific index
  const goToIndex = useCallback((index: number) => {
    if (index === currentIndex) return;
    setSlideDirection(index > currentIndex ? 'left' : 'right');
    setPrevIndex(currentIndex);
    setCurrentIndex(index);
  }, [currentIndex]);

  // Pause autoplay temporarily after swipe
  const pauseAutoplay = useCallback(() => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000); // Resume autoplay after 5 seconds
  }, []);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (images.length > 1) {
        goToNext();
        pauseAutoplay();
      }
    },
    onSwipedRight: () => {
      if (images.length > 1) {
        goToPrev();
        pauseAutoplay();
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    trackTouch: true,
    delta: 30,
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  // Defer secondary image rendering until after first paint + idle
  useEffect(() => {
    if (images.length <= 1) return;
    
    // Use requestIdleCallback to defer secondary images until browser is idle
    const scheduleSecondaryRender = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          setShouldRenderSecondary(true);
        }, { timeout: 2000 });
      } else {
        // Fallback for Safari
        setTimeout(() => {
          setShouldRenderSecondary(true);
        }, 500);
      }
    };

    // Wait for first image to load or timeout
    const timeout = setTimeout(scheduleSecondaryRender, 100);
    return () => clearTimeout(timeout);
  }, [images.length]);

  // Preload secondary images only after they're rendered
  useEffect(() => {
    if (!shouldRenderSecondary || images.length <= 1) return;

    // Preload secondary images in memory with low priority
    images.slice(1).forEach((src, idx) => {
      const index = idx + 1;
      if (preloadedRef.current.has(src)) return;
      
      const img = new Image();
      img.onload = () => {
        setImagesLoaded(prev => new Set([...prev, index]));
        preloadedRef.current.add(src);
      };
      // Use low fetch priority for secondary images
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = 'low';
      }
      img.src = src;
    });
  }, [shouldRenderSecondary, images]);

  // Auto-rotate images (paused when hovered or after swipe)
  useEffect(() => {
    if (images.length <= 1 || isHovered || isPaused || !shouldRenderSecondary) return;
    
    const timer = setInterval(() => {
      setSlideDirection('left');
      setPrevIndex(currentIndex);
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval, isHovered, isPaused, currentIndex, shouldRenderSecondary]);

  if (images.length === 0) return null;

  const isCurrentLoaded = imagesLoaded.has(currentIndex);
  const firstImage = images[0];
  const secondaryImages = images.slice(1);

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden touch-pan-y ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
      {...swipeHandlers}
    >
      {/* FIRST IMAGE - LCP element: NO srcset, NO animation, NO transform */}
      <img
        src={firstImage}
        alt={`${alt} 1`}
        width={width}
        height={height}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        draggable={false}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
          currentIndex === 0 ? 'opacity-100 z-10' : 'opacity-0 z-1'
        }`}
        style={{ transform: 'none' }}
        onLoad={() => {
          setImagesLoaded(prev => new Set([...prev, 0]));
        }}
      />

      {/* SECONDARY IMAGES - Rendered only after first paint, with animations */}
      {shouldRenderSecondary && secondaryImages.map((src, idx) => {
        const index = idx + 1;
        const isActive = index === currentIndex;
        const wasActive = index === prevIndex;
        const srcSet = generateCarouselSrcSet(src);
        
        // Calculate x position based on slide direction
        let xPosition = 0;
        if (isActive) {
          xPosition = 0;
        } else if (wasActive) {
          xPosition = slideDirection === 'left' ? -100 : 100;
        } else {
          xPosition = slideDirection === 'left' ? 100 : -100;
        }
        
        return (
          <motion.img
            key={src}
            src={src}
            srcSet={srcSet}
            sizes={srcSet ? CAROUSEL_SIZES : undefined}
            alt={`${alt} ${index + 1}`}
            initial={false}
            animate={{ 
              x: isActive ? '0%' : wasActive ? `${xPosition}%` : `${slideDirection === 'left' ? 100 : -100}%`,
              opacity: (isActive || wasActive) && imagesLoaded.has(index) ? 1 : 0,
              scale: isActive && isHovered ? 1.05 : 1,
              zIndex: isActive ? 10 : wasActive ? 5 : 1
            }}
            transition={{ 
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.3 }
            }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={() => {
              setImagesLoaded(prev => new Set([...prev, index]));
            }}
          />
        );
      })}

      {/* Also animate first image when transitioning FROM it */}
      {shouldRenderSecondary && currentIndex !== 0 && prevIndex === 0 && (
        <motion.div
          initial={false}
          animate={{ 
            x: slideDirection === 'left' ? '-100%' : '100%',
            opacity: 0
          }}
          transition={{ 
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0 w-full h-full z-5 pointer-events-none"
        >
          <img
            src={firstImage}
            alt={`${alt} 1`}
            className="w-full h-full object-cover"
            loading="eager"
            draggable={false}
          />
        </motion.div>
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          {images.map((_, index) => (
            <span
              key={index}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                goToIndex(index);
                pauseAutoplay();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  goToIndex(index);
                  pauseAutoplay();
                }
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                index === currentIndex 
                  ? "bg-primary w-3" 
                  : "bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Loading skeleton - only show if first image hasn't loaded */}
      {!isCurrentLoaded && (
        <div className="absolute inset-0 bg-muted z-0" />
      )}
    </div>
  );
});

VehicleImageCarousel.displayName = "VehicleImageCarousel";

export default VehicleImageCarousel;
