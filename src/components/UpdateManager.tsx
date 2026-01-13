import { PWAUpdatePrompt } from "@/components/website/PWAUpdatePrompt";

/**
 * Single source of truth for app update notifications.
 * Uses only PWAUpdatePrompt which handles service worker updates.
 * Preview/development environments are handled inside PWAUpdatePrompt.
 */
export function UpdateManager() {
  // Only use PWAUpdatePrompt - it handles all environments internally
  // and provides a better UX than the Sonner toast
  return <PWAUpdatePrompt />;
}
