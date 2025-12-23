import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { canInstall, isInstalled, isStandalone, isIOS, promptInstall } = usePWAInstall();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Don't show if already installed or running in standalone mode
  if (isInstalled || isStandalone) {
    return null;
  }

  const handleClick = async () => {
    if (canInstall) {
      // Native install prompt available (Android/Desktop Chrome)
      await promptInstall();
    } else {
      // Redirect to install page for iOS or other browsers
      navigate("/install");
    }
  };

  const buttonLabel = t("installApp") || "Install App";

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`gap-2 ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {showIcon && (isIOS ? <Smartphone className="h-4 w-4" /> : <Download className="h-4 w-4" />)}
      {buttonLabel}
    </Button>
  );
}
