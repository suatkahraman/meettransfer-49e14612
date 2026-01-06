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
  'Istanbul Airport (IST)': [
    'istanbul airport', 'ist airport', 'istanbul havalimanı', 'istanbul havalimani', 
    'ist', 'new istanbul airport', 'yeni istanbul havalimanı', 'arnavutköy', 'arnavutkoy',
    'istanbul new airport', 'istanbul uluslararasi havalimani', 'istanbul international'
  ],
  'Sabiha Gokcen Airport (SAW)': [
    'sabiha', 'saw', 'sabiha gökçen', 'sabiha gokcen', 'sabiha gokçen', 'pendik',
    'sabiha gokcen airport', 'saw airport', 'sabiha gökçen havalimanı', 'kurtköy', 'kurtkoy'
  ],
  'Antalya Airport (AYT)': [
    'antalya airport', 'ayt', 'antalya havalimanı', 'antalya havalimani',
    'antalya international', 'ayt airport'
  ],
  'Bodrum-Milas Airport (BJV)': [
    'bodrum', 'milas', 'bjv', 'bodrum airport', 'milas airport', 'bodrum milas',
    'milas bodrum', 'bodrum havalimanı', 'milas havalimanı'
  ],
  'Dalaman Airport (DLM)': [
    'dalaman', 'dlm', 'dalaman airport', 'dalaman havalimanı', 'dalaman havalimani'
  ],
  'Izmir Adnan Menderes Airport (ADB)': [
    'izmir airport', 'adnan menderes', 'adb', 'izmir adb', 'izmir havalimanı',
    'adnan menderes airport', 'adnan menderes havalimanı'
  ],
  'Kayseri Airport (ASR)': [
    'kayseri airport', 'kayseri', 'asr', 'kayseri havalimanı', 'kayseri havalimani',
    'erkilet', 'erkilet airport'
  ],
  'Nevsehir-Kapadokya Airport (NAV)': [
    'nevsehir', 'nevşehir', 'kapadokya', 'nav', 'cappadocia airport', 'kapadokya havalimanı',
    'nevsehir airport', 'nevşehir havalimanı', 'kapadokya havalimani'
  ],
  'Dubai International Airport (DXB)': [
    'dubai international', 'dxb', 'dubai airport', 'dubai havalimanı',
    'dubai dxb', 'dubai international airport'
  ],
  'Al Maktoum International Airport (DWC)': [
    'al maktoum', 'dwc', 'maktoum', 'al maktoum airport', 'dwc airport',
    'dubai world central', 'dubai south', 'jebel ali'
  ],
  'Larnaca Airport (LCA)': [
    'larnaca', 'lca', 'larnaca airport', 'larnaca havalimanı', 'larnaka'
  ],
  'Paphos Airport (PFO)': [
    'paphos', 'pfo', 'paphos airport', 'pafos', 'baf havalimanı'
  ],
  'Ercan Airport (ECN)': [
    'ercan', 'ecn', 'ercan airport', 'ercan havalimanı', 'lefkoşa havalimanı'
  ],
  'Bursa Yenisehir Airport (YEI)': [
    'bursa airport', 'yenisehir', 'yei', 'bursa havalimanı', 'yenişehir',
    'bursa yenisehir', 'yenisehir airport'
  ],
};

// City keywords for matching
const CITY_KEYWORDS: Record<string, string[]> = {
  'Istanbul': [
    'istanbul', 'İstanbul', 'ist', 'constantinople', 'stanbul',
    'taksim', 'sultanahmet', 'kadikoy', 'kadıköy', 'besiktas', 'beşiktaş', 
    'sisli', 'şişli', 'fatih', 'beyoglu', 'beyoğlu', 'uskudar', 'üsküdar',
    'bakirkoy', 'bakırköy', 'atasehir', 'ataşehir', 'maltepe', 'pendik', 
    'kartal', 'sariyer', 'sarıyer', 'zeytinburnu', 'mecidiyekoy', 'mecidiyeköy',
    'levent', 'maslak', 'yenikoy', 'yeniköy', 'bebek', 'ortakoy', 'ortaköy',
    'nisantasi', 'nişantaşı', 'cihangir', 'galata', 'karakoy', 'karaköy'
  ],
  'Antalya': [
    'antalya', 'kaleici', 'kaleiçi', 'konyaalti', 'konyaaltı', 'lara', 
    'belek', 'side', 'alanya', 'kemer', 'kas', 'kaş', 'kalkan', 'manavgat',
    'serik', 'kundu', 'beldibi', 'goynuk', 'göynük', 'tekirova', 'cirali', 'çıralı',
    'olympos', 'kadriye', 'bogazkent', 'boğazkent', 'kumkoy', 'kumköy',
    'colakli', 'çolaklı', 'evrenseki', 'titreyengol', 'mahmutlar', 'okurcalar'
  ],
  'Bodrum': [
    'bodrum', 'yalikavak', 'yalıkavak', 'turgutreis', 'gumbet', 'gümbet', 
    'bitez', 'turkbuku', 'türkbükü', 'golturkbuku', 'göltürkbükü',
    'ortakent', 'gumusluk', 'gümüşlük', 'akyarlar', 'gundogan', 'gündoğan'
  ],
  'Dalaman': [
    'dalaman', 'fethiye', 'oludeniz', 'ölüdeniz', 'hisaronu', 'hisarönü', 
    'marmaris', 'gocek', 'göcek', 'dalyan', 'koycegiz', 'köyceğiz',
    'icmeler', 'içmeler', 'turunc', 'turunç', 'akyaka', 'ortaca', 'ovacik', 'ovacık'
  ],
  'Izmir': [
    'izmir', 'İzmir', 'cesme', 'çeşme', 'alacati', 'alaçatı', 
    'kusadasi', 'kuşadası', 'selcuk', 'selçuk', 'ephesus', 'efes',
    'urla', 'seferihisar', 'dikili', 'foca', 'foça', 'bergama', 'sirince', 'şirince'
  ],
  'Cappadocia': [
    'cappadocia', 'kapadokya', 'goreme', 'göreme', 'urgup', 'ürgüp', 
    'uchisar', 'uçhisar', 'avanos', 'nevsehir', 'nevşehir', 'kayseri',
    'ortahisar', 'cavusin', 'çavuşin', 'zelve', 'pasabag', 'paşabağ'
  ],
  'Bursa': [
    'bursa', 'mudanya', 'uludag', 'uludağ', 'cumalikizik', 'cumalıkızık', 
    'gemlik', 'iznik', 'osmangazi', 'nilufer', 'nilüfer', 'yildirim', 'yıldırım'
  ],
  'Dubai': [
    'dubai', 'dubayy', 'palm jumeirah', 'dubai marina', 'downtown dubai', 
    'jbr', 'deira', 'bur dubai', 'business bay', 'difc', 'jumeirah'
  ],
  'Cyprus': [
    'cyprus', 'kıbrıs', 'kibris', 'nicosia', 'lefkosa', 'lefkoşa', 
    'limassol', 'larnaca', 'paphos', 'famagusta', 'magusa', 'mağusa',
    'kyrenia', 'girne', 'ayia napa', 'protaras'
  ],
};

// District keywords for matching
const DISTRICT_KEYWORDS: Record<string, { keywords: string[], city: string }> = {
  'Taksim': { keywords: ['taksim', 'taksim square', 'taksim meydanı'], city: 'Istanbul' },
  'Sultanahmet': { keywords: ['sultanahmet', 'blue mosque', 'hagia sophia', 'ayasofya', 'topkapi'], city: 'Istanbul' },
  'Beyoglu': { keywords: ['beyoglu', 'beyoğlu', 'galata', 'karakoy', 'karaköy', 'cihangir', 'istiklal', 'pera'], city: 'Istanbul' },
  'Sisli': { keywords: ['sisli', 'şişli', 'mecidiyekoy', 'mecidiyeköy', 'nisantasi', 'nişantaşı'], city: 'Istanbul' },
  'Besiktas': { keywords: ['besiktas', 'beşiktaş', 'ortakoy', 'ortaköy', 'bebek', 'etiler'], city: 'Istanbul' },
  'Fatih': { keywords: ['fatih', 'aksaray', 'laleli', 'eminonu', 'eminönü', 'sirkeci', 'balat'], city: 'Istanbul' },
  'Levent': { keywords: ['levent', 'maslak', '4. levent', 'zorlu'], city: 'Istanbul' },
  'Kadikoy': { keywords: ['kadikoy', 'kadıköy', 'caferaga', 'moda', 'fenerbahce', 'bostanci'], city: 'Istanbul' },
  'Uskudar': { keywords: ['uskudar', 'üsküdar', 'cengelkoy', 'kuzguncuk'], city: 'Istanbul' },
  'Atasehir': { keywords: ['atasehir', 'ataşehir', 'finance center', 'finans merkezi'], city: 'Istanbul' },
  'Pendik': { keywords: ['pendik', 'tuzla'], city: 'Istanbul' },
  'Bakirkoy': { keywords: ['bakirkoy', 'bakırköy', 'florya', 'yesilkoy', 'yeşilköy', 'atakoy'], city: 'Istanbul' },
  'Kaleici': { keywords: ['kaleici', 'kaleiçi', 'old town antalya'], city: 'Antalya' },
  'Konyaalti': { keywords: ['konyaalti', 'konyaaltı', 'konyaalti beach'], city: 'Antalya' },
  'Lara': { keywords: ['lara', 'lara beach', 'kundu'], city: 'Antalya' },
  'Belek': { keywords: ['belek', 'kadriye', 'bogazkent'], city: 'Antalya' },
  'Side': { keywords: ['side', 'kumkoy', 'colakli', 'manavgat', 'evrenseki', 'titreyengol'], city: 'Antalya' },
  'Alanya': { keywords: ['alanya', 'mahmutlar', 'okurcalar', 'avsallar', 'konakli'], city: 'Antalya' },
  'Kemer': { keywords: ['kemer', 'beldibi', 'goynuk', 'tekirova', 'cirali', 'olympos'], city: 'Antalya' },
  'Kas': { keywords: ['kas', 'kaş'], city: 'Antalya' },
  'Kalkan': { keywords: ['kalkan'], city: 'Antalya' },
  'Bodrum Center': { keywords: ['bodrum center', 'bodrum merkez', 'bodrum centrum', 'bodrum city'], city: 'Bodrum' },
  'Yalikavak': { keywords: ['yalikavak', 'yalıkavak', 'palmarina'], city: 'Bodrum' },
  'Turgutreis': { keywords: ['turgutreis'], city: 'Bodrum' },
  'Gumbet': { keywords: ['gumbet', 'gümbet'], city: 'Bodrum' },
  'Turkbuku': { keywords: ['turkbuku', 'türkbükü', 'golturkbuku'], city: 'Bodrum' },
  'Fethiye': { keywords: ['fethiye', 'calis', 'çalış'], city: 'Dalaman' },
  'Oludeniz': { keywords: ['oludeniz', 'ölüdeniz', 'blue lagoon', 'hisaronu', 'ovacik'], city: 'Dalaman' },
  'Marmaris': { keywords: ['marmaris', 'icmeler', 'içmeler', 'turunc'], city: 'Dalaman' },
  'Gocek': { keywords: ['gocek', 'göcek'], city: 'Dalaman' },
  'Dalyan': { keywords: ['dalyan', 'koycegiz', 'iztuzu'], city: 'Dalaman' },
  'Goreme': { keywords: ['goreme', 'göreme'], city: 'Cappadocia' },
  'Urgup': { keywords: ['urgup', 'ürgüp'], city: 'Cappadocia' },
  'Uchisar': { keywords: ['uchisar', 'uçhisar'], city: 'Cappadocia' },
  'Avanos': { keywords: ['avanos'], city: 'Cappadocia' },
  'Nevsehir': { keywords: ['nevsehir', 'nevşehir'], city: 'Cappadocia' },
  'Osmangazi': { keywords: ['osmangazi', 'bursa center', 'bursa merkez'], city: 'Bursa' },
  'Mudanya': { keywords: ['mudanya'], city: 'Bursa' },
  'Uludag': { keywords: ['uludag', 'uludağ'], city: 'Bursa' },
  'Cumalikizik': { keywords: ['cumalikizik', 'cumalıkızık'], city: 'Bursa' },
  'Downtown Dubai': { keywords: ['downtown', 'downtown dubai', 'burj khalifa', 'dubai mall'], city: 'Dubai' },
  'Dubai Marina': { keywords: ['marina', 'dubai marina', 'jbr', 'jumeirah beach residence'], city: 'Dubai' },
  'Palm Jumeirah': { keywords: ['palm', 'palm jumeirah', 'atlantis'], city: 'Dubai' },
  'Deira': { keywords: ['deira', 'gold souk', 'spice souk'], city: 'Dubai' },
  'Jumeirah': { keywords: ['jumeirah', 'jumeira', 'jumeirah beach'], city: 'Dubai' },
  'Nicosia': { keywords: ['nicosia', 'lefkosa', 'lefkoşa'], city: 'Cyprus' },
  'Limassol': { keywords: ['limassol', 'lemesos'], city: 'Cyprus' },
  'Larnaca City': { keywords: ['larnaca', 'larnaka'], city: 'Cyprus' },
  'Paphos': { keywords: ['paphos', 'pafos', 'coral bay'], city: 'Cyprus' },
  'Ayia Napa': { keywords: ['ayia napa', 'agia napa', 'nissi beach'], city: 'Cyprus' },
  'Kyrenia': { keywords: ['kyrenia', 'girne'], city: 'Cyprus' },
};

function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .replace(/türkiye|turkey|türkei/gi, '')
    .replace(/,\s*tr$/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[,.\-_\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

function findAirport(location: string): string | null {
  const normalized = normalizeLocation(location);
  for (const [airport, keywords] of Object.entries(AIRPORT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(normalizeLocation(keyword))) {
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
      if (normalized.includes(normalizeLocation(keyword))) {
        return city;
      }
    }
  }
  return null;
}

function findDistrict(location: string): { district: string; city: string } | null {
  const normalized = normalizeLocation(location);
  for (const [district, data] of Object.entries(DISTRICT_KEYWORDS)) {
    for (const keyword of data.keywords) {
      if (normalized.includes(normalizeLocation(keyword))) {
        return { district, city: data.city };
      }
    }
  }
  return null;
}

interface AutoPriceRequest {
  reservation_id: string;
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

    // Parse locations
    const pickupAirport = findAirport(reservation.pickup);
    const dropoffAirport = findAirport(reservation.dropoff);
    const pickupCity = findCity(reservation.pickup);
    const dropoffCity = findCity(reservation.dropoff);
    const pickupDistrictResult = findDistrict(reservation.pickup);
    const dropoffDistrictResult = findDistrict(reservation.dropoff);

    console.log("📍 Location analysis:", {
      pickup: reservation.pickup,
      dropoff: reservation.dropoff,
      pickupAirport,
      dropoffAirport,
      pickupCity,
      dropoffCity,
      pickupDistrict: pickupDistrictResult?.district,
      dropoffDistrict: dropoffDistrictResult?.district,
    });

    // Determine airport, city and district for pricing
    let airport: string | null = null;
    let district: string | null = null;
    let city: string | null = null;

    if (pickupAirport && dropoffDistrictResult) {
      airport = pickupAirport;
      district = dropoffDistrictResult.district;
      city = dropoffDistrictResult.city || dropoffCity;
    } else if (dropoffAirport && pickupDistrictResult) {
      airport = dropoffAirport;
      district = pickupDistrictResult.district;
      city = pickupDistrictResult.city || pickupCity;
    } else if (pickupAirport && dropoffCity) {
      airport = pickupAirport;
      city = dropoffCity;
    } else if (dropoffAirport && pickupCity) {
      airport = dropoffAirport;
      city = pickupCity;
    }

    console.log("🚗 Transfer info:", { airport, city, district });

    if (!city && !airport) {
      console.log("❌ No city or airport matched - manual pricing required");
      return new Response(JSON.stringify({ matched: false, reason: "no_location_match" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Query for matching price
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
      console.log("❌ No price found for this route");
      return new Response(JSON.stringify({ matched: false, reason: "no_price_found" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Calculate final price
    let finalPrice = bestPrice.price;
    let discountApplied = false;

    // Apply promo code discount if applicable
    if (reservation.promo_code && 
        reservation.promo_code.toLowerCase() === 'meet40return') {
      finalPrice = Math.round(finalPrice * 0.7); // 30% discount
      discountApplied = true;
      console.log("🎫 Promo code discount applied: 30% off");
    }

    // Update reservation with price
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        price: finalPrice,
        price_currency: bestPrice.price_currency,
        status: 'waiting_for_customer_approval',
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
      price_currency: bestPrice.price_currency,
      action: 'auto_priced',
      customer_note: discountApplied ? 'Otomatik fiyat + %30 indirim (Promo kod)' : 'Otomatik fiyat eşleştirmesi',
    });

    console.log(`✅ Auto-priced reservation: ${finalPrice} ${bestPrice.price_currency}`);

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
          subject: `Fiyat Teklifi: ${finalPrice} ${bestPrice.price_currency} - Meet Transfer`,
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
                    ${finalPrice} ${bestPrice.price_currency}
                  </p>
                  ${discountApplied ? '<p style="color: #28a745; font-size: 14px; margin-top: 5px;">🎫 %30 Gidiş-Dönüş İndirimi Uygulandı!</p>' : ''}
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
        currency: bestPrice.price_currency,
        discount_applied: discountApplied,
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
