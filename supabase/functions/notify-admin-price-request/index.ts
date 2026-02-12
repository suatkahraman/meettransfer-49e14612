import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// District mapping for auto-pricing
const DISTRICT_MAPPING: Record<string, string> = {
  "alanya": "Alanya",
  "belek": "Belek",
  "side": "Side",
  "kemer": "Kemer",
  "lara": "Lara",
  "kundu": "Kundu",
  "manavgat": "Manavgat",
  "taksim": "Taksim",
  "sultanahmet": "Sultanahmet",
  "kadikoy": "Kadıköy",
  "besiktas": "Beşiktaş",
  "bodrum": "Bodrum Merkez",
  "fethiye": "Fethiye",
  "marmaris": "Marmaris",
  "cesme": "Çeşme",
  "kusadasi": "Kuşadası",
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

const ISTANBUL_DISTRICTS = new Set(["taksim", "sultanahmet", "kadikoy", "besiktas", "bakirkoy"]);
const ANKARA_DISTRICTS = new Set(["pursaklar", "kecioren", "ulus", "cankaya merkez", "mamak", "yenimahalle merkez"]);
const ANTALYA_DISTRICTS = new Set(["alanya", "belek", "side", "kemer", "lara", "kundu", "manavgat"]);
const BODRUM_DISTRICTS = new Set(["bodrum merkez", "turgutreis"]);
const DALAMAN_DISTRICTS = new Set(["fethiye", "oludeniz", "marmaris", "dalyan"]);
const IZMIR_DISTRICTS = new Set(["cesme", "kusadasi"]);

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

function analyzeLocation(pickup: string, dropoff: string): {
  airport: string | null;
  city: string | null;
  pickupCity: string | null;
  dropoffCity: string | null;
  pickupDistrict: string | null;
  dropoffDistrict: string | null;
  district: string | null;
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

  const pickupCity = detectCity(pickup);
  const dropoffCity = detectCity(dropoff);
  const city = pickupCity || dropoffCity;

  const pickupDistrict = detectDistrict(pickup);
  const dropoffDistrict = detectDistrict(dropoff);
  const district = pickupDistrict || dropoffDistrict;

  return { airport, city, pickupCity, dropoffCity, pickupDistrict, dropoffDistrict, district };
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      pickup, 
      dropoff, 
      passengers, 
      vehicleType, 
      customerName,
      customerSessionId,
      language = 'EN',
      pickupDate,
      pickupTime,
      customerPhone,
      customerEmail,
      babySeatCount,
      luggageCount,
      serviceType = 'airport_transfer',
      hasReturnTrip,
      returnDate,
      returnTime,
      priceCurrency = 'EUR'
    } = await req.json();

    console.log("Price request notification for route:", pickup, "->", dropoff);
    console.log("Additional data:", { pickupDate, pickupTime, customerPhone, customerEmail, passengers, vehicleType });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // AUTO-PRICING: Try to find price before notifying admin
    // ============================================
    let autoPrice: number | null = null;
    let autoPriceCurrency: string | null = null;
    let returnPrice: number | null = null;
    let autoPriced = false;

    const { airport, city, pickupCity, dropoffCity, pickupDistrict, dropoffDistrict, district } = analyzeLocation(pickup, dropoff);
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
    console.log("Location analysis:", { airport, city: resolvedCity, pickupCity: resolvedPickupCity, dropoffCity: resolvedDropoffCity, pickupDistrict, dropoffDistrict, district });

    const routeIsTurkey = isTurkeyRoute({
      pickup,
      dropoff,
      pickupCity: resolvedPickupCity,
      dropoffCity: resolvedDropoffCity,
      fallbackCity: resolvedCity,
      airport,
    });

    if (resolvedCity || airport || routeIsTurkey) {
      const selectedVehicle = vehicleType || 'mercedes-vito';
      const parsedPickupDate = pickupDate ? new Date(pickupDate) : null;
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
      const hasDifferentResolvedCities =
        !!resolvedPickupCity &&
        !!resolvedDropoffCity &&
        !isSameCity(resolvedPickupCity, resolvedDropoffCity);
      let distanceKm: number | null = null;

      const isTurkeyIntracityAddressTransfer =
        !airport &&
        ((
          !!intracityCity && TURKEY_INTRACITY_DISCOUNT_CITIES.has(intracityCity)
        ) || (
          !!fallbackSharedCity && TURKEY_INTRACITY_DISCOUNT_CITIES.has(fallbackSharedCity)
        ));

      if (routeIsTurkey) {
        distanceKm = await fetchRouteDistanceKm(pickup, dropoff);
        if (distanceKm !== null && distanceKm <= KM_PRICING_MAX_DISTANCE_KM) {
          const { data: kmRulesRaw } = await supabase
            .from('distance_pricing_rules')
            .select('country,city,month,km_from,km_to,vehicle_type,pricing_mode,price_amount,price_currency')
            .eq('country', KM_PRICING_COUNTRY_CODE)
            .eq('is_active', true)
            .order('updated_at', { ascending: false });

          const kmRules = (kmRulesRaw || [])
            .map((row: any) => ({
              country: String(row.country || KM_PRICING_COUNTRY_CODE),
              city: row.city ? String(row.city) : null,
              month: row.month === null || row.month === undefined ? null : Number(row.month),
              km_from: Number(row.km_from),
              km_to: Number(row.km_to),
              vehicle_type: String(row.vehicle_type || KM_GLOBAL_VEHICLE_TOKEN),
              pricing_mode: String(row.pricing_mode || ''),
              price_amount: Number(row.price_amount),
              price_currency: String(row.price_currency || 'EUR'),
            }))
            .filter((row: DistancePricingRule) =>
              Number.isFinite(row.km_from) &&
              Number.isFinite(row.km_to) &&
              row.km_from >= 1 &&
              row.km_to >= row.km_from &&
              Number.isFinite(row.price_amount) &&
              row.price_amount > 0 &&
              !!row.pricing_mode
            );

          const kmPrice = calculateKmPriceForVehicle(
            selectedVehicle,
            distanceKm,
            kmRules,
            kmPricingCity,
            pickupMonth,
          );

          if (kmPrice) {
            if (priceCurrency !== kmPrice.currency) {
              const converted = await convertCurrency(kmPrice.price, kmPrice.currency, priceCurrency);
              autoPrice = converted.amount;
              autoPriceCurrency = priceCurrency;
            } else {
              autoPrice = kmPrice.price;
              autoPriceCurrency = kmPrice.currency;
            }

            if (hasReturnTrip) {
              returnPrice = Math.ceil(autoPrice! * 0.75);
            }

            autoPriced = true;
            console.log("✅ KM auto-price found:", { distanceKm, price: autoPrice, currency: autoPriceCurrency });
          }
        }
      }

      if (
        !autoPriced &&
        isTurkeyIntracityAddressTransfer &&
        (distanceKm === null || distanceKm <= KM_PRICING_MAX_DISTANCE_KM)
      ) {
        const referenceCity = intracityCity || fallbackSharedCity || resolvedCity;
        const districtCandidates = [pickupDistrict, dropoffDistrict].filter(
          (candidate, index, arr): candidate is string => !!candidate && arr.indexOf(candidate) === index,
        );
        let foundPrice: any = null;

        for (const targetDistrict of districtCandidates) {
          const lookupDistricts = [targetDistrict, normalizeTurkish(targetDistrict)];
          for (const lookupDistrict of lookupDistricts) {
            const { data: districtPrices } = await supabase
              .from('region_prices')
              .select('*')
              .eq('is_active', true)
              .eq('vehicle_type', selectedVehicle)
              .ilike('city', referenceCity!)
              .ilike('district', lookupDistrict)
              .not('airport', 'is', null)
              .order('price', { ascending: true })
              .limit(1);
            if (districtPrices && districtPrices[0]) {
              foundPrice = districtPrices[0];
              break;
            }
          }
          if (foundPrice) break;
        }

        if (!foundPrice) {
          const { data: cityAirportPrices } = await supabase
            .from('region_prices')
            .select('*')
            .eq('is_active', true)
            .eq('vehicle_type', selectedVehicle)
            .ilike('city', referenceCity!)
            .not('airport', 'is', null)
            .order('price', { ascending: true })
            .limit(1);
          if (cityAirportPrices && cityAirportPrices[0]) {
            foundPrice = cityAirportPrices[0];
          }
        }

        if (foundPrice) {
          const intracityDiscountedPrice = applyIntracityAirportDiscount(Number(foundPrice.price));
          const baseCurrency = foundPrice.price_currency || "EUR";

          if (priceCurrency !== baseCurrency) {
            const converted = await convertCurrency(intracityDiscountedPrice, baseCurrency, priceCurrency);
            autoPrice = converted.amount;
            autoPriceCurrency = priceCurrency;
          } else {
            autoPrice = intracityDiscountedPrice;
            autoPriceCurrency = baseCurrency;
          }

          if (hasReturnTrip) {
            returnPrice = Math.ceil(autoPrice! * 0.75);
          }

          autoPriced = true;
          console.log("✅ Intracity auto-price found:", {
            city: referenceCity,
            pickupDistrict,
            dropoffDistrict,
            basePrice: foundPrice.price,
            discountedPrice: intracityDiscountedPrice,
            currency: autoPriceCurrency,
          });
        }
      }

      if (!autoPriced && !airport && hasDifferentResolvedCities) {
        let intercityFound: any = null;

        if (pickupDistrict && dropoffDistrict && resolvedPickupCity && resolvedDropoffCity) {
          const { data: exactIntercity } = await supabase
            .from('intercity_prices')
            .select('*')
            .eq('is_active', true)
            .eq('vehicle_type', selectedVehicle)
            .eq('from_city', resolvedPickupCity)
            .eq('to_city', resolvedDropoffCity)
            .eq('from_district', pickupDistrict)
            .eq('to_district', dropoffDistrict)
            .limit(1);
          if (exactIntercity && exactIntercity[0]) intercityFound = exactIntercity[0];
        }

        if (!intercityFound && resolvedPickupCity && resolvedDropoffCity) {
          const { data: cityIntercity } = await supabase
            .from('intercity_prices')
            .select('*')
            .eq('is_active', true)
            .eq('vehicle_type', selectedVehicle)
            .eq('from_city', resolvedPickupCity)
            .eq('to_city', resolvedDropoffCity)
            .limit(1);
          if (cityIntercity && cityIntercity[0]) intercityFound = cityIntercity[0];
        }

        if (!intercityFound && resolvedPickupCity && resolvedDropoffCity && resolvedPickupCity !== resolvedDropoffCity) {
          const { data: reverseIntercity } = await supabase
            .from('intercity_prices')
            .select('*')
            .eq('is_active', true)
            .eq('vehicle_type', selectedVehicle)
            .eq('from_city', resolvedDropoffCity)
            .eq('to_city', resolvedPickupCity)
            .limit(1);
          if (reverseIntercity && reverseIntercity[0]) intercityFound = reverseIntercity[0];
        }

        if (intercityFound) {
          const baseCurrency = intercityFound.price_currency || "EUR";
          if (priceCurrency !== baseCurrency) {
            const converted = await convertCurrency(Number(intercityFound.price), baseCurrency, priceCurrency);
            autoPrice = converted.amount;
            autoPriceCurrency = priceCurrency;
          } else {
            autoPrice = Number(intercityFound.price);
            autoPriceCurrency = baseCurrency;
          }
          if (hasReturnTrip) {
            returnPrice = Math.ceil(autoPrice! * 0.75);
          }
          autoPriced = true;
          console.log("✅ Intercity auto-price found:", { price: autoPrice, currency: autoPriceCurrency });
        }
      }

      // Try to find price with different region strategies
      const strategies = autoPriced ? [] : [
        district && resolvedCity && airport ? { vehicle_type: `eq.${selectedVehicle}`, city: `eq.${resolvedCity}`, airport: `eq.${airport}`, district: `eq.${district}`, is_active: "eq.true" } : null,
        resolvedCity && airport ? { vehicle_type: `eq.${selectedVehicle}`, city: `eq.${resolvedCity}`, airport: `eq.${airport}`, is_active: "eq.true" } : null,
        resolvedCity ? { vehicle_type: `eq.${selectedVehicle}`, city: `eq.${resolvedCity}`, is_active: "eq.true" } : null,
        airport ? { vehicle_type: `eq.${selectedVehicle}`, airport: `eq.${airport}`, is_active: "eq.true" } : null,
      ].filter(Boolean);

      for (const strategy of strategies) {
        if (!strategy) continue;

        let query = supabase.from('region_prices').select('*').eq('is_active', true);
        if (strategy.vehicle_type) query = query.eq('vehicle_type', selectedVehicle);
        if (strategy.city) query = query.eq('city', resolvedCity);
        if (strategy.airport) query = query.eq('airport', airport);
        if (strategy.district) query = query.eq('district', district);

        const { data: prices } = await query.limit(1);

        if (prices && prices[0]) {
          const foundPrice = prices[0];
          const baseCurrency = foundPrice.price_currency || "EUR";

          if (priceCurrency !== baseCurrency) {
            const converted = await convertCurrency(foundPrice.price, baseCurrency, priceCurrency);
            autoPrice = converted.amount;
            autoPriceCurrency = priceCurrency;
          } else {
            autoPrice = foundPrice.price;
            autoPriceCurrency = baseCurrency;
          }

          if (hasReturnTrip) {
            returnPrice = Math.ceil(autoPrice! * 0.75);
          }

          autoPriced = true;
          console.log("✅ Auto-price found:", autoPrice, autoPriceCurrency, "from region strategy");
          break;
        }
      }
    }

    // If auto-price found AND we have customerSessionId, create/update quick_booking_requests
    let quickBookingId: string | null = null;
    
    if (autoPriced && customerSessionId) {
      // Check if quick booking already exists for this session
      const { data: existingBooking } = await supabase
        .from('quick_booking_requests')
        .select('id')
        .eq('customer_session_id', customerSessionId)
        .eq('pickup', pickup)
        .eq('dropoff', dropoff)
        .maybeSingle();
      
      if (existingBooking) {
        // Update existing
        await supabase
          .from('quick_booking_requests')
          .update({
            price: autoPrice,
            price_currency: autoPriceCurrency,
            return_price: returnPrice,
            status: 'price_sent',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingBooking.id);
        
        quickBookingId = existingBooking.id;
        console.log("✅ Updated existing quick booking with auto-price:", quickBookingId);
      } else {
        // Create new quick booking with price
        const { data: newBooking, error: insertError } = await supabase
          .from('quick_booking_requests')
          .insert({
            customer_session_id: customerSessionId,
            pickup,
            dropoff,
            pickup_date: pickupDate || new Date().toISOString().split('T')[0],
            pickup_time: pickupTime || '10:00',
            passengers: passengers || 1,
            vehicle_type: vehicleType || 'mercedes-vito',
            price: autoPrice,
            price_currency: autoPriceCurrency,
            return_price: returnPrice,
            has_return_trip: hasReturnTrip || false,
            return_date: returnDate || null,
            return_time: returnTime || null,
            status: 'price_sent',
            service_type: serviceType,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            customer_email: customerEmail || null,
            baby_seat_count: babySeatCount || 0,
            luggage_count: luggageCount || null,
            language: language || 'EN',
          })
          .select()
          .single();
        
        if (!insertError && newBooking) {
          quickBookingId = newBooking.id;
          console.log("✅ Created quick booking with auto-price:", quickBookingId);
        } else {
          console.error("Failed to create quick booking:", insertError);
        }
      }
      
      // If auto-priced successfully, return early - no need to notify admin
      if (quickBookingId) {
        console.log("✅ Auto-pricing complete, skipping admin notification");
        return new Response(JSON.stringify({ 
          success: true, 
          autoPriced: true,
          price: autoPrice,
          priceCurrency: autoPriceCurrency,
          returnPrice,
          quickBookingId,
          message: "Auto-priced successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ============================================
    // If NO auto-price found, notify admin as before
    // ============================================
    console.log("⚠️ No auto-price found, notifying admin...");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    // Get admin emails
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(JSON.stringify({ success: false, error: "No admins found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin email addresses
    const adminEmails: string[] = [];
    for (const admin of adminRoles) {
      const { data: userData } = await supabase.auth.admin.getUserById(admin.user_id);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(JSON.stringify({ success: false, error: "No admin emails" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vehicleNames: Record<string, string> = {
      'mercedes-vito': 'Mercedes Vito',
      'vip-mercedes': 'Mercedes Vito VIP',
      'maybach-minibus': 'Mercedes Maybach Minivan',
      'minibus': 'Mercedes Sprinter'
    };

    const isTurkish = language === 'TR';
    
    const subject = isTurkish 
      ? `🚨 Acil Fiyat Talebi - ${pickup} → ${dropoff}`
      : `🚨 Urgent Price Request - ${pickup} → ${dropoff}`;

    const adminPanelUrl = 'https://meettransfer.app/admin/quick-bookings';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .route-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .route-item { display: flex; align-items: center; margin: 10px 0; }
          .label { color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 16px; font-weight: 600; color: #1e293b; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .cta-button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 ${isTurkish ? 'Acil Fiyat Talebi' : 'Urgent Price Request'}</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>${isTurkish ? 'Dikkat!' : 'Attention!'}</strong> 
              ${isTurkish 
                ? 'Müşteri için bu güzergahta fiyat bulunamadı. Lütfen hemen fiyat girin.' 
                : 'No price found for this route. Please enter a price immediately.'}
            </div>
            
            <div class="route-box">
              <div class="route-item">
                <div>
                  <p class="label">📍 ${isTurkish ? 'Alış Noktası' : 'Pickup'}</p>
                  <p class="value">${pickup}</p>
                </div>
              </div>
              <div style="text-align: center; color: #64748b; margin: 10px 0;">↓</div>
              <div class="route-item">
                <div>
                  <p class="label">🏁 ${isTurkish ? 'Varış Noktası' : 'Dropoff'}</p>
                  <p class="value">${dropoff}</p>
                </div>
              </div>
            </div>
            
            <div class="info-grid">
              <div>
                <p class="label">👥 ${isTurkish ? 'Yolcu Sayısı' : 'Passengers'}</p>
                <p class="value">${passengers || 'Belirtilmedi'}</p>
              </div>
              <div>
                <p class="label">🚗 ${isTurkish ? 'Araç Tipi' : 'Vehicle Type'}</p>
                <p class="value">${vehicleNames[vehicleType] || vehicleType || 'Belirtilmedi'}</p>
              </div>
              ${pickupDate ? `
              <div>
                <p class="label">📅 ${isTurkish ? 'Tarih' : 'Date'}</p>
                <p class="value">${pickupDate}</p>
              </div>
              ` : ''}
              ${pickupTime ? `
              <div>
                <p class="label">🕐 ${isTurkish ? 'Saat' : 'Time'}</p>
                <p class="value">${pickupTime}</p>
              </div>
              ` : ''}
              ${customerName ? `
              <div>
                <p class="label">👤 ${isTurkish ? 'Müşteri' : 'Customer'}</p>
                <p class="value">${customerName}</p>
              </div>
              ` : ''}
              ${customerPhone ? `
              <div>
                <p class="label">📱 ${isTurkish ? 'Telefon' : 'Phone'}</p>
                <p class="value">${customerPhone}</p>
              </div>
              ` : ''}
            </div>
            
            <p style="color: #64748b; margin-top: 20px;">
              ${isTurkish 
                ? 'Müşteri şu anda bekliyor. Fiyatı girdikten sonra AI asistan otomatik olarak müşteriye bildirecek.' 
                : 'Customer is currently waiting. Once you enter the price, the AI assistant will automatically notify them.'}
            </p>
            
            <div style="text-align: center;">
              <a href="${adminPanelUrl}" class="cta-button">
                ${isTurkish ? 'Quick Bookings\'e Git' : 'Go to Quick Bookings'}
              </a>
            </div>
          </div>
          <div class="footer">
            <p>Meet Transfer - VIP Transfer Service</p>
            <p style="color: #94a3b8; font-size: 11px;">Session ID: ${customerSessionId || 'N/A'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Meet Transfer <noreply@mail.meettransfer.app>',
        to: adminEmails,
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent:", emailResult);

    // Create notification in database
    for (const admin of adminRoles) {
      await supabase.from('notifications').insert({
        user_id: admin.user_id,
        title: isTurkish ? 'Acil Fiyat Talebi' : 'Urgent Price Request',
        message: isTurkish 
          ? `${pickup} → ${dropoff} güzergahı için fiyat girilmesi gerekiyor.`
          : `Price needed for route: ${pickup} → ${dropoff}`,
        type: 'price_request',
      });
    }

    // Send push notification to admins
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds: adminRoles.map(a => a.user_id),
          title: isTurkish ? '🚨 Acil Fiyat Talebi' : '🚨 Urgent Price Request',
          body: `${pickup} → ${dropoff}`,
          url: adminPanelUrl,
          tag: 'price-request',
        }
      });
      console.log("Push notifications sent to admins");
    } catch (pushErr) {
      console.error("Failed to send push notifications:", pushErr);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      autoPriced: false,
      emailsSent: adminEmails.length,
      notificationsCreated: adminRoles.length,
      quickBookingId: null,
      message: "Admin notified - manual pricing required"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in notify-admin-price-request:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
