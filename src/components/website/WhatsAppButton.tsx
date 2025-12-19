import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackConversion, CONVERSION_LABELS } from "@/lib/gtag";

interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
  className?: string;
  variant?: "default" | "large";
}

const WhatsAppButton = ({
  phone = "905301234567",
  message = "Hello, I would like to book a transfer.",
  className = "",
  variant = "default",
}: WhatsAppButtonProps) => {
  const { t } = useLanguage();

  const handleClick = () => {
    // Track WhatsApp click conversion
    trackConversion(CONVERSION_LABELS.WHATSAPP_CLICK);
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
  };

  if (variant === "large") {
    return (
      <Button
        onClick={handleClick}
        className={`bg-[#25D366] hover:bg-[#22c55e] text-white h-14 px-8 text-lg rounded-xl ${className}`}
      >
        <MessageCircle className="h-6 w-6 mr-2" />
        {t("whatsappBooking")}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant="accent"
      className={`h-12 rounded-xl ${className}`}
    >
      <MessageCircle className="h-5 w-5 mr-2" />
      {t("whatsappBooking")}
    </Button>
  );
};

export default WhatsAppButton;
