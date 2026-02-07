import { memo, useEffect, useState, useMemo } from "react";
import { Zap, Clock, MapPin, CarFront } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstantBookingInfoProps {
  language: string;
  className?: string;
}

const translations: Record<string, {
  headline: string;
  items: string[];
}> = {
  EN: {
    headline: "Instant Vehicle Service",
    items: [
      "Book now – your vehicle is ready in 20 minutes!",
      "Schedule your ride at least 20 minutes ahead",
      "Available in all cities across Turkey",
      "Your driver is on the way – fast & reliable",
    ],
  },
  TR: {
    headline: "Anında Araç Hizmeti",
    items: [
      "Hemen rezervasyon yapın – aracınız 20 dakikada hazır!",
      "Rezervasyonunuzu en az 20 dakika sonrası için yapabilirsiniz",
      "Türkiye'nin tüm şehirlerinde hizmetinizdeyiz",
      "Şoförünüz yolda – hızlı ve güvenilir",
    ],
  },
  DE: {
    headline: "Sofortiger Fahrzeugservice",
    items: [
      "Jetzt buchen – Ihr Fahrzeug ist in 20 Minuten bereit!",
      "Buchen Sie mindestens 20 Minuten im Voraus",
      "In allen Städten der Türkei verfügbar",
      "Ihr Fahrer ist unterwegs – schnell & zuverlässig",
    ],
  },
  FR: {
    headline: "Service véhicule instantané",
    items: [
      "Réservez maintenant – votre véhicule est prêt en 20 minutes !",
      "Réservez au moins 20 minutes à l'avance",
      "Disponible dans toutes les villes de Turquie",
      "Votre chauffeur est en route – rapide et fiable",
    ],
  },
  RU: {
    headline: "Мгновенный вызов авто",
    items: [
      "Забронируйте сейчас – авто будет через 20 минут!",
      "Бронируйте минимум за 20 минут до поездки",
      "Доступно во всех городах Турции",
      "Ваш водитель в пути – быстро и надёжно",
    ],
  },
  IT: {
    headline: "Servizio veicolo istantaneo",
    items: [
      "Prenota ora – il tuo veicolo è pronto in 20 minuti!",
      "Prenota almeno 20 minuti prima",
      "Disponibile in tutte le città della Turchia",
      "Il tuo autista è in arrivo – veloce e affidabile",
    ],
  },
  ES: {
    headline: "Servicio de vehículo instantáneo",
    items: [
      "¡Reserva ahora – tu vehículo estará listo en 20 minutos!",
      "Reserva con al menos 20 minutos de antelación",
      "Disponible en todas las ciudades de Turquía",
      "Tu conductor está en camino – rápido y confiable",
    ],
  },
  AR: {
    headline: "خدمة سيارة فورية",
    items: [
      "احجز الآن – سيارتك جاهزة خلال 20 دقيقة!",
      "احجز قبل 20 دقيقة على الأقل من موعد رحلتك",
      "متوفرة في جميع مدن تركيا",
      "سائقك في الطريق – سريع وموثوق",
    ],
  },
  UK: {
    headline: "Миттєвий виклик авто",
    items: [
      "Бронюйте зараз – авто буде через 20 хвилин!",
      "Бронюйте мінімум за 20 хвилин до поїздки",
      "Доступно в усіх містах Туреччини",
      "Ваш водій у дорозі – швидко та надійно",
    ],
  },
  JA: {
    headline: "即時車両サービス",
    items: [
      "今すぐ予約 – 20分で車両が準備完了！",
      "少なくとも20分前にご予約ください",
      "トルコ全都市で利用可能",
      "ドライバーが向かっています – 迅速＆確実",
    ],
  },
  PT: {
    headline: "Serviço de veículo instantâneo",
    items: [
      "Reserve agora – seu veículo estará pronto em 20 minutos!",
      "Agende sua viagem com pelo menos 20 minutos de antecedência",
      "Disponível em todas as cidades da Turquia",
      "Seu motorista está a caminho – rápido e confiável",
    ],
  },
};

const icons = [Zap, Clock, MapPin, CarFront];

const nowLabels: Record<string, string> = {
  EN: "Now",
  TR: "Şimdi",
  DE: "Jetzt",
  FR: "Maintenant",
  RU: "Сейчас",
  IT: "Ora",
  ES: "Ahora",
  AR: "الآن",
  UK: "Зараз",
  JA: "現在",
  PT: "Agora",
};

const readyLabels: Record<string, string> = {
  EN: "Ready",
  TR: "Hazır",
  DE: "Bereit",
  FR: "Prêt",
  RU: "Готово",
  IT: "Pronto",
  ES: "Listo",
  AR: "جاهزة",
  UK: "Готово",
  JA: "準備完了",
  PT: "Pronto",
};

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const readyTime = useMemo(() => {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() + 20);
    return d;
  }, [now]);

  return { now, readyTime };
}

export const InstantBookingInfo = memo(function InstantBookingInfo({
  language,
  className,
}: InstantBookingInfoProps) {
  const lang = language.toUpperCase() as keyof typeof translations;
  const t = translations[lang] || translations.EN;
  const isRTL = language.toUpperCase() === "AR";

  const [activeIndex, setActiveIndex] = useState(0);
  const { now, readyTime } = useLiveClock();

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formattedNow = useMemo(() => formatTime(now), [now]);
  const formattedReady = useMemo(() => formatTime(readyTime), [readyTime]);

  const nowLabel = nowLabels[lang] || nowLabels.EN;
  const readyLabel = readyLabels[lang] || readyLabels.EN;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % t.items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [t.items.length]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-amber-400/80 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 shadow-sm shadow-amber-200/50 dark:border-amber-600/50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-950/40 dark:shadow-amber-900/20",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="px-3 py-2.5 sm:px-4 sm:py-3">
        {/* Headline + live clock */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-600 shadow-sm shadow-amber-500/50" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              {t.headline}
            </span>
          </div>

          {/* Live clock: now → ready — distinct blue/cyan color */}
          <div className="flex items-center gap-1.5 rounded-full border border-sky-400/80 bg-sky-100/80 px-2.5 py-1 shadow-inner dark:border-sky-500/50 dark:bg-sky-900/50">
            <span className="text-[11px]" role="img" aria-label="Turkey">🇹🇷</span>
            <Clock className="h-3 w-3 animate-pulse text-sky-600 dark:text-sky-300" />
            <span className="text-[10px] font-semibold tabular-nums text-sky-700 dark:text-sky-300">
              {nowLabel} {formattedNow}
            </span>
            <span className="text-[11px] font-bold text-sky-500 dark:text-sky-400">→</span>
            <CarFront className="h-3.5 w-3.5 text-sky-700 dark:text-sky-300" />
            <span className="text-[10px] font-extrabold tabular-nums text-sky-800 dark:text-sky-200">
              {readyLabel} {formattedReady}
            </span>
          </div>
        </div>

        {/* Rotating info items */}
        <div className="relative h-6 overflow-hidden">
          {t.items.map((item, idx) => {
            const Icon = icons[idx];
            return (
              <div
                key={idx}
                className={cn(
                  "absolute inset-0 flex items-center gap-2 transition-all duration-700 ease-in-out",
                  idx === activeIndex
                    ? "translate-y-0 scale-100 opacity-100"
                    : idx < activeIndex
                    ? "-translate-y-full scale-95 opacity-0"
                    : "translate-y-full scale-95 opacity-0"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-300" />
                <span className="truncate text-xs font-semibold text-foreground/90 sm:text-sm">
                  {item}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress dots - min 24px touch targets via padding */}
        <div className="mt-1 flex items-center justify-center gap-0">
          {t.items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="flex items-center justify-center p-2"
              aria-label={`Info ${idx + 1}`}
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300",
                  idx === activeIndex
                    ? "w-5 bg-amber-600 shadow-sm shadow-amber-500/50"
                    : "w-2 bg-amber-300/60"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default InstantBookingInfo;
