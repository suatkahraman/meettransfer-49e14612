import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PromoCodeData {
  code: string;
  discountPercentage: number;
  isActive: boolean;
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
      const { data, error } = await supabase
        .from("promo_codes")
        .select("code, discount_percentage, is_active")
        .eq("is_active", true)
        .eq("applies_to", "return_transfer")
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
  lang: string
): { heroSubtitle: string; returnTripDiscount: string } => {
  const templates: Record<string, { heroSubtitle: string; returnTripDiscount: string }> = {
    en: {
      heroSubtitle: `✈️ ${discount}% OFF Round-Trip Transfers! 🎁 Code: ${code} | Turkey • Dubai • Cyprus`,
      returnTripDiscount: `Book return trip and get ${discount}% OFF with code: ${code}`,
    },
    de: {
      heroSubtitle: `✈️ ${discount}% RABATT auf Hin- und Rücktransfers! 🎁 Code: ${code} | Türkei • Dubai • Zypern`,
      returnTripDiscount: `Buchen Sie die Rückfahrt und erhalten Sie ${discount}% Rabatt mit Code: ${code}`,
    },
    fr: {
      heroSubtitle: `✈️ ${discount}% DE RÉDUCTION sur les transferts aller-retour! 🎁 Code: ${code} | Turquie • Dubai • Chypre`,
      returnTripDiscount: `Réservez le trajet retour et obtenez ${discount}% de réduction avec le code: ${code}`,
    },
    ru: {
      heroSubtitle: `✈️ СКИДКА ${discount}% на трансферы туда-обратно! 🎁 Код: ${code} | Турция • Дубай • Кипр`,
      returnTripDiscount: `Забронируйте обратный трансфер и получите скидку ${discount}% с кодом: ${code}`,
    },
    it: {
      heroSubtitle: `✈️ ${discount}% DI SCONTO sui trasferimenti andata e ritorno! 🎁 Codice: ${code} | Turchia • Dubai • Cipro`,
      returnTripDiscount: `Prenota il viaggio di ritorno e ottieni il ${discount}% di sconto con il codice: ${code}`,
    },
    es: {
      heroSubtitle: `✈️ ¡${discount}% DE DESCUENTO en traslados de ida y vuelta! 🎁 Código: ${code} | Turquía • Dubái • Chipre`,
      returnTripDiscount: `Reserva el viaje de regreso y obtén ${discount}% de descuento con el código: ${code}`,
    },
    ar: {
      heroSubtitle: `✈️ خصم ${discount}% على الرحلات ذهابًا وإيابًا! 🎁 الكود: ${code} | تركيا • دبي • قبرص`,
      returnTripDiscount: `احجز رحلة العودة واحصل على خصم ${discount}% مع الكود: ${code}`,
    },
    tr: {
      heroSubtitle: `✈️ Gidiş-Dönüş Transferlerde %${discount} İNDİRİM! 🎁 Kod: ${code} | Türkiye • Dubai • Kıbrıs`,
      returnTripDiscount: `Dönüş yolculuğu rezervasyonu yapın ve ${code} koduyla %${discount} indirim kazanın`,
    },
    uk: {
      heroSubtitle: `✈️ ЗНИЖКА ${discount}% на трансфери туди-назад! 🎁 Код: ${code} | Туреччина • Дубай • Кіпр`,
      returnTripDiscount: `Забронюйте зворотню поїздку та отримайте знижку ${discount}% з кодом: ${code}`,
    },
    ja: {
      heroSubtitle: `✈️ 往復送迎${discount}%オフ! 🎁 コード: ${code} | トルコ • ドバイ • キプロス`,
      returnTripDiscount: `復路予約で${discount}%オフ コード: ${code}`,
    },
  };

  return templates[lang] || templates.en;
};

export default PromoContext;
