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

    // Detect region & city/airport
    const isDubai = /dubai|uae|dxb/i.test(s);
    
    let city: string | null = null;
    let airport: string | null = null;
    
    if (/istanbul|\bist\b|\bsaw\b/i.test(s)) city = "Istanbul";
    else if (/antalya|\bayt\b|alanya|belek|side/i.test(s)) city = "Antalya";
    else if (/bodrum|\bbjv\b/i.test(s)) city = "Bodrum";
    else if (/dalaman|\bdlm\b|fethiye|marmaris/i.test(s)) city = "Dalaman";
    else if (/izmir|\badb\b|cesme/i.test(s)) city = "Izmir";

    if (/istanbul airport/i.test(s)) airport = "Istanbul Airport (IST)";
    else if (/sabiha|gokcen/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
    else if (/antalya.*airport/i.test(s)) airport = "Antalya Airport (AYT)";
    else if (/bodrum|milas/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
    else if (/dalaman/i.test(s)) airport = "Dalaman Airport (DLM)";
    else if (/adnan menderes/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";

    const district = pickup.split(",")[0]?.trim() || null;

    // Vehicle types - matching DB values
    const vehicleTypes = isDubai ? [
      { value: "dubai-private-sedan", label: "Dubai Private Sedan", passengers: 3, luggage: 3 },
      { value: "dubai-suburban-suv", label: "Dubai Suburban SUV", passengers: 5, luggage: 5 },
      { value: "dubai-v-class", label: "Dubai V-Class", passengers: 6, luggage: 6 },
      { value: "dubai-premium-van", label: "Dubai Premium Van", passengers: 7, luggage: 7 },
      { value: "dubai-vip-sprinter", label: "Dubai VIP Sprinter", passengers: 12, luggage: 12 },
    ] : [
      { value: "standard_sedan", label: "Standard Sedan", passengers: 3, luggage: 3 },
      { value: "sedan", label: "Sedan", passengers: 3, luggage: 3 },
      { value: "mercedes-vito", label: "Mercedes Vito or Similar", passengers: 7, luggage: 7 },
      { value: "vip-vito", label: "VIP Mercedes Vito", passengers: 7, luggage: 7 },
      { value: "mercedes-vip-vito", label: "VIP Mercedes Vito", passengers: 7, luggage: 7 },
      { value: "maybach-minivan", label: "Mercedes Maybach Minivan", passengers: 7, luggage: 7 },
      { value: "mercedes-sprinter", label: "Mercedes Sprinter or Similar", passengers: 12, luggage: 12 },
      { value: "minibus", label: "Minibus", passengers: 14, luggage: 14 },
    ];

    if (!city && !airport) {
      return new Response(JSON.stringify({
        prices: vehicleTypes.map(v => ({ ...v, price: null, currency: customerCurrency || "EUR", available: false })),
        matched: false
      }), { headers: corsHeaders });
    }

    // Fetch prices via REST API
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

    // Build prices - deduplicate by checking if we already have a result for similar labels
    const seenLabels = new Set<string>();
    const prices: any[] = [];
    
    for (const vt of vehicleTypes) {
      // Skip if we already have a price for this label
      if (seenLabels.has(vt.label)) continue;
      
      const match = regionPrices.find((p: any) => p.vehicle_type === vt.value);
      if (match) {
        seenLabels.add(vt.label);
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
      isDubai
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error), prices: [] }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
