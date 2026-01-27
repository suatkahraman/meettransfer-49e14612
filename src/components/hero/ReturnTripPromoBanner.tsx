import { memo, useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import type { Locale } from "date-fns";
import { loadLocale, getCachedLocale } from "@/utils/dateFnsLocaleLoader";

// Dynamic import for canvas-confetti - only load when needed
const triggerConfetti = async () => {
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FFA500', '#FF8C00']
  });
};

// Multi-language translations for promo banner
const promoTranslations: Record<string, Record<string, string>> = {
  return: { TR: "Dönüş", EN: "Return", DE: "Rückfahrt", FR: "Retour", RU: "Возврат", IT: "Ritorno", ES: "Regreso", AR: "العودة", UK: "Повернення", JA: "復路" },
  discount: { TR: "İndirim", EN: "OFF", DE: "Rabatt", FR: "Réduction", RU: "Скидка", IT: "Sconto", ES: "Descuento", AR: "خصم", UK: "Знижка", JA: "割引" },
  code: { TR: "Kod", EN: "Code", DE: "Code", FR: "Code", RU: "Код", IT: "Codice", ES: "Código", AR: "الرمز", UK: "Код", JA: "コード" },
  validUntil: { TR: "Son Geçerlilik:", EN: "Valid until:", DE: "Gültig bis:", FR: "Valable jusqu'au:", RU: "Действует до:", IT: "Valido fino al:", ES: "Válido hasta:", AR: "صالح حتى:", UK: "Дійсний до:", JA: "有効期限:" },
  click: { TR: "Tıkla →", EN: "Click →", DE: "Klicken →", FR: "Cliquer →", RU: "Нажмите →", IT: "Clicca →", ES: "Haz clic →", AR: "انقر ←", UK: "Натисніть →", JA: "クリック →" },
  turkeyOnly: { 
    TR: "Sadece Türkiye Havalimanları İçin", 
    EN: "Only for Turkey Airports", 
    DE: "Nur für Flughäfen in der Türkei", 
    FR: "Uniquement pour les aéroports de Turquie", 
    RU: "Только для аэропортов Турции", 
    IT: "Solo per gli aeroporti della Turchia", 
    ES: "Solo para aeropuertos de Turquía", 
    AR: "فقط لمطارات تركيا", 
    UK: "Тільки для аеропортів Туреччини", 
    JA: "トルコの空港のみ対象" 
  },
  promoApplied: { 
    TR: 'Promo kodu "{code}" uygulandı! Dönüş yolculuğunuzda %{discount} indirim kazandınız.',
    EN: 'Promo code "{code}" applied! You\'ll get {discount}% off on your return trip.',
    DE: 'Promo-Code "{code}" angewendet! Sie erhalten {discount}% Rabatt auf Ihre Rückfahrt.',
    FR: 'Code promo "{code}" appliqué ! Vous bénéficiez de {discount}% de réduction sur votre trajet retour.',
    RU: 'Промокод "{code}" применен! Вы получите скидку {discount}% на обратную поездку.',
    IT: 'Codice promo "{code}" applicato! Riceverai uno sconto del {discount}% sul viaggio di ritorno.',
    ES: '¡Código promocional "{code}" aplicado! Obtendrás {discount}% de descuento en tu viaje de regreso.',
    AR: 'تم تطبيق رمز الخصم "{code}"! ستحصل على خصم {discount}% على رحلة العودة.',
    UK: 'Промокод "{code}" застосовано! Ви отримаєте знижку {discount}% на зворотню поїздку.',
    JA: 'プロモコード「{code}」が適用されました！復路で{discount}%割引を受けられます。'
  }
};
interface ReturnTripPromoBannerProps {
  language: string;
  onApplyPromoCode?: (code: string) => void;
}

interface PromoCodeData {
  code: string;
  discount_percentage: number;
  valid_until: string | null;
  description: string | null;
}

export const ReturnTripPromoBanner = memo(({ language, onApplyPromoCode }: ReturnTripPromoBannerProps) => {
  const [promoData, setPromoData] = useState<PromoCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>(enUS);

  // Load locale dynamically based on language
  useEffect(() => {
    const localeKey = language === 'TR' ? 'tr' : 'en';
    const cached = getCachedLocale(localeKey);
    if (cached) {
      setLocale(cached);
    } else {
      loadLocale(localeKey).then(setLocale);
    }
  }, [language]);

  useEffect(() => {
    const fetchPromoCode = async () => {
      try {
        // Promo codes are not publicly readable; fetch via backend function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-active-promo`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch promo (${response.status})`);
        }

        const data = await response.json();
        if (data?.code && data?.isActive) {
          setPromoData({
            code: data.code,
            discount_percentage: Number(data.discountPercentage ?? 0),
            valid_until: data.validUntil ?? null,
            description: null,
          });
        }
      } catch (err) {
        console.error('Failed to fetch promo code:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromoCode();
  }, []);

  const handleClick = () => {
    if (onApplyPromoCode && promoData) {
      onApplyPromoCode(promoData.code);
      
      // Confetti animation - dynamically imported
      triggerConfetti();
      
      const message = (promoTranslations.promoApplied[language] || promoTranslations.promoApplied.EN)
        .replace('{code}', promoData.code)
        .replace('{discount}', String(promoData.discount_percentage));
      toast.success(message);
    }
  };

  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return format(date, 'dd.MM.yyyy', { locale });
    } catch {
      return null;
    }
  };

  // CLS fix: Reserve space with min-height even during loading
  // Don't render if no promo data, but show placeholder during loading
  if (!promoData) {
    if (isLoading) {
      // Reserve space during loading to prevent CLS
      return <div className="mb-3 h-[52px] md:h-[48px]" aria-hidden="true" />;
    }
    return null;
  }

  return (
    <div className="mb-2 relative overflow-hidden animate-fade-in">
      <button
        type="button"
        onClick={handleClick}
        className="w-full text-center relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 border border-black/20 rounded-full px-4 py-1.5 hover:from-yellow-500 hover:to-yellow-500 transition-all cursor-pointer group shadow-md"
      >
        <div className="relative flex items-center justify-center gap-2">
          <span className="text-base">🇹🇷</span>
          <span className="font-bold text-black text-xs md:text-sm">
            {promoTranslations.return[language] || promoTranslations.return.EN} %{promoData.discount_percentage} {promoTranslations.discount[language] || promoTranslations.discount.EN}
          </span>
        </div>
      </button>
    </div>
  );
});

ReturnTripPromoBanner.displayName = "ReturnTripPromoBanner";
