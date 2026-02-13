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

// ---- Minimal helpers ----
function analyzeSimple(pickup: string, dropoff: string): { 
  airport: string | null; city: string | null; 
  pickupCity: string | null; dropoffCity: string | null;
  pickupDistrict: string | null; dropoffDistrict: string | null;
  district: string | null; direction: string; confidence: string 
} {
  const s = normalizeTurkish(pickup + " " + dropoff).toLowerCase();

  let airport: string | null = null;
  // Türkiye - Tüm havalimanları (KM tabanlı bölgesel fiyatlandırma kapsamı)
  if (/istanbul airport|\bist\b/i.test(s)) airport = "Istanbul Airport (IST)";
  else if (/sabiha|gokcen|\bsaw\b/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
  else if (/gazipasa|gazipaşa|\bgzp\b|alanya.*airport/i.test(s)) airport = "Gazipasa-Alanya Airport (GZP)";
  else if (/antalya.*airport|antalya.*havalimani|\bayt\b/i.test(s)) airport = "Antalya Airport (AYT)";
  else if (/\bbjv\b|bodrum.*airport|milas.*airport|bodrum.*havalimani|milas.*havalimani/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
  else if (/\bdlm\b|dalaman.*airport|dalaman.*havalimani/i.test(s)) airport = "Dalaman Airport (DLM)";
  else if (/adnan menderes|\badb\b/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";
  else if (/kayseri|\basr\b|erkilet/i.test(s)) airport = "Kayseri Airport (ASR)";
  else if (/nevsehir|nevşehir|kapadokya|\bnav\b/i.test(s)) airport = "Nevsehir-Kapadokya Airport (NAV)";
  else if (/esenboga|esenboğa|\besb\b|ankara.*airport/i.test(s)) airport = "Ankara Esenboga Airport (ESB)";
  else if (/adana|sakirpasa|\bada\b/i.test(s)) airport = "Adana Sakirpasa Airport (ADA)";
  else if (/gaziantep|\bgzt\b|oguzeli/i.test(s)) airport = "Gaziantep Airport (GZT)";
  else if (/trabzon|\btzx\b/i.test(s)) airport = "Trabzon Airport (TZX)";
  else if (/diyarbakir|diyarbakır|\bdiy\b/i.test(s)) airport = "Diyarbakir Airport (DIY)";
  else if (/van.*(airport|havalimani|havalimanı)|(airport|havalimani|havalimanı).*van|\bvan\b.*havalimani/i.test(s)) airport = "Van Ferit Melen Airport (VAN)";
  else if (/malatya|\bmlx\b/i.test(s)) airport = "Malatya Airport (MLX)";
  else if (/samsun|\bszf\b|carsamba.*airport/i.test(s)) airport = "Samsun Carsamba Airport (SZF)";
  else if (/cengiz topel|\bkco\b|kocaeli.*airport/i.test(s)) airport = "Kocaeli Cengiz Topel Airport (KCO)";
  else if (/tekirdag|tekirdağ|corlu|çorlu|\bteq\b/i.test(s)) airport = "Tekirdag Corlu Airport (TEQ)";
  else if (/edirne|\bedn\b/i.test(s)) airport = "Edirne Airport (EDN)";
  else if (/kars|\bkhv\b|harakani/i.test(s)) airport = "Kars Harakani Airport (KHV)";
  else if (/denizli|cardak|çardak|\bdnz\b|pamukkale.*airport/i.test(s)) airport = "Denizli Cardak Airport (DNZ)";
  else if (/elazig|elazığ|\bezs\b/i.test(s)) airport = "Elazig Airport (EZS)";
  else if (/sivas|\bvas\b|nuri demirag/i.test(s)) airport = "Sivas Nuri Demirag Airport (VAS)";
  else if (/sinop|\bnop\b/i.test(s)) airport = "Sinop Airport (NOP)";
  else if (/kastamonu|\bkfs\b/i.test(s)) airport = "Kastamonu Airport (KFS)";
  else if (/zonguldak|\bonq\b|caycuma|çaycuma/i.test(s)) airport = "Zonguldak Caycuma Airport (ONQ)";
  else if (/sirnak|sırnak|\bnkt\b/i.test(s)) airport = "Sirnak Airport (NKT)";
  else if (/agri|ağrı|\baji\b/i.test(s)) airport = "Agri Airport (AJI)";
  else if (/mardin|\bmqm\b/i.test(s)) airport = "Mardin Airport (MQM)";
  else if (/afyon|zafer|\bkzr\b/i.test(s)) airport = "Afyon Zafer Airport (KZR)";
  else if (/mus.*airport|muş.*havalimani|\bmsr\b/i.test(s)) airport = "Mus Airport (MSR)";
  else if (/erzurum|\berz\b/i.test(s)) airport = "Erzurum Airport (ERZ)";
  else if (/erzincan|\berc\b/i.test(s)) airport = "Erzincan Airport (ERC)";
  else if (/sanliurfa|şanlıurfa|urfa.*airport|\bsfq\b|gap.*airport/i.test(s)) airport = "Sanliurfa GAP Airport (SFQ)";
  else if (/hatay|\bhty\b|antakya.*airport|iskenderun.*airport/i.test(s)) airport = "Hatay Airport (HTY)";
  else if (/balikesir|balıkesir|koca seyit|\bedo\b|bandirma.*airport/i.test(s)) airport = "Balikesir Koca Seyit Airport (EDO)";
  else if (/canakkale|çanakkale|\bckz\b/i.test(s)) airport = "Canakkale Airport (CKZ)";
  else if (/ordu|giresun|\bogu\b/i.test(s)) airport = "Ordu-Giresun Airport (OGU)";
  else if (/rize|artvin|\brzv\b|cayeli/i.test(s)) airport = "Rize-Artvin Airport (RZV)";
  else if (/bursa|yenisehir|\byei\b/i.test(s)) airport = "Bursa Yenisehir Airport (YEI)";

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

async function sendManualEmail(booking: Record<string, unknown>, info: { airport: string | null; city: string | null; district: string | null; direction: string; confidence: string }) {
  await sendEmail(
    "sautkahraman@gmail.com",
    `⚠️ Quick Booking Manuel Fiyat Gerekli: ${booking.customer_name || "Misafir"}`,
    `<p>Pickup: ${booking.pickup}</p><p>Dropoff: ${booking.dropoff}</p><p>City: ${info.city}</p><p>Airport: ${info.airport}</p><p>District: ${info.district}</p>`
  );
}

// Find price from intercity_prices table (for non-airport transfers)
async function findIntercityPrice(
  vehicleType: string, 
  pickupCity: string | null, dropoffCity: string | null,
  pickupDistrict: string | null, dropoffDistrict: string | null
): Promise<Record<string, unknown> | null> {
  const fromCity = pickupCity || dropoffCity;
  const toCity = dropoffCity || pickupCity;
  if (!fromCity || !toCity) return null;

  // Strategy I1: from_district + to_district + cities
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

    // Try reverse direction
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

  // Strategy I2: from_district + cities
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

  // Strategy I3: cities only
  const prices = await supabaseQuery("intercity_prices", {
    vehicle_type: `eq.${vehicleType}`,
    from_city: `eq.${fromCity}`,
    to_city: `eq.${toCity}`,
    is_active: "eq.true",
    select: "*",
    limit: "1",
  });
  if (prices?.[0]) return prices[0];

  // Try reverse
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

// Find price from region_prices table (for airport transfers)
async function findRegionPrice(vehicleType: string, city: string | null, airport: string | null, district: string | null): Promise<Record<string, unknown> | null> {
  // Strategy R1: District + City + Airport
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

  // Strategy R2: City + Airport
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

  // Strategy R3: District + City
  if (district && city) {
    const prices = await supabaseQuery("region_prices", {
      vehicle_type: `eq.${vehicleType}`,
      city: `eq.${city}`,
      district: `eq.${district}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];
  }

  // Strategy R4: City only
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

  // Strategy R5: Airport only
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
    const { quick_booking_id }: { quick_booking_id: string } = await req.json();

    // Fetch booking
    const bookings = await supabaseQuery("quick_booking_requests", {
      id: `eq.${quick_booking_id}`,
      select: "*",
    });

    const booking = bookings?.[0];
    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found", matched: false }), { status: 404, headers: corsHeaders });
    }

    // Skip agency
    if (booking.agency_id || booking.agency_user_id) {
      return new Response(JSON.stringify({ matched: false, reason: "agency_booking" }), { headers: corsHeaders });
    }

    const { airport, city, pickupCity, dropoffCity, pickupDistrict, dropoffDistrict, district, direction, confidence } = analyzeSimple(booking.pickup, booking.dropoff);
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

    if (!resolvedCity && !airport) {
      await sendManualEmail(booking, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_location_match" }), { headers: corsHeaders });
    }

    const isTurkeyIntracityAddressTransfer =
      !airport &&
      ((
        !!intracityCity && TURKEY_INTRACITY_DISCOUNT_CITIES.has(intracityCity)
      ) || (
        !!fallbackSharedCity && TURKEY_INTRACITY_DISCOUNT_CITIES.has(fallbackSharedCity)
      ));

    // Determine if this is an intercity/intra-city transfer without airport
    const hasDifferentResolvedCities =
      !!resolvedPickupCity &&
      !!resolvedDropoffCity &&
      !isSameCity(resolvedPickupCity, resolvedDropoffCity);
    const isIntercityTransfer =
      !airport &&
      !isTurkeyIntracityAddressTransfer &&
      hasDifferentResolvedCities;

    // Find best price: try intercity_prices first for non-airport, then fallback to region_prices
    let bestPrice: Record<string, unknown> | null = null;
    let priceSource = "region_prices";

    if (isTurkeyIntracityAddressTransfer) {
      const referencePrice = await findIntracityAirportReferencePrice(
        booking.vehicle_type,
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
      if (isSameCity(fromCity || null, toCity || null)) {
        // Same-city routes should not consume intercity table prices.
        bestPrice = null;
      } else {
      bestPrice = await findIntercityPrice(
        booking.vehicle_type,
        resolvedPickupCity,
        resolvedDropoffCity,
        pickupDistrict,
        dropoffDistrict,
      );
      if (bestPrice) priceSource = "intercity_prices";
      }
    }

    // Fallback to region_prices
    if (!bestPrice) {
      bestPrice = await findRegionPrice(booking.vehicle_type, resolvedCity, airport, district);
      priceSource = "region_prices";
    }

    if (!bestPrice) {
      await sendManualEmail(booking, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_price_found", debug: { city, airport, district, pickupDistrict, dropoffDistrict, vehicleType: booking.vehicle_type } }), { headers: corsHeaders });
    }

    // Price logic
    const baseCurrency = (bestPrice.price_currency as string) || "EUR";
    const customerCurrency = booking.price_currency || baseCurrency;

    let finalPrice = bestPrice.price as number;
    let finalCurrency = baseCurrency;
    if (customerCurrency !== baseCurrency) {
      const c = await convertCurrency(finalPrice, baseCurrency, customerCurrency);
      finalPrice = c.amount;
      finalCurrency = customerCurrency;
    }

    // Return discount
    let returnPrice: number | null = null;
    if (booking.has_return_trip) {
      returnPrice = Math.ceil(finalPrice * 0.75);
    }
    const totalPrice = finalPrice + (returnPrice ?? 0);

    // Update booking
    await supabaseQuery(
      "quick_booking_requests",
      { id: `eq.${quick_booking_id}` },
      "PATCH",
      { price: finalPrice, price_currency: finalCurrency, status: "price_sent", return_price: returnPrice }
    );

    // Email customer
    if (booking.customer_email) {
      const confirmUrl = `https://meettransfer.app/quick-booking-confirm?token=${booking.confirmation_token}`;
      await sendEmail(
        booking.customer_email,
        `Your transfer quote – ${finalPrice} ${finalCurrency}`,
        `<p>Price: ${finalPrice} ${finalCurrency}</p><a href="${confirmUrl}">Confirm</a>`
      );
    }

    return new Response(JSON.stringify({
      matched: true,
      price: finalPrice,
      currency: finalCurrency,
      returnPrice,
      totalPrice,
      matchedCity: resolvedCity,
      matchedAirport: airport,
      matchedPickupDistrict: pickupDistrict,
      matchedDropoffDistrict: dropoffDistrict,
      priceSource,
      intracityDiscountApplied: priceSource === "intracity_airport_discount",
    }), { headers: corsHeaders });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    console.error("auto-price-quick-booking error:", error);
    return new Response(JSON.stringify({ error, matched: false }), { status: 500, headers: corsHeaders });
  }
});
