import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  analyzeTransfer,
  calculateDiscount,
  logAnalysis,
  checkPriceSanity,
  logPriceSanityCheck,
} from "../_shared/priceMatching.ts";
import { getVehicleFallbackList, getVehicleLabel, detectRegion } from "../_shared/vehicleConfig.ts";
import { convertCurrency, getCurrencySymbol } from "../_shared/currencyUtils.ts";
import { autoPriceSuccessEmail, manualPriceRequiredEmail } from "../_shared/emailTemplates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutoPriceRequest {
  reservation_id: string;
}

// Send admin notification for manual pricing
async function sendManualPriceRequestEmail(
  reservation: any,
  transferInfo: any,
  reason?: string
): Promise<void> {
  const adminEmail = "sautkahraman@gmail.com";
  
  try {
    const emailHtml = manualPriceRequiredEmail(
      reservation,
      {
        airport: transferInfo.airport,
        city: transferInfo.city,
        district: transferInfo.district,
        direction: transferInfo.direction,
        confidence: transferInfo.confidence,
        additionalReason: reason,
      },
      'reservation'
    );

    await resend.emails.send({
      from: "Meet Transfer <noreply@mail.meettransfer.app>",
      to: adminEmail,
      subject: `⚠️ Manuel Fiyat Gerekli: ${reservation.customer_name}`,
      html: emailHtml,
    });
    console.log("📧 Manual price request email sent to admin");
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

    // Parse request body
    let reservation_id: string;
    try {
      const body = await req.json();
      reservation_id = body.reservation_id;
      if (!reservation_id) {
        console.error("❌ Missing reservation_id in request body");
        return new Response(JSON.stringify({ error: "reservation_id is required", matched: false }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return new Response(JSON.stringify({ error: "Invalid request body", matched: false }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("🚗 Auto-pricing started for reservation:", reservation_id);

    // Fetch the reservation
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservation_id)
      .single();

    if (reservationError || !reservation) {
      console.error("❌ Reservation not found:", reservationError);
      return new Response(JSON.stringify({ error: "Reservation not found", matched: false }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // For agency reservations: skip pricing but still do driver matching
    const isAgencyReservation = reservation.agency_id || reservation.agency_user_id;
    if (isAgencyReservation) {
      console.log("🏢 Agency reservation - skip pricing, attempt driver matching only");
    }

    // Skip if already has a price (but not for agency - they don't use auto-pricing)
    if (!isAgencyReservation && reservation.price && reservation.price > 0) {
      console.log("💰 Reservation already has price - skipping");
      return new Response(JSON.stringify({ matched: false, reason: "already_priced" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // For agency reservations: only do driver matching, skip pricing logic
    if (isAgencyReservation) {
      // Analyze transfer for driver matching only
      const transferInfo = analyzeTransfer(reservation.pickup, reservation.dropoff);
      const { city, airport } = transferInfo;
      
      const pickupCity = transferInfo.pickupAnalysis.city?.value || transferInfo.pickupAnalysis.district?.city || null;
      const dropoffCity = transferInfo.dropoffAnalysis.city?.value || transferInfo.dropoffAnalysis.district?.city || null;
      const airportCity = airport ? (
        airport.includes('Istanbul') || airport.includes('Sabiha') ? 'Istanbul' :
        airport.includes('Antalya') ? 'Antalya' :
        airport.includes('Bodrum') ? 'Bodrum' :
        airport.includes('Dalaman') ? 'Dalaman' :
        airport.includes('Izmir') ? 'Izmir' :
        airport.includes('Kayseri') || airport.includes('Nevsehir') ? 'Cappadocia' :
        airport.includes('Dubai') ? 'Dubai' :
        airport.includes('Larnaca') || airport.includes('Paphos') || airport.includes('Ercan') ? 'Cyprus' :
        airport.includes('Bursa') ? 'Bursa' : null
      ) : null;
      
      const driverMatchCity = city || pickupCity || dropoffCity || airportCity;
      
      // =====================================================
      // AUTO-FILL: passenger_cash_amount & customer_price for cash payments
      // =====================================================
      if (reservation.payment_type === 'cash' && reservation.price && reservation.price > 0) {
        console.log(`💵 Cash payment detected for agency reservation - auto-filling amounts`);
        
        // Update reservation with passenger_cash_amount
        const { error: cashUpdateError } = await supabase
          .from("reservations")
          .update({
            passenger_cash_amount: reservation.price,
            passenger_cash_currency: reservation.price_currency || 'TRY'
          })
          .eq("id", reservation_id);
        
        if (cashUpdateError) {
          console.error("❌ Failed to update passenger_cash_amount:", cashUpdateError);
        } else {
          console.log(`✅ passenger_cash_amount set to ${reservation.price} ${reservation.price_currency}`);
        }
        
        // Check if agency_reservation_details exists
        const { data: existingDetails } = await supabase
          .from("agency_reservation_details")
          .select("id")
          .eq("reservation_id", reservation_id)
          .single();
        
        if (existingDetails) {
          // Update existing record
          const { error: detailsError } = await supabase
            .from("agency_reservation_details")
            .update({
              customer_price: reservation.price,
              agency_price_currency: reservation.price_currency || 'USD',
              updated_at: new Date().toISOString()
            })
            .eq("reservation_id", reservation_id);
          
          if (detailsError) {
            console.error("❌ Failed to update agency_reservation_details:", detailsError);
          } else {
            console.log(`✅ customer_price set to ${reservation.price} ${reservation.price_currency}`);
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from("agency_reservation_details")
            .insert({
              reservation_id: reservation_id,
              customer_price: reservation.price,
              agency_price_currency: reservation.price_currency || 'USD',
              agency_user_id: reservation.agency_user_id
            });
          
          if (insertError) {
            console.error("❌ Failed to insert agency_reservation_details:", insertError);
          } else {
            console.log(`✅ agency_reservation_details created with customer_price ${reservation.price}`);
          }
        }
      }
      // =====================================================
      
      if (driverMatchCity) {
        console.log(`🚗 Agency reservation - attempting driver matching for: ${driverMatchCity}`);
        
        const cityToRegionMap: Record<string, string[]> = {
          'Istanbul': ['Istanbul', 'İstanbul', 'istanbul', 'İSTANBUL'],
          'İstanbul': ['Istanbul', 'İstanbul', 'istanbul', 'İSTANBUL'],
          'Antalya': ['Antalya', 'antalya', 'ANTALYA'],
          'Alanya': ['Antalya', 'antalya', 'ANTALYA'],
          'Kemer': ['Antalya', 'antalya', 'ANTALYA'],
          'Belek': ['Antalya', 'antalya', 'ANTALYA'],
          'Side': ['Antalya', 'antalya', 'ANTALYA'],
          'Manavgat': ['Antalya', 'antalya', 'ANTALYA'],
          'Izmir': ['Izmir', 'İzmir', 'izmir', 'İZMİR'],
          'İzmir': ['Izmir', 'İzmir', 'izmir', 'İZMİR'],
          'Bodrum': ['Bodrum', 'bodrum', 'BODRUM', 'Mugla', 'Muğla'],
          'Dalaman': ['Dalaman', 'dalaman', 'DALAMAN', 'Mugla', 'Muğla'],
          'Fethiye': ['Fethiye', 'fethiye', 'FETHIYE', 'Dalaman'],
          'Marmaris': ['Dalaman', 'dalaman', 'DALAMAN'],
          'Cappadocia': ['Cappadocia', 'Kapadokya', 'Nevsehir', 'Nevşehir', 'Kayseri'],
          'Dubai': ['Dubai', 'dubai', 'DUBAI', 'UAE'],
          'Cyprus': ['Cyprus', 'Kıbrıs', 'KKTC', 'Larnaca', 'Paphos', 'Ercan'],
          'Bursa': ['Bursa', 'bursa', 'BURSA'],
        };
        
        const possibleRegions = cityToRegionMap[driverMatchCity] || [driverMatchCity];
        
        const { data: matchingDrivers } = await supabase
          .from('drivers')
          .select('id, name, user_id, phone, plate_number, region')
          .eq('active', true)
          .in('region', possibleRegions)
          .limit(5);
        
        if (matchingDrivers && matchingDrivers.length > 0) {
          const driver = matchingDrivers[0];
          console.log(`✅ Agency reservation - auto-assigning driver: ${driver.name}`);
          
          // Update only driver fields, keep status as is (confirmed for agency)
          const { error: updateError } = await supabase
            .from("reservations")
            .update({
              driver_id: driver.id,
              driver_user_id: driver.user_id,
              status: 'sent_to_driver'
            })
            .eq("id", reservation_id);
          
          if (updateError) {
            console.error("❌ Failed to assign driver:", updateError);
            throw updateError;
          }
          
          // Notify driver
          try {
            await supabase.functions.invoke('notify-driver-new-reservation', {
              body: { reservation_id, driver_id: driver.id }
            });
            console.log("✅ Driver notification sent");
          } catch (notifyErr) {
            console.log("Driver notification skipped:", notifyErr);
          }
          
          // Send admin notification for agency reservation
          try {
            await supabase.functions.invoke('notify-admin-new-reservation', {
              body: { 
                reservation_id,
                customer_name: reservation.customer_name,
                pickup: reservation.pickup,
                dropoff: reservation.dropoff,
                pickup_date: reservation.pickup_date,
                pickup_time: reservation.pickup_time,
                vehicle_type: reservation.vehicle_type,
                customer_phone: reservation.customer_phone
              }
            });
            console.log("✅ Admin notification sent for agency reservation");
          } catch (adminNotifyErr) {
            console.log("Admin notification skipped:", adminNotifyErr);
          }
          
          // Send confirmation email to customer if they have an email
          try {
            if (reservation.customer_id) {
              await supabase.functions.invoke('send-confirmation-email', {
                body: { reservation_id, lang: 'tr' }
              });
              console.log("✅ Customer confirmation email sent");
            }
          } catch (emailErr) {
            console.log("Customer email skipped:", emailErr);
          }
          
          return new Response(JSON.stringify({ 
            matched: true, 
            reason: "agency_driver_assigned",
            driverAssigned: true,
            driverName: driver.name,
            driverRegion: driver.region,
            adminNotified: true,
            customerEmailSent: true,
            cashAmountSet: reservation.payment_type === 'cash'
          }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      console.log("🏢 Agency reservation - no driver matched, manual assignment required");
      
      // Even without driver match, still send admin notification for agency reservation
      try {
        await supabase.functions.invoke('notify-admin-new-reservation', {
          body: { 
            reservation_id,
            customer_name: reservation.customer_name,
            pickup: reservation.pickup,
            dropoff: reservation.dropoff,
            pickup_date: reservation.pickup_date,
            pickup_time: reservation.pickup_time,
            vehicle_type: reservation.vehicle_type,
            customer_phone: reservation.customer_phone
          }
        });
        console.log("✅ Admin notification sent (no driver match)");
      } catch (adminNotifyErr) {
        console.log("Admin notification skipped:", adminNotifyErr);
      }
      
      // Send confirmation email to customer
      try {
        if (reservation.customer_id) {
          await supabase.functions.invoke('send-confirmation-email', {
            body: { reservation_id, lang: 'tr' }
          });
          console.log("✅ Customer confirmation email sent (no driver match)");
        }
      } catch (emailErr) {
        console.log("Customer email skipped:", emailErr);
      }
      
      return new Response(JSON.stringify({ 
        matched: false, 
        reason: "agency_no_driver_match",
        adminNotified: true,
        customerEmailSent: true,
        cashAmountSet: reservation.payment_type === 'cash'
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Analyze transfer using shared module
    const transferInfo = analyzeTransfer(reservation.pickup, reservation.dropoff);
    logAnalysis('reservation', reservation_id, reservation.pickup, reservation.dropoff, transferInfo);

    const { airport, city, district, direction, confidence } = transferInfo;

    if (!city && !airport) {
      console.log("❌ No city or airport matched - manual pricing required");
      // Send email to admin for manual pricing
      await sendManualPriceRequestEmail(reservation, transferInfo);
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
      airport.includes('Bursa') ? 'Bursa' :
      null
    ) : null;
    
    const nonAirportCity = direction === 'to_airport' ? pickupCity : 
                           direction === 'from_airport' ? dropoffCity : null;
    
    // Intercity conditions:
    // 1. city_to_city with different cities
    // 2. to_airport/from_airport where non-airport city is different from airport's city
    const isIntercity = (
      (direction === 'city_to_city' && pickupCity && dropoffCity && pickupCity !== dropoffCity) ||
      (airport && nonAirportCity && airportCity && nonAirportCity !== airportCity)
    );
    
    // For intercity airport transfers, we need to know both cities
    const intercityFromCity = direction === 'to_airport' ? pickupCity : 
                              direction === 'from_airport' ? airportCity : pickupCity;
    const intercityToCity = direction === 'to_airport' ? airportCity : 
                            direction === 'from_airport' ? dropoffCity : dropoffCity;
    const intercityFromDistrict = direction === 'to_airport' ? pickupDistrict : 
                                  direction === 'from_airport' ? airport : pickupDistrict;
    const intercityToDistrict = direction === 'to_airport' ? airport : 
                                direction === 'from_airport' ? dropoffDistrict : dropoffDistrict;

    console.log("🔍 Route type:", isIntercity ? "intercity" : "airport transfer", { 
      pickupCity, pickupDistrict, dropoffCity, dropoffDistrict, 
      airportCity, nonAirportCity, intercityFromCity, intercityToCity 
    });

    // Get vehicle fallback list for flexible matching
    const vehicleFallbacks = getVehicleFallbackList(reservation.vehicle_type);
    console.log(`🚗 Vehicle requested: ${reservation.vehicle_type}, Fallbacks: ${vehicleFallbacks.join(', ')}`);

    // Query for matching price - bidirectional (airport->address OR address->airport same price)
    let bestPrice: any = null;
    let matchType = '';
    
    // Get pickup_date for seasonal pricing
    const pickupDate = reservation.pickup_date;
    console.log(`📅 Pickup date for seasonal pricing: ${pickupDate}`);
    
    // Helper function to select best price (seasonal > base > first available)
    const selectBestPrice = (data: any[] | null, matchDesc: string): boolean => {
      if (!data || data.length === 0) return false;
      
      // Try to find seasonal price matching the pickup date
      if (pickupDate) {
        const seasonalPrice = data.find(p => 
          p.valid_from && p.valid_to && pickupDate >= p.valid_from && pickupDate <= p.valid_to
        );
        if (seasonalPrice) {
          bestPrice = seasonalPrice;
          matchType = `${matchDesc} [SEASONAL: ${seasonalPrice.valid_from} to ${seasonalPrice.valid_to}]`;
          console.log(`🌴 Seasonal price found: ${seasonalPrice.price} ${seasonalPrice.price_currency}`);
          return true;
        }
      }
      
      // Fallback to base price (no valid_from/valid_to)
      const basePrice = data.find(p => !p.valid_from && !p.valid_to);
      if (basePrice) {
        bestPrice = basePrice;
        matchType = `${matchDesc} [BASE]`;
        console.log(`📦 Base price found: ${basePrice.price} ${basePrice.price_currency}`);
        return true;
      }
      
      // Fallback to first available
      bestPrice = data[0];
      matchType = matchDesc;
      console.log(`✅ Price found: ${bestPrice.price} ${bestPrice.price_currency}`);
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

          if (selectBestPrice(exactIntercityData, `intercity exact (${intercityFromCity}/${intercityFromDistrict} → ${intercityToCity}/${intercityToDistrict}) [${vehicleType}]`)) {
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

          if (selectBestPrice(partialData, `intercity partial (${cityWithDistrict}/${districtToMatch} → ${cityWithoutDistrict}) [${vehicleType}]`)) {
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

          if (selectBestPrice(intercityData, `intercity city-only (${intercityFromCity} → ${intercityToCity}) [${vehicleType}]`)) {
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

        if (selectBestPrice(exactMatch, `exact (${airport} → ${city}/${district}) [${vehicleType}]`)) {
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

        if (selectBestPrice(cityMatch, `city+airport (${airport} → ${city}) [${vehicleType}]`)) {
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

        if (selectBestPrice(cityDistrictMatch, `city+district (${city}/${district}) [${vehicleType}]`)) {
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

        if (selectBestPrice(airportOnlyMatch, `airport-only (${airport}) [${vehicleType}]`)) {
          break;
        }
      }
    }



    if (!bestPrice) {
      console.log("❌ No price found for this route after trying all vehicle fallbacks");
      console.log(`   Searched: Airport=${airport}, City=${city}, District=${district}, Vehicles=${vehicleFallbacks.join(', ')}`);
      // Send email to admin for manual pricing
      await sendManualPriceRequestEmail(reservation, transferInfo);
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
      reservation.vehicle_type, // Vehicle type for accurate minimums
      airport // Airport for airport-city route checks
    );

    // Log sanity check result
    logPriceSanityCheck('reservation', reservation_id, sanityCheck);

    if (!sanityCheck.isValid) {
      console.log(`⚠️ Price sanity check FAILED: ${sanityCheck.reason}`);
      console.log(`   Route: ${sanityCheck.routeKey || 'N/A'}`);
      console.log(`   Price: ${sanityCheck.actualPrice}€, Min Expected: ${sanityCheck.minimumExpected}€`);
      console.log(`   Vehicle: ${sanityCheck.vehicleType}, Confidence: ${sanityCheck.confidence}`);
      
      // Send email to admin for manual pricing with reason
      await sendManualPriceRequestEmail(reservation, transferInfo, sanityCheck.reason);
      
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
    // Price in region_prices is base price (EUR)
    const basePriceCurrency = bestPrice.price_currency || 'EUR';
    const customerRequestedCurrency = reservation.price_currency || basePriceCurrency;
    
    // Detect region to check if discount is disabled
    const detectedRegion = detectRegion(reservation.pickup, reservation.dropoff);
    console.log(`🌍 Detected region for discount check: ${detectedRegion}`);
    
    // Calculate final price with discount (region check disables discount for Dubai/Switzerland)
    const hasReturnTrip = reservation.is_return_transfer || false;
    const discountInfo = calculateDiscount(
      bestPrice.price,
      hasReturnTrip,
      reservation.promo_code,
      detectedRegion // Pass region to disable discounts for Dubai/Switzerland
    );

    let finalPrice = discountInfo.price;
    let finalCurrency = basePriceCurrency;
    let exchangeRate = 1;

    // Convert to customer's requested currency if different
    if (customerRequestedCurrency !== basePriceCurrency) {
      const conversion = await convertCurrency(discountInfo.price, basePriceCurrency, customerRequestedCurrency);
      finalPrice = conversion.amount;
      finalCurrency = customerRequestedCurrency;
      exchangeRate = conversion.rate;
      console.log(`💱 Currency converted: ${discountInfo.price} ${basePriceCurrency} → ${finalPrice} ${finalCurrency} (rate: ${exchangeRate})`);
    }

    const discountApplied = discountInfo.discountApplied;

    // ============================================
    // AUTO DRIVER ASSIGNMENT BASED ON CITY/REGION
    // ============================================
    let autoAssignedDriver: { id: string; name: string; user_id: string; phone: string; plate_number: string | null } | null = null;
    
    // Determine which city to use for driver matching
    const driverMatchCity = city || pickupCity || dropoffCity || airportCity;
    
    if (driverMatchCity) {
      console.log(`🚗 Attempting auto-driver assignment for region: ${driverMatchCity}`);
      
      // Map city names to driver regions (normalize variations)
      const cityToRegionMap: Record<string, string[]> = {
        'Istanbul': ['Istanbul', 'İstanbul', 'istanbul', 'İSTANBUL'],
        'İstanbul': ['Istanbul', 'İstanbul', 'istanbul', 'İSTANBUL'],
        'Antalya': ['Antalya', 'antalya', 'ANTALYA'],
        'Alanya': ['Antalya', 'antalya', 'ANTALYA'], // Alanya is in Antalya region
        'Kemer': ['Antalya', 'antalya', 'ANTALYA'], // Kemer is in Antalya region
        'Belek': ['Antalya', 'antalya', 'ANTALYA'], // Belek is in Antalya region
        'Side': ['Antalya', 'antalya', 'ANTALYA'], // Side is in Antalya region
        'Manavgat': ['Antalya', 'antalya', 'ANTALYA'], // Manavgat is in Antalya region
        'Kas': ['Antalya', 'antalya', 'ANTALYA'], // Kaş is in Antalya region
        'Izmir': ['Izmir', 'İzmir', 'izmir', 'İZMİR'],
        'İzmir': ['Izmir', 'İzmir', 'izmir', 'İZMİR'],
        'Cesme': ['Izmir', 'İzmir', 'izmir', 'İZMİR'], // Çeşme is in İzmir region
        'Kusadasi': ['Izmir', 'İzmir', 'izmir', 'İZMİR'], // Kuşadası is in İzmir region
        'Bodrum': ['Bodrum', 'bodrum', 'BODRUM', 'Mugla', 'Muğla'],
        'Dalaman': ['Dalaman', 'dalaman', 'DALAMAN', 'Mugla', 'Muğla'],
        'Fethiye': ['Fethiye', 'fethiye', 'FETHIYE', 'Dalaman', 'Mugla', 'Muğla'],
        'Marmaris': ['Dalaman', 'dalaman', 'DALAMAN', 'Mugla', 'Muğla'], // Marmaris uses Dalaman
        'Cappadocia': ['Cappadocia', 'Kapadokya', 'Nevsehir', 'Nevşehir', 'Kayseri'],
        'Goreme': ['Cappadocia', 'Kapadokya', 'Nevsehir', 'Nevşehir', 'Kayseri'], // Göreme is in Cappadocia
        'Urgup': ['Cappadocia', 'Kapadokya', 'Nevsehir', 'Nevşehir', 'Kayseri'], // Ürgüp is in Cappadocia
        'Dubai': ['Dubai', 'dubai', 'DUBAI', 'UAE'],
        'Abu Dhabi': ['Abu Dhabi', 'abu dhabi', 'ABU DHABI', 'UAE'],
        'Cyprus': ['Cyprus', 'Kıbrıs', 'KKTC', 'Larnaca', 'Paphos', 'Ercan'],
        'Bursa': ['Bursa', 'bursa', 'BURSA'],
      };
      
      // Get possible region values for this city
      const possibleRegions = cityToRegionMap[driverMatchCity] || [driverMatchCity];
      
      // Find an active driver with matching region
      // Priority: exact region match, then any active driver if no region match
      const { data: matchingDrivers } = await supabase
        .from('drivers')
        .select('id, name, user_id, phone, plate_number, region')
        .eq('active', true)
        .in('region', possibleRegions)
        .limit(5);
      
      if (matchingDrivers && matchingDrivers.length > 0) {
        // Select the first available driver (could be enhanced with load balancing)
        autoAssignedDriver = matchingDrivers[0];
        console.log(`✅ Auto-assigning driver: ${autoAssignedDriver.name} (region: ${matchingDrivers[0].region})`);
      } else {
        console.log(`⚠️ No active driver found for region: ${driverMatchCity} - manual assignment required`);
      }
    }

    // Update reservation with price and optionally driver
    const updateData: Record<string, any> = {
      price: finalPrice,
      price_currency: finalCurrency,
      status: autoAssignedDriver ? 'sent_to_driver' : 'waiting_for_customer_approval',
      discount_percentage: discountApplied ? discountInfo.discountPercent : null,
    };
    
    if (autoAssignedDriver) {
      updateData.driver_id = autoAssignedDriver.id;
      updateData.driver_user_id = autoAssignedDriver.user_id;
    }
    
    const { error: updateError } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", reservation_id);

    if (updateError) {
      console.error("❌ Failed to update reservation:", updateError);
      throw updateError;
    }

    // Record price history
    const priceHistoryNote = autoAssignedDriver 
      ? `Otomatik fiyat + Şoför: ${autoAssignedDriver.name}`
      : discountApplied 
        ? `Otomatik fiyat + %${discountInfo.discountPercent} indirim` 
        : `Otomatik fiyat: ${city || 'N/A'} - ${district || 'N/A'} (${airport || 'N/A'})${exchangeRate !== 1 ? ` [Kur: ${exchangeRate.toFixed(2)}]` : ''}`;
    
    await supabase.from("price_history").insert({
      reservation_id: reservation_id,
      price: finalPrice,
      price_currency: finalCurrency,
      action: autoAssignedDriver ? 'auto_priced_with_driver' : 'auto_priced',
      customer_note: priceHistoryNote,
    });

    console.log(`✅ Auto-priced reservation: ${finalPrice} ${finalCurrency}`);

    // Send email notification to admin
    const adminEmail = "sautkahraman@gmail.com";
    try {
      await resend.emails.send({
        from: "Meet Transfer <noreply@mail.meettransfer.app>",
        to: adminEmail,
        subject: `🤖 Otomatik Fiyat: ${reservation.customer_name} - ${finalPrice} ${finalCurrency}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🤖 Otomatik Fiyat Verildi</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #10b981;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Müşteri Bilgileri</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Müşteri:</strong> ${reservation.customer_name}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Telefon:</strong> ${reservation.customer_phone}</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Transfer Detayları</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Alış:</strong> ${reservation.pickup}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Bırakış:</strong> ${reservation.dropoff}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Tarih:</strong> ${reservation.pickup_date}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Saat:</strong> ${reservation.pickup_time}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Araç:</strong> ${reservation.vehicle_type}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Yön:</strong> ${direction} (${confidence})</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Eşleştirme Bilgisi</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Şehir:</strong> ${city || 'N/A'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>İlçe:</strong> ${district || 'N/A'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Havalimanı:</strong> ${airport || 'N/A'}</p>
              </div>
              
              <div style="text-align: center; margin: 20px 0; padding: 20px; background: #10b981; border-radius: 8px;">
                <p style="font-size: 14px; color: white; margin-bottom: 5px;">Otomatik Fiyat</p>
                ${exchangeRate !== 1 ? `<p style="font-size: 14px; color: #d1fae5; margin-bottom: 5px;">Baz Fiyat: ${discountInfo.price} ${basePriceCurrency}</p>` : ''}
                <p style="font-size: 32px; font-weight: bold; color: white; margin: 0;">
                  ${finalPrice} ${finalCurrency}
                </p>
                ${exchangeRate !== 1 ? `<p style="color: #d1fae5; font-size: 14px; margin-top: 5px;">💱 Kur: 1 ${basePriceCurrency} = ${exchangeRate.toFixed(2)} ${finalCurrency}</p>` : ''}
                ${discountApplied ? `<p style="color: #d1fae5; font-size: 14px; margin-top: 5px;">🎫 %${discountInfo.discountPercent} İndirim Uygulandı</p>` : ''}
              </div>
              
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                Bu bildirim otomatik fiyat sistemi tarafından gönderilmiştir.<br>
                <strong>Not:</strong> Havalimanı ↔ Adres transferleri aynı fiyattır.
                ${autoAssignedDriver ? `<br><strong style="color: #10b981;">🚗 Şoför Otomatik Atandı: ${autoAssignedDriver.name}</strong>` : ''}
              </p>
            </div>
          </div>
        `,
      });
      console.log("📧 Admin notification email sent");
    } catch (adminEmailError) {
      console.error("Failed to send admin notification email:", adminEmailError);
    }

    // ============================================
    // SEND DRIVER NOTIFICATION IF AUTO-ASSIGNED
    // ============================================
    if (autoAssignedDriver) {
      try {
        // Get driver's email
        const { data: driverUserData } = await supabase.auth.admin.getUserById(autoAssignedDriver.user_id);
        const driverEmail = driverUserData?.user?.email;
        
        if (driverEmail) {
          await resend.emails.send({
            from: "Meet Transfer <noreply@mail.meettransfer.app>",
            to: driverEmail,
            subject: `🚗 Yeni Transfer Görevi: ${reservation.pickup_date} ${reservation.pickup_time}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🚗 Yeni Transfer Görevi</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
                  <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Müşteri Bilgileri</h3>
                    <p style="margin: 5px 0; color: #666;"><strong>Ad:</strong> ${reservation.customer_name}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Telefon:</strong> ${reservation.customer_phone}</p>
                  </div>
                  
                  <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #10b981;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Transfer Detayları</h3>
                    <p style="margin: 5px 0; color: #666;"><strong>📅 Tarih:</strong> ${reservation.pickup_date}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>🕐 Saat:</strong> ${reservation.pickup_time}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>📍 Alış:</strong> ${reservation.pickup}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>🏁 Bırakış:</strong> ${reservation.dropoff}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>🚗 Araç:</strong> ${reservation.vehicle_type}</p>
                    ${reservation.flight_number ? `<p style="margin: 5px 0; color: #666;"><strong>✈️ Uçuş:</strong> ${reservation.flight_number}</p>` : ''}
                  </div>
                  
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="https://meettransfer.lovable.app/driver" 
                       style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; 
                              border-radius: 8px; text-decoration: none; font-weight: 600;">
                      Görevi Görüntüle
                    </a>
                  </div>
                  
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    Bu görev otomatik olarak size atanmıştır.
                  </p>
                </div>
              </div>
            `,
          });
          console.log(`📧 Driver notification email sent to ${driverEmail}`);
        }
        
        // Also create in-app notification for driver
        await supabase.from('notifications').insert({
          user_id: autoAssignedDriver.user_id,
          title: 'Yeni Transfer Görevi',
          message: `${reservation.pickup_date} ${reservation.pickup_time} - ${reservation.pickup} → ${reservation.dropoff}`,
          type: 'driver_assignment',
          reservation_id: reservation_id,
        });
        console.log(`🔔 In-app notification created for driver`);
        
      } catch (driverNotifyError) {
        console.error("Failed to notify driver:", driverNotifyError);
      }
    }

    // Get customer email for notification
    let customerEmail = null;
    if (reservation.customer_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(reservation.customer_id);
      customerEmail = userData?.user?.email;
    }

    // Send email notification if customer has email
    if (customerEmail && resend) {
      const siteUrl = Deno.env.get("SITE_URL") || "https://meet-transfer.com";
      
      try {
        await resend.emails.send({
          from: "Meet Transfer <noreply@mail.meettransfer.app>",
          to: customerEmail,
          subject: `Fiyat Teklifi: ${finalPrice} ${finalCurrency} - Meet Transfer`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Meet Transfer</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Premium Transfer Hizmeti</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Fiyat Teklifiniz Hazır!</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                  <p style="margin: 5px 0; color: #666;"><strong>Alış:</strong> ${reservation.pickup}</p>
                  <p style="margin: 5px 0; color: #666;"><strong>Bırakış:</strong> ${reservation.dropoff}</p>
                  <p style="margin: 5px 0; color: #666;"><strong>Tarih:</strong> ${reservation.pickup_date}</p>
                  <p style="margin: 5px 0; color: #666;"><strong>Saat:</strong> ${reservation.pickup_time}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <p style="font-size: 14px; color: #666; margin-bottom: 5px;">Toplam Fiyat</p>
                  <p style="font-size: 36px; font-weight: bold; color: #667eea; margin: 0;">
                    ${finalPrice} ${finalCurrency}
                  </p>
                  ${discountApplied ? `<p style="color: #28a745; font-size: 14px; margin-top: 5px;">🎫 %${discountInfo.discountPercent} İndirim Uygulandı!</p>` : ''}
                </div>
                
                <div style="text-align: center;">
                  <a href="${siteUrl}/customer/bookings" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; 
                            font-weight: bold; font-size: 16px;">
                    Rezervasyonu Görüntüle
                  </a>
                </div>
                
                <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                  Sorularınız için WhatsApp: +1 (555) 805-1101
                </p>
              </div>
            </div>
          `,
        });
        console.log("📧 Price notification email sent to customer");
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        matched: true,
        price: finalPrice,
        currency: finalCurrency,
        baseCurrency: basePriceCurrency,
        exchangeRate: exchangeRate !== 1 ? exchangeRate : null,
        discount_applied: discountApplied,
        matchedCity: city,
        matchedDistrict: district,
        matchedAirport: airport,
        direction,
        confidence,
        bidirectional: true, // Airport transfers are same price both ways
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("❌ Error in auto-price-reservation:", error);
    return new Response(
      JSON.stringify({ error: error.message, matched: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
