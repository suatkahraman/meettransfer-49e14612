/**
 * Hero Paneli - Sadece: Prompt+Cevap, Book Now, Aktif Rezervasyonlar
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Car } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const GEMINI_ERROR_MSG_TR = 'Şu an asistanımıza ulaşılamıyor. Lütfen API anahtarını kontrol edin veya daha sonra tekrar deneyin.';
const GEMINI_ERROR_MSG_EN = 'We cannot reach our assistant right now. Please check the API key or try again later.';

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
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Gemini API error: ${res.status}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text && data?.candidates?.[0]?.finishReason === 'SAFETY') {
    throw new Error('SAFETY');
  }
  return text || '';
}

interface CustomerHeroWelcomePanelProps {
  destinationCity: string | null;
  customerName: string;
  t: (key: string) => string;
  language: string;
  onBookNowClick?: () => void;
  activeReservationsSlot?: React.ReactNode;
  isDataLoading?: boolean;
}

export function CustomerHeroWelcomePanel({
  destinationCity,
  customerName,
  t,
  language,
  onBookNowClick,
  activeReservationsSlot,
  isDataLoading = false,
}: CustomerHeroWelcomePanelProps) {
  const [promptValue, setPromptValue] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeFetched, setWelcomeFetched] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);

  const placeholder = t('heroPromptPlaceholder') || 'Bana gitmek istediğiniz şehirle ilgili her şeyi sorabilirsiniz...';
  const apiKey = GEMINI_API_KEY?.trim() || undefined;

  // Sayfa açıldığında gizli "Merhaba" ile asistan karşılama
  useEffect(() => {
    if (welcomeFetched || isDataLoading) return;
    const hasContext = customerName || destinationCity;
    if (!apiKey || !hasContext) {
      setWelcomeFetched(true);
      return;
    }

    let cancelled = false;
    setWelcomeFetched(true);
    setIsLoading(true);

    const systemContext = [
      customerName ? `Kullanıcının adı: ${customerName}.` : '',
      destinationCity ? `Kullanıcı ${destinationCity} şehrine seyahat ediyor (aktif rezervasyon).` : '',
    ].filter(Boolean).join(' ') || undefined;

    const welcomePrompt = language === 'TR' ? 'Merhaba' : 'Hello';
    const welcomeSystem = systemContext
      ? `${systemContext} Kullanıcıya kısa ve samimi bir karşılama yap, ismen teşekkür et. 1-2 cümle yeterli. Dil: ${language === 'TR' ? 'Türkçe' : 'English'}.`
      : `Say hello briefly. Language: ${language === 'TR' ? 'Türkçe' : 'English'}.`;

    fetchGeminiResponse(apiKey, welcomePrompt, language, welcomeSystem)
      .then((res) => {
        if (!cancelled && res) setAnswer(res);
      })
      .catch(() => {
        if (!cancelled) setAnswer(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [apiKey, customerName, destinationCity, language, isDataLoading, welcomeFetched]);

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
      if (!apiKey) {
        setAnswer(language === 'TR' ? GEMINI_ERROR_MSG_TR : GEMINI_ERROR_MSG_EN);
        return;
      }
      const systemContext = destinationCity
        ? `The user has an active reservation. Their destination/arrival city is: ${destinationCity}. Use this to give personalized, relevant answers about weather, restaurants, places to visit, etc.`
        : undefined;
      const response = await fetchGeminiResponse(apiKey, q, language, systemContext);
      setAnswer(response);
      setPromptValue('');
    } catch (err) {
      const msg = language === 'TR' ? GEMINI_ERROR_MSG_TR : GEMINI_ERROR_MSG_EN;
      setAnswer(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto -mx-3 sm:-mx-4 mb-4 sm:mb-6">
      {/* Asistan Paneli - 3x büyük prompt ve cevap alanı */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl sm:rounded-3xl overflow-hidden mx-3 sm:mx-4 bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl"
      >
        <div className="p-5 sm:p-8">
          {/* 1. Asistan Prompt - max-w-6xl, 3x büyük */}
          <div className="w-full max-w-6xl flex gap-4 mb-5">
            {isDataLoading ? (
              <div className="flex-1 space-y-3">
                <Skeleton className="h-16 sm:h-20 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder={placeholder}
                  className="flex-1 min-w-0 h-14 sm:h-20 py-5 px-5 sm:px-6 rounded-2xl border-2 border-amber-200 dark:border-zinc-600 bg-amber-50/80 dark:bg-zinc-800/80 text-foreground placeholder:text-muted-foreground text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!promptValue.trim() || isLoading}
                  className={cn(
                    'h-14 sm:h-20 px-6 sm:px-8 rounded-2xl font-semibold text-base sm:text-lg transition-all shrink-0 flex items-center justify-center gap-2',
                    promptValue.trim() && !isLoading
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
                  ) : (
                    <Send className="h-6 w-6 sm:h-7 sm:w-7" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Cevap alanı - 3x büyük Asistan Paneli hissi */}
          <AnimatePresence>
            {(answer || isLoading) && (
              <motion.div
                ref={answerRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mb-5 overflow-hidden"
              >
                <div className="mt-3 rounded-2xl bg-amber-50/80 dark:bg-zinc-800/80 border-2 border-amber-200/60 dark:border-zinc-600 p-6 sm:p-8 text-base sm:text-lg text-foreground leading-relaxed">
                  {isLoading ? (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>{language === 'TR' ? 'Yanıt hazırlanıyor...' : 'Preparing response...'}</span>
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
