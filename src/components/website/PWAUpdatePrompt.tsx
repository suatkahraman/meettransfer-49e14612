import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X, Sparkles, Rocket } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { registerSW } from "virtual:pwa-register";

/**
 * Registers the PWA service worker (vite-plugin-pwa, registerType=prompt)
 * and shows a glassmorphism in-app prompt when a new version is available.
 */
export function PWAUpdatePrompt() {
  const { language } = useLanguage();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
    setIsUpdating(true);
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
    title: {
      TR: "Yeni Sürüm Hazır!",
      EN: "New Version Available!",
      DE: "Neue Version verfügbar!",
      FR: "Nouvelle version disponible !",
    }[language] ?? "New Version Available!",
    description: {
      TR: "Daha iyi deneyim için güncelleyin",
      EN: "Update for a better experience",
      DE: "Aktualisieren Sie für ein besseres Erlebnis",
      FR: "Mettez à jour pour une meilleure expérience",
    }[language] ?? "Update for a better experience",
    updateBtn: {
      TR: "Şimdi Güncelle",
      EN: "Update Now",
      DE: "Jetzt aktualisieren",
      FR: "Mettre à jour",
    }[language] ?? "Update Now",
    updating: {
      TR: "Güncelleniyor...",
      EN: "Updating...",
      DE: "Aktualisieren...",
      FR: "Mise à jour...",
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
                    <motion.div
                      animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="h-4 w-4 text-accent" />
                    </motion.div>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {texts.description}
                  </p>
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