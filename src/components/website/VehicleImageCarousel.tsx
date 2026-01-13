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
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0]));
  const [isPaused, setIsPaused] = useState(false);
  const preloadedRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Navigate to next/previous image
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

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
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval, isHovered, isPaused]);

  if (images.length === 0) return null;

  const isCurrentLoaded = imagesLoaded.has(currentIndex);

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden touch-pan-y ${className}`}
      {...swipeHandlers}
    >
      {/* Render all images but only show current one - prevents DOM flicker */}
      {images.map((src, index) => (
        <motion.img
          key={src}
          src={src}
          alt={`${alt} ${index + 1}`}
          initial={false}
          animate={{ 
            opacity: index === currentIndex && imagesLoaded.has(index) ? 1 : 0,
            scale: index === currentIndex && isHovered ? 1.1 : 1,
            zIndex: index === currentIndex ? 10 : 1
          }}
          transition={{ 
            opacity: { duration: 0.4 },
            scale: { duration: 0.3 }
          }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          loading={index === 0 ? "eager" : "lazy"}
          draggable={false}
          onLoad={() => {
            setImagesLoaded(prev => new Set([...prev, index]));
          }}
        />
      ))}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                pauseAutoplay();
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
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
        <div className="absolute inset-0 bg-muted animate-pulse z-0" />
      )}
    </div>
  );
});

VehicleImageCarousel.displayName = "VehicleImageCarousel";

export default VehicleImageCarousel;
