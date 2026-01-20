import { useState, useEffect } from "react";
import { X, Download, Share, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import logo from "@/assets/meet-transfer-logo.webp";

const BANNER_DISMISSED_KEY = "pwa-banner-dismissed";
const BANNER_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallBanner() {
  const { canInstall, isInstalled, isStandalone, isIOS, promptInstall, browserInfo } = usePWAInstall();
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  const isTurkish = language === 'TR';

  useEffect(() => {
    // Don't show if already installed or in standalone mode
    if (isStandalone || isInstalled) {
      setIsVisible(false);
      return;
    }

    // Check if user dismissed the banner recently
    const dismissedAt = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < BANNER_DISMISS_DURATION) {
        return;
      }
    }

    // Show banner after a short delay for better UX
    const timer = setTimeout(() => {
      // Show on iOS Safari or when native install is available
      if ((isIOS && browserInfo?.name === 'Safari') || canInstall) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isIOS, canInstall, isStandalone, isInstalled, browserInfo]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
  };

  const handleInstall = async () => {
    if (canInstall) {
      const installed = await promptInstall();
      if (installed) {
        toast.success(
          isTurkish ? 'Uygulama kuruldu!' : 'App installed!',
          {
            description: isTurkish 
              ? 'Ana ekranınızdan erişebilirsiniz' 
              : 'Access it from your home screen'
          }
        );
        setIsVisible(false);
      }
    } else if (isIOS) {
      if (browserInfo?.name === 'Safari') {
        setShowIOSSteps(true);
      } else {
        // Not Safari - show warning toast
        toast.warning(
          isTurkish ? 'Safari Gerekli' : 'Safari Required',
          {
            description: isTurkish
              ? 'iOS\'ta uygulamayı yüklemek için Safari tarayıcısını kullanın'
              : 'Use Safari browser to install the app on iOS',
            duration: 5000,
          }
        );
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-3 animate-fade-in safe-area-pb">
      <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* iOS Steps Panel */}
        {showIOSSteps && isIOS ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">
                {isTurkish ? 'Uygulamayı Yükle' : 'Install App'}
              </h4>
              <button 
                onClick={() => setShowIOSSteps(false)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            
            {/* Safari check */}
            {browserInfo?.name !== 'Safari' && (
              <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg text-amber-600 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{isTurkish ? 'Safari tarayıcısı gerekli' : 'Safari browser required'}</span>
              </div>
            )}
            
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  1
                </div>
                <div className="flex items-center gap-1.5">
                  <span>{isTurkish ? 'Safari\'de' : 'In Safari, tap'}</span>
                  <Share className="h-4 w-4 text-accent" />
                  <span>{isTurkish ? 'butonuna dokunun' : 'Share'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  2
                </div>
                <div className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-accent" />
                  <span>{isTurkish ? '"Ana Ekrana Ekle" seçin' : '"Add to Home Screen"'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  3
                </div>
                <span>{isTurkish ? '"Ekle" butonuna dokunun' : 'Tap "Add"'}</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDismiss}
              className="w-full mt-2"
            >
              {isTurkish ? 'Anladım' : 'Got it'}
            </Button>
          </div>
        ) : (
          /* Main Banner */
          <div className="flex items-center gap-3 p-3">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-border shrink-0 shadow-md">
              <img src={logo} alt="Meet Transfer" className="w-full h-full object-cover" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">Meet Transfer</h4>
              <p className="text-xs text-muted-foreground truncate">
                {isTurkish 
                  ? 'Uygulamayı ana ekrana ekle' 
                  : 'Add app to home screen'}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleDismiss}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
              
              <Button 
                variant="accent" 
                size="sm"
                onClick={handleInstall}
                className="gap-1.5 rounded-xl font-medium px-4"
              >
                {isIOS ? (
                  <>
                    <Share className="h-4 w-4" />
                    {isTurkish ? 'Yükle' : 'Install'}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {isTurkish ? 'Yükle' : 'Install'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
