import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function analyzeSimple(pickup: string, dropoff: string) {
  const s = (pickup + " " + dropoff).toLowerCase();

  let airport: string | null = null;
  if (/istanbul airport|\bist\b/i.test(s)) airport = "Istanbul Airport (IST)";
  else if (/sabiha|gokcen|\bsaw\b/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
  else if (/antalya.*airport|\bayt\b/i.test(s)) airport = "Antalya Airport (AYT)";
  else if (/bodrum|milas|\bbjv\b/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
  else if (/dalaman|\bdlm\b/i.test(s)) airport = "Dalaman Airport (DLM)";
  else if (/adnan menderes|\badb\b/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";

  let city: string | null = null;
  if (/istanbul|\bist\b|\bsaw\b/i.test(s)) city = "Istanbul";
  else if (/antalya|\bayt\b|alanya|belek/i.test(s)) city = "Antalya";
  else if (/bodrum|\bbjv\b/i.test(s)) city = "Bodrum";
  else if (/dalaman|\bdlm\b|fethiye|marmaris/i.test(s)) city = "Dalaman";
  else if (/izmir|\badb\b|cesme/i.test(s)) city = "Izmir";

  const district = pickup.split(",")[0]?.trim() || null;

  return { airport, city, district };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { pickup, dropoff, vehicle_type, price, price_currency } = await req.json();

    if (!pickup || !dropoff || !vehicle_type || !price) {
      return new Response(JSON.stringify({ success: false, error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { airport, city, district } = analyzeSimple(pickup, dropoff);

    if (airport && city && district) {
      const { data: existing } = await supabase
        .from("region_prices")
        .select("id")
        .eq("airport", airport)
        .eq("city", city)
        .eq("district", district)
        .eq("vehicle_type", vehicle_type)
        .eq("is_active", true)
        .maybeSingle();

      if (existing) {
        await supabase.from("region_prices").update({ price, price_currency, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("region_prices").insert({ airport, city, district, vehicle_type, price, price_currency, is_active: true });
      }

      return new Response(JSON.stringify({ success: true, saved_location: `${airport} → ${city}/${district}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: false, error: "Route not analysed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("save-manual-price error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
