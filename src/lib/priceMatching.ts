import { supabase } from '@/integrations/supabase/client';

// ==================== TYPES ====================
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

// ==================== AIRPORT KEYWORDS ====================
const AIRPORT_KEYWORDS: Record<string, { keywords: string[]; priority: number }> = {
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
const CITY_KEYWORDS: Record<string, { keywords: string[]; priority: number }> = {
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
      'kaymaklı', 'ihlara', 'guzelyurt', 'güzelyurt', 'mustafapasa', 'mustafapaşa',
      'nevsehir', 'nevşehir', 'kayseri'
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
  'Kocaeli': {
    priority: 1,
    keywords: [
      'kocaeli', 'izmit', 'İzmit', 'gebze', 'kartepe', 'kandira', 'kandıra',
      'darica', 'darıca', 'cayirova', 'çayırova', 'dilovasi', 'dilovası', 'golcuk', 'gölcük',
      'derince', 'basiskele', 'başiskele', 'karamursel', 'karamürsel', 'korfez', 'körfez',
      'maşukiye', 'masukiye', 'kuzuyayla', 'sogucak', 'soğucak'
    ]
  },
  'Sapanca': {
    priority: 1,
    keywords: [
      'sapanca', 'sapanca golu', 'sapanca gölü', 'sapanca lake', 'kirkpinar', 'kırkpınar',
      'mahmudiye', 'hasanpasa', 'hasanpaşa', 'rustemler', 'rüstemler'
    ]
  },
  'Sakarya': {
    priority: 1,
    keywords: [
      'sakarya', 'adapazari', 'adapazarı', 'serdivan', 'akyazi', 'akyazı', 
      'hendek', 'karasu', 'ferizli', 'sogutlu', 'söğütlü'
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
};

// ==================== DISTRICT KEYWORDS ====================
// IMPORTANT: District names MUST match exactly with database region_prices.district values
const DISTRICT_KEYWORDS: Record<string, { keywords: string[]; city: string; priority: number }> = {
  // Istanbul - Avrupa Yakası (European Side)
  'Taksim': { priority: 1, keywords: ['taksim', 'taksim square', 'taksim meydanı', 'taksim meydani'], city: 'Istanbul' },
  'Sultanahmet': { priority: 1, keywords: ['sultanahmet', 'blue mosque', 'hagia sophia', 'ayasofya', 'topkapi', 'topkapı', 'hippodrome'], city: 'Istanbul' },
  'Beyoglu': { priority: 1, keywords: ['beyoglu', 'beyoğlu', 'istiklal', 'pera'], city: 'Istanbul' },
  'Galata': { priority: 1, keywords: ['galata', 'galata tower', 'galata kulesi'], city: 'Istanbul' },
  'Karakoy': { priority: 1, keywords: ['karakoy', 'karaköy'], city: 'Istanbul' },
  'Cihangir': { priority: 1, keywords: ['cihangir'], city: 'Istanbul' },
  'Sisli': { priority: 1, keywords: ['sisli', 'şişli', 'osmanbey', 'bomonti'], city: 'Istanbul' },
  'Mecidiyekoy': { priority: 1, keywords: ['mecidiyekoy', 'mecidiyeköy'], city: 'Istanbul' },
  'Nisantasi': { priority: 1, keywords: ['nisantasi', 'nişantaşı'], city: 'Istanbul' },
  'Besiktas': { priority: 1, keywords: ['besiktas', 'beşiktaş', 'etiler'], city: 'Istanbul' },
  'Ortakoy': { priority: 1, keywords: ['ortakoy', 'ortaköy'], city: 'Istanbul' },
  'Bebek': { priority: 1, keywords: ['bebek'], city: 'Istanbul' },
  'Levent': { priority: 1, keywords: ['levent', '4. levent', 'zorlu', 'kanyon', 'sapphire'], city: 'Istanbul' },
  'Maslak': { priority: 1, keywords: ['maslak'], city: 'Istanbul' },
  'Fatih': { priority: 1, keywords: ['fatih', 'aksaray', 'laleli', 'sirkeci', 'fener'], city: 'Istanbul' },
  'Eminonu': { priority: 1, keywords: ['eminonu', 'eminönü'], city: 'Istanbul' },
  'Balat': { priority: 1, keywords: ['balat'], city: 'Istanbul' },
  'Eyup': { priority: 1, keywords: ['eyup', 'eyüp', 'eyup sultan'], city: 'Istanbul' },
  'Bakirkoy': { priority: 1, keywords: ['bakirkoy', 'bakırköy', 'florya', 'yesilkoy', 'yeşilköy', 'atakoy', 'ataköy'], city: 'Istanbul' },
  'Zeytinburnu': { priority: 1, keywords: ['zeytinburnu'], city: 'Istanbul' },
  'Sariyer': { priority: 1, keywords: ['sariyer', 'sarıyer', 'istinye', 'tarabya', 'emirgan'], city: 'Istanbul' },
  'Yenikoy': { priority: 1, keywords: ['yenikoy', 'yeniköy'], city: 'Istanbul' },
  'Arnavutkoy': { priority: 2, keywords: ['arnavutkoy', 'arnavutköy'], city: 'Istanbul' },
  'Avcilar': { priority: 2, keywords: ['avcilar', 'avcılar'], city: 'Istanbul' },
  'Bagcilar': { priority: 2, keywords: ['bagcilar', 'bağcılar'], city: 'Istanbul' },
  'Bahcelievler': { priority: 2, keywords: ['bahcelievler', 'bahçelievler'], city: 'Istanbul' },
  'Basaksehir': { priority: 2, keywords: ['basaksehir', 'başakşehir'], city: 'Istanbul' },
  'Beylikduzu': { priority: 2, keywords: ['beylikduzu', 'beylikdüzü'], city: 'Istanbul' },
  'Buyukcekmece': { priority: 2, keywords: ['buyukcekmece', 'büyükçekmece'], city: 'Istanbul' },
  'Catalca': { priority: 3, keywords: ['catalca', 'çatalca'], city: 'Istanbul' },
  'Esenler': { priority: 2, keywords: ['esenler'], city: 'Istanbul' },
  'Esenyurt': { priority: 2, keywords: ['esenyurt'], city: 'Istanbul' },
  'Gaziosmanpasa': { priority: 2, keywords: ['gaziosmanpasa', 'gaziosmanpaşa'], city: 'Istanbul' },
  'Gungoren': { priority: 2, keywords: ['gungoren', 'güngören'], city: 'Istanbul' },
  'Kucukcekmece': { priority: 2, keywords: ['kucukcekmece', 'küçükçekmece'], city: 'Istanbul' },
  'Sile': { priority: 3, keywords: ['sile', 'şile'], city: 'Istanbul' },
  'Silivri': { priority: 3, keywords: ['silivri'], city: 'Istanbul' },
  'Sultangazi': { priority: 2, keywords: ['sultangazi'], city: 'Istanbul' },
  
  // Istanbul - Anadolu Yakası (Asian Side)
  'Kadikoy': { priority: 1, keywords: ['kadikoy', 'kadıköy', 'caferaga', 'caferağa', 'moda', 'fenerbahce', 'fenerbahçe', 'bostanci', 'bostancı'], city: 'Istanbul' },
  'Uskudar': { priority: 1, keywords: ['uskudar', 'üsküdar', 'cengelkoy', 'çengelköy', 'kuzguncuk', 'beylerbeyi'], city: 'Istanbul' },
  'Atasehir': { priority: 1, keywords: ['atasehir', 'ataşehir', 'finance center', 'finans merkezi', 'watergarden'], city: 'Istanbul' },
  'Beykoz': { priority: 2, keywords: ['beykoz', 'anadolu kavagi', 'anadolu kavağı'], city: 'Istanbul' },
  'Pendik': { priority: 1, keywords: ['pendik'], city: 'Istanbul' },
  'Tuzla': { priority: 1, keywords: ['tuzla'], city: 'Istanbul' },
  'Kartal': { priority: 1, keywords: ['kartal', 'soganlik', 'soğanlık'], city: 'Istanbul' },
  'Maltepe': { priority: 1, keywords: ['maltepe', 'altaycesme', 'dragos'], city: 'Istanbul' },
  'Cekmekoy': { priority: 2, keywords: ['cekmekoy', 'çekmeköy'], city: 'Istanbul' },
  'Sancaktepe': { priority: 2, keywords: ['sancaktepe'], city: 'Istanbul' },
  'Sultanbeyli': { priority: 2, keywords: ['sultanbeyli'], city: 'Istanbul' },
  
  // Antalya - Each district matches DB exactly (Beldibi, Goynuk, Tekirova, Cirali, Olympos are separate from Kemer)
  'Kaleici': { priority: 1, keywords: ['kaleici', 'kaleiçi', 'old town antalya', 'old city antalya', 'antalya old town', 'antalya', 'antalya center', 'antalya merkez'], city: 'Antalya' },
  'Konyaalti': { priority: 1, keywords: ['konyaalti', 'konyaaltı', 'konyaalti beach', 'konyaaltı plajı', 'konyaalti plaji'], city: 'Antalya' },
  'Lara': { priority: 1, keywords: ['lara', 'lara beach', 'lara plaji', 'lara plajı'], city: 'Antalya' },
  'Kundu': { priority: 1, keywords: ['kundu'], city: 'Antalya' },
  'Belek': { priority: 1, keywords: ['belek', 'belek golf'], city: 'Antalya' },
  'Kadriye': { priority: 1, keywords: ['kadriye', 'bogazkent', 'boğazkent'], city: 'Antalya' },
  'Serik': { priority: 2, keywords: ['serik'], city: 'Antalya' },
  'Side': { priority: 1, keywords: ['side', 'kumkoy', 'kumköy', 'colakli', 'çolaklı', 'evrenseki', 'titreyengol', 'titreyen gol'], city: 'Antalya' },
  'Manavgat': { priority: 1, keywords: ['manavgat'], city: 'Antalya' },
  'Alanya': { priority: 1, keywords: ['alanya', 'mahmutlar', 'okurcalar', 'avsallar', 'konakli', 'konaklı', 'incekum', 'alanya castle'], city: 'Antalya' },
  'Kemer': { priority: 1, keywords: ['kemer', 'kemer center', 'kemer merkez', 'kemer marina', 'camyuva', 'kiriş', 'kiris'], city: 'Antalya' },
  'Beldibi': { priority: 1, keywords: ['beldibi', 'beldib'], city: 'Antalya' },
  'Goynuk': { priority: 1, keywords: ['goynuk', 'göynük', 'goynuk canyon', 'göynük kanyonu'], city: 'Antalya' },
  'Tekirova': { priority: 1, keywords: ['tekirova', 'phaselis', 'faselis'], city: 'Antalya' },
  'Cirali': { priority: 1, keywords: ['cirali', 'çıralı', 'chimaera', 'yanartaş'], city: 'Antalya' },
  'Olympos': { priority: 1, keywords: ['olympos', 'olimpos'], city: 'Antalya' },
  'Kas': { priority: 1, keywords: ['kas', 'kaş', 'patara'], city: 'Antalya' },
  'Kalkan': { priority: 1, keywords: ['kalkan', 'saklikent', 'saklıkent', 'xanthos', 'letoon'], city: 'Antalya' },
  
  // Bodrum - Each district separate for exact matching
  'Bodrum Center': { priority: 1, keywords: ['bodrum center', 'bodrum merkez', 'bodrum centrum', 'bodrum city', 'bodrum town', 'bodrum castle', 'bodrum marina', 'bodrum'], city: 'Bodrum' },
  'Yalikavak': { priority: 1, keywords: ['yalikavak', 'yalıkavak', 'palmarina', 'yalikavak marina'], city: 'Bodrum' },
  'Turgutreis': { priority: 1, keywords: ['turgutreis', 'turgut reis', 'turgutreis marina'], city: 'Bodrum' },
  'Akyarlar': { priority: 1, keywords: ['akyarlar'], city: 'Bodrum' },
  'Guvercinlik': { priority: 2, keywords: ['guvercinlik', 'güvercinlik'], city: 'Bodrum' },
  'Gumbet': { priority: 1, keywords: ['gumbet', 'gümbet'], city: 'Bodrum' },
  'Turkbuku': { priority: 1, keywords: ['turkbuku', 'türkbükü', 'golturkbuku', 'göltürkbükü'], city: 'Bodrum' },
  'Bitez': { priority: 1, keywords: ['bitez', 'bitez beach'], city: 'Bodrum' },
  'Ortakent': { priority: 2, keywords: ['ortakent', 'ortakent yahsi', 'yahsi'], city: 'Bodrum' },
  'Gumusluk': { priority: 1, keywords: ['gumusluk', 'gümüşlük', 'rabbit island'], city: 'Bodrum' },
  'Gundogan': { priority: 2, keywords: ['gundogan', 'gündoğan', 'farilya'], city: 'Bodrum' },
  'Torba': { priority: 2, keywords: ['torba', 'torba bay'], city: 'Bodrum' },
  
  // Dalaman / Fethiye / Marmaris - Each district separate
  'Fethiye': { priority: 1, keywords: ['fethiye', 'fethiye marina', 'fethiye center', 'fethiye merkez'], city: 'Dalaman' },
  'Calis': { priority: 1, keywords: ['calis', 'çalış', 'calis beach', 'çalış plajı'], city: 'Dalaman' },
  'Oludeniz': { priority: 1, keywords: ['oludeniz', 'ölüdeniz', 'blue lagoon'], city: 'Dalaman' },
  'Hisaronu': { priority: 1, keywords: ['hisaronu', 'hisarönü'], city: 'Dalaman' },
  'Ovacik': { priority: 1, keywords: ['ovacik', 'ovacık'], city: 'Dalaman' },
  'Marmaris': { priority: 1, keywords: ['marmaris', 'marmaris marina', 'marmaris center'], city: 'Dalaman' },
  'Icmeler': { priority: 1, keywords: ['icmeler', 'içmeler'], city: 'Dalaman' },
  'Turunc': { priority: 1, keywords: ['turunc', 'turunç'], city: 'Dalaman' },
  'Gocek': { priority: 1, keywords: ['gocek', 'göcek', 'gocek marina'], city: 'Dalaman' },
  'Dalyan': { priority: 1, keywords: ['dalyan', 'iztuzu', 'turtle beach'], city: 'Dalaman' },
  'Koycegiz': { priority: 1, keywords: ['koycegiz', 'köyceğiz'], city: 'Dalaman' },
  'Sarigerme': { priority: 2, keywords: ['sarigerme', 'sarıgerme'], city: 'Dalaman' },
  
  // Izmir - Each district separate
  'Cesme': { priority: 1, keywords: ['cesme', 'çeşme', 'cesme marina'], city: 'Izmir' },
  'Ilica': { priority: 1, keywords: ['ilica', 'ılıca', 'ilica beach'], city: 'Izmir' },
  'Alacati': { priority: 1, keywords: ['alacati', 'alaçatı'], city: 'Izmir' },
  'Kusadasi': { priority: 1, keywords: ['kusadasi', 'kuşadası', 'ladies beach', 'kadınlar denizi', 'kusadasi marina'], city: 'Izmir' },
  'Selcuk': { priority: 1, keywords: ['selcuk', 'selçuk', 'ephesus', 'efes'], city: 'Izmir' },
  'Sirince': { priority: 1, keywords: ['sirince', 'şirince'], city: 'Izmir' },
  'Alsancak': { priority: 1, keywords: ['alsancak', 'konak', 'kordon', 'pasaport', 'izmir center', 'izmir', 'İzmir'], city: 'Izmir' },
  'Karsiyaka': { priority: 2, keywords: ['karsiyaka', 'karşıyaka'], city: 'Izmir' },
  'Bornova': { priority: 2, keywords: ['bornova'], city: 'Izmir' },
  
  // Cappadocia - Each district separate
  'Goreme': { priority: 1, keywords: ['goreme', 'göreme', 'goreme town', 'cappadocia', 'kapadokya'], city: 'Cappadocia' },
  'Urgup': { priority: 1, keywords: ['urgup', 'ürgüp'], city: 'Cappadocia' },
  'Uchisar': { priority: 1, keywords: ['uchisar', 'uçhisar', 'uchisar castle'], city: 'Cappadocia' },
  'Avanos': { priority: 1, keywords: ['avanos'], city: 'Cappadocia' },
  'Ortahisar': { priority: 2, keywords: ['ortahisar'], city: 'Cappadocia' },
  'Nevsehir Center': { priority: 2, keywords: ['nevsehir center', 'nevşehir merkez', 'nevsehir merkez', 'nevsehir', 'nevşehir'], city: 'Cappadocia' },
  'Mustafapasa': { priority: 2, keywords: ['mustafapasa', 'mustafapaşa', 'sinasos'], city: 'Cappadocia' },
  'Cavusin': { priority: 2, keywords: ['cavusin', 'çavuşin'], city: 'Cappadocia' },
  
  // Bursa - Each district separate
  'Osmangazi': { priority: 1, keywords: ['osmangazi', 'bursa center', 'bursa merkez', 'heykel', 'bursa city', 'bursa'], city: 'Bursa' },
  'Nilufer': { priority: 2, keywords: ['nilufer', 'nilüfer', 'gorukle', 'görükle'], city: 'Bursa' },
  'Yildirim': { priority: 2, keywords: ['yildirim', 'yıldırım'], city: 'Bursa' },
  'Mudanya': { priority: 1, keywords: ['mudanya', 'guzelyali', 'güzelyalı', 'tirilye'], city: 'Bursa' },
  'Uludag': { priority: 1, keywords: ['uludag', 'uludağ', 'mount uludag', 'uludag ski'], city: 'Bursa' },
  'Cumalikizik': { priority: 1, keywords: ['cumalikizik', 'cumalıkızık'], city: 'Bursa' },
  'Iznik': { priority: 2, keywords: ['iznik', 'nicaea'], city: 'Bursa' },
  'Gemlik': { priority: 2, keywords: ['gemlik'], city: 'Bursa' },
  'Orhangazi': { priority: 2, keywords: ['orhangazi'], city: 'Bursa' },
  
  // Kocaeli - Each district separate
  'Izmit': { priority: 1, keywords: ['izmit', 'İzmit', 'kocaeli center', 'kocaeli merkez', 'kocaeli'], city: 'Kocaeli' },
  'Kartepe': { priority: 1, keywords: ['kartepe', 'kartepe ski', 'kartepe kayak'], city: 'Kocaeli' },
  'Masukiye': { priority: 1, keywords: ['masukiye', 'maşukiye', 'kuzuyayla', 'sogucak', 'soğucak'], city: 'Kocaeli' },
  'Gebze': { priority: 1, keywords: ['gebze'], city: 'Kocaeli' },
  'Cayirova': { priority: 2, keywords: ['cayirova', 'çayırova'], city: 'Kocaeli' },
  'Darica': { priority: 2, keywords: ['darica', 'darıca'], city: 'Kocaeli' },
  'Dilovasi': { priority: 2, keywords: ['dilovasi', 'dilovası'], city: 'Kocaeli' },
  'Golcuk': { priority: 2, keywords: ['golcuk', 'gölcük', 'degirmendere', 'değirmendere'], city: 'Kocaeli' },
  'Derince': { priority: 2, keywords: ['derince', 'korfez', 'körfez'], city: 'Kocaeli' },
  'Kandira': { priority: 2, keywords: ['kandira', 'kandıra', 'kerpe', 'cebeci'], city: 'Kocaeli' },
  
  // Sapanca / Sakarya - Each district separate
  'Sapanca Center': { priority: 1, keywords: ['sapanca', 'sapanca merkez', 'sapanca golu', 'sapanca gölü', 'sapanca lake'], city: 'Sapanca' },
  'Kirkpinar': { priority: 1, keywords: ['kirkpinar', 'kırkpınar'], city: 'Sapanca' },
  'Mahmudiye': { priority: 2, keywords: ['mahmudiye', 'hasanpasa', 'hasanpaşa'], city: 'Sapanca' },
  'Adapazari': { priority: 1, keywords: ['adapazari', 'adapazarı', 'sakarya center', 'sakarya merkez', 'sakarya'], city: 'Sakarya' },
  'Serdivan': { priority: 2, keywords: ['serdivan', 'bahcesehir', 'bahçeşehir'], city: 'Sakarya' },
  
  // Dubai - Each district separate
  'Downtown Dubai': { priority: 1, keywords: ['downtown', 'downtown dubai', 'burj khalifa', 'dubai mall', 'boulevard', 'dubai', 'dubayy'], city: 'Dubai' },
  'Dubai Marina': { priority: 1, keywords: ['marina', 'dubai marina', 'jbr', 'jumeirah beach residence', 'the walk'], city: 'Dubai' },
  'Palm Jumeirah': { priority: 1, keywords: ['palm', 'palm jumeirah', 'atlantis', 'the palm'], city: 'Dubai' },
  'Deira': { priority: 2, keywords: ['deira', 'gold souk', 'spice souk', 'naif'], city: 'Dubai' },
  'Jumeirah': { priority: 1, keywords: ['jumeirah', 'jumeira', 'jumeirah beach', 'umm suqeim'], city: 'Dubai' },
  'Business Bay': { priority: 2, keywords: ['business bay', 'bay square'], city: 'Dubai' },
  'Al Barsha': { priority: 2, keywords: ['al barsha', 'barsha', 'mall of emirates'], city: 'Dubai' },
  
  // Cyprus - Each district separate
  'Nicosia': { priority: 1, keywords: ['nicosia', 'lefkosa', 'lefkoşa', 'north nicosia', 'south nicosia'], city: 'Cyprus' },
  'Limassol': { priority: 1, keywords: ['limassol', 'lemesos', 'limassol marina'], city: 'Cyprus' },
  'Larnaca City': { priority: 1, keywords: ['larnaca city', 'larnaca center', 'larnaka', 'larnaca'], city: 'Cyprus' },
  'Paphos City': { priority: 1, keywords: ['paphos', 'pafos', 'kato paphos'], city: 'Cyprus' },
  'Coral Bay': { priority: 1, keywords: ['coral bay'], city: 'Cyprus' },
  'Ayia Napa': { priority: 1, keywords: ['ayia napa', 'agia napa', 'nissi beach', 'napa'], city: 'Cyprus' },
  'Kyrenia': { priority: 1, keywords: ['kyrenia', 'girne', 'bellapais'], city: 'Cyprus' },
  'Protaras': { priority: 1, keywords: ['protaras', 'fig tree bay'], city: 'Cyprus' },
  'Paralimni': { priority: 2, keywords: ['paralimni'], city: 'Cyprus' },
  'Famagusta': { priority: 1, keywords: ['famagusta', 'magusa', 'mağusa'], city: 'Cyprus' },
};

// ==================== NORMALIZATION ====================
function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .replace(/türkiye|turkey|türkei|turkiye/gi, '')
    .replace(/,\s*(tr|turkey)$/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[,.\-_\/\\#&]/g, ' ')
    .replace(/\s+/g, ' ')
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
interface InternalMatchResult {
  value: string;
  confidence: number;
  priority: number;
  matchedKeyword: string;
}

interface DistrictInternalMatch extends InternalMatchResult {
  city: string;
}

function findAirport(location: string): InternalMatchResult | null {
  const normalized = normalizeLocation(location);
  let bestMatch: InternalMatchResult | null = null;
  
  for (const [airport, data] of Object.entries(AIRPORT_KEYWORDS)) {
    for (const keyword of data.keywords) {
      const keywordNorm = normalizeLocation(keyword);
      
      if (normalized.includes(keywordNorm)) {
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

function findCity(location: string): InternalMatchResult | null {
  const normalized = normalizeLocation(location);
  let bestMatch: InternalMatchResult | null = null;
  
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
  
  return bestMatch;
}

function findDistrict(location: string): DistrictInternalMatch | null {
  const normalized = normalizeLocation(location);
  let bestMatch: DistrictInternalMatch | null = null;
  
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

// ==================== LOCATION PARSING ====================
interface ParsedLocation {
  airport: string | null;
  city: string | null;
  district: string | null;
  originalParts: string[];
}

function parseGoogleMapsLocation(location: string): ParsedLocation {
  const parts = location.split(',').map(p => p.trim());
  
  const airportMatch = findAirport(location);
  const cityMatch = findCity(location);
  const districtMatch = findDistrict(location);
  
  return {
    airport: airportMatch?.value || null,
    city: cityMatch?.value || districtMatch?.city || null,
    district: districtMatch?.value || null,
    originalParts: parts,
  };
}

// ==================== PRICE MATCHING ====================
export async function matchPrice(
  pickup: string,
  dropoff: string,
  vehicleType: string
): Promise<MatchResult> {
  try {
    console.log('🔍 Price matching started:', { pickup, dropoff, vehicleType });
    
    const pickupParsed = parseGoogleMapsLocation(pickup);
    const dropoffParsed = parseGoogleMapsLocation(dropoff);
    
    console.log('📍 Parsed locations:', { pickupParsed, dropoffParsed });
    
    // Determine transfer direction
    let airport: string | null = null;
    let district: string | null = null;
    let city: string | null = null;
    
    if (pickupParsed.airport && (dropoffParsed.district || dropoffParsed.city)) {
      airport = pickupParsed.airport;
      district = dropoffParsed.district;
      city = dropoffParsed.city;
    } else if (dropoffParsed.airport && (pickupParsed.district || pickupParsed.city)) {
      airport = dropoffParsed.airport;
      district = pickupParsed.district;
      city = pickupParsed.city;
    } else if (pickupParsed.city || dropoffParsed.city) {
      city = pickupParsed.city || dropoffParsed.city;
      district = pickupParsed.district || dropoffParsed.district;
    }
    
    console.log('🚗 Transfer info:', { airport, city, district });
    
    if (!city && !airport) {
      console.log('❌ No city or airport found in locations');
      return { found: false };
    }
    
    // 1. Try exact match
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
    
    // 2. Try airport + city match
    if (airport && city) {
      const { data: cityMatch, error } = await supabase
        .from('region_prices')
        .select('*')
        .eq('city', city)
        .eq('airport', airport)
        .eq('vehicle_type', vehicleType)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(1);
      
      if (!error && cityMatch && cityMatch.length > 0) {
        console.log('✅ City+Airport match found:', cityMatch[0]);
        return {
          found: true,
          price: cityMatch[0].price,
          currency: cityMatch[0].price_currency,
          matchedCity: cityMatch[0].city,
          matchedDistrict: cityMatch[0].district,
          matchedAirport: cityMatch[0].airport || undefined,
          confidence: district ? 'medium' : 'low',
          matchType: 'district_fallback',
        };
      }
    }
    
    // 3. Try city + district match (for intercity transfers without airport)
    if (city && district) {
      const { data: cityDistrictMatch, error } = await supabase
        .from('region_prices')
        .select('*')
        .eq('city', city)
        .eq('district', district)
        .eq('vehicle_type', vehicleType)
        .eq('is_active', true)
        .limit(1);
      
      if (!error && cityDistrictMatch && cityDistrictMatch.length > 0) {
        console.log('✅ City+District match found:', cityDistrictMatch[0]);
        return {
          found: true,
          price: cityDistrictMatch[0].price,
          currency: cityDistrictMatch[0].price_currency,
          matchedCity: cityDistrictMatch[0].city,
          matchedDistrict: cityDistrictMatch[0].district,
          matchedAirport: cityDistrictMatch[0].airport || undefined,
          confidence: 'medium',
          matchType: 'district_fallback',
        };
      }
    }
    
    // NOTE: city-only match REMOVED - too broad, causes incorrect pricing
    // If no airport and no district match, require manual pricing
    
    console.log('❌ No price match found');
    return { found: false };
    
  } catch (error) {
    console.error('❌ Price matching error:', error);
    return { found: false };
  }
}

// ==================== TEST FUNCTION ====================
export async function testPriceMatch(
  pickup: string,
  dropoff: string,
  vehicleType: string
): Promise<{
  result: MatchResult;
  analysis: {
    pickup: ParsedLocation;
    dropoff: ParsedLocation;
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

// ==================== DISCOUNT FUNCTIONS ====================
const VALID_PROMO_CODES = ['MEET40RETURN', 'GIDISDONUS', 'RETURN30', 'MEET30'];

export function applyPromoDiscount(
  price: number,
  hasReturnTrip: boolean,
  promoCode: string | null
): { finalPrice: number; discountApplied: boolean; discountPercent: number } {
  if (hasReturnTrip && promoCode && VALID_PROMO_CODES.includes(promoCode.toUpperCase())) {
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
