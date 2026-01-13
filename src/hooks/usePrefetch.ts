import { useEffect, useCallback, useRef } from 'react';
import { prefetchRoute, prefetchRoutes } from '@/utils/prefetch';

/**
 * Hook to prefetch routes on component mount
 * Useful for preloading likely navigation targets
 */
export function usePrefetchOnMount(routes: string[]) {
  useEffect(() => {
    prefetchRoutes(routes);
  }, []);
}

/**
 * Hook to create prefetch handlers for a specific route
 * Returns event handlers for hover/focus prefetching
 */
export function usePrefetchHandlers(path: string, delay = 100) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPrefetch = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      prefetchRoute(path);
    }, delay);
  }, [path, delay]);

  const cancelPrefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: startPrefetch,
    onFocus: startPrefetch,
    onMouseLeave: cancelPrefetch,
    onBlur: cancelPrefetch,
  };
}

/**
 * Hook to prefetch visible links using IntersectionObserver
 * Prefetches routes when their links become visible in viewport
 */
export function usePrefetchOnVisible(
  ref: React.RefObject<HTMLElement>,
  path: string,
  options?: IntersectionObserverInit
) {
  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetchRoute(path);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0,
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, path, options]);
}
