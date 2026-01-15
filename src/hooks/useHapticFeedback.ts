import { useCallback } from "react";

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

interface HapticFeedback {
  trigger: (style?: HapticStyle) => void;
  isSupported: boolean;
}

/**
 * Cross-platform haptic feedback hook
 * - iOS: Uses native haptic engine patterns
 * - Android: Uses Vibration API with pattern variations
 */
export function useHapticFeedback(): HapticFeedback {
  // Check for haptic/vibration support
  const isSupported = typeof navigator !== 'undefined' && (
    'vibrate' in navigator || 
    // @ts-ignore - iOS specific
    typeof window?.webkit?.messageHandlers?.haptic !== 'undefined'
  );

  const trigger = useCallback((style: HapticStyle = 'medium') => {
    // Vibration patterns (in ms) for different feedback types
    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 20],
      warning: [20, 40, 20, 40, 20],
      error: [50, 100, 50],
      selection: 5,
    };

    try {
      // Try iOS haptic first (if available via Capacitor or native bridge)
      // @ts-ignore
      if (window?.webkit?.messageHandlers?.haptic) {
        // @ts-ignore
        window.webkit.messageHandlers.haptic.postMessage({ style });
        return;
      }

      // Try Capacitor Haptics plugin
      // @ts-ignore
      if (window?.Capacitor?.Plugins?.Haptics) {
        const impactStyle = style === 'light' ? 'Light' 
          : style === 'heavy' ? 'Heavy' 
          : style === 'success' ? 'Medium'
          : style === 'warning' ? 'Medium'
          : style === 'error' ? 'Heavy'
          : style === 'selection' ? 'Light'
          : 'Medium';
        
        // @ts-ignore
        window.Capacitor.Plugins.Haptics.impact({ style: impactStyle });
        return;
      }

      // Fallback to standard Vibration API (Android Chrome, some desktop)
      if ('vibrate' in navigator) {
        const pattern = patterns[style];
        navigator.vibrate(pattern);
      }
    } catch (error) {
      // Silently fail - haptics are non-critical
      console.debug('Haptic feedback not available:', error);
    }
  }, []);

  return {
    trigger,
    isSupported,
  };
}

/**
 * Utility function for one-off haptic triggers without hook
 */
export function triggerHaptic(style: HapticStyle = 'medium'): void {
  const patterns: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 20],
    warning: [20, 40, 20, 40, 20],
    error: [50, 100, 50],
    selection: 5,
  };

  try {
    // @ts-ignore
    if (window?.Capacitor?.Plugins?.Haptics) {
      const impactStyle = style === 'light' ? 'Light' 
        : style === 'heavy' ? 'Heavy' 
        : 'Medium';
      // @ts-ignore
      window.Capacitor.Plugins.Haptics.impact({ style: impactStyle });
      return;
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(patterns[style]);
    }
  } catch {
    // Silent fail
  }
}
