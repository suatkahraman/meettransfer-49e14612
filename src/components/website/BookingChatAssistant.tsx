import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Sparkles, X, Bot, User, Loader2, ArrowRight, Mic, Square } from "lucide-react";
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

// Voice recording hook
function useVoiceRecorder(onTranscription: (text: string) => void, language: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { audio: base64Audio, language }
              });

              if (error) throw error;
              
              if (data?.text) {
                onTranscription(data.text);
              }
            } catch (err) {
              console.error('Transcription error:', err);
            }
          };
          reader.readAsDataURL(audioBlob);
        } finally {
          setIsProcessing(false);
          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [language, onTranscription]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return { isRecording, isProcessing, startRecording, stopRecording };
}

const placeholderMessages: Record<string, string> = {
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

const welcomeMessages: Record<string, string> = {
  EN: "Hi! 👋 I'm your AI booking assistant. Tell me where and when you need a transfer, and I'll help you book it instantly! You can also use the 🎤 microphone to speak.",
  TR: "Merhaba! 👋 Ben AI rezervasyon asistanınızım. Nereye ve ne zaman transfer istediğinizi söyleyin, hemen sizin için ayarlayayım! 🎤 Mikrofon ile de konuşabilirsiniz.",
  DE: "Hallo! 👋 Ich bin Ihr KI-Buchungsassistent. Sagen Sie mir, wohin und wann Sie einen Transfer benötigen! Sie können auch 🎤 das Mikrofon verwenden.",
  FR: "Bonjour! 👋 Je suis votre assistant de réservation IA. Dites-moi où et quand vous avez besoin d'un transfert! Vous pouvez aussi utiliser le 🎤 microphone.",
  RU: "Привет! 👋 Я ваш AI-ассистент по бронированию. Скажите, куда и когда вам нужен трансфер! Вы также можете использовать 🎤 микрофон.",
  AR: "مرحباً! 👋 أنا مساعد الحجز الذكي. أخبرني أين ومتى تحتاج النقل! يمكنك أيضاً استخدام 🎤 الميكروفون.",
  ES: "¡Hola! 👋 Soy tu asistente de reservas IA. ¡Dime dónde y cuándo necesitas un transfer! También puedes usar el 🎤 micrófono.",
  IT: "Ciao! 👋 Sono il tuo assistente AI per le prenotazioni. Dimmi dove e quando hai bisogno di un transfer! Puoi anche usare il 🎤 microfono.",
  UK: "Привіт! 👋 Я ваш AI-асистент з бронювання. Скажіть, куди і коли вам потрібен трансфер! Ви також можете використовувати 🎤 мікрофон.",
  JA: "こんにちは！👋 AI予約アシスタントです。どこへ、いつ送迎が必要か教えてください！🎤 マイクも使えます。"
};

export default function BookingChatAssistant({ onApplyBooking }: BookingChatAssistantProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice recording
  const handleTranscription = useCallback((text: string) => {
    setInput(text);
  }, []);
  
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecorder(
    handleTranscription,
    language
  );

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when opened
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: welcomeMessages[language] || welcomeMessages.EN
      }]);
    }
  }, [isOpen, language, messages.length]);

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
      {/* Floating Toggle Button - Mobile */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 z-50 md:hidden flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground rounded-full shadow-2xl border border-white/20"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
            <span className="font-semibold">AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modern Chat Panel */}
      <motion.div 
        layout
        className={cn(
          "relative overflow-hidden rounded-3xl transition-all duration-500",
          "bg-gradient-to-br from-card via-card to-muted/30",
          "shadow-2xl border border-border/50",
          "backdrop-blur-xl",
          isOpen ? "h-[450px]" : "h-auto"
        )}
      >
        {/* Decorative gradient orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          className="relative w-full flex items-center justify-between p-5 transition-all z-10"
        >
          <div className="flex items-center gap-4">
            {/* Animated Avatar */}
            <div className="relative">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 5 }}
              >
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </motion.div>
              {/* Pulse ring */}
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              {/* Online indicator */}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card shadow-md" />
            </div>
            
            <div className="text-left">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                {t("aiAssistant") || "AI Booking Assistant"}
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] px-2.5 py-1 bg-gradient-to-r from-accent to-accent/80 rounded-full text-accent-foreground font-bold uppercase tracking-wide shadow-sm"
                >
                  {t("new") || "NEW"}
                </motion.span>
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Mic className="h-3.5 w-3.5 text-primary" />
                </motion.div>
                {t("aiAssistantHint") || "Voice & text in any language"}
              </p>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
          >
            {isOpen ? (
              <X className="h-5 w-5 text-muted-foreground" />
            ) : (
              <MessageCircle className="h-5 w-5 text-primary" />
            )}
          </motion.div>
        </motion.button>

        {/* Chat Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex flex-col z-10"
              style={{ height: "calc(100% - 88px)" }}
            >
              {/* Messages Area */}
              <ScrollArea className="flex-1 px-5 py-4" ref={scrollRef}>
                <div className="space-y-5">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <motion.div 
                          className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </motion.div>
                      )}
                      
                      <div className="flex flex-col gap-2 max-w-[80%]">
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className={cn(
                            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                            msg.role === "user"
                              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-lg"
                              : "bg-gradient-to-br from-muted to-muted/80 text-foreground rounded-bl-lg border border-border/30"
                          )}
                        >
                          {msg.content}
                        </motion.div>
                        
                        {/* Booking Action Button */}
                        {msg.bookingData?.isComplete && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Button
                              size="sm"
                              onClick={() => handleApplyBooking(msg.bookingData!)}
                              className="bg-gradient-to-r from-accent via-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground font-semibold gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                            >
                              <ArrowRight className="h-4 w-4" />
                              {t("applyToForm") || "Apply to Form"}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                      
                      {msg.role === "user" && (
                        <motion.div 
                          className="w-8 h-8 rounded-xl bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center flex-shrink-0 border border-border/30"
                          whileHover={{ scale: 1.1, rotate: -5 }}
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                  
                  {/* Loading State */}
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 items-start"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-gradient-to-br from-muted to-muted/80 rounded-2xl rounded-bl-lg px-5 py-4 border border-border/30">
                        <div className="flex gap-1.5">
                          <motion.span 
                            className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                            animate={{ y: [-3, 3, -3] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          />
                          <motion.span 
                            className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                            animate={{ y: [-3, 3, -3] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                          />
                          <motion.span 
                            className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                            animate={{ y: [-3, 3, -3] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border/30 bg-gradient-to-t from-muted/50 to-transparent">
                {/* Recording Indicator */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 flex items-center justify-center gap-2 text-sm text-destructive font-medium"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="w-3 h-3 bg-destructive rounded-full"
                      />
                      {language === "TR" ? "Dinleniyor... Durdurmak için tekrar tıklayın" : "Listening... Click again to stop"}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex gap-2">
                  {/* Voice Button */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading || isProcessing}
                      size="icon"
                      variant="outline"
                      className={cn(
                        "h-12 w-12 rounded-xl border-2 transition-all",
                        isRecording 
                          ? "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20" 
                          : "border-border hover:border-primary hover:bg-primary/5"
                      )}
                      title={isRecording ? "Stop Recording" : "Voice Input"}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isRecording ? (
                        <Square className="h-5 w-5 fill-current" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </Button>
                  </motion.div>
                  
                  {/* Text Input */}
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isRecording 
                        ? (language === "TR" ? "🎤 Dinliyorum..." : "🎤 Listening...") 
                        : (placeholderMessages[language] || placeholderMessages.EN)
                      }
                      disabled={isLoading || isRecording}
                      className="h-12 pr-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all placeholder:text-muted-foreground/60"
                    />
                  </div>
                  
                  {/* Send Button */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-xl transition-all",
                        input.trim() 
                          ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
