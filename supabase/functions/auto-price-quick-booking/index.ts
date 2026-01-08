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
import { getVehicleFallbackList, getVehicleLabel } from "../_shared/vehicleConfig.ts";
import { convertCurrency, getCurrencySymbol } from "../_shared/currencyUtils.ts";
import { autoPriceSuccessEmail, manualPriceRequiredEmail, generateCustomerPriceQuoteEmail } from "../_shared/emailTemplates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutoPriceRequest {
  quick_booking_id: string;
}

// Send admin notification for manual pricing
async function sendManualPriceRequestEmail(
  booking: any,
  transferInfo: any,
  reason?: string
): Promise<void> {
  const adminEmail = "sautkahraman@gmail.com";
  
  try {
    const emailHtml = manualPriceRequiredEmail(
      booking,
      {
        airport: transferInfo.airport,
        city: transferInfo.city,
        district: transferInfo.district,
        direction: transferInfo.direction,
        confidence: transferInfo.confidence,
        additionalReason: reason,
      },
      'quick_booking'
    );

      await resend.emails.send({
        from: "Meet Transfer <info@meettransfer.app>",
        to: adminEmail,
        subject: `⚠️ Quick Booking Manuel Fiyat Gerekli: ${booking.customer_name || 'Misafir'}`,
      html: emailHtml,
    });
    console.log("📧 Manual price request email sent to admin for quick booking");
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

    const { quick_booking_id }: AutoPriceRequest = await req.json();

    console.log("🚗 Auto-pricing started for quick booking:", quick_booking_id);

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from("quick_booking_requests")
      .select("*")
      .eq("id", quick_booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("❌ Booking not found:", bookingError);
      return new Response(JSON.stringify({ error: "Booking not found", matched: false }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Skip if agency booking (agencies get manual pricing)
    if (booking.agency_id || booking.agency_user_id) {
      console.log("🏢 Agency booking - skipping auto-price");
      return new Response(JSON.stringify({ matched: false, reason: "agency_booking" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Analyze transfer using shared module
    const transferInfo = analyzeTransfer(booking.pickup, booking.dropoff);
    logAnalysis('quick_booking', quick_booking_id, booking.pickup, booking.dropoff, transferInfo);

    const { airport, city, district, direction, confidence } = transferInfo;

    if (!city && !airport) {
      console.log("❌ No city or airport matched - manual pricing required");
      // Send email to admin for manual pricing
      await sendManualPriceRequestEmail(booking, transferInfo);
      return new Response(JSON.stringify({ matched: false, reason: "no_location_match" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if this is a city-to-city transfer (no airport involved)
    const pickupCity = transferInfo.pickupAnalysis.city?.value || transferInfo.pickupAnalysis.district?.city || null;
    const dropoffCity = transferInfo.dropoffAnalysis.city?.value || transferInfo.dropoffAnalysis.district?.city || null;
    const pickupDistrict = transferInfo.pickupAnalysis.district?.value || null;
    const dropoffDistrict = transferInfo.dropoffAnalysis.district?.value || null;
    const isIntercity = direction === 'city_to_city' && pickupCity && dropoffCity && pickupCity !== dropoffCity;

    console.log("🔍 Route type:", isIntercity ? "intercity" : "airport transfer", { pickupCity, pickupDistrict, dropoffCity, dropoffDistrict });

    // Get vehicle fallback list for flexible matching
    const vehicleFallbacks = getVehicleFallbackList(booking.vehicle_type);
    console.log(`🚗 Vehicle requested: ${booking.vehicle_type}, Fallbacks: ${vehicleFallbacks.join(', ')}`);

    // Query for matching price - bidirectional (airport->address OR address->airport same price)
    let bestPrice = null;
    let matchType = '';

    // Try each vehicle type in fallback order
    for (const vehicleType of vehicleFallbacks) {
      if (bestPrice) break;
      
      // 0. For intercity routes, first check intercity_prices table
      if (isIntercity && pickupCity && dropoffCity) {
        // Try exact district match first (both directions)
        if (pickupDistrict && dropoffDistrict) {
          const { data: exactIntercityData } = await supabase
            .from("intercity_prices")
            .select("*")
            .eq("vehicle_type", vehicleType)
            .eq("is_active", true)
            .or(`and(from_city.eq.${pickupCity},from_district.eq.${pickupDistrict},to_city.eq.${dropoffCity},to_district.eq.${dropoffDistrict}),and(from_city.eq.${dropoffCity},from_district.eq.${dropoffDistrict},to_city.eq.${pickupCity},to_district.eq.${pickupDistrict})`)
            .limit(1);

          if (exactIntercityData && exactIntercityData.length > 0) {
            bestPrice = exactIntercityData[0];
            matchType = `intercity exact (${pickupCity}/${pickupDistrict} → ${dropoffCity}/${dropoffDistrict}) [${vehicleType}]`;
            console.log(`✅ Intercity exact price found with ${vehicleType}:`, bestPrice.price, bestPrice.price_currency);
          }
        }
        
        // Try city-only match (no district specified in price)
        if (!bestPrice) {
          const { data: intercityData } = await supabase
            .from("intercity_prices")
            .select("*")
            .eq("vehicle_type", vehicleType)
            .eq("is_active", true)
            .is("from_district", null)
            .is("to_district", null)
            .or(`and(from_city.eq.${pickupCity},to_city.eq.${dropoffCity}),and(from_city.eq.${dropoffCity},to_city.eq.${pickupCity})`)
            .limit(1);

          if (intercityData && intercityData.length > 0) {
            bestPrice = intercityData[0];
            matchType = `intercity city-only (${pickupCity} → ${dropoffCity}) [${vehicleType}]`;
            console.log(`✅ Intercity city price found with ${vehicleType}:`, bestPrice.price, bestPrice.price_currency);
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
          .eq("is_active", true)
          .limit(1);

        if (exactMatch && exactMatch.length > 0) {
          bestPrice = exactMatch[0];
          matchType = `exact (${airport} → ${city}/${district}) [${vehicleType}]`;
          console.log(`✅ Exact match found with ${vehicleType}:`, bestPrice.price, bestPrice.price_currency);
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
          .eq("is_active", true)
          .order("price", { ascending: true })
          .limit(1);

        if (cityMatch && cityMatch.length > 0) {
          bestPrice = cityMatch[0];
          matchType = `city+airport (${airport} → ${city}) [${vehicleType}]`;
          console.log(`✅ City+Airport match found with ${vehicleType}:`, bestPrice.price, bestPrice.price_currency);
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
          .eq("is_active", true)
          .limit(1);

        if (cityDistrictMatch && cityDistrictMatch.length > 0) {
          bestPrice = cityDistrictMatch[0];
          matchType = `city+district (${city}/${district}) [${vehicleType}]`;
          console.log(`✅ City+District match found with ${vehicleType}:`, bestPrice.price, bestPrice.price_currency);
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
          .eq("is_active", true)
          .order("price", { ascending: true })
          .limit(1);

        if (airportOnlyMatch && airportOnlyMatch.length > 0) {
          bestPrice = airportOnlyMatch[0];
          matchType = `airport-only (${airport}) [${vehicleType}]`;
          console.log(`✅ Airport-only match found with ${vehicleType}:`, bestPrice.price, bestPrice.price_currency);
        }
      }
    }

    if (!bestPrice) {
      console.log("❌ No price found for this route after trying all vehicle fallbacks");
      console.log(`   Searched: Airport=${airport}, City=${city}, District=${district}, Vehicles=${vehicleFallbacks.join(', ')}`);
      // Send email to admin for manual pricing
      await sendManualPriceRequestEmail(booking, transferInfo);
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
      booking.vehicle_type, // Vehicle type for accurate minimums
      airport // Airport for airport-city route checks
    );

    // Log sanity check result
    logPriceSanityCheck('quick_booking', quick_booking_id, sanityCheck);

    if (!sanityCheck.isValid) {
      console.log(`⚠️ Price sanity check FAILED: ${sanityCheck.reason}`);
      console.log(`   Route: ${sanityCheck.routeKey || 'N/A'}`);
      console.log(`   Price: ${sanityCheck.actualPrice}€, Min Expected: ${sanityCheck.minimumExpected}€`);
      console.log(`   Vehicle: ${sanityCheck.vehicleType}, Confidence: ${sanityCheck.confidence}`);
      
      // Send email to admin for manual pricing with reason
      await sendManualPriceRequestEmail(booking, transferInfo, sanityCheck.reason);
      
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
    const basePriceCurrency = bestPrice.price_currency || 'EUR';
    const customerRequestedCurrency = booking.price_currency || basePriceCurrency;

    // Calculate price with discount
    const discountInfo = calculateDiscount(
      bestPrice.price,
      booking.has_return_trip || false,
      booking.promo_code
    );

    let finalPrice = discountInfo.price;
    let finalReturnPrice = discountInfo.returnPrice;
    let finalTotalPrice = discountInfo.totalPrice;
    let finalCurrency = basePriceCurrency;
    let exchangeRate = 1;

    // Convert to customer's requested currency if different
    if (customerRequestedCurrency !== basePriceCurrency) {
      const conversion = await convertCurrency(discountInfo.price, basePriceCurrency, customerRequestedCurrency);
      finalPrice = conversion.amount;
      exchangeRate = conversion.rate;
      finalCurrency = customerRequestedCurrency;
      
      if (discountInfo.returnPrice) {
        finalReturnPrice = Math.round(discountInfo.returnPrice * exchangeRate);
      }
      finalTotalPrice = finalPrice + (finalReturnPrice || 0);
      
      console.log(`💱 Currency converted: ${discountInfo.price} ${basePriceCurrency} → ${finalPrice} ${finalCurrency} (rate: ${exchangeRate})`);
    }

    // Update booking with price
    const { error: updateError } = await supabase
      .from("quick_booking_requests")
      .update({
        price: finalPrice,
        price_currency: finalCurrency,
        status: "price_sent",
        return_price: finalReturnPrice,
      })
      .eq("id", quick_booking_id);

    if (updateError) {
      console.error("❌ Failed to update booking:", updateError);
      throw updateError;
    }

    console.log("✅ Booking updated with price:", finalPrice, finalCurrency);

    // Record price history
    try {
      await supabase.from("price_history").insert({
        quick_booking_id: quick_booking_id,
        price: finalPrice,
        price_currency: finalCurrency,
        action: "auto_sent",
        customer_note: `Otomatik: ${city || 'N/A'} - ${district || 'N/A'} (${airport || 'N/A'}) [${confidence}]${exchangeRate !== 1 ? ` [Kur: ${exchangeRate.toFixed(2)}]` : ''}`,
      });
    } catch (e) {
      console.error("Failed to record price history:", e);
    }

    // Send email notification to admin
    const adminEmail = "sautkahraman@gmail.com";
    try {
      await resend.emails.send({
        from: "Meet Transfer <info@meettransfer.app>",
        to: adminEmail,
        subject: `🤖 Quick Booking Otomatik Fiyat: ${booking.customer_name || 'Misafir'} - ${finalTotalPrice} ${finalCurrency}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🤖 Quick Booking Otomatik Fiyat</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #10b981;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Müşteri Bilgileri</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Müşteri:</strong> ${booking.customer_name || 'Henüz girilmedi'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${booking.customer_email || 'Henüz girilmedi'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Telefon:</strong> ${booking.customer_phone || 'Henüz girilmedi'}</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Transfer Detayları</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Alış:</strong> ${booking.pickup}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Bırakış:</strong> ${booking.dropoff}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Tarih:</strong> ${booking.pickup_date}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Saat:</strong> ${booking.pickup_time}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Araç:</strong> ${booking.vehicle_type}</p>
                ${booking.has_return_trip ? `<p style="margin: 5px 0; color: #666;"><strong>Dönüş:</strong> ${booking.return_date} - ${booking.return_time}</p>` : ''}
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Eşleştirme Bilgisi</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Şehir:</strong> ${city || 'N/A'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>İlçe:</strong> ${district || 'N/A'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Havalimanı:</strong> ${airport || 'N/A'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Yön:</strong> ${direction} (${confidence})</p>
              </div>
              
              <div style="text-align: center; margin: 20px 0; padding: 20px; background: #10b981; border-radius: 8px;">
                ${exchangeRate !== 1 ? `<p style="font-size: 12px; color: #d1fae5; margin-bottom: 10px;">Baz Fiyat: ${discountInfo.price} ${basePriceCurrency} | Kur: ${exchangeRate.toFixed(2)}</p>` : ''}
                <p style="font-size: 14px; color: white; margin-bottom: 5px;">Gidiş Fiyatı</p>
                <p style="font-size: 28px; font-weight: bold; color: white; margin: 0;">
                  ${finalPrice} ${finalCurrency}
                </p>
                ${booking.has_return_trip ? `
                  <p style="font-size: 14px; color: white; margin: 10px 0 5px 0;">Dönüş Fiyatı</p>
                  <p style="font-size: 24px; font-weight: bold; color: white; margin: 0;">
                    ${finalReturnPrice} ${finalCurrency}
                    ${discountInfo.discountApplied ? `<span style="font-size: 12px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; margin-left: 8px;">%${discountInfo.discountPercent} İndirim</span>` : ''}
                  </p>
                  <div style="border-top: 1px solid rgba(255,255,255,0.3); margin-top: 15px; padding-top: 15px;">
                    <p style="font-size: 14px; color: white; margin-bottom: 5px;">Toplam</p>
                    <p style="font-size: 32px; font-weight: bold; color: white; margin: 0;">
                      ${finalTotalPrice} ${finalCurrency}
                    </p>
                  </div>
                ` : ''}
              </div>
              
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                Bu bildirim otomatik fiyat sistemi tarafından gönderilmiştir.<br>
                <strong>Not:</strong> Havalimanı ↔ Adres transferleri aynı fiyattır.
              </p>
            </div>
          </div>
        `,
      });
      console.log("📧 Admin notification email sent for quick booking");
    } catch (adminEmailError) {
      console.error("Failed to send admin notification email:", adminEmailError);
    }

    // Send email if customer email exists
    let emailSent = false;
    if (booking.customer_email) {
      try {
        const baseUrl = "https://meettransfer.app";
        const confirmUrl = `${baseUrl}/quick-booking-confirm?token=${booking.confirmation_token}`;
        
        // Get customer language preference (default to English)
        const customerLang = booking.language || 'en';
        console.log("📧 Sending email in language:", customerLang);

        const currencySymbols: Record<string, string> = {
          'EUR': '€',
          'USD': '$',
          'TRY': '₺',
          'GBP': '£',
          'AED': 'د.إ',
        };
        const currencySymbol = currencySymbols[finalCurrency] || finalCurrency;

        // Subject translations
        const subjectTranslations: Record<string, string> = {
          en: `Your Transfer Quote: ${currencySymbol}${finalPrice} - Meet Transfer`,
          tr: `Transfer Teklifiniz: ${currencySymbol}${finalPrice} - Meet Transfer`,
          de: `Ihr Transferangebot: ${currencySymbol}${finalPrice} - Meet Transfer`,
          ru: `Ваше предложение по трансферу: ${currencySymbol}${finalPrice} - Meet Transfer`,
          ar: `عرض النقل الخاص بك: ${currencySymbol}${finalPrice} - Meet Transfer`,
        };
        const emailSubject = subjectTranslations[customerLang.substring(0, 2)] || subjectTranslations.en;

        // Use the new multi-language email template
        const emailHtml = generateCustomerPriceQuoteEmail(
          {
            pickup: booking.pickup,
            dropoff: booking.dropoff,
            pickup_date: booking.pickup_date,
            pickup_time: booking.pickup_time,
            vehicle_type: booking.vehicle_type,
            has_return_trip: booking.has_return_trip,
            return_date: booking.return_date,
            return_time: booking.return_time,
          },
          {
            price: finalPrice,
            returnPrice: finalReturnPrice,
            totalPrice: finalTotalPrice,
            currency: finalCurrency,
            discountApplied: discountInfo.discountApplied,
            discountPercent: discountInfo.discountPercent,
          },
          confirmUrl,
          customerLang
        );

        const { error: emailError } = await resend.emails.send({
          from: "Meet Transfer <info@meettransfer.app>",
          to: [booking.customer_email],
          subject: emailSubject,
          html: emailHtml,
        });

        if (!emailError) {
          emailSent = true;
          console.log("📧 Auto-price email sent to:", booking.customer_email, "in language:", customerLang);
        } else {
          console.error("❌ Email send error:", emailError);
        }
      } catch (emailErr) {
        console.error("❌ Failed to send email:", emailErr);
      }
    }

    console.log("✅ Auto-pricing completed successfully");

    return new Response(
      JSON.stringify({
        matched: true,
        price: finalPrice,
        currency: finalCurrency,
        baseCurrency: basePriceCurrency,
        exchangeRate: exchangeRate !== 1 ? exchangeRate : null,
        returnPrice: finalReturnPrice,
        totalPrice: finalTotalPrice,
        discountApplied: discountInfo.discountApplied,
        emailSent,
        matchedCity: city,
        matchedDistrict: district,
        matchedAirport: airport,
        direction,
        confidence,
        bidirectional: true, // Airport transfers are same price both ways
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Auto-price error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage, matched: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
