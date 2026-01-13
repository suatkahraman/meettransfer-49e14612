import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VehicleImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  interval?: number;
  isHovered?: boolean;
}

export const VehicleImageCarousel = ({ 
  images, 
  alt, 
  className = "",
  interval = 3000,
  isHovered = false 
}: VehicleImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);

  // Initialize loaded state for all images
  useEffect(() => {
    setImagesLoaded(new Array(images.length).fill(false));
  }, [images.length]);

  // Auto-rotate images
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval, isHovered]);

  const handleImageLoad = (index: number) => {
    setImagesLoaded((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  if (images.length === 0) return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          onLoad={() => handleImageLoad(currentIndex)}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: imagesLoaded[currentIndex] ? 1 : 0, 
            scale: isHovered ? 1.1 : 1 
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            opacity: { duration: 0.5 },
            scale: { duration: 0.3 }
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Preload other images */}
      {images.map((src, index) => (
        index !== currentIndex && (
          <img
            key={`preload-${index}`}
            src={src}
            alt=""
            onLoad={() => handleImageLoad(index)}
            className="hidden"
          />
        )
      ))}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
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

      {/* Loading skeleton */}
      {!imagesLoaded[currentIndex] && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  );
};

export default VehicleImageCarousel;
