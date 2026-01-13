/**
 * Lazy loader for mapbox-gl library (~200KB savings on initial bundle)
 * Dynamically imports mapbox-gl only when needed
 */

let mapboxglPromise: Promise<typeof import('mapbox-gl')> | null = null;
let mapboxgl: typeof import('mapbox-gl') | null = null;

/**
 * Lazily load mapbox-gl library
 * Returns cached instance if already loaded
 */
export async function loadMapboxGL(): Promise<typeof import('mapbox-gl')> {
  // Return cached module if already loaded
  if (mapboxgl) {
    return mapboxgl;
  }

  // Return existing promise if loading is in progress
  if (mapboxglPromise) {
    return mapboxglPromise;
  }

  // Start loading
  mapboxglPromise = (async () => {
    // Dynamically import mapbox-gl
    const module = await import('mapbox-gl');
    
    // Also load the CSS dynamically
    if (!document.querySelector('link[href*="mapbox-gl"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css';
      document.head.appendChild(link);
    }
    
    mapboxgl = module;
    return module;
  })();

  return mapboxglPromise;
}

/**
 * Check if mapbox-gl is already loaded
 */
export function isMapboxLoaded(): boolean {
  return mapboxgl !== null;
}

/**
 * Preload mapbox-gl (call on hover/focus for faster interaction)
 */
export function preloadMapbox(): void {
  if (!mapboxglPromise && !mapboxgl) {
    loadMapboxGL();
  }
}

/**
 * Get access token from environment
 */
export function getMapboxToken(): string {
  return import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '';
}
