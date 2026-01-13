import { useState, useRef, useEffect, ImgHTMLAttributes, memo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageSize {
  width: number;
  suffix?: string;
}

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  /** Enable blur-up placeholder effect */
  blurUp?: boolean;
  /** Custom sizes for responsive images */
  sizes?: string;
  /** Priority loading - skip lazy loading for LCP images */
  priority?: boolean;
  /** Aspect ratio to prevent layout shift (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Show skeleton while loading */
  showSkeleton?: boolean;
  /** Image widths for srcset generation */
  srcSetWidths?: number[];
  /** Quality for image optimization (1-100) */
  quality?: number;
  /** Object fit style */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Fade in duration in ms */
  fadeInDuration?: number;
}

// Default breakpoint widths for srcset
const DEFAULT_SRCSET_WIDTHS = [320, 640, 768, 1024, 1280, 1920];

// Check if browser supports WebP
let webpSupported: boolean | null = null;
const checkWebPSupport = (): Promise<boolean> => {
  if (webpSupported !== null) return Promise.resolve(webpSupported);
  
  return new Promise((resolve) => {
    const webpTestImage = new Image();
    webpTestImage.onload = () => {
      webpSupported = webpTestImage.width > 0 && webpTestImage.height > 0;
      resolve(webpSupported);
    };
    webpTestImage.onerror = () => {
      webpSupported = false;
      resolve(false);
    };
    webpTestImage.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
};

// Get WebP version of image if available
const getWebPUrl = (src: string): string | null => {
  // Skip if already WebP or external URL without our CDN
  if (src.endsWith('.webp')) return null;
  if (src.startsWith('http') && !src.includes('supabase.co')) return null;
  if (src.startsWith('data:')) return null;
  
  // Convert jpg/jpeg/png to webp
  const webpUrl = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  return webpUrl !== src ? webpUrl : null;
};

// Generate srcset string
const generateSrcSet = (
  src: string,
  widths: number[] = DEFAULT_SRCSET_WIDTHS
): string | undefined => {
  // Only generate srcset for local images that can be processed
  if (src.startsWith('data:') || src.includes('?')) return undefined;
  
  // For imported assets, Vite handles optimization
  // For CDN/external images, we can't generate srcset
  if (src.startsWith('http') && !src.includes('supabase.co/storage')) {
    return undefined;
  }
  
  // For Supabase storage, we can use image transformation
  if (src.includes('supabase.co/storage')) {
    return widths
      .map(w => `${src}?width=${w}&quality=80 ${w}w`)
      .join(', ');
  }
  
  return undefined;
};

/**
 * OptimizedImage - A performant image component with:
 * - Lazy loading with IntersectionObserver
 * - WebP format detection and fallback
 * - Responsive srcset generation
 * - Blur-up placeholder effect
 * - Skeleton loading state
 * - Layout shift prevention via aspect ratio
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className,
  blurUp = false,
  sizes = "100vw",
  priority = false,
  aspectRatio,
  showSkeleton = true,
  srcSetWidths = DEFAULT_SRCSET_WIDTHS,
  quality = 80,
  objectFit = 'cover',
  fadeInDuration = 300,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check WebP support on mount
  useEffect(() => {
    checkWebPSupport().then(setSupportsWebP);
  }, []);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const element = imgRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Determine the best image source
  useEffect(() => {
    if (!isInView || supportsWebP === null) return;

    const webpUrl = supportsWebP ? getWebPUrl(src) : null;
    setCurrentSrc(webpUrl || src);
  }, [src, isInView, supportsWebP]);

  const srcSet = isInView ? generateSrcSet(currentSrc || src, srcSetWidths) : undefined;

  const containerStyle: React.CSSProperties = {
    ...style,
    aspectRatio: aspectRatio,
    overflow: 'hidden',
  };

  const imageStyle: React.CSSProperties = {
    objectFit,
    opacity: isLoaded ? 1 : 0,
    transition: `opacity ${fadeInDuration}ms ease-in-out`,
  };

  return (
    <div 
      className={cn("relative w-full h-full", className)}
      style={containerStyle}
    >
      {/* Skeleton loading placeholder */}
      {showSkeleton && !isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {/* Blur-up placeholder */}
      {blurUp && !isLoaded && currentSrc && (
        <div 
          className="absolute inset-0 w-full h-full blur-xl scale-110"
          style={{
            backgroundImage: `url(${currentSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Main image with picture element for format fallback */}
      {isInView && currentSrc && (
        <picture>
          {/* WebP source */}
          {supportsWebP && getWebPUrl(src) && (
            <source 
              srcSet={srcSet || getWebPUrl(src) || undefined}
              sizes={sizes}
              type="image/webp"
            />
          )}
          
          {/* Original format fallback */}
          <img
            ref={imgRef}
            src={currentSrc}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            className="w-full h-full"
            style={imageStyle}
            onLoad={() => setIsLoaded(true)}
            {...props}
          />
        </picture>
      )}

      {/* Placeholder for non-visible images (for IntersectionObserver) */}
      {!isInView && (
        <div 
          ref={imgRef as any}
          className="absolute inset-0"
          aria-hidden="true"
        />
      )}
    </div>
  );
});

/**
 * ResponsiveImage - Simplified wrapper for common use cases
 */
export interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: string;
  sizes?: string;
}

export const ResponsiveImage = memo(function ResponsiveImage({
  src,
  alt,
  className,
  priority = false,
  aspectRatio,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: ResponsiveImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      priority={priority}
      aspectRatio={aspectRatio}
      sizes={sizes}
      showSkeleton={true}
      objectFit="cover"
    />
  );
});

/**
 * HeroImage - Optimized for above-the-fold hero images
 */
export interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const HeroImage = memo(function HeroImage({
  src,
  alt,
  className,
}: HeroImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      priority={true}
      sizes="100vw"
      showSkeleton={false}
      fadeInDuration={0}
      objectFit="cover"
    />
  );
});

export default OptimizedImage;
