import { memo, lazy, Suspense, useCallback } from "react";
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

  const handleQuickPrompt = useCallback((message: string) => {
    window.dispatchEvent(
      new CustomEvent("booking-ai-open", { detail: { message } })
    );
  }, []);

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

        {/* Quick Prompt Shortcuts */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {prompts.map((p, idx) => (
            <Button
              key={idx}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickPrompt(p.message)}
              className="h-7 text-xs px-2.5 py-1 rounded-full border-border bg-background hover:bg-primary/10 hover:border-primary/40 transition-colors"
            >
              <MessageCircle className="h-3 w-3 mr-1 text-muted-foreground" />
              {p.label}
            </Button>
          ))}
        </div>
        
        {/* Chat Assistant */}
        <div className="relative">
          <Suspense fallback={<Skeleton className="h-[120px] w-full rounded-lg" />}>
            <BookingChatAssistant onApplyBooking={onApplyBooking} defaultOpen />
          </Suspense>
        </div>
      </div>
    </div>
  );
});

HeroAIAssistant.displayName = "HeroAIAssistant";
