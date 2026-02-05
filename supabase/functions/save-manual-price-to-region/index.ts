import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

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
  { re: /(esenboga|ankara.*airport|\besb\b)/i, value: "Esenboğa Havalimanı (ESB)" },
  { re: /(diyarbakir|\bdiy\b)/i, value: "Diyarbakir Airport (DIY)" },
  { re: /(mardin|\bmqm\b)/i, value: "Mardin Airport (MQM)" },
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


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SavePriceRequest {
  pickup: string;
  dropoff: string;
  vehicle_type: string;
  price: number;
  price_currency: string;
  reservation_id?: string;
  quick_booking_id?: string;
  admin_user_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body: SavePriceRequest = await req.json();
    const { pickup, dropoff, vehicle_type, price, price_currency, reservation_id, quick_booking_id, admin_user_id } = body;

    console.log("[save-manual-price] Request:", JSON.stringify(body, null, 2));

    if (!pickup || !dropoff || !vehicle_type || !price) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Analyze the route to extract location info
    const transferInfo = analyzeTransfer(pickup, dropoff);
    console.log("[save-manual-price] Transfer analysis:", JSON.stringify(transferInfo, null, 2));

    // Extract values from analysis
    const pickupAirport = transferInfo.pickupAnalysis.airport?.value || null;
    const dropoffAirport = transferInfo.pickupAnalysis.airport?.value || null;
    const pickupCity = transferInfo.pickupAnalysis.city?.value || transferInfo.pickupAnalysis.district?.city || null;
    const dropoffCity = transferInfo.dropoffAnalysis.city?.value || transferInfo.dropoffAnalysis.district?.city || null;
    const pickupDistrict = transferInfo.pickupAnalysis.district?.value || null;
    const dropoffDistrict = transferInfo.dropoffAnalysis.district?.value || null;

    // Determine if this is an airport transfer or intercity/same-city different districts
    const isAirportTransfer = !!(pickupAirport || dropoffAirport);
    const isIntercity = pickupCity !== dropoffCity && pickupCity && dropoffCity;
    // Same city but different districts (like Kadıköy → Beylikdüzü)
    const isSameCityDifferentDistricts = pickupCity === dropoffCity && 
                                          pickupDistrict && dropoffDistrict && 
                                          pickupDistrict !== dropoffDistrict;

    let saved = false;
    let saveLocation = "";

    // If it's an intercity transfer OR same city with different districts, save to intercity_prices
    if (isIntercity || isSameCityDifferentDistricts) {
      const transferType = isIntercity ? "Intercity" : "Same-city different districts";
      console.log(`[save-manual-price] ${transferType} route detected, saving to intercity_prices`);
      
      const fromCity = pickupCity;
      const toCity = dropoffCity;
      const fromDistrict = pickupDistrict || null;
      const toDistrict = dropoffDistrict || null;

      if (fromCity && toCity) {
        // Check if price already exists for this route (check both directions for same-city)
        let existingQuery = supabase
          .from("intercity_prices")
          .select("id")
          .eq("from_city", fromCity)
          .eq("to_city", toCity)
          .eq("vehicle_type", vehicle_type)
          .eq("is_active", true);

        if (fromDistrict) {
          existingQuery = existingQuery.eq("from_district", fromDistrict);
        } else {
          existingQuery = existingQuery.is("from_district", null);
        }
        
        if (toDistrict) {
          existingQuery = existingQuery.eq("to_district", toDistrict);
        } else {
          existingQuery = existingQuery.is("to_district", null);
        }

        const { data: existingPrice } = await existingQuery.maybeSingle();

        if (existingPrice) {
          // Update existing price
          const { error: updateError } = await supabase
            .from("intercity_prices")
            .update({
              price,
              price_currency,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingPrice.id);

          if (updateError) {
            console.error("[save-manual-price] Error updating intercity price:", updateError);
          } else {
            saved = true;
            saveLocation = `intercity_prices: ${fromCity}${fromDistrict ? `/${fromDistrict}` : ""} → ${toCity}${toDistrict ? `/${toDistrict}` : ""} (updated)`;
            console.log("[save-manual-price] Updated intercity price:", saveLocation);
          }
        } else {
          // Insert new price
          const { error: insertError } = await supabase
            .from("intercity_prices")
            .insert({
              from_city: fromCity,
              to_city: toCity,
              from_district: fromDistrict,
              to_district: toDistrict,
              vehicle_type,
              price,
              price_currency,
              is_active: true,
              created_by: admin_user_id || null,
            });

          if (insertError) {
            console.error("[save-manual-price] Error inserting intercity price:", insertError);
          } else {
            saved = true;
            saveLocation = `intercity_prices: ${fromCity}${fromDistrict ? `/${fromDistrict}` : ""} → ${toCity}${toDistrict ? `/${toDistrict}` : ""} (new)`;
            console.log("[save-manual-price] Inserted new intercity price:", saveLocation);
          }
        }
      }
    }
    // If it's an airport transfer, save to region_prices
    else if (isAirportTransfer) {
      console.log("[save-manual-price] Airport transfer detected, saving to region_prices");
      
      const airport = transferInfo.airport;
      const city = transferInfo.city;
      const district = transferInfo.district;

      if (airport && city && district) {
        // Check if price already exists for this route
        const { data: existingPrice } = await supabase
          .from("region_prices")
          .select("id")
          .eq("airport", airport)
          .eq("city", city)
          .eq("district", district)
          .eq("vehicle_type", vehicle_type)
          .eq("is_active", true)
          .maybeSingle();

        if (existingPrice) {
          // Update existing price
          const { error: updateError } = await supabase
            .from("region_prices")
            .update({
              price,
              price_currency,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingPrice.id);

          if (updateError) {
            console.error("[save-manual-price] Error updating region price:", updateError);
          } else {
            saved = true;
            saveLocation = `region_prices: ${airport} → ${city}/${district} (updated)`;
            console.log("[save-manual-price] Updated region price:", saveLocation);
          }
        } else {
          // Insert new price
          const { error: insertError } = await supabase
            .from("region_prices")
            .insert({
              airport,
              city,
              district,
              vehicle_type,
              price,
              price_currency,
              is_active: true,
              created_by: admin_user_id || null,
            });

          if (insertError) {
            console.error("[save-manual-price] Error inserting region price:", insertError);
          } else {
            saved = true;
            saveLocation = `region_prices: ${airport} → ${city}/${district} (new)`;
            console.log("[save-manual-price] Inserted new region price:", saveLocation);
          }
        }
      } else {
        console.log("[save-manual-price] Missing data for region_prices:", { airport, city, district });
      }
    }
    // For non-airport, same-city transfers, try to save to region_prices with city center
    else if (pickupCity && pickupDistrict) {
      console.log("[save-manual-price] Same-city transfer, attempting to save to region_prices");
      
      // Try to find the nearest airport for this city
      const city = pickupCity;
      const district = pickupDistrict;
      
      // Map city to default airport
      const cityToAirport: Record<string, string> = {
        "Istanbul": "Istanbul Airport (IST)",
        "Antalya": "Antalya Airport (AYT)",
        "Bodrum": "Bodrum-Milas Airport (BJV)",
        "Dalaman": "Dalaman Airport (DLM)",
        "Izmir": "Izmir Adnan Menderes Airport (ADB)",
        "Cappadocia": "Kayseri Airport (ASR)",
        "Nevsehir": "Nevsehir-Kapadokya Airport (NAV)",
        "Kayseri": "Kayseri Airport (ASR)",
        "Dubai": "Dubai International Airport (DXB)",
        "Cyprus": "Larnaca Airport (LCA)",
        "Bursa": "Bursa Yenisehir Airport (YEI)",
      };

      const airport = cityToAirport[city];
      
      if (airport && district) {
        // Check if price already exists
        const { data: existingPrice } = await supabase
          .from("region_prices")
          .select("id")
          .eq("airport", airport)
          .eq("city", city)
          .eq("district", district)
          .eq("vehicle_type", vehicle_type)
          .eq("is_active", true)
          .maybeSingle();

        if (existingPrice) {
          // Update existing price
          const { error: updateError } = await supabase
            .from("region_prices")
            .update({
              price,
              price_currency,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingPrice.id);

          if (updateError) {
            console.error("[save-manual-price] Error updating region price:", updateError);
          } else {
            saved = true;
            saveLocation = `region_prices: ${airport} → ${city}/${district} (updated)`;
            console.log("[save-manual-price] Updated region price:", saveLocation);
          }
        } else {
          // Insert new price
          const { error: insertError } = await supabase
            .from("region_prices")
            .insert({
              airport,
              city,
              district,
              vehicle_type,
              price,
              price_currency,
              is_active: true,
              created_by: admin_user_id || null,
            });

          if (insertError) {
            console.error("[save-manual-price] Error inserting region price:", insertError);
          } else {
            saved = true;
            saveLocation = `region_prices: ${airport} → ${city}/${district} (new)`;
            console.log("[save-manual-price] Inserted new region price:", saveLocation);
          }
        }
      }
    }

    // Record this action in price_history
    if (saved) {
      try {
        await supabase.from("price_history").insert({
          reservation_id: reservation_id || null,
          quick_booking_id: quick_booking_id || null,
          price,
          price_currency,
          action: "saved_to_prices",
          customer_note: `Manuel fiyat kaydedildi: ${saveLocation}`,
          admin_user_id: admin_user_id || null,
        });
      } catch (e) {
        console.error("[save-manual-price] Failed to record price history:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: saved,
        saved_location: saved ? saveLocation : null,
        transfer_info: transferInfo,
        message: saved 
          ? `Fiyat başarıyla kaydedildi: ${saveLocation}` 
          : "Rota analizi yapılamadı, fiyat kaydedilemedi",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[save-manual-price] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
