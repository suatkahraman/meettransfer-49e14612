import { useState, useEffect } from 'react';

const ADBLOCK_CHECK_KEY = 'mt_adblock_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface AdBlockStatus {
  isBlocked: boolean;
  isDismissed: boolean;
  dismiss: () => void;
}

export function useAdBlockDetection(): AdBlockStatus {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Start as dismissed to avoid flash

  useEffect(() => {
    // Check if user dismissed the warning recently
    const checkDismissed = () => {
      try {
        const dismissedAt = localStorage.getItem(ADBLOCK_CHECK_KEY);
        if (dismissedAt) {
          const dismissTime = parseInt(dismissedAt, 10);
          if (Date.now() - dismissTime < DISMISS_DURATION) {
            setIsDismissed(true);
            return true;
          }
        }
        setIsDismissed(false);
        return false;
      } catch {
        setIsDismissed(false);
        return false;
      }
    };

    if (checkDismissed()) return;

    // Multiple detection methods
    const detectAdBlock = async () => {
      let blocked = false;

      // Method 1: Create a bait element that ad blockers typically block
      try {
        const bait = document.createElement('div');
        bait.className = 'adsbox ad-banner ad-placement advertisement';
        bait.style.cssText = 'position: absolute; top: -9999px; left: -9999px; height: 1px; width: 1px;';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);
        
        // Wait for ad blocker to potentially hide the element
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const isHidden = bait.offsetHeight === 0 || 
                        bait.offsetWidth === 0 || 
                        bait.clientHeight === 0 ||
                        getComputedStyle(bait).display === 'none' ||
                        getComputedStyle(bait).visibility === 'hidden';
        
        document.body.removeChild(bait);
        
        if (isHidden) {
          blocked = true;
        }
      } catch {
        // If we can't create the bait, assume no ad blocker
      }

      // Method 2: Try to fetch a fake ad script (some blockers block these requests)
      if (!blocked) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000);
          
          // Use a path that ad blockers commonly block
          const response = await fetch('/ads/tracking.js', {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors'
          });
          
          clearTimeout(timeoutId);
          // If we get here without error, no ad blocker (or it didn't block this)
        } catch (err) {
          // Network error might indicate ad blocker, but could also be 404
          // We don't set blocked=true here since it's not reliable
        }
      }

      // Method 3: Check if common tracking scripts are blocked
      if (!blocked && typeof window !== 'undefined') {
        // Check if navigator.sendBeacon is being intercepted
        const originalSendBeacon = navigator.sendBeacon;
        if (!originalSendBeacon) {
          blocked = true;
        }
      }

      setIsBlocked(blocked);
    };

    // Run detection after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(detectAdBlock, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(ADBLOCK_CHECK_KEY, Date.now().toString());
      setIsDismissed(true);
    } catch {
      setIsDismissed(true);
    }
  };

  return { isBlocked, isDismissed, dismiss };
}
