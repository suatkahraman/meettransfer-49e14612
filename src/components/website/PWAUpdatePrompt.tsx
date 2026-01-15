import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

/**
 * Silent PWA update handler.
 * - Auto-applies updates in the background without any UI prompt.
 * - Shows a brief toast after reload to confirm the update.
 */

// Check if we're in a preview/development environment - skip updates there
const isPreviewEnvironment = () => {
  if (typeof window === "undefined") return true;
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname.includes("preview") ||
    hostname.includes("lovableproject.com") ||
    hostname.includes("webcontainer")
  );
};

const PWA_UPDATE_FLAG = "pwa_just_updated";

export function PWAUpdatePrompt() {
  const { language } = useLanguage();
  const lastPromptedSwUrlRef = useRef<string | null>(null);
  const lastSeenVersionRef = useRef<string | null>(null);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  // Show toast if we just updated (flag set before reload)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const flag = sessionStorage.getItem(PWA_UPDATE_FLAG);
    if (flag) {
      sessionStorage.removeItem(PWA_UPDATE_FLAG);
      
      const toastText = {
        TR: "Uygulama güncellendi ✓",
        EN: "App updated ✓",
        DE: "App aktualisiert ✓",
        FR: "Application mise à jour ✓",
        RU: "Приложение обновлено ✓",
        IT: "App aggiornata ✓",
        ES: "App actualizada ✓",
        AR: "تم تحديث التطبيق ✓",
        UK: "Додаток оновлено ✓",
        JA: "アプリが更新されました ✓",
      }[language] ?? "App updated ✓";

      // Short delay to let the app settle
      setTimeout(() => {
        toast.success(toastText, {
          duration: 2500,
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
      }, 800);
    }
  }, [language]);

  useEffect(() => {
    // Skip in preview/development environments
    if (isPreviewEnvironment()) {
      console.log("[PWA Update] Skipping in preview environment:", window.location.hostname);
      return;
    }

    console.log("[PWA Update] Initializing silent updates on production:", window.location.hostname);

    if (!("serviceWorker" in navigator)) {
      console.log("[PWA Update] Service Worker not supported");
      return;
    }

    const applyUpdateAutomatically = async () => {
      const registration = registrationRef.current;
      const waitingUrl = registration?.waiting?.scriptURL ?? null;
      console.log("[PWA Update] 🚀 Auto-applying update!", { waitingUrl });

      // If the same waiting SW was already processed, skip
      if (waitingUrl && lastPromptedSwUrlRef.current === waitingUrl) {
        console.log("[PWA Update] Update already applied for this version, skipping");
        return;
      }

      lastPromptedSwUrlRef.current = waitingUrl;

      // Auto-apply the update without showing prompt
      try {
        // Force update check to get the absolute latest SW
        await registration?.update();
        await new Promise(resolve => setTimeout(resolve, 300));
        await registration?.update();
        await new Promise(resolve => setTimeout(resolve, 200));

        const latestWaiting = registration?.waiting;
        console.log("[PWA Update] ✅ Auto-applying LATEST update:", {
          scriptURL: latestWaiting?.scriptURL,
          state: latestWaiting?.state
        });

        // Set flag before reload so we can show toast after
        sessionStorage.setItem(PWA_UPDATE_FLAG, "1");

        // Use vite-plugin-pwa helper if available
        if (updateSWRef.current) {
          console.log("[PWA Update] Using updateSW helper for auto-update");
          void updateSWRef.current(true);
          return;
        }

        // Fallback - tell the waiting SW to take over
        if (latestWaiting) {
          console.log("[PWA Update] Using SKIP_WAITING message for auto-update");
          latestWaiting.postMessage({ type: "SKIP_WAITING" });
          return;
        }
      } catch (error) {
        console.error("[PWA Update] Auto-update error:", error);
        // Even on error, try to apply
        if (updateSWRef.current) {
          sessionStorage.setItem(PWA_UPDATE_FLAG, "1");
          void updateSWRef.current(true);
        }
      }
    };

    // Register SW once.
    console.log("[PWA Update] Registering service worker...");
    updateSWRef.current = registerSW({
      immediate: true,
      onRegisteredSW: (swUrl, registration) => {
        console.log("[PWA Update] ✅ SW registered:", swUrl);
        registrationRef.current = registration ?? null;

        // Log current SW state
        console.log("[PWA Update] SW State:", {
          active: registration?.active?.state,
          waiting: !!registration?.waiting,
          installing: !!registration?.installing,
        });

        // If there's already a waiting worker, auto-apply immediately.
        if (registration?.waiting) {
          console.log("[PWA Update] Found waiting worker, auto-applying update");
          applyUpdateAutomatically();
        }

        const requestUpdateCheck = async () => {
          console.log("[PWA Update] Checking for updates...");
          try {
            await registration?.update();
            if (registration?.waiting) {
              console.log("[PWA Update] New version waiting after check, auto-applying");
              applyUpdateAutomatically();
            } else {
              console.log("[PWA Update] No new version found");
            }
          } catch (e) {
            console.log("[PWA Update] Update check error:", e);
          }
        };

        // Extra-fast detection for installed PWAs:
        // version.json is fetched with no-store to bypass caches; if it changes, we force a SW update + reload.
        const pollVersionJson = async () => {
          try {
            const res = await fetch("/version.json", { cache: "no-store" });
            if (!res.ok) return;
            const v = (await res.json()) as { version?: string; buildNumber?: number; releaseDate?: string };
            const fingerprint = `${v?.version ?? ""}-${v?.buildNumber ?? ""}-${v?.releaseDate ?? ""}`;
            if (!fingerprint || fingerprint === "--") return;

            if (!lastSeenVersionRef.current) {
              lastSeenVersionRef.current = fingerprint;
              return;
            }

            if (lastSeenVersionRef.current !== fingerprint) {
              console.log("[PWA Update] 🔥 version.json changed → forcing immediate update", {
                from: lastSeenVersionRef.current,
                to: fingerprint,
              });
              lastSeenVersionRef.current = fingerprint;

              await requestUpdateCheck();

              // If we still don't have a waiting SW (some browsers delay it), hard reload once.
              if (!registration?.waiting) {
                sessionStorage.setItem(PWA_UPDATE_FLAG, "1");
                setTimeout(() => window.location.reload(), 600);
              }
            }
          } catch {
            // ignore
          }
        };

        // ULTRA-AGGRESSIVE update checks - every 10 seconds for fastest detection
        const interval = window.setInterval(requestUpdateCheck, 10 * 1000);
        const versionInterval = window.setInterval(pollVersionJson, 10 * 1000);

        // Check IMMEDIATELY on page load
        setTimeout(requestUpdateCheck, 1000);
        setTimeout(requestUpdateCheck, 3000);
        setTimeout(pollVersionJson, 1200);

        // Check immediately on visibility change (no debounce for faster detection)
        const onVisible = () => {
          if (document.visibilityState === "visible") {
            requestUpdateCheck();
          }
        };

        // Listen to all triggers for immediate update detection
        window.addEventListener("focus", requestUpdateCheck);
        window.addEventListener("online", requestUpdateCheck);
        document.addEventListener("visibilitychange", onVisible);

        // Also check when page becomes interactive again
        window.addEventListener("pageshow", requestUpdateCheck);
        
        // Check on any user interaction (first touch/click)
        const onFirstInteraction = () => {
          requestUpdateCheck();
          window.removeEventListener("touchstart", onFirstInteraction);
          window.removeEventListener("click", onFirstInteraction);
        };
        window.addEventListener("touchstart", onFirstInteraction, { once: true, passive: true });
        window.addEventListener("click", onFirstInteraction, { once: true });

        return () => {
          window.clearInterval(interval);
          window.clearInterval(versionInterval);
          window.removeEventListener("focus", requestUpdateCheck);
          window.removeEventListener("online", requestUpdateCheck);
          document.removeEventListener("visibilitychange", onVisible);
          window.removeEventListener("pageshow", requestUpdateCheck);
          window.removeEventListener("touchstart", onFirstInteraction);
          window.removeEventListener("click", onFirstInteraction);
        };
      },
      onNeedRefresh: () => {
        console.log("[PWA Update] 🔔 onNeedRefresh triggered! Auto-applying...");
        applyUpdateAutomatically();
      },
      onRegisterError: (error) => {
        console.error("[PWA Update] ❌ SW register error:", error);
      },
    });

    // Fallback: if the browser already has a waiting worker but callbacks didn't fire yet.
    navigator.serviceWorker.getRegistration().then((reg) => {
      console.log("[PWA Update] Existing registration check:", {
        hasRegistration: !!reg,
        waiting: !!reg?.waiting,
        active: reg?.active?.state,
      });
      if (reg?.waiting) {
        registrationRef.current = reg;
        applyUpdateAutomatically();
      }
    });

    // Fallback reload when the new SW takes control.
    const onControllerChange = () => {
      console.log("[PWA Update] Controller changed, setting flag and reloading...");
      sessionStorage.setItem(PWA_UPDATE_FLAG, "1");
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  // Silent mode - no UI rendered
  return null;
}
