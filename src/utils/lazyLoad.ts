/**
 * Lazy loading utilities for improved TTFB and FCP
 * Implements various strategies for deferring non-critical resources
 */

/**
 * Execute callback when browser is idle
 * Falls back to setTimeout for browsers without requestIdleCallback
 */
export function whenIdle(callback: () => void, timeout = 2000): void {
  if ('requestIdleCallback' in window) {
    (window as typeof window & { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => void })
      .requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
  }
}

/**
 * Execute callback after page load
 */
export function afterLoad(callback: () => void): void {
  if (document.readyState === 'complete') {
    whenIdle(callback);
  } else {
    window.addEventListener('load', () => whenIdle(callback), { once: true });
  }
}

/**
 * Observe element visibility and trigger callback when visible
 */
export function whenVisible(
  element: Element | null,
  callback: () => void,
  options: IntersectionObserverInit = { rootMargin: '200px' }
): () => void {
  if (!element) {
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  }, options);

  observer.observe(element);

  return () => observer.disconnect();
}

/**
 * Preload critical resources during idle time
 */
export function preloadResource(url: string, type: 'image' | 'script' | 'style' | 'font'): void {
  whenIdle(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    if (type === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Prefetch a page for faster navigation
 */
export function prefetchPage(url: string): void {
  whenIdle(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Load script dynamically with async/defer
 */
export function loadScript(src: string, options: { async?: boolean; defer?: boolean } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = options.async ?? true;
    script.defer = options.defer ?? false;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Chunk array for batch processing
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process items in batches with idle time between
 */
export async function processBatched<T>(
  items: T[],
  processor: (item: T) => void | Promise<void>,
  batchSize = 5,
  delayMs = 0
): Promise<void> {
  const batches = chunk(items, batchSize);
  
  for (const batch of batches) {
    await Promise.all(batch.map(processor));
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Create a deferred promise that can be resolved externally
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}

/**
 * Cache with TTL support
 */
export class TTLCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  
  constructor(private defaultTtl = 5 * 60 * 1000) {} // 5 minutes default
  
  set(key: string, value: T, ttl = this.defaultTtl): void {
    this.cache.set(key, { value, expiry: Date.now() + ttl });
  }
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return item.value;
  }
  
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
