import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Listens for service worker updates and shows a prompt to reload the app.
 * Works with vite-plugin-pwa's "prompt" registerType.
 */
export function PWAUpdatePrompt() {
  const { language } = useLanguage();
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Check for waiting service worker on mount and listen for updates
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const checkForUpdates = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const reg of registrations) {
          // If there's a waiting worker, show prompt immediately
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setShowPrompt(true);
            return;
          }

          // Listen for future updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content is available
                setWaitingWorker(newWorker);
                setShowPrompt(true);
              }
            });
          });
        }

        // Listen for controllerchange (when new SW takes over)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // Reload when new SW activates
          window.location.reload();
        });
      } catch (error) {
        console.log("[PWA Update] Error checking for updates:", error);
      }
    };

    // Check immediately and periodically
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = useCallback(() => {
    if (!waitingWorker) {
      // Fallback: just reload
      window.location.reload();
      return;
    }

    // Tell the waiting worker to skip waiting and activate
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    
    // The controllerchange event will trigger a reload
    setShowPrompt(false);
  }, [waitingWorker]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    // Show again after 5 minutes if still not updated
    setTimeout(() => {
      if (waitingWorker) {
        setShowPrompt(true);
      }
    }, 5 * 60 * 1000);
  }, [waitingWorker]);

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
