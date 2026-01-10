import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { analyzeTransfer } from "../_shared/priceMatching.ts";

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
