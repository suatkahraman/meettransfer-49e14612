import { useState, useEffect } from 'react';

interface PWAStatus {
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isSamsung: boolean;
  isOpera: boolean;
  isPWA: boolean;
  browserName: string;
  browserVersion: string;
  platformName: string;
  supportsInstall: boolean;
}

export function usePWADetect(): PWAStatus {
  const [status, setStatus] = useState<PWAStatus>({
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
    isSamsung: false,
    isOpera: false,
    isPWA: false,
    browserName: 'Unknown',
    browserVersion: 'unknown',
    platformName: 'Unknown',
    supportsInstall: false,
  });

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const userAgentLower = userAgent.toLowerCase();
    
    // Platform detection
    const isIOS = (
      /iphone|ipad|ipod/i.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    ) && !('MSStream' in window);
    
    const isAndroid = /android/i.test(userAgent);
    
    // Browser detection
    const isSamsung = /SamsungBrowser/i.test(userAgent);
    const isOpera = /OPR|Opera/i.test(userAgent);
    const isEdge = /Edg/i.test(userAgent);
    const isFirefox = /Firefox/i.test(userAgent) && !/Seamonkey/i.test(userAgent);
    const isCriOS = /CriOS/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent) && !isEdge && !isOpera && !isSamsung && !/Chromium/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !isChrome && !isCriOS && !isEdge && !isOpera && !isSamsung && !isFirefox;
    
    // Get browser name and version
    let browserName = 'Unknown';
    let browserVersion = 'unknown';
    
    if (isSamsung) {
      browserName = 'Samsung Internet';
      const match = userAgent.match(/SamsungBrowser\/(\d+)/);
      browserVersion = match?.[1] || 'unknown';
    } else if (isOpera) {
      browserName = 'Opera';
      const match = userAgent.match(/OPR\/(\d+)/);
      browserVersion = match?.[1] || 'unknown';
    } else if (isEdge) {
      browserName = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      browserVersion = match?.[1] || 'unknown';
    } else if (isFirefox) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browserVersion = match?.[1] || 'unknown';
    } else if (isCriOS) {
      browserName = 'Chrome iOS';
      const match = userAgent.match(/CriOS\/(\d+)/);
      browserVersion = match?.[1] || 'unknown';
    } else if (isChrome) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browserVersion = match?.[1] || 'unknown';
    } else if (isSafari) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      browserVersion = match?.[1] || 'unknown';
    }
    
    // Platform name
    let platformName = 'Desktop';
    if (isIOS) platformName = 'iOS';
    else if (isAndroid) platformName = 'Android';
    
    // Detect standalone mode (PWA installed)
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    const isTWA = document.referrer.includes('android-app://');
    
    const isStandalone = isIOSStandalone || isDisplayStandalone || isFullscreen || isMinimalUI || isTWA;
    
    // Determine install support
    let supportsInstall = false;
    
    if (isIOS) {
      // Only Safari on iOS supports Add to Home Screen
      supportsInstall = isSafari;
    } else if (isAndroid) {
      // Most Android browsers support PWA install
      supportsInstall = isChrome || isSamsung || isFirefox || isOpera || isEdge;
    } else {
      // Desktop - Chrome, Edge, Opera support native install
      supportsInstall = isChrome || isEdge || isOpera;
    }

    setStatus({
      isStandalone,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isFirefox,
      isEdge,
      isSamsung,
      isOpera,
      isPWA: isStandalone,
      browserName,
      browserVersion,
      platformName,
      supportsInstall,
    });
    
    console.log('[PWADetect] Status:', {
      browser: browserName,
      version: browserVersion,
      platform: platformName,
      standalone: isStandalone,
      supportsInstall
    });
  }, []);

  return status;
}
