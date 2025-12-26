import { useState } from "react";
import { Download, Smartphone, ExternalLink, Sparkles } from "lucide-react";
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
  const { canInstall, isInstalled, isStandalone, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Don't show if already running in standalone mode (app is open)
  if (isStandalone) {
    return null;
  }

  const handleClick = async () => {
    console.log('[InstallAppButton] Click:', { canInstall, isIOS, isAndroid, isStandalone });
    
    if (canInstall) {
      // Native install prompt available (Android/Desktop Chrome)
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
      }
    } else if (isIOS) {
      // iOS - show modal with instructions (iOS doesn't support beforeinstallprompt)
      console.log('[InstallAppButton] Opening iOS modal');
      setShowIOSModal(true);
    } else if (isAndroid) {
      // Android without install prompt - show instructions page
      console.log('[InstallAppButton] Navigating to /install for Android');
      navigate("/install");
    } else {
      // Desktop fallback
      navigate("/install");
    }
  };

  const buttonLabel = isInstalled 
    ? (language === 'TR' ? 'Uygulamayı Aç' : 'Open App')
    : (t("installApp") || "Install App");

  const icon = isInstalled 
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
    animated && "animate-pulse"
  ) : "";

  return (
    <>
      <Button
        variant={isProminent ? "default" : variant}
        size={size}
        onClick={handleClick}
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
        {isProminent && (
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
            isProminent && isHovered && "scale-110 -rotate-12"
          )}>
            {isProminent && !isInstalled ? <Sparkles className="h-4 w-4" /> : icon}
          </span>
        )}
        <span className="relative z-10">{buttonLabel}</span>
      </Button>

      <IOSInstallModal open={showIOSModal} onOpenChange={setShowIOSModal} />
    </>
  );
}
