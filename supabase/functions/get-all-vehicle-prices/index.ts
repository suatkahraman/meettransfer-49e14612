const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { pickup, dropoff, customerCurrency } = await req.json();
    const s = (pickup + " " + dropoff).toLowerCase();

    // Detect region
    const isDubai = /dubai|uae|dxb|dwc|al maktoum/i.test(s);
    const region = isDubai ? "dubai" : "turkey";
    
    let city: string | null = null;
    let airport: string | null = null;
    
    if (isDubai) {
      city = "Dubai";
      if (/dxb|dubai.*airport|dubai.*international/i.test(s)) airport = "Dubai International Airport (DXB)";
      else if (/dwc|al maktoum/i.test(s)) airport = "Al Maktoum International Airport (DWC)";
    } else {
      if (/istanbul|\bist\b|\bsaw\b/i.test(s)) city = "Istanbul";
      else if (/antalya|\bayt\b|alanya|belek|side|kemer|manavgat/i.test(s)) city = "Antalya";
      else if (/bodrum|\bbjv\b|turgutreis|yalikavak|gumbet/i.test(s)) city = "Bodrum";
      else if (/dalaman|\bdlm\b|fethiye|marmaris|oludeniz/i.test(s)) city = "Dalaman";
      else if (/izmir|\badb\b|cesme|alacati/i.test(s)) city = "Izmir";

      if (/istanbul airport/i.test(s)) airport = "Istanbul Airport (IST)";
      else if (/sabiha|gokcen/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
      else if (/antalya.*airport|antalya.*havalimanı/i.test(s)) airport = "Antalya Airport (AYT)";
      else if (/bodrum|milas/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
      else if (/dalaman/i.test(s)) airport = "Dalaman Airport (DLM)";
      else if (/adnan menderes/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";
    }

    const district = pickup.split(",")[0]?.trim() || null;

    // Frontend vehicle types - must match src/lib/vehicleTypes.ts and dubaiVehicleTypes.ts
    // Each entry maps to possible DB vehicle_type values for price lookup
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

    // Fetch ALL active prices for this city/airport
    const params = new URLSearchParams({ is_active: "eq.true" });
    if (city) params.append("city", `eq.${city}`);
    if (airport) params.append("airport", `eq.${airport}`);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/region_prices?${params.toString()}&select=vehicle_type,price,price_currency`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      }
    });

    const regionPrices = await res.json();

    // Build prices - match DB prices to frontend vehicle types using aliases
    const prices: any[] = [];
    
    for (const vt of vehicleTypes) {
      // Try all DB aliases for this frontend vehicle type
      let match = null;
      for (const alias of vt.dbAliases) {
        match = regionPrices.find((p: any) => p.vehicle_type === alias);
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
      matchedDistrict: district,
      matchedAirport: airport,
      isDubai,
      region,
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error), prices: [] }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
