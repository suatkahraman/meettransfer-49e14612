const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate",
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
  // Türkiye - Diğer şehirler (bölgesel fiyatlandırma)
  "trabzon": "Trabzon Center", "akcaabat": "Akcaabat", "of": "Of",
  "adana center": "Adana Center", "seyhan": "Seyhan", "tarsus": "Tarsus",
  "gaziantep center": "Gaziantep Center", "sahinbey": "Sahinbey",
  "diyarbakir center": "Diyarbakir Center", "sur": "Sur",
  "van center": "Van Center", "tusba": "Tusba", "ipekyolu": "Ipekyolu",
  "malatya center": "Malatya Center", "battalgazi": "Battalgazi",
  "samsun center": "Samsun Center", "atakum": "Atakum",
  "izmit": "Izmit", "gebze": "Gebze", "kartepe": "Kartepe",
  "tekirdag center": "Tekirdag Center", "corlu": "Corlu",
  "edirne center": "Edirne Center", "kesan": "Kesan",
  "kars center": "Kars Center", "sarikamis": "Sarikamis",
  "denizli center": "Denizli Center", "pamukkale": "Pamukkale",
  "elazig center": "Elazig Center", "kovancilar": "Kovancilar",
  "sivas center": "Sivas Center", "kangal": "Kangal",
  "antakya": "Antakya", "iskenderun": "Iskenderun", "samandag": "Samandag",
  "bandirma": "Bandirma", "ayvalik": "Ayvalik",
  "canakkale center": "Canakkale Center", "gelibolu": "Gelibolu",
  "ordu center": "Ordu Center", "giresun center": "Giresun Center",
  "rize center": "Rize Center", "artvin center": "Artvin Center",
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

const EDGE_FETCH_TIMEOUT_MS = 8000;

/**
 * Merkezi Fiyat Hesaplama Motoru
 * - Fixed: base_price + airport_fee
 * - Distance: (km * extra_km_price) + airport_fee
 * 
 * @param rule Veritabanından gelen kural satırı
 * @param distanceKm Mesafe (KM)
 * @param airportFee Havalimanı ek ücreti (EUR)
 */
function calculateFinalPrice(
  rule: { 
    pricing_mode: 'fixed' | 'distance' | null; 
    base_price: number | null; 
    extra_km_price: number | null;
    vehicle_type: string | null;
    city: string | null;
  }, 
  distanceKm: number, 
  airportFee: number
): { price: number | null; log: string } {
  // Güvenlik: Mesafe kontrolü
  if (distanceKm < 0) {
    return { price: null, log: `[Calc] Invalid distance: ${distanceKm}` };
  }

  let rawPrice = 0;
  let logPrefix = `[Calc] Rule for ${rule.vehicle_type} (${rule.city || 'Global'})`;

  if (rule.pricing_mode === 'fixed') {
    // Fallback: base_price yoksa null dön
    if (rule.base_price == null) {
      return { price: null, log: `${logPrefix} - FIXED mode but base_price is null` };
    }
    rawPrice = Number(rule.base_price);
    const final = rawPrice + airportFee;
    return { 
      price: Math.ceil(final), 
      log: `${logPrefix} - FIXED: ${rawPrice} + ${airportFee} (airport) = ${final}` 
    };
  } 
  
  if (rule.pricing_mode === 'distance') {
    // Fallback: extra_km_price yoksa null dön
    if (rule.extra_km_price == null) {
      return { price: null, log: `${logPrefix} - DISTANCE mode but extra_km_price is null` };
    }
    const kmPrice = Number(rule.extra_km_price);
    rawPrice = distanceKm * kmPrice;
    const final = rawPrice + airportFee;
    return { 
      price: Math.ceil(final), 
      log: `${logPrefix} - DISTANCE: (${distanceKm}km * ${kmPrice}) + ${airportFee} (airport) = ${final}` 
    };
  }

  return { price: null, log: `${logPrefix} - Unknown pricing_mode: ${rule.pricing_mode}` };
}

function isSameCity(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return normalizeCityName(a) === normalizeCityName(b);
}

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
const TRABZON_DISTRICTS = new Set(["trabzon center", "akcaabat", "yomra", "of", "surmene"]);
const ADANA_DISTRICTS = new Set(["adana center", "seyhan", "cukurova", "tarsus", "ceyhan"]);
const GAZIANTEP_DISTRICTS = new Set(["gaziantep center", "sahinbey", "sehitkamil", "oguzeli"]);
const DIYARBAKIR_DISTRICTS = new Set(["diyarbakir center", "sur", "baglar", "kayapinar"]);
const VAN_DISTRICTS = new Set(["van center", "tusba", "ipekyolu"]);
const MALATYA_DISTRICTS = new Set(["malatya center", "battalgazi", "yesilyurt"]);
const SAMSUN_DISTRICTS = new Set(["samsun center", "carsamba", "atakum", "canik"]);
const DENIZLI_DISTRICTS = new Set(["denizli center", "pamukkale", "cardak"]);

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

/** v2.8.4: Şehir ismi eşleşmesi için standart form - küçük harf + Türkçe karakter temizliği */
function normalizeCityName(city: string | null): string {
  if (!city || typeof city !== "string") return "";
  return normalizeTurkish(city)
    .toLowerCase()
    .replace(/ı/g, "i") // Ekstra: dotless ı -> i (bazı locale'lerde kalabilir)
    .trim();
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
  if (/bursa|\byei\b/i.test(s)) return "Bursa";
  if (/yalova/i.test(s)) return "Yalova";
  if (/sapanca/i.test(s)) return "Sapanca";
  if (/adana|\bada\b/i.test(s)) return "Adana";
  if (/gaziantep|\bgzt\b/i.test(s)) return "Gaziantep";
  if (/trabzon|\btzx\b/i.test(s)) return "Trabzon";
  if (/diyarbakir|diyarbakır|\bdiy\b/i.test(s)) return "Diyarbakir";
  if (/van/i.test(s) && /airport|havalimani|havalimanı/i.test(s)) return "Van";
  if (/malatya|\bmlx\b/i.test(s)) return "Malatya";
  if (/samsun|\bszf\b/i.test(s)) return "Samsun";
  if (/kocaeli|\bkco\b|izmit/i.test(s)) return "Kocaeli";
  if (/tekirdag|tekirdağ|\bteq\b|corlu|çorlu/i.test(s)) return "Tekirdag";
  if (/edirne|\bedn\b/i.test(s)) return "Edirne";
  if (/kars|\bkhv\b/i.test(s)) return "Kars";
  if (/denizli|\bdnz\b|pamukkale/i.test(s)) return "Denizli";
  if (/elazig|elazığ|\bezs\b/i.test(s)) return "Elazig";
  if (/sivas|\bvas\b/i.test(s)) return "Sivas";
  if (/sinop|\bnop\b/i.test(s)) return "Sinop";
  if (/kastamonu|\bkfs\b/i.test(s)) return "Kastamonu";
  if (/zonguldak|\bonq\b/i.test(s)) return "Zonguldak";
  if (/sirnak|sırnak|\bnkt\b/i.test(s)) return "Sirnak";
  if (/agri|ağrı|\baji\b/i.test(s)) return "Agri";
  if (/mardin|\bmqm\b/i.test(s)) return "Mardin";
  if (/afyon|\bkzr\b|zafer/i.test(s)) return "Afyon";
  if (/mus|muş|\bmsr\b/i.test(s)) return "Mus";
  if (/erzurum|\berz\b/i.test(s)) return "Erzurum";
  if (/erzincan|\berc\b/i.test(s)) return "Erzincan";
  if (/sanliurfa|şanlıurfa|urfa|\bsfq\b|gap/i.test(s)) return "Sanliurfa";
  if (/hatay|\bhty\b|antakya|iskenderun/i.test(s)) return "Hatay";
  if (/balikesir|balıkesir|\bedo\b|bandirma|bandırma/i.test(s)) return "Balikesir";
  if (/canakkale|çanakkale|\bckz\b/i.test(s)) return "Canakkale";
  if (/ordu|giresun|\bogu\b/i.test(s)) return "Ordu";
  if (/rize|artvin|\brzv\b/i.test(s)) return "Rize";
  if (/dubai|uae|dxb|dwc|al maktoum/i.test(s)) return "Dubai";
  return null;
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
  if (TRABZON_DISTRICTS.has(normalizedDistrict)) return "Trabzon";
  if (ADANA_DISTRICTS.has(normalizedDistrict)) return "Adana";
  if (GAZIANTEP_DISTRICTS.has(normalizedDistrict)) return "Gaziantep";
  if (DIYARBAKIR_DISTRICTS.has(normalizedDistrict)) return "Diyarbakir";
  if (VAN_DISTRICTS.has(normalizedDistrict)) return "Van";
  if (MALATYA_DISTRICTS.has(normalizedDistrict)) return "Malatya";
  if (SAMSUN_DISTRICTS.has(normalizedDistrict)) return "Samsun";
  if (DENIZLI_DISTRICTS.has(normalizedDistrict)) return "Denizli";
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
    const { pickup, dropoff, customerCurrency, pickup_place_id: pickupPlaceId, dropoff_place_id: dropoffPlaceId, distance_km: distanceKmParam } = body;
    const pickupDateParam = body.pickup_date ?? body.pickupDate;
    const pickupSanitized = sanitizeSearchQuery(pickup || "");
    const dropoffSanitized = sanitizeSearchQuery(dropoff || "");
    const s = pickupSanitized + " " + dropoffSanitized;

    // Strict monthly/seasonal matching: use pickup date to select correct price (valid_from/valid_to)
    const pickupDateCandidate =
      pickupDateParam && (typeof pickupDateParam === "string" || typeof pickupDateParam === "number")
        ? new Date(pickupDateParam)
        : null;
    const pickupDateStr =
      pickupDateCandidate && !Number.isNaN(pickupDateCandidate.getTime())
        ? pickupDateCandidate.toISOString().split("T")[0]
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
    const fallbackSharedCity =
      !intracityCity && resolvedPickupCity && resolvedDropoffCity && isSameCity(resolvedPickupCity, resolvedDropoffCity)
        ? resolvedPickupCity
        : null;
    const sameResolvedCity = !!intracityCity || !!fallbackSharedCity;

    let airport: string | null = null;
    
    if (isDubai) {
      if (/dxb|dubai.*airport|dubai.*international/i.test(s)) airport = "Dubai International Airport (DXB)";
      else if (/dwc|al maktoum/i.test(s)) airport = "Al Maktoum International Airport (DWC)";
    } else {
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
    }

    // Determine if this is an intercity transfer (no airport):
    // - Different cities, OR same city with different districts (e.g. Antalya Alanya -> Antalya Kaş)
    const hasDifferentResolvedCities =
      !!resolvedPickupCity &&
      !!resolvedDropoffCity &&
      !isSameCity(resolvedPickupCity, resolvedDropoffCity);
    const isIntercityTransfer =
      !airport &&
      hasDifferentResolvedCities;

    // v2.8.9: Booking Form ile birebir aynı araç isimleri (DB vehicle_type: Standard Sedan, Mercedes Vito or Similar, Mercedes Maybach, Mercedes Sprinter or Similar)
    const turkeyVehicles = [
      { value: "sedan", label: "Standard Sedan", passengers: 3, luggage: 2,
        dbAliases: ["standard sedan", "sedan", "standard_sedan", "standard-sedan"] },
      { value: "mercedes-vito", label: "Mercedes Vito or Similar", passengers: 6, luggage: 6,
        dbAliases: ["mercedes vito or similar", "mercedes-vito", "vito", "mercedes vito"] },
      { value: "vip-mercedes", label: "Mercedes Maybach", passengers: 5, luggage: 5,
        dbAliases: ["mercedes maybach", "maybach", "vip-mercedes", "vip mercedes", "vip-vito", "maybach-minibus"] },
      { value: "maybach-minibus", label: "Mercedes Maybach", passengers: 4, luggage: 4,
        dbAliases: ["mercedes maybach", "maybach-minibus", "maybach-minivan"] },
      { value: "minibus", label: "Mercedes Sprinter or Similar", passengers: 20, luggage: 20,
        dbAliases: ["mercedes sprinter or similar", "minibus", "mercedes-sprinter", "sprinter"] },
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

    // ========== TÜRKİYE: Öncelik Hiyerarşisi ==========
    // Intercity (farklı şehir): Önce intercity_prices (sabit), yoksa distance_pricing_rules (KM)
    // Intracity (aynı şehir): SADECE distance_pricing_rules - ASLA sabit fiyat tablosuna gitme
    const rawDistanceKm = typeof body.distance_km === "number" && Number.isFinite(body.distance_km) ? body.distance_km : null;
    const distanceKm = rawDistanceKm != null ? Math.round(rawDistanceKm * 10) / 10 : null;
    const AIRPORT_PARKING_FEE_EUR = 5;
    const isIntracityTurkey = sameResolvedCity && !airport; // Aynı şehir, havalimanı yok

    // v2.8.2 RADIKAL: İstanbul söz konusuysa fixed_prices/region_prices/airport_prices HİÇBİRİNE dokunma - SADECE KM
    // v2.8.4: normalizeCityName ile karşılaştırma - İstanbul/istanbul/İSTANBUL hepsi eşleşir
    const fromCityNorm = normalizeCityName(resolvedPickupCity || "");
    const toCityNorm = normalizeCityName(resolvedDropoffCity || "");
    const isIstanbulRoute = fromCityNorm.includes("istanbul") || toCityNorm.includes("istanbul");
    if (isIstanbulRoute) {
      console.log("ISTANBUL_DETECTED: FORCING CLEAN START - from:", fromCityNorm || resolvedPickupCity, "to:", toCityNorm || resolvedDropoffCity, "- SADECE distance_pricing_rules");
    }

    console.log("[get-all-vehicle-prices DEBUG] Turkey - distanceKm:", distanceKm, "| isIntracity:", isIntracityTurkey, "| isIntercity:", hasDifferentResolvedCities, "| isIstanbulRoute:", isIstanbulRoute);

    if (!isDubai) {
      const turkeyResult = await (async () => {
        // Validation
        if (distanceKm == null || distanceKm <= 0) {
          const errMsg = "Fiyat hesaplanamadı: Mesafe geçersiz veya gönderilmedi (distance_km null, 0 veya eksik)";
          console.warn("[get-all-vehicle-prices DEBUG] Turkey price fail - reason:", errMsg);
          return {
            prices: turkeyVehicles.map((v) => ({
              vehicleType: v.value,
              vehicleLabel: v.label,
              price: null,
              currency: "EUR",
              passengers: v.passengers,
              luggage: v.luggage,
              available: false,
            })),
            matched: false,
            message: errMsg,
            error: "FİYAT_TANIMLANMADI",
            debug_info: { raw_km_price: null, applied_base_fare: null, source_table: null },
          };
        }


        // =========================================================================================
        // PRIORITY 1: DISTANCE PRICING RULES (KM Based) - "distance_pricing_rules"
        // =========================================================================================
        
        let distanceRulesMatched = false;
        let distanceBasedPrices: any[] = [];
        let kmDebugInfo = {};

        try {
          // v3.0.3: Fallback mechanism for migration safety
          let kmRulesRes;
          try {
            // Try new query with region support
            kmRulesRes = await fetch(
              `${SUPABASE_URL}/rest/v1/distance_pricing_rules?is_active=eq.true&select=id,vehicle_type,city,airport_code,region,pricing_mode,base_price,extra_km_price,min_km,max_km,start_date,end_date,currency`,
              { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
            );

            // If failed with 400 (Bad Request), likely due to missing columns (migration not applied)
            if (!kmRulesRes.ok && kmRulesRes.status === 400) {
              console.warn("[get-all-vehicle-prices] New query failed (400), attempting fallback to legacy query. Migration might be missing.");
              kmRulesRes = await fetch(
                `${SUPABASE_URL}/rest/v1/distance_pricing_rules?select=id,vehicle_type,city,airport_code,pricing_mode,base_price,extra_km_price,min_km,max_km,start_date,end_date`,
                { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
              );
            }
          } catch (e) {
             console.error("[get-all-vehicle-prices] Fetch error:", e);
             // Fallback attempt in catch block if fetch throws (network error etc)
             // Note: This might not help if the error is network related, but good for safety
             kmRulesRes = await fetch(
               `${SUPABASE_URL}/rest/v1/distance_pricing_rules?select=id,vehicle_type,city,airport_code,pricing_mode,base_price,extra_km_price,min_km,max_km,start_date,end_date`,
               { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
             );
          }

          if (kmRulesRes && kmRulesRes.ok) {
            type KmRule = { 
              vehicle_type: string | null; 
              city: string | null; 
              airport_code: string | null;
              region: string | null;
              pricing_mode: 'fixed' | 'distance' | null;
              base_price: number | null; 
              extra_km_price: number | null;
              min_km: number | null; 
              max_km: number | null; 
              start_date?: string | null; 
              end_date?: string | null;
              currency?: string | null;
            };
            
            let kmRules: KmRule[] = await kmRulesRes.json();

            // Tarih Filtresi
            if (pickupDateStr && kmRules.length > 0) {
              kmRules = kmRules.filter((r) => {
                const sd = r.start_date ? String(r.start_date).split("T")[0] : null;
                const ed = r.end_date ? String(r.end_date).split("T")[0] : null;
                if (!sd && !ed) return true;
                if (sd && pickupDateStr < sd) return false;
                if (ed && pickupDateStr > ed) return false;
                return true;
              });
            }

            // Lokasyon Eşleşmesi
            const cityNorm = normalizeCityName(resolvedPickupCity || "") || normalizeCityName(resolvedDropoffCity || "");
            let currentAirportCode: string | null = null;
            if (airport) {
              const match = airport.match(/\(([A-Z]{3})\)/);
              if (match) currentAirportCode = match[1];
            }

            function norm(s: string | null): string {
              return (s || "").trim().toLowerCase();
            }

            function ruleMatchesLocation(r: KmRule): boolean {
              // 0. Region Kontrolü (Turkey vs Dubai)
              if (r.region) {
                const rRegion = norm(r.region);
                if (isDubai && rRegion !== "dubai") return false;
                if (!isDubai && rRegion !== "turkey") return false;
              }

              // 1. Şehir Kontrolü
              if (r.city) {
                const rCity = norm(r.city);
                const match = rCity === cityNorm || cityNorm.includes(rCity) || rCity.includes(cityNorm);
                if (!match) return false;
              }
              // 2. Havalimanı Kodu Kontrolü
              if (r.airport_code) {
                 if (!currentAirportCode) return false;
                 if (r.airport_code.toUpperCase() !== currentAirportCode) return false;
              }
              return true;
            }

            function ruleMatchesVehicle(r: KmRule, vt: typeof turkeyVehicles[0]): boolean {
              const rVt = norm(r.vehicle_type || "");
              if (!rVt) return false;
              const labelNorm = norm(vt.label);
              for (const alias of vt.dbAliases) {
                const a = norm(alias);
                if (a === rVt) return true;
                if (rVt.includes(a)) return true;
                if (a.includes(rVt)) return true;
              }
              if (labelNorm === rVt) return true;
              if (rVt.includes(labelNorm)) return true;
              if (labelNorm.includes(rVt)) return true;
              return false;
            }

            const vehiclePriceMap: Record<string, { price: number, currency: string }> = {};
            const currentAirportFee = airport ? AIRPORT_PARKING_FEE_EUR : 0;

            for (const vt of turkeyVehicles) {
              const matchingRules = (kmRules || []).filter((r) => ruleMatchesVehicle(r, vt) && ruleMatchesLocation(r));
              
              let bestPrice: number | null = null;
              let bestCurrency = "EUR";

              // 1. KM aralığına göre filtrele (Strict Range Match)
              let validKmRules = matchingRules.filter(r => {
                const minKm = r.min_km != null ? Number(r.min_km) : 0;
                const maxKm = r.max_km != null ? Number(r.max_km) : Infinity;
                return distanceKm >= minKm && distanceKm <= maxKm;
              });

              // Fallback: Eğer tam aralık bulunamazsa, en yakın kuralı bul (Alt/Üst Kural)
              if (validKmRules.length === 0 && matchingRules.length > 0) {
                 // Sort by max_km ascending
                 const sortedRules = matchingRules.sort((a, b) => (Number(a.max_km) || 0) - (Number(b.max_km) || 0));
                 
                 // If distance > largest max_km, pick largest
                 if (distanceKm > (Number(sortedRules[sortedRules.length - 1].max_km) || 0)) {
                    validKmRules = [sortedRules[sortedRules.length - 1]];
                 } 
                 // If distance < smallest min_km, pick smallest
                 else if (distanceKm < (Number(sortedRules[0].min_km) || 0)) {
                    validKmRules = [sortedRules[0]];
                 }
                 // Otherwise find closest (simplified: just take all matching, priority logic below will handle)
                 else {
                    // This case shouldn't happen often if rules are contiguous, but just in case add all
                    validKmRules = matchingRules;
                 }
                 console.log(`[Calc] Fallback rule used for ${vt.value} (Dist: ${distanceKm})`);
              }

              const seasonalRules = validKmRules.filter(r => r.start_date || r.end_date);
              const standardRules = validKmRules.filter(r => !r.start_date && !r.end_date);
              const activeRules = seasonalRules.length > 0 ? seasonalRules : standardRules;

              for (const r of activeRules) {
                const { price, log } = calculateFinalPrice(r, distanceKm, currentAirportFee);
                if (price != null) {
                  if (bestPrice == null || price < bestPrice) {
                    bestPrice = price;
                    bestCurrency = r.currency || "EUR";
                  }
                }
              }

              if (bestPrice != null) {
                vehiclePriceMap[vt.value] = { price: bestPrice, currency: bestCurrency };
              }
            }

            distanceBasedPrices = turkeyVehicles.map((vt) => {
              const data = vehiclePriceMap[vt.value];
              const finalPrice = data?.price ?? null;
              const currency = data?.currency ?? "EUR";
              const available = finalPrice != null && finalPrice > 0;
              return {
                vehicleType: vt.value,
                vehicleLabel: vt.label,
                price: finalPrice,
                currency: currency,
                passengers: vt.passengers,
                luggage: vt.luggage,
                available,
              };
            });

            const hasAvailable = distanceBasedPrices.some((p) => p.available);
            if (hasAvailable) {
                distanceRulesMatched = true;
                kmDebugInfo = {
                  raw_km_price: distanceKm,
                  applied_base_fare: null,
                  source_table: "distance_pricing_rules",
                  pricing_system: "v3.0.1_centralized_priority"
                };
            }
          } else {
             console.error("distance_pricing_rules fetch failed with status", kmRulesRes.status);
          }
        } catch (e) {
          console.error("Error in distance pricing rules logic:", e);
        }

        if (distanceRulesMatched) {
           return {
             prices: distanceBasedPrices,
             matched: true,
             message: null,
             priceSource: "distance_pricing_rules",
             debug_info: kmDebugInfo,
           };
        }

        // =========================================================================================
        // PRIORITY 2: INTERCITY PRICES (Fixed) - "intercity_prices"
        // =========================================================================================

        // Only if NO price found in Priority 1
        // ... existing intercity logic ...


          const errMsg = "Fiyat hesaplanamadı: Mesafe geçersiz veya gönderilmedi (distance_km null, 0 veya eksik)";
          console.warn("[get-all-vehicle-prices DEBUG] Turkey price fail - reason:", errMsg);
          return {
            prices: turkeyVehicles.map((v) => ({
              vehicleType: v.value,
              vehicleLabel: v.label,
              price: null,
              currency: "EUR",
              passengers: v.passengers,
              luggage: v.luggage,
              available: false,
            })),
            matched: false,
            message: errMsg,
            error: "FİYAT_TANIMLANMADI",
            debug_info: { raw_km_price: null, applied_base_fare: null, source_table: null },
          };
        }

        // v2.8.5: İstanbul = SADECE distance_pricing_rules. Seasonal/Regional/Base katmanlarına ASLA girme.
        let fixedPricesFromIntercity: Array<{ vehicle_type: string; price: number; price_currency: string }> = [];
        if (!isIstanbulRoute) {
          // Sezonluk (Seasonal), Bölgesel (Regional), Temel (Base) katmanları - SADECE İstanbul dışı rotalar
          if (!isIntracityTurkey && hasDifferentResolvedCities && resolvedPickupCity && resolvedDropoffCity) {
            const fromCity = normalizeCityName(resolvedPickupCity) || resolvedPickupCity;
            const toCity = normalizeCityName(resolvedDropoffCity) || resolvedDropoffCity;
            try {
              const q1 = `and=(from_city.ilike.${encodeURIComponent(fromCity)},to_city.ilike.${encodeURIComponent(toCity)},is_active.eq.true)`;
              const q2 = `and=(from_city.ilike.${encodeURIComponent(toCity)},to_city.ilike.${encodeURIComponent(fromCity)},is_active.eq.true)`;
              const [r1, r2] = await Promise.all([
                fetch(`${SUPABASE_URL}/rest/v1/intercity_prices?${q1}&select=vehicle_type,price,price_currency`, {
                  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
                }),
                fetch(`${SUPABASE_URL}/rest/v1/intercity_prices?${q2}&select=vehicle_type,price,price_currency`, {
                  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
                }),
              ]);
              const d1 = r1.ok ? await r1.json() : [];
              const d2 = r2.ok ? await r2.json() : [];
              fixedPricesFromIntercity = Array.isArray(d1) && d1.length > 0 ? d1 : Array.isArray(d2) && d2.length > 0 ? d2 : [];
              if (fixedPricesFromIntercity.length > 0) {
                console.log("[get-all-vehicle-prices DEBUG] Intercity FIXED prices (city_to_city) found:", fixedPricesFromIntercity.length);
              }
            } catch (e) {
              console.warn("[get-all-vehicle-prices DEBUG] intercity_prices query failed:", String(e));
            }
          } else if (isIntracityTurkey) {
            console.log("[get-all-vehicle-prices DEBUG] Intracity - sabit fiyat tablosuna BAKILMAZ, sadece KM hesabı");
          }
        } else {
          console.log("[get-all-vehicle-prices DEBUG] Istanbul - Seasonal/Regional/Base ATLANIR, SADECE distance_pricing_rules");
        }

        // Eğer intercity sabit fiyat bulunduysa onu kullan (İstanbul için ASLA), yoksa distance_pricing_rules
        if (!isIstanbulRoute && fixedPricesFromIntercity.length > 0) {
          const airportFee = airport ? AIRPORT_PARKING_FEE_EUR : 0;
          const firstRow = fixedPricesFromIntercity[0];
          const prices = turkeyVehicles.map((vt) => {
            const match = fixedPricesFromIntercity.find((p) =>
              vt.dbAliases.some((a) => a === p.vehicle_type)
            );
            const row = match || fixedPricesFromIntercity.find((p) => p.vehicle_type === vt.value);
            const basePrice = row ? Number(row.price) : null;
            const total = basePrice != null ? Math.ceil(basePrice + airportFee) : null;
            const available = total != null && total > 0;
            return { vehicleType: vt.value, vehicleLabel: vt.label, price: total, currency: "EUR", passengers: vt.passengers, luggage: vt.luggage, available };
          });
          const hasAvailable = prices.some((p) => p.available);
          const debug_info = { raw_km_price: null, applied_base_fare: firstRow ? Number(firstRow.price) : null, source_table: "intercity_prices" };
          return { prices, matched: hasAvailable, message: hasAvailable ? null : "Fiyat Bulunamadı", priceSource: "intercity_prices", debug_info };
        }

        // v3.0.3: Fallback mechanism for migration safety
        let kmRulesRes;
        try {
          // Try new query with region support
          kmRulesRes = await fetch(
            `${SUPABASE_URL}/rest/v1/distance_pricing_rules?is_active=eq.true&select=id,vehicle_type,city,airport_code,region,pricing_mode,base_price,extra_km_price,min_km,max_km,start_date,end_date,currency`,
            { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
          );

          if (!kmRulesRes.ok && kmRulesRes.status === 400) {
            console.warn("[get-all-vehicle-prices] New query failed (400), attempting fallback to legacy query. Migration might be missing.");
            kmRulesRes = await fetch(
              `${SUPABASE_URL}/rest/v1/distance_pricing_rules?select=id,vehicle_type,city,airport_code,pricing_mode,base_price,extra_km_price,min_km,max_km,start_date,end_date`,
              { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
            );
          }
        } catch (e) {
          console.error("[get-all-vehicle-prices] Fetch error:", e);
          kmRulesRes = await fetch(
            `${SUPABASE_URL}/rest/v1/distance_pricing_rules?select=id,vehicle_type,city,airport_code,pricing_mode,base_price,extra_km_price,min_km,max_km,start_date,end_date`,
            { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
          );
        }

        if (!kmRulesRes || !kmRulesRes.ok) {
          const status = kmRulesRes ? kmRulesRes.status : "unknown";
          const errMsg = "Fiyat hesaplanamadı: Veritabanı hatası (distance_pricing_rules sorgusu başarısız)";
          console.error("[get-all-vehicle-prices DEBUG] Turkey price fail - reason:", errMsg, "| status:", status);
          return {
            prices: turkeyVehicles.map((v) => ({
              vehicleType: v.value,
              vehicleLabel: v.label,
              price: null,
              currency: "EUR",
              passengers: v.passengers,
              luggage: v.luggage,
              available: false,
            })),
            matched: false,
            message: errMsg,
            error: "FİYAT_TANIMLANMADI",
            debug_info: { raw_km_price: null, applied_base_fare: null, source_table: "distance_pricing_rules" },
          };
        }
        
        type KmRule = { 
          vehicle_type: string | null; 
          city: string | null; 
          airport_code: string | null;
          region: string | null;
          pricing_mode: 'fixed' | 'distance' | null;
          base_price: number | null; 
          extra_km_price: number | null;
          min_km: number | null; 
          max_km: number | null; 
          start_date?: string | null; 
          end_date?: string | null; 
          currency?: string | null;
        };
        
        let kmRules: KmRule[] = await kmRulesRes.json();

        // Tarih Filtresi: pickupDate, start_date ve end_date arasında mı?
        // Kuralda tarih yoksa (null), her zaman geçerli kabul edilir.
        if (pickupDateStr && kmRules.length > 0) {
          kmRules = kmRules.filter((r) => {
            const sd = r.start_date ? String(r.start_date).split("T")[0] : null;
            const ed = r.end_date ? String(r.end_date).split("T")[0] : null;
            
            // Eğer tarih kısıtlaması yoksa geçerlidir
            if (!sd && !ed) return true;

            // Tarih kısıtlaması varsa kontrol et
            if (sd && pickupDateStr < sd) return false;
            if (ed && pickupDateStr > ed) return false;
            
            return true;
          });
        }

        // Lokasyon Eşleşmesi: City ve Airport Code
        const cityNorm = normalizeCityName(resolvedPickupCity || "") || normalizeCityName(resolvedDropoffCity || "");
        
        // Airport Code Extraction (e.g. "Istanbul Airport (IST)" -> "IST")
        let currentAirportCode: string | null = null;
        if (airport) {
          const match = airport.match(/\(([A-Z]{3})\)/);
          if (match) currentAirportCode = match[1];
        }

        function norm(s: string | null): string {
          return (s || "").trim().toLowerCase();
        }

        function ruleMatchesLocation(r: KmRule): boolean {
          // 0. Region Kontrolü (Turkey vs Dubai)
          if (r.region) {
            const rRegion = norm(r.region);
            if (isDubai && rRegion !== "dubai") return false;
            if (!isDubai && rRegion !== "turkey") return false;
          }

          // 1. Şehir Kontrolü
          if (r.city) {
            const rCity = norm(r.city);
            const match = rCity === cityNorm || cityNorm.includes(rCity) || rCity.includes(cityNorm);
            if (!match) return false;
          }

          // 2. Havalimanı Kodu Kontrolü
          if (r.airport_code) {
             // Eğer kuralda havalimanı kodu varsa, transferin de o havalimanından olması gerekir.
             // Transferde havalimanı yoksa veya kod uyuşmuyorsa eşleşmez.
             if (!currentAirportCode) return false;
             if (r.airport_code.toUpperCase() !== currentAirportCode) return false;
          }

          return true;
        }

        // Araç Eşleşmesi (Fuzzy Match)
        function ruleMatchesVehicle(r: KmRule, vt: typeof turkeyVehicles[0]): boolean {
          const rVt = norm(r.vehicle_type || "");
          if (!rVt) return false;
          const labelNorm = norm(vt.label);
          for (const alias of vt.dbAliases) {
            const a = norm(alias);
            if (a === rVt) return true;
            if (rVt.includes(a)) return true;
            if (a.includes(rVt)) return true;
          }
          if (labelNorm === rVt) return true;
          if (rVt.includes(labelNorm)) return true;
          if (labelNorm.includes(rVt)) return true;
          return false;
        }

        const vehiclePriceMap: Record<string, { price: number, currency: string }> = {};
        
        const currentAirportFee = airport ? AIRPORT_PARKING_FEE_EUR : 0;

        for (const vt of turkeyVehicles) {
          // Bu araç tipi için uygun kuralları bul
          const matchingRules = (kmRules || []).filter((r) => ruleMatchesVehicle(r, vt) && ruleMatchesLocation(r));
          
          let bestPrice: number | null = null;
          let bestCurrency = "EUR";

          // 1. KM aralığına göre filtrele
          const validKmRules = matchingRules.filter(r => {
            const minKm = r.min_km != null ? Number(r.min_km) : 0;
            const maxKm = r.max_km != null ? Number(r.max_km) : Infinity;
            return distanceKm >= minKm && distanceKm <= maxKm;
          });

          // 2. Önceliklendirme: Tarih kısıtlaması olan (Sezonluk) kurallar > Genel kurallar
          const seasonalRules = validKmRules.filter(r => r.start_date || r.end_date);
          const standardRules = validKmRules.filter(r => !r.start_date && !r.end_date);
          
          // Eğer sezonluk kural varsa SADECE onları kullan, yoksa genel kurallara bak
          const activeRules = seasonalRules.length > 0 ? seasonalRules : standardRules;

          for (const r of activeRules) {
            // Merkezi hesaplama motorunu kullan
            const { price, log } = calculateFinalPrice(r, distanceKm, currentAirportFee);
            
            if (price != null) {
              console.log(log); // Loglamayı burada yapıyoruz
              if (bestPrice == null || price < bestPrice) {
                bestPrice = price;
                bestCurrency = r.currency || "EUR";
              }
            } else {
              console.warn(log); // Hesaplama yapılamadıysa warn logu
            }
          }

          if (bestPrice != null) {
            vehiclePriceMap[vt.value] = { price: bestPrice, currency: bestCurrency };
          }
        }

        console.log("[get-all-vehicle-prices v3.0.0] distance_km:", distanceKm, "| vehiclePriceMap:", vehiclePriceMap);

        const prices = turkeyVehicles.map((vt) => {
          // Artık calculateFinalPrice içinde airport fee dahil edildiği için
          // vehiclePriceMap direkt final fiyatı içeriyor.
          // Ancak, eğer yukarıda calculateFinalPrice kullanılmadıysa (eski kod kalıntıları varsa) dikkatli olmalıyız.
          // Şu anki refactor ile vehiclePriceMap içindeki fiyatlar FINAL (airport dahil) fiyatlardır.
          const data = vehiclePriceMap[vt.value];
          const finalPrice = data?.price ?? null;
          const currency = data?.currency ?? "EUR";
          const available = finalPrice != null && finalPrice > 0;

          return {
            vehicleType: vt.value,
            vehicleLabel: vt.label,
            price: finalPrice,
            currency: currency,
            passengers: vt.passengers,
            luggage: vt.luggage,
            available,
          };
        });

        const hasAvailable = prices.some((p) => p.available);
        let failReason: string | null = null;
        let failError: string | undefined;
        if (!hasAvailable) {
          failReason = "Fiyat hesaplanamadı: Bu rota için kural tanımlı değil.";
          failError = "FİYAT_TANIMLANMADI";
          console.warn("[get-all-vehicle-prices DEBUG] Turkey price fail - FİYAT_TANIMLANMADI");
        }
        
        const debug_info = {
          raw_km_price: distanceKm,
          applied_base_fare: null,
          source_table: "distance_pricing_rules",
          pricing_system: "v3.0.1_centralized"
        };
        
        return {
          prices,
          matched: hasAvailable,
          message: hasAvailable ? null : (failReason || "Fiyat hesaplanamadı"),
          ...(failError && { error: failError }),
          priceSource: "distance_pricing_rules",
          debug_info,
        };
      })();

      const priceSource = (turkeyResult as { priceSource?: string }).priceSource || "distance_pricing_rules";
      const debug_info = (turkeyResult as { debug_info?: object }).debug_info;
      return new Response(
        JSON.stringify({
          ...turkeyResult,
          region: "turkey",
          isDubai: false,
          priceSource,
          transferType: airport ? "Airport Transfer" : null,
          ...(debug_info && { debug_info }),
        }),
        { headers: corsHeaders }
      );
    }

    // ========== DUBAİ: region_prices, intercity_prices, place_id (mevcut mantık) ==========
    if (!city && !airport && isDubai) {
      return new Response(JSON.stringify({
        prices: dubaiVehicles.map((v) => ({
          vehicleType: v.value,
          vehicleLabel: v.label,
          price: null,
          currency: "EUR",
          passengers: v.passengers,
          luggage: v.luggage,
          available: false,
        })),
        matched: false,
        region,
      }), { headers: corsHeaders });
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

      let res: Response;
      try {
        res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        });
      } catch (error) {
        console.error(`Query timeout/error for ${table}`, { filters, error: String(error) });
        return [];
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`Query failed for ${table}`, { status: res.status, filters, errText });
        return [];
      }

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.error("Expected JSON but got:", contentType);
        return [];
      }

      try {
        const payload = await res.json();
        return Array.isArray(payload) ? payload : [];
      } catch (error) {
        console.error(`Invalid JSON response for ${table}`, String(error));
        return [];
      }
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

    // ---- PLACE ID MATCHING (preferred when both IDs provided - Google Place from Autocomplete) ----
    let intercityPrices: any[] = [];
    let regionPrices: any[] = [];
    let usedIntercity = false;
    let usedPlaceId = false;

    if (pickupPlaceId && dropoffPlaceId) {
      try {
        const res = await fetchWithTimeout(
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
      } catch (error) {
        console.error("Place ID intercity query failed", String(error));
      }

      if (!usedPlaceId) {
        try {
          const res2 = await fetchWithTimeout(
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
        } catch (error) {
          console.error("Place ID region query failed", String(error));
        }
      }
    }

    // ---- INTERCITY / INTRA-CITY PRICE MATCHING (text-based, when no Place ID match) ----
    if (!usedPlaceId && isIntercityTransfer && !airport) {
      const fromCity = resolvedPickupCity || city!;
      const toCity = resolvedDropoffCity || city!;
      const sameRouteCity = isSameCity(fromCity, toCity) || sameResolvedCity;

      if (!sameRouteCity) {
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
    }

    // IMPORTANT: When intercity intent (different districts, e.g. Alanya->Kas) but NO intercity match,
    // do NOT fall back to region_prices - that would wrongly use airport->district price (e.g. 111€) for a long route.
    const hasGranularIntercityIntent =
      !!pickupDistrict &&
      !!dropoffDistrict &&
      !airport &&
      hasDifferentResolvedCities;
    const skipRegionFallback = hasGranularIntercityIntent && usedIntercity === false && intercityPrices.length === 0;

    // Apply strict monthly/seasonal filter: use price for pickup_date only (Place ID + text results)
    if (usedIntercity && pickupDateStr) {
      intercityPrices = applySeasonalFilter(intercityPrices, pickupDateStr);
    }

    // ---- REGION PRICES MATCHING (Dubai/International only)
    if (!usedPlaceId && !usedIntercity && !skipRegionFallback) {
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
    if (!usedIntercity && pickupDateStr && regionPrices.length > 0) {
      regionPrices = applySeasonalFilter(regionPrices, pickupDateStr);
    }

    // Use whichever source found prices (validation: specific route+month price is used, no generic override)
    const matchedPrices = usedIntercity ? intercityPrices : regionPrices;

    // distance_pricing_rules: Havalimanı transferinde airport_extra_fee ekle
    let airportExtraFeeByVehicle: Record<string, number> = {};
    let defaultAirportExtraFee = 0;
    if (airport) {
      try {
        const rulesRes = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/distance_pricing_rules?is_airport_transfer=eq.true&select=vehicle_type,airport_extra_fee`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        if (rulesRes.ok) {
          const rules: Array<{ vehicle_type: string | null; airport_extra_fee: number | null }> = await rulesRes.json();
          for (const r of rules || []) {
            const fee = Number(r.airport_extra_fee) || 0;
            if (r.vehicle_type) {
              airportExtraFeeByVehicle[r.vehicle_type] = fee;
            } else {
              defaultAirportExtraFee = fee;
            }
          }
        }
      } catch (e) {
        console.warn("distance_pricing_rules fetch failed:", String(e));
      }
    }

    // Build prices - match DB prices to frontend vehicle types using aliases
    const prices: any[] = [];
    
    for (const vt of vehicleTypes) {
      let match = null;
      for (const alias of vt.dbAliases) {
        match = matchedPrices.find((p: any) => p.vehicle_type === alias);
        if (match) break;
      }
      
      const normalizedMatchPrice = Number(match?.price);

      if (match && Number.isFinite(normalizedMatchPrice) && normalizedMatchPrice > 0) {
        let basePrice = normalizedMatchPrice;
        if (airport) {
          const extraFee = airportExtraFeeByVehicle[vt.value] ??
            vt.dbAliases.map((a: string) => airportExtraFeeByVehicle[a]).find((f: number) => f !== undefined) ??
            defaultAirportExtraFee;
          basePrice += Number(extraFee) || 0;
        }
        prices.push({
          vehicleType: vt.value,
          vehicleLabel: vt.label,
          price: Math.ceil(basePrice),
          currency: "EUR",
          passengers: vt.passengers,
          luggage: vt.luggage,
          available: true
        });
      } else {
        prices.push({
          vehicleType: vt.value,
          vehicleLabel: vt.label,
          price: null,
          currency: "EUR",
          passengers: vt.passengers,
          luggage: vt.luggage,
          available: false
        });
      }
    }

    const hasAvailablePrice = prices.some(
      (priceRow) =>
        priceRow.available &&
        typeof priceRow.price === "number" &&
        Number.isFinite(priceRow.price),
    );

    return new Response(JSON.stringify({
      prices,
      matched: hasAvailablePrice,
      matchedCity: city,
      matchedPickupDistrict: pickupDistrict,
      matchedDropoffDistrict: dropoffDistrict,
      matchedDistrict: district,
      matchedAirport: airport,
      transferType: airport ? "Airport Transfer" : null,
      isDubai,
      region,
      priceSource: usedIntercity ? "intercity_prices" : "region_prices",
      message: hasAvailablePrice ? null : "Fiyat Bulunamadı",
      ...(hasAvailablePrice ? {} : { error: "FİYAT_TANIMLANMADI" }),
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error), prices: [] }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
