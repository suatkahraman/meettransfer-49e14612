import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Sparkles, Clock, Gift, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAIChat } from "@/contexts/AIChatContext";

const POPUP_STORAGE_KEY = "proactive_help_dismissed";
const POPUP_COOLDOWN_HOURS = 24; // Don't show again for 24 hours after dismissal

interface ProactiveHelpPopupProps {
  // Time in seconds before showing the popup (default: 60 seconds)
  delaySeconds?: number;
  // Force show for specific visitor (e.g., from admin panel)
  forceShow?: boolean;
  // Visitor ID to track
  visitorId?: string;
}

const translations: Record<string, {
  greeting: string;
  question: string;
  chatButton: string;
  whatsappButton: string;
  laterButton: string;
  badge: string;
  discountHint: string;
}> = {
  EN: {
    greeting: "Hi there! 👋",
    question: "Looking for a transfer? We're here to help!",
    chatButton: "Chat with us",
    whatsappButton: "WhatsApp",
    laterButton: "Maybe later",
    badge: "Live Support",
    discountHint: "Get 10% off your first booking!"
  },
  TR: {
    greeting: "Merhaba! 👋",
    question: "Transfer mi arıyorsunuz? Size yardımcı olabiliriz!",
    chatButton: "Bizimle sohbet edin",
    whatsappButton: "WhatsApp",
    laterButton: "Belki daha sonra",
    badge: "Canlı Destek",
    discountHint: "İlk rezervasyonunuzda %10 indirim!"
  },
  DE: {
    greeting: "Hallo! 👋",
    question: "Suchen Sie einen Transfer? Wir helfen Ihnen gerne!",
    chatButton: "Mit uns chatten",
    whatsappButton: "WhatsApp",
    laterButton: "Vielleicht später",
    badge: "Live-Support",
    discountHint: "10% Rabatt auf Ihre erste Buchung!"
  },
  FR: {
    greeting: "Bonjour! 👋",
    question: "Vous cherchez un transfert? Nous sommes là pour vous aider!",
    chatButton: "Discuter avec nous",
    whatsappButton: "WhatsApp",
    laterButton: "Peut-être plus tard",
    badge: "Support en direct",
    discountHint: "10% de réduction sur votre première réservation!"
  },
  RU: {
    greeting: "Привет! 👋",
    question: "Ищете трансфер? Мы готовы помочь!",
    chatButton: "Написать нам",
    whatsappButton: "WhatsApp",
    laterButton: "Может позже",
    badge: "Онлайн поддержка",
    discountHint: "Скидка 10% на первое бронирование!"
  },
  AR: {
    greeting: "مرحباً! 👋",
    question: "هل تبحث عن خدمة النقل؟ نحن هنا للمساعدة!",
    chatButton: "تحدث معنا",
    whatsappButton: "واتساب",
    laterButton: "ربما لاحقاً",
    badge: "دعم مباشر",
    discountHint: "خصم 10% على حجزك الأول!"
  },
  ES: {
    greeting: "¡Hola! 👋",
    question: "¿Buscas un traslado? ¡Estamos aquí para ayudarte!",
    chatButton: "Chatea con nosotros",
    whatsappButton: "WhatsApp",
    laterButton: "Quizás después",
    badge: "Soporte en vivo",
    discountHint: "¡10% de descuento en tu primera reserva!"
  },
  IT: {
    greeting: "Ciao! 👋",
    question: "Cerchi un transfer? Siamo qui per aiutarti!",
    chatButton: "Chatta con noi",
    whatsappButton: "WhatsApp",
    laterButton: "Forse dopo",
    badge: "Supporto live",
    discountHint: "10% di sconto sulla tua prima prenotazione!"
  },
  UK: {
    greeting: "Привіт! 👋",
    question: "Шукаєте трансфер? Ми готові допомогти!",
    chatButton: "Написати нам",
    whatsappButton: "WhatsApp",
    laterButton: "Можливо пізніше",
    badge: "Онлайн підтримка",
    discountHint: "Знижка 10% на перше бронювання!"
  },
  JA: {
    greeting: "こんにちは！👋",
    question: "送迎をお探しですか？お手伝いします！",
    chatButton: "チャットする",
    whatsappButton: "WhatsApp",
    laterButton: "また後で",
    badge: "ライブサポート",
    discountHint: "初回予約10%オフ！"
  }
};

const ProactiveHelpPopup = memo(({ 
  delaySeconds = 90, 
  forceShow = false,
  visitorId 
}: ProactiveHelpPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { language } = useLanguage();
  const { setAIChatOpen } = useAIChat();

  const t = translations[language] || translations.EN;

  // Check if popup was recently dismissed
  const wasRecentlyDismissed = useCallback(() => {
    try {
      const dismissed = localStorage.getItem(POPUP_STORAGE_KEY);
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        const hoursSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60);
        return hoursSinceDismissal < POPUP_COOLDOWN_HOURS;
      }
    } catch {
      // Ignore localStorage errors
    }
    return false;
  }, []);

  // Track popup interaction
  const trackPopupEvent = useCallback((action: string) => {
    // Dispatch custom event for tracking
    window.dispatchEvent(new CustomEvent('proactive_help_interaction', {
      detail: {
        action,
        visitorId,
        timestamp: Date.now(),
        language
      }
    }));
  }, [visitorId, language]);

  // Show popup after delay
  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      trackPopupEvent('force_shown');
      return;
    }

    if (wasRecentlyDismissed()) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
      trackPopupEvent('auto_shown');
    }, delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [delaySeconds, forceShow, wasRecentlyDismissed, trackPopupEvent]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    setIsVisible(false);
    trackPopupEvent('dismissed');
    
    try {
      localStorage.setItem(POPUP_STORAGE_KEY, Date.now().toString());
    } catch {
      // Ignore localStorage errors
    }
  }, [trackPopupEvent]);

  const handleOpenChat = useCallback(() => {
    setIsVisible(false);
    setAIChatOpen(true);
    trackPopupEvent('opened_chat');
    
    // Trigger a welcome message in the chat
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('ai_chat_prompt', {
        detail: {
          message: language === 'TR' 
            ? "Merhaba, transfer hizmeti hakkında bilgi almak istiyorum." 
            : "Hello, I'd like to get information about transfer services."
        }
      }));
    }, 500);
  }, [setAIChatOpen, trackPopupEvent, language]);

  const handleWhatsApp = useCallback(() => {
    trackPopupEvent('opened_whatsapp');
    const message = encodeURIComponent(
      language === 'TR' 
        ? "Merhaba, transfer hizmeti hakkında bilgi almak istiyorum." 
        : "Hello, I'm interested in your transfer services."
    );
    window.open(`https://wa.me/905332608585?text=${message}`, '_blank');
    handleDismiss();
  }, [language, trackPopupEvent, handleDismiss]);

  if (isDismissed || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 max-w-sm"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-primary-foreground text-sm font-medium">{t.badge}</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Avatar and greeting */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t.greeting}</p>
                <p className="text-muted-foreground text-sm mt-1">{t.question}</p>
              </div>
            </div>

            {/* Discount hint */}
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
              <Gift className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">{t.discountHint}</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleOpenChat}
                className="w-full gap-2"
                size="sm"
              >
                <MessageCircle className="w-4 h-4" />
                {t.chatButton}
              </Button>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t.whatsappButton}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-muted-foreground"
                >
                  {t.laterButton}
                </Button>
              </div>
            </div>
          </div>

          {/* Typing indicator */}
          <div className="px-4 pb-3 flex items-center gap-2 text-muted-foreground text-xs">
            <Clock className="w-3 h-3" />
            <span>Average response time: 30 seconds</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

ProactiveHelpPopup.displayName = 'ProactiveHelpPopup';

export default ProactiveHelpPopup;
