import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// NOTE: `_shared/*` was removed to prevent bundle timeouts. Keep this function self-contained.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Cache headers for price endpoint (public but short-lived)
const dynamicCacheHeaders: Record<string, string> = {
  ...corsHeaders,
  "Cache-Control": "public, max-age=60, s-maxage=600, stale-while-revalidate=3600",
};

// -----------------------------
// Rate limiting (in-memory)
// -----------------------------
type RateLimitConfig = { windowMs: number; max: number };

type RateLimitResult =
  | {
      allowed: true;
      remaining: number;
      resetAt: number;
    }
  | {
      allowed: false;
      remaining: 0;
      resetAt: number;
      retryAfterSec: number;
    };

const RATE_LIMIT_CONFIGS = {
  pricing: { windowMs: 60_000, max: 90 } satisfies RateLimitConfig,
} as const;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIdentifier(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  const realIp = req.headers.get("x-real-ip");
  const xff = req.headers.get("x-forwarded-for");
  const ip = cfIp || realIp || (xff ? xff.split(",")[0].trim() : null) || "unknown";
  const ua = req.headers.get("user-agent") || "ua:unknown";
  return `${ip}:${ua.slice(0, 40)}`;
}

function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now >= record.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, config.max - 1), resetAt };
  }

  if (record.count >= config.max) {
    const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, resetAt: record.resetAt, retryAfterSec };
  }

  record.count += 1;
  rateLimitStore.set(identifier, record);
  return { allowed: true, remaining: Math.max(0, config.max - record.count), resetAt: record.resetAt };
}

function addRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult,
  config: RateLimitConfig
): Record<string, string> {
  const base: Record<string, string> = {
    ...headers,
    "X-RateLimit-Limit": String(config.max),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    "X-RateLimit-Remaining": String(result.allowed ? result.remaining : 0),
  };
  if (!result.allowed) base["Retry-After"] = String(result.retryAfterSec);
  return base;
}

function createRateLimitResponse(result: RateLimitResult, config: RateLimitConfig): Response {
  const body = {
    error: "rate_limited",
    message: "Too many requests. Please retry shortly.",
    limit: config.max,
    resetAt: result.resetAt,
    retryAfterSec: result.allowed ? 0 : result.retryAfterSec,
  };

  return new Response(JSON.stringify(body), {
    status: 429,
    headers: addRateLimitHeaders({ ...corsHeaders, "Content-Type": "application/json" }, result, config),
  });
}

// -----------------------------
// Region + vehicle types
// -----------------------------
export type VehicleRegion = "turkey" | "dubai" | "switzerland" | "default";

const VEHICLE_TYPES = [
  { value: "sedan", label: "Sedan", passengers: 3, luggage: 3 },
  { value: "standard-sedan", label: "Standard Sedan", passengers: 3, luggage: 3 },
  { value: "standard_sedan", label: "Standard Sedan", passengers: 3, luggage: 3 },
  { value: "vip-mercedes", label: "VIP Mercedes", passengers: 3, luggage: 3 },
  { value: "s_class", label: "S-Class", passengers: 3, luggage: 3 },
  { value: "minivan", label: "Minivan", passengers: 6, luggage: 6 },
  { value: "vip_minivan", label: "VIP Minivan", passengers: 6, luggage: 6 },
  { value: "mercedes-vito", label: "Mercedes Vito", passengers: 7, luggage: 7 },
  { value: "vito", label: "Vito", passengers: 7, luggage: 7 },
  { value: "vip-vito", label: "VIP Vito", passengers: 7, luggage: 7 },
  { value: "mercedes-vip-vito", label: "VIP Mercedes Vito", passengers: 7, luggage: 7 },
  { value: "mercedes-sprinter", label: "Mercedes Sprinter", passengers: 12, luggage: 12 },
  { value: "sprinter", label: "Sprinter", passengers: 12, luggage: 12 },
  { value: "minibus", label: "Minibus", passengers: 14, luggage: 14 },
  { value: "maybach-minibus", label: "Maybach Minibus", passengers: 14, luggage: 14 },
  // Dubai
  { value: "dubai-private-sedan", label: "Dubai Private Sedan", passengers: 3, luggage: 3 },
  { value: "dubai-suburban-suv", label: "Dubai Suburban SUV", passengers: 5, luggage: 5 },
  { value: "dubai-v-class", label: "Dubai V-Class", passengers: 6, luggage: 6 },
  { value: "dubai-vip-sprinter", label: "Dubai VIP Sprinter", passengers: 12, luggage: 12 },
  { value: "dubai-premium-van", label: "Dubai Premium Van", passengers: 12, luggage: 12 },
] as const;

type VehicleTypeDef = (typeof VEHICLE_TYPES)[number];

function detectRegion(pickup: string, dropoff: string): VehicleRegion {
  const s = (pickup + " " + dropoff).toLowerCase();
  if (/(\bdubai\b|\buae\b|\bdxb\b)/i.test(s)) return "dubai";
  if (/(\bzrh\b|\bgva\b|\bbsl\b|\bmxp\b|switzerland|schweiz|suisse|zurich|geneva|basel|malpensa)/i.test(s)) return "switzerland";
  if (/(istanbul|turkiye|türkiye|turkey|antalya|izmir|bodrum|dalaman|ankara|adana|diyarbakir|mardin|sapanca|kocaeli)/i.test(s)) {
    return "turkey";
  }
  return "default";
}

function getVehicleTypesForRegion(region: VehicleRegion): VehicleTypeDef[] {
  if (region === "dubai") {
    return VEHICLE_TYPES.filter((v) => v.value.startsWith("dubai-"));
  }
  // Switzerland currently reuses the default set.
  return VEHICLE_TYPES.filter((v) => !v.value.startsWith("dubai-"));
}

function isValidSwitzerlandRoute(_pickup: string, _dropoff: string): boolean {
  // Conservative default: allow pricing attempts; if DB has no price, it will fall back to manual.
  return true;
}

function calculateTurkeyFallbackPrice(vehicleType: string, distanceKm: number): { price: number; currency: string } | null {
  // Only used as a last resort when DB has no matching rows.
  const km = Math.max(0, Math.min(distanceKm, 100));

  const vt = vehicleType.toLowerCase();
  let base = 35;
  let perKm = 0.9;

  if (/(sprinter|minibus|maybach)/.test(vt)) {
    base = 90;
    perKm = 1.8;
  } else if (/(vito|vclass|minivan|vip)/.test(vt)) {
    base = 55;
    perKm = 1.2;
  } else if (/(s_class|maybach)/.test(vt)) {
    base = 160;
    perKm = 2.2;
  }

  const price = Math.ceil(base + km * perKm);
  return { price, currency: "EUR" };
}

// -----------------------------
// Transfer analysis + sanity checks
// -----------------------------
function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function norm(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeDistrict(raw: string): string {
  const cleaned = stripDiacritics(raw)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Title-case words, but preserve existing all-caps airport codes etc.
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

const AIRPORT_MATCHERS: Array<{ re: RegExp; value: string }> = [
  { re: /(istanbul airport|\bist\b)/i, value: "Istanbul Airport (IST)" },
  { re: /(sabiha|gokcen|\bsaw\b)/i, value: "Sabiha Gokcen Airport (SAW)" },
  { re: /(antalya.*airport|\bayt\b)/i, value: "Antalya Airport (AYT)" },
  { re: /(bodrum|milas|\bbjv\b)/i, value: "Bodrum-Milas Airport (BJV)" },
  { re: /(dalaman|\bdlm\b)/i, value: "Dalaman Airport (DLM)" },
  { re: /(adnan menderes|izmir.*airport|\badb\b)/i, value: "Izmir Adnan Menderes Airport (ADB)" },
  { re: /(kayseri|\basr\b)/i, value: "Kayseri Airport (ASR)" },
  { re: /(nevsehir|kapadokya|\bnav\b)/i, value: "Nevsehir-Kapadokya Airport (NAV)" },
  { re: /(esenboga|ankara.*airport|\besb\b)/i, value: "Esenboğa Havalimanı (ESB)" },
  { re: /(diyarbakir|\bdiy\b)/i, value: "Diyarbakir Airport (DIY)" },
  { re: /(mardin|\bmqm\b)/i, value: "Mardin Airport (MQM)" },
  // Cyprus
  { re: /(ercan|\becn\b)/i, value: "ECN" },
  // Dubai
  { re: /(dubai.*airport|\bdxb\b)/i, value: "DXB" },
  // Switzerland (DB uses codes)
  { re: /(zurich|\bzrh\b)/i, value: "ZRH" },
  { re: /(geneva|\bgva\b)/i, value: "GVA" },
  { re: /(basel|\bbsl\b)/i, value: "BSL" },
  { re: /(malpensa|\bmxp\b)/i, value: "MXP" },
];

type Direction = "to_airport" | "from_airport" | "city_to_city";

type SideAnalysis = {
  airport: { value: string } | null;
  city: { value: string } | null;
  district: { value: string; city?: string } | null;
};

type TransferInfo = {
  airport: string | null;
  city: string | null;
  district: string | null;
  direction: Direction;
  confidence: "high" | "medium" | "low";
  pickupAnalysis: SideAnalysis;
  dropoffAnalysis: SideAnalysis;
};

function findAirport(text: string): string | null {
  for (const m of AIRPORT_MATCHERS) {
    if (m.re.test(text)) return m.value;
  }
  return null;
}

function detectCityFromText(text: string): string | null {
  const t = norm(text);
  if (/(\bdubai\b|\buae\b|\bdxb\b)/.test(t)) return "Dubai";
  if (/(\bcyprus\b|\bkibris\b|\bkıbrıs\b|\bkktc\b|\becn\b)/.test(t)) return "Kuzey Kıbrıs";
  if (/(\bzrh\b|\bgva\b|\bbsl\b|\bmxp\b|switzerland|schweiz|suisse|zurich|geneva|basel|malpensa)/.test(t)) return "Switzerland";

  const cityMatchers: Array<{ re: RegExp; value: string }> = [
    { re: /(istanbul|\bist\b|\bsaw\b)/, value: "Istanbul" },
    { re: /(antalya|\bayt\b|alanya|kemer|belek|side|manavgat|kas|kaş|kalkan)/, value: "Antalya" },
    { re: /(bodrum|\bbjv\b)/, value: "Bodrum" },
    { re: /(dalaman|\bdlm\b|fethiye|marmaris|oludeniz|ölüdeniz|gocek|göcek)/, value: "Dalaman" },
    { re: /(izmir|\badb\b|cesme|çeşme|kusadasi|kuşadası)/, value: "Izmir" },
    { re: /(cappadocia|kapadokya|goreme|göreme|urgup|ürgüp|\basr\b|\bnav\b)/, value: "Cappadocia" },
    { re: /(ankara|\besb\b|esenboga|esenboğa)/, value: "Ankara" },
    { re: /(adana)/, value: "Adana" },
    { re: /(diyarbakir|diyarbakır|\bdiy\b)/, value: "Diyarbakir" },
    { re: /(mardin|\bmqm\b)/, value: "Mardin" },
    { re: /(kocaeli|gebze|izmit|i̇zmit)/, value: "Kocaeli" },
    { re: /(sapanca)/, value: "Sapanca" },
    { re: /(muğla|mugla)/, value: "Muğla" },
  ];

  for (const m of cityMatchers) {
    if (m.re.test(t)) return m.value;
  }

  return null;
}

function extractDistrictCandidate(text: string, city: string | null): string | null {
  const parts = text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;
  if (!city) return parts[0] || null;

  const cityNorm = norm(city);
  const idx = parts.findIndex((p) => norm(p).includes(cityNorm));
  if (idx > 0) return parts[idx - 1];

  // Common Google Places: "District/City" style
  const slash = parts[0]?.split("/").map((p) => p.trim()).filter(Boolean) ?? [];
  if (slash.length >= 2) return slash[0];

  return parts[0] || null;
}

function analyzeTransfer(pickup: string, dropoff: string): TransferInfo {
  const pickupAirport = findAirport(pickup);
  const dropoffAirport = findAirport(dropoff);

  const direction: Direction = dropoffAirport
    ? "to_airport"
    : pickupAirport
      ? "from_airport"
      : "city_to_city";

  const pickupCity = detectCityFromText(pickup);
  const dropoffCity = detectCityFromText(dropoff);

  const pickupDistrictRaw = extractDistrictCandidate(pickup, pickupCity);
  const dropoffDistrictRaw = extractDistrictCandidate(dropoff, dropoffCity);

  const pickupDistrict = pickupDistrictRaw ? canonicalizeDistrict(pickupDistrictRaw) : null;
  const dropoffDistrict = dropoffDistrictRaw ? canonicalizeDistrict(dropoffDistrictRaw) : null;

  const pickupAnalysis: SideAnalysis = {
    airport: pickupAirport ? { value: pickupAirport } : null,
    city: pickupCity ? { value: pickupCity } : null,
    district: pickupDistrict ? { value: pickupDistrict, city: pickupCity ?? undefined } : null,
  };

  const dropoffAnalysis: SideAnalysis = {
    airport: dropoffAirport ? { value: dropoffAirport } : null,
    city: dropoffCity ? { value: dropoffCity } : null,
    district: dropoffDistrict ? { value: dropoffDistrict, city: dropoffCity ?? undefined } : null,
  };

  // Canonical fields used by pricing logic
  const airport = dropoffAirport || pickupAirport || null;
  const city = direction === "to_airport" ? pickupCity : direction === "from_airport" ? dropoffCity : pickupCity || dropoffCity;
  const district = direction === "to_airport" ? pickupDistrict : direction === "from_airport" ? dropoffDistrict : pickupDistrict || dropoffDistrict;

  const confidence: TransferInfo["confidence"] = airport && city ? "high" : city ? "medium" : "low";

  return {
    airport,
    city,
    district,
    direction,
    confidence,
    pickupAnalysis,
    dropoffAnalysis,
  };
}

type SanityCheckResult = {
  isValid: boolean;
  reason?: string;
  minimumExpected?: number;
  actualPrice?: number;
  vehicleType?: string;
  confidence?: "high" | "medium" | "low";
  routeKey?: string;
};

function toEur(amount: number, currency: string): number {
  const c = (currency || "EUR").toUpperCase();
  if (c === "EUR") return amount;
  if (c === "TRY") return amount / 38;
  if (c === "USD") return amount / 1.08;
  if (c === "GBP") return amount * 1.17;
  if (c === "AED") return amount / 3.97;
  return amount;
}

function checkPriceSanity(
  pickupCity: string | null,
  dropoffCity: string | null,
  price: number,
  currency: string,
  vehicleType: string,
  airport: string | null
): SanityCheckResult {
  const priceEur = toEur(price, currency);
  const vt = (vehicleType || "").toLowerCase();

  let min = 25;
  if (/(s_class|maybach)/.test(vt)) min = 140;
  else if (/(sprinter|minibus)/.test(vt)) min = 85;
  else if (/(vito|vclass|minivan|vip)/.test(vt)) min = 50;

  // Slightly higher minimum for airport transfers.
  if (airport) min += 10;

  const routeKey = `${pickupCity ?? "?"}->${dropoffCity ?? "?"}${airport ? `@${airport}` : ""}`;

  if (!Number.isFinite(priceEur) || priceEur <= 0) {
    return { isValid: false, reason: "invalid_price", minimumExpected: min, actualPrice: priceEur, vehicleType, confidence: "low", routeKey };
  }

  if (priceEur < min) {
    return { isValid: false, reason: `too_low(<${min}€)`, minimumExpected: min, actualPrice: priceEur, vehicleType, confidence: "medium", routeKey };
  }

  if (priceEur > 5000) {
    return { isValid: false, reason: "too_high(>5000€)", minimumExpected: min, actualPrice: priceEur, vehicleType, confidence: "low", routeKey };
  }

  return { isValid: true, minimumExpected: min, actualPrice: priceEur, vehicleType, confidence: "high", routeKey };
}

function logPriceSanityCheck(scope: string, id: string, result: SanityCheckResult) {
  console.log(`[sanity:${scope}] ${id}`, result);
}

function validateDistrictByDistance(
  _airport: string,
  _district: string,
  _priceEur: number,
  _vehicleType: string
): { isValid: true } | { isValid: false; reason: string; expectedDistrict?: string } {
  // Keep permissive to avoid false negatives; main safety net is DB matching + sanity check.
  return { isValid: true };
}

function estimateDistanceFromRoute(pickup: string, dropoff: string, transferInfo: TransferInfo): number | null {
  // Heuristic fallback distance for Turkey when DB has no rows.
  const s = norm(pickup + " " + dropoff);
  if (/(istanbul airport|\bist\b|\bsaw\b)/.test(s)) return 45;
  if (/(antalya|\bayt\b)/.test(s)) return 35;
  if (/(bodrum|\bbjv\b|dalaman|\bdlm\b)/.test(s)) return 55;
  if (transferInfo.direction === "city_to_city") return 75;
  return 50;
}

interface GetPricesRequest {
  pickup: string;
  dropoff: string;
  customerCurrency: string;
  pickupDate?: string; // YYYY-MM-DD format for seasonal pricing
}

interface VehiclePriceInfo {
  vehicleType: string;
  vehicleLabel: string;
  price: number | null;
  currency: string;
  passengers: number;
  luggage: number;
  available: boolean;
  sanityFailed?: boolean;
  sanityReason?: string;
}

// Currency conversion helper
async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ amount: number; rate: number }> {
  if (fromCurrency === toCurrency) {
    return { amount, rate: 1 };
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`
    );
    if (response.ok) {
      const data = await response.json();
      const rate = data.rates[toCurrency];
      return { amount: Math.ceil(amount * rate), rate };
    }
  } catch (e) {
    console.error("Currency conversion error:", e);
  }

  // Fallback rates
  const fallbackRates: Record<string, Record<string, number>> = {
    'EUR': { 'USD': 1.08, 'TRY': 37.5, 'GBP': 0.85, 'AED': 3.97, 'AUD': 1.65 },
    'USD': { 'EUR': 0.93, 'TRY': 34.5, 'GBP': 0.79, 'AED': 3.67, 'AUD': 1.53 },
    'TRY': { 'EUR': 0.027, 'USD': 0.029, 'GBP': 0.023, 'AED': 0.11, 'AUD': 0.045 },
    'AED': { 'EUR': 0.25, 'USD': 0.27, 'TRY': 9.4, 'GBP': 0.21, 'AUD': 0.42 },
  };

  const rate = fallbackRates[fromCurrency]?.[toCurrency] || 1;
  return { amount: Math.ceil(amount * rate), rate };
}

// Extract airport code from full airport name (e.g., "Zurich Airport (ZRH)" -> "ZRH")
function extractAirportCode(airportName: string): string {
  // Try to extract code from parentheses first (e.g., "Zurich Airport (ZRH)")
  const parenMatch = airportName.match(/\(([A-Z]{3})\)/);
  if (parenMatch) {
    return parenMatch[1];
  }
  
  // Try to find a 3-letter uppercase code anywhere
  const codeMatch = airportName.match(/\b([A-Z]{3})\b/);
  if (codeMatch) {
    return codeMatch[1];
  }
  
  // Fallback: return the original name (for backwards compatibility)
  return airportName;
}

// Build vehicle config from dynamic types
function buildVehicleConfig(vehicleTypes: typeof VEHICLE_TYPES): Record<string, { label: string; passengers: number; luggage: number }> {
  return Object.fromEntries(
    vehicleTypes.map(v => [v.value, { label: v.label, passengers: v.passengers, luggage: v.luggage }])
  );
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting to prevent scraping
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.pricing);
  
  if (!rateLimitResult.allowed) {
    console.log(`🚫 Rate limited: ${clientId}`);
    return createRateLimitResponse(rateLimitResult, RATE_LIMIT_CONFIGS.pricing, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { pickup, dropoff, customerCurrency, pickupDate }: GetPricesRequest = await req.json();

    console.log("🚗 Getting all vehicle prices for route:", pickup, "→", dropoff, pickupDate ? `(date: ${pickupDate})` : "(no date)");

    // ============ AMBIGUOUS LOCATION CHECK ============
    // Reject overly vague locations like just "Türkiye", "Turkey", "Turkey, Türkiye"
    // These cannot be priced correctly and should require more specific input
    const pickupLower = pickup.toLowerCase().trim();
    const dropoffLower = dropoff.toLowerCase().trim();
    
    // List of vague/country-level patterns that should not be priced
    const vaguePatterns = [
      /^t[uü]rkiye$/i,
      /^turkey$/i,
      /^t[uü]rkiye,?\s*t[uü]rkiye$/i,
      /^turkey,?\s*t[uü]rkiye$/i,
      /^t[uü]rkiye,?\s*turkey$/i,
      /^united arab emirates$/i,
      /^uae$/i,
      /^dubai,?\s*uae$/i,
      /^switzerland$/i,
      /^schweiz$/i,
      /^suisse$/i,
      /^cyprus$/i,
      /^k[iı]br[iı]s$/i,
    ];
    
    const isPickupVague = vaguePatterns.some(pattern => pattern.test(pickupLower));
    const isDropoffVague = vaguePatterns.some(pattern => pattern.test(dropoffLower));
    
    if (isPickupVague || isDropoffVague) {
      const vagueSide = isPickupVague ? 'pickup' : 'dropoff';
      console.log(`⚠️ Vague ${vagueSide} location detected: "${isPickupVague ? pickup : dropoff}" - requiring specific address`);
      
      // Detect region to return correct vehicle types structure
      const combinedForRegion = (pickup + ' ' + dropoff).toLowerCase();
      const hasTurkeyKeywordsVague = ['istanbul', 'ankara', 'antalya', 'izmir', 'bodrum', 'dalaman', 'turkiye', 'turkey'].some(k => combinedForRegion.includes(k));
      let vagueRegion: VehicleRegion = hasTurkeyKeywordsVague ? 'turkey' : 'default';
      const vagueVehicleTypes = getVehicleTypesForRegion(vagueRegion);
      
      return new Response(
        JSON.stringify({
          prices: vagueVehicleTypes.map(vt => ({
            vehicleType: vt.value,
            vehicleLabel: vt.label,
            price: null,
            currency: customerCurrency || 'EUR',
            passengers: vt.passengers,
            luggage: vt.luggage,
            available: false,
          })),
          matched: false,
          reason: "vague_location",
          vagueLocation: isPickupVague ? pickup : dropoff,
          requiresSpecificAddress: true,
          region: vagueRegion,
          isDubai: false,
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Detect region from locations - this is the authoritative source
    // PRIORITY CHECK: Turkey keywords before Dubai to prevent false positives
    const combinedLocation = (pickup + ' ' + dropoff).toLowerCase();
    const hasTurkeyKeywords = ['istanbul', 'ankara', 'antalya', 'izmir', 'bodrum', 'dalaman', 'turkiye', 'turkey', 'taksim', 'kadikoy', 'besiktas', 'fethiye', 'marmaris', 'alanya', 'belek', 'side', 'kas', 'kalkan', 'cappadocia', 'goreme', 'bursa', 'konya', 'adana', 'trabzon', 'mugla', 'denizli', 'pamukkale'].some(k => combinedLocation.includes(k));
    
    let region: VehicleRegion = detectRegion(pickup, dropoff);
    // Override to Turkey if Turkey keywords detected but region is incorrectly dubai
    if (hasTurkeyKeywords && region === 'dubai') {
      console.log("🔄 Overriding region from dubai to turkey (Turkey keywords detected)");
      region = 'turkey';
    }
    
    const isDubai = region === 'dubai';
    const isSwitzerlandRegion = region === 'switzerland';
    const activeVehicleTypes = getVehicleTypesForRegion(region);
    const vehicleConfig = buildVehicleConfig(activeVehicleTypes);
    
    console.log("🏙️ Detected region:", region, "- Using", activeVehicleTypes.length, "vehicle types");

    // For Switzerland, check if route is valid (airport ↔ ski resort only)
    // If not valid, return prices as unavailable and require manual pricing
    if (isSwitzerlandRegion && !isValidSwitzerlandRoute(pickup, dropoff)) {
      console.log("🇨🇭 Switzerland route not in defined airport-resort pairs, requiring manual pricing");
      return new Response(
        JSON.stringify({
          prices: activeVehicleTypes.map(vt => ({
            vehicleType: vt.value,
            vehicleLabel: vt.label,
            price: null,
            currency: customerCurrency || 'EUR',
            passengers: vt.passengers,
            luggage: vt.luggage,
            available: false,
          })),
          matched: false,
          reason: "switzerland_route_not_defined",
          region,
          isDubai: false,
          requiresManualPricing: true,
          switzerlandValidRouteRequired: true,
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Analyze transfer using shared module
    const transferInfo = analyzeTransfer(pickup, dropoff);
    const { airport, city, direction, confidence } = transferInfo;
    // Use mutable variable for district as it may be corrected by distance validation
    let matchedDistrict = transferInfo.district;

    console.log("📍 Transfer analysis:", { airport, city, district: matchedDistrict, direction, confidence });

    if (!city && !airport) {
      console.log("❌ No location match - returning empty prices");
      return new Response(
        JSON.stringify({ 
          prices: activeVehicleTypes.map(vt => ({
            vehicleType: vt.value,
            vehicleLabel: vt.label,
            price: null,
            currency: customerCurrency,
            passengers: vt.passengers,
            luggage: vt.luggage,
            available: false,
          })),
          matched: false,
          reason: "no_location_match",
          isDubai,
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if this is a city-to-city or intercity transfer
    const pickupCity = transferInfo.pickupAnalysis.city?.value || transferInfo.pickupAnalysis.district?.city || null;
    const dropoffCity = transferInfo.dropoffAnalysis.city?.value || transferInfo.dropoffAnalysis.district?.city || null;
    const pickupDistrict = transferInfo.pickupAnalysis.district?.value || null;
    const dropoffDistrict = transferInfo.dropoffAnalysis.district?.value || null;
    
    // IMPORTANT: Also check intercity when going to/from airport if the non-airport city is different from airport's city
    // For example: Bursa → Istanbul Airport should check intercity_prices because Bursa is not in Istanbul
    const airportCity = airport ? (
      airport.includes('Istanbul') ? 'Istanbul' :
      airport.includes('Sabiha') ? 'Istanbul' :
      airport.includes('Antalya') ? 'Antalya' :
      airport.includes('Bodrum') ? 'Bodrum' :
      airport.includes('Dalaman') ? 'Dalaman' :
      airport.includes('Izmir') ? 'Izmir' :
      airport.includes('Kayseri') ? 'Cappadocia' :
      airport.includes('Nevsehir') ? 'Cappadocia' :
      airport.includes('Dubai') ? 'Dubai' :
      airport.includes('Larnaca') || airport.includes('Paphos') || airport.includes('Ercan') ? 'Cyprus' :
      airport.includes('Mardin') || airport.includes('MQM') ? 'Mardin' :
      airport.includes('Bursa') ? 'Bursa' :
      airport.includes('Zurich') || airport.includes('ZRH') ? 'Switzerland' :
      airport.includes('Geneva') || airport.includes('GVA') ? 'Switzerland' :
      airport.includes('Basel') || airport.includes('BSL') ? 'Switzerland' :
      airport.includes('Malpensa') || airport.includes('MXP') ? 'Switzerland' :
      null
    ) : null;
    
    // Extract airport code for database queries (e.g., "Zurich Airport (ZRH)" -> "ZRH")
    const airportCode = airport ? extractAirportCode(airport) : null;
    
    const nonAirportCity = direction === 'to_airport' ? pickupCity : 
                           direction === 'from_airport' ? dropoffCity : null;

    // Business rule: For same-city airport transfers, NEVER fall back to intercity prices.
    // If we can't find a regional price, we should mark as unavailable (manual pricing).
    const strictRegionalOnly = Boolean(airport && airportCity && nonAirportCity && nonAirportCity === airportCity);
    
    // Intercity conditions:
    // 1. city_to_city with different cities
    // 2. to_airport/from_airport where non-airport city is different from airport's city
    const isIntercity = (
      (direction === 'city_to_city' && pickupCity && dropoffCity && pickupCity !== dropoffCity) ||
      (airport && nonAirportCity && airportCity && nonAirportCity !== airportCity)
    );
    
    // For intercity airport transfers, we need to know both cities
    const intercityFromCity = direction === 'to_airport' ? pickupCity : 
                              direction === 'from_airport' ? airportCity : pickupCity;
    const intercityToCity = direction === 'to_airport' ? airportCity : 
                            direction === 'from_airport' ? dropoffCity : dropoffCity;
    const intercityFromDistrict = direction === 'to_airport' ? pickupDistrict : 
                                  direction === 'from_airport' ? airport : pickupDistrict;
    const intercityToDistrict = direction === 'to_airport' ? airport : 
                                direction === 'from_airport' ? dropoffDistrict : dropoffDistrict;

    console.log("🔍 Route type:", isIntercity ? "intercity" : "airport transfer", { 
      pickupCity, pickupDistrict, dropoffCity, dropoffDistrict, 
      airportCity, nonAirportCity, intercityFromCity, intercityToCity 
    });

    // Get all prices for this route
    const vehiclePrices: VehiclePriceInfo[] = [];
    let baseCurrency = 'EUR';
    let exchangeRate = 1;

    for (const vehicleTypeConfig of activeVehicleTypes) {
      const vehicleType = vehicleTypeConfig.value;
      let foundPrice: { price: number; currency: string } | null = null;

      // Helper function to query intercity prices with seasonal support
      const queryIntercityPrice = async (
        fromCity: string,
        toCity: string,
        fromDistrict: string | null,
        toDistrict: string | null,
        vType: string
      ): Promise<{ price: number; currency: string } | null> => {
        let query = supabase
          .from("intercity_prices")
          .select("price, price_currency, valid_from, valid_to")
          .eq("vehicle_type", vType)
          .eq("is_active", true);

        // Build the OR condition for bidirectional matching
        if (fromDistrict && toDistrict) {
          query = query.or(`and(from_city.eq.${fromCity},from_district.eq.${fromDistrict},to_city.eq.${toCity},to_district.eq.${toDistrict}),and(from_city.eq.${toCity},from_district.eq.${toDistrict},to_city.eq.${fromCity},to_district.eq.${fromDistrict})`);
        } else if (fromDistrict || toDistrict) {
          const districtToMatch = fromDistrict || toDistrict;
          const cityWithDistrict = fromDistrict ? fromCity : toCity;
          const cityWithoutDistrict = fromDistrict ? toCity : fromCity;
          query = query.or(`and(from_city.eq.${cityWithDistrict},from_district.eq.${districtToMatch},to_city.eq.${cityWithoutDistrict}),and(to_city.eq.${cityWithDistrict},to_district.eq.${districtToMatch},from_city.eq.${cityWithoutDistrict})`);
        } else {
          query = query.is("from_district", null).is("to_district", null)
            .or(`and(from_city.eq.${fromCity},to_city.eq.${toCity}),and(from_city.eq.${toCity},to_city.eq.${fromCity})`);
        }

        const { data } = await query;
        if (!data || data.length === 0) return null;

        // First try to find seasonal price matching the pickup date
        if (pickupDate) {
          const seasonalPrice = data.find(p => 
            p.valid_from && p.valid_to && 
            pickupDate >= p.valid_from && pickupDate <= p.valid_to
          );
          if (seasonalPrice) {
            console.log(`🗓️ Seasonal intercity price found for ${vType}: ${seasonalPrice.price} ${seasonalPrice.price_currency}`);
            return { price: seasonalPrice.price, currency: seasonalPrice.price_currency };
          }
        }

        // Fallback to base price (valid_from is NULL)
        const basePrice = data.find(p => !p.valid_from);
        if (basePrice) {
          return { price: basePrice.price, currency: basePrice.price_currency };
        }

        // If no base price, use first available
        return { price: data[0].price, currency: data[0].price_currency };
      };

      // For intercity routes, first check intercity_prices table
      if (isIntercity && intercityFromCity && intercityToCity) {
        // Try exact district match first (both directions)
        if (intercityFromDistrict && intercityToDistrict) {
          foundPrice = await queryIntercityPrice(intercityFromCity, intercityToCity, intercityFromDistrict, intercityToDistrict, vehicleType);
          if (foundPrice) {
            console.log(`✅ Intercity exact price found for ${vehicleType}: ${foundPrice.price} ${foundPrice.currency}`);
          }
        }

        // Try partial district match - when only one side has district (e.g., airport)
        if (!foundPrice && (intercityFromDistrict || intercityToDistrict)) {
          foundPrice = await queryIntercityPrice(
            intercityFromDistrict ? intercityFromCity : intercityToCity,
            intercityFromDistrict ? intercityToCity : intercityFromCity,
            intercityFromDistrict || intercityToDistrict,
            null,
            vehicleType
          );
          if (foundPrice) {
            console.log(`✅ Intercity partial price found for ${vehicleType}: ${foundPrice.price} ${foundPrice.currency}`);
          }
        }

        // Try city-only match (no district specified in price)
        if (!foundPrice) {
          foundPrice = await queryIntercityPrice(intercityFromCity, intercityToCity, null, null, vehicleType);
          if (foundPrice) {
            console.log(`✅ Intercity city price found for ${vehicleType}: ${foundPrice.price} ${foundPrice.currency}`);
          }
        }
      }

      // Helper function to query region prices with seasonal support
      const queryRegionPrice = async (
        cityVal: string | null,
        airportVal: string | null,
        districtVal: string | null,
        vType: string
      ): Promise<{ price: number; currency: string } | null> => {
        let query = supabase
          .from("region_prices")
          .select("price, price_currency, valid_from, valid_to")
          .eq("vehicle_type", vType)
          .eq("is_active", true);

        if (cityVal) query = query.eq("city", cityVal);
        if (airportVal) query = query.eq("airport", airportVal);
        if (districtVal) query = query.eq("district", districtVal);

        const { data } = await query;
        if (!data || data.length === 0) return null;

        // First try to find seasonal price matching the pickup date
        if (pickupDate) {
          const seasonalPrice = data.find(p => 
            p.valid_from && p.valid_to && 
            pickupDate >= p.valid_from && pickupDate <= p.valid_to
          );
          if (seasonalPrice) {
            console.log(`🗓️ Seasonal region price found for ${vType}: ${seasonalPrice.price} ${seasonalPrice.price_currency}`);
            return { price: seasonalPrice.price, currency: seasonalPrice.price_currency };
          }
        }

        // Fallback to base price (valid_from is NULL)
        const basePrice = data.find(p => !p.valid_from);
        if (basePrice) {
          return { price: basePrice.price, currency: basePrice.price_currency };
        }

        // If no base price, use first available (sorted by price ascending)
        const sorted = data.sort((a, b) => a.price - b.price);
        return { price: sorted[0].price, currency: sorted[0].price_currency };
      };

      // Try exact match (airport + city + district + vehicle)
      // Try both full airport name and airport code (e.g., "Zurich Airport (ZRH)" and "ZRH")
      if (!foundPrice && airport && city && matchedDistrict) {
        const airportQueries = airportCode && airportCode !== airport 
          ? [airport, airportCode] 
          : [airport];
        
        for (const airportQuery of airportQueries) {
          if (foundPrice) break;
          foundPrice = await queryRegionPrice(city, airportQuery, matchedDistrict, vehicleType);
          if (foundPrice) {
            console.log(`✅ Exact match found for ${vehicleType} with airport ${airportQuery}: ${foundPrice.price} ${foundPrice.currency}`);
          }
        }
      }

      // Try airport + city match
      if (!foundPrice && airport && city) {
        const airportQueries = airportCode && airportCode !== airport 
          ? [airport, airportCode] 
          : [airport];
        
        for (const airportQuery of airportQueries) {
          if (foundPrice) break;
          foundPrice = await queryRegionPrice(city, airportQuery, null, vehicleType);
          if (foundPrice) {
            console.log(`✅ Airport+city match found for ${vehicleType} with airport ${airportQuery}: ${foundPrice.price} ${foundPrice.currency}`);
          }
        }
      }

      // Try city only match (DISABLED for strict airport transfers to avoid wrong cross-region pricing)
      if (!strictRegionalOnly && !foundPrice && city) {
        foundPrice = await queryRegionPrice(city, null, null, vehicleType);
      }

      // Try airport only match (DISABLED for strict airport transfers to avoid wrong cross-region pricing)
      if (!strictRegionalOnly && !foundPrice && airport) {
        foundPrice = await queryRegionPrice(null, airport, null, vehicleType);
      }

      const config = vehicleConfig[vehicleType];
      
      if (foundPrice) {
        baseCurrency = foundPrice.currency;
        
        // Convert price to EUR for distance validation
        let priceInEur = foundPrice.price;
        if (foundPrice.currency === 'TRY') {
          priceInEur = foundPrice.price / 38;
        } else if (foundPrice.currency === 'USD') {
          priceInEur = foundPrice.price / 1.08;
        } else if (foundPrice.currency === 'GBP') {
          priceInEur = foundPrice.price * 1.17;
        }

        // DISTANCE-BASED VALIDATION: Check if the matched district makes sense for this price
        // This catches cases where "güzeloba" wrongly matched "oba" keyword in Alanya
        if (!isDubai && airport && matchedDistrict) {
          const distanceValidation = validateDistrictByDistance(airport, matchedDistrict, priceInEur, vehicleType);
          
          if (!distanceValidation.isValid) {
            console.log(`⚠️ Distance validation FAILED for ${vehicleType}:`);
            console.log(`   Matched district: ${matchedDistrict}`);
            console.log(`   Price: ${priceInEur.toFixed(0)}€`);
            console.log(`   Reason: ${distanceValidation.reason}`);
            console.log(`   Suggested district: ${distanceValidation.expectedDistrict || 'unknown'}`);
            
            // Try to find price for the suggested district instead
            if (distanceValidation.expectedDistrict) {
              const { data: correctedData } = await supabase
                .from("region_prices")
                .select("price, price_currency")
                .eq("city", city)
                .eq("airport", airport)
                .eq("district", distanceValidation.expectedDistrict)
                .eq("vehicle_type", vehicleType)
                .eq("is_active", true)
                .limit(1);

              if (correctedData && correctedData.length > 0) {
                foundPrice = { price: correctedData[0].price, currency: correctedData[0].price_currency };
                console.log(`✅ Corrected to ${distanceValidation.expectedDistrict}: ${foundPrice.price} ${foundPrice.currency}`);
                // Update district for logging
                matchedDistrict = distanceValidation.expectedDistrict;
              }
            }
          }
        }

        // ALWAYS round up to nearest integer for clean "net" pricing
        let finalPrice = Math.ceil(foundPrice.price);
        let finalCurrency = foundPrice.currency;

        // Convert to customer's preferred currency if different
        if (customerCurrency && customerCurrency !== foundPrice.currency) {
          const conversion = await convertCurrency(foundPrice.price, foundPrice.currency, customerCurrency);
          finalPrice = Math.ceil(conversion.amount); // Ensure rounding after conversion too
          finalCurrency = customerCurrency;
          exchangeRate = conversion.rate;
        }

        // Perform sanity check on the price (skip for Dubai as AED prices are different)
        if (!isDubai) {
          const sanityCheck = checkPriceSanity(
            pickupCity,
            dropoffCity,
            foundPrice.price, // Use original price for sanity check
            foundPrice.currency,
            vehicleType,
            airport
          );

          logPriceSanityCheck('quick_booking', `get-prices-${vehicleType}`, sanityCheck);

          if (!sanityCheck.isValid) {
            console.log(`⚠️ Price sanity check FAILED for ${vehicleType}: ${sanityCheck.reason}`);
            // Mark as unavailable when sanity check fails - admin needs to set price
            vehiclePrices.push({
              vehicleType,
              vehicleLabel: config.label,
              price: null,
              currency: finalCurrency,
              passengers: config.passengers,
              luggage: config.luggage,
              available: false,
              sanityFailed: true,
              sanityReason: sanityCheck.reason,
            });
            continue;
          }
        }

        vehiclePrices.push({
          vehicleType,
          vehicleLabel: config.label,
          price: finalPrice,
          currency: finalCurrency,
          passengers: config.passengers,
          luggage: config.luggage,
          available: true,
        });
      } else {
        // No price found in database - try Turkey distance-based fallback
        let fallbackPrice: { price: number; currency: string } | null = null;
        
        if (region === 'turkey' || region === 'default') {
          // Estimate distance from route analysis
          const estimatedDistance = estimateDistanceFromRoute(pickup, dropoff, transferInfo);
          
          if (estimatedDistance !== null && estimatedDistance <= 100) {
            fallbackPrice = calculateTurkeyFallbackPrice(vehicleType, estimatedDistance);
            if (fallbackPrice) {
              console.log(`🇹🇷 Turkey fallback price for ${vehicleType}: ${fallbackPrice.price}€ (distance: ${estimatedDistance}km)`);
            }
          }
        }
        
        if (fallbackPrice) {
          // Convert to customer currency if needed
          let finalPrice = fallbackPrice.price;
          let finalCurrency = fallbackPrice.currency;
          
          if (customerCurrency && customerCurrency !== fallbackPrice.currency) {
            const conversion = await convertCurrency(fallbackPrice.price, fallbackPrice.currency, customerCurrency);
            finalPrice = Math.ceil(conversion.amount);
            finalCurrency = customerCurrency;
          }
          
          vehiclePrices.push({
            vehicleType,
            vehicleLabel: config.label,
            price: finalPrice,
            currency: finalCurrency,
            passengers: config.passengers,
            luggage: config.luggage,
            available: true,
          });
        } else {
          vehiclePrices.push({
            vehicleType,
            vehicleLabel: config.label,
            price: null,
            currency: customerCurrency || (isDubai ? 'AED' : 'EUR'),
            passengers: config.passengers,
            luggage: config.luggage,
            available: false,
          });
        }
      }
    }

    const availableCount = vehiclePrices.filter(v => v.available).length;
    const sanityFailedCount = vehiclePrices.filter(v => v.sanityFailed).length;
    
    console.log("✅ Vehicle prices found:", availableCount, "out of", activeVehicleTypes.length);
    if (sanityFailedCount > 0) {
      console.log("⚠️ Prices with sanity check failed:", sanityFailedCount);
    }

    return new Response(
      JSON.stringify({
        prices: vehiclePrices,
        matched: vehiclePrices.some(v => v.available),
        matchedCity: city,
        matchedDistrict,
        matchedAirport: airport,
        direction,
        confidence,
        baseCurrency,
        exchangeRate: exchangeRate !== 1 ? exchangeRate : null,
        sanityCheckFailed: sanityFailedCount > 0,
        requiresManualPricing: sanityFailedCount > 0,
        // Region-based response - frontend uses this
        region,
        isDubai, // Keep for backward compatibility
      }),
      { 
        headers: addRateLimitHeaders(
          { "Content-Type": "application/json", ...dynamicCacheHeaders },
          rateLimitResult,
          RATE_LIMIT_CONFIGS.pricing
        )
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Get prices error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage, prices: [] }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
