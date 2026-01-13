import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { registerSW } from "virtual:pwa-register";

/**
 * Registers the PWA service worker (vite-plugin-pwa, registerType=prompt)
 * and shows an in-app prompt when a new version is available.
 */
export function PWAUpdatePrompt() {
  const { language } = useLanguage();
  const [showPrompt, setShowPrompt] = useState(false);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Register SW once.
    updateSWRef.current = registerSW({
      immediate: true,
      onRegisteredSW: (_swUrl, registration) => {
        registrationRef.current = registration ?? null;

        // If there's already a waiting worker (e.g. user kept an old tab open), show immediately.
        if (registration?.waiting) setShowPrompt(true);

        const requestUpdateCheck = async () => {
          try {
            await registration?.update();
            if (registration?.waiting) setShowPrompt(true);
          } catch {
            // ignore
          }
        };

        // Aggressive update checks
        requestUpdateCheck();
        const interval = window.setInterval(requestUpdateCheck, 30_000);

        const onVisible = () => {
          if (document.visibilityState === "visible") requestUpdateCheck();
        };

        window.addEventListener("focus", requestUpdateCheck);
        window.addEventListener("online", requestUpdateCheck);
        document.addEventListener("visibilitychange", onVisible);

        return () => {
          window.clearInterval(interval);
          window.removeEventListener("focus", requestUpdateCheck);
          window.removeEventListener("online", requestUpdateCheck);
          document.removeEventListener("visibilitychange", onVisible);
        };
      },
      onNeedRefresh: () => {
        setShowPrompt(true);
      },
      onRegisterError: (error) => {
        console.log("[PWA Update] SW register error:", error);
      },
    });

    // Fallback: if the browser already has a waiting worker but callbacks didn't fire yet.
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) setShowPrompt(true);
    });

    // Fallback reload when the new SW takes control.
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const handleUpdate = useCallback(() => {
    const updateSW = updateSWRef.current;
    const waiting = registrationRef.current?.waiting;

    // Preferred flow (vite-plugin-pwa helper)
    if (updateSW) {
      void updateSW(true);
      setShowPrompt(false);
      return;
    }

    // Hard fallback
    if (waiting) {
      waiting.postMessage({ type: "SKIP_WAITING" });
      setShowPrompt(false);
      return;
    }

    window.location.reload();
  }, []);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    // If user dismisses, remind later if still waiting.
    window.setTimeout(() => {
      if (registrationRef.current?.waiting) setShowPrompt(true);
    }, 5 * 60 * 1000);
  }, []);

  const texts = {
    title: language === "TR" ? "Yeni Sürüm Hazır!" : "New Version Available!",
    description: language === "TR" 
      ? "Daha iyi deneyim için güncelleyin" 
      : "Update for a better experience",
    updateBtn: language === "TR" ? "Şimdi Güncelle" : "Update Now",
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 z-[9999] md:left-auto md:right-6 md:max-w-sm"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Gradient accent bar */}
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground">
                    {texts.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {texts.description}
                  </p>
                </div>
                
                {/* Dismiss button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              {/* Update button */}
              <Button
                onClick={handleUpdate}
                className="w-full mt-3 gap-2"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
                {texts.updateBtn}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
