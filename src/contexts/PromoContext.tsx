import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  code: "MEET30RETURN",
  discountPercentage: 30,
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
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("promo_codes")
        .select("code, discount_percentage, is_active, valid_until")
        .eq("is_active", true)
        .eq("applies_to", "return_transfer")
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching promo code:", error);
        return;
      }

      if (data) {
        setPromoCode({
          code: data.code,
          discountPercentage: data.discount_percentage,
          isActive: data.is_active,
          validUntil: data.valid_until,
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

    // Subscribe to realtime changes on promo_codes table
    const channel = supabase
      .channel('promo-codes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promo_codes'
        },
        (payload) => {
          console.log('Promo code changed:', payload);
          // Refetch when any change occurs
          fetchActivePromo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      heroSubtitle: `✈️ ${discount}% OFF Round-Trip Transfers! 🎁 Code: ${code} | Turkey • Dubai • Cyprus`,
      returnTripDiscount: `Book return trip and get ${discount}% OFF with code: ${code}`,
      validUntilText: validUntil ? `⏰ Valid until: ${formattedDate}` : '',
    },
    de: {
      heroSubtitle: `✈️ ${discount}% RABATT auf Hin- und Rücktransfers! 🎁 Code: ${code} | Türkei • Dubai • Zypern`,
      returnTripDiscount: `Buchen Sie die Rückfahrt und erhalten Sie ${discount}% Rabatt mit Code: ${code}`,
      validUntilText: validUntil ? `⏰ Gültig bis: ${formattedDate}` : '',
    },
    fr: {
      heroSubtitle: `✈️ ${discount}% DE RÉDUCTION sur les transferts aller-retour! 🎁 Code: ${code} | Turquie • Dubai • Chypre`,
      returnTripDiscount: `Réservez le trajet retour et obtenez ${discount}% de réduction avec le code: ${code}`,
      validUntilText: validUntil ? `⏰ Valable jusqu'au: ${formattedDate}` : '',
    },
    ru: {
      heroSubtitle: `✈️ СКИДКА ${discount}% на трансферы туда-обратно! 🎁 Код: ${code} | Турция • Дубай • Кипр`,
      returnTripDiscount: `Забронируйте обратный трансфер и получите скидку ${discount}% с кодом: ${code}`,
      validUntilText: validUntil ? `⏰ Действует до: ${formattedDate}` : '',
    },
    it: {
      heroSubtitle: `✈️ ${discount}% DI SCONTO sui trasferimenti andata e ritorno! 🎁 Codice: ${code} | Turchia • Dubai • Cipro`,
      returnTripDiscount: `Prenota il viaggio di ritorno e ottieni il ${discount}% di sconto con il codice: ${code}`,
      validUntilText: validUntil ? `⏰ Valido fino al: ${formattedDate}` : '',
    },
    es: {
      heroSubtitle: `✈️ ¡${discount}% DE DESCUENTO en traslados de ida y vuelta! 🎁 Código: ${code} | Turquía • Dubái • Chipre`,
      returnTripDiscount: `Reserva el viaje de regreso y obtén ${discount}% de descuento con el código: ${code}`,
      validUntilText: validUntil ? `⏰ Válido hasta: ${formattedDate}` : '',
    },
    ar: {
      heroSubtitle: `✈️ خصم ${discount}% على الرحلات ذهابًا وإيابًا! 🎁 الكود: ${code} | تركيا • دبي • قبرص`,
      returnTripDiscount: `احجز رحلة العودة واحصل على خصم ${discount}% مع الكود: ${code}`,
      validUntilText: validUntil ? `⏰ صالح حتى: ${formattedDate}` : '',
    },
    tr: {
      heroSubtitle: `✈️ Gidiş-Dönüş Transferlerde %${discount} İNDİRİM! 🎁 Kod: ${code} | Türkiye • Dubai • Kıbrıs`,
      returnTripDiscount: `Dönüş yolculuğu rezervasyonu yapın ve ${code} koduyla %${discount} indirim kazanın`,
      validUntilText: validUntil ? `⏰ Son Geçerlilik: ${formattedDate}` : '',
    },
    uk: {
      heroSubtitle: `✈️ ЗНИЖКА ${discount}% на трансфери туди-назад! 🎁 Код: ${code} | Туреччина • Дубай • Кіпр`,
      returnTripDiscount: `Забронюйте зворотню поїздку та отримайте знижку ${discount}% з кодом: ${code}`,
      validUntilText: validUntil ? `⏰ Дійсний до: ${formattedDate}` : '',
    },
    ja: {
      heroSubtitle: `✈️ 往復送迎${discount}%オフ! 🎁 コード: ${code} | トルコ • ドバイ • キプロス`,
      returnTripDiscount: `復路予約で${discount}%オフ コード: ${code}`,
      validUntilText: validUntil ? `⏰ 有効期限: ${formattedDate}` : '',
    },
  };

  return templates[lang] || templates.en;
};

export default PromoContext;
