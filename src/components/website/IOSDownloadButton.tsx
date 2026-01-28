import { useState } from "react";
import { Download, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";
import { IOSInstallModal } from "./IOSInstallModal";
import { cn } from "@/lib/utils";

/**
 * iOS-specific download button that appears only on iOS devices.
 * Clicking immediately opens the install instructions modal.
 */
export function IOSDownloadButton() {
  const { isIOS, isInstalled, isStandalone } = usePWAInstall();
  const { language } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  // Only show on iOS devices that haven't installed the app
  if (!isIOS || isInstalled || isStandalone) {
    return null;
  }

  const buttonText: Record<string, string> = {
    EN: "Download App",
    TR: "Uygulamayı İndir",
    DE: "App Herunterladen",
    FR: "Télécharger",
    ES: "Descargar App",
    IT: "Scarica App",
    RU: "Скачать",
    AR: "تحميل التطبيق",
    UK: "Завантажити",
    JA: "アプリをダウンロード",
    PT: "Baixar App",
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <Button
          onClick={() => setShowModal(true)}
          size="lg"
          className={cn(
            "relative overflow-hidden",
            "bg-gradient-to-r from-primary via-primary/90 to-accent",
            "text-primary-foreground font-semibold",
            "shadow-2xl shadow-primary/40",
            "hover:shadow-2xl hover:shadow-accent/50",
            "hover:scale-105 active:scale-100",
            "transition-all duration-300 ease-out",
            "px-6 py-3 h-auto rounded-full",
            "border-2 border-white/20",
            "group"
          )}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Apple className="h-5 w-5 mr-2" />
          <span>{buttonText[language] || buttonText.EN}</span>
          <Download className="h-4 w-4 ml-2 group-hover:animate-bounce" />
        </Button>
      </div>

      <IOSInstallModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}

export default IOSDownloadButton;
