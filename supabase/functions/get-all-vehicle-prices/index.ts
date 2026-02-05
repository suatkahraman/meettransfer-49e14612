import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// ----------------------------
// Inline helpers – minimal versions to avoid giant bundle.
// ----------------------------

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const dynamicCacheHeaders: Record<string, string> = {
  ...corsHeaders,
  "Cache-Control": "public, max-age=60, s-maxage=600, stale-while-revalidate=3600",
};

// ----- Rate limiting -----
type RateLimitConfig = { windowMs: number; max: number };
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIdentifier(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  const realIp = req.headers.get("x-real-ip");
  const xff = req.headers.get("x-forwarded-for");
  const ip = cfIp || realIp || (xff ? xff.split(",")[0].trim() : null) || "unknown";
  return ip;
}

function checkRateLimit(identifier: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now >= record.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs };
  }

  if (record.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: config.max - record.count, resetAt: record.resetAt };
}

// ----- Vehicle types -----
type VehicleTypeDef = { value: string; label: string; passengers: number; luggage: number };

const DEFAULT_VEHICLE_TYPES: VehicleTypeDef[] = [
  { value: "sedan", label: "Sedan", passengers: 3, luggage: 3 },
  { value: "standard-sedan", label: "Standard Sedan", passengers: 3, luggage: 3 },
  { value: "vip-mercedes", label: "VIP Mercedes", passengers: 3, luggage: 3 },
  { value: "minivan", label: "Minivan", passengers: 6, luggage: 6 },
  { value: "mercedes-vito", label: "Mercedes Vito", passengers: 7, luggage: 7 },
  { value: "mercedes-vip-vito", label: "VIP Mercedes Vito", passengers: 7, luggage: 7 },
  { value: "mercedes-sprinter", label: "Mercedes Sprinter", passengers: 12, luggage: 12 },
  { value: "minibus", label: "Minibus", passengers: 14, luggage: 14 },
];

const DUBAI_VEHICLE_TYPES: VehicleTypeDef[] = [
  { value: "dubai-private-sedan", label: "Dubai Private Sedan", passengers: 3, luggage: 3 },
  { value: "dubai-suburban-suv", label: "Dubai Suburban SUV", passengers: 5, luggage: 5 },
  { value: "dubai-v-class", label: "Dubai V-Class", passengers: 6, luggage: 6 },
  { value: "dubai-vip-sprinter", label: "Dubai VIP Sprinter", passengers: 12, luggage: 12 },
];

function detectRegionSimple(pickup: string, dropoff: string): "turkey" | "dubai" | "default" {
  const s = (pickup + " " + dropoff).toLowerCase();
  if (/dubai|uae|dxb/i.test(s)) return "dubai";
  if (/istanbul|antalya|ankara|bodrum|dalaman|izmir|cappadocia|turkey|turkiye/i.test(s)) return "turkey";
  return "default";
}

function vehicleTypesForRegion(region: "turkey" | "dubai" | "default"): VehicleTypeDef[] {
  return region === "dubai" ? DUBAI_VEHICLE_TYPES : DEFAULT_VEHICLE_TYPES;
}

// ----- Transfer analysis -----
function analyzeSimple(pickup: string, dropoff: string): { airport: string | null; city: string | null; district: string | null; direction: string } {
  const s = (pickup + " " + dropoff).toLowerCase();

  let airport: string | null = null;
  if (/istanbul airport|\bist\b/i.test(s)) airport = "Istanbul Airport (IST)";
  else if (/sabiha|gokcen|\bsaw\b/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
  else if (/antalya.*airport|\bayt\b/i.test(s)) airport = "Antalya Airport (AYT)";
  else if (/bodrum|milas|\bbjv\b/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
  else if (/dalaman|\bdlm\b/i.test(s)) airport = "Dalaman Airport (DLM)";
  else if (/adnan menderes|\badb\b/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";

  const detectedAirportInDropoff = dropoff.toLowerCase().includes(airport?.toLowerCase()?.slice(0, 6) || "");
  const direction = detectedAirportInDropoff ? "to_airport" : airport ? "from_airport" : "city_to_city";

  // Simple city match
  let city: string | null = null;
  if (/istanbul|\bist\b|\bsaw\b/i.test(s)) city = "Istanbul";
  else if (/antalya|\bayt\b|alanya|belek|side/i.test(s)) city = "Antalya";
  else if (/bodrum|\bbjv\b/i.test(s)) city = "Bodrum";
  else if (/dalaman|\bdlm\b|fethiye|marmaris/i.test(s)) city = "Dalaman";
  else if (/izmir|\badb\b|cesme/i.test(s)) city = "Izmir";

  // District: extract first comma segment as fallback
  const district = pickup.split(",")[0]?.trim() || null;

  return { airport, city, district, direction };
}

// ----- Currency conversion -----
async function convertCurrency(amount: number, from: string, to: string): Promise<{ amount: number; rate: number }> {
  if (from === to) return { amount, rate: 1 };

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    if (res.ok) {
      const data = await res.json();
      const rate = data.rates?.[to];
      if (rate) return { amount: Math.ceil(amount * rate), rate };
    }
  } catch {}
  return { amount, rate: 1 };
}

// ----- HANDLER -----
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit
  const clientId = getClientIdentifier(req);
  const rl = checkRateLimit(clientId, { windowMs: 60_000, max: 90 });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { pickup, dropoff, customerCurrency }: { pickup: string; dropoff: string; customerCurrency?: string } = await req.json();

    const region = detectRegionSimple(pickup, dropoff);
    const vehicleTypes = vehicleTypesForRegion(region);
    const { airport, city, district, direction } = analyzeSimple(pickup, dropoff);

    if (!city && !airport) {
      return new Response(
        JSON.stringify({ prices: vehicleTypes.map(v => ({ ...v, price: null, currency: customerCurrency || "EUR", available: false })), matched: false }),
        { headers: dynamicCacheHeaders }
      );
    }

    const prices: any[] = [];

    for (const vt of vehicleTypes) {
      // Query region_prices
      let query = supabase
        .from("region_prices")
        .select("price, price_currency")
        .eq("vehicle_type", vt.value)
        .eq("is_active", true);

      if (city) query = query.eq("city", city);
      if (airport) query = query.eq("airport", airport);
      if (district) query = query.eq("district", district);

      const { data: exactData } = await query.limit(1);

      // Fallback if no district match
      let found = exactData?.[0] ?? null;
      if (!found && city && airport) {
        const { data: cityApt } = await supabase
          .from("region_prices")
          .select("price, price_currency")
          .eq("vehicle_type", vt.value)
          .eq("city", city)
          .eq("airport", airport)
          .eq("is_active", true)
          .limit(1);
        found = cityApt?.[0] ?? null;
      }

      if (found) {
        let finalPrice = found.price;
        let finalCurrency = found.price_currency;
        if (customerCurrency && customerCurrency !== finalCurrency) {
          const c = await convertCurrency(found.price, finalCurrency, customerCurrency);
          finalPrice = c.amount;
          finalCurrency = customerCurrency;
        }
        prices.push({ vehicleType: vt.value, vehicleLabel: vt.label, price: Math.ceil(finalPrice), currency: finalCurrency, passengers: vt.passengers, luggage: vt.luggage, available: true });
      } else {
        prices.push({ vehicleType: vt.value, vehicleLabel: vt.label, price: null, currency: customerCurrency || "EUR", passengers: vt.passengers, luggage: vt.luggage, available: false });
      }
    }

    return new Response(
      JSON.stringify({
        prices,
        matched: prices.some(p => p.available),
        matchedCity: city,
        matchedDistrict: district,
        matchedAirport: airport,
        direction,
        region,
        isDubai: region === "dubai",
      }),
      { headers: dynamicCacheHeaders }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("get-all-vehicle-prices error:", msg);
    return new Response(JSON.stringify({ error: msg, prices: [] }), { status: 500, headers: corsHeaders });
  }
});
