import { UpdateNotification } from "@/components/UpdateNotification";
import { PWAUpdatePrompt } from "@/components/website/PWAUpdatePrompt";

/**
 * Ensures we don't show duplicate update UX.
 * - If Service Workers are supported, rely on the PWA update prompt.
 * - Otherwise fall back to the non-PWA update toast.
 */
export function UpdateManager() {
  const supportsServiceWorker =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator;

  return supportsServiceWorker ? <PWAUpdatePrompt /> : <UpdateNotification />;
}
