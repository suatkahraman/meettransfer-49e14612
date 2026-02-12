const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// District mapping for known locations - must match Admin Panel / intercity_prices exactly
// Values are canonical ASCII form; Admin may store "Kas" or "Kaş" - we try both when querying
const DISTRICT_MAPPING: Record<string, string> = {
  // Antalya - granular matching for Alanya, Kaş, Belek, etc. (longer keys first to avoid partial matches)
  "alanya": "Alanya", "alanya hotel": "Alanya", "mahmutlar": "Alanya", "konakli": "Alanya", "konaklı": "Alanya",
  "okurcalar": "Alanya", "avsallar": "Alanya", "incekum": "Alanya",
  "kas": "Kas", "kaş": "Kas", "patara": "Kas",
  "kalkan": "Kalkan", "saklikent": "Kalkan", "saklıkent": "Kalkan",
  "belek": "Belek", "side": "Side", "kemer": "Kemer", "manavgat": "Manavgat",
  "lara": "Lara", "kundu": "Kundu", "beldibi": "Beldibi", "goynuk": "Göynük", "göynük": "Göynük",
  "tekirova": "Tekirova", "cirali": "Cirali", "çıralı": "Cirali", "olympos": "Olympos", "olimpos": "Olympos",
  "kaleici": "Kaleici", "kaleiçi": "Kaleici", "konyaalti": "Konyaalti", "konyaaltı": "Konyaalti",
  "kadriye": "Kadriye", "serik": "Serik",
  // Istanbul
  "taksim": "Taksim",
  "sultanahmet": "Sultanahmet", "kadikoy": "Kadıköy", "besiktas": "Beşiktaş",
  "sisli": "Şişli", "levent": "Levent", "atasehir": "Ataşehir",
  "bakirkoy": "Bakırköy", "bodrum": "Bodrum Merkez", "turgutreis": "Turgutreis",
  "yalikavak": "Yalıkavak", "gumbet": "Gümbet", "bitez": "Bitez",
  "fethiye": "Fethiye", "oludeniz": "Ölüdeniz", "marmaris": "Marmaris",
  "dalyan": "Dalyan", "cesme": "Çeşme", "alacati": "Alaçatı", "kusadasi": "Kuşadası",
  "ortakoy": "Ortakoy", "bebek": "Bebek", "fatih": "Fatih", "beyoglu": "Beyoglu",
  "uskudar": "Uskudar", "maltepe": "Maltepe", "pendik": "Pendik",
  "kartal": "Kartal", "avcilar": "Avcilar", "esenyurt": "Esenyurt",
  "basaksehir": "Basaksehir", "beylikduzu": "Beylikduzu", "sariyer": "Sariyer",
  "maslak": "Maslak", "mecidiyekoy": "Mecidiyekoy", "nisantasi": "Nisantasi",
  "karakoy": "Karakoy", "balat": "Balat", "cihangir": "Cihangir",
  "eminonu": "Eminonu", "galata": "Galata", "zeytinburnu": "Zeytinburnu",
  "bagcilar": "Bagcilar", "bahcelievler": "Bahcelievler", "esenler": "Esenler",
  "gaziosmanpasa": "Gaziosmanpasa", "gungoren": "Gungoren", "eyup": "Eyup",
  "kucukcekmece": "Kucukcekmece", "arnavutkoy": "Arnavutkoy",
  "buyukcekmece": "Buyukcekmece", "sultangazi": "Sultangazi",
  "beykoz": "Beykoz", "cekmekoy": "Cekmekoy", "sancaktepe": "Sancaktepe",
  "sultanbeyli": "Sultanbeyli", "sile": "Sile", "silivri": "Silivri",
  "catalca": "Catalca", "tuzla": "Tuzla", "yenikoy": "Yenikoy",
  // Ankara
  "pursaklar": "Pursaklar", "kecioren": "Keçiören", "ulus": "Ulus",
  "cankaya": "Çankaya Merkez", "mamak": "Mamak", "yenimahalle": "Yenimahalle Merkez",
  "ostim": "Ostim", "cukurambar": "Çukurambar", "dikmen": "Dikmen",
  "balgat": "Balgat", "bilkent": "Bilkent", "umitköy": "Ümitköy",
  "cayyolu": "Çayyolu", "eryaman": "Eryaman", "batikent": "Batıkent",
  "sincan": "Sincan", "golbasi": "Gölbaşı", "incek": "İncek",
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

const ISTANBUL_DISTRICTS = new Set([
  "taksim", "sultanahmet", "kadikoy", "besiktas", "sisli", "levent", "atasehir", "bakirkoy",
  "ortakoy", "bebek", "fatih", "beyoglu", "uskudar", "maltepe", "pendik", "kartal",
  "avcilar", "esenyurt", "basaksehir", "beylikduzu", "sariyer", "maslak", "mecidiyekoy",
  "nisantasi", "karakoy", "balat", "cihangir", "eminonu", "galata", "zeytinburnu", "bagcilar",
  "bahcelievler", "esenler", "gaziosmanpasa", "gungoren", "eyup", "kucukcekmece", "arnavutkoy",
  "buyukcekmece", "sultangazi", "beykoz", "cekmekoy", "sancaktepe", "sultanbeyli", "sile",
  "silivri", "catalca", "tuzla", "yenikoy",
]);

const ANKARA_DISTRICTS = new Set([
  "pursaklar", "kecioren", "ulus", "cankaya merkez", "mamak", "yenimahalle merkez", "ostim",
  "cukurambar", "dikmen", "balgat", "bilkent", "umitkoy", "cayyolu", "eryaman", "batikent",
  "sincan", "golbasi", "incek",
]);

const ANTALYA_DISTRICTS = new Set([
  "alanya", "kas", "kalkan", "belek", "side", "kemer", "manavgat", "lara", "kundu", "beldibi",
  "goynuk", "tekirova", "cirali", "olympos", "kaleici", "konyaalti", "kadriye", "serik",
]);

const BODRUM_DISTRICTS = new Set(["bodrum merkez", "turgutreis", "yalikavak", "gumbet", "bitez"]);
const DALAMAN_DISTRICTS = new Set(["fethiye", "oludeniz", "marmaris", "dalyan"]);
const IZMIR_DISTRICTS = new Set(["cesme", "alacati", "kusadasi"]);

// Normalize Turkish characters to ASCII equivalents for reliable regex matching
function normalizeTurkish(text: string): string {
  return text
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g');
}

/** Sanitize and normalize user search input for price matching */
function sanitizeSearchQuery(text: string): string {
  if (!text || typeof text !== "string") return "";
  return normalizeTurkish(text)
    .toLowerCase()
    .replace(/[,.\-_\/\\#&()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detect district from search text. Uses "contains" logic (fuzzy):
 * e.g. "Antalya Alanya Hotel" -> matches "alanya" -> returns "Alanya"
 * Keys are tried by length descending so "alanya hotel" matches before "alanya"
 */
function detectDistrict(text: string): string | null {
  const lower = sanitizeSearchQuery(text);
  // Sort keys by length desc so longer phrases match first (e.g. "alanya hotel" before "alanya")
  const entries = Object.entries(DISTRICT_MAPPING).sort(
    (a, b) => sanitizeSearchQuery(b[0]).length - sanitizeSearchQuery(a[0]).length,
  );
  for (const [key, value] of entries) {
    if (lower.includes(sanitizeSearchQuery(key))) return value;
  }
  return null;
}

function detectCity(text: string): string | null {
  const s = normalizeTurkish(text).toLowerCase();
  if (/istanbul|\bist\b|\bsaw\b/i.test(s)) return "Istanbul";
  if (/ankara|\besb\b|esenboga/i.test(s)) return "Ankara";
  if (/antalya|\bayt\b|alanya|belek|side|kemer|manavgat|kas|kaş|kalkan/i.test(s)) return "Antalya";
  if (/bodrum|\bbjv\b|turgutreis|yalikavak|gumbet/i.test(s)) return "Bodrum";
  if (/dalaman|\bdlm\b|fethiye|marmaris|oludeniz/i.test(s)) return "Dalaman";
  if (/izmir|\badb\b|cesme|alacati/i.test(s)) return "Izmir";
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

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const { pickup, dropoff, customerCurrency, pickup_place_id: pickupPlaceId, dropoff_place_id: dropoffPlaceId } = body;
    const pickupDateParam = body.pickup_date ?? body.pickupDate;
    const pickupSanitized = sanitizeSearchQuery(pickup || "");
    const dropoffSanitized = sanitizeSearchQuery(dropoff || "");
    const s = pickupSanitized + " " + dropoffSanitized;

    // Strict monthly/seasonal matching: use pickup date to select correct price (valid_from/valid_to)
    const pickupDateStr =
      pickupDateParam && (typeof pickupDateParam === "string" || typeof pickupDateParam === "number")
        ? new Date(pickupDateParam).toISOString().split("T")[0]
        : null;

    // Detect region
    const isDubai = /dubai|uae|dxb|dwc|al maktoum/i.test(s);
    const region = isDubai ? "dubai" : "turkey";
    
    // Detect cities from pickup and dropoff separately
    const pickupCity = detectCity(pickup);
    const dropoffCity = detectCity(dropoff);
    
    // Detect districts from pickup and dropoff separately (granular matching: District or Full Address)
    const pickupDistrict = detectDistrict(pickup);
    const dropoffDistrict = detectDistrict(dropoff);
    const district = pickupDistrict || dropoffDistrict;
    const pickupDistrictCity = inferCityFromDistrict(pickupDistrict);
    const dropoffDistrictCity = inferCityFromDistrict(dropoffDistrict);
    const resolvedPickupCity = pickupCity || pickupDistrictCity;
    const resolvedDropoffCity = dropoffCity || dropoffDistrictCity;
    const city = resolvedPickupCity || resolvedDropoffCity;
    const intracityCity =
      resolvedPickupCity && resolvedDropoffCity && resolvedPickupCity === resolvedDropoffCity
        ? resolvedPickupCity
        : null;

    let airport: string | null = null;
    
    if (isDubai) {
      if (/dxb|dubai.*airport|dubai.*international/i.test(s)) airport = "Dubai International Airport (DXB)";
      else if (/dwc|al maktoum/i.test(s)) airport = "Al Maktoum International Airport (DWC)";
    } else {
      if (/istanbul airport/i.test(s)) airport = "Istanbul Airport (IST)";
      else if (/sabiha|gokcen/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
      else if (/antalya.*airport|antalya.*havalimani/i.test(s)) airport = "Antalya Airport (AYT)";
      else if (/\bbjv\b|bodrum.*airport|milas.*airport|bodrum.*havalimani|milas.*havalimani/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
      else if (/\bdlm\b|dalaman.*airport|dalaman.*havalimani/i.test(s)) airport = "Dalaman Airport (DLM)";
      else if (/adnan menderes/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";
      else if (/esenboga|\besb\b/i.test(s)) airport = "Ankara Esenboga Airport (ESB)";
    }

    const isIntracityAddressTransfer =
      !airport &&
      !!intracityCity &&
      TURKEY_INTRACITY_DISCOUNT_CITIES.has(intracityCity);

    // Determine if this is an intercity transfer (no airport):
    // - Different cities, OR same city with different districts (e.g. Antalya Alanya -> Antalya Kaş)
    const isIntercityTransfer =
      !airport &&
      !isIntracityAddressTransfer &&
      (
        (resolvedPickupCity && resolvedDropoffCity && resolvedPickupCity !== resolvedDropoffCity) ||
        (!!pickupDistrict && !!dropoffDistrict)
      );

    // Frontend vehicle types
    const turkeyVehicles = [
      { 
        value: "sedan", label: "Standart Sedan", passengers: 3, luggage: 2,
        dbAliases: ["sedan", "standard_sedan", "standard-sedan"]
      },
      { 
        value: "mercedes-vito", label: "Mercedes Vito or Similar", passengers: 6, luggage: 6,
        dbAliases: ["mercedes-vito", "Mercedes Vito or Similar"]
      },
      { 
        value: "vip-mercedes", label: "VIP Mercedes Vito", passengers: 5, luggage: 5,
        dbAliases: ["vip-mercedes", "vip-vito", "mercedes-vip-vito", "Vip Mercedes Vito", "vip_minivan"]
      },
      { 
        value: "maybach-minibus", label: "Mercedes Maybach Minivan", passengers: 4, luggage: 4,
        dbAliases: ["maybach-minibus", "maybach-minivan", "Mercedes Maybach Minivan"]
      },
      { 
        value: "minibus", label: "Mercedes Sprinter or Similar", passengers: 20, luggage: 20,
        dbAliases: ["minibus", "mercedes-sprinter", "Mercedes Sprinter or Similar"]
      },
    ];

    const dubaiVehicles = [
      { 
        value: "dubai-private-sedan", label: "Private Standard Sedan", passengers: 3, luggage: 2,
        dbAliases: ["dubai-private-sedan"]
      },
      { 
        value: "dubai-v-class", label: "Mercedes V Class", passengers: 6, luggage: 6,
        dbAliases: ["dubai-v-class", "mercedes_vclass"]
      },
      { 
        value: "dubai-premium-van", label: "Mercedes Premium Van", passengers: 6, luggage: 6,
        dbAliases: ["dubai-premium-van"]
      },
      { 
        value: "dubai-suburban-suv", label: "Mercedes Suburban SUV", passengers: 6, luggage: 6,
        dbAliases: ["dubai-suburban-suv"]
      },
      { 
        value: "dubai-vip-sprinter", label: "VIP Mercedes Sprinter", passengers: 12, luggage: 12,
        dbAliases: ["dubai-vip-sprinter"]
      },
    ];

    const vehicleTypes = isDubai ? dubaiVehicles : turkeyVehicles;

    if (!city && !airport) {
      return new Response(JSON.stringify({
        prices: vehicleTypes.map(v => ({ 
          vehicleType: v.value, vehicleLabel: v.label, 
          price: null, currency: customerCurrency || "EUR", 
          passengers: v.passengers, luggage: v.luggage, available: false 
        })),
        matched: false,
        region,
      }), { headers: corsHeaders });
    }

    // Helper to query any table with specific filters (includes valid_from, valid_to, place_ids for Place ID matching)
    async function queryTable(
      table: string,
      filters: Record<string, string>,
      selectExtra = "",
      orderBy = "updated_at.desc",
    ): Promise<any[]> {
      const baseSelect = "vehicle_type,price,price_currency,valid_from,valid_to" + selectExtra;
      const params = new URLSearchParams({
        is_active: "eq.true",
        select: baseSelect,
        order: orderBy,
        ...filters,
      });

      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.error("Expected JSON but got:", contentType);
        return [];
      }

      return res.json();
    }

    // Strict monthly/seasonal: pick the row that applies to pickup_date. If a specific price exists
    // for the route and month, use it; do not let base price override seasonal.
    function applySeasonalFilter(rows: any[], dateStr: string | null): any[] {
      if (!rows.length) return rows;
      if (!dateStr) return rows;

      const byVehicle = new Map<string, any>();
      const seasonalFirst = rows.filter(
        (r) => r.valid_from && r.valid_to && dateStr >= String(r.valid_from).split("T")[0] && dateStr <= String(r.valid_to).split("T")[0]
      );
      const baseRows = rows.filter((r) => !r.valid_from && !r.valid_to);

      for (const row of seasonalFirst) {
        const vt = row.vehicle_type;
        if (!byVehicle.has(vt)) byVehicle.set(vt, row);
      }
      for (const row of baseRows) {
        const vt = row.vehicle_type;
        if (!byVehicle.has(vt)) byVehicle.set(vt, row);
      }
      return Array.from(byVehicle.values());
    }

    function pickLowestPricePerVehicle(rows: any[]): any[] {
      if (!rows.length) return rows;
      const byVehicle = new Map<string, any>();
      for (const row of rows) {
        const vehicleType = row.vehicle_type;
        const price = Number(row.price);
        if (!vehicleType || !Number.isFinite(price)) continue;
        const current = byVehicle.get(vehicleType);
        if (!current || price < Number(current.price)) {
          byVehicle.set(vehicleType, row);
        }
      }
      return Array.from(byVehicle.values());
    }

    async function fetchIntracityAirportReferencePrices(
      intracityCityName: string,
      primaryDistrict: string | null,
      secondaryDistrict: string | null,
    ): Promise<any[]> {
      const queriedDistricts = new Set<string>();
      const districtCandidates = [primaryDistrict, secondaryDistrict].filter((district): district is string => !!district);

      for (const districtCandidate of districtCandidates) {
        const normalizedCandidate = normalizeTurkish(districtCandidate);
        const lookupKeys = [districtCandidate, normalizedCandidate];
        let districtRows: any[] = [];

        for (const lookupDistrict of lookupKeys) {
          const dedupeKey = lookupDistrict.toLowerCase();
          if (queriedDistricts.has(dedupeKey)) continue;
          queriedDistricts.add(dedupeKey);

          const rows = await queryTable(
            "region_prices",
            {
              city: `ilike.${intracityCityName}`,
              district: `ilike.${lookupDistrict}`,
              airport: "not.is.null",
            },
            "",
            "price.asc",
          );
          districtRows = districtRows.concat(rows);
        }

        if (pickupDateStr && districtRows.length > 0) {
          districtRows = applySeasonalFilter(districtRows, pickupDateStr);
        }

        const districtLowest = pickLowestPricePerVehicle(districtRows);
        if (districtLowest.length > 0) return districtLowest;
      }

      let cityRows = await queryTable(
        "region_prices",
        {
          city: `ilike.${intracityCityName}`,
          airport: "not.is.null",
        },
        "",
        "price.asc",
      );

      if (pickupDateStr && cityRows.length > 0) {
        cityRows = applySeasonalFilter(cityRows, pickupDateStr);
      }

      return pickLowestPricePerVehicle(cityRows);
    }

    // ---- PLACE ID MATCHING (preferred when both IDs provided - Google Place from Autocomplete) ----
    let intercityPrices: any[] = [];
    let regionPrices: any[] = [];
    let intracityReferencePrices: any[] = [];
    let usedIntercity = false;
    let usedPlaceId = false;
    let usedIntracityAirportDiscount = false;

    // Şehir içi adresten adrese kuralı:
    // hedef semtin havalimanı fiyatını baz alıp %10 daha ucuz hesapla.
    if (isIntracityAddressTransfer && intracityCity) {
      intracityReferencePrices = await fetchIntracityAirportReferencePrices(
        intracityCity,
        pickupDistrict,
        dropoffDistrict,
      );
      if (intracityReferencePrices.length > 0) {
        usedIntracityAirportDiscount = true;
      }
    }

    if (!usedIntracityAirportDiscount && !isIntracityAddressTransfer && pickupPlaceId && dropoffPlaceId) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/intercity_prices?is_active=eq.true&select=vehicle_type,price,price_currency,valid_from,valid_to&or=(and(pickup_place_id.eq.${encodeURIComponent(pickupPlaceId)},dropoff_place_id.eq.${encodeURIComponent(dropoffPlaceId)}),and(pickup_place_id.eq.${encodeURIComponent(dropoffPlaceId)},dropoff_place_id.eq.${encodeURIComponent(pickupPlaceId)}))&order=updated_at.desc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.length > 0) {
          intercityPrices = data;
          usedIntercity = true;
          usedPlaceId = true;
        }
      }
      if (!usedPlaceId) {
        const res2 = await fetch(
          `${SUPABASE_URL}/rest/v1/region_prices?is_active=eq.true&select=vehicle_type,price,price_currency,valid_from,valid_to&and=(pickup_place_id.eq.${encodeURIComponent(pickupPlaceId)},dropoff_place_id.eq.${encodeURIComponent(dropoffPlaceId)})&order=updated_at.desc`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2?.length > 0) {
            regionPrices = data2;
            usedPlaceId = true;
          }
        }
      }
    }

    // ---- INTERCITY / INTRA-CITY PRICE MATCHING (text-based, when no Place ID match) ----
    if (!usedIntracityAirportDiscount && !usedPlaceId && isIntercityTransfer && !airport) {
      const fromCity = resolvedPickupCity || city!;
      const toCity = resolvedDropoffCity || city!;

      // STRICT: When BOTH districts are known (e.g. Alanya -> Kaş), ONLY use exact district-to-district match.
      // Strategy I2/I3 (single district) can return multiple routes (Alanya->Lara, Alanya->Belek, Alanya->Kas)
      // and pick wrong price (e.g. 111€ instead of 190€ for Alanya->Kaş).
      const hasExactRouteIntent = pickupDistrict && dropoffDistrict;

      // Strategy I1: from_district + to_district + cities (REQUIRED when both districts known)
      if (pickupDistrict && dropoffDistrict) {
        intercityPrices = await queryTable("intercity_prices", {
          from_city: `ilike.${fromCity}`,
          to_city: `ilike.${toCity}`,
          from_district: `ilike.${pickupDistrict}`,
          to_district: `ilike.${dropoffDistrict}`,
        });

        // Also try reverse direction
        if (intercityPrices.length === 0) {
          intercityPrices = await queryTable("intercity_prices", {
            from_city: `ilike.${toCity}`,
            to_city: `ilike.${fromCity}`,
            from_district: `ilike.${dropoffDistrict}`,
            to_district: `ilike.${pickupDistrict}`,
          });
        }
      }

      // Strategy I2/I3: ONLY when we don't have both districts - avoids wrong cross-route price
      if (!hasExactRouteIntent) {
        if (intercityPrices.length === 0 && pickupDistrict) {
          intercityPrices = await queryTable("intercity_prices", {
            from_city: `ilike.${fromCity}`,
            to_city: `ilike.${toCity}`,
            from_district: `ilike.${pickupDistrict}`,
          });
        }
        if (intercityPrices.length === 0 && dropoffDistrict) {
          intercityPrices = await queryTable("intercity_prices", {
            from_city: `ilike.${fromCity}`,
            to_city: `ilike.${toCity}`,
            to_district: `ilike.${dropoffDistrict}`,
          });
        }
        // Strategy I4: cities only - SKIP when we have district-level intent
        if (intercityPrices.length === 0 && fromCity && toCity) {
          intercityPrices = await queryTable("intercity_prices", {
            from_city: `ilike.${fromCity}`,
            to_city: `ilike.${toCity}`,
          });
          if (intercityPrices.length === 0 && fromCity !== toCity) {
            intercityPrices = await queryTable("intercity_prices", {
              from_city: `ilike.${toCity}`,
              to_city: `ilike.${fromCity}`,
            });
          }
        }
      }

      if (intercityPrices.length > 0) usedIntercity = true;
    }

    // IMPORTANT: When intercity intent (different districts, e.g. Alanya->Kas) but NO intercity match,
    // do NOT fall back to region_prices - that would wrongly use airport->district price (e.g. 111€) for a long route.
    const hasGranularIntercityIntent = pickupDistrict && dropoffDistrict && !airport;
    const skipRegionFallback = hasGranularIntercityIntent && usedIntercity === false && intercityPrices.length === 0;

    // Apply strict monthly/seasonal filter: use price for pickup_date only (Place ID + text results)
    if (usedIntercity && pickupDateStr) {
      intercityPrices = applySeasonalFilter(intercityPrices, pickupDateStr);
    }

    // ---- REGION PRICES MATCHING (airport transfers + fallback, skip when wrong intercity fallback) ----
    if (!usedIntracityAirportDiscount && !usedPlaceId && !usedIntercity && !skipRegionFallback) {
      // Strategy R1: District + City + Airport (most specific). Case-insensitive for district/city.
      if (district && city && airport) {
        regionPrices = await queryTable("region_prices", {
          district: `ilike.${district}`,
          city: `ilike.${city}`,
          airport: `eq.${airport}`,
        });
      }

      // Strategy R2: District + City (no airport filter)
      if (regionPrices.length === 0 && district && city) {
        regionPrices = await queryTable("region_prices", {
          district: `ilike.${district}`,
          city: `ilike.${city}`,
        });
      }

      // Strategy R3: City + Airport (no district)
      if (regionPrices.length === 0 && city && airport) {
        regionPrices = await queryTable("region_prices", {
          city: `ilike.${city}`,
          airport: `eq.${airport}`,
        });
      }

      // Strategy R4: City only
      if (regionPrices.length === 0 && city) {
        regionPrices = await queryTable("region_prices", {
          city: `ilike.${city}`,
        });
      }

      // Strategy R5: Airport only
      if (regionPrices.length === 0 && airport) {
        regionPrices = await queryTable("region_prices", {
          airport: `eq.${airport}`,
        });
      }
    }

    // Apply strict monthly/seasonal filter for region prices
    if (!usedIntracityAirportDiscount && !usedIntercity && pickupDateStr && regionPrices.length > 0) {
      regionPrices = applySeasonalFilter(regionPrices, pickupDateStr);
    }

    const intracityDiscountedPrices = usedIntracityAirportDiscount
      ? intracityReferencePrices.map((row: any) => ({
          ...row,
          price: applyIntracityAirportDiscount(Number(row.price)),
        }))
      : [];

    // Use whichever source found prices (validation: specific route+month price is used, no generic override)
    const matchedPrices = usedIntracityAirportDiscount
      ? intracityDiscountedPrices
      : usedIntercity
      ? intercityPrices
      : regionPrices;

    // Build prices - match DB prices to frontend vehicle types using aliases
    const prices: any[] = [];
    
    for (const vt of vehicleTypes) {
      let match = null;
      for (const alias of vt.dbAliases) {
        match = matchedPrices.find((p: any) => p.vehicle_type === alias);
        if (match) break;
      }
      
      if (match) {
        prices.push({
          vehicleType: vt.value,
          vehicleLabel: vt.label,
          price: Math.ceil(match.price),
          currency: match.price_currency,
          passengers: vt.passengers,
          luggage: vt.luggage,
          available: true
        });
      } else {
        prices.push({
          vehicleType: vt.value,
          vehicleLabel: vt.label,
          price: null,
          currency: customerCurrency || "EUR",
          passengers: vt.passengers,
          luggage: vt.luggage,
          available: false
        });
      }
    }

    return new Response(JSON.stringify({
      prices,
      matched: prices.some(p => p.available),
      matchedCity: city,
      matchedPickupDistrict: pickupDistrict,
      matchedDropoffDistrict: dropoffDistrict,
      matchedDistrict: district,
      matchedAirport: airport,
      isDubai,
      region,
      priceSource: usedIntracityAirportDiscount
        ? "intracity_airport_discount"
        : usedIntercity
        ? "intercity_prices"
        : "region_prices",
      intracityDiscountApplied: usedIntracityAirportDiscount,
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error), prices: [] }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
