import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackConversion, CONVERSION_LABELS } from "@/lib/gtag";
import { WHATSAPP_NUMBER } from "@/lib/contact";

interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
  className?: string;
  variant?: "default" | "large" | "floating" | "small";
  size?: "default" | "sm";
}

const WhatsAppButton = ({
  phone = WHATSAPP_NUMBER,
  message = "Hello, I would like to book a transfer.",
  className = "",
  variant = "default",
  size = "default",
}: WhatsAppButtonProps) => {
  const { t } = useLanguage();

  const handleClick = () => {
    // Track WhatsApp click conversion
    trackConversion(CONVERSION_LABELS.WHATSAPP_CLICK);
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
  };

  if (variant === "floating") {
    return (
      <button
        onClick={handleClick}
        className={`fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 sm:right-6 z-50 bg-[#25D366] hover:bg-[#22c55e] text-white h-14 w-14 sm:h-14 sm:w-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 border-2 border-white/30 ${className}`}
        aria-label="WhatsApp"
        style={{
          boxShadow:
            "0 4px 20px rgba(37, 211, 102, 0.4), 0 0 0 3px rgba(37, 211, 102, 0.2)",
        }}
      >
        <MessageCircle className="h-7 w-7" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  if (variant === "large") {
    return (
      <Button
        onClick={handleClick}
        className={`bg-[#25D366] hover:bg-[#22c55e] text-white h-14 px-8 text-lg rounded-xl relative ${className}`}
      >
        <span className="relative mr-2">
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </span>
        {t("whatsappBooking")}
      </Button>
    );
  }

  if (variant === "small" || size === "sm") {
    return (
      <Button
        onClick={handleClick}
        size="sm"
        className={`bg-[#25D366] hover:bg-[#22c55e] text-white rounded-lg relative ${className}`}
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant="accent"
      className={`h-12 rounded-xl relative ${className}`}
    >
      <span className="relative mr-2">
        <MessageCircle className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
      </span>
      {t("whatsappBooking")}
    </Button>
  );
};

export default WhatsAppButton;
