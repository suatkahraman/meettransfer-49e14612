import { memo, useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('promo_codes')
          .select('code, discount_percentage, valid_until, description')
          .eq('is_active', true)
          .eq('applies_to', 'return_transfer')
          .or(`valid_until.is.null,valid_until.gte.${now}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching promo code:', error);
          return;
        }

        if (data) {
          setPromoData(data);
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

  const expiryDate = formatExpiryDate(promoData.valid_until);

  return (
    // CLS fix: Use CSS animation instead of framer-motion y offset
    <div
      className="mb-3 relative overflow-hidden animate-fade-in"
    >
      <button
        type="button"
        onClick={handleClick}
        className="w-full text-left relative bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 rounded-xl px-3 md:px-4 py-2 md:py-2.5 backdrop-blur-sm hover:border-green-500/50 hover:from-green-500/15 hover:to-green-500/15 transition-all cursor-pointer group"
      >
        {/* Animated background shimmer - CSS only */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
        />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          {/* Top Row - Promo Info */}
          <div className="flex items-center justify-between md:justify-start gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg animate-bounce">
                🎁
              </span>
              <span className="font-bold text-green-700 dark:text-green-400 text-xs md:text-sm">
                {promoTranslations.return[language] || promoTranslations.return.EN}: 
                <span className="ml-1 text-sm md:text-base">%{promoData.discount_percentage} {promoTranslations.discount[language] || promoTranslations.discount.EN}</span>
              </span>
            </div>
            
            {/* Promo Code - Visible on all screens */}
            <div className="flex items-center gap-1 bg-green-500/20 rounded-lg px-2 py-1 group-hover:bg-green-500/30 transition-colors">
              <span className="text-[10px] md:text-xs text-green-700 dark:text-green-300 font-medium">
                {promoTranslations.code[language] || promoTranslations.code.EN}:
              </span>
              <code className="font-mono font-bold text-green-700 dark:text-green-300 text-xs md:text-sm">
                {promoData.code}
              </code>
            </div>
          </div>
          
          {/* Bottom Row - Turkey Only Note & Expiry Date */}
          <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 flex-wrap">
            {/* Turkey Only Note */}
            <div className="flex items-center gap-1 bg-amber-500/20 rounded-lg px-2 py-0.5">
              <span className="text-[9px] md:text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                🇹🇷 {promoTranslations.turkeyOnly[language] || promoTranslations.turkeyOnly.EN}
              </span>
            </div>
            
            {/* Expiry Date Display */}
            {expiryDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  {promoTranslations.validUntil[language] || promoTranslations.validUntil.EN}
                </span>
                <span className="text-[10px] md:text-xs font-bold text-foreground">
                  {expiryDate}
                </span>
              </div>
            )}
            
            {/* Click hint - Desktop only */}
            <span
              className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-medium hidden md:inline-flex items-center gap-1 animate-pulse"
            >
              {promoTranslations.click[language] || promoTranslations.click.EN}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
});

ReturnTripPromoBanner.displayName = "ReturnTripPromoBanner";
