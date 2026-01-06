// Shared price matching utilities for edge functions
// Optimized location matching with fuzzy search and priority ordering

// ==================== AIRPORT KEYWORDS ====================
export const AIRPORT_KEYWORDS: Record<string, { keywords: string[]; priority: number }> = {
  'Istanbul Airport (IST)': {
    priority: 1,
    keywords: [
      'istanbul airport', 'ist airport', 'istanbul havalimanı', 'istanbul havalimani', 
      'ist', 'new istanbul airport', 'yeni istanbul havalimanı', 'arnavutköy', 'arnavutkoy',
      'istanbul new airport', 'istanbul uluslararasi havalimani', 'istanbul international',
      'istanbul havaalani', 'iğa', 'iga'
    ]
  },
  'Sabiha Gokcen Airport (SAW)': {
    priority: 2,
    keywords: [
      'sabiha', 'saw', 'sabiha gökçen', 'sabiha gokcen', 'sabiha gokçen', 
      'sabiha gokcen airport', 'saw airport', 'sabiha gökçen havalimanı', 'kurtköy', 'kurtkoy',
      'sabiha gokcen havalimani', 'sabiha gocken'
    ]
  },
  'Antalya Airport (AYT)': {
    priority: 1,
    keywords: [
      'antalya airport', 'ayt', 'antalya havalimanı', 'antalya havalimani',
      'antalya international', 'ayt airport', 'antalya havaalani'
    ]
  },
  'Bodrum-Milas Airport (BJV)': {
    priority: 1,
    keywords: [
      'bodrum airport', 'milas airport', 'bjv', 'bodrum milas', 'milas bodrum',
      'bodrum havalimanı', 'milas havalimanı', 'bodrum milas havalimani',
      'milas bodrum airport'
    ]
  },
  'Dalaman Airport (DLM)': {
    priority: 1,
    keywords: [
      'dalaman airport', 'dlm', 'dalaman havalimanı', 'dalaman havalimani'
    ]
  },
  'Izmir Adnan Menderes Airport (ADB)': {
    priority: 1,
    keywords: [
      'izmir airport', 'adnan menderes', 'adb', 'izmir adb', 'izmir havalimanı',
      'adnan menderes airport', 'adnan menderes havalimanı', 'izmir adnan menderes'
    ]
  },
  'Kayseri Airport (ASR)': {
    priority: 1,
    keywords: [
      'kayseri airport', 'asr', 'kayseri havalimanı', 'kayseri havalimani',
      'erkilet', 'erkilet airport'
    ]
  },
  'Nevsehir-Kapadokya Airport (NAV)': {
    priority: 1,
    keywords: [
      'nevsehir airport', 'nevşehir havalimanı', 'kapadokya airport', 'nav',
      'cappadocia airport', 'kapadokya havalimanı', 'kapadokya havalimani'
    ]
  },
  'Dubai International Airport (DXB)': {
    priority: 1,
    keywords: [
      'dubai international', 'dxb', 'dubai airport', 'dubai havalimanı',
      'dubai dxb', 'dubai international airport'
    ]
  },
  'Al Maktoum International Airport (DWC)': {
    priority: 2,
    keywords: [
      'al maktoum', 'dwc', 'maktoum airport', 'dwc airport',
      'dubai world central', 'dubai south', 'jebel ali airport'
    ]
  },
  'Larnaca Airport (LCA)': {
    priority: 1,
    keywords: [
      'larnaca airport', 'lca', 'larnaca havalimanı', 'larnaka airport'
    ]
  },
  'Paphos Airport (PFO)': {
    priority: 2,
    keywords: [
      'paphos airport', 'pfo', 'pafos airport', 'baf havalimanı'
    ]
  },
  'Ercan Airport (ECN)': {
    priority: 1,
    keywords: [
      'ercan airport', 'ecn', 'ercan havalimanı', 'lefkoşa havalimanı', 'lefkosa airport'
    ]
  },
  'Bursa Yenisehir Airport (YEI)': {
    priority: 1,
    keywords: [
      'bursa airport', 'yenisehir airport', 'yei', 'bursa havalimanı', 'yenişehir',
      'bursa yenisehir', 'yenisehir havalimani'
    ]
  },
};

// ==================== CITY KEYWORDS ====================
export const CITY_KEYWORDS: Record<string, { keywords: string[]; priority: number }> = {
  'Istanbul': {
    priority: 1,
    keywords: [
      'istanbul', 'İstanbul', 'constantinople', 'stanbul',
      'taksim', 'sultanahmet', 'kadikoy', 'kadıköy', 'besiktas', 'beşiktaş', 
      'sisli', 'şişli', 'fatih', 'beyoglu', 'beyoğlu', 'uskudar', 'üsküdar',
      'bakirkoy', 'bakırköy', 'atasehir', 'ataşehir', 'maltepe', 'pendik', 
      'kartal', 'sariyer', 'sarıyer', 'zeytinburnu', 'mecidiyekoy', 'mecidiyeköy',
      'levent', 'maslak', 'yenikoy', 'yeniköy', 'bebek', 'ortakoy', 'ortaköy',
      'nisantasi', 'nişantaşı', 'cihangir', 'galata', 'karakoy', 'karaköy',
      'eminonu', 'eminönü', 'balat', 'eyup', 'eyüp', 'florya', 'yesilkoy', 'yeşilköy'
    ]
  },
  'Antalya': {
    priority: 1,
    keywords: [
      'antalya', 'kaleici', 'kaleiçi', 'konyaalti', 'konyaaltı', 'lara', 
      'belek', 'side', 'alanya', 'kemer', 'kas', 'kaş', 'kalkan', 'manavgat',
      'serik', 'kundu', 'beldibi', 'goynuk', 'göynük', 'tekirova', 'cirali', 'çıralı',
      'olympos', 'kadriye', 'bogazkent', 'boğazkent', 'kumkoy', 'kumköy',
      'colakli', 'çolaklı', 'evrenseki', 'titreyengol', 'mahmutlar', 'okurcalar',
      'avsallar', 'konakli', 'konaklı', 'incekum'
    ]
  },
  'Bodrum': {
    priority: 1,
    keywords: [
      'bodrum', 'yalikavak', 'yalıkavak', 'turgutreis', 'gumbet', 'gümbet', 
      'bitez', 'turkbuku', 'türkbükü', 'golturkbuku', 'göltürkbükü',
      'ortakent', 'gumusluk', 'gümüşlük', 'akyarlar', 'gundogan', 'gündoğan',
      'kadikalesi', 'torba', 'gulluk', 'güllük', 'konacik', 'konacık'
    ]
  },
  'Dalaman': {
    priority: 1,
    keywords: [
      'dalaman', 'fethiye', 'oludeniz', 'ölüdeniz', 'hisaronu', 'hisarönü', 
      'marmaris', 'gocek', 'göcek', 'dalyan', 'koycegiz', 'köyceğiz',
      'icmeler', 'içmeler', 'turunc', 'turunç', 'akyaka', 'ortaca',
      'ovacik', 'ovacık', 'calis', 'çalış', 'kayakoy', 'kayaköy',
      'saklikent', 'saklıkent', 'sarigerme', 'sarıgerme', 'ekincik'
    ]
  },
  'Izmir': {
    priority: 1,
    keywords: [
      'izmir', 'İzmir', 'cesme', 'çeşme', 'alacati', 'alaçatı', 
      'kusadasi', 'kuşadası', 'selcuk', 'selçuk', 'ephesus', 'efes',
      'urla', 'seferihisar', 'dikili', 'foca', 'foça', 'bergama',
      'sirince', 'şirince', 'konak', 'karsiyaka', 'karşıyaka', 'alsancak',
      'bornova', 'buca', 'guzelbahce', 'güzelbahçe', 'ildir', 'ildır'
    ]
  },
  'Cappadocia': {
    priority: 1,
    keywords: [
      'cappadocia', 'kapadokya', 'goreme', 'göreme', 'urgup', 'ürgüp', 
      'uchisar', 'uçhisar', 'avanos', 'ortahisar', 'cavusin', 'çavuşin',
      'zelve', 'pasabag', 'paşabağ', 'devrent', 'derinkuyu', 'kaymakli',
      'kaymaklı', 'ihlara', 'guzelyurt', 'güzelyurt', 'mustafapasa', 'mustafapaşa'
    ]
  },
  'Bursa': {
    priority: 1,
    keywords: [
      'bursa', 'mudanya', 'uludag', 'uludağ', 'cumalikizik', 'cumalıkızık', 
      'gemlik', 'iznik', 'osmangazi', 'nilufer', 'nilüfer', 'yildirim', 'yıldırım',
      'inegol', 'inegöl', 'orhangazi', 'kestel', 'gursu', 'gürsu'
    ]
  },
  'Dubai': {
    priority: 1,
    keywords: [
      'dubai', 'dubayy', 'palm jumeirah', 'dubai marina', 'downtown dubai', 
      'jbr', 'deira', 'bur dubai', 'business bay', 'difc', 'jumeirah',
      'jumeirah beach', 'al barsha', 'dubai hills', 'emirates hills',
      'arabian ranches', 'dubai creek', 'al quoz', 'jlt', 'motor city'
    ]
  },
  'Cyprus': {
    priority: 1,
    keywords: [
      'cyprus', 'kıbrıs', 'kibris', 'nicosia', 'lefkosa', 'lefkoşa', 
      'limassol', 'larnaca', 'paphos', 'famagusta', 'magusa', 'mağusa',
      'kyrenia', 'girne', 'ayia napa', 'protaras', 'paralimni', 'polis',
      'coral bay', 'latchi', 'troodos', 'platres'
    ]
  },
  // Kayseri and Nevsehir redirect to Cappadocia
  'Kayseri': {
    priority: 2,
    keywords: ['kayseri']
  },
  'Nevsehir': {
    priority: 2,
    keywords: ['nevsehir', 'nevşehir']
  },
};

// ==================== DISTRICT KEYWORDS ====================
export const DISTRICT_KEYWORDS: Record<string, { keywords: string[]; city: string; priority: number }> = {
  // Istanbul - Avrupa Yakası (High Priority)
  'Taksim': { priority: 1, keywords: ['taksim', 'taksim square', 'taksim meydanı', 'taksim meydani'], city: 'Istanbul' },
  'Sultanahmet': { priority: 1, keywords: ['sultanahmet', 'blue mosque', 'hagia sophia', 'ayasofya', 'topkapi', 'topkapı', 'hippodrome'], city: 'Istanbul' },
  'Beyoglu': { priority: 1, keywords: ['beyoglu', 'beyoğlu', 'galata', 'karakoy', 'karaköy', 'cihangir', 'istiklal', 'pera'], city: 'Istanbul' },
  'Sisli': { priority: 1, keywords: ['sisli', 'şişli', 'mecidiyekoy', 'mecidiyeköy', 'nisantasi', 'nişantaşı', 'osmanbey', 'bomonti'], city: 'Istanbul' },
  'Besiktas': { priority: 1, keywords: ['besiktas', 'beşiktaş', 'ortakoy', 'ortaköy', 'bebek', 'etiler', 'levent'], city: 'Istanbul' },
  'Fatih': { priority: 1, keywords: ['fatih', 'aksaray', 'laleli', 'eminonu', 'eminönü', 'sirkeci', 'balat', 'fener'], city: 'Istanbul' },
  'Levent': { priority: 2, keywords: ['levent', 'maslak', '4. levent', 'zorlu', 'kanyon', 'sapphire'], city: 'Istanbul' },
  'Bakirkoy': { priority: 1, keywords: ['bakirkoy', 'bakırköy', 'florya', 'yesilkoy', 'yeşilköy', 'atakoy', 'ataköy'], city: 'Istanbul' },
  'Sariyer': { priority: 2, keywords: ['sariyer', 'sarıyer', 'istinye', 'tarabya', 'yenikoy', 'yeniköy', 'emirgan'], city: 'Istanbul' },
  
  // Istanbul - Anadolu Yakası
  'Kadikoy': { priority: 1, keywords: ['kadikoy', 'kadıköy', 'caferaga', 'caferağa', 'moda', 'fenerbahce', 'fenerbahçe', 'bostanci', 'bostancı'], city: 'Istanbul' },
  'Uskudar': { priority: 1, keywords: ['uskudar', 'üsküdar', 'cengelkoy', 'çengelköy', 'kuzguncuk', 'beylerbeyi'], city: 'Istanbul' },
  'Atasehir': { priority: 1, keywords: ['atasehir', 'ataşehir', 'finance center', 'finans merkezi', 'watergarden'], city: 'Istanbul' },
  'Pendik': { priority: 2, keywords: ['pendik', 'tuzla'], city: 'Istanbul' },
  'Kartal': { priority: 2, keywords: ['kartal', 'soganlik', 'soğanlık'], city: 'Istanbul' },
  'Maltepe': { priority: 2, keywords: ['maltepe', 'altaycesme', 'dragos'], city: 'Istanbul' },
  
  // Antalya
  'Kaleici': { priority: 1, keywords: ['kaleici', 'kaleiçi', 'old town antalya', 'old city antalya', 'antalya old town'], city: 'Antalya' },
  'Konyaalti': { priority: 1, keywords: ['konyaalti', 'konyaaltı', 'konyaalti beach', 'konyaaltı plajı', 'konyaalti plaji'], city: 'Antalya' },
  'Lara': { priority: 1, keywords: ['lara', 'lara beach', 'kundu', 'lara plaji', 'lara plajı'], city: 'Antalya' },
  'Belek': { priority: 1, keywords: ['belek', 'kadriye', 'bogazkent', 'boğazkent', 'belek golf'], city: 'Antalya' },
  'Side': { priority: 1, keywords: ['side', 'kumkoy', 'kumköy', 'colakli', 'çolaklı', 'manavgat', 'evrenseki', 'titreyengol', 'titreyen gol'], city: 'Antalya' },
  'Alanya': { priority: 1, keywords: ['alanya', 'mahmutlar', 'okurcalar', 'avsallar', 'konakli', 'konaklı', 'incekum', 'alanya castle'], city: 'Antalya' },
  'Kemer': { priority: 1, keywords: ['kemer', 'beldibi', 'goynuk', 'göynük', 'tekirova', 'cirali', 'çıralı', 'olympos', 'phaselis', 'camyuva'], city: 'Antalya' },
  'Kas': { priority: 1, keywords: ['kas', 'kaş', 'kalkan', 'patara'], city: 'Antalya' },
  
  // Bodrum
  'Bodrum Center': { priority: 1, keywords: ['bodrum center', 'bodrum merkez', 'bodrum centrum', 'bodrum city', 'bodrum town', 'bodrum castle', 'bodrum marina'], city: 'Bodrum' },
  'Yalikavak': { priority: 1, keywords: ['yalikavak', 'yalıkavak', 'palmarina', 'yalikavak marina'], city: 'Bodrum' },
  'Turgutreis': { priority: 1, keywords: ['turgutreis', 'turgut reis', 'turgutreis marina'], city: 'Bodrum' },
  'Gumbet': { priority: 1, keywords: ['gumbet', 'gümbet'], city: 'Bodrum' },
  'Turkbuku': { priority: 1, keywords: ['turkbuku', 'türkbükü', 'golturkbuku', 'göltürkbükü'], city: 'Bodrum' },
  'Bitez': { priority: 1, keywords: ['bitez', 'bitez beach'], city: 'Bodrum' },
  'Ortakent': { priority: 2, keywords: ['ortakent', 'ortakent yahsi', 'yahsi'], city: 'Bodrum' },
  'Gumusluk': { priority: 1, keywords: ['gumusluk', 'gümüşlük', 'rabbit island'], city: 'Bodrum' },
  
  // Dalaman / Fethiye / Marmaris
  'Fethiye': { priority: 1, keywords: ['fethiye', 'fethiye marina', 'calis', 'çalış', 'calis beach'], city: 'Dalaman' },
  'Oludeniz': { priority: 1, keywords: ['oludeniz', 'ölüdeniz', 'blue lagoon', 'hisaronu', 'hisarönü', 'ovacik', 'ovacık'], city: 'Dalaman' },
  'Marmaris': { priority: 1, keywords: ['marmaris', 'icmeler', 'içmeler', 'turunc', 'turunç', 'marmaris marina', 'marmaris center'], city: 'Dalaman' },
  'Gocek': { priority: 1, keywords: ['gocek', 'göcek', 'gocek marina'], city: 'Dalaman' },
  'Dalyan': { priority: 1, keywords: ['dalyan', 'koycegiz', 'köyceğiz', 'iztuzu', 'turtle beach'], city: 'Dalaman' },
  
  // Izmir
  'Cesme': { priority: 1, keywords: ['cesme', 'çeşme', 'ilica', 'ılıca', 'cesme marina'], city: 'Izmir' },
  'Alacati': { priority: 1, keywords: ['alacati', 'alaçatı'], city: 'Izmir' },
  'Kusadasi': { priority: 1, keywords: ['kusadasi', 'kuşadası', 'ladies beach', 'kadınlar denizi', 'kusadasi marina'], city: 'Izmir' },
  'Selcuk': { priority: 1, keywords: ['selcuk', 'selçuk', 'ephesus', 'efes', 'sirince', 'şirince'], city: 'Izmir' },
  'Alsancak': { priority: 1, keywords: ['alsancak', 'konak', 'kordon', 'pasaport', 'izmir center'], city: 'Izmir' },
  
  // Cappadocia
  'Goreme': { priority: 1, keywords: ['goreme', 'göreme', 'goreme town'], city: 'Cappadocia' },
  'Urgup': { priority: 1, keywords: ['urgup', 'ürgüp'], city: 'Cappadocia' },
  'Uchisar': { priority: 1, keywords: ['uchisar', 'uçhisar', 'uchisar castle'], city: 'Cappadocia' },
  'Avanos': { priority: 1, keywords: ['avanos'], city: 'Cappadocia' },
  'Ortahisar': { priority: 2, keywords: ['ortahisar'], city: 'Cappadocia' },
  'Nevsehir Center': { priority: 2, keywords: ['nevsehir center', 'nevşehir merkez', 'nevsehir merkez'], city: 'Cappadocia' },
  
  // Bursa
  'Osmangazi': { priority: 1, keywords: ['osmangazi', 'bursa center', 'bursa merkez', 'heykel', 'bursa city'], city: 'Bursa' },
  'Mudanya': { priority: 1, keywords: ['mudanya'], city: 'Bursa' },
  'Uludag': { priority: 1, keywords: ['uludag', 'uludağ', 'mount uludag'], city: 'Bursa' },
  'Cumalikizik': { priority: 1, keywords: ['cumalikizik', 'cumalıkızık'], city: 'Bursa' },
  'Iznik': { priority: 2, keywords: ['iznik', 'nicaea'], city: 'Bursa' },
  
  // Dubai
  'Downtown Dubai': { priority: 1, keywords: ['downtown', 'downtown dubai', 'burj khalifa', 'dubai mall', 'boulevard'], city: 'Dubai' },
  'Dubai Marina': { priority: 1, keywords: ['marina', 'dubai marina', 'jbr', 'jumeirah beach residence', 'the walk'], city: 'Dubai' },
  'Palm Jumeirah': { priority: 1, keywords: ['palm', 'palm jumeirah', 'atlantis', 'the palm'], city: 'Dubai' },
  'Deira': { priority: 2, keywords: ['deira', 'gold souk', 'spice souk', 'naif'], city: 'Dubai' },
  'Jumeirah': { priority: 1, keywords: ['jumeirah', 'jumeira', 'jumeirah beach', 'umm suqeim'], city: 'Dubai' },
  'Business Bay': { priority: 2, keywords: ['business bay', 'bay square'], city: 'Dubai' },
  
  // Cyprus
  'Nicosia': { priority: 1, keywords: ['nicosia', 'lefkosa', 'lefkoşa', 'north nicosia', 'south nicosia'], city: 'Cyprus' },
  'Limassol': { priority: 1, keywords: ['limassol', 'lemesos', 'limassol marina'], city: 'Cyprus' },
  'Larnaca City': { priority: 1, keywords: ['larnaca city', 'larnaca center', 'larnaka', 'larnaca'], city: 'Cyprus' },
  'Paphos City': { priority: 1, keywords: ['paphos', 'pafos', 'kato paphos', 'coral bay'], city: 'Cyprus' },
  'Ayia Napa': { priority: 1, keywords: ['ayia napa', 'agia napa', 'nissi beach', 'napa'], city: 'Cyprus' },
  'Kyrenia': { priority: 1, keywords: ['kyrenia', 'girne', 'bellapais'], city: 'Cyprus' },
  'Protaras': { priority: 1, keywords: ['protaras', 'fig tree bay', 'paralimni'], city: 'Cyprus' },
};

// ==================== NORMALIZATION ====================
export function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .replace(/türkiye|turkey|türkei|turkiye/gi, '')
    .replace(/,\s*(tr|turkey)$/i, '')
    .replace(/\(.*?\)/g, '') // Remove parentheses content
    .replace(/[,.\-_\/\\#&]/g, ' ')
    .replace(/\s+/g, ' ')
    // Turkish character normalization
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c')
    .trim();
}

// ==================== MATCHING FUNCTIONS ====================
export interface MatchResult {
  value: string;
  confidence: number;
  priority: number;
  matchedKeyword: string;
}

export function findAirport(location: string): MatchResult | null {
  const normalized = normalizeLocation(location);
  let bestMatch: MatchResult | null = null;
  
  for (const [airport, data] of Object.entries(AIRPORT_KEYWORDS)) {
    for (const keyword of data.keywords) {
      const keywordNorm = normalizeLocation(keyword);
      
      if (normalized.includes(keywordNorm)) {
        // Calculate confidence based on keyword length and specificity
        const confidence = Math.min(1, 0.7 + (keywordNorm.length / 30));
        
        if (!bestMatch || 
            confidence > bestMatch.confidence || 
            (confidence === bestMatch.confidence && data.priority < bestMatch.priority)) {
          bestMatch = {
            value: airport,
            confidence,
            priority: data.priority,
            matchedKeyword: keyword
          };
        }
      }
    }
  }
  
  return bestMatch;
}

export function findCity(location: string): MatchResult | null {
  const normalized = normalizeLocation(location);
  let bestMatch: MatchResult | null = null;
  
  for (const [city, data] of Object.entries(CITY_KEYWORDS)) {
    for (const keyword of data.keywords) {
      const keywordNorm = normalizeLocation(keyword);
      
      if (normalized.includes(keywordNorm)) {
        const confidence = Math.min(1, 0.6 + (keywordNorm.length / 20));
        
        if (!bestMatch || 
            confidence > bestMatch.confidence || 
            (confidence === bestMatch.confidence && data.priority < bestMatch.priority)) {
          bestMatch = {
            value: city,
            confidence,
            priority: data.priority,
            matchedKeyword: keyword
          };
        }
      }
    }
  }
  
  // Map Kayseri and Nevsehir to Cappadocia for pricing
  if (bestMatch && (bestMatch.value === 'Kayseri' || bestMatch.value === 'Nevsehir')) {
    bestMatch.value = 'Cappadocia';
  }
  
  return bestMatch;
}

export interface DistrictMatchResult extends MatchResult {
  city: string;
}

export function findDistrict(location: string): DistrictMatchResult | null {
  const normalized = normalizeLocation(location);
  let bestMatch: DistrictMatchResult | null = null;
  
  for (const [district, data] of Object.entries(DISTRICT_KEYWORDS)) {
    for (const keyword of data.keywords) {
      const keywordNorm = normalizeLocation(keyword);
      
      if (normalized.includes(keywordNorm)) {
        const confidence = Math.min(1, 0.7 + (keywordNorm.length / 25));
        
        if (!bestMatch || 
            confidence > bestMatch.confidence || 
            (confidence === bestMatch.confidence && data.priority < bestMatch.priority)) {
          bestMatch = {
            value: district,
            city: data.city,
            confidence,
            priority: data.priority,
            matchedKeyword: keyword
          };
        }
      }
    }
  }
  
  return bestMatch;
}

// ==================== PRICE MATCHING ====================
export interface TransferInfo {
  airport: string | null;
  city: string | null;
  district: string | null;
  direction: 'from_airport' | 'to_airport' | 'city_to_city' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
}

export function analyzeTransfer(pickup: string, dropoff: string): TransferInfo {
  const pickupAirport = findAirport(pickup);
  const dropoffAirport = findAirport(dropoff);
  const pickupCity = findCity(pickup);
  const dropoffCity = findCity(dropoff);
  const pickupDistrict = findDistrict(pickup);
  const dropoffDistrict = findDistrict(dropoff);
  
  let result: TransferInfo = {
    airport: null,
    city: null,
    district: null,
    direction: 'unknown',
    confidence: 'low'
  };
  
  // Case 1: Airport to destination (district/city)
  if (pickupAirport && (dropoffDistrict || dropoffCity)) {
    result.airport = pickupAirport.value;
    result.district = dropoffDistrict?.value || null;
    result.city = dropoffDistrict?.city || dropoffCity?.value || null;
    result.direction = 'from_airport';
    result.confidence = dropoffDistrict ? 'high' : 'medium';
  }
  // Case 2: Destination (district/city) to airport
  else if (dropoffAirport && (pickupDistrict || pickupCity)) {
    result.airport = dropoffAirport.value;
    result.district = pickupDistrict?.value || null;
    result.city = pickupDistrict?.city || pickupCity?.value || null;
    result.direction = 'to_airport';
    result.confidence = pickupDistrict ? 'high' : 'medium';
  }
  // Case 3: City to city (no airport)
  else if (pickupCity && dropoffCity) {
    result.city = pickupCity.value;
    result.district = pickupDistrict?.value || null;
    result.direction = 'city_to_city';
    result.confidence = 'medium';
  }
  
  return result;
}

// ==================== DISCOUNT CALCULATION ====================
export const VALID_PROMO_CODES = ['MEET40RETURN', 'GIDISDONUS', 'RETURN30', 'MEET30'];

export function calculateDiscount(
  basePrice: number,
  hasReturnTrip: boolean,
  promoCode: string | null
): { price: number; returnPrice: number | null; totalPrice: number; discountApplied: boolean; discountPercent: number } {
  let discountApplied = false;
  let discountPercent = 0;
  let returnPrice: number | null = null;
  
  if (hasReturnTrip) {
    returnPrice = basePrice;
    
    // Apply 30% discount for return trip with valid promo code
    if (promoCode && VALID_PROMO_CODES.includes(promoCode.toUpperCase())) {
      returnPrice = Math.round(basePrice * 0.7);
      discountApplied = true;
      discountPercent = 30;
    }
  }
  
  const totalPrice = hasReturnTrip && returnPrice ? basePrice + returnPrice : basePrice;
  
  return {
    price: basePrice,
    returnPrice,
    totalPrice,
    discountApplied,
    discountPercent
  };
}

// ==================== LOGGING HELPER ====================
export function logAnalysis(
  type: 'reservation' | 'quick_booking',
  id: string,
  pickup: string,
  dropoff: string,
  transferInfo: TransferInfo
): void {
  console.log(`🚗 Auto-pricing ${type}: ${id}`);
  console.log(`📍 Pickup: ${pickup}`);
  console.log(`📍 Dropoff: ${dropoff}`);
  console.log(`🎯 Analysis:`, JSON.stringify(transferInfo, null, 2));
}
