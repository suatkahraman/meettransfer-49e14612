import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        const now = new Date().toISOString();
        
        const { data, error: fetchError } = await supabase
          .from("promo_codes")
          .select("*")
          .eq("is_active", true)
          .or(`applies_to.eq.${appliesTo},applies_to.eq.all`)
          .or(`valid_from.is.null,valid_from.lte.${now}`)
          .or(`valid_until.is.null,valid_until.gte.${now}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError;
        }

        setPromoCode(data || null);
      } catch (err: any) {
        console.error("Error fetching promo code:", err);
        setError(err.message);
        // Fallback to hardcoded value if DB fetch fails
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
    // First check if code exists at all (including inactive)
    const { data: anyCode, error: anyError } = await supabase
      .from("promo_codes")
      .select("discount_percentage, applies_to, is_active, valid_from, valid_until, max_usage, usage_count")
      .eq("code", code.toUpperCase().trim())
      .maybeSingle();

    if (anyError) {
      console.error("Error validating promo code:", anyError);
      return {
        valid: false,
        errorCode: 'error',
        errorMessage: getPromoErrorMessage('error', lang),
      };
    }

    if (!anyCode) {
      return {
        valid: false,
        errorCode: 'not_found',
        errorMessage: getPromoErrorMessage('not_found', lang),
      };
    }

    // Check if active
    if (!anyCode.is_active) {
      return {
        valid: false,
        errorCode: 'not_active',
        errorMessage: getPromoErrorMessage('not_active', lang),
      };
    }

    const now = new Date();

    // Check if started
    if (anyCode.valid_from && new Date(anyCode.valid_from) > now) {
      return {
        valid: false,
        errorCode: 'not_started',
        errorMessage: getPromoErrorMessage('not_started', lang),
      };
    }

    // Check if expired
    if (anyCode.valid_until && new Date(anyCode.valid_until) < now) {
      return {
        valid: false,
        errorCode: 'expired',
        errorMessage: getPromoErrorMessage('expired', lang),
      };
    }

    // Check max usage
    if (anyCode.max_usage && anyCode.usage_count >= anyCode.max_usage) {
      return {
        valid: false,
        errorCode: 'max_usage_reached',
        errorMessage: getPromoErrorMessage('max_usage_reached', lang),
      };
    }

    return {
      valid: true,
      discount: anyCode.discount_percentage,
      appliesTo: anyCode.applies_to,
      validUntil: anyCode.valid_until,
    };
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
    const { data, error } = await supabase
      .from("promo_codes")
      .select("id, usage_count")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (error || !data) return false;

    const { error: updateError } = await supabase
      .from("promo_codes")
      .update({ usage_count: (data.usage_count || 0) + 1 })
      .eq("id", data.id);

    return !updateError;
  } catch (err) {
    console.error("Error incrementing promo code usage:", err);
    return false;
  }
};
