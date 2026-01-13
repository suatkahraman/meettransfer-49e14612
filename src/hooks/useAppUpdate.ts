import { useState, useEffect, useCallback } from 'react';

interface UpdateState {
  hasUpdate: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
}

export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>({
    hasUpdate: false,
    isChecking: false,
    lastChecked: null,
  });

  // Check for updates by comparing current build hash with server
  const checkForUpdates = useCallback(async () => {
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

      // Compare entry script paths
      const hasNewVersion = Boolean(
        fetchedEntry && currentEntry && normalize(fetchedEntry) !== normalize(currentEntry)
      );
      
      setState({
        hasUpdate: hasNewVersion,
        isChecking: false,
        lastChecked: new Date(),
      });

      return hasNewVersion;
    } catch (error) {
      console.log('[Update Check] Error:', error);
      setState(prev => ({ ...prev, isChecking: false, lastChecked: new Date() }));
      return false;
    }
  }, []);

  // Refresh the app
  const refreshApp = useCallback(() => {
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

  // Check for updates on mount and periodically
  useEffect(() => {
    // Initial check after 5 seconds
    const initialCheck = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    // Check every 5 minutes
    const interval = setInterval(() => {
      checkForUpdates();
    }, 5 * 60 * 1000);

    // Also check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdates]);

  return {
    ...state,
    checkForUpdates,
    refreshApp,
  };
}
