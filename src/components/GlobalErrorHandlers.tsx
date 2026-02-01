import { useEffect } from "react";
import { toast } from "sonner";

const safeSessionGet = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSessionSet = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const hardReloadWithBust = () => {
  const url = new URL(window.location.href);
  url.searchParams.set("_t", String(Date.now()));
  window.location.replace(url.toString());
};

const isChunkishErrorMessage = (message: string) => {
  const m = (message || "").toLowerCase();
  return (
    m.includes("loading chunk") ||
    m.includes("loading css chunk") ||
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("error loading dynamically imported module") ||
    (m.includes("failed to fetch") && m.includes(".js"))
  );
};

/**
 * Catches async errors (unhandled promise rejections) that don't reach React error boundaries.
 * Especially useful on iOS Safari/PWA where an unhandled rejection can leave the app stuck.
 */
export function GlobalErrorHandlers() {
  useEffect(() => {
    const chunkRefreshKey = "global_error_last_refresh";

    const maybeRecoverFromChunkError = (message: string) => {
      if (!isChunkishErrorMessage(message)) return false;

      const last = safeSessionGet(chunkRefreshKey);
      const now = Date.now();

      // Prevent infinite reload loops
      if (last && now - parseInt(last) < 30000) {
        return true;
      }

      safeSessionSet(chunkRefreshKey, String(now));
      hardReloadWithBust();
      return true;
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        (reason && typeof reason === "object" && "message" in reason
          ? String((reason as any).message)
          : String(reason)) || "";

      console.error("[GlobalErrorHandlers] Unhandled rejection:", reason);

      if (maybeRecoverFromChunkError(message)) {
        event.preventDefault();
        return;
      }

      toast.error("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      event.preventDefault();
    };

    const onWindowError = (event: ErrorEvent) => {
      const message = event.message || "";
      console.error("[GlobalErrorHandlers] Window error:", event.error || event.message);

      // If this looks like a chunk loading issue, attempt a safe hard reload.
      if (maybeRecoverFromChunkError(message)) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
    };
  }, []);

  return null;
}
