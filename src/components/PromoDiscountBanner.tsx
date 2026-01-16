import { useActivePromoCode } from "@/hooks/useActivePromoCode";

interface PromoDiscountBannerProps {
  className?: string;
}

export const PromoDiscountBanner = ({ className }: PromoDiscountBannerProps) => {
  const { promoCode, loading } = useActivePromoCode("return_transfer");

  if (loading || !promoCode) {
    return null;
  }

  return (
    <span className={className}>
      {promoCode.discount_percentage}% OFF | Code: {promoCode.code}
    </span>
  );
};

// Helper function to get dynamic discount text
export const getDiscountText = (
  discount: number,
  code: string,
  language: string = "en"
): string => {
  const templates: Record<string, string> = {
    en: `Book return trip and get ${discount}% OFF with code: ${code}`,
    de: `Buchen Sie die Rückfahrt und erhalten Sie ${discount}% Rabatt mit Code: ${code}`,
    fr: `Réservez le trajet retour et obtenez ${discount}% de réduction avec le code: ${code}`,
    ru: `Забронируйте обратный трансфер и получите скидку ${discount}% с кодом: ${code}`,
    it: `Prenota il viaggio di ritorno e ottieni il ${discount}% di sconto con il codice: ${code}`,
    es: `Reserva el viaje de regreso y obtén ${discount}% de descuento con el código: ${code}`,
    ar: `احجز رحلة العودة واحصل على خصم ${discount}% مع الكود: ${code}`,
    tr: `Dönüş yolculuğu rezervasyonu yapın ve ${code} koduyla %${discount} indirim kazanın`,
    uk: `Забронюйте зворотню поїздку та отримайте знижку ${discount}% з кодом: ${code}`,
    ja: `復路予約で${discount}%オフ コード: ${code}`,
  };

  return templates[language] || templates.en;
};

export const getHeroSubtitleDiscount = (
  discount: number,
  code: string,
  language: string = "en"
): string => {
  const templates: Record<string, string> = {
    en: `✈️ ${discount}% OFF Round-Trip Transfers! 🎁 Code: ${code} | Turkey • Dubai • Cyprus • Germany • Greece`,
    de: `✈️ ${discount}% RABATT auf Hin- und Rücktransfers! 🎁 Code: ${code} | Türkei • Dubai • Zypern • Deutschland • Griechenland`,
    fr: `✈️ ${discount}% DE RÉDUCTION sur les transferts aller-retour! 🎁 Code: ${code} | Turquie • Dubai • Chypre • Allemagne • Grèce`,
    ru: `✈️ СКИДКА ${discount}% на трансферы туда-обратно! 🎁 Код: ${code} | Турция • Дубай • Кипр • Германия • Греция`,
    it: `✈️ ${discount}% DI SCONTO sui trasferimenti andata e ritorno! 🎁 Codice: ${code} | Turchia • Dubai • Cipro • Germania • Grecia`,
    es: `✈️ ¡${discount}% DE DESCUENTO en traslados de ida y vuelta! 🎁 Código: ${code} | Turquía • Dubái • Chipre • Alemania • Grecia`,
    ar: `✈️ خصم ${discount}% على الرحلات ذهابًا وإيابًا! 🎁 الكود: ${code} | تركيا • دبي • قبرص • ألمانيا • اليونان`,
    tr: `✈️ Gidiş-Dönüş Transferlerde %${discount} İNDİRİM! 🎁 Kod: ${code} | Türkiye • Dubai • Kıbrıs • Almanya • Yunanistan`,
    uk: `✈️ ЗНИЖКА ${discount}% на трансфери туди-назад! 🎁 Код: ${code} | Туреччина • Дубай • Кіпр • Німеччина • Греція`,
    ja: `✈️ 往復送迎${discount}%オフ! 🎁 コード: ${code} | トルコ • ドバイ • キプロス • ドイツ • ギリシャ`,
  };

  return templates[language] || templates.en;
};

export default PromoDiscountBanner;
