import { useState, useEffect } from 'react';

interface PWAStatus {
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isPWA: boolean;
}

export function usePWADetect(): PWAStatus {
  const [status, setStatus] = useState<PWAStatus>({
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isPWA: false,
  });

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    // Detect platform
    const isIOS = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/.test(userAgent);
    
    // Detect browser
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/crios/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) || /crios/.test(userAgent);
    
    // Detect standalone mode (PWA installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    // Is running as PWA
    const isPWA = isStandalone;

    setStatus({
      isStandalone,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isPWA,
    });
  }, []);

  return status;
}
