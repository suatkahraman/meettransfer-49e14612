import { useState, useEffect, useCallback, useRef } from 'react';
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

interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
  installMethod: 'native' | 'manual' | 'none';
  instructions?: string;
}

// Cache keys for optimization
const GEO_CACHE_KEY = 'mt_geo_cache';
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const EXCLUDED_ROLES: Array<'admin' | 'driver' | 'agency'> = ['admin', 'driver', 'agency'];

interface GeoCache {
  data: { countryCode: string; countryName: string; city: string };
  timestamp: number;
}

function getCachedGeo(): GeoCache['data'] | null {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (!cached) return null;
    const parsed: GeoCache = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > GEO_CACHE_TTL) {
      localStorage.removeItem(GEO_CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedGeo(data: GeoCache['data']): void {
  try {
    const cache: GeoCache = { data, timestamp: Date.now() };
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const isExcludedUserRef = useRef<boolean | null>(null);

  useEffect(() => {
    const INSTALL_TRACK_KEY = 'app_install_tracked_v2';

    // Enhanced platform detection
    const userAgent = window.navigator.userAgent;
    const userAgentLower = userAgent.toLowerCase();
    
    // iOS detection (including iPad Pro with desktop Safari)
    const isIOSDevice = (
      /iphone|ipad|ipod/i.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    ) && !('MSStream' in window);
    
    // Android detection
    const isAndroidDevice = /android/i.test(userAgent);
    
    // Browser detection with version
    const detectBrowser = (): BrowserInfo => {
      const ua = userAgent;
      
      // Samsung Internet
      if (/SamsungBrowser/i.test(ua)) {
        const match = ua.match(/SamsungBrowser\/(\d+)/);
        return {
          name: 'Samsung Internet',
          version: match?.[1] || 'unknown',
          isSupported: true,
          installMethod: 'native'
        };
      }
      
      // UC Browser
      if (/UCBrowser/i.test(ua)) {
        return {
          name: 'UC Browser',
          version: 'unknown',
          isSupported: false,
          installMethod: 'none',
          instructions: 'UC Browser PWA desteği sınırlıdır. Chrome veya Safari kullanmanızı öneririz.'
        };
      }
      
      // Opera Mini
      if (/Opera Mini/i.test(ua)) {
        return {
          name: 'Opera Mini',
          version: 'unknown',
          isSupported: false,
          installMethod: 'none',
          instructions: 'Opera Mini PWA desteği sınırlıdır. Chrome veya Safari kullanmanızı öneririz.'
        };
      }
      
      // Opera
      if (/OPR|Opera/i.test(ua)) {
        const match = ua.match(/OPR\/(\d+)/);
        return {
          name: 'Opera',
          version: match?.[1] || 'unknown',
          isSupported: true,
          installMethod: 'native'
        };
      }
      
      // Edge (Chromium)
      if (/Edg/i.test(ua)) {
        const match = ua.match(/Edg\/(\d+)/);
        return {
          name: 'Edge',
          version: match?.[1] || 'unknown',
          isSupported: true,
          installMethod: 'native'
        };
      }
      
      // Firefox
      if (/Firefox/i.test(ua) && !/Seamonkey/i.test(ua)) {
        const match = ua.match(/Firefox\/(\d+)/);
        const version = parseInt(match?.[1] || '0', 10);
        // Firefox on Android supports PWA from version 79+
        // Firefox on desktop has limited support
        const isSupported = isAndroidDevice && version >= 79;
        return {
          name: 'Firefox',
          version: match?.[1] || 'unknown',
          isSupported,
          installMethod: isSupported ? 'native' : 'manual',
          instructions: !isSupported 
            ? 'Firefox masaüstünde PWA desteği sınırlıdır. Menüden "Sayfayı ana ekrana ekle" seçeneğini kullanın.' 
            : undefined
        };
      }
      
      // Chrome on iOS (CriOS)
      if (/CriOS/i.test(ua)) {
        return {
          name: 'Chrome iOS',
          version: 'unknown',
          isSupported: false,
          installMethod: 'manual',
          instructions: 'iOS\'ta uygulamayı yüklemek için Safari kullanın.'
        };
      }
      
      // Chrome
      if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) {
        const match = ua.match(/Chrome\/(\d+)/);
        const version = parseInt(match?.[1] || '0', 10);
        return {
          name: 'Chrome',
          version: match?.[1] || 'unknown',
          isSupported: version >= 68, // PWA install prompt from Chrome 68+
          installMethod: version >= 68 ? 'native' : 'manual'
        };
      }
      
      // Safari
      if (/Safari/i.test(ua) && !/Chrome|CriOS|Chromium/i.test(ua)) {
        const match = ua.match(/Version\/(\d+)/);
        const version = parseInt(match?.[1] || '0', 10);
        return {
          name: 'Safari',
          version: match?.[1] || 'unknown',
          isSupported: true,
          installMethod: 'manual' // Safari always requires manual Add to Home Screen
        };
      }
      
      // Brave
      if ('brave' in navigator) {
        return {
          name: 'Brave',
          version: 'unknown',
          isSupported: true,
          installMethod: 'native'
        };
      }
      
      // Chromium-based (fallback)
      if (/Chromium/i.test(ua)) {
        return {
          name: 'Chromium',
          version: 'unknown',
          isSupported: true,
          installMethod: 'native'
        };
      }
      
      // Unknown browser
      return {
        name: 'Unknown',
        version: 'unknown',
        isSupported: false,
        installMethod: 'manual',
        instructions: 'Bu tarayıcı PWA desteği sağlamayabilir. Chrome veya Safari kullanmanızı öneririz.'
      };
    };
    
    const browser = detectBrowser();
    setBrowserInfo(browser);
    
    // Log browser info for debugging
    console.log('[PWA] Browser detected:', browser);
    console.log('[PWA] Platform:', { isIOS: isIOSDevice, isAndroid: isAndroidDevice });

    // Check if running in standalone mode (already installed)
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    const isTWA = document.referrer.includes('android-app://');
    
    const standalone = isIOSStandalone || isDisplayStandalone || isFullscreen || isMinimalUI || isTWA;

    setIsStandalone(standalone);
    setIsInstalled(standalone);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // For iOS, set canInstall to true if not already installed (manual install)
    if (isIOSDevice && !standalone && browser.name === 'Safari') {
      setCanInstall(true);
    }

    const trackInstallation = async () => {
      if (localStorage.getItem(INSTALL_TRACK_KEY) === '1') return;

      try {
        // Check if user has excluded role (admin, driver, agency)
        if (isExcludedUserRef.current === null) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .in('role', EXCLUDED_ROLES)
              .limit(1);
            
            isExcludedUserRef.current = (roleData && roleData.length > 0);
          } else {
            isExcludedUserRef.current = false;
          }
        }

        // Don't track excluded users
        if (isExcludedUserRef.current) {
          console.log('[PWA] Skipping install tracking for excluded user role');
          return;
        }

        const visitorId = localStorage.getItem('visitor_id') || crypto.randomUUID();
        localStorage.setItem('visitor_id', visitorId);

        // Get current user if logged in
        const { data: { user } } = await supabase.auth.getUser();

        // Use cached geo or fetch new with timeout
        let geo = getCachedGeo();
        if (!geo) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const geoRes = await fetch('https://ipapi.co/json/', { 
              signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              geo = {
                countryCode: geoData.country_code || '',
                countryName: geoData.country_name || '',
                city: geoData.city || ''
              };
              setCachedGeo(geo);
            }
          } catch (geoError) {
            console.log('[PWA] Could not fetch geo info:', geoError);
            geo = { countryCode: '', countryName: '', city: '' };
          }
        }

        const payload = {
          visitor_id: visitorId,
          user_id: user?.id || null,
          device: /mobile|tablet/i.test(userAgent) ? 'mobile' : 'desktop',
          browser: browser.name,
          platform: isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Desktop',
          country_code: geo?.countryCode || null,
          country_name: geo?.countryName || null,
          city: geo?.city || null,
          // Ensure consistent ordering in admin views
          installed_at: new Date().toISOString(),
        };

        // IMPORTANT: use INSERT (not UPSERT) so we don't require UPDATE RLS.
        const { error } = await supabase.from('app_installations').insert(payload);

        // Treat "already exists" as success (prevents endless retry loops)
        if (error && (error as any)?.code === '23505') {
          localStorage.setItem(INSTALL_TRACK_KEY, '1');
          console.log('[PWA] Installation already tracked');
          return;
        }

        if (error) {
          console.error('[PWA] Error tracking installation:', error);
          return;
        }

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

    // Listen for beforeinstallprompt event (Chromium browsers)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('[PWA] beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = async () => {
      console.log('[PWA] appinstalled event fired');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setCanInstall(false);

      await trackInstallation();

      // Try to open the installed app after a short delay
      setTimeout(() => {
        window.location.href = window.location.origin + '/?source=pwa_installed';
      }, 500);
    };

    // Listen for display mode changes
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        console.log('[PWA] Display mode changed to standalone');
        setIsStandalone(true);
        setIsInstalled(true);
        void trackInstallation();
      }
    };

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      return false;
    }

    try {
      console.log('[PWA] Triggering install prompt...');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[PWA] User choice:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
      }
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Error prompting install:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Function to check if app can be opened via installed PWA
  const openInstalledApp = useCallback(() => {
    if (isStandalone) {
      return true;
    }
    
    // Try to open the app URL which will open in installed PWA if available
    window.location.href = window.location.origin + '/?source=pwa';
    return false;
  }, [isStandalone]);

  // Get install instructions for current browser/platform
  const getInstallInstructions = useCallback((): { steps: string[]; note?: string } => {
    if (isIOS) {
      return {
        steps: [
          'Safari\'de paylaş (Share) butonuna dokunun',
          '"Ana Ekrana Ekle" seçeneğini seçin',
          '"Ekle" butonuna dokunun'
        ],
        note: browserInfo?.name !== 'Safari' 
          ? 'iOS\'ta uygulamayı yüklemek için Safari tarayıcısını kullanın.'
          : undefined
      };
    }
    
    if (isAndroid) {
      if (browserInfo?.name === 'Samsung Internet') {
        return {
          steps: [
            'Menü butonuna (☰) dokunun',
            '"Sayfayı ekle" veya "Ana ekrana ekle" seçin',
            'Onaylayın'
          ]
        };
      }
      
      if (browserInfo?.name === 'Firefox') {
        return {
          steps: [
            'Menü butonuna (⋮) dokunun',
            '"Yükle" veya "Ana ekrana ekle" seçin',
            'Onaylayın'
          ]
        };
      }
      
      // Chrome and other Chromium browsers
      return {
        steps: [
          'Menü butonuna (⋮) dokunun',
          '"Uygulamayı yükle" veya "Ana ekrana ekle" seçin',
          'Onaylayın'
        ]
      };
    }
    
    // Desktop
    if (browserInfo?.name === 'Chrome' || browserInfo?.name === 'Edge') {
      return {
        steps: [
          'Adres çubuğundaki yükleme simgesine (⊕) tıklayın',
          '"Yükle" butonuna tıklayın'
        ]
      };
    }
    
    if (browserInfo?.name === 'Firefox') {
      return {
        steps: [
          'Firefox masaüstünde PWA desteği sınırlıdır',
          'Chrome veya Edge kullanmanızı öneririz'
        ],
        note: 'Firefox masaüstü tarayıcısı PWA yüklemeyi tam olarak desteklememektedir.'
      };
    }
    
    return {
      steps: [
        'Tarayıcı menüsünden "Uygulamayı yükle" seçeneğini arayın',
        'Veya adres çubuğundaki yükleme simgesine tıklayın'
      ]
    };
  }, [isIOS, isAndroid, browserInfo]);

  return {
    canInstall,
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    promptInstall,
    openInstalledApp,
    deferredPrompt,
    browserInfo,
    getInstallInstructions,
  };
}
