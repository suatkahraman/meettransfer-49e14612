import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const INSTALL_TRACK_KEY = 'app_install_tracked_v1';

    // Detect platform - more robust iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = (/iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
      !(window as any).MSStream;
    const isAndroidDevice = /android/.test(userAgent);

    // Check if running in standalone mode (already installed)
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const standalone = isIOSStandalone || isDisplayStandalone;

    setIsStandalone(standalone);
    setIsInstalled(standalone);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

      const trackInstallation = async () => {
      if (localStorage.getItem(INSTALL_TRACK_KEY) === '1') return;

      try {
        const visitorId = localStorage.getItem('visitor_id') || crypto.randomUUID();
        localStorage.setItem('visitor_id', visitorId);

        // Get current user if logged in
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch country info
        let countryCode: string | null = null;
        let countryName: string | null = null;
        let city: string | null = null;
        
        try {
          const geoRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            countryCode = geoData.country_code || null;
            countryName = geoData.country_name || null;
            city = geoData.city || null;
          }
        } catch {
          console.log('[PWA] Could not fetch geo info');
        }

        const { error } = await supabase.from('app_installations').insert({
          visitor_id: visitorId,
          user_id: user?.id || null,
          device: /mobile/i.test(userAgent) ? 'mobile' : 'desktop',
          browser: /chrome/i.test(userAgent)
            ? 'Chrome'
            : /safari/i.test(userAgent)
              ? 'Safari'
              : /firefox/i.test(userAgent)
                ? 'Firefox'
                : 'Other',
          platform: isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Desktop',
          country_code: countryCode,
          country_name: countryName,
          city: city,
        });

        if (error) {
          console.error('[PWA] Error tracking installation:', error);
          return;
        }

        localStorage.setItem(INSTALL_TRACK_KEY, '1');
        console.log('[PWA] Installation tracked successfully');
      } catch (error) {
        console.error('[PWA] Error tracking installation:', error);
      }
    };

    // iOS (Add to Home Screen) doesn't reliably fire `appinstalled`.
    // If we detect standalone mode, we record it once.
    if (standalone) {
      void trackInstallation();
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = async () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setCanInstall(false);

      await trackInstallation();

      // Try to open the installed app after a short delay
      setTimeout(() => {
        // Redirect to home to trigger standalone mode
        window.location.href = window.location.origin;
      }, 500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
      }
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error prompting PWA install:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Function to check if app can be opened via installed PWA
  const openInstalledApp = useCallback(() => {
    if (isStandalone) {
      // Already in standalone mode
      return true;
    }
    
    // Try to open the app URL which will open in installed PWA if available
    window.location.href = window.location.origin;
    return false;
  }, [isStandalone]);

  return {
    canInstall,
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    promptInstall,
    openInstalledApp,
    deferredPrompt,
  };
}
