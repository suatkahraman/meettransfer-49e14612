import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const CODE_RATE_LIMIT_MAX = 5; // Max attempts per code per IP
const CODE_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const codeRateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
function cleanupRateLimitStore(store: Map<string, RateLimitEntry>, windowMs: number) {
  const now = Date.now();
  if (store.size > 1000) {
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > windowMs * 2) {
        store.delete(key);
      }
    }
  }
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
}

function checkRateLimit(
  identifier: string,
  store: Map<string, RateLimitEntry>,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry) {
    store.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (now - entry.windowStart > windowMs) {
    store.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

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
  rate_limited: {
    en: "Too many requests. Please try again later.",
    tr: "Çok fazla istek. Lütfen daha sonra tekrar deneyin.",
    ru: "Слишком много запросов. Попробуйте позже.",
    ar: "طلبات كثيرة جدًا. يرجى المحاولة لاحقًا.",
    de: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
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

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const clientIP = getClientIP(req);
    
    // Cleanup stores periodically
    cleanupRateLimitStore(rateLimitStore, RATE_LIMIT_WINDOW_MS);
    cleanupRateLimitStore(codeRateLimitStore, CODE_RATE_LIMIT_WINDOW_MS);

    // Check general rate limit per IP
    const ipRateCheck = checkRateLimit(
      `ip:${clientIP}`,
      rateLimitStore,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS
    );

    if (!ipRateCheck.allowed) {
      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: "rate_limited",
          errorMessage: getErrorMessage("rate_limited", "en"),
        } as PromoValidationResponse),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(ipRateCheck.retryAfter),
          },
        }
      );
    }

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

    const normalizedCode = code.toUpperCase().trim();

    // Check rate limit for specific promo code attempts per IP
    const codeRateCheck = checkRateLimit(
      `code:${clientIP}:${normalizedCode}`,
      codeRateLimitStore,
      CODE_RATE_LIMIT_MAX,
      CODE_RATE_LIMIT_WINDOW_MS
    );

    if (!codeRateCheck.allowed) {
      return new Response(
        JSON.stringify({
          valid: false,
          errorCode: "rate_limited",
          errorMessage: getErrorMessage("rate_limited", language),
        } as PromoValidationResponse),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(codeRateCheck.retryAfter),
          },
        }
      );
    }

    // Use service role to query promo codes (not exposed to client)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
