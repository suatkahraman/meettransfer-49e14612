import { supabase } from '@/integrations/supabase/client';

interface RegionPrice {
  id: string;
  city: string;
  airport: string | null;
  district: string;
  vehicle_type: string;
  price: number;
  price_currency: string;
}

interface MatchResult {
  found: boolean;
  price?: number;
  currency?: string;
  matchedCity?: string;
  matchedDistrict?: string;
  matchedAirport?: string;
}

// Türkiye havalimanları eşleştirme
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

// Şehir eşleştirme
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

// İlçe/bölge eşleştirme - genişletilmiş
const DISTRICT_KEYWORDS: Record<string, string[]> = {
  // Istanbul
  'Taksim': ['taksim', 'taksim square', 'taksim meydanı'],
  'Sultanahmet': ['sultanahmet', 'blue mosque', 'hagia sophia', 'ayasofya', 'topkapi'],
  'Kadikoy': ['kadikoy', 'kadıköy', 'caferaga', 'moda', 'fenerbahce'],
  'Besiktas': ['besiktas', 'beşiktaş', 'ortakoy', 'ortaköy', 'bebek'],
  'Sisli': ['sisli', 'şişli', 'mecidiyekoy', 'mecidiyeköy', 'nisantasi', 'nişantaşı'],
  'Fatih': ['fatih', 'aksaray', 'laleli', 'eminonu', 'eminönü', 'sirkeci'],
  'Beyoglu': ['beyoglu', 'beyoğlu', 'galata', 'karakoy', 'karaköy', 'cihangir', 'istiklal'],
  'Levent': ['levent', 'maslak', '4. levent', 'zorlu'],
  'Atasehir': ['atasehir', 'ataşehir', 'finance center', 'finans merkezi'],
  'Pendik': ['pendik'],
  'Kartal': ['kartal'],
  'Maltepe': ['maltepe'],
  // Antalya
  'Kaleici': ['kaleici', 'kaleiçi', 'old town antalya'],
  'Konyaalti': ['konyaalti', 'konyaaltı', 'konyaalti beach'],
  'Lara': ['lara', 'lara beach', 'kundu'],
  'Belek': ['belek', 'kadriye', 'bogazkent'],
  'Side': ['side', 'kumkoy', 'kumköy', 'colakli', 'çolaklı', 'manavgat'],
  'Alanya': ['alanya', 'mahmutlar', 'okurcalar', 'avsallar', 'konakli', 'konaklı'],
  'Kemer': ['kemer', 'beldibi', 'goynuk', 'göynük', 'tekirova', 'cirali', 'çıralı'],
  'Kas': ['kas', 'kaş'],
  'Kalkan': ['kalkan'],
  // Bodrum
  'Bodrum Center': ['bodrum center', 'bodrum merkez', 'bodrum centrum'],
  'Yalikavak': ['yalikavak', 'yalıkavak'],
  'Turgutreis': ['turgutreis'],
  'Gumbet': ['gumbet', 'gümbet'],
  'Turkbuku': ['turkbuku', 'türkbükü', 'golturkbuku', 'göltürkbükü'],
  // Dalaman / Marmaris
  'Fethiye': ['fethiye'],
  'Oludeniz': ['oludeniz', 'ölüdeniz', 'blue lagoon'],
  'Marmaris': ['marmaris', 'icmeler', 'içmeler', 'turunc', 'trunç'],
  'Gocek': ['gocek', 'göcek'],
  'Dalyan': ['dalyan', 'koycegiz', 'köyceğiz'],
  // Cappadocia
  'Goreme': ['goreme', 'göreme'],
  'Urgup': ['urgup', 'ürgüp'],
  'Uchisar': ['uchisar', 'uçhisar'],
  'Avanos': ['avanos'],
  // Dubai
  'Downtown Dubai': ['downtown', 'downtown dubai', 'burj khalifa', 'dubai mall'],
  'Dubai Marina': ['marina', 'dubai marina', 'jbr', 'jumeirah beach residence'],
  'Palm Jumeirah': ['palm', 'palm jumeirah', 'atlantis'],
  'Deira': ['deira', 'gold souk', 'spice souk'],
  'Jumeirah': ['jumeirah', 'jumeira', 'jumeirah beach'],
  // Cyprus
  'Nicosia': ['nicosia', 'lefkosa', 'lefkoşa'],
  'Limassol': ['limassol', 'lemesos'],
  'Larnaca': ['larnaca', 'larnaka'],
  'Paphos': ['paphos', 'pafos'],
  'Ayia Napa': ['ayia napa', 'agia napa', 'nissi beach'],
  'Kyrenia': ['kyrenia', 'girne'],
};

/**
 * Konum metnini normalize et
 */
function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .replace(/[,.\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Konum metninde havalimanı ara
 */
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

/**
 * Konum metninde şehir ara
 */
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

/**
 * Konum metninde ilçe/bölge ara
 */
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

/**
 * Alış ve bırakış konumlarına göre fiyat eşleştir
 */
export async function matchPrice(
  pickup: string,
  dropoff: string,
  vehicleType: string
): Promise<MatchResult> {
  try {
    // Alış ve bırakış konumlarını analiz et
    const pickupAirport = findAirport(pickup);
    const dropoffAirport = findAirport(dropoff);
    const pickupCity = findCity(pickup);
    const dropoffCity = findCity(dropoff);
    const pickupDistrict = findDistrict(pickup);
    const dropoffDistrict = findDistrict(dropoff);

    // Havalimanı transferi mi kontrol et (en yaygın durum)
    let airport: string | null = null;
    let district: string | null = null;
    let city: string | null = null;

    if (pickupAirport && dropoffDistrict) {
      // Havalimanından ilçeye
      airport = pickupAirport;
      district = dropoffDistrict;
      city = dropoffCity;
    } else if (dropoffAirport && pickupDistrict) {
      // İlçeden havalimanına
      airport = dropoffAirport;
      district = pickupDistrict;
      city = pickupCity;
    } else if (pickupAirport && dropoffCity) {
      // Havalimanından şehre (ilçe belirtilmemiş)
      airport = pickupAirport;
      city = dropoffCity;
    } else if (dropoffAirport && pickupCity) {
      // Şehirden havalimanına (ilçe belirtilmemiş)
      airport = dropoffAirport;
      city = pickupCity;
    }

    if (!city && !airport) {
      console.log('Price matching: No city or airport found in locations');
      return { found: false };
    }

    // Veritabanında fiyat ara
    let query = supabase
      .from('region_prices')
      .select('*')
      .eq('vehicle_type', vehicleType)
      .eq('is_active', true);

    if (city) {
      query = query.eq('city', city);
    }

    if (district) {
      query = query.eq('district', district);
    }

    if (airport) {
      query = query.eq('airport', airport);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Price matching query error:', error);
      return { found: false };
    }

    if (data && data.length > 0) {
      // En iyi eşleşmeyi bul (havalimanı + ilçe eşleşmesi öncelikli)
      let bestMatch = data[0];
      
      for (const price of data) {
        if (airport && price.airport === airport && district && price.district === district) {
          bestMatch = price;
          break;
        }
      }

      return {
        found: true,
        price: bestMatch.price,
        currency: bestMatch.price_currency,
        matchedCity: bestMatch.city,
        matchedDistrict: bestMatch.district,
        matchedAirport: bestMatch.airport || undefined,
      };
    }

    // İlçe eşleşmesi bulunamadıysa, sadece şehir + havalimanı ile dene
    if (city && airport && district) {
      const fallbackQuery = await supabase
        .from('region_prices')
        .select('*')
        .eq('city', city)
        .eq('airport', airport)
        .eq('vehicle_type', vehicleType)
        .eq('is_active', true)
        .limit(1);

      if (fallbackQuery.data && fallbackQuery.data.length > 0) {
        const fallback = fallbackQuery.data[0];
        return {
          found: true,
          price: fallback.price,
          currency: fallback.price_currency,
          matchedCity: fallback.city,
          matchedDistrict: fallback.district,
          matchedAirport: fallback.airport || undefined,
        };
      }
    }

    return { found: false };
  } catch (error) {
    console.error('Price matching error:', error);
    return { found: false };
  }
}

/**
 * Promosyon kodunu doğrula ve indirim uygula
 */
export function applyPromoDiscount(
  price: number,
  hasReturnTrip: boolean,
  promoCode: string | null
): { finalPrice: number; discountApplied: boolean; discountPercent: number } {
  // Sadece gidiş-dönüş ve "Meet40Return" kodu için %30 indirim
  if (hasReturnTrip && promoCode?.toUpperCase() === 'MEET40RETURN') {
    const discountPercent = 30;
    const discountAmount = price * (discountPercent / 100);
    return {
      finalPrice: price - discountAmount,
      discountApplied: true,
      discountPercent,
    };
  }

  return {
    finalPrice: price,
    discountApplied: false,
    discountPercent: 0,
  };
}
