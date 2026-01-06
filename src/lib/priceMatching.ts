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

export interface MatchResult {
  found: boolean;
  price?: number;
  currency?: string;
  matchedCity?: string;
  matchedDistrict?: string;
  matchedAirport?: string;
  confidence?: 'high' | 'medium' | 'low';
  matchType?: 'exact' | 'district_fallback' | 'city_fallback';
}

// Türkiye havalimanları eşleştirme - genişletilmiş
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

// Şehir eşleştirme - genişletilmiş
const CITY_KEYWORDS: Record<string, string[]> = {
  'Istanbul': [
    'istanbul', 'İstanbul', 'ist', 'constantinople', 'stanbul',
    // İstanbul ilçeleri - alış/bırakış için şehir tespiti
    'taksim', 'sultanahmet', 'kadikoy', 'kadıköy', 'besiktas', 'beşiktaş', 
    'sisli', 'şişli', 'fatih', 'beyoglu', 'beyoğlu', 'uskudar', 'üsküdar',
    'bakirkoy', 'bakırköy', 'atasehir', 'ataşehir', 'maltepe', 'pendik', 
    'kartal', 'sariyer', 'sarıyer', 'zeytinburnu', 'mecidiyekoy', 'mecidiyeköy',
    'levent', 'maslak', 'yenikoy', 'yeniköy', 'bebek', 'ortakoy', 'ortaköy',
    'nisantasi', 'nişantaşı', 'cihangir', 'galata', 'karakoy', 'karaköy',
    'eminonu', 'eminönü', 'balat', 'eyup', 'eyüp', 'florya', 'yesilkoy', 'yeşilköy'
  ],
  'Antalya': [
    'antalya', 'kaleici', 'kaleiçi', 'konyaalti', 'konyaaltı', 'lara', 
    'belek', 'side', 'alanya', 'kemer', 'kas', 'kaş', 'kalkan', 'manavgat',
    'serik', 'kundu', 'beldibi', 'goynuk', 'göynük', 'tekirova', 'cirali', 'çıralı',
    'olympos', 'kadriye', 'bogazkent', 'boğazkent', 'kumkoy', 'kumköy',
    'colakli', 'çolaklı', 'evrenseki', 'titreyengol', 'titreyen göl',
    'mahmutlar', 'okurcalar', 'avsallar', 'konakli', 'konaklı', 'incekum'
  ],
  'Bodrum': [
    'bodrum', 'yalikavak', 'yalıkavak', 'turgutreis', 'gumbet', 'gümbet', 
    'bitez', 'turkbuku', 'türkbükü', 'golturkbuku', 'göltürkbükü',
    'ortakent', 'gumusluk', 'gümüşlük', 'akyarlar', 'gundogan', 'gündoğan',
    'kadikalesi', 'torba', 'gulluk', 'güllük', 'konacik', 'konacık'
  ],
  'Dalaman': [
    'dalaman', 'fethiye', 'oludeniz', 'ölüdeniz', 'hisaronu', 'hisarönü', 
    'marmaris', 'gocek', 'göcek', 'dalyan', 'koycegiz', 'köyceğiz',
    'icmeler', 'içmeler', 'turunc', 'turunç', 'akyaka', 'ortaca',
    'ovacik', 'ovacık', 'calis', 'çalış', 'kayakoy', 'kayaköy',
    'saklikent', 'saklıkent', 'sarigerme', 'sarıgerme', 'ekincik'
  ],
  'Izmir': [
    'izmir', 'İzmir', 'cesme', 'çeşme', 'alacati', 'alaçatı', 
    'kusadasi', 'kuşadası', 'selcuk', 'selçuk', 'ephesus', 'efes',
    'urla', 'seferihisar', 'dikili', 'foca', 'foça', 'bergama',
    'sirince', 'şirince', 'konak', 'karsiyaka', 'karşıyaka', 'alsancak',
    'bornova', 'buca', 'guzelbahce', 'güzelbahçe', 'ildir', 'ildır'
  ],
  'Cappadocia': [
    'cappadocia', 'kapadokya', 'goreme', 'göreme', 'urgup', 'ürgüp', 
    'uchisar', 'uçhisar', 'avanos', 'nevsehir', 'nevşehir', 'kayseri',
    'ortahisar', 'cavusin', 'çavuşin', 'zelve', 'pasabag', 'paşabağ',
    'devrent', 'derinkuyu', 'kaymakli', 'kaymaklı', 'ihlara',
    'guzelyurt', 'güzelyurt', 'mustafapasa', 'mustafapaşa'
  ],
  'Bursa': [
    'bursa', 'mudanya', 'uludag', 'uludağ', 'cumalikizik', 'cumalıkızık', 
    'gemlik', 'iznik', 'osmangazi', 'nilufer', 'nilüfer', 'yildirim', 'yıldırım',
    'inegol', 'inegöl', 'orhangazi', 'kestel', 'gursu', 'gürsu'
  ],
  'Dubai': [
    'dubai', 'dubayy', 'palm jumeirah', 'dubai marina', 'downtown dubai', 
    'jbr', 'deira', 'bur dubai', 'business bay', 'difc', 'jumeirah',
    'jumeirah beach', 'al barsha', 'dubai hills', 'emirates hills',
    'arabian ranches', 'dubai creek', 'al quoz', 'jlt', 'motor city'
  ],
  'Cyprus': [
    'cyprus', 'kıbrıs', 'kibris', 'nicosia', 'lefkosa', 'lefkoşa', 
    'limassol', 'larnaca', 'paphos', 'famagusta', 'magusa', 'mağusa',
    'kyrenia', 'girne', 'ayia napa', 'protaras', 'paralimni', 'polis',
    'coral bay', 'latchi', 'troodos', 'platres'
  ],
};

// İlçe/bölge eşleştirme - genişletilmiş ve sıralı (öncelik sırasına göre)
const DISTRICT_KEYWORDS: Record<string, { keywords: string[], city: string }> = {
  // Istanbul - Avrupa Yakası
  'Taksim': { keywords: ['taksim', 'taksim square', 'taksim meydanı', 'taksim meydani'], city: 'Istanbul' },
  'Sultanahmet': { keywords: ['sultanahmet', 'blue mosque', 'hagia sophia', 'ayasofya', 'topkapi', 'topkapı', 'hippodrome'], city: 'Istanbul' },
  'Beyoglu': { keywords: ['beyoglu', 'beyoğlu', 'galata', 'karakoy', 'karaköy', 'cihangir', 'istiklal', 'pera'], city: 'Istanbul' },
  'Sisli': { keywords: ['sisli', 'şişli', 'mecidiyekoy', 'mecidiyeköy', 'nisantasi', 'nişantaşı', 'osmanbey'], city: 'Istanbul' },
  'Besiktas': { keywords: ['besiktas', 'beşiktaş', 'ortakoy', 'ortaköy', 'bebek', 'etiler', 'arnavutkoy', 'arnavutköy'], city: 'Istanbul' },
  'Fatih': { keywords: ['fatih', 'aksaray', 'laleli', 'eminonu', 'eminönü', 'sirkeci', 'sultanahmet', 'balat', 'fener'], city: 'Istanbul' },
  'Levent': { keywords: ['levent', 'maslak', '4. levent', 'zorlu', 'kanyon', 'sapphire'], city: 'Istanbul' },
  'Bakirkoy': { keywords: ['bakirkoy', 'bakırköy', 'florya', 'yesilkoy', 'yeşilköy', 'atakoy', 'ataköy'], city: 'Istanbul' },
  'Sariyer': { keywords: ['sariyer', 'sarıyer', 'istinye', 'tarabya', 'yenikoy', 'yeniköy', 'emirgan'], city: 'Istanbul' },
  
  // Istanbul - Anadolu Yakası
  'Kadikoy': { keywords: ['kadikoy', 'kadıköy', 'caferaga', 'caferağa', 'moda', 'fenerbahce', 'fenerbahçe', 'bostanci', 'bostancı'], city: 'Istanbul' },
  'Uskudar': { keywords: ['uskudar', 'üsküdar', 'cengelkoy', 'çengelköy', 'kuzguncuk', 'beylerbeyi'], city: 'Istanbul' },
  'Atasehir': { keywords: ['atasehir', 'ataşehir', 'finance center', 'finans merkezi', 'watergarden'], city: 'Istanbul' },
  'Pendik': { keywords: ['pendik', 'tuzla'], city: 'Istanbul' },
  'Kartal': { keywords: ['kartal', 'soganlik', 'soğanlık'], city: 'Istanbul' },
  'Maltepe': { keywords: ['maltepe', 'altayceşme', 'altaycesme', 'dragos'], city: 'Istanbul' },
  
  // Antalya
  'Kaleici': { keywords: ['kaleici', 'kaleiçi', 'old town antalya', 'old city antalya', 'antalya old town'], city: 'Antalya' },
  'Konyaalti': { keywords: ['konyaalti', 'konyaaltı', 'konyaalti beach', 'konyaaltı plajı'], city: 'Antalya' },
  'Lara': { keywords: ['lara', 'lara beach', 'kundu', 'lara plaji', 'lara plajı'], city: 'Antalya' },
  'Belek': { keywords: ['belek', 'kadriye', 'bogazkent', 'boğazkent', 'belek golf'], city: 'Antalya' },
  'Side': { keywords: ['side', 'kumkoy', 'kumköy', 'colakli', 'çolaklı', 'manavgat', 'evrenseki', 'titreyengol'], city: 'Antalya' },
  'Alanya': { keywords: ['alanya', 'mahmutlar', 'okurcalar', 'avsallar', 'konakli', 'konaklı', 'incekum', 'alanya castle'], city: 'Antalya' },
  'Kemer': { keywords: ['kemer', 'beldibi', 'goynuk', 'göynük', 'tekirova', 'cirali', 'çıralı', 'olympos', 'phaselis'], city: 'Antalya' },
  'Kas': { keywords: ['kas', 'kaş'], city: 'Antalya' },
  'Kalkan': { keywords: ['kalkan'], city: 'Antalya' },
  
  // Bodrum
  'Bodrum Center': { keywords: ['bodrum center', 'bodrum merkez', 'bodrum centrum', 'bodrum city', 'bodrum town', 'bodrum castle'], city: 'Bodrum' },
  'Yalikavak': { keywords: ['yalikavak', 'yalıkavak', 'palmarina', 'yalikavak marina'], city: 'Bodrum' },
  'Turgutreis': { keywords: ['turgutreis', 'turgut reis'], city: 'Bodrum' },
  'Gumbet': { keywords: ['gumbet', 'gümbet'], city: 'Bodrum' },
  'Turkbuku': { keywords: ['turkbuku', 'türkbükü', 'golturkbuku', 'göltürkbükü'], city: 'Bodrum' },
  'Bitez': { keywords: ['bitez', 'bitez beach'], city: 'Bodrum' },
  'Ortakent': { keywords: ['ortakent', 'ortakent yahsi'], city: 'Bodrum' },
  'Gumusluk': { keywords: ['gumusluk', 'gümüşlük', 'rabbit island'], city: 'Bodrum' },
  
  // Dalaman / Fethiye / Marmaris
  'Fethiye': { keywords: ['fethiye', 'fethiye marina', 'calis', 'çalış'], city: 'Dalaman' },
  'Oludeniz': { keywords: ['oludeniz', 'ölüdeniz', 'blue lagoon', 'hisaronu', 'hisarönü', 'ovacik', 'ovacık'], city: 'Dalaman' },
  'Marmaris': { keywords: ['marmaris', 'icmeler', 'içmeler', 'turunc', 'turunç', 'marmaris marina'], city: 'Dalaman' },
  'Gocek': { keywords: ['gocek', 'göcek', 'gocek marina'], city: 'Dalaman' },
  'Dalyan': { keywords: ['dalyan', 'koycegiz', 'köyceğiz', 'iztuzu', 'turtle beach'], city: 'Dalaman' },
  
  // Izmir
  'Cesme': { keywords: ['cesme', 'çeşme', 'ilica', 'ılıca', 'cesme marina'], city: 'Izmir' },
  'Alacati': { keywords: ['alacati', 'alaçatı'], city: 'Izmir' },
  'Kusadasi': { keywords: ['kusadasi', 'kuşadası', 'ladies beach', 'kadınlar denizi'], city: 'Izmir' },
  'Selcuk': { keywords: ['selcuk', 'selçuk', 'ephesus', 'efes', 'sirince', 'şirince'], city: 'Izmir' },
  'Alsancak': { keywords: ['alsancak', 'konak', 'kordon', 'pasaport'], city: 'Izmir' },
  'Urla': { keywords: ['urla'], city: 'Izmir' },
  
  // Cappadocia
  'Goreme': { keywords: ['goreme', 'göreme', 'goreme town'], city: 'Cappadocia' },
  'Urgup': { keywords: ['urgup', 'ürgüp'], city: 'Cappadocia' },
  'Uchisar': { keywords: ['uchisar', 'uçhisar', 'uchisar castle'], city: 'Cappadocia' },
  'Avanos': { keywords: ['avanos'], city: 'Cappadocia' },
  'Ortahisar': { keywords: ['ortahisar'], city: 'Cappadocia' },
  'Nevsehir': { keywords: ['nevsehir', 'nevşehir', 'nevsehir center'], city: 'Cappadocia' },
  
  // Bursa
  'Osmangazi': { keywords: ['osmangazi', 'bursa center', 'bursa merkez', 'heykel'], city: 'Bursa' },
  'Mudanya': { keywords: ['mudanya'], city: 'Bursa' },
  'Uludag': { keywords: ['uludag', 'uludağ', 'mount uludag'], city: 'Bursa' },
  'Cumalikizik': { keywords: ['cumalikizik', 'cumalıkızık'], city: 'Bursa' },
  'Iznik': { keywords: ['iznik', 'nicaea'], city: 'Bursa' },
  'Gemlik': { keywords: ['gemlik'], city: 'Bursa' },
  
  // Dubai
  'Downtown Dubai': { keywords: ['downtown', 'downtown dubai', 'burj khalifa', 'dubai mall', 'boulevard'], city: 'Dubai' },
  'Dubai Marina': { keywords: ['marina', 'dubai marina', 'jbr', 'jumeirah beach residence', 'the walk'], city: 'Dubai' },
  'Palm Jumeirah': { keywords: ['palm', 'palm jumeirah', 'atlantis', 'the palm'], city: 'Dubai' },
  'Deira': { keywords: ['deira', 'gold souk', 'spice souk', 'naif'], city: 'Dubai' },
  'Jumeirah': { keywords: ['jumeirah', 'jumeira', 'jumeirah beach', 'umm suqeim'], city: 'Dubai' },
  'Business Bay': { keywords: ['business bay', 'bay square'], city: 'Dubai' },
  'DIFC': { keywords: ['difc', 'dubai international financial centre', 'financial centre'], city: 'Dubai' },
  'Al Barsha': { keywords: ['al barsha', 'mall of emirates', 'barsha'], city: 'Dubai' },
  
  // Cyprus
  'Nicosia': { keywords: ['nicosia', 'lefkosa', 'lefkoşa', 'north nicosia', 'south nicosia'], city: 'Cyprus' },
  'Limassol': { keywords: ['limassol', 'lemesos', 'limassol marina'], city: 'Cyprus' },
  'Larnaca City': { keywords: ['larnaca', 'larnaka', 'larnaca center'], city: 'Cyprus' },
  'Paphos': { keywords: ['paphos', 'pafos', 'kato paphos', 'coral bay'], city: 'Cyprus' },
  'Ayia Napa': { keywords: ['ayia napa', 'agia napa', 'nissi beach', 'napa'], city: 'Cyprus' },
  'Kyrenia': { keywords: ['kyrenia', 'girne', 'bellapais'], city: 'Cyprus' },
  'Protaras': { keywords: ['protaras', 'fig tree bay', 'paralimni'], city: 'Cyprus' },
};

/**
 * Konum metnini normalize et - daha agresif normalizasyon
 */
function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .replace(/türkiye|turkey|türkei/gi, '')
    .replace(/,\s*tr$/i, '')
    .replace(/\(.*?\)/g, '') // Parantez içlerini temizle
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

/**
 * Fuzzy string matching - iki string arasındaki benzerliği hesapla
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeLocation(str1);
  const s2 = normalizeLocation(str2);
  
  // Tam eşleşme
  if (s1 === s2) return 1;
  
  // İçerik kontrolü
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Levenshtein distance hesapla (basit implementasyon)
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  // Çok uzun stringleri karşılaştırma
  if (Math.abs(len1 - len2) > 10) return 0;
  
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= len2; j++) {
      if (i === 0) {
        matrix[i][j] = j;
      } else {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return 1 - (matrix[len1][len2] / maxLen);
}

/**
 * Konum metninde havalimanı ara - geliştirilmiş
 */
function findAirport(location: string): { airport: string; confidence: number } | null {
  const normalized = normalizeLocation(location);
  
  let bestMatch: { airport: string; confidence: number } | null = null;
  
  for (const [airport, keywords] of Object.entries(AIRPORT_KEYWORDS)) {
    for (const keyword of keywords) {
      const keywordNormalized = normalizeLocation(keyword);
      
      // Tam eşleşme
      if (normalized.includes(keywordNormalized)) {
        const confidence = keywordNormalized.length >= 5 ? 1 : 0.9;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { airport, confidence };
        }
      }
      
      // Fuzzy eşleşme
      const similarity = calculateSimilarity(keywordNormalized, normalized);
      if (similarity >= 0.8) {
        if (!bestMatch || similarity > bestMatch.confidence) {
          bestMatch = { airport, confidence: similarity };
        }
      }
    }
  }
  
  return bestMatch;
}

/**
 * Konum metninde şehir ara - geliştirilmiş
 */
function findCity(location: string): { city: string; confidence: number } | null {
  const normalized = normalizeLocation(location);
  
  let bestMatch: { city: string; confidence: number } | null = null;
  
  for (const [city, keywords] of Object.entries(CITY_KEYWORDS)) {
    for (const keyword of keywords) {
      const keywordNormalized = normalizeLocation(keyword);
      
      if (normalized.includes(keywordNormalized)) {
        const confidence = keywordNormalized.length >= 4 ? 1 : 0.85;
        if (!bestMatch || confidence > bestMatch.confidence || 
            (confidence === bestMatch.confidence && keyword.length > 3)) {
          bestMatch = { city, confidence };
        }
      }
    }
  }
  
  return bestMatch;
}

/**
 * Konum metninde ilçe/bölge ara - geliştirilmiş
 */
function findDistrict(location: string): { district: string; city: string; confidence: number } | null {
  const normalized = normalizeLocation(location);
  
  let bestMatch: { district: string; city: string; confidence: number } | null = null;
  
  for (const [district, data] of Object.entries(DISTRICT_KEYWORDS)) {
    for (const keyword of data.keywords) {
      const keywordNormalized = normalizeLocation(keyword);
      
      if (normalized.includes(keywordNormalized)) {
        const confidence = keywordNormalized.length >= 4 ? 1 : 0.85;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { district, city: data.city, confidence };
        }
      }
      
      // Fuzzy match for districts
      const similarity = calculateSimilarity(keywordNormalized, normalized.split(' ').find(w => w.length > 3) || '');
      if (similarity >= 0.85) {
        if (!bestMatch || similarity > bestMatch.confidence) {
          bestMatch = { district, city: data.city, confidence: similarity };
        }
      }
    }
  }
  
  return bestMatch;
}

/**
 * Google Maps konum bileşenlerini parse et
 */
function parseGoogleMapsLocation(location: string): {
  airport: string | null;
  city: string | null;
  district: string | null;
  originalParts: string[];
} {
  const parts = location.split(',').map(p => p.trim());
  
  const airportMatch = findAirport(location);
  const cityMatch = findCity(location);
  const districtMatch = findDistrict(location);
  
  return {
    airport: airportMatch?.airport || null,
    city: cityMatch?.city || districtMatch?.city || null,
    district: districtMatch?.district || null,
    originalParts: parts,
  };
}

/**
 * Alış ve bırakış konumlarına göre fiyat eşleştir - geliştirilmiş
 */
export async function matchPrice(
  pickup: string,
  dropoff: string,
  vehicleType: string
): Promise<MatchResult> {
  try {
    console.log('🔍 Price matching started:', { pickup, dropoff, vehicleType });
    
    // Konum analizleri
    const pickupParsed = parseGoogleMapsLocation(pickup);
    const dropoffParsed = parseGoogleMapsLocation(dropoff);
    
    console.log('📍 Parsed locations:', { pickupParsed, dropoffParsed });
    
    // Transfer yönünü belirle
    let airport: string | null = null;
    let district: string | null = null;
    let city: string | null = null;
    let transferDirection: 'from_airport' | 'to_airport' | 'city_to_city' = 'city_to_city';
    
    if (pickupParsed.airport && dropoffParsed.district) {
      // Havalimanından ilçeye
      airport = pickupParsed.airport;
      district = dropoffParsed.district;
      city = dropoffParsed.city;
      transferDirection = 'from_airport';
    } else if (dropoffParsed.airport && pickupParsed.district) {
      // İlçeden havalimanına
      airport = dropoffParsed.airport;
      district = pickupParsed.district;
      city = pickupParsed.city;
      transferDirection = 'to_airport';
    } else if (pickupParsed.airport && dropoffParsed.city) {
      // Havalimanından şehre (ilçe belirtilmemiş)
      airport = pickupParsed.airport;
      city = dropoffParsed.city;
      transferDirection = 'from_airport';
    } else if (dropoffParsed.airport && pickupParsed.city) {
      // Şehirden havalimanına (ilçe belirtilmemiş)
      airport = dropoffParsed.airport;
      city = pickupParsed.city;
      transferDirection = 'to_airport';
    }
    
    console.log('🚗 Transfer direction:', { transferDirection, airport, city, district });
    
    if (!city && !airport) {
      console.log('❌ No city or airport found in locations');
      return { found: false };
    }
    
    // 1. Önce tam eşleşme dene (airport + city + district + vehicle)
    if (airport && city && district) {
      const { data: exactMatch, error } = await supabase
        .from('region_prices')
        .select('*')
        .eq('city', city)
        .eq('airport', airport)
        .eq('district', district)
        .eq('vehicle_type', vehicleType)
        .eq('is_active', true)
        .limit(1);
      
      if (!error && exactMatch && exactMatch.length > 0) {
        console.log('✅ Exact match found:', exactMatch[0]);
        return {
          found: true,
          price: exactMatch[0].price,
          currency: exactMatch[0].price_currency,
          matchedCity: exactMatch[0].city,
          matchedDistrict: exactMatch[0].district,
          matchedAirport: exactMatch[0].airport || undefined,
          confidence: 'high',
          matchType: 'exact',
        };
      }
    }
    
    // 2. İlçe olmadan dene (airport + city + vehicle)
    if (airport && city) {
      const { data: cityMatch, error } = await supabase
        .from('region_prices')
        .select('*')
        .eq('city', city)
        .eq('airport', airport)
        .eq('vehicle_type', vehicleType)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(5);
      
      if (!error && cityMatch && cityMatch.length > 0) {
        // En yakın ilçeyi bul veya ilk fiyatı kullan
        let bestPrice = cityMatch[0];
        
        if (district) {
          // District benzerliği ile en iyiyi bul
          for (const price of cityMatch) {
            const similarity = calculateSimilarity(price.district, district);
            if (similarity > 0.7) {
              bestPrice = price;
              break;
            }
          }
        }
        
        console.log('✅ City+Airport match found:', bestPrice);
        return {
          found: true,
          price: bestPrice.price,
          currency: bestPrice.price_currency,
          matchedCity: bestPrice.city,
          matchedDistrict: bestPrice.district,
          matchedAirport: bestPrice.airport || undefined,
          confidence: district ? 'medium' : 'low',
          matchType: 'district_fallback',
        };
      }
    }
    
    // 3. Sadece şehir ile dene (herhangi bir havalimanı)
    if (city) {
      const { data: cityOnlyMatch, error } = await supabase
        .from('region_prices')
        .select('*')
        .eq('city', city)
        .eq('vehicle_type', vehicleType)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(1);
      
      if (!error && cityOnlyMatch && cityOnlyMatch.length > 0) {
        console.log('✅ City-only fallback match found:', cityOnlyMatch[0]);
        return {
          found: true,
          price: cityOnlyMatch[0].price,
          currency: cityOnlyMatch[0].price_currency,
          matchedCity: cityOnlyMatch[0].city,
          matchedDistrict: cityOnlyMatch[0].district,
          matchedAirport: cityOnlyMatch[0].airport || undefined,
          confidence: 'low',
          matchType: 'city_fallback',
        };
      }
    }
    
    console.log('❌ No price match found');
    return { found: false };
    
  } catch (error) {
    console.error('❌ Price matching error:', error);
    return { found: false };
  }
}

/**
 * Fiyat eşleştirme testi - admin paneli için
 */
export async function testPriceMatch(
  pickup: string,
  dropoff: string,
  vehicleType: string
): Promise<{
  result: MatchResult;
  analysis: {
    pickup: ReturnType<typeof parseGoogleMapsLocation>;
    dropoff: ReturnType<typeof parseGoogleMapsLocation>;
  };
}> {
  const pickupParsed = parseGoogleMapsLocation(pickup);
  const dropoffParsed = parseGoogleMapsLocation(dropoff);
  const result = await matchPrice(pickup, dropoff, vehicleType);
  
  return {
    result,
    analysis: {
      pickup: pickupParsed,
      dropoff: dropoffParsed,
    },
  };
}

/**
 * Promosyon kodunu doğrula ve indirim uygula
 */
export function applyPromoDiscount(
  price: number,
  hasReturnTrip: boolean,
  promoCode: string | null
): { finalPrice: number; discountApplied: boolean; discountPercent: number } {
  // Gidiş-dönüş indirimi - "Meet40Return" veya "GIDISDONUS" kodları
  const validCodes = ['MEET40RETURN', 'GIDISDONUS', 'RETURN30'];
  
  if (hasReturnTrip && promoCode && validCodes.includes(promoCode.toUpperCase())) {
    const discountPercent = 30;
    const discountAmount = Math.round(price * (discountPercent / 100));
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

/**
 * Toplam fiyat hesapla (gidiş + dönüş)
 */
export function calculateTotalPrice(
  basePrice: number,
  hasReturnTrip: boolean,
  promoCode: string | null
): {
  oneWayPrice: number;
  returnPrice: number | null;
  totalPrice: number;
  discountApplied: boolean;
  discountPercent: number;
  savings: number;
} {
  const oneWayPrice = basePrice;
  
  if (!hasReturnTrip) {
    return {
      oneWayPrice,
      returnPrice: null,
      totalPrice: basePrice,
      discountApplied: false,
      discountPercent: 0,
      savings: 0,
    };
  }
  
  const { finalPrice: discountedReturn, discountApplied, discountPercent } = applyPromoDiscount(
    basePrice,
    true,
    promoCode
  );
  
  const returnPrice = discountApplied ? discountedReturn : basePrice;
  const totalPrice = oneWayPrice + returnPrice;
  const originalTotal = basePrice * 2;
  const savings = originalTotal - totalPrice;
  
  return {
    oneWayPrice,
    returnPrice,
    totalPrice,
    discountApplied,
    discountPercent,
    savings,
  };
}
