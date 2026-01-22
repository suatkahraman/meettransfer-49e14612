type AfterInteractiveOptions = {
  /**
   * If true, only run after the first user interaction (click/touch/keydown).
   * If false, runs on whichever happens first: interaction OR idle-after-load.
   */
  requireInteraction?: boolean;
  /**
   * Timeout passed to requestIdleCallback.
   */
  idleTimeoutMs?: number;
  /**
   * Optional extra delay before scheduling.
   */
  minDelayMs?: number;
};

const hasRequestIdleCallback = (): boolean =>
  typeof window !== "undefined" && "requestIdleCallback" in window;

const requestIdle = (cb: () => void, timeout: number) => {
  if (!hasRequestIdleCallback()) {
    return window.setTimeout(cb, Math.min(timeout, 1000));
  }
  return (
    window as Window & {
      requestIdleCallback: (fn: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback(cb, { timeout });
};

/**
 * Schedules work after the page is interactive (or first interaction), so it doesn't compete
 * with LCP/critical rendering. Safe to call in effects.
 */
export function runAfterInteractive(callback: () => void, opts: AfterInteractiveOptions = {}) {
  if (typeof window === "undefined") return;

  const {
    requireInteraction = false,
    idleTimeoutMs = 3000,
    minDelayMs = 0,
  } = opts;

  let done = false;
  let cleanupInteraction: (() => void) | null = null;

  const trigger = () => {
    if (done) return;
    done = true;
    cleanupInteraction?.();
    cleanupInteraction = null;
    callback();
  };

  const scheduleIdleAfterLoad = () => {
    requestIdle(trigger, idleTimeoutMs);
  };

  const addInteractionListeners = () => {
    const on = () => trigger();
    const cleanup = () => {
      window.removeEventListener("touchstart", on);
      window.removeEventListener("click", on);
      window.removeEventListener("keydown", on);
    };
    window.addEventListener("touchstart", on, { once: true, passive: true });
    window.addEventListener("click", on, { once: true });
    window.addEventListener("keydown", on, { once: true });
    return cleanup;
  };

  const start = () => {
    // Always listen for interaction as a fast trigger
    cleanupInteraction = addInteractionListeners();

    if (!requireInteraction) {
      // Otherwise allow idle-after-load to trigger too
      if (document.readyState === "complete") {
        scheduleIdleAfterLoad();
      } else {
        window.addEventListener(
          "load",
          () => {
            scheduleIdleAfterLoad();
          },
          { once: true }
        );
      }
    }

    // `trigger()` will clean up listeners when it runs
  };

  if (minDelayMs > 0) {
    window.setTimeout(start, minDelayMs);
  } else {
    start();
  }
}
