import { useState, useEffect, useRef, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSwipeable } from "react-swipeable";

interface VehicleImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  interval?: number;
  isHovered?: boolean;
}

export const VehicleImageCarousel = memo(({ 
  images, 
  alt, 
  className = "",
  interval = 3000,
  isHovered = false 
}: VehicleImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0]));
  const [isPaused, setIsPaused] = useState(false);
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

  // Preload images once on mount - avoid repeated DOM manipulation
  useEffect(() => {
    if (images.length <= 1) return;

    // Preload all images in memory without adding to DOM
    images.forEach((src, index) => {
      if (preloadedRef.current.has(src)) return;
      
      const img = new Image();
      img.onload = () => {
        setImagesLoaded(prev => new Set([...prev, index]));
        preloadedRef.current.add(src);
      };
      img.src = src;
    });
  }, [images]);

  // Auto-rotate images (paused when hovered or after swipe)
  useEffect(() => {
    if (images.length <= 1 || isHovered || isPaused) return;
    
    const timer = setInterval(() => {
      setSlideDirection('left');
      setPrevIndex(currentIndex);
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval, isHovered, isPaused, currentIndex]);

  if (images.length === 0) return null;

  const isCurrentLoaded = imagesLoaded.has(currentIndex);

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden touch-pan-y ${className}`}
      {...swipeHandlers}
    >
      {/* Slide animation variants */}
      {images.map((src, index) => {
        const isActive = index === currentIndex;
        const wasActive = index === prevIndex;
        
        // Calculate x position based on slide direction
        let xPosition = 0;
        if (isActive) {
          xPosition = 0; // Current slide is centered
        } else if (wasActive) {
          xPosition = slideDirection === 'left' ? -100 : 100; // Previous slide exits
        } else {
          xPosition = slideDirection === 'left' ? 100 : -100; // Hidden slides
        }
        
        return (
          <motion.img
            key={src}
            src={src}
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
            loading={index === 0 ? "eager" : "lazy"}
            draggable={false}
            onLoad={() => {
              setImagesLoaded(prev => new Set([...prev, index]));
            }}
          />
        );
      })}

      {/* Dots indicator - using span instead of button to avoid nesting buttons */}
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
