import { useState, useEffect, useCallback, useRef } from 'react';

interface UpdateState {
  hasUpdate: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
}

// Session storage key to track if update was already shown
const UPDATE_SHOWN_KEY = 'app_update_shown_version';

// Check if we're in a preview/development environment
const isPreviewEnvironment = () => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname.includes('preview') ||
    hostname.includes('lovableproject.com') ||
    hostname.includes('webcontainer')
  );
};

export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>({
    hasUpdate: false,
    isChecking: false,
    lastChecked: null,
  });
  
  // Track the detected version to prevent duplicate notifications
  const detectedVersionRef = useRef<string | null>(null);

  // Check for updates by comparing current build hash with server
  const checkForUpdates = useCallback(async () => {
    // Skip update checks in preview/development environment
    if (isPreviewEnvironment()) {
      console.log('[Update Check] Skipping in preview environment');
      return false;
    }
    
    setState(prev => ({ ...prev, isChecking: true }));
    
    try {
      // Fetch index.html with cache-busting to get latest version
      const response = await fetch(`/?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const html = await response.text();
      
      // Extract entry script from the fetched HTML (works across build naming)
      const scriptMatch = html.match(
        /<script[^>]+type="module"[^>]*src="(\/assets\/[^\"?]+\.js)(?:\?[^\"]*)?"/i
      );
      const fetchedEntry = scriptMatch?.[1];

      // Get current entry script from DOM
      const currentScript = document.querySelector(
        'script[type="module"][src^="/assets/"]'
      ) as HTMLScriptElement | null;
      const currentEntry = currentScript?.getAttribute('src') || '';

      const normalize = (src: string) => src.split('?')[0];
      const normalizedFetched = fetchedEntry ? normalize(fetchedEntry) : '';
      const normalizedCurrent = normalize(currentEntry);

      // Compare entry script paths
      const hasNewVersion = Boolean(
        normalizedFetched && normalizedCurrent && normalizedFetched !== normalizedCurrent
      );
      
      // Check if we already showed notification for this version
      const shownVersion = sessionStorage.getItem(UPDATE_SHOWN_KEY);
      const alreadyShown = shownVersion === normalizedFetched;
      
      // Only set hasUpdate if it's genuinely new and not already shown
      if (hasNewVersion && !alreadyShown && normalizedFetched) {
        // Only trigger update if version is different from what we detected before
        if (detectedVersionRef.current !== normalizedFetched) {
          detectedVersionRef.current = normalizedFetched;
          sessionStorage.setItem(UPDATE_SHOWN_KEY, normalizedFetched);
          
          setState({
            hasUpdate: true,
            isChecking: false,
            lastChecked: new Date(),
          });
          return true;
        }
      }
      
      setState(prev => ({
        ...prev,
        isChecking: false,
        lastChecked: new Date(),
      }));

      return false;
    } catch (error) {
      console.log('[Update Check] Error:', error);
      setState(prev => ({ ...prev, isChecking: false, lastChecked: new Date() }));
      return false;
    }
  }, []);

  // Refresh the app
  const refreshApp = useCallback(() => {
    // Clear the shown version so it doesn't block future updates
    sessionStorage.removeItem(UPDATE_SHOWN_KEY);
    
    // Clear caches before reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          // Don't clear push notification cache
          if (!name.includes('push')) {
            caches.delete(name);
          }
        });
      });
    }
    
    // Force reload from server
    window.location.reload();
  }, []);

  // Check for updates on mount and periodically (only in production)
  useEffect(() => {
    // Skip in preview environment
    if (isPreviewEnvironment()) {
      return;
    }
    
    // Initial check after 10 seconds (increased from 5)
    const initialCheck = setTimeout(() => {
      checkForUpdates();
    }, 10000);

    // Check every 10 minutes (increased from 5)
    const interval = setInterval(() => {
      checkForUpdates();
    }, 10 * 60 * 1000);

    // Also check when tab becomes visible (with debounce)
    let visibilityTimeout: ReturnType<typeof setTimeout>;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Debounce visibility checks to prevent rapid fire
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          checkForUpdates();
        }, 2000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
      clearTimeout(visibilityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdates]);

  return {
    ...state,
    checkForUpdates,
    refreshApp,
  };
}
