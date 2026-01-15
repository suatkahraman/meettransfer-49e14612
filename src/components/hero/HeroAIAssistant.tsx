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

const quickPrompts: Record<string, { label: string; message: string }[]> = {
  TR: [
    { label: "Antalya Havalimanı → Belek", message: "Yarın 15:00'te Antalya Havalimanı'ndan Belek'e 4 kişi transfer istiyorum" },
    { label: "Dalaman Havalimanı → Fethiye", message: "Yarın 12:00'de Dalaman Havalimanı'ndan Fethiye'ye 2 kişi transfer" },
    { label: "Bodrum Havalimanı → Yalıkavak", message: "Yarın 10:00'da Bodrum Havalimanı'ndan Yalıkavak'a 3 kişi transfer" },
  ],
  EN: [
    { label: "Antalya Airport → Belek", message: "I need a transfer from Antalya Airport to Belek tomorrow at 3pm for 4 people" },
    { label: "Dalaman Airport → Fethiye", message: "Transfer from Dalaman Airport to Fethiye tomorrow at noon for 2 people" },
    { label: "Bodrum Airport → Yalıkavak", message: "I'd like a transfer from Bodrum Airport to Yalıkavak tomorrow at 10am for 3 people" },
  ],
  DE: [
    { label: "Antalya Flughafen → Belek", message: "Ich brauche einen Transfer vom Antalya Flughafen nach Belek morgen um 15 Uhr für 4 Personen" },
    { label: "Dalaman Flughafen → Fethiye", message: "Transfer vom Dalaman Flughafen nach Fethiye morgen mittags für 2 Personen" },
    { label: "Bodrum Flughafen → Yalıkavak", message: "Ich möchte einen Transfer vom Bodrum Flughafen nach Yalıkavak morgen um 10 Uhr für 3 Personen" },
  ],
  FR: [
    { label: "Aéroport Antalya → Belek", message: "J'ai besoin d'un transfert de l'aéroport d'Antalya à Belek demain à 15h pour 4 personnes" },
    { label: "Aéroport Dalaman → Fethiye", message: "Transfert de l'aéroport de Dalaman à Fethiye demain à midi pour 2 personnes" },
    { label: "Aéroport Bodrum → Yalıkavak", message: "Je voudrais un transfert de l'aéroport de Bodrum à Yalıkavak demain à 10h pour 3 personnes" },
  ],
  RU: [
    { label: "Аэропорт Анталья → Белек", message: "Мне нужен трансфер из аэропорта Анталья в Белек завтра в 15:00 для 4 человек" },
    { label: "Аэропорт Даламан → Фетхие", message: "Трансфер из аэропорта Даламан в Фетхие завтра в полдень для 2 человек" },
    { label: "Аэропорт Бодрум → Ялыкавак", message: "Мне нужен трансфер из аэропорта Бодрум в Ялыкавак завтра в 10:00 для 3 человек" },
  ],
  IT: [
    { label: "Aeroporto Antalya → Belek", message: "Ho bisogno di un trasferimento dall'aeroporto di Antalya a Belek domani alle 15 per 4 persone" },
    { label: "Aeroporto Dalaman → Fethiye", message: "Trasferimento dall'aeroporto di Dalaman a Fethiye domani a mezzogiorno per 2 persone" },
    { label: "Aeroporto Bodrum → Yalıkavak", message: "Vorrei un trasferimento dall'aeroporto di Bodrum a Yalıkavak domani alle 10 per 3 persone" },
  ],
  ES: [
    { label: "Aeropuerto Antalya → Belek", message: "Necesito un traslado del aeropuerto de Antalya a Belek mañana a las 15h para 4 personas" },
    { label: "Aeropuerto Dalaman → Fethiye", message: "Traslado del aeropuerto de Dalaman a Fethiye mañana al mediodía para 2 personas" },
    { label: "Aeropuerto Bodrum → Yalıkavak", message: "Quiero un traslado del aeropuerto de Bodrum a Yalıkavak mañana a las 10h para 3 personas" },
  ],
  AR: [
    { label: "مطار أنطاليا ← بيليك", message: "أحتاج نقل من مطار أنطاليا إلى بيليك غداً الساعة 3 مساءً لـ 4 أشخاص" },
    { label: "مطار دالامان ← فتحية", message: "نقل من مطار دالامان إلى فتحية غداً ظهراً لشخصين" },
    { label: "مطار بودروم ← ياليكاواك", message: "أريد نقل من مطار بودروم إلى ياليكاواك غداً الساعة 10 صباحاً لـ 3 أشخاص" },
  ],
  UK: [
    { label: "Аеропорт Анталія → Белек", message: "Мені потрібен трансфер з аеропорту Анталія до Белека завтра о 15:00 для 4 осіб" },
    { label: "Аеропорт Даламан → Фетхіє", message: "Трансфер з аеропорту Даламан до Фетхіє завтра опівдні для 2 осіб" },
    { label: "Аеропорт Бодрум → Яликавак", message: "Мені потрібен трансфер з аеропорту Бодрум до Яликавака завтра о 10:00 для 3 осіб" },
  ],
  JA: [
    { label: "アンタルヤ空港 → ベレク", message: "明日午後3時にアンタルヤ空港からベレクまで4名で送迎をお願いします" },
    { label: "ダラマン空港 → フェティエ", message: "明日正午にダラマン空港からフェティエまで2名で送迎をお願いします" },
    { label: "ボドルム空港 → ヤルカヴァク", message: "明日午前10時にボドルム空港からヤルカヴァクまで3名で送迎をお願いします" },
  ],
};

const aiLabels: Record<string, { assistant: string; bookWithAI: string; ask: string }> = {
  TR: { assistant: "AI Asistan", bookWithAI: "AI ile Rezervasyon", ask: "Sor:" },
  EN: { assistant: "AI Assistant", bookWithAI: "Book with AI", ask: "Ask:" },
  DE: { assistant: "KI-Assistent", bookWithAI: "Mit KI buchen", ask: "Fragen:" },
  FR: { assistant: "Assistant IA", bookWithAI: "Réserver avec l'IA", ask: "Demandez:" },
  RU: { assistant: "ИИ Ассистент", bookWithAI: "Бронировать с ИИ", ask: "Спросите:" },
  IT: { assistant: "Assistente IA", bookWithAI: "Prenota con IA", ask: "Chiedi:" },
  ES: { assistant: "Asistente IA", bookWithAI: "Reservar con IA", ask: "Pregunta:" },
  AR: { assistant: "مساعد الذكاء", bookWithAI: "احجز مع الذكاء", ask: "اسأل:" },
  UK: { assistant: "ШІ Асистент", bookWithAI: "Забронювати з ШІ", ask: "Запитайте:" },
  JA: { assistant: "AIアシスタント", bookWithAI: "AIで予約", ask: "質問:" },
};

export const HeroAIAssistant = memo(({ language, onApplyBooking }: HeroAIAssistantProps) => {
  const prompts = quickPrompts[language] || quickPrompts.EN;
  const labels = aiLabels[language] || aiLabels.EN;
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
                {labels.assistant}
              </span>
              <span className="px-1.5 py-0.5 bg-primary/80 text-primary-foreground text-[8px] font-bold rounded">
                {language === 'TR' ? 'YENİ' : language === 'DE' ? 'NEU' : language === 'FR' ? 'NOUVEAU' : language === 'RU' ? 'НОВЫЙ' : language === 'IT' ? 'NUOVO' : language === 'ES' ? 'NUEVO' : language === 'AR' ? 'جديد' : language === 'UK' ? 'НОВИЙ' : language === 'JA' ? '新規' : 'NEW'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {labels.bookWithAI}
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
                    <span>{labels.ask} {currentPrompt.label}</span>
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

      {/* Mobile: Floating Widget - deferred loading with proper z-index */}
      {shouldLoadMobile && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60]" style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <Suspense fallback={null}>
              <BookingChatAssistant onApplyBooking={onApplyBooking} mobileFloating />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
});

HeroAIAssistant.displayName = "HeroAIAssistant";
