const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// District mapping for known locations - must match auto-price functions
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

function detectDistrict(text: string): string | null {
  const lower = normalizeTurkish(text).toLowerCase();
  for (const [key, value] of Object.entries(DISTRICT_MAPPING)) {
    if (lower.includes(key)) return value;
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
  if (/izmir|\badb\b|cesme|alacati/i.test(s)) return "Izmir";
  if (/bursa/i.test(s)) return "Bursa";
  return null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { pickup, dropoff, customerCurrency } = await req.json();
    const s = normalizeTurkish(pickup + " " + dropoff).toLowerCase();

    // Detect region
    const isDubai = /dubai|uae|dxb|dwc|al maktoum/i.test(s);
    const region = isDubai ? "dubai" : "turkey";
    
    // Detect cities from pickup and dropoff separately
    const pickupCity = detectCity(pickup);
    const dropoffCity = detectCity(dropoff);
    const city = pickupCity || dropoffCity;
    
    // Detect districts from pickup and dropoff separately
    const pickupDistrict = detectDistrict(pickup);
    const dropoffDistrict = detectDistrict(dropoff);
    const district = pickupDistrict || dropoffDistrict;

    let airport: string | null = null;
    
    if (isDubai) {
      if (/dxb|dubai.*airport|dubai.*international/i.test(s)) airport = "Dubai International Airport (DXB)";
      else if (/dwc|al maktoum/i.test(s)) airport = "Al Maktoum International Airport (DWC)";
    } else {
      if (/istanbul airport/i.test(s)) airport = "Istanbul Airport (IST)";
      else if (/sabiha|gokcen/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
      else if (/antalya.*airport|antalya.*havalimanı/i.test(s)) airport = "Antalya Airport (AYT)";
      else if (/bodrum|milas/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
      else if (/dalaman/i.test(s)) airport = "Dalaman Airport (DLM)";
      else if (/adnan menderes/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";
      else if (/esenboga|\besb\b/i.test(s)) airport = "Ankara Esenboga Airport (ESB)";
    }

    // Determine if this is an intercity or intra-city transfer without airport
    const isIntercityTransfer = (pickupCity && dropoffCity && pickupCity !== dropoffCity) || 
                                 (!airport && pickupDistrict && dropoffDistrict);

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
        value: "minibus", label: "Mercedes Sprinter or Similar", passengers: 16, luggage: 16,
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

    // Helper to query any table with specific filters
    async function queryTable(table: string, filters: Record<string, string>): Promise<any[]> {
      const params = new URLSearchParams({ 
        is_active: "eq.true",
        select: "vehicle_type,price,price_currency",
        order: "updated_at.desc",
        ...filters
      });

      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        }
      });

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.error("Expected JSON but got:", contentType);
        return [];
      }

      return res.json();
    }

    // ---- INTERCITY / INTRA-CITY PRICE MATCHING (no airport) ----
    let intercityPrices: any[] = [];
    let usedIntercity = false;

    if (isIntercityTransfer && !airport) {
      const fromCity = pickupCity || city!;
      const toCity = dropoffCity || city!;

      // Strategy I1: from_district + to_district + cities (most specific)
      if (pickupDistrict && dropoffDistrict) {
        intercityPrices = await queryTable("intercity_prices", {
          from_city: `eq.${fromCity}`,
          to_city: `eq.${toCity}`,
          from_district: `eq.${pickupDistrict}`,
          to_district: `eq.${dropoffDistrict}`,
        });

        // Also try reverse direction
        if (intercityPrices.length === 0) {
          intercityPrices = await queryTable("intercity_prices", {
            from_city: `eq.${toCity}`,
            to_city: `eq.${fromCity}`,
            from_district: `eq.${dropoffDistrict}`,
            to_district: `eq.${pickupDistrict}`,
          });
        }
      }

      // Strategy I2: from_district only + cities
      if (intercityPrices.length === 0 && pickupDistrict) {
        intercityPrices = await queryTable("intercity_prices", {
          from_city: `eq.${fromCity}`,
          to_city: `eq.${toCity}`,
          from_district: `eq.${pickupDistrict}`,
        });
      }

      // Strategy I3: to_district only + cities
      if (intercityPrices.length === 0 && dropoffDistrict) {
        intercityPrices = await queryTable("intercity_prices", {
          from_city: `eq.${fromCity}`,
          to_city: `eq.${toCity}`,
          to_district: `eq.${dropoffDistrict}`,
        });
      }

      // Strategy I4: cities only (broadest)
      if (intercityPrices.length === 0 && fromCity && toCity) {
        intercityPrices = await queryTable("intercity_prices", {
          from_city: `eq.${fromCity}`,
          to_city: `eq.${toCity}`,
        });

        // Also try reverse
        if (intercityPrices.length === 0 && fromCity !== toCity) {
          intercityPrices = await queryTable("intercity_prices", {
            from_city: `eq.${toCity}`,
            to_city: `eq.${fromCity}`,
          });
        }
      }

      if (intercityPrices.length > 0) usedIntercity = true;
    }

    // ---- REGION PRICES MATCHING (airport transfers + fallback) ----
    let regionPrices: any[] = [];

    if (!usedIntercity) {
      // Strategy R1: District + City + Airport (most specific)
      if (district && city && airport) {
        regionPrices = await queryTable("region_prices", {
          district: `eq.${district}`,
          city: `eq.${city}`,
          airport: `eq.${airport}`,
        });
      }

      // Strategy R2: District + City (no airport filter)
      if (regionPrices.length === 0 && district && city) {
        regionPrices = await queryTable("region_prices", {
          district: `eq.${district}`,
          city: `eq.${city}`,
        });
      }

      // Strategy R3: City + Airport (no district)
      if (regionPrices.length === 0 && city && airport) {
        regionPrices = await queryTable("region_prices", {
          city: `eq.${city}`,
          airport: `eq.${airport}`,
        });
      }

      // Strategy R4: City only
      if (regionPrices.length === 0 && city) {
        regionPrices = await queryTable("region_prices", {
          city: `eq.${city}`,
        });
      }

      // Strategy R5: Airport only
      if (regionPrices.length === 0 && airport) {
        regionPrices = await queryTable("region_prices", {
          airport: `eq.${airport}`,
        });
      }
    }

    // Use whichever source found prices
    const matchedPrices = usedIntercity ? intercityPrices : regionPrices;

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
      priceSource: usedIntercity ? "intercity_prices" : "region_prices",
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error), prices: [] }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
