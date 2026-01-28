import { useState, useRef, useEffect, memo, useMemo } from "react";
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
  /** Enable AVIF/WebP next-gen formats with fallback */
  useNextGen?: boolean;
}

/**
 * Get next-gen image sources (AVIF, WebP) with fallback
 * Only applies to local images that could have next-gen variants
 */
function getNextGenSources(src: string): { avif?: string; webp?: string; original: string } {
  // Skip external URLs, data URIs, or already next-gen formats
  if (
    src.startsWith('data:') ||
    src.startsWith('http') ||
    src.endsWith('.avif') ||
    src.endsWith('.webp') ||
    src.endsWith('.svg')
  ) {
    return { original: src };
  }

  // For local images, try to provide next-gen variants
  const basePath = src.replace(/\.(jpg|jpeg|png)$/i, '');
  const extension = src.match(/\.(jpg|jpeg|png)$/i)?.[0] || '';

  if (!extension) {
    return { original: src };
  }

  return {
    avif: `${basePath}.avif`,
    webp: `${basePath}.webp`,
    original: src,
  };
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
  useNextGen = true,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Compute next-gen sources
  const sources = useMemo(() => 
    useNextGen ? getNextGenSources(src) : { original: src },
    [src, useNextGen]
  );

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
        rootMargin: "200px", // Preload before entering viewport
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

  const handleLoad = () => {
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

        {/* Picture element with next-gen format support */}
        {isInView && !hasError && (
          <picture>
            {/* AVIF - best compression, newest format */}
            {sources.avif && (
              <source srcSet={sources.avif} type="image/avif" />
            )}
            {/* WebP - good compression, wide support */}
            {sources.webp && (
              <source srcSet={sources.webp} type="image/webp" />
            )}
            {/* Fallback to original */}
            <img
              src={sources.original}
              alt={alt}
              width={width}
              height={height}
              loading={priority ? "eager" : "lazy"}
              decoding={priority ? "sync" : "async"}
              // @ts-expect-error - React uses fetchPriority but DOM expects fetchpriority
              fetchpriority={priority ? "high" : fetchPriority}
              sizes={sizes}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          </picture>
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
