import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  analyzeTransfer,
  calculateDiscount,
  logAnalysis,
  VALID_PROMO_CODES,
} from "../_shared/priceMatching.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutoPriceRequest {
  reservation_id: string;
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
    'EUR': { 'USD': 1.08, 'TRY': 37.5, 'GBP': 0.85, 'AED': 3.97 },
    'USD': { 'EUR': 0.93, 'TRY': 34.5, 'GBP': 0.79, 'AED': 3.67 },
    'TRY': { 'EUR': 0.027, 'USD': 0.029, 'GBP': 0.023, 'AED': 0.11 },
  };

  const rate = fallbackRates[fromCurrency]?.[toCurrency] || 1;
  return { amount: Math.round(amount * rate), rate };
}

// Send admin notification for manual pricing
async function sendManualPriceRequestEmail(
  reservation: any,
  transferInfo: any
): Promise<void> {
  const adminEmail = "sautkahraman@gmail.com";
  
  try {
    await resend.emails.send({
      from: "Meet Transfer <no-reply@meet-transfer.com>",
      to: adminEmail,
      subject: `⚠️ Manuel Fiyat Gerekli: ${reservation.customer_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Manuel Fiyat Gerekli</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Otomatik fiyat eşleştirilemedi</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
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
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ef4444;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Eşleşme Sonucu</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Bulunan Havalimanı:</strong> ${transferInfo.airport || 'Bulunamadı'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Bulunan Şehir:</strong> ${transferInfo.city || 'Bulunamadı'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Bulunan İlçe:</strong> ${transferInfo.district || 'Bulunamadı'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Yön:</strong> ${transferInfo.direction}</p>
            </div>
            
            <div style="text-align: center; margin: 20px 0; padding: 20px; background: #fef3c7; border-radius: 8px; border: 2px solid #f59e0b;">
              <p style="font-size: 16px; color: #92400e; margin: 0; font-weight: bold;">
                🔧 Lütfen admin panelinden manuel fiyat girin
              </p>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              Bu bildirim otomatik fiyat sistemi tarafından gönderilmiştir.
            </p>
          </div>
        </div>
      `,
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

    const { reservation_id }: AutoPriceRequest = await req.json();

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

    // Skip if agency reservation (agencies get manual pricing)
    if (reservation.agency_id || reservation.agency_user_id) {
      console.log("🏢 Agency reservation - skipping auto-price");
      return new Response(JSON.stringify({ matched: false, reason: "agency_reservation" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Skip if already has a price
    if (reservation.price && reservation.price > 0) {
      console.log("💰 Reservation already has price - skipping");
      return new Response(JSON.stringify({ matched: false, reason: "already_priced" }), {
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

    // Query for matching price - bidirectional (airport->address OR address->airport same price)
    let bestPrice = null;

    // 1. Try exact match (airport + city + district + vehicle)
    if (airport && city && district) {
      const { data: exactMatch } = await supabase
        .from("region_prices")
        .select("*")
        .eq("city", city)
        .eq("airport", airport)
        .eq("district", district)
        .eq("vehicle_type", reservation.vehicle_type)
        .eq("is_active", true)
        .limit(1);

      if (exactMatch && exactMatch.length > 0) {
        bestPrice = exactMatch[0];
        console.log("✅ Exact match found:", bestPrice);
      }
    }

    // 2. Try airport + city match
    if (!bestPrice && airport && city) {
      const { data: cityMatch } = await supabase
        .from("region_prices")
        .select("*")
        .eq("city", city)
        .eq("airport", airport)
        .eq("vehicle_type", reservation.vehicle_type)
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(1);

      if (cityMatch && cityMatch.length > 0) {
        bestPrice = cityMatch[0];
        console.log("✅ City+Airport match found:", bestPrice);
      }
    }

    // 3. Try city only match
    if (!bestPrice && city) {
      const { data: cityOnlyMatch } = await supabase
        .from("region_prices")
        .select("*")
        .eq("city", city)
        .eq("vehicle_type", reservation.vehicle_type)
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(1);

      if (cityOnlyMatch && cityOnlyMatch.length > 0) {
        bestPrice = cityOnlyMatch[0];
        console.log("✅ City-only match found:", bestPrice);
      }
    }

    if (!bestPrice) {
      console.log("❌ No price found for this route - sending manual price request to admin");
      // Send email to admin for manual pricing
      await sendManualPriceRequestEmail(reservation, transferInfo);
      return new Response(JSON.stringify({ matched: false, reason: "no_price_found" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Admin enters price in EUR - check if customer requested different currency
    // Price in region_prices is base price (EUR)
    const basePriceCurrency = bestPrice.price_currency || 'EUR';
    const customerRequestedCurrency = reservation.price_currency || basePriceCurrency;
    
    // Calculate final price with discount
    const hasReturnTrip = reservation.is_return_transfer || false;
    const discountInfo = calculateDiscount(
      bestPrice.price,
      hasReturnTrip,
      reservation.promo_code
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

    // Update reservation with price
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        price: finalPrice,
        price_currency: finalCurrency,
        status: 'waiting_for_customer_approval',
        discount_percentage: discountApplied ? discountInfo.discountPercent : null,
      })
      .eq("id", reservation_id);

    if (updateError) {
      console.error("❌ Failed to update reservation:", updateError);
      throw updateError;
    }

    // Record price history
    await supabase.from("price_history").insert({
      reservation_id: reservation_id,
      price: finalPrice,
      price_currency: finalCurrency,
      action: 'auto_priced',
      customer_note: discountApplied 
        ? `Otomatik fiyat + %${discountInfo.discountPercent} indirim` 
        : `Otomatik fiyat: ${city || 'N/A'} - ${district || 'N/A'} (${airport || 'N/A'})${exchangeRate !== 1 ? ` [Kur: ${exchangeRate.toFixed(2)}]` : ''}`,
    });

    console.log(`✅ Auto-priced reservation: ${finalPrice} ${finalCurrency}`);

    // Send email notification to admin
    const adminEmail = "sautkahraman@gmail.com";
    try {
      await resend.emails.send({
        from: "Meet Transfer <no-reply@meet-transfer.com>",
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
              </p>
            </div>
          </div>
        `,
      });
      console.log("📧 Admin notification email sent");
    } catch (adminEmailError) {
      console.error("Failed to send admin notification email:", adminEmailError);
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
          from: "Meet Transfer <no-reply@meet-transfer.com>",
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
                  Sorularınız için: +90 541 317 3017
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
