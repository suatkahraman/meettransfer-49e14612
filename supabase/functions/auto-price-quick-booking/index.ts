import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Airport keywords for matching
const AIRPORT_KEYWORDS: Record<string, string[]> = {
  'Istanbul Airport (IST)': ['istanbul airport', 'ist airport', 'istanbul havalimanı', 'ist', 'new istanbul airport', 'yeni istanbul havalimanı', 'arnavutköy'],
  'Sabiha Gokcen Airport (SAW)': ['sabiha', 'saw', 'sabiha gökçen', 'sabiha gokcen', 'pendik'],
  'Antalya Airport (AYT)': ['antalya airport', 'ayt', 'antalya havalimanı'],
  'Bodrum-Milas Airport (BJV)': ['bodrum', 'milas', 'bjv', 'bodrum airport', 'milas airport'],
  'Dalaman Airport (DLM)': ['dalaman', 'dlm', 'dalaman airport'],
  'Izmir Adnan Menderes Airport (ADB)': ['izmir', 'adnan menderes', 'adb', 'izmir airport'],
  'Kayseri Airport (ASR)': ['kayseri', 'asr', 'kayseri airport'],
  'Nevsehir-Kapadokya Airport (NAV)': ['nevsehir', 'kapadokya', 'nav', 'cappadocia airport'],
  'Dubai International Airport (DXB)': ['dubai', 'dxb', 'dubai international', 'dubai airport'],
  'Al Maktoum International Airport (DWC)': ['al maktoum', 'dwc', 'maktoum'],
  'Larnaca Airport (LCA)': ['larnaca', 'lca', 'larnaca airport'],
  'Paphos Airport (PFO)': ['paphos', 'pfo', 'paphos airport'],
  'Ercan Airport (ECN)': ['ercan', 'ecn', 'ercan airport'],
  'Bursa Yenisehir Airport (YEI)': ['bursa', 'yenisehir', 'yei', 'bursa airport'],
};

// City keywords for matching
const CITY_KEYWORDS: Record<string, string[]> = {
  'Istanbul': ['istanbul', 'İstanbul', 'taksim', 'sultanahmet', 'kadikoy', 'kadıköy', 'besiktas', 'beşiktaş', 'sisli', 'şişli', 'fatih', 'beyoglu', 'beyoğlu', 'uskudar', 'üsküdar'],
  'Antalya': ['antalya', 'kaleici', 'kaleiçi', 'konyaalti', 'konyaaltı', 'lara', 'belek', 'side', 'alanya', 'kemer', 'kas', 'kaş', 'kalkan', 'manavgat'],
  'Bodrum': ['bodrum', 'yalikavak', 'yalıkavak', 'turgutreis', 'gumbet', 'gümbet', 'bitez', 'turkbuku', 'türkbükü'],
  'Dalaman': ['dalaman', 'fethiye', 'oludeniz', 'ölüdeniz', 'hisaronu', 'hisarönü', 'marmaris', 'gocek', 'göcek', 'dalyan'],
  'Izmir': ['izmir', 'İzmir', 'cesme', 'çeşme', 'alacati', 'alaçatı', 'kusadasi', 'kuşadası', 'selcuk', 'selçuk', 'ephesus', 'efes'],
  'Cappadocia': ['cappadocia', 'kapadokya', 'goreme', 'göreme', 'urgup', 'ürgüp', 'uchisar', 'uçhisar', 'avanos', 'nevsehir', 'nevşehir', 'kayseri'],
  'Bursa': ['bursa', 'mudanya', 'uludag', 'uludağ', 'cumalikizik', 'cumalıkızık', 'gemlik', 'iznik'],
  'Dubai': ['dubai', 'dubayy', 'palm jumeirah', 'dubai marina', 'downtown dubai', 'jbr', 'deira', 'bur dubai'],
  'Cyprus': ['cyprus', 'kıbrıs', 'kibris', 'nicosia', 'lefkosa', 'lefkoşa', 'limassol', 'larnaca', 'paphos', 'famagusta', 'magusa', 'kyrenia', 'girne', 'ayia napa'],
};

// District keywords for matching
const DISTRICT_KEYWORDS: Record<string, string[]> = {
  'Taksim': ['taksim', 'taksim square', 'taksim meydanı'],
  'Sultanahmet': ['sultanahmet', 'blue mosque', 'hagia sophia', 'ayasofya', 'topkapi'],
  'Kadikoy': ['kadikoy', 'kadıköy', 'caferaga', 'moda', 'fenerbahce'],
  'Besiktas': ['besiktas', 'beşiktaş', 'ortakoy', 'ortaköy', 'bebek'],
  'Sisli': ['sisli', 'şişli', 'mecidiyekoy', 'mecidiyeköy', 'nisantasi', 'nişantaşı'],
  'Fatih': ['fatih', 'aksaray', 'laleli', 'eminonu', 'eminönü', 'sirkeci'],
  'Beyoglu': ['beyoglu', 'beyoğlu', 'galata', 'karakoy', 'karaköy', 'cihangir', 'istiklal'],
  'Levent': ['levent', 'maslak', '4. levent', 'zorlu'],
  'Atasehir': ['atasehir', 'ataşehir', 'finance center', 'finans merkezi'],
  'Kaleici': ['kaleici', 'kaleiçi', 'old town antalya'],
  'Konyaalti': ['konyaalti', 'konyaaltı', 'konyaalti beach'],
  'Lara': ['lara', 'lara beach', 'kundu'],
  'Belek': ['belek', 'kadriye', 'bogazkent'],
  'Side': ['side', 'kumkoy', 'kumköy', 'colakli', 'çolaklı', 'manavgat'],
  'Alanya': ['alanya', 'mahmutlar', 'okurcalar', 'avsallar', 'konakli', 'konaklı'],
  'Kemer': ['kemer', 'beldibi', 'goynuk', 'göynük', 'tekirova', 'cirali', 'çıralı'],
  'Goreme': ['goreme', 'göreme'],
  'Urgup': ['urgup', 'ürgüp'],
  'Fethiye': ['fethiye'],
  'Oludeniz': ['oludeniz', 'ölüdeniz', 'blue lagoon'],
  'Marmaris': ['marmaris', 'icmeler', 'içmeler', 'turunc', 'trunç'],
  'Downtown Dubai': ['downtown', 'downtown dubai', 'burj khalifa', 'dubai mall'],
  'Dubai Marina': ['marina', 'dubai marina', 'jbr', 'jumeirah beach residence'],
  'Palm Jumeirah': ['palm', 'palm jumeirah', 'atlantis'],
  'Nicosia': ['nicosia', 'lefkosa', 'lefkoşa'],
  'Limassol': ['limassol', 'lemesos'],
  'Larnaca': ['larnaca', 'larnaka'],
};

function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .replace(/[,.\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findAirport(location: string): string | null {
  const normalized = normalizeLocation(location);
  for (const [airport, keywords] of Object.entries(AIRPORT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return airport;
      }
    }
  }
  return null;
}

function findCity(location: string): string | null {
  const normalized = normalizeLocation(location);
  for (const [city, keywords] of Object.entries(CITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return city;
      }
    }
  }
  return null;
}

function findDistrict(location: string): string | null {
  const normalized = normalizeLocation(location);
  for (const [district, keywords] of Object.entries(DISTRICT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return district;
      }
    }
  }
  return null;
}

interface AutoPriceRequest {
  quick_booking_id: string;
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

    console.log("Auto-pricing for quick booking:", quick_booking_id);

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from("quick_booking_requests")
      .select("*")
      .eq("id", quick_booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingError);
      return new Response(JSON.stringify({ error: "Booking not found", matched: false }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Skip if agency booking (agencies get manual pricing)
    if (booking.agency_id || booking.agency_user_id) {
      console.log("Agency booking - skipping auto-price");
      return new Response(JSON.stringify({ matched: false, reason: "agency_booking" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse locations
    const pickupAirport = findAirport(booking.pickup);
    const dropoffAirport = findAirport(booking.dropoff);
    const pickupCity = findCity(booking.pickup);
    const dropoffCity = findCity(booking.dropoff);
    const pickupDistrict = findDistrict(booking.pickup);
    const dropoffDistrict = findDistrict(booking.dropoff);

    console.log("Location analysis:", {
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      pickupAirport,
      dropoffAirport,
      pickupCity,
      dropoffCity,
      pickupDistrict,
      dropoffDistrict,
    });

    // Determine airport and district for pricing
    let airport: string | null = null;
    let district: string | null = null;
    let city: string | null = null;

    if (pickupAirport && dropoffDistrict) {
      airport = pickupAirport;
      district = dropoffDistrict;
      city = dropoffCity;
    } else if (dropoffAirport && pickupDistrict) {
      airport = dropoffAirport;
      district = pickupDistrict;
      city = pickupCity;
    } else if (pickupAirport && dropoffCity) {
      airport = pickupAirport;
      city = dropoffCity;
    } else if (dropoffAirport && pickupCity) {
      airport = dropoffAirport;
      city = pickupCity;
    }

    if (!city && !airport) {
      console.log("No city or airport matched");
      return new Response(JSON.stringify({ matched: false, reason: "no_location_match" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Query for matching price
    let query = supabase
      .from("region_prices")
      .select("*")
      .eq("vehicle_type", booking.vehicle_type)
      .eq("is_active", true);

    if (city) {
      query = query.eq("city", city);
    }

    if (district) {
      query = query.eq("district", district);
    }

    if (airport) {
      query = query.eq("airport", airport);
    }

    const { data: prices, error: priceError } = await query;

    if (priceError || !prices || prices.length === 0) {
      console.log("No price found for this route");
      return new Response(JSON.stringify({ matched: false, reason: "no_price_found" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Find best match
    let bestPrice = prices[0];
    for (const price of prices) {
      if (airport && price.airport === airport && district && price.district === district) {
        bestPrice = price;
        break;
      }
    }

    console.log("Found price:", bestPrice);

    // Calculate return price if has return trip
    let returnPrice = null;
    if (booking.has_return_trip) {
      returnPrice = bestPrice.price; // Same price for return
      
      // Apply promo discount for return trip
      if (booking.promo_code?.toUpperCase() === 'MEET40RETURN') {
        returnPrice = Math.round(bestPrice.price * 0.7); // 30% discount
      }
    }

    // Update booking with price
    const { error: updateError } = await supabase
      .from("quick_booking_requests")
      .update({
        price: bestPrice.price,
        price_currency: bestPrice.price_currency,
        status: "price_sent",
        return_price: booking.has_return_trip ? bestPrice.price : null, // Store original for display
      })
      .eq("id", quick_booking_id);

    if (updateError) {
      console.error("Failed to update booking:", updateError);
      throw updateError;
    }

    // Record price history
    try {
      await supabase.from("price_history").insert({
        quick_booking_id: quick_booking_id,
        price: bestPrice.price,
        price_currency: bestPrice.price_currency,
        action: "auto_sent",
      });
    } catch (e) {
      console.error("Failed to record price history:", e);
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
        const currencySymbol = currencySymbols[bestPrice.price_currency] || bestPrice.price_currency;

        const formatDate = (dateStr: string) => {
          const date = new Date(dateStr);
          return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        };

        let priceHtml = `<p style="font-size: 24px; color: #1e3a8a; font-weight: bold; margin: 10px 0;">${currencySymbol}${bestPrice.price}</p>`;
        
        if (booking.has_return_trip && returnPrice) {
          const originalPrice = bestPrice.price;
          const hasDiscount = booking.promo_code?.toUpperCase() === 'MEET40RETURN';
          
          priceHtml += `
            <p style="margin-top: 15px; color: #666;">Dönüş Transferi (${formatDate(booking.return_date)} - ${booking.return_time}):</p>
            ${hasDiscount 
              ? `<p style="font-size: 18px; color: #22c55e; font-weight: bold;"><span style="text-decoration: line-through; color: #999;">${currencySymbol}${originalPrice}</span> ${currencySymbol}${returnPrice} <span style="font-size: 12px;">(30% indirim)</span></p>`
              : `<p style="font-size: 18px; color: #1e3a8a; font-weight: bold;">${currencySymbol}${returnPrice}</p>`
            }
          `;
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Meet Transfer</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Fiyat Teklifiniz Hazır!</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Transfer Detayları</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p><strong>Alış:</strong> ${booking.pickup}</p>
                <p><strong>Bırakış:</strong> ${booking.dropoff}</p>
                <p><strong>Tarih:</strong> ${formatDate(booking.pickup_date)}</p>
                <p><strong>Saat:</strong> ${booking.pickup_time}</p>
                <p><strong>Araç:</strong> ${booking.vehicle_type === 'mercedes-vito' ? 'Mercedes Vito' : booking.vehicle_type === 'mercedes-sprinter' ? 'Mercedes Sprinter' : 'Mercedes Maybach'}</p>
              </div>
              
              <div style="background: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; color: #1e3a8a;">Gidiş Fiyatı:</p>
                ${priceHtml}
              </div>
              
              <div style="text-align: center;">
                <a href="${confirmUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Fiyatı Onayla</a>
              </div>
              
              <p style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">
                Bu teklif 24 saat geçerlidir.
              </p>
            </div>
          </body>
          </html>
        `;

        const { error: emailError } = await resend.emails.send({
          from: "Meet Transfer <no-reply@meettransfer.app>",
          to: [booking.customer_email],
          subject: `Transfer Fiyatınız: ${currencySymbol}${bestPrice.price} - Meet Transfer`,
          html: emailHtml,
        });

        if (!emailError) {
          emailSent = true;
          console.log("Auto-price email sent to:", booking.customer_email);
        } else {
          console.error("Email send error:", emailError);
        }
      } catch (emailErr) {
        console.error("Failed to send email:", emailErr);
      }
    }

    // Notify admin
    try {
      await supabase.functions.invoke("notify-admin-quick-booking-new", {
        body: {
          booking_id: quick_booking_id,
          pickup: booking.pickup,
          dropoff: booking.dropoff,
          pickup_date: booking.pickup_date,
          pickup_time: booking.pickup_time,
          vehicle_type: booking.vehicle_type,
          auto_priced: true,
          price: bestPrice.price,
          currency: bestPrice.price_currency,
        },
      });
    } catch (e) {
      console.error("Failed to notify admin:", e);
    }

    return new Response(
      JSON.stringify({
        matched: true,
        price: bestPrice.price,
        currency: bestPrice.price_currency,
        emailSent,
        matchedCity: city,
        matchedDistrict: district,
        matchedAirport: airport,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Auto-price error:", error);
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
