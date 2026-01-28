/**
 * Utility for deferring third-party scripts to minimize main-thread work
 * Loads scripts only during idle time or after critical content is rendered
 */

type ScriptLoadOptions = {
  /** Script URL */
  src: string;
  /** Load after this many milliseconds (fallback if no idle callback) */
  timeout?: number;
  /** Attributes to add to the script tag */
  attributes?: Record<string, string>;
  /** Callback when script loads */
  onLoad?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
};

/**
 * Load a script during browser idle time
 * Uses requestIdleCallback when available, falls back to setTimeout
 */
export function loadScriptWhenIdle({
  src,
  timeout = 3000,
  attributes = {},
  onLoad,
  onError,
}: ScriptLoadOptions): void {
  const load = () => {
    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      onLoad?.();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;

    // Apply custom attributes
    Object.entries(attributes).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    script.onload = () => onLoad?.();
    script.onerror = () => onError?.(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(load, { timeout });
  } else {
    // Fallback for Safari and older browsers
    setTimeout(load, Math.min(timeout, 2000));
  }
}

/**
 * Load a script after the page's Largest Contentful Paint
 * Uses PerformanceObserver when available
 */
export function loadScriptAfterLCP(options: ScriptLoadOptions): void {
  if ('PerformanceObserver' in window) {
    let loaded = false;
    
    const observer = new PerformanceObserver((list) => {
      if (loaded) return;
      
      const entries = list.getEntries();
      if (entries.length > 0) {
        loaded = true;
        observer.disconnect();
        // Small delay after LCP to avoid competition
        setTimeout(() => loadScriptWhenIdle(options), 100);
      }
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // Fallback timeout in case LCP never fires
      setTimeout(() => {
        if (!loaded) {
          loaded = true;
          observer.disconnect();
          loadScriptWhenIdle(options);
        }
      }, 5000);
    } catch {
      // PerformanceObserver not supported for this entry type
      loadScriptWhenIdle(options);
    }
  } else {
    loadScriptWhenIdle(options);
  }
}

/**
 * Preconnect to a third-party origin
 * Establishes early connection for faster subsequent requests
 */
export function preconnectTo(origin: string, crossOrigin = true): void {
  // Check if already preconnected
  if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  if (crossOrigin) {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Prefetch DNS for a third-party origin
 * Lighter weight than preconnect, good for less critical resources
 */
export function dnsPrefetch(origin: string): void {
  if (document.querySelector(`link[rel="dns-prefetch"][href="${origin}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = origin;

  document.head.appendChild(link);
}

/**
 * Schedule a function to run during idle time
 * Wrapper around requestIdleCallback with fallback
 */
export function runWhenIdle(
  callback: () => void,
  options: { timeout?: number } = {}
): void {
  const { timeout = 2000 } = options;

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 50);
  }
}

/**
 * Yield to the main thread to prevent long tasks
 * Use this in loops or heavy processing to keep UI responsive
 */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if ('scheduler' in window && 'yield' in (window as any).scheduler) {
      (window as any).scheduler.yield().then(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Split a heavy task into smaller chunks that yield to main thread
 */
export async function processInChunks<T>(
  items: T[],
  processor: (item: T, index: number) => void,
  chunkSize = 5
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    chunk.forEach((item, idx) => processor(item, i + idx));
    
    // Yield after each chunk
    if (i + chunkSize < items.length) {
      await yieldToMain();
    }
  }
}

export default {
  loadScriptWhenIdle,
  loadScriptAfterLCP,
  preconnectTo,
  dnsPrefetch,
  runWhenIdle,
  yieldToMain,
  processInChunks,
};
