import { memo, lazy, Suspense, useCallback, useState, useEffect, ComponentType } from "react";
import { Sparkles, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookingData } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BookingChatAssistantProps {
  onApplyBooking?: (data: BookingData) => void;
  defaultOpen?: boolean;
  mobileFloating?: boolean;
}

// Lazy load the heavy chat component - only load when needed
const BookingChatAssistant = lazy(() => 
  import("@/components/website/BookingChatAssistant")
) as unknown as ComponentType<BookingChatAssistantProps>;

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldLoadMobile, setShouldLoadMobile] = useState(false);

  // Defer mobile chat loading until after initial paint
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadMobile(true);
    }, 2000); // Load mobile chat widget after 2 seconds
    return () => clearTimeout(timer);
  }, []);

  // Rotate prompts every 3 seconds
  useEffect(() => {
    if (!isExpanded) return; // Only rotate when visible
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % prompts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [prompts.length, isExpanded]);

  const handleQuickPrompt = useCallback((message: string) => {
    setIsExpanded(true);
    window.dispatchEvent(
      new CustomEvent("booking-ai-open", { detail: { message } })
    );
  }, []);

  const currentPrompt = prompts[currentIndex];

  return (
    <>
      {/* Desktop: Collapsible AI Assistant Section */}
      <div id="ai-assistant" className="mb-3 relative hidden md:block">
        <div className="relative bg-muted/50 rounded-xl border border-border backdrop-blur-sm overflow-hidden">
          {/* Collapsible Header */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-2.5 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {language === 'TR' ? 'AI Asistan' : 'AI Assistant'}
              </span>
              <span className="px-1.5 py-0.5 bg-primary/80 text-primary-foreground text-[8px] font-bold rounded">
                NEW
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {language === 'TR' ? 'Transfer & Kiralama' : 'Book with AI'}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Expandable Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2.5 pt-0 space-y-2">
                  {/* Quick Prompt Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt(currentPrompt.message)}
                    className="h-7 text-[10px] px-2.5 rounded-full border-border bg-background hover:bg-primary/10 hover:border-primary/40 transition-all"
                  >
                    <MessageCircle className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span>{language === 'TR' ? 'Sor: ' : 'Ask: '}{currentPrompt.label}</span>
                  </Button>
                  
                  {/* Chat Assistant */}
                  <Suspense fallback={<Skeleton className="h-[100px] w-full rounded-lg" />}>
                    <BookingChatAssistant onApplyBooking={onApplyBooking} />
                  </Suspense>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed Quick Action */}
          {!isExpanded && (
            <div className="px-2.5 pb-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleQuickPrompt(currentPrompt.message)}
                className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                {currentPrompt.label}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Floating Widget - deferred loading */}
      {shouldLoadMobile && (
        <div className="md:hidden">
          <Suspense fallback={null}>
            <BookingChatAssistant onApplyBooking={onApplyBooking} mobileFloating />
          </Suspense>
        </div>
      )}
    </>
  );
});

HeroAIAssistant.displayName = "HeroAIAssistant";
