/**
 * Gemini AI Tatil Asistanı - Chat Bubble
 * Aktif rezervasyondaki destination ve date verilerini okuyarak
 * kişiselleştirilmiş karşılama mesajı sunar.
 */
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() || undefined;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface ReservationContext {
  customer_name: string;
  dropoff: string;
  pickup_date: string;
  pickup_time?: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface GeminiHolidayAssistantProps {
  reservationContext: ReservationContext | null;
  language?: 'TR' | 'EN';
  className?: string;
}

async function fetchGeminiResponse(
  apiKey: string,
  prompt: string,
  history: Array<{ role: string; parts: { text: string }[] }>
): Promise<string> {
  const contents = [
    ...history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.parts[0].text }],
    })),
    { role: 'user', parts: [{ text: prompt }] },
  ];

  const res = await fetch(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    'Üzgünüm, şu an cevap veremiyorum.';
  return text;
}

function extractLocationFromAddress(address: string): string {
  if (!address) return '';
  const parts = address.split(',');
  return (parts[0] || address).trim();
}

export function GeminiHolidayAssistant({
  reservationContext,
  language = 'EN',
  className,
}: GeminiHolidayAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiKey = GEMINI_API_KEY;

  // Karşılama mesajı - rezervasyon bağlamına göre
  useEffect(() => {
    if (!isOpen || welcomeShown || messages.length > 0) return;

    setWelcomeShown(true);
    if (reservationContext && apiKey) {
      setMessages([
      {
        id: crypto.randomUUID(),
        role: 'model',
        content:
          language === 'TR'
            ? `Merhaba ${reservationContext.customer_name || 'Değerli misafir'}! ${reservationContext.pickup_date}'te ${extractLocationFromAddress(reservationContext.dropoff)}'da hava durumu ve bölge bilgilerini paylaşabilirim. Size bölgedeki restoranlar veya turlar hakkında bilgi verebilirim. Nasıl yardımcı olabilirim?`
            : `Hello ${reservationContext.customer_name || 'Valued guest'}! I can share weather and area info for ${extractLocationFromAddress(reservationContext.dropoff)} on ${reservationContext.pickup_date}. I can help with restaurants or tours in the area. How can I assist you?`,
        timestamp: new Date(),
      },
    ]);
    } else if (reservationContext && !apiKey) {
      console.warn('Vite Env Yüklenemedi: VITE_GEMINI_API_KEY undefined veya boş. Vercel: Environment Variables\'da Production/Preview/Development scope kontrol edin.');
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'model',
          content:
            language === 'TR'
              ? `Merhaba ${reservationContext.customer_name || 'Değerli misafir'}! ${reservationContext.pickup_date}'te ${extractLocationFromAddress(reservationContext.dropoff)}'da tatilinizi planlamanıza yardımcı olabilirim. Lütfen .env dosyasına VITE_GEMINI_API_KEY ekleyin.`
              : `Hello ${reservationContext.customer_name || 'Valued guest'}! I can help plan your trip to ${extractLocationFromAddress(reservationContext.dropoff)} on ${reservationContext.pickup_date}. Please add VITE_GEMINI_API_KEY to your .env file.`,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'model',
          content:
            language === 'TR'
              ? 'Merhaba! Tatil rehberiniz olarak size yardımcı olabilirim. Bir rezervasyonunuz olduğunda hava durumu, restoran ve gezi önerileri sunabilirim.'
              : 'Hello! I can help as your holiday guide. When you have a reservation, I can provide weather, restaurant and activity suggestions.',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, welcomeShown, reservationContext, apiKey, language]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (!apiKey) {
        console.warn('Vite Env Yüklenemedi: VITE_GEMINI_API_KEY undefined veya boş. Vercel: Environment Variables\'da Production/Preview/Development scope kontrol edin.');
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'model',
            content:
              language === 'TR'
                ? 'Gemini API anahtarı yapılandırılmamış. Lütfen .env dosyasına VITE_GEMINI_API_KEY ekleyin.'
                : 'Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.',
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      const systemContext =
        reservationContext &&
        `Kullanıcı ${reservationContext.pickup_date} tarihinde ${extractLocationFromAddress(reservationContext.dropoff)} bölgesine seyahat ediyor. Hava durumu, restoranlar, gezilecek yerler ve turlar hakkında yardımcı ol. Kısa ve pratik öneriler ver. Dil: ${language === 'TR' ? 'Türkçe' : 'English'}.`;

      const fullPrompt = systemContext
        ? `${systemContext}\n\nKullanıcı: ${text}`
        : text;

      const response = await fetchGeminiResponse(apiKey, fullPrompt, history);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          content:
            language === 'TR'
              ? 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
              : 'An error occurred. Please try again later.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasReservation = !!reservationContext;

  return (
    <div className={cn('fixed z-[60]', className)}>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[340px] max-w-[calc(100vw-2rem)] h-[450px] max-h-[70vh] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {language === 'TR' ? 'Asistanıma Sor' : 'Ask My Assistant'}
                  </h3>
                  <p className="text-[10px] opacity-80">
                    {language === 'TR' ? 'Tatil rehberi' : 'Holiday guide'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs text-muted-foreground">
                        {language === 'TR' ? 'Yazıyor...' : 'Typing...'}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={
                  language === 'TR'
                    ? 'Restoran veya tur önerisi...'
                    : 'Ask about restaurants or tours...'
                }
                className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="rounded-xl shrink-0"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6"
      >
        <Button
          size="lg"
          className={cn(
            'h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg',
            hasReservation
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white'
              : 'bg-gradient-to-br from-violet-500/80 to-purple-600/80 hover:from-violet-600/90 hover:to-purple-700/90 text-white'
          )}
          onClick={() => setIsOpen((o) => !o)}
          title={language === 'TR' ? 'Asistanıma Sor' : 'Ask My Assistant'}
        >
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
        </Button>
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          {language === 'TR' ? 'Asistanıma Sor' : 'Ask My Assistant'}
        </span>
      </motion.div>
    </div>
  );
}
