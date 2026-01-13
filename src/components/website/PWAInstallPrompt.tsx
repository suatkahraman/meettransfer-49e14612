import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone, Share, Plus, Sparkles, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";

/**
 * Shows a beautiful install prompt for PWA installation.
 * - Chromium browsers: Native install prompt
 * - iOS Safari: Manual instructions
 * - Already installed or dismissed: Hidden
 */
export function PWAInstallPrompt() {
  const { language } = useLanguage();
  const { canInstall, isInstalled, isStandalone, isIOS, promptInstall, getInstallInstructions } = usePWAInstall();
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage for dismissal
  useEffect(() => {
    const dismissedAt = localStorage.getItem("pwa_install_dismissed");
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  // Show prompt after 5 seconds if can install and not dismissed
  useEffect(() => {
    if (isInstalled || isStandalone || dismissed) return;
    
    const timer = setTimeout(() => {
      if (canInstall || isIOS) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, isStandalone, isIOS, dismissed]);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    const success = await promptInstall();
    if (success) {
      setShowPrompt(false);
    }
  }, [isIOS, promptInstall]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    setDismissed(true);
    localStorage.setItem("pwa_install_dismissed", Date.now().toString());
  }, []);

  const handleLater = useCallback(() => {
    setShowPrompt(false);
    // Show again in 1 hour
    setTimeout(() => {
      if (!dismissed) setShowPrompt(true);
    }, 60 * 60 * 1000);
  }, [dismissed]);

  const texts = {
    title: {
      TR: "Uygulamayı Yükle",
      EN: "Install Our App",
      DE: "App installieren",
      FR: "Installer l'application",
    }[language] ?? "Install Our App",
    subtitle: {
      TR: "Hızlı erişim ve bildirimler için",
      EN: "For quick access & notifications",
      DE: "Für schnellen Zugriff & Benachrichtigungen",
      FR: "Pour un accès rapide et des notifications",
    }[language] ?? "For quick access & notifications",
    benefits: {
      TR: ["Anında bildirimler", "Offline erişim", "Hızlı açılış"],
      EN: ["Instant notifications", "Offline access", "Quick launch"],
      DE: ["Sofortige Benachrichtigungen", "Offline-Zugriff", "Schnellstart"],
      FR: ["Notifications instantanées", "Accès hors ligne", "Lancement rapide"],
    }[language] ?? ["Instant notifications", "Offline access", "Quick launch"],
    installBtn: {
      TR: "Yükle",
      EN: "Install",
      DE: "Installieren",
      FR: "Installer",
    }[language] ?? "Install",
    laterBtn: {
      TR: "Daha Sonra",
      EN: "Later",
      DE: "Später",
      FR: "Plus tard",
    }[language] ?? "Later",
    iosTitle: {
      TR: "Ana Ekrana Ekle",
      EN: "Add to Home Screen",
      DE: "Zum Startbildschirm hinzufügen",
      FR: "Ajouter à l'écran d'accueil",
    }[language] ?? "Add to Home Screen",
    gotIt: {
      TR: "Anladım",
      EN: "Got it",
      DE: "Verstanden",
      FR: "Compris",
    }[language] ?? "Got it",
  };

  const instructions = getInstallInstructions();

  // Don't render if already installed or no install capability
  if (isInstalled || isStandalone || (!canInstall && !isIOS)) return null;

  return (
    <AnimatePresence>
      {showPrompt && !showIOSInstructions && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-[9998] md:left-auto md:right-6 md:max-w-sm"
        >
          <div className="bg-gradient-to-br from-card via-card to-muted border border-border rounded-3xl shadow-2xl overflow-hidden">
            {/* Animated gradient bar */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
            
            <div className="p-5">
              {/* Header with dismiss */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* App icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Smartphone className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                      {texts.title}
                      <Sparkles className="h-4 w-4 text-accent" />
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {texts.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-full hover:bg-muted/80 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Benefits */}
              <div className="flex flex-wrap gap-2 mb-4">
                {texts.benefits.map((benefit, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full"
                  >
                    <Star className="h-3 w-3 text-primary fill-primary" />
                    <span className="text-xs font-medium text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleLater}
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  {texts.laterBtn}
                </Button>
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <Download className="h-4 w-4" />
                  {texts.installBtn}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="bg-card rounded-t-3xl md:rounded-3xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Share className="h-5 w-5 text-primary" />
                  {texts.iosTitle}
                </h3>
                <button
                  onClick={handleDismiss}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {instructions.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {i === 0 && <Share className="h-4 w-4 text-primary" />}
                      {i === 1 && <Plus className="h-4 w-4 text-primary" />}
                      {i === 2 && <Download className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm text-foreground">{step}</p>
                    </div>
                  </div>
                ))}
              </div>

              {instructions.note && (
                <p className="mt-4 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {instructions.note}
                </p>
              )}

              <Button
                onClick={handleDismiss}
                className="w-full mt-6"
                variant="outline"
              >
                {texts.gotIt}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
