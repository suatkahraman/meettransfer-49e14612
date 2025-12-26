import { useState } from "react";
import { Download, Smartphone, ExternalLink, Sparkles, Loader2 } from "lucide-react";
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
  const { canInstall, isInstalled, isStandalone, isIOS, isAndroid, promptInstall, deferredPrompt } = usePWAInstall();
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
    console.log('[InstallAppButton] Click:', { canInstall, isIOS, isAndroid, isStandalone, deferredPrompt: !!deferredPrompt });
    
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
        // iOS - show modal with instructions
        console.log('[InstallAppButton] Opening iOS modal');
        setShowIOSModal(true);
      } else if (isAndroid) {
        // Android - try to trigger install or show toast
        console.log('[InstallAppButton] Android - showing install instructions');
        toast.info(
          language === 'TR' ? 'Uygulamayı Yükle' : 'Install App',
          {
            description: language === 'TR'
              ? 'Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullanın'
              : 'Use "Add to Home Screen" from browser menu',
            duration: 5000,
          }
        );
        navigate("/install");
      } else {
        // Desktop fallback - show helpful toast
        console.log('[InstallAppButton] Desktop fallback');
        toast.info(
          language === 'TR' ? 'Uygulamayı Yükle' : 'Install App',
          {
            description: language === 'TR'
              ? 'Tarayıcı adres çubuğundaki yükleme simgesine tıklayın'
              : 'Click the install icon in your browser address bar',
            duration: 5000,
          }
        );
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
      : (t("installApp") || "Install App");

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
    "border-0",
    animated && !isInstalling && "animate-pulse"
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
