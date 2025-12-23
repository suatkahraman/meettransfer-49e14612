import { useState } from "react";
import { Download, Smartphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { IOSInstallModal } from "./IOSInstallModal";

interface InstallAppButtonProps {
  variant?: "default" | "ghost" | "outline" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export function InstallAppButton({
  variant = "ghost",
  size = "sm",
  showIcon = true,
  className = "",
  fullWidth = false,
}: InstallAppButtonProps) {
  const { canInstall, isInstalled, isStandalone, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Don't show if already running in standalone mode (app is open)
  if (isStandalone) {
    return null;
  }

  const handleClick = async () => {
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
      // iOS - show modal with instructions
      setShowIOSModal(true);
    } else if (isAndroid) {
      // Android without install prompt - show instructions page
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

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={`gap-2 ${fullWidth ? "w-full" : ""} ${className}`}
      >
        {showIcon && icon}
        {buttonLabel}
      </Button>

      <IOSInstallModal open={showIOSModal} onOpenChange={setShowIOSModal} />
    </>
  );
}
