import { useState, useEffect } from "react";

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  description: string | null;
  applies_to: string;
  is_active: boolean;
  valid_until: string | null;
}

export const useActivePromoCode = (appliesTo: string = "return_transfer") => {
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivePromoCode = async () => {
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
          throw new Error("Failed to fetch promo code");
        }

        const data = await response.json();

        if (data && data.code) {
          setPromoCode({
            id: "server",
            code: data.code,
            discount_percentage: data.discountPercentage,
            description: null,
            applies_to: appliesTo,
            is_active: data.isActive,
            valid_until: data.validUntil,
          });
        } else {
          setPromoCode(null);
        }
      } catch (err: any) {
        console.error("Error fetching promo code:", err);
        setError(err.message);
        // Fallback to hardcoded value if edge function fails
        setPromoCode({
          id: "fallback",
          code: "MEET25RETURN",
          discount_percentage: 25,
          description: null,
          applies_to: "return_transfer",
          is_active: true,
          valid_until: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActivePromoCode();
  }, [appliesTo]);

  return { promoCode, loading, error };
};

export type PromoValidationResult = {
  valid: true;
  discount: number;
  appliesTo: string;
  validUntil: string | null;
} | {
  valid: false;
  errorCode: 'not_found' | 'not_active' | 'not_started' | 'expired' | 'max_usage_reached' | 'error';
  errorMessage: string;
};

export const getPromoErrorMessage = (errorCode: string, lang: string = 'en'): string => {
  const messages: Record<string, Record<string, string>> = {
    not_found: {
      en: "Promo code not found",
      tr: "Promosyon kodu bulunamadı",
      de: "Aktionscode nicht gefunden",
      fr: "Code promo introuvable",
      ru: "Промокод не найден",
      it: "Codice promo non trovato",
      es: "Código promocional no encontrado",
      ar: "لم يتم العثور على الرمز الترويجي",
      uk: "Промокод не знайдено",
      ja: "プロモコードが見つかりません",
    },
    not_active: {
      en: "This promo code is no longer active",
      tr: "Bu promosyon kodu artık aktif değil",
      de: "Dieser Aktionscode ist nicht mehr aktiv",
      fr: "Ce code promo n'est plus actif",
      ru: "Этот промокод больше не активен",
      it: "Questo codice promo non è più attivo",
      es: "Este código promocional ya no está activo",
      ar: "هذا الرمز الترويجي لم يعد نشطًا",
      uk: "Цей промокод більше не активний",
      ja: "このプロモコードは無効です",
    },
    not_started: {
      en: "This promo code is not yet valid",
      tr: "Bu promosyon kodu henüz geçerli değil",
      de: "Dieser Aktionscode ist noch nicht gültig",
      fr: "Ce code promo n'est pas encore valide",
      ru: "Этот промокод еще не действителен",
      it: "Questo codice promo non è ancora valido",
      es: "Este código promocional aún no es válido",
      ar: "هذا الرمز الترويجي غير صالح بعد",
      uk: "Цей промокод ще не дійсний",
      ja: "このプロモコードはまだ有効ではありません",
    },
    expired: {
      en: "This promo code has expired",
      tr: "Bu promosyon kodunun süresi dolmuş",
      de: "Dieser Aktionscode ist abgelaufen",
      fr: "Ce code promo a expiré",
      ru: "Срок действия этого промокода истек",
      it: "Questo codice promo è scaduto",
      es: "Este código promocional ha caducado",
      ar: "انتهت صلاحية هذا الرمز الترويجي",
      uk: "Термін дії цього промокоду закінчився",
      ja: "このプロモコードは期限切れです",
    },
    max_usage_reached: {
      en: "This promo code has reached its maximum usage limit",
      tr: "Bu promosyon kodu maksimum kullanım limitine ulaştı",
      de: "Dieser Aktionscode hat seine maximale Nutzungsgrenze erreicht",
      fr: "Ce code promo a atteint sa limite d'utilisation maximale",
      ru: "Этот промокод достиг максимального лимита использования",
      it: "Questo codice promo ha raggiunto il limite massimo di utilizzo",
      es: "Este código promocional ha alcanzado su límite máximo de uso",
      ar: "وصل هذا الرمز الترويجي إلى الحد الأقصى للاستخدام",
      uk: "Цей промокод досяг максимального ліміту використання",
      ja: "このプロモコードは使用上限に達しました",
    },
    error: {
      en: "Error validating promo code",
      tr: "Promosyon kodu doğrulanırken hata oluştu",
      de: "Fehler bei der Validierung des Aktionscodes",
      fr: "Erreur lors de la validation du code promo",
      ru: "Ошибка при проверке промокода",
      it: "Errore durante la convalida del codice promo",
      es: "Error al validar el código promocional",
      ar: "خطأ في التحقق من الرمز الترويجي",
      uk: "Помилка перевірки промокоду",
      ja: "プロモコードの検証エラー",
    },
  };

  return messages[errorCode]?.[lang] || messages[errorCode]?.['en'] || messages['error']['en'];
};

export const validatePromoCode = async (code: string, lang: string = 'en'): Promise<PromoValidationResult> => {
  try {
    // Use edge function for secure validation (promo_codes table is not publicly readable)
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-promo-code`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ code, language: lang }),
      }
    );

    if (!response.ok) {
      console.error("Error validating promo code:", response.statusText);
      return {
        valid: false,
        errorCode: 'error',
        errorMessage: getPromoErrorMessage('error', lang),
      };
    }

    const result = await response.json();

    if (result.valid) {
      return {
        valid: true,
        discount: result.discount,
        appliesTo: result.appliesTo,
        validUntil: result.validUntil,
      };
    } else {
      return {
        valid: false,
        errorCode: result.errorCode || 'error',
        errorMessage: result.errorMessage || getPromoErrorMessage(result.errorCode || 'error', lang),
      };
    }
  } catch (err) {
    console.error("Error validating promo code:", err);
    return {
      valid: false,
      errorCode: 'error',
      errorMessage: getPromoErrorMessage('error', lang),
    };
  }
};

export const incrementPromoCodeUsage = async (code: string): Promise<boolean> => {
  try {
    // Use edge function to increment usage (requires server-side access)
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/increment-promo-usage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ code }),
      }
    );

    return response.ok;
  } catch (err) {
    console.error("Error incrementing promo code usage:", err);
    return false;
  }
};
