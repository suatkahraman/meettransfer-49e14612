import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Sparkles, X, Bot, User, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BookingData {
  pickup?: string | null;
  dropoff?: string | null;
  date?: string | null;
  time?: string | null;
  passengers?: number | null;
  vehicleType?: string | null;
  estimatedPrice?: number | null;
  currency?: string | null;
  isComplete?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  bookingData?: BookingData | null;
}

interface BookingChatAssistantProps {
  onApplyBooking?: (data: BookingData) => void;
}

export default function BookingChatAssistant({ onApplyBooking }: BookingChatAssistantProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholderMessages = {
    EN: "e.g., 'Tomorrow at 3pm from Istanbul Airport to Taksim for 4 people'",
    TR: "örn: 'Yarın 15:00'te İstanbul Havalimanı'ndan Taksim'e 4 kişi'",
    DE: "z.B. 'Morgen um 15 Uhr vom Flughafen Istanbul nach Taksim für 4 Personen'",
    FR: "ex: 'Demain à 15h de l'aéroport d'Istanbul à Taksim pour 4 personnes'",
    RU: "напр: 'Завтра в 15:00 из аэропорта Стамбула в Таксим на 4 человека'",
    AR: "مثال: 'غداً الساعة 3 عصراً من مطار إسطنبول إلى تقسيم لـ 4 أشخاص'",
    ES: "ej: 'Mañana a las 15h del aeropuerto de Estambul a Taksim para 4 personas'",
    IT: "es: 'Domani alle 15 dall'aeroporto di Istanbul a Taksim per 4 persone'",
    UK: "напр: 'Завтра о 15:00 з аеропорту Стамбула до Таксим на 4 особи'",
    JA: "例: '明日15時にイスタンブール空港からタクシムへ4人で'"
  };

  const welcomeMessages = {
    EN: "Hi! 👋 I'm your AI booking assistant. Tell me where and when you need a transfer, and I'll help you book it instantly!",
    TR: "Merhaba! 👋 Ben AI rezervasyon asistanınızım. Nereye ve ne zaman transfer istediğinizi söyleyin, hemen sizin için ayarlayayım!",
    DE: "Hallo! 👋 Ich bin Ihr KI-Buchungsassistent. Sagen Sie mir, wohin und wann Sie einen Transfer benötigen!",
    FR: "Bonjour! 👋 Je suis votre assistant de réservation IA. Dites-moi où et quand vous avez besoin d'un transfert!",
    RU: "Привет! 👋 Я ваш AI-ассистент по бронированию. Скажите, куда и когда вам нужен трансфер!",
    AR: "مرحباً! 👋 أنا مساعد الحجز الذكي. أخبرني أين ومتى تحتاج النقل!",
    ES: "¡Hola! 👋 Soy tu asistente de reservas IA. ¡Dime dónde y cuándo necesitas un transfer!",
    IT: "Ciao! 👋 Sono il tuo assistente AI per le prenotazioni. Dimmi dove e quando hai bisogno di un transfer!",
    UK: "Привіт! 👋 Я ваш AI-асистент з бронювання. Скажіть, куди і коли вам потрібен трансфер!",
    JA: "こんにちは！👋 AI予約アシスタントです。どこへ、いつ送迎が必要か教えてください！"
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when opened
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: welcomeMessages[language] || welcomeMessages.EN
      }]);
    }
  }, [isOpen, language]);

  useEffect(() => {
    // Scroll to bottom when new messages added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Focus input when chat opens
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("booking-assistant", {
        body: { message: userMessage.content, language }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanResponseForDisplay(data.response),
        bookingData: data.bookingData
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: language === "TR" 
          ? "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin."
          : "Sorry, an error occurred. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanResponseForDisplay = (response: string): string => {
    // Remove the booking JSON block from display
    return response.replace(/```booking[\s\S]*?```/g, '').replace(/```json[\s\S]*?```/g, '').trim();
  };

  const handleApplyBooking = (data: BookingData) => {
    if (onApplyBooking) {
      onApplyBooking(data);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 z-50 md:hidden flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Inline Chat Panel for Hero */}
      <div className={cn(
        "bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-border overflow-hidden transition-all duration-300",
        isOpen ? "h-[400px]" : "h-auto"
      )}>
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {t("aiAssistant") || "AI Booking Assistant"}
                <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full text-primary font-medium">
                  {t("new") || "NEW"}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("aiAssistantHint") || "Tell me your transfer needs in any language"}
              </p>
            </div>
          </div>
          <div className={cn(
            "transform transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}>
            {isOpen ? <X className="h-5 w-5 text-muted-foreground" /> : <MessageCircle className="h-5 w-5 text-primary" />}
          </div>
        </button>

        {/* Chat Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col"
              style={{ height: "calc(100% - 72px)" }}
            >
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2 max-w-[85%]">
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          )}
                        >
                          {msg.content}
                        </div>
                        
                        {/* Booking Data Action Button */}
                        {msg.bookingData?.isComplete && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <Button
                              size="sm"
                              onClick={() => handleApplyBooking(msg.bookingData!)}
                              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white gap-2"
                            >
                              <ArrowRight className="h-4 w-4" />
                              {t("applyToForm") || "Apply to Form"}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-2 items-center">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t bg-muted/30">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholderMessages[language] || placeholderMessages.EN}
                    disabled={isLoading}
                    className="flex-1 bg-white border-border focus:border-primary"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
