import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedBlogImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean; // For hero images that should load immediately
  aspectRatio?: "video" | "square" | "wide" | "hero"; // Predefined aspect ratios
  sizes?: string;
  onLoad?: () => void;
}

const aspectRatioClasses = {
  video: "aspect-video", // 16:9
  square: "aspect-square", // 1:1
  wide: "aspect-[21/9]", // 21:9
  hero: "aspect-[16/10]", // 16:10 for blog heroes
};

const OptimizedBlogImage = ({
  src,
  alt,
  className,
  priority = false,
  aspectRatio = "hero",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px",
  onLoad,
}: OptimizedBlogImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(true); // Always render image, use native lazy loading
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Reset states when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    // Only set error after a delay to allow for retries
    console.warn('OptimizedBlogImage: Image failed to load:', src);
    setHasError(true);
  };

  // Check if src is valid
  const isValidSrc = src && typeof src === 'string' && src.length > 0;

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Placeholder/Skeleton - show while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/80 to-muted animate-pulse" />
      )}

      {/* Error fallback - only show if src is invalid or truly failed */}
      {(hasError || !isValidSrc) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-sm">Image unavailable</span>
        </div>
      )}

      {/* Actual image - always render if src is valid */}
      {isValidSrc && !hasError && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          // Width and height for aspect ratio hint (prevents CLS)
          width={1200}
          height={aspectRatio === "hero" ? 750 : aspectRatio === "video" ? 675 : 1200}
        />
      )}
    </div>
  );
};

export default OptimizedBlogImage;
