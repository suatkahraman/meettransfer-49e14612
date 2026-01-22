/**
 * Centralized Google Maps loader
 * Prevents duplicate script loading and provides unified API across all components
 */

// Use environment variable for the API key with fallback
// Note: Client-side Maps API keys are inherently public - security comes from domain restrictions
// The fallback key should have domain restrictions configured in Google Cloud Console
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCk_A1D5LOqb2TuIFuOiVVjGDSAprap38M';

// Global state for script loading
let loadPromise: Promise<void> | null = null;
let isLoaded = false;
let authFailed = false;
let authFailedAt: number | null = null;

// Access Google Maps API
export const getGoogleMaps = (): any => {
  return (window as any).google?.maps;
};

// Check if Google Maps is loaded
export const isGoogleMapsLoaded = (): boolean => {
  return isLoaded && !!getGoogleMaps();
};

// Google Maps auth failures are reported asynchronously via window.gm_authFailure
export const isGoogleMapsAuthFailed = (): boolean => {
  return authFailed;
};

export const getGoogleMapsAuthFailureInfo = (): { failed: boolean; failedAt: number | null } => {
  return { failed: authFailed, failedAt: authFailedAt };
};

const ensureAuthFailureHandler = () => {
  const w = window as any;
  if (typeof w.gm_authFailure === 'function') return;

  w.gm_authFailure = () => {
    // CRITICAL: Only set authFailed if the API is truly not working
    // Sometimes gm_authFailure fires but the API is still functional
    // (e.g., billing warnings, quota warnings that don't block usage)
    const mapsStillWorking = !!(w.google?.maps?.places?.Autocomplete);
    
    if (mapsStillWorking) {
      console.warn(
        '[Google Maps] gm_authFailure called but API is still functional. Ignoring failure flag.'
      );
      return;
    }
    
    authFailed = true;
    authFailedAt = Date.now();
    isLoaded = false;
    loadPromise = null;
    console.error(
      '[Google Maps] gm_authFailure: API key authorization failed. Likely causes: Referer not allowed, Billing disabled, or required APIs not enabled.'
    );

    // Notify listeners (map components) to gracefully fallback.
    try {
      window.dispatchEvent(new CustomEvent('google-maps-auth-failure'));
    } catch {
      // ignore
    }
  };
};

/**
 * Load Google Maps script with specified libraries
 * Uses singleton pattern to prevent duplicate loading
 */
export const loadGoogleMapsScript = (libraries: string[] = ['places']): Promise<void> => {
  // If authentication already failed, do not keep retrying.
  if (authFailed) {
    return Promise.reject(new Error('Google Maps authentication failed'));
  }

  // Already loaded
  if (isLoaded && getGoogleMaps()) {
    return Promise.resolve();
  }

  // Loading in progress - return existing promise
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    ensureAuthFailureHandler();

    // Check if script already exists (may have been loaded by another component)
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (existingScript && getGoogleMaps()) {
      isLoaded = true;
      resolve();
      return;
    }

    if (existingScript) {
      // Script exists but not yet loaded, poll for it
      const poll = (startTime: number) => {
        if (authFailed) {
          reject(new Error('Google Maps authentication failed'));
          return;
        }
        if (getGoogleMaps()) {
          isLoaded = true;
          resolve();
          return;
        }
        if (Date.now() - startTime > 15000) {
          reject(new Error('Timeout waiting for Google Maps'));
          return;
        }
        setTimeout(() => poll(startTime), 100);
      };
      poll(Date.now());
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    // Use Google's recommended loading=async query parameter (not the DOM attribute)
    // Keep our own readiness checks to ensure Places is available before resolving.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${libraries.join(',')}&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for API to be ready including Places
      const waitForApi = (startTime: number) => {
        if (authFailed) {
          console.error('[Google Maps] Auth failure detected during load');
          reject(new Error('Google Maps authentication failed'));
          return;
        }
        const maps = getGoogleMaps();
        if (maps?.places?.Autocomplete) {
          console.log('[Google Maps] Loaded successfully with Places library');
          isLoaded = true;
          resolve();
        } else if (Date.now() - startTime > 10000) {
          console.error('[Google Maps] Timeout waiting for Places library');
          reject(new Error('Timeout waiting for Google Maps Places library'));
        } else {
          setTimeout(() => waitForApi(startTime), 100);
        }
      };
      waitForApi(Date.now());
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * Preload Google Maps script during idle time
 * Call this to prepare for future use without blocking
 */
export const preloadGoogleMaps = (libraries: string[] = ['places']): void => {
  if (isLoaded || loadPromise) return;

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(
      () => loadGoogleMapsScript(libraries).catch(() => {}),
      { timeout: 3000 }
    );
  } else {
    setTimeout(() => loadGoogleMapsScript(libraries).catch(() => {}), 1000);
  }
};

/**
 * Geocode an address to coordinates
 */
export const geocodeAddress = async (
  address: string,
  region: string = 'TR'
): Promise<{ lat: number; lng: number } | null> => {
  const maps = getGoogleMaps();
  if (!maps) return null;

  return new Promise((resolve) => {
    const geocoder = new maps.Geocoder();
    geocoder.geocode({ address, region }, (results: any[], status: string) => {
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location;
        resolve({ lat: location.lat(), lng: location.lng() });
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Get directions between two points
 */
export const getDirections = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{
  route: any;
  duration: string;
  distance: string;
} | null> => {
  const maps = getGoogleMaps();
  if (!maps) return null;

  return new Promise((resolve) => {
    const directionsService = new maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: maps.TravelMode.DRIVING,
      },
      (result: any, status: string) => {
        if (status === 'OK' && result) {
          const leg = result.routes[0]?.legs[0];
          resolve({
            route: result,
            duration: leg?.duration?.text || '',
            distance: leg?.distance?.text || '',
          });
        } else {
          resolve(null);
        }
      }
    );
  });
};

// Export API key for components that need it directly
export { GOOGLE_MAPS_API_KEY };
