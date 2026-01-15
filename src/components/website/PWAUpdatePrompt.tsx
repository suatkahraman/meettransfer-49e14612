import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X, Sparkles, Rocket, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { registerSW } from "virtual:pwa-register";

interface VersionInfo {
  version: string;
  releaseDate: string;
  notes: {
    TR: string;
    EN: string;
    DE: string;
    FR: string;
  };
}

/**
 * Registers the PWA service worker (vite-plugin-pwa, registerType=prompt)
 * and shows a glassmorphism in-app prompt when a new version is available.
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

// We dedupe prompts by the waiting service worker script URL.
// This avoids getting stuck on an old cached version when multiple updates happen.

export function PWAUpdatePrompt() {
  const { language } = useLanguage();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const lastPromptedSwUrlRef = useRef<string | null>(null);
  const lastSeenVersionRef = useRef<string | null>(null);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    // Skip in preview/development environments
    if (isPreviewEnvironment()) {
      console.log("[PWA Update] Skipping in preview environment:", window.location.hostname);
      return;
    }

    console.log("[PWA Update] Initializing on production:", window.location.hostname);

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

        // If there's already a waiting worker (e.g. user kept an old tab open), auto-apply immediately.
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
            const v = (await res.json()) as any;
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
      console.log("[PWA Update] Controller changed, reloading...");
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);
    const registration = registrationRef.current;
    const updateSW = updateSWRef.current;

    try {
      // CRITICAL: Check for ALL pending updates before applying
      // This ensures we skip to the LATEST version, not an intermediate one
      console.log("[PWA Update] 🔄 Fetching all pending updates...");
      
      // Force update check to get the absolute latest SW
      await registration?.update();
      
      // Wait a moment for any new SW to be detected
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check again in case there's an even newer version
      await registration?.update();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Now get the latest waiting worker (this should be the most recent version)
      const latestWaiting = registration?.waiting;
      console.log("[PWA Update] ✅ Applying LATEST update:", {
        scriptURL: latestWaiting?.scriptURL,
        state: latestWaiting?.state
      });

      // Preferred flow (vite-plugin-pwa helper) - this will skip to the latest SW
      if (updateSW) {
        console.log("[PWA Update] Using updateSW helper");
        void updateSW(true);
        setShowPrompt(false);
        return;
      }

      // Hard fallback - tell the waiting SW to take over
      if (latestWaiting) {
        console.log("[PWA Update] Using SKIP_WAITING message");
        latestWaiting.postMessage({ type: "SKIP_WAITING" });
        setShowPrompt(false);
        return;
      }

      // Final fallback - just reload
      console.log("[PWA Update] Using hard reload fallback");
      window.location.reload();
    } catch (error) {
      console.error("[PWA Update] Error during update:", error);
      // Even on error, try to apply whatever update is available
      if (updateSW) {
        void updateSW(true);
      } else {
        window.location.reload();
      }
      setShowPrompt(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    // If user dismisses, remind later if still waiting.
    window.setTimeout(() => {
      if (registrationRef.current?.waiting) setShowPrompt(true);
    }, 5 * 60 * 1000);
  }, []);

  const texts = {
    title: {
      TR: "Yeni Sürüm Hazır!",
      EN: "New Version Available!",
      DE: "Neue Version verfügbar!",
      FR: "Nouvelle version disponible !",
      RU: "Доступна новая версия!",
      IT: "Nuova versione disponibile!",
      ES: "¡Nueva versión disponible!",
      AR: "إصدار جديد متاح!",
      UK: "Доступна нова версія!",
      JA: "新しいバージョンが利用可能です！",
    }[language] ?? "New Version Available!",
    description: {
      TR: "Daha iyi deneyim için güncelleyin",
      EN: "Update for a better experience",
      DE: "Aktualisieren Sie für ein besseres Erlebnis",
      FR: "Mettez à jour pour une meilleure expérience",
      RU: "Обновите для лучшего опыта",
      IT: "Aggiorna per un'esperienza migliore",
      ES: "Actualiza para una mejor experiencia",
      AR: "قم بالتحديث للحصول على تجربة أفضل",
      UK: "Оновіть для кращого досвіду",
      JA: "より良い体験のためにアップデート",
    }[language] ?? "Update for a better experience",
    updateBtn: {
      TR: "Şimdi Güncelle",
      EN: "Update Now",
      DE: "Jetzt aktualisieren",
      FR: "Mettre à jour",
      RU: "Обновить сейчас",
      IT: "Aggiorna ora",
      ES: "Actualizar ahora",
      AR: "تحديث الآن",
      UK: "Оновити зараз",
      JA: "今すぐ更新",
    }[language] ?? "Update Now",
    updating: {
      TR: "Güncelleniyor...",
      EN: "Updating...",
      DE: "Aktualisieren...",
      FR: "Mise à jour...",
      RU: "Обновление...",
      IT: "Aggiornamento...",
      ES: "Actualizando...",
      AR: "جاري التحديث...",
      UK: "Оновлення...",
      JA: "更新中...",
    }[language] ?? "Updating...",
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 22,
            mass: 0.8
          }}
          className="fixed bottom-20 left-4 right-4 z-[9999] md:left-auto md:right-6 md:max-w-sm"
        >
          {/* Glassmorphism card */}
          <motion.div 
            className="relative backdrop-blur-xl bg-card/80 border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Animated gradient glow behind card */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 blur-xl opacity-60" />
            
            {/* Top gradient accent with animation */}
            <motion.div 
              className="h-1 bg-gradient-to-r from-accent via-primary to-accent"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ backgroundSize: "200% 100%" }}
            />
            
            <div className="relative p-4">
              {/* Floating particles */}
              <motion.div 
                className="absolute top-2 right-10 w-2 h-2 rounded-full bg-accent/50"
                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div 
                className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-primary/60"
                animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
              
              <div className="flex items-start gap-3">
                {/* Icon with glow and pulse */}
                <motion.div 
                  className="relative flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 backdrop-blur-sm border border-white/10 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/30 to-primary/30 blur-md" />
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Rocket className="relative h-6 w-6 text-primary" />
                  </motion.div>
                </motion.div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    {texts.title}
                    {versionInfo && (
                      <span className="text-xs font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        v{versionInfo.version}
                      </span>
                    )}
                    <motion.div
                      animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="h-4 w-4 text-accent" />
                    </motion.div>
                  </h4>
                  
                  {/* Version notes */}
                  {versionInfo && (
                    <p className="text-xs text-foreground/80 mt-1 line-clamp-2">
                      {versionInfo.notes[language as keyof typeof versionInfo.notes] || versionInfo.notes.EN}
                    </p>
                  )}
                  
                  {/* Release date */}
                  {versionInfo && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(versionInfo.releaseDate).toLocaleDateString(
                        language === 'TR' ? 'tr-TR' : language === 'DE' ? 'de-DE' : language === 'FR' ? 'fr-FR' : 'en-US',
                        { day: 'numeric', month: 'long', year: 'numeric' }
                      )}
                    </p>
                  )}
                  
                  {!versionInfo && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {texts.description}
                    </p>
                  )}
                </div>
                
                {/* Dismiss button */}
                <motion.button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              </div>
              
              {/* Update button with hover effects */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full mt-4 gap-2 bg-gradient-to-r from-accent via-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25"
                  size="sm"
                  style={{ backgroundSize: "200% 100%" }}
                >
                  <motion.div
                    animate={isUpdating ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: isUpdating ? Infinity : 0, ease: "linear" }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                  {isUpdating ? texts.updating : texts.updateBtn}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}