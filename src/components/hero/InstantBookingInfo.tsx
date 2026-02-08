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
      "Ready in 20 minutes!",
      "All cities in Turkey",
      "Fast & reliable drivers",
      "Book now, ride soon!",
    ],
  },
  TR: {
    headline: "Anında Araç Hizmeti",
    items: [
      "20 dakikada hazır!",
      "Türkiye genelinde hizmet",
      "Hızlı ve güvenilir şoförler",
      "Hemen rezervasyon yap!",
    ],
  },
  DE: {
    headline: "Sofortiger Fahrzeugservice",
    items: [
      "In 20 Minuten bereit!",
      "In der ganzen Türkei",
      "Schnelle & zuverlässige Fahrer",
      "Jetzt buchen!",
    ],
  },
  FR: {
    headline: "Service véhicule instantané",
    items: [
      "Prêt en 20 minutes !",
      "Dans toute la Turquie",
      "Chauffeurs rapides & fiables",
      "Réservez maintenant !",
    ],
  },
  RU: {
    headline: "Мгновенный вызов авто",
    items: [
      "Готово за 20 минут!",
      "По всей Турции",
      "Быстрые и надёжные водители",
      "Бронируйте сейчас!",
    ],
  },
  IT: {
    headline: "Servizio veicolo istantaneo",
    items: [
      "Pronto in 20 minuti!",
      "In tutta la Turchia",
      "Autisti veloci e affidabili",
      "Prenota ora!",
    ],
  },
  ES: {
    headline: "Servicio instantáneo",
    items: [
      "¡Listo en 20 minutos!",
      "En toda Turquía",
      "Conductores rápidos y confiables",
      "¡Reserva ahora!",
    ],
  },
  AR: {
    headline: "خدمة سيارة فورية",
    items: [
      "جاهزة خلال 20 دقيقة!",
      "في جميع مدن تركيا",
      "سائقون سريعون وموثوقون",
      "احجز الآن!",
    ],
  },
  UK: {
    headline: "Миттєвий виклик авто",
    items: [
      "Готово за 20 хвилин!",
      "По всій Туреччині",
      "Швидкі та надійні водії",
      "Бронюйте зараз!",
    ],
  },
  JA: {
    headline: "即時車両サービス",
    items: [
      "20分で準備完了！",
      "トルコ全都市対応",
      "迅速＆確実なドライバー",
      "今すぐ予約！",
    ],
  },
  PT: {
    headline: "Serviço instantâneo",
    items: [
      "Pronto em 20 minutos!",
      "Em toda a Turquia",
      "Motoristas rápidos e confiáveis",
      "Reserve agora!",
    ],
  },
};

const icons = [Zap, MapPin, CarFront, Clock];

const nowLabels: Record<string, string> = {
  EN: "NOW",
  TR: "ŞİMDİ",
  DE: "JETZT",
  FR: "MAINTENANT",
  RU: "СЕЙЧАС",
  IT: "ORA",
  ES: "AHORA",
  AR: "الآن",
  UK: "ЗАРАЗ",
  JA: "現在",
  PT: "AGORA",
};

const readyLabels: Record<string, string> = {
  EN: "READY",
  TR: "HAZIR",
  DE: "BEREIT",
  FR: "PRÊT",
  RU: "ГОТОВО",
  IT: "PRONTO",
  ES: "LISTO",
  AR: "جاهزة",
  UK: "ГОТОВО",
  JA: "準備完了",
  PT: "PRONTO",
};

const bookNowLabels: Record<string, string> = {
  EN: "BOOK NOW",
  TR: "HEMEN REZERVE ET",
  DE: "JETZT BUCHEN",
  FR: "RÉSERVER",
  RU: "ЗАБРОНИРОВАТЬ",
  IT: "PRENOTA ORA",
  ES: "RESERVAR",
  AR: "احجز الآن",
  UK: "БРОНЮВАТИ",
  JA: "今すぐ予約",
  PT: "RESERVE AGORA",
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
      <div className="px-3 py-3 sm:px-4 sm:py-3.5">
        {/* Headline + live clock */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-amber-600 shadow-sm shadow-amber-500/50" />
            </span>
            <span className="text-lg font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 sm:text-xl">
              {t.headline}
            </span>
          </div>

          {/* BOOK NOW + 🇹🇷 + READY */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* BOOK NOW badge with clock */}
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 shadow-lg shadow-amber-500/30 sm:px-4 sm:py-2.5 dark:from-amber-600 dark:to-amber-700">
              <Clock className="h-5 w-5 animate-pulse text-white sm:h-6 sm:w-6" />
              <span className="text-sm font-extrabold uppercase text-white sm:text-base">
                {bookNowLabels[lang] || bookNowLabels.EN}
              </span>
              <span className="text-base font-bold tabular-nums text-amber-100 sm:text-lg">
                {formattedNow}
              </span>
            </div>

            {/* Arrow separator */}
            <div className="flex flex-col items-center leading-none">
              <span className="text-base" role="img" aria-label="Turkey">🇹🇷</span>
              <span className="animate-pulse text-3xl font-black text-amber-600 drop-shadow-md dark:text-amber-400 sm:text-4xl">⟶</span>
            </div>

            {/* READY badge with car */}
            <div className="flex items-center gap-2 rounded-xl border-2 border-sky-400 bg-gradient-to-r from-sky-100 to-sky-50 px-3 py-2 shadow-lg shadow-sky-400/20 sm:px-4 sm:py-2.5 dark:border-sky-500 dark:from-sky-900/60 dark:to-sky-800/40">
              <CarFront className="h-6 w-6 text-sky-700 dark:text-sky-300 sm:h-7 sm:w-7" />
              <span className="text-sm font-extrabold uppercase text-sky-800 dark:text-sky-200 sm:text-base">
                {readyLabel}
              </span>
              <span className="text-base font-bold tabular-nums text-sky-700 dark:text-sky-300 sm:text-lg">
                {formattedReady}
              </span>
            </div>
          </div>
        </div>

        {/* Rotating info items */}
        <div className="relative h-8 overflow-hidden sm:h-9">
          {t.items.map((item, idx) => {
            const Icon = icons[idx];
            return (
              <div
                key={idx}
                className={cn(
                  "absolute inset-0 flex items-center gap-2.5 transition-all duration-700 ease-in-out",
                  idx === activeIndex
                    ? "translate-y-0 scale-100 opacity-100"
                    : idx < activeIndex
                    ? "-translate-y-full scale-95 opacity-0"
                    : "translate-y-full scale-95 opacity-0"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-300 sm:h-6 sm:w-6" />
                <span className="truncate text-base font-bold text-foreground/90 sm:text-lg">
                  {item}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress dots */}
        <div className="mt-1.5 flex items-center justify-center gap-0">
          {t.items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="flex items-center justify-center p-2"
              aria-label={`Info ${idx + 1}`}
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all duration-300",
                  idx === activeIndex
                    ? "w-6 bg-amber-600 shadow-sm shadow-amber-500/50"
                    : "w-2.5 bg-amber-300/60"
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
