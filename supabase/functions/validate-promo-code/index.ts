import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PromoValidationRequest {
  code: string;
  language?: string;
}

interface PromoValidationResponse {
  valid: boolean;
  discount?: number;
  appliesTo?: string;
  validUntil?: string | null;
  errorCode?: string;
  errorMessage?: string;
}

const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  not_found: {
    en: "Invalid promo code",
    tr: "Geçersiz promosyon kodu",
    ru: "Недействительный промокод",
    ar: "رمز ترويجي غير صالح",
    de: "Ungültiger Promo-Code",
  },
  not_active: {
    en: "This promo code is no longer active",
    tr: "Bu promosyon kodu artık aktif değil",
    ru: "Этот промокод больше не активен",
    ar: "رمز الترويج هذا لم يعد نشطًا",
    de: "Dieser Promo-Code ist nicht mehr aktiv",
  },
  expired: {
    en: "This promo code has expired",
    tr: "Bu promosyon kodunun süresi dolmuş",
    ru: "Срок действия промокода истёк",
    ar: "انتهت صلاحية هذا الرمز الترويجي",
    de: "Dieser Promo-Code ist abgelaufen",
  },
  not_started: {
    en: "This promo code is not yet active",
    tr: "Bu promosyon kodu henüz aktif değil",
    ru: "Этот промокод ещё не активен",
    ar: "هذا الرمز الترويجي غير نشط بعد",
    de: "Dieser Promo-Code ist noch nicht aktiv",
  },
  max_usage_reached: {
    en: "This promo code has reached its usage limit",
    tr: "Bu promosyon kodu kullanım limitine ulaştı",
    ru: "Достигнут лимит использования промокода",
    ar: "وصل هذا الرمز الترويجي إلى حد الاستخدام",
    de: "Dieser Promo-Code hat sein Nutzungslimit erreicht",
  },
  error: {
    en: "Error validating promo code",
    tr: "Promosyon kodu doğrulanırken hata oluştu",
    ru: "Ошибка проверки промокода",
    ar: "خطأ في التحقق من الرمز الترويجي",
    de: "Fehler bei der Validierung des Promo-Codes",
  },
};

function getErrorMessage(errorCode: string, lang: string): string {
  const messages = ERROR_MESSAGES[errorCode];
  if (!messages) return ERROR_MESSAGES.error[lang] || ERROR_MESSAGES.error.en;
  return messages[lang] || messages.en;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language = "en" }: PromoValidationRequest = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          errorCode: "not_found",
          errorMessage: getErrorMessage("not_found", language)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to query promo codes (not exposed to client)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const normalizedCode = code.toUpperCase().trim();

    const { data: promoCode, error } = await supabaseAdmin
      .from("promo_codes")
      .select("id, code, discount_percentage, applies_to, is_active, valid_from, valid_until, max_usage, usage_count")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: "error",
          errorMessage: getErrorMessage("error", language),
        } as PromoValidationResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!promoCode) {
      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: "not_found",
          errorMessage: getErrorMessage("not_found", language),
        } as PromoValidationResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validation checks
    if (!promoCode.is_active) {
      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: "not_active",
          errorMessage: getErrorMessage("not_active", language),
        } as PromoValidationResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();

    if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: "not_started",
          errorMessage: getErrorMessage("not_started", language),
        } as PromoValidationResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: "expired",
          errorMessage: getErrorMessage("expired", language),
        } as PromoValidationResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (promoCode.max_usage && promoCode.usage_count >= promoCode.max_usage) {
      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: "max_usage_reached",
          errorMessage: getErrorMessage("max_usage_reached", language),
        } as PromoValidationResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Valid promo code - return only necessary info (not exposing internal details)
    return new Response(
      JSON.stringify({
        valid: true,
        discount: promoCode.discount_percentage,
        appliesTo: promoCode.applies_to,
        validUntil: promoCode.valid_until,
      } as PromoValidationResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error in validate-promo-code:", err);
    return new Response(
      JSON.stringify({
        valid: false,
        errorCode: "error",
        errorMessage: "An error occurred",
      } as PromoValidationResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
