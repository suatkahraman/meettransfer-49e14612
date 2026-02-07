import { memo, useEffect, useState } from "react";
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

export const InstantBookingInfo = memo(function InstantBookingInfo({
  language,
  className,
}: InstantBookingInfoProps) {
  const lang = language.toUpperCase() as keyof typeof translations;
  const t = translations[lang] || translations.EN;
  const isRTL = language.toUpperCase() === "AR";

  // Rotate through items one at a time
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % t.items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [t.items.length]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 via-background to-emerald-50/80 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/20",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="px-3 py-2.5 sm:px-4 sm:py-3">
        {/* Headline with pulse dot */}
        <div className="mb-2 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t.headline}
          </span>
        </div>

        {/* Rotating info items */}
        <div className="relative h-6 overflow-hidden">
          {t.items.map((item, idx) => {
            const Icon = icons[idx];
            return (
              <div
                key={idx}
                className={cn(
                  "absolute inset-0 flex items-center gap-2 transition-all duration-500",
                  idx === activeIndex
                    ? "translate-y-0 opacity-100"
                    : idx < activeIndex
                    ? "-translate-y-full opacity-0"
                    : "translate-y-full opacity-0"
                )}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate text-xs font-medium text-foreground/80 sm:text-sm">
                  {item}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress dots */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {t.items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                idx === activeIndex
                  ? "w-4 bg-emerald-500"
                  : "w-1.5 bg-emerald-300/50 hover:bg-emerald-300"
              )}
              aria-label={`Info ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default InstantBookingInfo;
