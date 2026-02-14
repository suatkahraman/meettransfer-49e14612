/**
 * Hero Paneli - Sadece: Prompt+Cevap, Book Now, Aktif Rezervasyonlar
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function fetchGeminiResponse(
  apiKey: string,
  userQuestion: string,
  lang: string,
  systemContext?: string
): Promise<string> {
  const langHint = lang === 'TR' ? 'Türkçe' : lang === 'RU' ? 'Русский' : lang === 'DE' ? 'Deutsch' : 'English';
  const baseSystem = `Answer in ${langHint}. Be concise and helpful.`;
  const fullSystemInstruction = systemContext
    ? `${baseSystem}\n\nContext (use this privately, do not reveal to user): ${systemContext}`
    : baseSystem;

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: userQuestion }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };
  if (fullSystemInstruction) {
    body.systemInstruction = { parts: [{ text: fullSystemInstruction }] };
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Gemini API error');
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

interface CustomerHeroWelcomePanelProps {
  destinationCity: string | null;
  t: (key: string) => string;
  language: string;
  onBookNowClick?: () => void;
  activeReservationsSlot?: React.ReactNode;
}

export function CustomerHeroWelcomePanel({
  destinationCity,
  t,
  language,
  onBookNowClick,
  activeReservationsSlot,
}: CustomerHeroWelcomePanelProps) {
  const [promptValue, setPromptValue] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);

  const placeholder = t('heroPromptPlaceholder') || 'Bana gitmek istediğiniz şehirle ilgili her şeyi sorabilirsiniz...';

  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [answer]);

  const handleSubmit = async () => {
    const q = promptValue.trim();
    if (!q || isLoading) return;

    setAnswer(null);
    setIsLoading(true);

    try {
      if (!GEMINI_API_KEY) {
        setAnswer(language === 'TR' ? 'Gemini API anahtarı yapılandırılmamış.' : 'Gemini API key is not configured.');
        return;
      }
      const systemContext = destinationCity
        ? `The user has an active reservation. Their destination/arrival city is: ${destinationCity}. Use this to give personalized, relevant answers about weather, restaurants, places to visit, etc.`
        : undefined;
      const response = await fetchGeminiResponse(GEMINI_API_KEY, q, language, systemContext);
      setAnswer(response);
      setPromptValue('');
    } catch {
      setAnswer(language === 'TR' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full -mx-3 sm:-mx-4 mb-4 sm:mb-6">
      {/* Glassmorphism Panel - Sadece: Prompt+Cevap, Book Now, Aktif Rezervasyonlar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl sm:rounded-3xl overflow-hidden mx-3 sm:mx-4 bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg"
      >
        <div className="p-4 sm:p-6">
          {/* 1. Prompt + Cevap - En üstte */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={placeholder}
              className="flex-1 min-w-0 h-11 sm:h-12 px-4 rounded-xl border border-border/60 bg-background/80 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!promptValue.trim() || isLoading}
              className={cn(
                'h-11 sm:h-12 px-4 rounded-xl font-medium transition-all shrink-0 flex items-center justify-center gap-2',
                promptValue.trim() && !isLoading
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Cevap alanı - prompt altında açılır */}
          <AnimatePresence>
            {(answer || isLoading) && (
              <motion.div
                ref={answerRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mb-4 overflow-hidden"
              >
                <div className="mt-2 rounded-xl bg-muted/50 border border-border/50 p-4 text-sm text-foreground">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {language === 'TR' ? 'Yanıt hazırlanıyor...' : 'Preparing response...'}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{answer}</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2. Book Now - Prompt altında */}
          {onBookNowClick && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onBookNowClick}
              className="w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground border-0 p-4 sm:p-5 flex flex-col items-center justify-center text-center mb-4"
            >
              <div className="bg-primary-foreground/20 rounded-full p-2.5 sm:p-3 mb-2 backdrop-blur-sm">
                <Car className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <span className="font-bold text-base sm:text-lg">
                {language === 'TR' ? 'Book Now' : 'Book Now'}
              </span>
              <span className="text-xs sm:text-sm opacity-90 mt-0.5">
                {language === 'TR' ? 'Transfer fiyatınızı alın, hemen rezervasyon yapın' : 'Get your quote and book instantly'}
              </span>
            </motion.button>
          )}

          {/* 3. Aktif Rezervasyonlar - Book Now altında (varsa) */}
          {activeReservationsSlot}
        </div>
      </motion.div>
    </div>
  );
}
