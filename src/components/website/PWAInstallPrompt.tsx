import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone, Share, Plus, Sparkles, Star, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";

/**
 * Shows a beautiful glassmorphism install prompt for PWA installation.
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
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            mass: 0.8
          }}
          className="fixed bottom-24 left-4 right-4 z-[9998] md:left-auto md:right-6 md:max-w-sm"
        >
          {/* Glassmorphism card */}
          <motion.div 
            className="relative backdrop-blur-xl bg-card/80 border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Animated gradient border glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl opacity-60" />
            
            {/* Top gradient accent with animation */}
            <motion.div 
              className="h-1 bg-gradient-to-r from-primary via-accent to-primary"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ backgroundSize: "200% 100%" }}
            />
            
            <div className="relative p-5">
              {/* Floating particles effect */}
              <div className="absolute top-3 right-12 w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
              <div className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-accent/50 animate-pulse delay-300" />
              
              {/* Header with dismiss */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* App icon with glow */}
                  <motion.div 
                    className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent blur-md opacity-50" />
                    <Smartphone className="relative h-7 w-7 text-primary-foreground" />
                  </motion.div>
                  <div>
                    <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                      {texts.title}
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="h-4 w-4 text-accent" />
                      </motion.div>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {texts.subtitle}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Benefits with staggered animation */}
              <div className="flex flex-wrap gap-2 mb-4">
                {texts.benefits.map((benefit, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i, duration: 0.3 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10"
                  >
                    <Star className="h-3 w-3 text-primary fill-primary" />
                    <span className="text-xs font-medium text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* Action buttons with hover effects */}
              <div className="flex gap-2">
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleLater}
                    variant="ghost"
                    size="sm"
                    className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10"
                  >
                    {texts.laterBtn}
                  </Button>
                </motion.div>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25"
                  >
                    <Download className="h-4 w-4" />
                    {texts.installBtn}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* iOS Instructions Modal with glassmorphism */}
      {showIOSInstructions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-md flex items-end md:items-center justify-center p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              mass: 0.8
            }}
            className="relative backdrop-blur-xl bg-card/90 border border-white/20 rounded-t-3xl md:rounded-3xl w-full max-w-md overflow-hidden shadow-[0_-8px_32px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            
            {/* Header gradient */}
            <motion.div 
              className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 100%" }}
            />
            
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                    whileHover={{ rotate: 10 }}
                  >
                    <Share className="h-5 w-5 text-primary" />
                  </motion.div>
                  {texts.iosTitle}
                </h3>
                <motion.button
                  onClick={handleDismiss}
                  className="p-2 rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Steps with staggered animation */}
              <div className="space-y-4">
                {instructions.steps.map((step, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i, duration: 0.4 }}
                  >
                    <motion.div 
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-white/10 flex items-center justify-center flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                    >
                      {i === 0 && <Share className="h-5 w-5 text-primary" />}
                      {i === 1 && <Plus className="h-5 w-5 text-primary" />}
                      {i === 2 && <Zap className="h-5 w-5 text-primary" />}
                    </motion.div>
                    <div className="flex-1 pt-2">
                      <p className="text-sm text-foreground leading-relaxed">{step}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {instructions.note && (
                <motion.p 
                  className="mt-5 text-xs text-muted-foreground bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {instructions.note}
                </motion.p>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleDismiss}
                  className="w-full mt-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25"
                >
                  {texts.gotIt}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}