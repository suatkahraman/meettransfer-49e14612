import { useState, useEffect, useCallback, useRef } from 'react';

interface ImageOptimizationOptions {
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection observer */
  threshold?: number;
  /** Enable blur-up effect */
  blurUp?: boolean;
  /** Skip lazy loading */
  priority?: boolean;
}

interface ImageOptimizationResult {
  isLoaded: boolean;
  isInView: boolean;
  imgRef: React.RefObject<HTMLImageElement>;
  handleLoad: () => void;
  supportsWebP: boolean | null;
}

// Cached WebP support check
let webpSupportCache: boolean | null = null;
const webpCheckPromise: Promise<boolean> = new Promise((resolve) => {
  if (typeof window === 'undefined') {
    resolve(false);
    return;
  }
  
  const img = new Image();
  img.onload = () => {
    webpSupportCache = img.width > 0 && img.height > 0;
    resolve(webpSupportCache);
  };
  img.onerror = () => {
    webpSupportCache = false;
    resolve(false);
  };
  img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
});

/**
 * Hook for image optimization with lazy loading and WebP detection
 */
export function useImageOptimization({
  rootMargin = '200px',
  threshold = 0.01,
  priority = false,
}: ImageOptimizationOptions = {}): ImageOptimizationResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(webpSupportCache);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check WebP support
  useEffect(() => {
    if (webpSupportCache !== null) {
      setSupportsWebP(webpSupportCache);
    } else {
      webpCheckPromise.then(setSupportsWebP);
    }
  }, []);

  // Set up intersection observer
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
      { rootMargin, threshold }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView, rootMargin, threshold]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return {
    isLoaded,
    isInView,
    imgRef,
    handleLoad,
    supportsWebP,
  };
}

/**
 * Get optimized image URL with WebP fallback
 */
export function getOptimizedImageUrl(
  src: string,
  supportsWebP: boolean | null
): string {
  if (!supportsWebP) return src;
  if (src.endsWith('.webp')) return src;
  if (src.startsWith('data:')) return src;
  if (src.startsWith('http') && !src.includes('supabase.co')) return src;
  
  // Try WebP version
  const webpUrl = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  return webpUrl !== src ? webpUrl : src;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920],
  quality: number = 80
): string | undefined {
  // Skip for data URLs or already processed URLs
  if (src.startsWith('data:') || src.includes('?')) return undefined;
  
  // For Supabase storage with image transformation
  if (src.includes('supabase.co/storage')) {
    return widths
      .map(w => `${src}?width=${w}&quality=${quality} ${w}w`)
      .join(', ');
  }
  
  return undefined;
}

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

/**
 * Check if native lazy loading is supported
 */
export function supportsNativeLazyLoading(): boolean {
  return 'loading' in HTMLImageElement.prototype;
}

export default useImageOptimization;
