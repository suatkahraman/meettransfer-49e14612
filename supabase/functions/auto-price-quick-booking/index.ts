import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  analyzeTransfer,
  calculateDiscount,
  logAnalysis,
} from "../_shared/priceMatching.ts";
import { getVehicleFallbackList, getVehicleLabel } from "../_shared/vehicleConfig.ts";
import { convertCurrency, getCurrencySymbol } from "../_shared/currencyUtils.ts";
import { autoPriceSuccessEmail, manualPriceRequiredEmail } from "../_shared/emailTemplates.ts";

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
  transferInfo: any
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
      },
      'quick_booking'
    );

    await resend.emails.send({
      from: "Meet Transfer <no-reply@meet-transfer.com>",
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

    // Get vehicle fallback list for flexible matching
    const vehicleFallbacks = getVehicleFallbackList(booking.vehicle_type);
    console.log(`🚗 Vehicle requested: ${booking.vehicle_type}, Fallbacks: ${vehicleFallbacks.join(', ')}`);

    // Query for matching price - bidirectional (airport->address OR address->airport same price)
    let bestPrice = null;
    let matchType = '';

    // Try each vehicle type in fallback order
    for (const vehicleType of vehicleFallbacks) {
      if (bestPrice) break;
      
      // 1. Try exact match (airport + city + district + vehicle)
      if (airport && city && district) {
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
        from: "Meet Transfer <no-reply@meet-transfer.com>",
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

        const currencySymbols: Record<string, string> = {
          'EUR': '€',
          'USD': '$',
          'TRY': '₺',
          'GBP': '£',
          'AED': 'د.إ',
        };
        const currencySymbol = currencySymbols[finalCurrency] || finalCurrency;

        const formatDate = (dateStr: string) => {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        };

        const vehicleNames: Record<string, string> = {
          'mercedes-vito': 'Mercedes Vito VIP',
          'mercedes-sprinter': 'Mercedes Sprinter VIP',
          'mercedes-maybach': 'Mercedes Maybach',
        };

        let priceHtml = `<p style="font-size: 28px; color: #1e3a8a; font-weight: bold; margin: 10px 0;">${currencySymbol}${finalPrice}</p>`;
        
        if (booking.has_return_trip && finalReturnPrice) {
          priceHtml += `
            <p style="margin-top: 15px; color: #666;">Return Transfer (${formatDate(booking.return_date)} - ${booking.return_time}):</p>
            ${discountInfo.discountApplied 
              ? `<p style="font-size: 20px; color: #22c55e; font-weight: bold;"><span style="text-decoration: line-through; color: #999;">${currencySymbol}${finalPrice}</span> ${currencySymbol}${finalReturnPrice} <span style="font-size: 12px; background: #dcfce7; padding: 2px 8px; border-radius: 4px;">${discountInfo.discountPercent}% OFF</span></p>`
              : `<p style="font-size: 20px; color: #1e3a8a; font-weight: bold;">${currencySymbol}${finalReturnPrice}</p>`
            }
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #1e3a8a;">
              <p style="color: #666;">Total Price:</p>
              <p style="font-size: 28px; color: #1e3a8a; font-weight: bold;">${currencySymbol}${finalTotalPrice}</p>
            </div>
          `;
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">Meet Transfer</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 16px;">Your Price Quote is Ready!</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <h2 style="color: #1e3a8a; margin-top: 0; font-size: 20px;">Transfer Details</h2>
              
              <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <div style="margin-bottom: 12px;">
                  <span style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Pickup</span>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #0f172a;">${booking.pickup}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <span style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Dropoff</span>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #0f172a;">${booking.dropoff}</p>
                </div>
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                  <div>
                    <span style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date</span>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #0f172a; font-weight: 600;">${formatDate(booking.pickup_date)}</p>
                  </div>
                  <div>
                    <span style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Time</span>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #0f172a; font-weight: 600;">${booking.pickup_time}</p>
                  </div>
                  <div>
                    <span style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Vehicle</span>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #0f172a; font-weight: 600;">${vehicleNames[booking.vehicle_type] || booking.vehicle_type}</p>
                  </div>
                </div>
              </div>
              
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 25px; border: 1px solid #93c5fd;">
                <p style="margin: 0; color: #1e3a8a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Outbound Transfer:</p>
                ${priceHtml}
              </div>
              
              <div style="text-align: center;">
                <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);">Confirm Price</a>
              </div>
              
              <p style="margin-top: 25px; font-size: 13px; color: #64748b; text-align: center;">
                ⏰ This quote is valid for 24 hours
              </p>
              
              <p style="margin-top: 10px; font-size: 12px; color: #94a3b8; text-align: center;">
                ↔️ Airport transfers are the same price in both directions
              </p>
              
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="color: #64748b; font-size: 13px; margin: 0;">Questions? Contact us via WhatsApp</p>
                <a href="https://wa.me/905332459932" style="color: #22c55e; font-weight: 600; text-decoration: none;">+90 533 245 99 32</a>
              </div>
            </div>
          </body>
          </html>
        `;

        const { error: emailError } = await resend.emails.send({
          from: "Meet Transfer <no-reply@meettransfer.app>",
          to: [booking.customer_email],
          subject: `Your Transfer Quote: ${currencySymbol}${finalPrice} - Meet Transfer`,
          html: emailHtml,
        });

        if (!emailError) {
          emailSent = true;
          console.log("📧 Auto-price email sent to:", booking.customer_email);
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
