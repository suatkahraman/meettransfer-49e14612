const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// District mapping for known locations
const DISTRICT_MAPPING: Record<string, string> = {
  // Turkey
  "alanya": "Alanya", "belek": "Belek", "side": "Side", "kemer": "Kemer",
  "lara": "Lara", "kundu": "Kundu", "beldibi": "Beldibi", "göynük": "Göynük",
  "tekirova": "Tekirova", "manavgat": "Manavgat", "taksim": "Taksim",
  "sultanahmet": "Sultanahmet", "kadikoy": "Kadıköy", "besiktas": "Beşiktaş",
  "sisli": "Şişli", "levent": "Levent", "atasehir": "Ataşehir",
  "bakirkoy": "Bakırköy", "bodrum": "Bodrum Merkez", "turgutreis": "Turgutreis",
  "yalikavak": "Yalıkavak", "gumbet": "Gümbet", "bitez": "Bitez",
  "fethiye": "Fethiye", "oludeniz": "Ölüdeniz", "marmaris": "Marmaris",
  "dalyan": "Dalyan", "cesme": "Çeşme", "alacati": "Alaçatı", "kusadasi": "Kuşadası",
  // Dubai
  "downtown": "Downtown", "dubai marina": "Dubai Marina", "marina": "Dubai Marina",
  "palm jumeirah": "Palm Jumeirah", "palm": "Palm Jumeirah",
  "deira": "Deira", "business bay": "Business Bay",
  "jbr": "JBR", "jumeirah beach": "JBR",
  "jumeirah": "Jumeirah", "bur dubai": "Bur Dubai",
  "al barsha": "Al Barsha", "silicon oasis": "Dubai Silicon Oasis",
};

const TURKEY_INTRACITY_DISCOUNT_CITIES = new Set([
  "Istanbul",
  "Ankara",
  "Antalya",
  "Bodrum",
  "Dalaman",
  "Izmir",
  "Bursa",
]);

const INTRACITY_AIRPORT_DISCOUNT_RATE = 0.1;
const EDGE_FETCH_TIMEOUT_MS = 8000;
const KM_PRICING_COUNTRY_CODE = "TR";
const KM_PRICING_MAX_DISTANCE_KM = 85;
const KM_GLOBAL_VEHICLE_TOKEN = "__all__";
const KM_FLAT_MODE = "flat_base";
const KM_INCREMENTAL_MODE = "incremental_per_km";
const KM_BASE_MAX_DISTANCE = 50;
const KM_TIER_ONE_START = 51;
const KM_TIER_ONE_END = 70;
const KM_TIER_TWO_START = 71;

const TURKEY_KM_ELIGIBLE_CITIES = new Set([
  "Istanbul",
  "Ankara",
  "Antalya",
  "Bodrum",
  "Dalaman",
  "Izmir",
  "Bursa",
  "Alanya",
  "Aydin",
  "Mugla",
  "Denizli",
  "Adana",
  "Cappadocia",
]);

const TURKEY_AIRPORTS = new Set([
  "Istanbul Airport (IST)",
  "Sabiha Gokcen Airport (SAW)",
  "Antalya Airport (AYT)",
  "Bodrum-Milas Airport (BJV)",
  "Dalaman Airport (DLM)",
  "Izmir Adnan Menderes Airport (ADB)",
  "Ankara Esenboga Airport (ESB)",
]);

type DistancePricingRule = {
  city: string | null;
  country: string;
  km_from: number;
  km_to: number;
  month: number | null;
  price_amount: number;
  price_currency: string;
  pricing_mode: string;
  vehicle_type: string;
};

function isSameCity(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return normalizeTurkish(a).toLowerCase() === normalizeTurkish(b).toLowerCase();
}

const ISTANBUL_DISTRICTS = new Set([
  "taksim", "sultanahmet", "kadikoy", "besiktas", "sisli", "levent", "atasehir", "bakirkoy",
]);
const ANKARA_DISTRICTS = new Set(["pursaklar", "kecioren", "ulus", "cankaya merkez", "mamak", "yenimahalle merkez"]);
const ANTALYA_DISTRICTS = new Set(["alanya", "belek", "side", "kemer", "lara", "kundu", "manavgat"]);
const BODRUM_DISTRICTS = new Set(["bodrum merkez", "turgutreis", "yalikavak", "gumbet", "bitez"]);
const DALAMAN_DISTRICTS = new Set(["fethiye", "oludeniz", "marmaris", "dalyan"]);
const IZMIR_DISTRICTS = new Set(["cesme", "alacati", "kusadasi"]);

function normalizeTurkish(text: string): string {
  return text
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g');
}

function detectDistrict(text: string): string | null {
  const lower = normalizeTurkish(text).toLowerCase();
  for (const [key, value] of Object.entries(DISTRICT_MAPPING)) {
    if (lower.includes(normalizeTurkish(key).toLowerCase())) return value;
  }
  return null;
}

function detectCity(text: string): string | null {
  const s = normalizeTurkish(text).toLowerCase();
  if (/istanbul|\bist\b|\bsaw\b/i.test(s)) return "Istanbul";
  if (/ankara|\besb\b|esenboga/i.test(s)) return "Ankara";
  if (/antalya|\bayt\b|alanya|belek|side|kemer|manavgat/i.test(s)) return "Antalya";
  if (/bodrum|\bbjv\b|turgutreis|yalikavak|gumbet/i.test(s)) return "Bodrum";
  if (/dalaman|\bdlm\b|fethiye|marmaris|oludeniz/i.test(s)) return "Dalaman";
  if (/izmir|\badb\b|cesme|alacati|kusadasi/i.test(s)) return "Izmir";
  if (/bursa/i.test(s)) return "Bursa";
  return null;
}

function applyIntracityAirportDiscount(price: number): number {
  return Math.max(1, Math.ceil(price * (1 - INTRACITY_AIRPORT_DISCOUNT_RATE)));
}

function inferCityFromDistrict(district: string | null): string | null {
  if (!district) return null;
  const normalizedDistrict = normalizeTurkish(district).toLowerCase();
  if (ISTANBUL_DISTRICTS.has(normalizedDistrict)) return "Istanbul";
  if (ANKARA_DISTRICTS.has(normalizedDistrict)) return "Ankara";
  if (ANTALYA_DISTRICTS.has(normalizedDistrict)) return "Antalya";
  if (BODRUM_DISTRICTS.has(normalizedDistrict)) return "Bodrum";
  if (DALAMAN_DISTRICTS.has(normalizedDistrict)) return "Dalaman";
  if (IZMIR_DISTRICTS.has(normalizedDistrict)) return "Izmir";
  return null;
}

function isTurkeyRoute(params: {
  pickup: string;
  dropoff: string;
  pickupCity: string | null;
  dropoffCity: string | null;
  fallbackCity: string | null;
  airport: string | null;
}): boolean {
  const combined = normalizeTurkish(`${params.pickup} ${params.dropoff}`).toLowerCase();
  if (/dubai|uae|emirates/.test(combined)) return false;
  if (/\bturkiye\b|\bturkey\b/.test(combined)) return true;

  if (params.airport && TURKEY_AIRPORTS.has(params.airport)) return true;
  const cityCandidates = [params.pickupCity, params.dropoffCity, params.fallbackCity];
  return cityCandidates.some((cityName) => !!cityName && TURKEY_KM_ELIGIBLE_CITIES.has(cityName));
}

function roundKmPrice(amount: number): number {
  return Math.round(amount * 100) / 100;
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EDGE_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchRouteDistanceKm(pickup: string, dropoff: string): Promise<number | null> {
  const googleApiKey =
    Deno.env.get("GOOGLE_DISTANCE_API_KEY") ||
    Deno.env.get("GOOGLE_MAPS_API_KEY") ||
    Deno.env.get("GOOGLE_PLACES_API_KEY") ||
    "";
  if (!googleApiKey || !pickup || !dropoff) return null;

  const params = new URLSearchParams({
    origins: pickup,
    destinations: dropoff,
    mode: "driving",
    language: "tr",
    key: googleApiKey,
  });

  try {
    const res = await fetchWithTimeout(`https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const element = payload?.rows?.[0]?.elements?.[0];
    const meters = Number(element?.distance?.value);
    if (payload?.status !== "OK" || element?.status !== "OK" || !Number.isFinite(meters) || meters <= 0) {
      return null;
    }
    return Math.max(1, Math.ceil(meters / 1000));
  } catch (distanceError) {
    console.error("Distance Matrix lookup failed", String(distanceError));
    return null;
  }
}

function getRuleScopeScore(
  rule: DistancePricingRule,
  targetCity: string | null,
  targetMonth: number | null,
): number | null {
  let score = 0;
  if (rule.city) {
    if (!targetCity || !isSameCity(rule.city, targetCity)) return null;
    score += 2;
  }
  if (rule.month !== null && rule.month !== undefined) {
    if (!targetMonth || Number(rule.month) !== Number(targetMonth)) return null;
    score += 1;
  }
  return score;
}

function selectBestDistanceRule(
  candidates: DistancePricingRule[],
  targetCity: string | null,
  targetMonth: number | null,
  vehicleType: string,
): DistancePricingRule | null {
  const requestedVehicle = vehicleType.trim().toLowerCase();
  let best: DistancePricingRule | null = null;
  let bestScope = -1;
  let bestVehicleRank = -1;
  let bestRangeSpan = Number.POSITIVE_INFINITY;

  for (const rule of candidates) {
    const scope = getRuleScopeScore(rule, targetCity, targetMonth);
    if (scope === null) continue;

    const normalizedRuleVehicle = (rule.vehicle_type || "").trim().toLowerCase();
    const vehicleRank =
      normalizedRuleVehicle === requestedVehicle
        ? 2
        : normalizedRuleVehicle === KM_GLOBAL_VEHICLE_TOKEN
        ? 1
        : 0;
    if (vehicleRank === 0) continue;

    const rangeSpan = Math.max(0, Number(rule.km_to) - Number(rule.km_from));
    const isBetter =
      scope > bestScope ||
      (scope === bestScope && vehicleRank > bestVehicleRank) ||
      (scope === bestScope && vehicleRank === bestVehicleRank && rangeSpan < bestRangeSpan);

    if (isBetter) {
      best = rule;
      bestScope = scope;
      bestVehicleRank = vehicleRank;
      bestRangeSpan = rangeSpan;
    }
  }

  return best;
}

async function fetchDistancePricingRules(): Promise<DistancePricingRule[]> {
  const rows = await supabaseQuery("distance_pricing_rules", {
    country: `eq.${KM_PRICING_COUNTRY_CODE}`,
    is_active: "eq.true",
    select: "country,city,month,km_from,km_to,vehicle_type,pricing_mode,price_amount,price_currency",
    order: "updated_at.desc",
  });

  if (!Array.isArray(rows)) return [];
  return rows
    .map((row: any) => ({
      country: String(row.country || KM_PRICING_COUNTRY_CODE),
      city: row.city ? String(row.city) : null,
      month: row.month === null || row.month === undefined ? null : Number(row.month),
      km_from: Number(row.km_from),
      km_to: Number(row.km_to),
      vehicle_type: String(row.vehicle_type || KM_GLOBAL_VEHICLE_TOKEN),
      pricing_mode: String(row.pricing_mode || ""),
      price_amount: Number(row.price_amount),
      price_currency: String(row.price_currency || "EUR"),
    }))
    .filter(
      (row: DistancePricingRule) =>
        Number.isFinite(row.km_from) &&
        Number.isFinite(row.km_to) &&
        row.km_from >= 1 &&
        row.km_to >= row.km_from &&
        Number.isFinite(row.price_amount) &&
        row.price_amount > 0 &&
        !!row.pricing_mode,
    );
}

function calculateKmPriceForVehicle(
  vehicleType: string,
  distanceKm: number,
  rules: DistancePricingRule[],
  targetCity: string | null,
  targetMonth: number | null,
): { price: number; currency: string } | null {
  if (!Number.isFinite(distanceKm) || distanceKm < 1 || distanceKm > KM_PRICING_MAX_DISTANCE_KM) return null;

  const baseTargetKm = Math.min(distanceKm, KM_BASE_MAX_DISTANCE);
  const baseRuleCandidates = rules.filter(
    (rule) =>
      rule.pricing_mode === KM_FLAT_MODE &&
      rule.km_from <= baseTargetKm &&
      rule.km_to >= baseTargetKm,
  );
  const baseRule = selectBestDistanceRule(baseRuleCandidates, targetCity, targetMonth, vehicleType);
  if (!baseRule || !Number.isFinite(baseRule.price_amount) || baseRule.price_amount <= 0) return null;

  let total = Number(baseRule.price_amount);
  const currency = baseRule.price_currency || "EUR";

  if (distanceKm > KM_TIER_ONE_START) {
    const tierOneTargetKm = Math.min(distanceKm, KM_TIER_ONE_END);
    const tierOneCandidates = rules.filter(
      (rule) =>
        rule.pricing_mode === KM_INCREMENTAL_MODE &&
        rule.km_from <= tierOneTargetKm &&
        rule.km_to >= tierOneTargetKm,
    );
    const tierOneRule = selectBestDistanceRule(tierOneCandidates, targetCity, targetMonth, vehicleType);
    if (!tierOneRule || !Number.isFinite(tierOneRule.price_amount) || tierOneRule.price_amount <= 0) return null;
    if ((tierOneRule.price_currency || "EUR") !== currency) return null;

    const tierOneBillableKm = Math.max(
      0,
      tierOneTargetKm - Math.max(Number(tierOneRule.km_from), KM_TIER_ONE_START),
    );
    total += tierOneBillableKm * Number(tierOneRule.price_amount);
  }

  if (distanceKm > KM_TIER_TWO_START) {
    const tierTwoTargetKm = Math.min(distanceKm, KM_PRICING_MAX_DISTANCE_KM);
    const tierTwoCandidates = rules.filter(
      (rule) =>
        rule.pricing_mode === KM_INCREMENTAL_MODE &&
        rule.km_from <= tierTwoTargetKm &&
        rule.km_to >= tierTwoTargetKm,
    );
    const tierTwoRule = selectBestDistanceRule(tierTwoCandidates, targetCity, targetMonth, vehicleType);
    if (!tierTwoRule || !Number.isFinite(tierTwoRule.price_amount) || tierTwoRule.price_amount <= 0) return null;
    if ((tierTwoRule.price_currency || "EUR") !== currency) return null;

    const tierTwoBillableKm = Math.max(
      0,
      tierTwoTargetKm - Math.max(Number(tierTwoRule.km_from), KM_TIER_TWO_START),
    );
    total += tierTwoBillableKm * Number(tierTwoRule.price_amount);
  }

  return { price: roundKmPrice(total), currency };
}

// ---- Minimal helpers ----
function analyzeSimple(pickup: string, dropoff: string): {
  airport: string | null;
  city: string | null;
  pickupCity: string | null;
  dropoffCity: string | null;
  pickupDistrict: string | null;
  dropoffDistrict: string | null;
  district: string | null;
  direction: string;
  confidence: string;
} {
  const s = normalizeTurkish(pickup + " " + dropoff).toLowerCase();

  let airport: string | null = null;
  if (/istanbul airport|\bist\b/i.test(s)) airport = "Istanbul Airport (IST)";
  else if (/sabiha|gokcen|\bsaw\b/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
  else if (/antalya.*airport|antalya.*havalimani|\bayt\b/i.test(s)) airport = "Antalya Airport (AYT)";
  else if (/\bbjv\b|bodrum.*airport|milas.*airport|bodrum.*havalimani|milas.*havalimani/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
  else if (/\bdlm\b|dalaman.*airport|dalaman.*havalimani/i.test(s)) airport = "Dalaman Airport (DLM)";
  else if (/adnan menderes|\badb\b/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";
  else if (/esenboga|\besb\b/i.test(s)) airport = "Ankara Esenboga Airport (ESB)";

  const direction = normalizeTurkish(dropoff).toLowerCase().includes("airport") || normalizeTurkish(dropoff).toLowerCase().includes("havalimani") 
    ? "to_airport" 
    : airport ? "from_airport" : "city_to_city";

  // Detect cities from pickup and dropoff separately
  const pickupCity = detectCity(pickup);
  const dropoffCity = detectCity(dropoff);
  const city = pickupCity || dropoffCity;

  // Detect districts from pickup and dropoff separately
  const pickupDistrict = detectDistrict(pickup);
  const dropoffDistrict = detectDistrict(dropoff);
  const district = pickupDistrict || dropoffDistrict;

  return { airport, city, pickupCity, dropoffCity, pickupDistrict, dropoffDistrict, district, direction, confidence: airport && city ? "high" : city ? "medium" : "low" };
}

async function convertCurrency(amount: number, from: string, to: string): Promise<{ amount: number; rate: number }> {
  if (from === to) return { amount, rate: 1 };
  try {
    const r = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    if (r.ok) {
      const d = await r.json();
      const rate = d.rates?.[to];
      if (rate) return { amount: Math.ceil(amount * rate), rate };
    }
  } catch {}
  return { amount, rate: 1 };
}

async function supabaseQuery(table: string, params: Record<string, string> = {}, method = "GET", body?: unknown) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const headers: Record<string, string> = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": method === "PATCH" ? "return=minimal" : "return=representation",
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (method === "PATCH") return { ok: res.ok };
  return res.json();
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Meet Transfer <noreply@mail.meettransfer.app>",
        to: [to],
        subject,
        html,
      }),
    });
  } catch {}
}

async function sendManualEmail(reservation: Record<string, unknown>, info: { airport: string | null; city: string | null; district: string | null; direction: string; confidence: string }) {
  await sendEmail(
    "sautkahraman@gmail.com",
    `⚠️ Reservation Manuel Fiyat Gerekli: ${reservation.customer_name}`,
    `<p>Pickup: ${reservation.pickup}</p><p>Dropoff: ${reservation.dropoff}</p><p>City: ${info.city}</p><p>Airport: ${info.airport}</p><p>District: ${info.district}</p>`
  );
}

async function findIntercityPrice(
  vehicleType: string,
  pickupCity: string | null,
  dropoffCity: string | null,
  pickupDistrict: string | null,
  dropoffDistrict: string | null,
): Promise<Record<string, unknown> | null> {
  const fromCity = pickupCity || dropoffCity;
  const toCity = dropoffCity || pickupCity;
  if (!fromCity || !toCity) return null;

  if (pickupDistrict && dropoffDistrict) {
    const prices = await supabaseQuery("intercity_prices", {
      vehicle_type: `eq.${vehicleType}`,
      from_city: `eq.${fromCity}`,
      to_city: `eq.${toCity}`,
      from_district: `eq.${pickupDistrict}`,
      to_district: `eq.${dropoffDistrict}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];

    const reverse = await supabaseQuery("intercity_prices", {
      vehicle_type: `eq.${vehicleType}`,
      from_city: `eq.${toCity}`,
      to_city: `eq.${fromCity}`,
      from_district: `eq.${dropoffDistrict}`,
      to_district: `eq.${pickupDistrict}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (reverse?.[0]) return reverse[0];
  }

  if (pickupDistrict) {
    const prices = await supabaseQuery("intercity_prices", {
      vehicle_type: `eq.${vehicleType}`,
      from_city: `eq.${fromCity}`,
      to_city: `eq.${toCity}`,
      from_district: `eq.${pickupDistrict}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];
  }

  const prices = await supabaseQuery("intercity_prices", {
    vehicle_type: `eq.${vehicleType}`,
    from_city: `eq.${fromCity}`,
    to_city: `eq.${toCity}`,
    is_active: "eq.true",
    select: "*",
    limit: "1",
  });
  if (prices?.[0]) return prices[0];

  if (fromCity !== toCity) {
    const reverse = await supabaseQuery("intercity_prices", {
      vehicle_type: `eq.${vehicleType}`,
      from_city: `eq.${toCity}`,
      to_city: `eq.${fromCity}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (reverse?.[0]) return reverse[0];
  }

  return null;
}

async function findBestPrice(vehicleType: string, city: string | null, airport: string | null, district: string | null): Promise<Record<string, unknown> | null> {
  // Strategy 1: Try with district if available
  if (district && city && airport) {
    const prices = await supabaseQuery("region_prices", {
      vehicle_type: `eq.${vehicleType}`,
      city: `eq.${city}`,
      airport: `eq.${airport}`,
      district: `eq.${district}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];
  }

  // Strategy 2: City + Airport without district
  if (city && airport) {
    const prices = await supabaseQuery("region_prices", {
      vehicle_type: `eq.${vehicleType}`,
      city: `eq.${city}`,
      airport: `eq.${airport}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];
  }

  // Strategy 3: City only
  if (city) {
    const prices = await supabaseQuery("region_prices", {
      vehicle_type: `eq.${vehicleType}`,
      city: `eq.${city}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];
  }

  // Strategy 4: Airport only
  if (airport) {
    const prices = await supabaseQuery("region_prices", {
      vehicle_type: `eq.${vehicleType}`,
      airport: `eq.${airport}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];
  }

  return null;
}

async function findIntracityAirportReferencePrice(
  vehicleType: string,
  city: string | null,
  pickupDistrict: string | null,
  dropoffDistrict: string | null,
): Promise<Record<string, unknown> | null> {
  if (!city) return null;

  const districtCandidates = [pickupDistrict, dropoffDistrict].filter(
    (district, index, arr): district is string => !!district && arr.indexOf(district) === index,
  );

  for (const targetDistrict of districtCandidates) {
    const lookupDistricts = [targetDistrict, normalizeTurkish(targetDistrict)];
    for (const lookupDistrict of lookupDistricts) {
      const prices = await supabaseQuery("region_prices", {
        vehicle_type: `eq.${vehicleType}`,
        city: `ilike.${city}`,
        district: `ilike.${lookupDistrict}`,
        airport: "not.is.null",
        is_active: "eq.true",
        select: "*",
        order: "price.asc",
        limit: "1",
      });
      if (prices?.[0]) return prices[0];
    }
  }

  const cityAirportPrices = await supabaseQuery("region_prices", {
    vehicle_type: `eq.${vehicleType}`,
    city: `ilike.${city}`,
    airport: "not.is.null",
    is_active: "eq.true",
    select: "*",
    order: "price.asc",
    limit: "1",
  });
  if (cityAirportPrices?.[0]) return cityAirportPrices[0];

  return null;
}

// ---- HANDLER ----
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const reservation_id: string = body.reservation_id;

    if (!reservation_id) {
      return new Response(JSON.stringify({ error: "reservation_id required", matched: false }), { status: 400, headers: corsHeaders });
    }

    // Fetch reservation
    const reservations = await supabaseQuery("reservations", {
      id: `eq.${reservation_id}`,
      select: "*",
    });

    const reservation = reservations?.[0];
    if (!reservation) {
      return new Response(JSON.stringify({ error: "Reservation not found", matched: false }), { status: 404, headers: corsHeaders });
    }

    // Skip agency
    if (reservation.agency_id || reservation.agency_user_id) {
      return new Response(JSON.stringify({ matched: false, reason: "agency_reservation" }), { headers: corsHeaders });
    }

    // Skip already priced
    if (reservation.price && reservation.price > 0) {
      return new Response(JSON.stringify({ matched: false, reason: "already_priced" }), { headers: corsHeaders });
    }

    const {
      airport,
      city,
      pickupCity,
      dropoffCity,
      pickupDistrict,
      dropoffDistrict,
      district,
      direction,
      confidence,
    } = analyzeSimple(reservation.pickup, reservation.dropoff);
    const pickupDistrictCity = inferCityFromDistrict(pickupDistrict);
    const dropoffDistrictCity = inferCityFromDistrict(dropoffDistrict);
    const resolvedPickupCity = pickupCity || pickupDistrictCity;
    const resolvedDropoffCity = dropoffCity || dropoffDistrictCity;
    const resolvedCity = resolvedPickupCity || resolvedDropoffCity || city;
    const intracityCity =
      resolvedPickupCity && resolvedDropoffCity && resolvedPickupCity === resolvedDropoffCity
        ? resolvedPickupCity
        : null;
    const fallbackSharedCity =
      !intracityCity && resolvedPickupCity && resolvedDropoffCity && isSameCity(resolvedPickupCity, resolvedDropoffCity)
        ? resolvedPickupCity
        : null;
    const routeIsTurkey = isTurkeyRoute({
      pickup: reservation.pickup || "",
      dropoff: reservation.dropoff || "",
      pickupCity: resolvedPickupCity,
      dropoffCity: resolvedDropoffCity,
      fallbackCity: resolvedCity,
      airport,
    });

    if (!resolvedCity && !airport && !routeIsTurkey) {
      await sendManualEmail(reservation, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_location_match" }), { headers: corsHeaders });
    }

    const isTurkeyIntracityAddressTransfer =
      !airport &&
      ((
        !!intracityCity && TURKEY_INTRACITY_DISCOUNT_CITIES.has(intracityCity)
      ) || (
        !!fallbackSharedCity && TURKEY_INTRACITY_DISCOUNT_CITIES.has(fallbackSharedCity)
      ));

    const hasDifferentResolvedCities =
      !!resolvedPickupCity &&
      !!resolvedDropoffCity &&
      !isSameCity(resolvedPickupCity, resolvedDropoffCity);
    const isIntercityTransfer =
      !airport &&
      !isTurkeyIntracityAddressTransfer &&
      hasDifferentResolvedCities;

    const parsedPickupDate = reservation.pickup_date ? new Date(reservation.pickup_date) : null;
    const pickupMonth =
      parsedPickupDate && !Number.isNaN(parsedPickupDate.getTime())
        ? parsedPickupDate.getUTCMonth() + 1
        : null;
    const kmPricingCity =
      intracityCity ||
      fallbackSharedCity ||
      resolvedPickupCity ||
      resolvedDropoffCity ||
      resolvedCity ||
      null;
    let distanceKm: number | null = null;

    // Find best price with fallback strategies
    let bestPrice: Record<string, unknown> | null = null;
    let priceSource = "region_prices";

    if (routeIsTurkey) {
      distanceKm = await fetchRouteDistanceKm(reservation.pickup || "", reservation.dropoff || "");
      if (distanceKm !== null && distanceKm <= KM_PRICING_MAX_DISTANCE_KM) {
        const kmRules = await fetchDistancePricingRules();
        const kmPrice = calculateKmPriceForVehicle(
          reservation.vehicle_type,
          distanceKm,
          kmRules,
          kmPricingCity,
          pickupMonth,
        );
        if (kmPrice) {
          bestPrice = {
            price: kmPrice.price,
            price_currency: kmPrice.currency,
          };
          priceSource = "km_pricing";
        }
      }
    }

    if (
      !bestPrice &&
      isTurkeyIntracityAddressTransfer &&
      (distanceKm === null || distanceKm <= KM_PRICING_MAX_DISTANCE_KM)
    ) {
      const referencePrice = await findIntracityAirportReferencePrice(
        reservation.vehicle_type,
        intracityCity || fallbackSharedCity || resolvedCity,
        pickupDistrict,
        dropoffDistrict,
      );
      if (referencePrice) {
        const basePrice = Number(referencePrice.price || 0);
        bestPrice = {
          ...referencePrice,
          price: applyIntracityAirportDiscount(basePrice),
          intracity_reference_price: basePrice,
        };
        priceSource = "intracity_airport_discount";
      }
    }

    if (!bestPrice && isIntercityTransfer && !airport) {
      const fromCity = resolvedPickupCity || resolvedCity;
      const toCity = resolvedDropoffCity || resolvedCity;
      if (!isSameCity(fromCity || null, toCity || null)) {
        bestPrice = await findIntercityPrice(
          reservation.vehicle_type,
          resolvedPickupCity,
          resolvedDropoffCity,
          pickupDistrict,
          dropoffDistrict,
        );
        if (bestPrice) priceSource = "intercity_prices";
      }
    }

    if (!bestPrice) {
      bestPrice = await findBestPrice(reservation.vehicle_type, resolvedCity, airport, district);
      priceSource = "region_prices";
    }

    if (!bestPrice) {
      await sendManualEmail(reservation, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_price_found", debug: { city: resolvedCity, airport, district, vehicleType: reservation.vehicle_type } }), { headers: corsHeaders });
    }

    const baseCurrency = (bestPrice.price_currency as string) || "EUR";
    const customerCurrency = reservation.price_currency || baseCurrency;

    let finalPrice = bestPrice.price as number;
    let finalCurrency = baseCurrency;
    if (customerCurrency !== baseCurrency) {
      const c = await convertCurrency(finalPrice, baseCurrency, customerCurrency);
      finalPrice = c.amount;
      finalCurrency = customerCurrency;
    }

    // Update reservation
    await supabaseQuery(
      "reservations",
      { id: `eq.${reservation_id}` },
      "PATCH",
      { price: finalPrice, price_currency: finalCurrency, status: "sent_to_driver" }
    );

    // Admin email
    await sendEmail(
      "sautkahraman@gmail.com",
      `🤖 Reservation Otomatik Fiyat: ${reservation.customer_name}`,
      `<p>Price: ${finalPrice} ${finalCurrency}</p><p>Route: ${reservation.pickup} → ${reservation.dropoff}</p><p>Matched: ${city} / ${airport} / ${district}</p>`
    );

    return new Response(JSON.stringify({
      matched: true,
      price: finalPrice,
      currency: finalCurrency,
      matchedCity: resolvedCity,
      matchedAirport: airport,
      matchedDistrict: district,
      matchedPickupDistrict: pickupDistrict,
      matchedDropoffDistrict: dropoffDistrict,
      distanceKm,
      priceSource,
      intracityDiscountApplied: priceSource === "intracity_airport_discount",
    }), { headers: corsHeaders });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    console.error("auto-price-reservation error:", error);
    return new Response(JSON.stringify({ error, matched: false }), { status: 500, headers: corsHeaders });
  }
});
