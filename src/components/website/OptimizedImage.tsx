import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "video" | "square" | "portrait" | "wide" | "auto";
  priority?: boolean;
  overlay?: React.ReactNode;
  caption?: string;
  width?: number;
  height?: number;
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
}

const OptimizedImage = memo(({
  src,
  alt,
  className,
  aspectRatio = "auto",
  priority = false,
  overlay,
  caption,
  width,
  height,
  fetchPriority = "auto",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Increased for better preloading
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
    auto: "",
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <figure ref={imgRef} className="relative">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-muted",
          aspectClasses[aspectRatio],
          className
        )}
      >
        {/* Skeleton placeholder */}
        {!isLoaded && (
          <div 
            className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" 
            aria-hidden="true"
          />
        )}

        {/* Error fallback */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            <span className="text-sm">Image not available</span>
          </div>
        )}

        {/* Image */}
        {isInView && !hasError && (
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            // @ts-expect-error - React uses fetchPriority but DOM expects fetchpriority
            fetchpriority={priority ? "high" : fetchPriority}
            sizes={sizes}
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Overlay */}
        {overlay && isLoaded && !hasError && (
          <div className="absolute inset-0">{overlay}</div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
