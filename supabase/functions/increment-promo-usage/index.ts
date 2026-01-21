import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Use service role to update promo codes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const normalizedCode = code.toUpperCase().trim();

    // Get current usage count
    const { data: promoCode, error: fetchError } = await supabaseAdmin
      .from("promo_codes")
      .select("id, usage_count")
      .eq("code", normalizedCode)
      .single();

    if (fetchError || !promoCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Promo code not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Increment usage
    const { error: updateError } = await supabaseAdmin
      .from("promo_codes")
      .update({ usage_count: (promoCode.usage_count || 0) + 1 })
      .eq("id", promoCode.id);

    if (updateError) {
      console.error("Error updating promo code usage:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update usage" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error in increment-promo-usage:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
