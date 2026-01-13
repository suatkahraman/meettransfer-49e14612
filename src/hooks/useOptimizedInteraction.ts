import { useCallback, useRef, useEffect } from 'react';

/**
 * Debounce function that delays execution until after wait ms have elapsed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function that ensures func is called at most once per wait ms
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastTime);
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Hook for debounced callback - maintains reference stability
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

/**
 * Hook for throttled callback - maintains reference stability
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const lastTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = delay - (now - lastTimeRef.current);
    
    if (remaining <= 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      lastTimeRef.current = now;
      callbackRef.current(...args);
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        lastTimeRef.current = Date.now();
        timeoutRef.current = null;
        callbackRef.current(...args);
      }, remaining);
    }
  }, [delay]);
}

/**
 * Hook to defer non-critical work using requestIdleCallback
 */
export function useDeferredCallback<T extends (...args: any[]) => any>(
  callback: T,
  timeout: number = 2000
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const idleCallbackRef = useRef<number | null>(null);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    return () => {
      if (idleCallbackRef.current) {
        if ('cancelIdleCallback' in window) {
          window.cancelIdleCallback(idleCallbackRef.current);
        }
      }
    };
  }, []);
  
  return useCallback((...args: Parameters<T>) => {
    if ('requestIdleCallback' in window) {
      if (idleCallbackRef.current) {
        window.cancelIdleCallback(idleCallbackRef.current);
      }
      idleCallbackRef.current = window.requestIdleCallback(
        () => callbackRef.current(...args),
        { timeout }
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => callbackRef.current(...args), 0);
    }
  }, [timeout]);
}

/**
 * Hook to add passive event listeners for scroll/touch events
 */
export function usePassiveEventListener(
  eventName: string,
  handler: EventListener,
  element: HTMLElement | Window | null = typeof window !== 'undefined' ? window : null,
  deps: React.DependencyList = []
) {
  const handlerRef = useRef(handler);
  
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);
  
  useEffect(() => {
    if (!element) return;
    
    const eventHandler: EventListener = (event) => handlerRef.current(event);
    
    element.addEventListener(eventName, eventHandler, { passive: true });
    
    return () => {
      element.removeEventListener(eventName, eventHandler);
    };
  }, [eventName, element]);
}

/**
 * Schedule work during browser idle time
 */
export function scheduleIdleWork(
  callback: () => void,
  timeout: number = 2000
): number | ReturnType<typeof setTimeout> {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  }
  return setTimeout(callback, 0);
}

/**
 * Cancel scheduled idle work
 */
export function cancelIdleWork(id: number | ReturnType<typeof setTimeout>) {
  if ('cancelIdleCallback' in window && typeof id === 'number') {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id as ReturnType<typeof setTimeout>);
  }
}

/**
 * Run callback in a non-blocking way by breaking up work
 */
export async function runNonBlocking<T>(
  items: T[],
  processItem: (item: T, index: number) => void,
  batchSize: number = 5
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    batch.forEach((item, idx) => processItem(item, i + idx));
    
    // Yield to the main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
