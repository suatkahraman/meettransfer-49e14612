import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

// NOTE: `_shared/*` was removed to prevent bundle timeouts. Keep this function self-contained.

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
  { re: /(ercan|\becn\b)/i, value: "ECN" },
  { re: /(dubai.*airport|\bdxb\b)/i, value: "DXB" },
  { re: /(zurich|\bzrh\b)/i, value: "ZRH" },
  { re: /(geneva|\bgva\b)/i, value: "GVA" },
  { re: /(basel|\bbsl\b)/i, value: "BSL" },
  { re: /(malpensa|\bmxp\b)/i, value: "MXP" },
];

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

function logAnalysis(
  scope: "quick_booking" | "reservation",
  entityId: string,
  pickup: string,
  dropoff: string,
  transferInfo: TransferInfo
) {
  console.log(`[analysis:${scope}] ${entityId}`, { pickup, dropoff, ...transferInfo });
}

function unique(list: string[]): string[] {
  return Array.from(new Set(list.filter(Boolean)));
}

function getVehicleFallbackList(requested: string): string[] {
  const r = (requested || "").toLowerCase();

  if (r.includes("dubai-")) return [requested];

  if (/(sprinter|minibus)/.test(r)) {
    return unique([
      requested,
      "sprinter",
      "mercedes-sprinter",
      "Mercedes Sprinter or Similar",
      "minibus",
      "maybach-minibus",
    ]);
  }

  if (/(vito|vclass)/.test(r)) {
    return unique([
      requested,
      "vito",
      "mercedes-vito",
      "Vip Mercedes Vito",
      "vip-vito",
      "mercedes-vip-vito",
      "minivan",
      "vip_minivan",
    ]);
  }

  if (/(minivan)/.test(r)) {
    return unique([requested, "minivan", "vip_minivan", "mercedes-vito", "vito"]);
  }

  if (/(sedan)/.test(r)) {
    return unique([requested, "sedan", "standard-sedan", "standard_sedan"]);
  }

  return [requested];
}

async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ amount: number; rate: number }> {
  if (fromCurrency === toCurrency) return { amount: Math.ceil(amount), rate: 1 };

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(fromCurrency)}&to=${encodeURIComponent(toCurrency)}`
    );

    if (response.ok) {
      const data = await response.json();
      const rate = data.rates?.[toCurrency];
      if (typeof rate === "number" && Number.isFinite(rate)) {
        return { amount: Math.ceil(amount * rate), rate };
      }
    }
  } catch (e) {
    console.error("Currency conversion error:", e);
  }

  // Conservative fallback
  return { amount: Math.ceil(amount), rate: 1 };
}

type ReturnPromoConfig = { code: string; discountPercent: number };

async function getActiveReturnPromoCode(supabase: any): Promise<ReturnPromoConfig | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("promo_codes")
    .select("code, discount_percentage, is_active, valid_until")
    .eq("is_active", true)
    .eq("applies_to", "return_transfer")
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("getActiveReturnPromoCode error:", error);
    return null;
  }

  if (!data?.code) return null;
  return { code: data.code, discountPercent: data.discount_percentage ?? 0 };
}

type DiscountInfo = {
  price: number;
  returnPrice: number | null;
  totalPrice: number;
  discountApplied: boolean;
  discountPercent: number;
};

function calculateDiscountWithConfig(
  oneWayPrice: number,
  hasReturnTrip: boolean,
  promoConfig: ReturnPromoConfig | null
): DiscountInfo {
  if (!hasReturnTrip) {
    return {
      price: Math.ceil(oneWayPrice),
      returnPrice: null,
      totalPrice: Math.ceil(oneWayPrice),
      discountApplied: false,
      discountPercent: 0,
    };
  }

  const discountPercent = Math.max(0, Math.min(90, promoConfig?.discountPercent ?? 25));
  const discountedReturn = Math.ceil(oneWayPrice * (1 - discountPercent / 100));
  const price = Math.ceil(oneWayPrice);
  return {
    price,
    returnPrice: discountedReturn,
    totalPrice: price + discountedReturn,
    discountApplied: discountPercent > 0,
    discountPercent,
  };
}

function manualPriceRequiredEmail(
  booking: any,
  info: {
    airport: string | null;
    city: string | null;
    district: string | null;
    direction: string;
    confidence: string;
    additionalReason?: string;
  },
  scope: "quick_booking" | "reservation"
): string {
  const reason = info.additionalReason ? `<p><strong>Reason:</strong> ${info.additionalReason}</p>` : "";
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;">
      <h2>Manual pricing required (${scope})</h2>
      ${reason}
      <p><strong>Pickup:</strong> ${booking.pickup}</p>
      <p><strong>Dropoff:</strong> ${booking.dropoff}</p>
      <p><strong>Date/Time:</strong> ${booking.pickup_date} ${booking.pickup_time}</p>
      <p><strong>Vehicle:</strong> ${booking.vehicle_type}</p>
      <hr />
      <p><strong>Matched city:</strong> ${info.city ?? "N/A"}</p>
      <p><strong>Matched district:</strong> ${info.district ?? "N/A"}</p>
      <p><strong>Matched airport:</strong> ${info.airport ?? "N/A"}</p>
      <p><strong>Direction:</strong> ${info.direction} (${info.confidence})</p>
    </div>
  `;
}

function generateCustomerPriceQuoteEmail(
  booking: {
    pickup: string;
    dropoff: string;
    pickup_date: string;
    pickup_time: string;
    vehicle_type: string;
    has_return_trip: boolean;
    return_date?: string | null;
    return_time?: string | null;
  },
  pricing: {
    price: number;
    returnPrice: number | null;
    totalPrice: number;
    currency: string;
    discountApplied: boolean;
    discountPercent: number;
  },
  confirmUrl: string,
  lang: string
): string {
  const l = (lang || "en").substring(0, 2);
  const t = {
    en: {
      title: "Your transfer quote",
      subtitle: "Confirm to finalize your booking",
      pickup: "Pickup",
      dropoff: "Dropoff",
      date: "Date",
      time: "Time",
      vehicle: "Vehicle",
      outbound: "Outbound",
      returnTrip: "Return",
      total: "Total",
      confirm: "Confirm booking",
    },
    tr: {
      title: "Transfer teklifiniz",
      subtitle: "Rezervasyonu tamamlamak için onaylayın",
      pickup: "Alış",
      dropoff: "Bırakış",
      date: "Tarih",
      time: "Saat",
      vehicle: "Araç",
      outbound: "Gidiş",
      returnTrip: "Dönüş",
      total: "Toplam",
      confirm: "Rezervasyonu onayla",
    },
    de: {
      title: "Ihr Transferangebot",
      subtitle: "Bestätigen Sie, um die Buchung abzuschließen",
      pickup: "Abholung",
      dropoff: "Ziel",
      date: "Datum",
      time: "Uhrzeit",
      vehicle: "Fahrzeug",
      outbound: "Hinfahrt",
      returnTrip: "Rückfahrt",
      total: "Gesamt",
      confirm: "Buchung bestätigen",
    },
    ru: {
      title: "Ваше предложение по трансферу",
      subtitle: "Подтвердите, чтобы завершить бронирование",
      pickup: "Откуда",
      dropoff: "Куда",
      date: "Дата",
      time: "Время",
      vehicle: "Авто",
      outbound: "Туда",
      returnTrip: "Обратно",
      total: "Итого",
      confirm: "Подтвердить",
    },
    ar: {
      title: "عرض النقل الخاص بك",
      subtitle: "قم بالتأكيد لإكمال الحجز",
      pickup: "الاستلام",
      dropoff: "الوجهة",
      date: "التاريخ",
      time: "الوقت",
      vehicle: "المركبة",
      outbound: "ذهاب",
      returnTrip: "عودة",
      total: "الإجمالي",
      confirm: "تأكيد الحجز",
    },
  } as const;

  const copy = (t as any)[l] ?? t.en;

  const priceLine = `<p style="font-size:22px;margin:0;"><strong>${copy.outbound}:</strong> ${pricing.price} ${pricing.currency}</p>`;
  const returnLine = booking.has_return_trip
    ? `<p style="font-size:20px;margin:8px 0 0 0;"><strong>${copy.returnTrip}:</strong> ${pricing.returnPrice ?? "-"} ${pricing.currency} ${pricing.discountApplied ? `<span style="font-size:12px;opacity:0.8;">(-${pricing.discountPercent}%)</span>` : ""}</p>`
    : "";
  const totalLine = booking.has_return_trip
    ? `<p style="font-size:24px;margin:12px 0 0 0;"><strong>${copy.total}:</strong> ${pricing.totalPrice} ${pricing.currency}</p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;">
      <h2 style="margin:0;">${copy.title}</h2>
      <p style="margin:6px 0 16px 0;color:#555;">${copy.subtitle}</p>

      <div style="padding:14px;border:1px solid #eee;border-radius:10px;margin-bottom:16px;">
        <p><strong>${copy.pickup}:</strong> ${booking.pickup}</p>
        <p><strong>${copy.dropoff}:</strong> ${booking.dropoff}</p>
        <p><strong>${copy.date}:</strong> ${booking.pickup_date}</p>
        <p><strong>${copy.time}:</strong> ${booking.pickup_time}</p>
        <p><strong>${copy.vehicle}:</strong> ${booking.vehicle_type}</p>
        ${booking.has_return_trip ? `<p><strong>${copy.returnTrip}:</strong> ${booking.return_date ?? ""} ${booking.return_time ?? ""}</p>` : ""}
      </div>

      <div style="padding:16px;background:#f6f7f9;border-radius:10px;">
        ${priceLine}
        ${returnLine}
        ${totalLine}
      </div>

      <div style="text-align:center;margin-top:18px;">
        <a href="${confirmUrl}" style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;">
          ${copy.confirm}
        </a>
      </div>

      <p style="margin-top:18px;color:#777;font-size:12px;">If the button doesn’t work, copy/paste this link: ${confirmUrl}</p>
    </div>
  `;
}


const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutoPriceRequest {
  quick_booking_id: string;
}

// Send admin notification for manual pricing
async function sendManualPriceRequestEmail(
  booking: any,
  transferInfo: any,
  reason?: string
): Promise<void> {
  const adminEmail = "sautkahraman@gmail.com";
  
  try {
    const emailHtml = manualPriceRequiredEmail(
      booking,
      {
        airport: transferInfo.airport,
        city: transferInfo.city,
        district: transferInfo.district,
        direction: transferInfo.direction,
        confidence: transferInfo.confidence,
        additionalReason: reason,
      },
      'quick_booking'
    );

      await resend.emails.send({
        from: "Meet Transfer <noreply@mail.meettransfer.app>",
        to: adminEmail,
        subject: `⚠️ Quick Booking Manuel Fiyat Gerekli: ${booking.customer_name || 'Misafir'}`,
      html: emailHtml,
    });
    console.log("📧 Manual price request email sent to admin for quick booking");
  } catch (emailError) {
    console.error("Failed to send manual price request email:", emailError);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { quick_booking_id }: AutoPriceRequest = await req.json();

    console.log("🚗 Auto-pricing started for quick booking:", quick_booking_id);

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from("quick_booking_requests")
      .select("*")
      .eq("id", quick_booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("❌ Booking not found:", bookingError);
      return new Response(JSON.stringify({ error: "Booking not found", matched: false }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Skip if agency booking (agencies get manual pricing)
    if (booking.agency_id || booking.agency_user_id) {
      console.log("🏢 Agency booking - skipping auto-price");
      return new Response(JSON.stringify({ matched: false, reason: "agency_booking" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Analyze transfer using shared module
    const transferInfo = analyzeTransfer(booking.pickup, booking.dropoff);
    logAnalysis('quick_booking', quick_booking_id, booking.pickup, booking.dropoff, transferInfo);

    const { airport, city, district, direction, confidence } = transferInfo;

    if (!city && !airport) {
      console.log("❌ No city or airport matched - manual pricing required");
      // Send email to admin for manual pricing
      await sendManualPriceRequestEmail(booking, transferInfo);
      return new Response(JSON.stringify({ matched: false, reason: "no_location_match" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if this is a city-to-city or intercity transfer
    const pickupCity = transferInfo.pickupAnalysis.city?.value || transferInfo.pickupAnalysis.district?.city || null;
    const dropoffCity = transferInfo.dropoffAnalysis.city?.value || transferInfo.dropoffAnalysis.district?.city || null;
    const pickupDistrict = transferInfo.pickupAnalysis.district?.value || null;
    const dropoffDistrict = transferInfo.dropoffAnalysis.district?.value || null;
    
    // IMPORTANT: Also check intercity when going to/from airport if the non-airport city is different from airport's city
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
      null
    ) : null;
    
    const nonAirportCity = direction === 'to_airport' ? pickupCity : 
                           direction === 'from_airport' ? dropoffCity : null;

    // Business rule: Same-city airport transfers must ONLY use regional prices.
    // If we can't find a regional price, we should request manual pricing (never fall back to intercity).
    const strictRegionalOnly = Boolean(airport && airportCity && nonAirportCity && nonAirportCity === airportCity);
    
    // Intercity conditions:
    // 1. city_to_city with different cities
    // 2. to_airport/from_airport where non-airport city is different from airport's city
    // 3. Same city but different districts (e.g., Kadıköy → Beylikdüzü)
    const isSameCityDifferentDistricts = (
      pickupCity === dropoffCity && 
      pickupDistrict && dropoffDistrict && 
      pickupDistrict !== dropoffDistrict &&
      !airport // Not an airport transfer
    );
    
    const isIntercity = (
      (direction === 'city_to_city' && pickupCity && dropoffCity && pickupCity !== dropoffCity) ||
      (airport && nonAirportCity && airportCity && nonAirportCity !== airportCity) ||
      isSameCityDifferentDistricts
    );
    
    // For intercity airport transfers, we need to know both cities
    // For same-city different districts, use the districts as from/to
    const intercityFromCity = isSameCityDifferentDistricts ? pickupCity :
                              direction === 'to_airport' ? pickupCity : 
                              direction === 'from_airport' ? airportCity : pickupCity;
    const intercityToCity = isSameCityDifferentDistricts ? dropoffCity :
                            direction === 'to_airport' ? airportCity : 
                            direction === 'from_airport' ? dropoffCity : dropoffCity;
    const intercityFromDistrict = isSameCityDifferentDistricts ? pickupDistrict :
                                  direction === 'to_airport' ? pickupDistrict : 
                                  direction === 'from_airport' ? airport : pickupDistrict;
    const intercityToDistrict = isSameCityDifferentDistricts ? dropoffDistrict :
                                direction === 'to_airport' ? airport : 
                                direction === 'from_airport' ? dropoffDistrict : dropoffDistrict;

    console.log("🔍 Route type:", isIntercity ? (isSameCityDifferentDistricts ? "same-city different districts" : "intercity") : "airport transfer", { 
      pickupCity, pickupDistrict, dropoffCity, dropoffDistrict, 
      airportCity, nonAirportCity, intercityFromCity, intercityToCity,
      isSameCityDifferentDistricts,
      strictRegionalOnly
    });

    // Get vehicle fallback list for flexible matching
    // Business rule: For strict regional airport transfers, do NOT fall back to other vehicle types.
    // If the requested vehicle has no regional price, request manual pricing.
    const vehicleFallbacks = strictRegionalOnly
      ? [booking.vehicle_type]
      : getVehicleFallbackList(booking.vehicle_type);
    console.log(`🚗 Vehicle requested: ${booking.vehicle_type}, Fallbacks: ${vehicleFallbacks.join(', ')}`);

    // Query for matching price - bidirectional (airport->address OR address->airport same price)
    let bestPrice: any = null;
    let matchType = '';

    // Get pickup date for seasonal pricing
    const pickupDate = booking.pickup_date; // YYYY-MM-DD format
    console.log(`📅 Pickup date for seasonal pricing: ${pickupDate}`);

    // Helper function to select best price from array (seasonal first, then base)
    const selectBestPrice = (data: any[] | null, vehicleType: string, matchDesc: string): boolean => {
      if (!data || data.length === 0) return false;
      
      // First try to find seasonal price matching the pickup date
      if (pickupDate) {
        const seasonalPrice = data.find(p => 
          p.valid_from && p.valid_to && 
          pickupDate >= p.valid_from && pickupDate <= p.valid_to
        );
        if (seasonalPrice) {
          bestPrice = seasonalPrice;
          matchType = `${matchDesc} [${vehicleType}] (seasonal)`;
          console.log(`🗓️ Seasonal price found with ${vehicleType}:`, bestPrice.price, bestPrice.price_currency);
          return true;
        }
      }
      
      // Fallback to base price (valid_from is NULL)
      const basePrice = data.find(p => !p.valid_from);
      if (basePrice) {
        bestPrice = basePrice;
        matchType = `${matchDesc} [${vehicleType}]`;
        console.log(`✅ Base price found with ${vehicleType}:`, bestPrice.price, bestPrice.price_currency);
        return true;
      }
      
      // If no base price, use first available (sorted by price)
      const sorted = data.sort((a: any, b: any) => a.price - b.price);
      bestPrice = sorted[0];
      matchType = `${matchDesc} [${vehicleType}]`;
      console.log(`✅ Price found with ${vehicleType}:`, bestPrice.price, bestPrice.price_currency);
      return true;
    };

    // Try each vehicle type in fallback order
    for (const vehicleType of vehicleFallbacks) {
      if (bestPrice) break;
      
      // 0. For intercity routes, first check intercity_prices table
      if (isIntercity && intercityFromCity && intercityToCity) {
        // Try exact district match first
        if (intercityFromDistrict && intercityToDistrict) {
          const { data: exactIntercityData } = await supabase
            .from("intercity_prices")
            .select("*")
            .eq("vehicle_type", vehicleType)
            .eq("is_active", true)
            .or(`and(from_city.eq.${intercityFromCity},from_district.eq.${intercityFromDistrict},to_city.eq.${intercityToCity},to_district.eq.${intercityToDistrict}),and(from_city.eq.${intercityToCity},from_district.eq.${intercityToDistrict},to_city.eq.${intercityFromCity},to_district.eq.${intercityFromDistrict})`);

          if (selectBestPrice(exactIntercityData, vehicleType, `intercity exact (${intercityFromCity}/${intercityFromDistrict} → ${intercityToCity}/${intercityToDistrict})`)) {
            break;
          }
        }
        
        // Try partial district match - when only one side has district (e.g., airport)
        if (!bestPrice && (intercityFromDistrict || intercityToDistrict)) {
          const districtToMatch = intercityFromDistrict || intercityToDistrict;
          const cityWithDistrict = intercityFromDistrict ? intercityFromCity : intercityToCity;
          const cityWithoutDistrict = intercityFromDistrict ? intercityToCity : intercityFromCity;
          
          const { data: partialData } = await supabase
            .from("intercity_prices")
            .select("*")
            .eq("vehicle_type", vehicleType)
            .eq("is_active", true)
            .or(`and(from_city.eq.${cityWithDistrict},from_district.eq.${districtToMatch},to_city.eq.${cityWithoutDistrict}),and(to_city.eq.${cityWithDistrict},to_district.eq.${districtToMatch},from_city.eq.${cityWithoutDistrict})`);

          if (selectBestPrice(partialData, vehicleType, `intercity partial (${cityWithDistrict}/${districtToMatch} → ${cityWithoutDistrict})`)) {
            break;
          }
        }
        
        // Try city-only match
        if (!bestPrice) {
          const { data: intercityData } = await supabase
            .from("intercity_prices")
            .select("*")
            .eq("vehicle_type", vehicleType)
            .eq("is_active", true)
            .is("from_district", null)
            .is("to_district", null)
            .or(`and(from_city.eq.${intercityFromCity},to_city.eq.${intercityToCity}),and(from_city.eq.${intercityToCity},to_city.eq.${intercityFromCity})`);

          if (selectBestPrice(intercityData, vehicleType, `intercity city-only (${intercityFromCity} → ${intercityToCity})`)) {
            break;
          }
        }
      }
      
      // 1. Try exact match (airport + city + district + vehicle)
      if (!bestPrice && airport && city && district) {
        const { data: exactMatch } = await supabase
          .from("region_prices")
          .select("*")
          .eq("city", city)
          .eq("airport", airport)
          .eq("district", district)
          .eq("vehicle_type", vehicleType)
          .eq("is_active", true);

        if (selectBestPrice(exactMatch, vehicleType, `exact (${airport} → ${city}/${district})`)) {
          break;
        }
      }

      // 2. Try airport + city match (any district)
      if (!bestPrice && airport && city) {
        const { data: cityMatch } = await supabase
          .from("region_prices")
          .select("*")
          .eq("city", city)
          .eq("airport", airport)
          .eq("vehicle_type", vehicleType)
          .eq("is_active", true);

        if (selectBestPrice(cityMatch, vehicleType, `city+airport (${airport} → ${city})`)) {
          break;
        }
      }

      // 3. Try city + district match (ONLY when airport is null - true intercity rows)
      if (!bestPrice && city && district) {
        const { data: cityDistrictMatch } = await supabase
          .from("region_prices")
          .select("*")
          .eq("city", city)
          .eq("district", district)
          .is("airport", null)
          .eq("vehicle_type", vehicleType)
          .eq("is_active", true);

        if (selectBestPrice(cityDistrictMatch, vehicleType, `city+district (${city}/${district})`)) {
          break;
        }
      }

      // NOTE: city-only match REMOVED - too broad, causes incorrect pricing
      // If no airport and no district match, require manual pricing

      // 4. Try airport only match (if we have airport but city matching failed)
      if (!bestPrice && airport) {
        const { data: airportOnlyMatch } = await supabase
          .from("region_prices")
          .select("*")
          .eq("airport", airport)
          .eq("vehicle_type", vehicleType)
          .eq("is_active", true);

        if (selectBestPrice(airportOnlyMatch, vehicleType, `airport-only (${airport})`)) {
          break;
        }
      }
    }

    if (!bestPrice) {
      console.log("❌ No price found for this route after trying all vehicle fallbacks");
      console.log(`   Searched: Airport=${airport}, City=${city}, District=${district}, Vehicles=${vehicleFallbacks.join(', ')}`);
      // Send email to admin for manual pricing
      await sendManualPriceRequestEmail(booking, transferInfo);
      return new Response(JSON.stringify({ 
        matched: false, 
        reason: "no_price_found",
        searchedParams: { airport, city, district, vehicles: vehicleFallbacks }
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`🎯 Best price found: ${bestPrice.price} ${bestPrice.price_currency} | Match type: ${matchType}`);

    // Sanity check: verify price is reasonable for the route
    const pickupCityForCheck = transferInfo.pickupAnalysis.city?.value || transferInfo.pickupAnalysis.district?.city || null;
    const dropoffCityForCheck = transferInfo.dropoffAnalysis.city?.value || transferInfo.dropoffAnalysis.district?.city || null;
    
    const sanityCheck = checkPriceSanity(
      pickupCityForCheck,
      dropoffCityForCheck,
      bestPrice.price,
      bestPrice.price_currency || 'EUR',
      booking.vehicle_type,
      airport
    );

    logPriceSanityCheck('quick_booking', quick_booking_id, sanityCheck);

    if (!sanityCheck.isValid) {
      console.log(`⚠️ Price sanity check FAILED: ${sanityCheck.reason}`);
      await sendManualPriceRequestEmail(booking, transferInfo, sanityCheck.reason);
      
      return new Response(JSON.stringify({ 
        matched: false, 
        reason: "price_sanity_failed",
        sanityCheck: {
          reason: sanityCheck.reason,
          minimumExpected: sanityCheck.minimumExpected,
          actualPrice: sanityCheck.actualPrice,
          vehicleType: sanityCheck.vehicleType,
          confidence: sanityCheck.confidence,
        },
        searchedParams: { airport, city, district, vehicles: vehicleFallbacks }
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`✅ Price sanity check passed (confidence: ${sanityCheck.confidence})`);

    // Admin enters price in EUR - check if customer requested different currency
    const basePriceCurrency = bestPrice.price_currency || 'EUR';
    const customerRequestedCurrency = booking.price_currency || basePriceCurrency;

    // Fetch active promo code from database for return trips
    let promoConfig = null;
    let appliedPromoCode = booking.promo_code;
    
    if (booking.has_return_trip) {
      // Get active return promo code from database
      promoConfig = await getActiveReturnPromoCode(supabase);
      if (promoConfig) {
        appliedPromoCode = promoConfig.code;
        console.log(`🎟️ Using active promo code from DB: ${promoConfig.code} (${promoConfig.discountPercent}%)`);
      }
    }

    // Calculate price with discount using DB config
    const discountInfo = calculateDiscountWithConfig(
      bestPrice.price,
      booking.has_return_trip || false,
      promoConfig
    );

    let finalPrice = discountInfo.price;
    let finalReturnPrice = discountInfo.returnPrice;
    let finalTotalPrice = discountInfo.totalPrice;
    let finalCurrency = basePriceCurrency;
    let exchangeRate = 1;

    // Convert to customer's requested currency if different
    if (customerRequestedCurrency !== basePriceCurrency) {
      const conversion = await convertCurrency(discountInfo.price, basePriceCurrency, customerRequestedCurrency);
      finalPrice = conversion.amount;
      exchangeRate = conversion.rate;
      finalCurrency = customerRequestedCurrency;
      
      if (discountInfo.returnPrice) {
        finalReturnPrice = Math.ceil(discountInfo.returnPrice * exchangeRate);
      }
      finalTotalPrice = finalPrice + (finalReturnPrice || 0);
      
      console.log(`💱 Currency converted: ${discountInfo.price} ${basePriceCurrency} → ${finalPrice} ${finalCurrency} (rate: ${exchangeRate})`);
    }

    // Update booking with price and promo code
    const { error: updateError } = await supabase
      .from("quick_booking_requests")
      .update({
        price: finalPrice,
        price_currency: finalCurrency,
        status: "price_sent",
        return_price: finalReturnPrice,
        promo_code: appliedPromoCode, // Save the applied promo code
      })
      .eq("id", quick_booking_id);

    if (updateError) {
      console.error("❌ Failed to update booking:", updateError);
      throw updateError;
    }

    console.log("✅ Booking updated with price:", finalPrice, finalCurrency);

    // Record price history
    try {
      await supabase.from("price_history").insert({
        quick_booking_id: quick_booking_id,
        price: finalPrice,
        price_currency: finalCurrency,
        action: "auto_sent",
        customer_note: `Otomatik: ${city || 'N/A'} - ${district || 'N/A'} (${airport || 'N/A'}) [${confidence}]${exchangeRate !== 1 ? ` [Kur: ${exchangeRate.toFixed(2)}]` : ''}`,
      });
    } catch (e) {
      console.error("Failed to record price history:", e);
    }

    // Send email notification to admin
    const adminEmail = "sautkahraman@gmail.com";
    try {
      await resend.emails.send({
        from: "Meet Transfer <noreply@mail.meettransfer.app>",
        to: adminEmail,
        subject: `🤖 Quick Booking Otomatik Fiyat: ${booking.customer_name || 'Misafir'} - ${finalTotalPrice} ${finalCurrency}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🤖 Quick Booking Otomatik Fiyat</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #10b981;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Müşteri Bilgileri</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Müşteri:</strong> ${booking.customer_name || 'Henüz girilmedi'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${booking.customer_email || 'Henüz girilmedi'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Telefon:</strong> ${booking.customer_phone || 'Henüz girilmedi'}</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Transfer Detayları</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Alış:</strong> ${booking.pickup}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Bırakış:</strong> ${booking.dropoff}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Tarih:</strong> ${booking.pickup_date}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Saat:</strong> ${booking.pickup_time}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Araç:</strong> ${booking.vehicle_type}</p>
                ${booking.has_return_trip ? `<p style="margin: 5px 0; color: #666;"><strong>Dönüş:</strong> ${booking.return_date} - ${booking.return_time}</p>` : ''}
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Eşleştirme Bilgisi</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Şehir:</strong> ${city || 'N/A'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>İlçe:</strong> ${district || 'N/A'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Havalimanı:</strong> ${airport || 'N/A'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Yön:</strong> ${direction} (${confidence})</p>
              </div>
              
              <div style="text-align: center; margin: 20px 0; padding: 20px; background: #10b981; border-radius: 8px;">
                ${exchangeRate !== 1 ? `<p style="font-size: 12px; color: #d1fae5; margin-bottom: 10px;">Baz Fiyat: ${discountInfo.price} ${basePriceCurrency} | Kur: ${exchangeRate.toFixed(2)}</p>` : ''}
                <p style="font-size: 14px; color: white; margin-bottom: 5px;">Gidiş Fiyatı</p>
                <p style="font-size: 28px; font-weight: bold; color: white; margin: 0;">
                  ${finalPrice} ${finalCurrency}
                </p>
                ${booking.has_return_trip ? `
                  <p style="font-size: 14px; color: white; margin: 10px 0 5px 0;">Dönüş Fiyatı</p>
                  <p style="font-size: 24px; font-weight: bold; color: white; margin: 0;">
                    ${finalReturnPrice} ${finalCurrency}
                    ${discountInfo.discountApplied ? `<span style="font-size: 12px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; margin-left: 8px;">%${discountInfo.discountPercent} İndirim</span>` : ''}
                  </p>
                  <div style="border-top: 1px solid rgba(255,255,255,0.3); margin-top: 15px; padding-top: 15px;">
                    <p style="font-size: 14px; color: white; margin-bottom: 5px;">Toplam</p>
                    <p style="font-size: 32px; font-weight: bold; color: white; margin: 0;">
                      ${finalTotalPrice} ${finalCurrency}
                    </p>
                  </div>
                ` : ''}
              </div>
              
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                Bu bildirim otomatik fiyat sistemi tarafından gönderilmiştir.<br>
                <strong>Not:</strong> Havalimanı ↔ Adres transferleri aynı fiyattır.
              </p>
            </div>
          </div>
        `,
      });
      console.log("📧 Admin notification email sent for quick booking");
    } catch (adminEmailError) {
      console.error("Failed to send admin notification email:", adminEmailError);
    }

    // Send email if customer email exists
    let emailSent = false;
    if (booking.customer_email) {
      try {
        const baseUrl = "https://meettransfer.app";
        const confirmUrl = `${baseUrl}/quick-booking-confirm?token=${booking.confirmation_token}`;
        
        // Get customer language preference (default to English)
        const customerLang = booking.language || 'en';
        console.log("📧 Sending email in language:", customerLang);

        const currencySymbols: Record<string, string> = {
          'EUR': '€',
          'USD': '$',
          'TRY': '₺',
          'GBP': '£',
          'AED': 'د.إ',
        };
        const currencySymbol = currencySymbols[finalCurrency] || finalCurrency;

        // Subject translations
        const subjectTranslations: Record<string, string> = {
          en: `Your Transfer Quote: ${currencySymbol}${finalPrice} - Meet Transfer`,
          tr: `Transfer Teklifiniz: ${currencySymbol}${finalPrice} - Meet Transfer`,
          de: `Ihr Transferangebot: ${currencySymbol}${finalPrice} - Meet Transfer`,
          ru: `Ваше предложение по трансферу: ${currencySymbol}${finalPrice} - Meet Transfer`,
          ar: `عرض النقل الخاص بك: ${currencySymbol}${finalPrice} - Meet Transfer`,
        };
        const emailSubject = subjectTranslations[customerLang.substring(0, 2)] || subjectTranslations.en;

        // Use the new multi-language email template
        const emailHtml = generateCustomerPriceQuoteEmail(
          {
            pickup: booking.pickup,
            dropoff: booking.dropoff,
            pickup_date: booking.pickup_date,
            pickup_time: booking.pickup_time,
            vehicle_type: booking.vehicle_type,
            has_return_trip: booking.has_return_trip,
            return_date: booking.return_date,
            return_time: booking.return_time,
          },
          {
            price: finalPrice,
            returnPrice: finalReturnPrice,
            totalPrice: finalTotalPrice,
            currency: finalCurrency,
            discountApplied: discountInfo.discountApplied,
            discountPercent: discountInfo.discountPercent,
          },
          confirmUrl,
          customerLang
        );

        const { error: emailError } = await resend.emails.send({
          from: "Meet Transfer <noreply@mail.meettransfer.app>",
          to: [booking.customer_email],
          subject: emailSubject,
          html: emailHtml,
        });

        if (!emailError) {
          emailSent = true;
          console.log("📧 Auto-price email sent to:", booking.customer_email, "in language:", customerLang);
        } else {
          console.error("❌ Email send error:", emailError);
        }
      } catch (emailErr) {
        console.error("❌ Failed to send email:", emailErr);
      }
    }

    console.log("✅ Auto-pricing completed successfully");

    return new Response(
      JSON.stringify({
        matched: true,
        price: finalPrice,
        currency: finalCurrency,
        baseCurrency: basePriceCurrency,
        exchangeRate: exchangeRate !== 1 ? exchangeRate : null,
        returnPrice: finalReturnPrice,
        totalPrice: finalTotalPrice,
        discountApplied: discountInfo.discountApplied,
        emailSent,
        matchedCity: city,
        matchedDistrict: district,
        matchedAirport: airport,
        direction,
        confidence,
        bidirectional: true, // Airport transfers are same price both ways
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Auto-price error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage, matched: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
