import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { analyzeTransfer } from "../_shared/priceMatching.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GetPricesRequest {
  pickup: string;
  dropoff: string;
  customerCurrency: string;
}

interface VehiclePriceInfo {
  vehicleType: string;
  vehicleLabel: string;
  price: number | null;
  currency: string;
  passengers: number;
  luggage: number;
  available: boolean;
}

// Currency conversion helper
async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ amount: number; rate: number }> {
  if (fromCurrency === toCurrency) {
    return { amount, rate: 1 };
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`
    );
    if (response.ok) {
      const data = await response.json();
      const rate = data.rates[toCurrency];
      return { amount: Math.round(amount * rate), rate };
    }
  } catch (e) {
    console.error("Currency conversion error:", e);
  }

  // Fallback rates
  const fallbackRates: Record<string, Record<string, number>> = {
    'EUR': { 'USD': 1.08, 'TRY': 37.5, 'GBP': 0.85, 'AED': 3.97, 'AUD': 1.65 },
    'USD': { 'EUR': 0.93, 'TRY': 34.5, 'GBP': 0.79, 'AED': 3.67, 'AUD': 1.53 },
    'TRY': { 'EUR': 0.027, 'USD': 0.029, 'GBP': 0.023, 'AED': 0.11, 'AUD': 0.045 },
  };

  const rate = fallbackRates[fromCurrency]?.[toCurrency] || 1;
  return { amount: Math.round(amount * rate), rate };
}

// Vehicle type configuration - synced with src/lib/vehicleTypes.ts
const VEHICLE_CONFIG: Record<string, { label: string; passengers: number; luggage: number }> = {
  'mercedes-vito': { label: 'Mercedes Vito', passengers: 6, luggage: 6 },
  'vip-mercedes': { label: 'VIP Mercedes', passengers: 5, luggage: 5 },
  'maybach-minibus': { label: 'Maybach Minibus', passengers: 4, luggage: 4 },
  'minibus': { label: 'Mercedes Sprinter', passengers: 16, luggage: 16 },
};

const VEHICLE_TYPES = ['mercedes-vito', 'vip-mercedes', 'maybach-minibus', 'minibus'];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { pickup, dropoff, customerCurrency }: GetPricesRequest = await req.json();

    console.log("🚗 Getting all vehicle prices for route:", pickup, "→", dropoff);

    // Analyze transfer using shared module
    const transferInfo = analyzeTransfer(pickup, dropoff);
    const { airport, city, district, direction, confidence } = transferInfo;

    console.log("📍 Transfer analysis:", { airport, city, district, direction, confidence });

    if (!city && !airport) {
      console.log("❌ No location match - returning empty prices");
      return new Response(
        JSON.stringify({ 
          prices: VEHICLE_TYPES.map(vt => ({
            vehicleType: vt,
            vehicleLabel: VEHICLE_CONFIG[vt].label,
            price: null,
            currency: customerCurrency,
            passengers: VEHICLE_CONFIG[vt].passengers,
            luggage: VEHICLE_CONFIG[vt].luggage,
            available: false,
          })),
          matched: false,
          reason: "no_location_match"
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all prices for this route
    const vehiclePrices: VehiclePriceInfo[] = [];
    let baseCurrency = 'EUR';
    let exchangeRate = 1;

    for (const vehicleType of VEHICLE_TYPES) {
      let foundPrice: { price: number; currency: string } | null = null;

      // Try exact match (airport + city + district + vehicle)
      if (!foundPrice && airport && city && district) {
        const { data } = await supabase
          .from("region_prices")
          .select("price, price_currency")
          .eq("city", city)
          .eq("airport", airport)
          .eq("district", district)
          .eq("vehicle_type", vehicleType)
          .eq("is_active", true)
          .limit(1);

        if (data && data.length > 0) {
          foundPrice = { price: data[0].price, currency: data[0].price_currency };
        }
      }

      // Try airport + city match
      if (!foundPrice && airport && city) {
        const { data } = await supabase
          .from("region_prices")
          .select("price, price_currency")
          .eq("city", city)
          .eq("airport", airport)
          .eq("vehicle_type", vehicleType)
          .eq("is_active", true)
          .order("price", { ascending: true })
          .limit(1);

        if (data && data.length > 0) {
          foundPrice = { price: data[0].price, currency: data[0].price_currency };
        }
      }

      // Try city only match
      if (!foundPrice && city) {
        const { data } = await supabase
          .from("region_prices")
          .select("price, price_currency")
          .eq("city", city)
          .eq("vehicle_type", vehicleType)
          .eq("is_active", true)
          .order("price", { ascending: true })
          .limit(1);

        if (data && data.length > 0) {
          foundPrice = { price: data[0].price, currency: data[0].price_currency };
        }
      }

      // Try airport only match
      if (!foundPrice && airport) {
        const { data } = await supabase
          .from("region_prices")
          .select("price, price_currency")
          .eq("airport", airport)
          .eq("vehicle_type", vehicleType)
          .eq("is_active", true)
          .order("price", { ascending: true })
          .limit(1);

        if (data && data.length > 0) {
          foundPrice = { price: data[0].price, currency: data[0].price_currency };
        }
      }

      const config = VEHICLE_CONFIG[vehicleType];
      
      if (foundPrice) {
        baseCurrency = foundPrice.currency;
        let finalPrice = foundPrice.price;
        let finalCurrency = foundPrice.currency;

        // Convert to customer's preferred currency if different
        if (customerCurrency && customerCurrency !== foundPrice.currency) {
          const conversion = await convertCurrency(foundPrice.price, foundPrice.currency, customerCurrency);
          finalPrice = conversion.amount;
          finalCurrency = customerCurrency;
          exchangeRate = conversion.rate;
        }

        vehiclePrices.push({
          vehicleType,
          vehicleLabel: config.label,
          price: finalPrice,
          currency: finalCurrency,
          passengers: config.passengers,
          luggage: config.luggage,
          available: true,
        });
      } else {
        vehiclePrices.push({
          vehicleType,
          vehicleLabel: config.label,
          price: null,
          currency: customerCurrency || 'EUR',
          passengers: config.passengers,
          luggage: config.luggage,
          available: false,
        });
      }
    }

    console.log("✅ Vehicle prices found:", vehiclePrices.filter(v => v.available).length, "out of", VEHICLE_TYPES.length);

    return new Response(
      JSON.stringify({
        prices: vehiclePrices,
        matched: vehiclePrices.some(v => v.available),
        matchedCity: city,
        matchedDistrict: district,
        matchedAirport: airport,
        direction,
        confidence,
        baseCurrency,
        exchangeRate: exchangeRate !== 1 ? exchangeRate : null,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Get prices error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage, prices: [] }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
