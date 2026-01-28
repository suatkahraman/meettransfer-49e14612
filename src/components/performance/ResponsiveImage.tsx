import { useState, useRef, useEffect, memo, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveImageProps {
  /** Base image source - will auto-generate srcSet for responsive loading */
  src: string;
  alt: string;
  className?: string;
  /** Widths to generate for srcSet (default: common breakpoints) */
  widths?: number[];
  /** Sizes attribute for responsive loading */
  sizes?: string;
  /** Aspect ratio constraint */
  aspectRatio?: "video" | "square" | "portrait" | "wide" | "auto";
  /** Load with high priority (above the fold) */
  priority?: boolean;
  /** Explicit width for CLS prevention */
  width?: number;
  /** Explicit height for CLS prevention */
  height?: number;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Enable AVIF/WebP next-gen formats */
  useNextGen?: boolean;
}

const DEFAULT_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1536, 1920];

/**
 * Generate srcSet string for responsive images
 */
function generateSrcSet(src: string, widths: number[]): string {
  // Skip for external URLs, data URIs, or SVGs
  if (
    src.startsWith('data:') ||
    src.startsWith('http') ||
    src.endsWith('.svg')
  ) {
    return src;
  }

  // For local images, we'd need image processing on build
  // For now, return the original source
  // In production, this would integrate with an image CDN or build-time processing
  return src;
}

/**
 * Get next-gen image sources with fallbacks
 */
function getImageSources(src: string, useNextGen: boolean): {
  avif?: string;
  webp?: string;
  original: string;
} {
  if (!useNextGen) {
    return { original: src };
  }

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

  const basePath = src.replace(/\.(jpg|jpeg|png)$/i, '');
  const hasExtension = /\.(jpg|jpeg|png)$/i.test(src);

  if (!hasExtension) {
    return { original: src };
  }

  return {
    avif: `${basePath}.avif`,
    webp: `${basePath}.webp`,
    original: src,
  };
}

/**
 * High-performance responsive image component
 * - Lazy loading with IntersectionObserver
 * - AVIF/WebP support with fallbacks
 * - Responsive srcSet generation
 * - Native loading="lazy" for supported browsers
 * - Prevents CLS with explicit dimensions
 */
const ResponsiveImage = memo(({
  src,
  alt,
  className,
  widths = DEFAULT_WIDTHS,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  aspectRatio = "auto",
  priority = false,
  width,
  height,
  onLoad,
  useNextGen = true,
}: ResponsiveImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute sources
  const sources = useMemo(
    () => getImageSources(src, useNextGen),
    [src, useNextGen]
  );

  const srcSet = useMemo(
    () => generateSrcSet(src, widths),
    [src, widths]
  );

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const container = containerRef.current;
    if (!container) return;

    // Use native lazy loading if supported and not priority
    if ('loading' in HTMLImageElement.prototype) {
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
        rootMargin: "200px",
        threshold: 0.01,
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [priority, isInView]);

  const aspectClasses: Record<string, string> = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
    auto: "",
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectClasses[aspectRatio],
        className
      )}
      style={
        width && height && aspectRatio === "auto"
          ? { aspectRatio: `${width} / ${height}` }
          : undefined
      }
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/5 to-muted"
          aria-hidden="true"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-sm">Image unavailable</span>
        </div>
      )}

      {/* Responsive picture element */}
      {isInView && !hasError && (
        <picture>
          {sources.avif && <source srcSet={sources.avif} type="image/avif" />}
          {sources.webp && <source srcSet={sources.webp} type="image/webp" />}
          <img
            src={sources.original}
            srcSet={srcSet !== src ? srcSet : undefined}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            // @ts-expect-error - fetchpriority lowercase for DOM
            fetchpriority={priority ? "high" : "auto"}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        </picture>
      )}
    </div>
  );
});

ResponsiveImage.displayName = "ResponsiveImage";

export { ResponsiveImage };
export default ResponsiveImage;
