import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface PromoCodeData {
  code: string;
  discountPercentage: number;
  isActive: boolean;
  validUntil: string | null;
}

interface PromoContextType {
  promoCode: PromoCodeData;
  loading: boolean;
  refetch: () => Promise<void>;
}

// Default fallback values
const DEFAULT_PROMO: PromoCodeData = {
  code: "MEET25RETURN",
  discountPercentage: 25,
  isActive: true,
  validUntil: null,
};

const PromoContext = createContext<PromoContextType>({
  promoCode: DEFAULT_PROMO,
  loading: true,
  refetch: async () => {},
});

export const usePromo = () => {
  const context = useContext(PromoContext);
  if (!context) {
    throw new Error("usePromo must be used within a PromoProvider");
  }
  return context;
};

export const PromoProvider = ({ children }: { children: ReactNode }) => {
  const [promoCode, setPromoCode] = useState<PromoCodeData>(DEFAULT_PROMO);
  const [loading, setLoading] = useState(true);

  const fetchActivePromo = async () => {
    try {
      // Use edge function for secure access (promo_codes table is not publicly readable)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-active-promo`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        console.error("Error fetching promo code:", response.statusText);
        return;
      }

      const data = await response.json();

      if (data) {
        setPromoCode({
          code: data.code,
          discountPercentage: data.discountPercentage,
          isActive: data.isActive,
          validUntil: data.validUntil,
        });
      }
    } catch (err) {
      console.error("Failed to fetch promo code:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivePromo();

    // Poll for updates every 5 minutes (since we can't use realtime without direct table access)
    const interval = setInterval(fetchActivePromo, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <PromoContext.Provider value={{ promoCode, loading, refetch: fetchActivePromo }}>
      {children}
    </PromoContext.Provider>
  );
};

// Helper function to get dynamic discount text for all languages
export const getLocalizedDiscountText = (
  discount: number,
  code: string,
  lang: string,
  validUntil?: string | null
): { heroSubtitle: string; returnTripDiscount: string; validUntilText: string } => {
  // Format the expiration date if provided
  const formatDate = (dateStr: string, locale: string): string => {
    try {
      const date = new Date(dateStr);
      const localeMap: Record<string, string> = {
        en: 'en-US',
        de: 'de-DE',
        fr: 'fr-FR',
        ru: 'ru-RU',
        it: 'it-IT',
        es: 'es-ES',
        ar: 'ar-SA',
        tr: 'tr-TR',
        uk: 'uk-UA',
        ja: 'ja-JP',
      };
      return date.toLocaleDateString(localeMap[locale] || 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formattedDate = validUntil ? formatDate(validUntil, lang) : '';

  const templates: Record<string, { heroSubtitle: string; returnTripDiscount: string; validUntilText: string }> = {
    en: {
      heroSubtitle: `✈️ ${discount}% OFF Round-Trip Transfers! 🎁 Code: ${code} | Turkey • Cyprus`,
      returnTripDiscount: `Book return trip and get ${discount}% OFF with code: ${code}`,
      validUntilText: validUntil ? `⏰ Valid until: ${formattedDate}` : '',
    },
    de: {
      heroSubtitle: `✈️ ${discount}% RABATT auf Hin- und Rücktransfers! 🎁 Code: ${code} | Türkei • Zypern`,
      returnTripDiscount: `Buchen Sie die Rückfahrt und erhalten Sie ${discount}% Rabatt mit Code: ${code}`,
      validUntilText: validUntil ? `⏰ Gültig bis: ${formattedDate}` : '',
    },
    fr: {
      heroSubtitle: `✈️ ${discount}% DE RÉDUCTION sur les transferts aller-retour! 🎁 Code: ${code} | Turquie • Chypre`,
      returnTripDiscount: `Réservez le trajet retour et obtenez ${discount}% de réduction avec le code: ${code}`,
      validUntilText: validUntil ? `⏰ Valable jusqu'au: ${formattedDate}` : '',
    },
    ru: {
      heroSubtitle: `✈️ СКИДКА ${discount}% на трансферы туда-обратно! 🎁 Код: ${code} | Турция • Кипр`,
      returnTripDiscount: `Забронируйте обратный трансфер и получите скидку ${discount}% с кодом: ${code}`,
      validUntilText: validUntil ? `⏰ Действует до: ${formattedDate}` : '',
    },
    it: {
      heroSubtitle: `✈️ ${discount}% DI SCONTO sui trasferimenti andata e ritorno! 🎁 Codice: ${code} | Turchia • Cipro`,
      returnTripDiscount: `Prenota il viaggio di ritorno e ottieni il ${discount}% di sconto con il codice: ${code}`,
      validUntilText: validUntil ? `⏰ Valido fino al: ${formattedDate}` : '',
    },
    es: {
      heroSubtitle: `✈️ ¡${discount}% DE DESCUENTO en traslados de ida y vuelta! 🎁 Código: ${code} | Turquía • Chipre`,
      returnTripDiscount: `Reserva el viaje de regreso y obtén ${discount}% de descuento con el código: ${code}`,
      validUntilText: validUntil ? `⏰ Válido hasta: ${formattedDate}` : '',
    },
    ar: {
      heroSubtitle: `✈️ خصم ${discount}% على الرحلات ذهابًا وإيابًا! 🎁 الكود: ${code} | تركيا • قبرص`,
      returnTripDiscount: `احجز رحلة العودة واحصل على خصم ${discount}% مع الكود: ${code}`,
      validUntilText: validUntil ? `⏰ صالح حتى: ${formattedDate}` : '',
    },
    tr: {
      heroSubtitle: `✈️ Gidiş-Dönüş Transferlerde %${discount} İNDİRİM! 🎁 Kod: ${code} | Türkiye • Kıbrıs`,
      returnTripDiscount: `Dönüş yolculuğu rezervasyonu yapın ve ${code} koduyla %${discount} indirim kazanın`,
      validUntilText: validUntil ? `⏰ Son Geçerlilik: ${formattedDate}` : '',
    },
    uk: {
      heroSubtitle: `✈️ ЗНИЖКА ${discount}% на трансфери туди-назад! 🎁 Код: ${code} | Туреччина • Кіпр`,
      returnTripDiscount: `Забронюйте зворотню поїздку та отримайте знижку ${discount}% з кодом: ${code}`,
      validUntilText: validUntil ? `⏰ Дійсний до: ${formattedDate}` : '',
    },
    ja: {
      heroSubtitle: `✈️ 往復送迎${discount}%オフ! 🎁 コード: ${code} | トルコ • キプロス`,
      returnTripDiscount: `復路予約で${discount}%オフ コード: ${code}`,
      validUntilText: validUntil ? `⏰ 有効期限: ${formattedDate}` : '',
    },
  };

  return templates[lang] || templates.en;
};

export default PromoContext;
