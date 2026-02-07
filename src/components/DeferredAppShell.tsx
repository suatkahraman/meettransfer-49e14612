/**
 * DeferredAppShell — Groups non-critical app-wide components that do NOT need
 * to be in the initial JS bundle. They are lazy-loaded as a single chunk after
 * the critical Hero/LCP paint, reducing the main bundle size and unblocking FCP.
 *
 * Components included:
 * - FloatingWhatsApp (floating button)
 * - GeoLanguageInitializer (background geo check)
 * - UpdateManager (service worker update banner)
 * - PWAInstallPrompt (install prompt)
 * - PWADebugPanel (debug only with ?pwa_debug=1)
 * - AdBlockWarning (ad-blocker detection)
 * - CanonicalManager (SEO canonical tags)
 * - OfflineIndicator (offline banner)
 */

import FloatingWhatsApp from "@/components/website/FloatingWhatsApp";
import GeoLanguageInitializer from "@/components/GeoLanguageInitializer";
import { UpdateManager } from "@/components/UpdateManager";
import { PWAInstallPrompt } from "@/components/website/PWAInstallPrompt";
import { PWADebugPanel } from "@/components/website/PWADebugPanel";
import AdBlockWarning from "@/components/AdBlockWarning";
import CanonicalManager from "@/components/seo/CanonicalManager";
import OfflineIndicator from "@/components/OfflineIndicator";

const DeferredAppShell = () => (
  <>
    <GeoLanguageInitializer />
    <UpdateManager />
    <PWAInstallPrompt />
    <PWADebugPanel />
    <AdBlockWarning />
    <CanonicalManager />
    <OfflineIndicator />
    <FloatingWhatsApp />
  </>
);

export default DeferredAppShell;
