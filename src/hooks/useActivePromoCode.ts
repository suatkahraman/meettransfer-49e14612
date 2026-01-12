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
          code: "MEET30RETURN",
          discount_percentage: 30,
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

export const validatePromoCode = async (code: string): Promise<{ valid: boolean; discount: number; appliesTo: string; validUntil: string | null } | null> => {
  try {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("discount_percentage, applies_to, is_active, valid_from, valid_until, max_usage, usage_count")
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error validating promo code:", error);
      return null;
    }

    if (!data) {
      console.log("Promo code not found:", code);
      return null;
    }

    const now = new Date();

    // Check validity dates
    if (data.valid_from && new Date(data.valid_from) > now) {
      console.log("Promo code not yet valid:", data.valid_from);
      return null;
    }
    if (data.valid_until && new Date(data.valid_until) < now) {
      console.log("Promo code expired:", data.valid_until);
      return null;
    }

    // Check max usage
    if (data.max_usage && data.usage_count >= data.max_usage) {
      console.log("Promo code max usage reached:", data.usage_count, "/", data.max_usage);
      return null;
    }

    return {
      valid: true,
      discount: data.discount_percentage,
      appliesTo: data.applies_to,
      validUntil: data.valid_until,
    };
  } catch (err) {
    console.error("Error validating promo code:", err);
    return null;
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
