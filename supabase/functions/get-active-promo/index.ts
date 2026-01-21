import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role to query promo codes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("promo_codes")
      .select("code, discount_percentage, is_active, valid_until")
      .eq("is_active", true)
      .eq("applies_to", "return_transfer")
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching active promo:", error);
      // Return default fallback
      return new Response(
        JSON.stringify({
          code: "MEET25RETURN",
          discountPercentage: 25,
          isActive: true,
          validUntil: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data) {
      return new Response(
        JSON.stringify({
          code: data.code,
          discountPercentage: data.discount_percentage,
          isActive: data.is_active,
          validUntil: data.valid_until,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No active promo found, return default
    return new Response(
      JSON.stringify({
        code: "MEET25RETURN",
        discountPercentage: 25,
        isActive: true,
        validUntil: null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error in get-active-promo:", err);
    return new Response(
      JSON.stringify({
        code: "MEET25RETURN",
        discountPercentage: 25,
        isActive: true,
        validUntil: null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
