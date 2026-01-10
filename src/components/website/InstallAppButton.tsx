import { useState } from "react";
import { Download, Smartphone, ExternalLink, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { IOSInstallModal } from "./IOSInstallModal";
import { cn } from "@/lib/utils";

interface InstallAppButtonProps {
  variant?: "default" | "ghost" | "outline" | "accent" | "premium" | "prominent";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  className?: string;
  fullWidth?: boolean;
  animated?: boolean;
}

export function InstallAppButton({
  variant = "ghost",
  size = "sm",
  showIcon = true,
  className = "",
  fullWidth = false,
  animated = false,
}: InstallAppButtonProps) {
  const { 
    canInstall, 
    isInstalled, 
    isStandalone, 
    isIOS, 
    isAndroid, 
    promptInstall, 
    deferredPrompt,
    browserInfo 
  } = usePWAInstall();
  
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Don't show if already running in standalone mode (app is open)
  if (isStandalone) {
    return null;
  }

  const handleClick = async () => {
    console.log('[InstallAppButton] Click:', { 
      canInstall, 
      isIOS, 
      isAndroid, 
      isStandalone, 
      deferredPrompt: !!deferredPrompt,
      browser: browserInfo?.name 
    });
    
    // Show loading state
    setIsInstalling(true);
    
    try {
      if (canInstall && deferredPrompt) {
        // Native install prompt available - trigger immediately
        console.log('[InstallAppButton] Triggering native install prompt...');
        const installed = await promptInstall();
        
        if (installed) {
          toast.success(
            language === 'TR' ? 'Uygulama kuruldu!' : 'App installed!',
            {
              description: language === 'TR' 
                ? 'Artık ana ekranınızdan erişebilirsiniz' 
                : 'You can now access it from your home screen'
            }
          );
        } else {
          toast.info(
            language === 'TR' ? 'Yükleme iptal edildi' : 'Installation cancelled',
            {
              description: language === 'TR'
                ? 'İstediğiniz zaman tekrar deneyebilirsiniz'
                : 'You can try again anytime'
            }
          );
        }
      } else if (isIOS) {
        // iOS - check if Safari
        if (browserInfo?.name === 'Safari') {
          console.log('[InstallAppButton] Opening iOS modal');
          setShowIOSModal(true);
        } else {
          // Not Safari on iOS - show warning
          toast.warning(
            language === 'TR' ? 'Safari Gerekli' : 'Safari Required',
            {
              description: language === 'TR'
                ? 'iOS\'ta uygulamayı yüklemek için Safari tarayıcısını kullanın'
                : 'Use Safari browser to install the app on iOS',
              duration: 5000,
            }
          );
          navigate("/install");
        }
      } else if (isAndroid) {
        // Android - show install page with instructions
        console.log('[InstallAppButton] Android - navigating to install page');
        
        if (!browserInfo?.isSupported) {
          toast.warning(
            language === 'TR' ? 'Tarayıcı Uyarısı' : 'Browser Warning',
            {
              description: browserInfo?.instructions || (language === 'TR'
                ? 'Bu tarayıcı PWA desteği sınırlı. Chrome kullanmanızı öneririz.'
                : 'This browser has limited PWA support. We recommend using Chrome.'),
              duration: 5000,
            }
          );
        } else {
          toast.info(
            language === 'TR' ? 'Uygulamayı Yükle' : 'Install App',
            {
              description: language === 'TR'
                ? 'Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullanın'
                : 'Use "Add to Home Screen" from browser menu',
              duration: 5000,
            }
          );
        }
        navigate("/install");
      } else {
        // Desktop fallback
        console.log('[InstallAppButton] Desktop fallback');
        
        if (browserInfo?.name === 'Firefox') {
          toast.info(
            language === 'TR' ? 'Firefox Desteği Sınırlı' : 'Limited Firefox Support',
            {
              description: language === 'TR'
                ? 'Firefox masaüstünde PWA desteği sınırlıdır. Chrome veya Edge kullanmanızı öneririz.'
                : 'Firefox has limited PWA support on desktop. We recommend Chrome or Edge.',
              duration: 6000,
            }
          );
        } else {
          toast.info(
            language === 'TR' ? 'Uygulamayı Yükle' : 'Install App',
            {
              description: language === 'TR'
                ? 'Tarayıcı adres çubuğundaki yükleme simgesine tıklayın'
                : 'Click the install icon in your browser address bar',
              duration: 5000,
            }
          );
        }
        navigate("/install");
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const buttonLabel = isInstalling
    ? (language === 'TR' ? 'Yükleniyor...' : 'Installing...')
    : isInstalled 
      ? (language === 'TR' ? 'Uygulamayı Aç' : 'Open App')
      : (t("installApp") || (language === 'TR' ? 'Uygulamayı Yükle' : 'Install App'));

  const icon = isInstalling
    ? <Loader2 className="h-4 w-4 animate-spin" />
    : isInstalled 
      ? <ExternalLink className="h-4 w-4" />
      : (isIOS ? <Smartphone className="h-4 w-4" /> : <Download className="h-4 w-4" />);

  // Prominent variant styling
  const isProminent = variant === "prominent";
  
  const prominentStyles = isProminent ? cn(
    "relative overflow-hidden",
    "bg-gradient-to-r from-primary via-primary/90 to-primary/80",
    "text-primary-foreground font-semibold",
    "shadow-lg shadow-primary/25",
    "hover:shadow-xl hover:shadow-primary/30",
    "hover:scale-105 active:scale-100",
    "transition-all duration-300 ease-out",
    "border-0"
  ) : "";

  return (
    <>
      <Button
        variant={isProminent ? "default" : variant}
        size={size}
        onClick={handleClick}
        disabled={isInstalling}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "gap-2",
          fullWidth && "w-full",
          prominentStyles,
          className
        )}
      >
        {/* Shimmer effect for prominent variant */}
        {isProminent && !isInstalling && (
          <span 
            className={cn(
              "absolute inset-0 -translate-x-full",
              "bg-gradient-to-r from-transparent via-white/20 to-transparent",
              "transition-transform duration-1000",
              isHovered && "translate-x-full"
            )}
          />
        )}
        
        {showIcon && (
          <span className={cn(
            "transition-transform duration-300",
            isProminent && isHovered && !isInstalling && "scale-110 -rotate-12"
          )}>
            {isProminent && !isInstalled && !isInstalling ? <Sparkles className="h-4 w-4" /> : icon}
          </span>
        )}
        <span className="relative z-10">{buttonLabel}</span>
      </Button>

      <IOSInstallModal open={showIOSModal} onOpenChange={setShowIOSModal} />
    </>
  );
}
