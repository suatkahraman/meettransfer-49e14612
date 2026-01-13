import { memo, lazy, Suspense, useCallback, useState, useEffect } from "react";
import { Sparkles, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookingData } from "./types";

const BookingChatAssistant = lazy(() => import("@/components/website/BookingChatAssistant"));

interface HeroAIAssistantProps {
  language: string;
  onApplyBooking: (data: BookingData) => void;
}

const quickPrompts = {
  TR: [
    { label: "İstanbul Havalimanı → Taksim", message: "Yarın 15:00'te İstanbul Havalimanı'ndan Taksim'e 2 kişi transfer istiyorum" },
    { label: "Antalya Havalimanı → Kaleiçi", message: "Yarın 12:00'de Antalya Havalimanı'ndan Kaleiçi'ne 4 kişi transfer" },
    { label: "İstanbul 4 Saatlik Tur", message: "İstanbul'da yarın 10:00'da 4 saatlik şehir turu istiyorum" },
  ],
  EN: [
    { label: "Istanbul Airport → Taksim", message: "I need a transfer from Istanbul Airport to Taksim tomorrow at 3pm for 2 people" },
    { label: "Antalya Airport → Kaleiçi", message: "Transfer from Antalya Airport to Kaleici tomorrow at noon for 4 people" },
    { label: "Istanbul 4 Hour Tour", message: "I'd like a 4 hour city tour in Istanbul tomorrow at 10am" },
  ],
};

export const HeroAIAssistant = memo(({ language, onApplyBooking }: HeroAIAssistantProps) => {
  const prompts = quickPrompts[language as keyof typeof quickPrompts] || quickPrompts.EN;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate prompts every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % prompts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [prompts.length]);

  const handleQuickPrompt = useCallback((message: string) => {
    window.dispatchEvent(
      new CustomEvent("booking-ai-open", { detail: { message } })
    );
  }, []);

  const currentPrompt = prompts[currentIndex];

  return (
    <div id="ai-assistant" className="mb-4 relative">
      {/* Content Container - Softer colors */}
      <div className="relative bg-muted/50 rounded-xl p-3 border border-border backdrop-blur-sm">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          
          <span className="text-sm font-medium text-foreground">
            {language === 'TR' 
              ? "🌍 AI ile Transfer & Saatlik Kiralama" 
              : "🌍 Book Transfer & Hourly Rental With AI"}
          </span>
          
          {/* NEW Badge - Softer */}
          <span className="px-1.5 py-0.5 bg-primary/80 text-primary-foreground text-[9px] font-bold rounded-md">
            NEW
          </span>
        </div>

        {/* Single Rotating Quick Prompt Button */}
        <div className="mb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPrompt(currentPrompt.message)}
            className="h-8 text-xs px-3 py-1.5 rounded-full border-border bg-background hover:bg-primary/10 hover:border-primary/40 transition-all duration-300"
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <span className="transition-opacity duration-300">
              {language === 'TR' ? 'AI ile Sor: ' : 'Ask AI: '}
              {currentPrompt.label}
            </span>
          </Button>
        </div>
        
        {/* Chat Assistant */}
        <div className="relative">
          <Suspense fallback={<Skeleton className="h-[120px] w-full rounded-lg" />}>
            <BookingChatAssistant onApplyBooking={onApplyBooking} />
          </Suspense>
        </div>
      </div>
    </div>
  );
});

HeroAIAssistant.displayName = "HeroAIAssistant";
