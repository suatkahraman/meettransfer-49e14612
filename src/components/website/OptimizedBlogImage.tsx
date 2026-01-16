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
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before entering viewport
        threshold: 0,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
  };

  // Generate WebP source if the src is a jpg/png
  const getWebPSrc = (originalSrc: string) => {
    // For imported assets, we can't convert them dynamically
    // But we can check if it's a URL and try webp version
    if (typeof originalSrc === "string" && originalSrc.startsWith("/")) {
      return originalSrc.replace(/\.(jpg|jpeg|png)$/i, ".webp");
    }
    return null;
  };

  const webpSrc = getWebPSrc(src);

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Placeholder/Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/80 to-muted animate-pulse" />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-sm">Image unavailable</span>
        </div>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <picture>
          {/* WebP source for browsers that support it */}
          {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
          
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
        </picture>
      )}
    </div>
  );
};

export default OptimizedBlogImage;
