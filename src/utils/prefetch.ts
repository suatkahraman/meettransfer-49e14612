/**
 * Prefetch strategy for faster navigation
 * Preloads pages when user hovers/focuses on links
 */

// Track prefetched URLs to avoid duplicates
const prefetchedUrls = new Set<string>();
const prefetchingUrls = new Set<string>();

// Route to component mapping for dynamic imports
const routeComponentMap: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/Index'),
  '/contact': () => import('@/pages/website/ContactPage'),
  '/about': () => import('@/pages/website/AboutPage'),
  '/fleet': () => import('@/pages/website/FleetPage'),
  '/services': () => import('@/pages/website/ServicesPage'),
  '/faq': () => import('@/pages/website/ReviewsPage'),
  '/destinations': () => import('@/pages/website/DestinationsPage'),
  '/whatsapp-booking': () => import('@/pages/website/WhatsAppBooking'),
  '/customer': () => import('@/pages/CustomerPortal'),
  '/login': () => import('@/pages/Auth'),
  '/privacy': () => import('@/pages/website/PrivacyPage'),
  '/terms': () => import('@/pages/website/TermsPage'),
  '/blog': () => import('@/pages/website/BlogPage'),
};

/**
 * Prefetch a route's component
 */
export async function prefetchRoute(path: string): Promise<void> {
  // Normalize path
  const normalizedPath = path.split('?')[0].split('#')[0];
  
  // Skip if already prefetched or prefetching
  if (prefetchedUrls.has(normalizedPath) || prefetchingUrls.has(normalizedPath)) {
    return;
  }

  // Skip external URLs
  if (normalizedPath.startsWith('http') || normalizedPath.startsWith('//')) {
    return;
  }

  // Find matching route
  const routeImport = routeComponentMap[normalizedPath];
  
  if (routeImport) {
    prefetchingUrls.add(normalizedPath);
    
    try {
      // Use requestIdleCallback for non-blocking prefetch
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(async () => {
          await routeImport();
          prefetchedUrls.add(normalizedPath);
          prefetchingUrls.delete(normalizedPath);
        }, { timeout: 2000 });
      } else {
        // Fallback with setTimeout
        setTimeout(async () => {
          await routeImport();
          prefetchedUrls.add(normalizedPath);
          prefetchingUrls.delete(normalizedPath);
        }, 100);
      }
    } catch (error) {
      prefetchingUrls.delete(normalizedPath);
      console.warn('Prefetch failed for:', normalizedPath);
    }
  }
}

/**
 * Prefetch link handler for hover/focus events
 */
export function createPrefetchHandler(path: string) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const startPrefetch = () => {
    // Small delay to avoid prefetching on quick mouse movements
    timeoutId = setTimeout(() => {
      prefetchRoute(path);
    }, 100);
  };
  
  const cancelPrefetch = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return {
    onMouseEnter: startPrefetch,
    onFocus: startPrefetch,
    onMouseLeave: cancelPrefetch,
    onBlur: cancelPrefetch,
  };
}

/**
 * Prefetch multiple routes at once (e.g., on page load)
 */
export function prefetchRoutes(paths: string[]): void {
  // Use IntersectionObserver pattern - prefetch after idle
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      paths.forEach(path => prefetchRoute(path));
    }, { timeout: 5000 });
  } else {
    setTimeout(() => {
      paths.forEach(path => prefetchRoute(path));
    }, 2000);
  }
}

/**
 * Check if a route is already prefetched
 */
export function isRoutePrefetched(path: string): boolean {
  const normalizedPath = path.split('?')[0].split('#')[0];
  return prefetchedUrls.has(normalizedPath);
}

/**
 * Clear prefetch cache (useful for memory management)
 */
export function clearPrefetchCache(): void {
  prefetchedUrls.clear();
  prefetchingUrls.clear();
}
