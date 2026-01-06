import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Airport keywords for matching - expanded
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

// City keywords for matching - expanded
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

// District keywords for matching - expanded with city mapping
const DISTRICT_KEYWORDS: Record<string, { keywords: string[], city: string }> = {
  // Istanbul
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
  
  // Antalya
  'Kaleici': { keywords: ['kaleici', 'kaleiçi', 'old town antalya'], city: 'Antalya' },
  'Konyaalti': { keywords: ['konyaalti', 'konyaaltı', 'konyaalti beach'], city: 'Antalya' },
  'Lara': { keywords: ['lara', 'lara beach', 'kundu'], city: 'Antalya' },
  'Belek': { keywords: ['belek', 'kadriye', 'bogazkent'], city: 'Antalya' },
  'Side': { keywords: ['side', 'kumkoy', 'colakli', 'manavgat', 'evrenseki', 'titreyengol'], city: 'Antalya' },
  'Alanya': { keywords: ['alanya', 'mahmutlar', 'okurcalar', 'avsallar', 'konakli'], city: 'Antalya' },
  'Kemer': { keywords: ['kemer', 'beldibi', 'goynuk', 'tekirova', 'cirali', 'olympos'], city: 'Antalya' },
  'Kas': { keywords: ['kas', 'kaş'], city: 'Antalya' },
  'Kalkan': { keywords: ['kalkan'], city: 'Antalya' },
  
  // Bodrum
  'Bodrum Center': { keywords: ['bodrum center', 'bodrum merkez', 'bodrum centrum', 'bodrum city'], city: 'Bodrum' },
  'Yalikavak': { keywords: ['yalikavak', 'yalıkavak', 'palmarina'], city: 'Bodrum' },
  'Turgutreis': { keywords: ['turgutreis'], city: 'Bodrum' },
  'Gumbet': { keywords: ['gumbet', 'gümbet'], city: 'Bodrum' },
  'Turkbuku': { keywords: ['turkbuku', 'türkbükü', 'golturkbuku'], city: 'Bodrum' },
  
  // Dalaman / Fethiye / Marmaris
  'Fethiye': { keywords: ['fethiye', 'calis', 'çalış'], city: 'Dalaman' },
  'Oludeniz': { keywords: ['oludeniz', 'ölüdeniz', 'blue lagoon', 'hisaronu', 'ovacik'], city: 'Dalaman' },
  'Marmaris': { keywords: ['marmaris', 'icmeler', 'içmeler', 'turunc'], city: 'Dalaman' },
  'Gocek': { keywords: ['gocek', 'göcek'], city: 'Dalaman' },
  'Dalyan': { keywords: ['dalyan', 'koycegiz', 'iztuzu'], city: 'Dalaman' },
  
  // Cappadocia
  'Goreme': { keywords: ['goreme', 'göreme'], city: 'Cappadocia' },
  'Urgup': { keywords: ['urgup', 'ürgüp'], city: 'Cappadocia' },
  'Uchisar': { keywords: ['uchisar', 'uçhisar'], city: 'Cappadocia' },
  'Avanos': { keywords: ['avanos'], city: 'Cappadocia' },
  'Nevsehir': { keywords: ['nevsehir', 'nevşehir'], city: 'Cappadocia' },
  
  // Bursa
  'Osmangazi': { keywords: ['osmangazi', 'bursa center', 'bursa merkez'], city: 'Bursa' },
  'Mudanya': { keywords: ['mudanya'], city: 'Bursa' },
  'Uludag': { keywords: ['uludag', 'uludağ'], city: 'Bursa' },
  'Cumalikizik': { keywords: ['cumalikizik', 'cumalıkızık'], city: 'Bursa' },
  
  // Dubai
  'Downtown Dubai': { keywords: ['downtown', 'downtown dubai', 'burj khalifa', 'dubai mall'], city: 'Dubai' },
  'Dubai Marina': { keywords: ['marina', 'dubai marina', 'jbr', 'jumeirah beach residence'], city: 'Dubai' },
  'Palm Jumeirah': { keywords: ['palm', 'palm jumeirah', 'atlantis'], city: 'Dubai' },
  'Deira': { keywords: ['deira', 'gold souk', 'spice souk'], city: 'Dubai' },
  'Jumeirah': { keywords: ['jumeirah', 'jumeira', 'jumeirah beach'], city: 'Dubai' },
  
  // Cyprus
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

    console.log("🚗 Auto-pricing started for booking:", quick_booking_id);

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

    // Parse locations
    const pickupAirport = findAirport(booking.pickup);
    const dropoffAirport = findAirport(booking.dropoff);
    const pickupCity = findCity(booking.pickup);
    const dropoffCity = findCity(booking.dropoff);
    const pickupDistrictResult = findDistrict(booking.pickup);
    const dropoffDistrictResult = findDistrict(booking.dropoff);

    console.log("📍 Location analysis:", {
      pickup: booking.pickup,
      dropoff: booking.dropoff,
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
    let transferDirection: 'from_airport' | 'to_airport' | 'unknown' = 'unknown';

    if (pickupAirport && dropoffDistrictResult) {
      // From airport to district
      airport = pickupAirport;
      district = dropoffDistrictResult.district;
      city = dropoffDistrictResult.city || dropoffCity;
      transferDirection = 'from_airport';
    } else if (dropoffAirport && pickupDistrictResult) {
      // From district to airport
      airport = dropoffAirport;
      district = pickupDistrictResult.district;
      city = pickupDistrictResult.city || pickupCity;
      transferDirection = 'to_airport';
    } else if (pickupAirport && dropoffCity) {
      // From airport to city (no specific district)
      airport = pickupAirport;
      city = dropoffCity;
      transferDirection = 'from_airport';
    } else if (dropoffAirport && pickupCity) {
      // From city to airport (no specific district)
      airport = dropoffAirport;
      city = pickupCity;
      transferDirection = 'to_airport';
    }

    console.log("🚗 Transfer direction:", { transferDirection, airport, city, district });

    if (!city && !airport) {
      console.log("❌ No city or airport matched - manual pricing required");
      
      // Notify admin about unmatched booking
      try {
        await supabase.functions.invoke("notify-admin-quick-booking-new", {
          body: {
            booking_id: quick_booking_id,
            pickup: booking.pickup,
            dropoff: booking.dropoff,
            pickup_date: booking.pickup_date,
            pickup_time: booking.pickup_time,
            vehicle_type: booking.vehicle_type,
            auto_priced: false,
            needs_manual_price: true,
          },
        });
      } catch (e) {
        console.error("Failed to notify admin:", e);
      }
      
      return new Response(JSON.stringify({ matched: false, reason: "no_location_match" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Query for matching price - try exact match first
    let bestPrice = null;

    // 1. Try exact match (airport + city + district + vehicle)
    if (airport && city && district) {
      const { data: exactMatch } = await supabase
        .from("region_prices")
        .select("*")
        .eq("city", city)
        .eq("airport", airport)
        .eq("district", district)
        .eq("vehicle_type", booking.vehicle_type)
        .eq("is_active", true)
        .limit(1);

      if (exactMatch && exactMatch.length > 0) {
        bestPrice = exactMatch[0];
        console.log("✅ Exact match found:", bestPrice);
      }
    }

    // 2. Try airport + city match (any district)
    if (!bestPrice && airport && city) {
      const { data: cityMatch } = await supabase
        .from("region_prices")
        .select("*")
        .eq("city", city)
        .eq("airport", airport)
        .eq("vehicle_type", booking.vehicle_type)
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(1);

      if (cityMatch && cityMatch.length > 0) {
        bestPrice = cityMatch[0];
        console.log("✅ City+Airport fallback match found:", bestPrice);
      }
    }

    // 3. Try city only match (any airport)
    if (!bestPrice && city) {
      const { data: cityOnlyMatch } = await supabase
        .from("region_prices")
        .select("*")
        .eq("city", city)
        .eq("vehicle_type", booking.vehicle_type)
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(1);

      if (cityOnlyMatch && cityOnlyMatch.length > 0) {
        bestPrice = cityOnlyMatch[0];
        console.log("✅ City-only fallback match found:", bestPrice);
      }
    }

    if (!bestPrice) {
      console.log("❌ No price found for this route - notifying admin");
      
      // Notify admin about booking needing manual pricing
      try {
        await supabase.functions.invoke("notify-admin-quick-booking-new", {
          body: {
            booking_id: quick_booking_id,
            pickup: booking.pickup,
            dropoff: booking.dropoff,
            pickup_date: booking.pickup_date,
            pickup_time: booking.pickup_time,
            vehicle_type: booking.vehicle_type,
            auto_priced: false,
            needs_manual_price: true,
            matched_city: city,
            matched_airport: airport,
          },
        });
      } catch (e) {
        console.error("Failed to notify admin:", e);
      }
      
      return new Response(JSON.stringify({ matched: false, reason: "no_price_found" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Calculate return price if has return trip
    let returnPrice = bestPrice.price;
    let hasDiscount = false;
    const validPromoCodes = ['MEET40RETURN', 'GIDISDONUS', 'RETURN30'];
    
    if (booking.has_return_trip && booking.promo_code && validPromoCodes.includes(booking.promo_code.toUpperCase())) {
      returnPrice = Math.round(bestPrice.price * 0.7); // 30% discount
      hasDiscount = true;
    }

    // Update booking with price
    const { error: updateError } = await supabase
      .from("quick_booking_requests")
      .update({
        price: bestPrice.price,
        price_currency: bestPrice.price_currency,
        status: "price_sent",
        return_price: booking.has_return_trip ? returnPrice : null,
      })
      .eq("id", quick_booking_id);

    if (updateError) {
      console.error("❌ Failed to update booking:", updateError);
      throw updateError;
    }

    console.log("✅ Booking updated with price:", bestPrice.price, bestPrice.price_currency);

    // Record price history
    try {
      await supabase.from("price_history").insert({
        quick_booking_id: quick_booking_id,
        price: bestPrice.price,
        price_currency: bestPrice.price_currency,
        action: "auto_sent",
        customer_note: `Auto-matched: ${city || 'N/A'} - ${district || 'N/A'} (${airport || 'N/A'})`,
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
          return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        };

        const vehicleNames: Record<string, string> = {
          'mercedes-vito': 'Mercedes Vito VIP',
          'mercedes-sprinter': 'Mercedes Sprinter VIP',
          'mercedes-maybach': 'Mercedes Maybach',
        };

        let priceHtml = `<p style="font-size: 28px; color: #1e3a8a; font-weight: bold; margin: 10px 0;">${currencySymbol}${bestPrice.price}</p>`;
        let totalPrice = bestPrice.price;
        
        if (booking.has_return_trip) {
          totalPrice = bestPrice.price + returnPrice;
          priceHtml += `
            <p style="margin-top: 15px; color: #666;">Return Transfer (${formatDate(booking.return_date)} - ${booking.return_time}):</p>
            ${hasDiscount 
              ? `<p style="font-size: 20px; color: #22c55e; font-weight: bold;"><span style="text-decoration: line-through; color: #999;">${currencySymbol}${bestPrice.price}</span> ${currencySymbol}${returnPrice} <span style="font-size: 12px; background: #dcfce7; padding: 2px 8px; border-radius: 4px;">30% OFF</span></p>`
              : `<p style="font-size: 20px; color: #1e3a8a; font-weight: bold;">${currencySymbol}${returnPrice}</p>`
            }
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #1e3a8a;">
              <p style="color: #666;">Total Price:</p>
              <p style="font-size: 28px; color: #1e3a8a; font-weight: bold;">${currencySymbol}${totalPrice}</p>
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
          subject: `Your Transfer Quote: ${currencySymbol}${bestPrice.price} - Meet Transfer`,
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

    // Notify admin about auto-priced booking
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
          matched_city: city,
          matched_district: district,
          matched_airport: airport,
        },
      });
    } catch (e) {
      console.error("Failed to notify admin:", e);
    }

    console.log("✅ Auto-pricing completed successfully");

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
