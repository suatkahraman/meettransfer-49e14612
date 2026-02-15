/**
 * Hero Paneli - Karşılama + Gemini Asistanı (sol) | Aktif Rezervasyon Kartı (sağ)
 * Professional layout, glassmorphism, min-h-[400px]
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Car, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() || undefined;
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
        console.warn('Vite Env Yüklenemedi: VITE_GEMINI_API_KEY undefined veya boş. Vercel: Environment Variables\'da Production/Preview/Development scope kontrol edin.');
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative min-h-[400px] w-full mx-3 sm:mx-4 mb-4 sm:mb-6 rounded-3xl overflow-hidden"
    >
      {/* Arka plan: hafif harita / araç silüeti */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/90 via-white/95 to-amber-100/80 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-amber-950/30">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <MapPin className="absolute top-1/4 right-1/4 h-48 w-48 text-slate-800" strokeWidth={0.5} />
          <MapPin className="absolute bottom-1/4 left-1/4 h-32 w-32 text-slate-800" strokeWidth={0.5} />
        </div>
        <div className="absolute bottom-0 right-0 opacity-[0.06] dark:opacity-[0.08]">
          <Car className="h-40 w-40 sm:h-56 sm:w-56 text-slate-700" strokeWidth={1} />
        </div>
      </div>

      {/* İçerik - flex sol/sağ */}
      <div className="relative flex flex-col lg:flex-row gap-6 p-4 sm:p-6 min-h-[400px]">
        {/* Sol: Karşılama + Gemini + Book Now */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Prompt + Cevap */}
          <div className="flex gap-2">
            <input
              type="text"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={placeholder}
              className="flex-1 min-w-0 h-12 sm:h-14 px-4 rounded-xl border border-amber-200/80 bg-white/80 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 placeholder:text-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!promptValue.trim() || isLoading}
              className={cn(
                'h-12 sm:h-14 px-5 rounded-xl font-medium transition-all shrink-0 flex items-center justify-center gap-2',
                promptValue.trim() && !isLoading
                  ? 'bg-amber-500 text-white hover:bg-amber-600 hover:scale-[1.02]'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
              )}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>

          <AnimatePresence>
            {(answer || isLoading) && (
              <motion.div
                ref={answerRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl bg-white/70 dark:bg-slate-800/50 border border-amber-200/50 p-4 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-slate-500">
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

          {/* Book Now - gradient buton */}
          {onBookNowClick && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBookNowClick}
              className="w-full h-14 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white border-0 flex flex-col items-center justify-center text-center"
            >
              <div className="flex items-center gap-2">
                <Car className="h-6 w-6" />
                <span className="font-bold text-lg">{language === 'TR' ? 'Book Now' : 'Book Now'}</span>
              </div>
              <span className="text-sm opacity-90 mt-0.5">
                {language === 'TR' ? 'Transfer fiyatınızı alın, hemen rezervasyon yapın' : 'Get your quote and book instantly'}
              </span>
            </motion.button>
          )}
        </div>

        {/* Sağ: Aktif Rezervasyon Kartı (glassmorphism) */}
        {activeReservationsSlot && (
          <div className="lg:w-[420px] shrink-0">
            <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-amber-200/50 dark:border-slate-700/50 shadow-xl p-6 gap-4 flex flex-col min-h-[280px]">
              {activeReservationsSlot}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
