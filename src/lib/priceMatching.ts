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
  'Gazipasa-Alanya Airport (GZP)': {
    priority: 2,
    keywords: [
      'gazipasa airport', 'gazipaşa airport', 'gazipasa alanya airport',
      'gazipaşa alanya airport', 'gzp', 'gzp airport', 'alanya airport'
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
      'ercan airport', 'ecn', 'ercan havalimanı', 'ercan havalimani', 'lefkoşa havalimanı', 
      'lefkosa airport', 'kktc havalimanı', 'kuzey kıbrıs havalimanı', 'kuzey kibris havalimani',
      'north cyprus airport', 'trnc airport', 'ercan', 'kıbrıs ercan', 'kibris ercan'
    ]
  },
  'Bursa Yenisehir Airport (YEI)': {
    priority: 1,
    keywords: [
      'bursa airport', 'yenisehir airport', 'yei', 'bursa havalimanı', 'yenişehir',
      'bursa yenisehir', 'yenisehir havalimani'
    ]
  },
  // Türkiye - Diğer havalimanları (tüm bölgesel fiyatlandırmayı kapsayacak şekilde)
  'Ankara Esenboga Airport (ESB)': {
    priority: 1,
    keywords: [
      'ankara airport', 'esenboga', 'esenboğa', 'esb', 'ankara havalimanı',
      'ankara havalimani', 'ankara uluslararasi'
    ]
  },
  'Adana Sakirpasa Airport (ADA)': {
    priority: 1,
    keywords: [
      'adana airport', 'sakirpasa', 'şakirpaşa', 'ada', 'adana havalimanı',
      'adana havalimani', 'cukurova airport'
    ]
  },
  'Gaziantep Airport (GZT)': {
    priority: 1,
    keywords: [
      'gaziantep airport', 'gzt', 'gaziantep havalimanı', 'gaziantep havalimani',
      'oguzeli', 'oğuzeli'
    ]
  },
  'Trabzon Airport (TZX)': {
    priority: 1,
    keywords: [
      'trabzon airport', 'tzx', 'trabzon havalimanı', 'trabzon havalimani',
      'trabzon uluslararasi'
    ]
  },
  'Diyarbakir Airport (DIY)': {
    priority: 1,
    keywords: [
      'diyarbakir airport', 'diyarbakır', 'diy', 'diyarbakir havalimanı',
      'diyarbakir havalimani', 'diyarbakır havalimanı'
    ]
  },
  'Van Ferit Melen Airport (VAN)': {
    priority: 1,
    keywords: [
      'van airport', 'van havalimanı', 'van havalimani', 'van ferit melen',
      'ferit melen airport'
    ]
  },
  'Malatya Airport (MLX)': {
    priority: 1,
    keywords: [
      'malatya airport', 'mlx', 'malatya havalimanı', 'malatya havalimani',
      'malatya ernist'
    ]
  },
  'Samsun Carsamba Airport (SZF)': {
    priority: 1,
    keywords: [
      'samsun airport', 'szf', 'samsun havalimanı', 'samsun havalimani',
      'carsamba', 'çarşamba airport'
    ]
  },
  'Kocaeli Cengiz Topel Airport (KCO)': {
    priority: 1,
    keywords: [
      'kocaeli airport', 'cengiz topel', 'kco', 'kocaeli havalimanı',
      'izmit airport', 'körfez airport'
    ]
  },
  'Tekirdag Corlu Airport (TEQ)': {
    priority: 1,
    keywords: [
      'tekirdag airport', 'tekirdağ', 'corlu', 'çorlu', 'teq',
      'tekirdag havalimanı', 'corlu havalimani'
    ]
  },
  'Edirne Airport (EDN)': {
    priority: 1,
    keywords: [
      'edirne airport', 'edn', 'edirne havalimanı', 'edirne havalimani',
      'keşan airport'
    ]
  },
  'Kars Harakani Airport (KHV)': {
    priority: 1,
    keywords: [
      'kars airport', 'khv', 'kars havalimanı', 'kars havalimani',
      'harakani airport'
    ]
  },
  'Denizli Cardak Airport (DNZ)': {
    priority: 1,
    keywords: [
      'denizli airport', 'cardak', 'çardak', 'dnz', 'denizli havalimanı',
      'pamukkale airport'
    ]
  },
  'Elazig Airport (EZS)': {
    priority: 1,
    keywords: [
      'elazig airport', 'elazığ', 'ezs', 'elazig havalimanı',
      'elazig havalimani'
    ]
  },
  'Sivas Nuri Demirag Airport (VAS)': {
    priority: 1,
    keywords: [
      'sivas airport', 'vas', 'sivas havalimanı', 'sivas havalimani',
      'nuri demirag', 'nuri demirağ'
    ]
  },
  'Sinop Airport (NOP)': {
    priority: 1,
    keywords: [
      'sinop airport', 'nop', 'sinop havalimanı', 'sinop havalimani'
    ]
  },
  'Kastamonu Airport (KFS)': {
    priority: 1,
    keywords: [
      'kastamonu airport', 'kfs', 'kastamonu havalimanı', 'kastamonu havalimani'
    ]
  },
  'Zonguldak Caycuma Airport (ONQ)': {
    priority: 1,
    keywords: [
      'zonguldak airport', 'onq', 'zonguldak havalimanı', 'caycuma',
      'çaycuma airport'
    ]
  },
  'Sirnak Airport (NKT)': {
    priority: 1,
    keywords: [
      'sirnak airport', 'şırnak', 'nkt', 'sirnak havalimanı',
      'sirnak havalimani'
    ]
  },
  'Agri Airport (AJI)': {
    priority: 1,
    keywords: [
      'agri airport', 'ağrı', 'aji', 'agri havalimanı', 'agri havalimani'
    ]
  },
  'Mardin Airport (MQM)': {
    priority: 1,
    keywords: [
      'mardin airport', 'mqm', 'mardin havalimanı', 'mardin havalimani'
    ]
  },
  'Afyon Zafer Airport (KZR)': {
    priority: 1,
    keywords: [
      'afyon airport', 'zafer', 'kzr', 'afyon havalimanı', 'afyon havalimani',
      'afyonkarahisar airport'
    ]
  },
  'Mus Airport (MSR)': {
    priority: 1,
    keywords: [
      'mus airport', 'muş', 'msr', 'mus havalimanı', 'mus havalimani'
    ]
  },
  'Erzurum Airport (ERZ)': {
    priority: 1,
    keywords: [
      'erzurum airport', 'erz', 'erzurum havalimanı', 'erzurum havalimani'
    ]
  },
  'Erzincan Airport (ERC)': {
    priority: 1,
    keywords: [
      'erzincan airport', 'erc', 'erzincan havalimanı', 'erzincan havalimani'
    ]
  },
  'Sanliurfa GAP Airport (SFQ)': {
    priority: 1,
    keywords: [
      'sanliurfa airport', 'şanlıurfa', 'sfq', 'gap airport', 'urfa airport',
      'sanliurfa havalimanı', 'sanliurfa havalimani'
    ]
  },
  'Hatay Airport (HTY)': {
    priority: 1,
    keywords: [
      'hatay airport', 'hty', 'hatay havalimanı', 'antakya airport',
      'iskenderun airport'
    ]
  },
  'Balikesir Koca Seyit Airport (EDO)': {
    priority: 1,
    keywords: [
      'balikesir airport', 'edo', 'koca seyit', 'balikesir havalimanı',
      'bandirma airport', 'bandırma'
    ]
  },
  'Canakkale Airport (CKZ)': {
    priority: 1,
    keywords: [
      'canakkale airport', 'çanakkale', 'ckz', 'canakkale havalimanı'
    ]
  },
  'Ordu-Giresun Airport (OGU)': {
    priority: 1,
    keywords: [
      'ordu airport', 'giresun airport', 'ogu', 'ordu giresun',
      'ordu havalimanı', 'giresun havalimani'
    ]
  },
  'Rize-Artvin Airport (RZV)': {
    priority: 1,
    keywords: [
      'rize airport', 'artvin airport', 'rzv', 'rize havalimanı',
      'rize artvin', 'cayeli'
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
      'belek', 'side', 'kemer', 'kas', 'kaş', 'kalkan', 'manavgat',
      'serik', 'kundu', 'beldibi', 'goynuk', 'göynük', 'tekirova', 'cirali', 'çıralı',
      'olympos', 'kadriye', 'bogazkent', 'boğazkent', 'kumkoy', 'kumköy',
      'colakli', 'çolaklı', 'evrenseki', 'titreyengol'
    ]
  },
  'Alanya': {
    priority: 1,
    keywords: [
      'alanya', 'alanya center', 'alanya merkez', 'alanya castle',
      'mahmutlar', 'kestel', 'tosmur', 'oba', 'cikcilli',
      'konakli', 'konaklı', 'payallar', 'turkler', 'türkler',
      'avsallar', 'incekum', 'okurcalar', 'kargicak', 'kargıcak',
      'demirtas', 'demirtaş', 'gazipasa', 'gazipaşa'
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
  // Türkiye - Bölgesel fiyatlandırma (yeni havalimanları)
  'Trabzon Center': { priority: 1, keywords: ['trabzon center', 'trabzon merkez', 'trabzon'], city: 'Trabzon' },
  'Adana Center': { priority: 1, keywords: ['adana center', 'adana merkez', 'adana'], city: 'Adana' },
  'Gaziantep Center': { priority: 1, keywords: ['gaziantep center', 'gaziantep merkez', 'gaziantep'], city: 'Gaziantep' },
  'Diyarbakir Center': { priority: 1, keywords: ['diyarbakir center', 'diyarbakır merkez', 'diyarbakir'], city: 'Diyarbakir' },
  'Van Center': { priority: 1, keywords: ['van center', 'van merkez', 'van'], city: 'Van' },
  'Malatya Center': { priority: 1, keywords: ['malatya center', 'malatya merkez', 'malatya'], city: 'Malatya' },
  'Samsun Center': { priority: 1, keywords: ['samsun center', 'samsun merkez', 'samsun'], city: 'Samsun' },
  'Tekirdag Center': { priority: 1, keywords: ['tekirdag center', 'tekirdağ merkez', 'tekirdag'], city: 'Tekirdag' },
  'Edirne Center': { priority: 1, keywords: ['edirne center', 'edirne merkez', 'edirne'], city: 'Edirne' },
  'Kars Center': { priority: 1, keywords: ['kars center', 'kars merkez', 'kars'], city: 'Kars' },
  'Elazig Center': { priority: 1, keywords: ['elazig center', 'elazığ merkez', 'elazig'], city: 'Elazig' },
  'Sivas Center': { priority: 1, keywords: ['sivas center', 'sivas merkez', 'sivas'], city: 'Sivas' },
  'Sinop Center': { priority: 1, keywords: ['sinop center', 'sinop merkez', 'sinop'], city: 'Sinop' },
  'Kastamonu Center': { priority: 1, keywords: ['kastamonu center', 'kastamonu merkez', 'kastamonu'], city: 'Kastamonu' },
  'Zonguldak Center': { priority: 1, keywords: ['zonguldak center', 'zonguldak merkez', 'zonguldak'], city: 'Zonguldak' },
  'Sirnak Center': { priority: 1, keywords: ['sirnak center', 'şırnak merkez', 'sirnak'], city: 'Sirnak' },
  'Agri Center': { priority: 1, keywords: ['agri center', 'ağrı merkez', 'agri'], city: 'Agri' },
  'Mardin Center': { priority: 1, keywords: ['mardin center', 'mardin merkez', 'mardin'], city: 'Mardin' },
  'Afyon Center': { priority: 1, keywords: ['afyon center', 'afyon merkez', 'afyon'], city: 'Afyon' },
  'Mus Center': { priority: 1, keywords: ['mus center', 'muş merkez', 'mus'], city: 'Mus' },
  'Erzurum Center': { priority: 1, keywords: ['erzurum center', 'erzurum merkez', 'erzurum'], city: 'Erzurum' },
  'Erzincan Center': { priority: 1, keywords: ['erzincan center', 'erzincan merkez', 'erzincan'], city: 'Erzincan' },
  'Sanliurfa Center': { priority: 1, keywords: ['sanliurfa center', 'şanlıurfa merkez', 'sanliurfa', 'urfa'], city: 'Sanliurfa' },
  'Antakya': { priority: 1, keywords: ['antakya', 'hatay merkez'], city: 'Hatay' },
  'Iskenderun': { priority: 1, keywords: ['iskenderun'], city: 'Hatay' },
  'Samandag': { priority: 1, keywords: ['samandag', 'samandağ'], city: 'Hatay' },
  'Balikesir Center': { priority: 1, keywords: ['balikesir center', 'balıkesir merkez', 'balikesir'], city: 'Balikesir' },
  'Canakkale Center': { priority: 1, keywords: ['canakkale center', 'çanakkale merkez', 'canakkale'], city: 'Canakkale' },
  'Ordu Center': { priority: 1, keywords: ['ordu center', 'ordu merkez', 'ordu'], city: 'Ordu' },
  'Rize Center': { priority: 1, keywords: ['rize center', 'rize merkez', 'rize'], city: 'Rize' },
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
  'Kuzey Kıbrıs': {
    priority: 1,
    keywords: [
      'kuzey kıbrıs', 'kuzey kibris', 'kktc', 'trnc', 'north cyprus', 'northern cyprus',
      'girne', 'lefkoşa', 'lefkosa', 'lefkoşe', 'lefkose', 'gazimağusa', 'gazimagusa', 'mağusa', 'magusa',
      'iskele', 'güzelyurt', 'guzelyurt', 'alsancak', 'lapta', 'esentepe', 'tatlısu',
      'karşıyaka', 'karsiyaka', 'yeni boğaziçi', 'yeni bogazici', 'maraş', 'maras',
      'dipkarpaz', 'bafra', 'mehmetcik', 'yeniboğaziçi', 'yenierenköy', 'yenierekoy',
      'çatalköy', 'catalkoy', 'karakum'
    ]
  },
  // Türkiye - Bölgesel fiyatlandırma kapsamındaki diğer şehirler
  'Trabzon': { priority: 1, keywords: ['trabzon', 'akçaabat', 'yomra', 'arsin', 'of', 'sürmene', 'hayrat'] },
  'Adana': { priority: 1, keywords: ['adana', 'seyhan', 'yuregir', 'cukurova', 'saricam', 'tarsus', 'ceyhan'] },
  'Gaziantep': { priority: 1, keywords: ['gaziantep', 'oguzeli', 'oğuzeli', 'sahinbey', 'sehitkamil'] },
  'Diyarbakir': { priority: 1, keywords: ['diyarbakir', 'diyarbakır', 'sur', 'baglar', 'yenisehir', 'kayapinar'] },
  'Van': { priority: 1, keywords: ['van', 'edremit', 'tusba', 'ipekyolu'] },
  'Malatya': { priority: 1, keywords: ['malatya', 'battalgazi', 'aslantas', 'yesilyurt'] },
  'Samsun': { priority: 1, keywords: ['samsun', 'carsamba', 'çarşamba', 'ilkadim', 'atakum', 'canik'] },
  'Tekirdag': { priority: 1, keywords: ['tekirdag', 'tekirdağ', 'corlu', 'çorlu', 'suleymanpasa'] },
  'Edirne': { priority: 1, keywords: ['edirne', 'kesan', 'keşan', 'uzunkopru', 'ipsala'] },
  'Kars': { priority: 1, keywords: ['kars', 'merkez', 'kagizman', 'sarikamis'] },
  'Denizli': { priority: 1, keywords: ['denizli', 'pamukkale', 'hierapolis', 'cardak', 'çardak'] },
  'Elazig': { priority: 1, keywords: ['elazig', 'elazığ', 'merkez', 'kovancilar'] },
  'Sivas': { priority: 1, keywords: ['sivas', 'merkez', 'kangal', 'divrigi'] },
  'Sanliurfa': { priority: 1, keywords: ['sanliurfa', 'şanlıurfa', 'urfa', 'harran', 'gap', 'eylul'] },
  'Hatay': { priority: 1, keywords: ['hatay', 'antakya', 'iskenderun', 'samandag', 'harbiye'] },
  'Balikesir': { priority: 1, keywords: ['balikesir', 'balıkesir', 'bandirma', 'bandırma', 'edremit', 'ayvalik'] },
  'Canakkale': { priority: 1, keywords: ['canakkale', 'çanakkale', 'gelibolu', 'troy', 'truva'] },
  'Ordu': { priority: 1, keywords: ['ordu', 'unye', 'ülünye', 'fatsa', 'persembe'] },
  'Rize': { priority: 1, keywords: ['rize', 'cayeli', 'pazar', 'ardesen', 'findikli'] },
  'Erzurum': { priority: 1, keywords: ['erzurum', 'palandoken', 'yakutiye', 'aziziye'] },
  'Erzincan': { priority: 1, keywords: ['erzincan', 'merkez', 'tercan'] },
  'Zonguldak': { priority: 1, keywords: ['zonguldak', 'caycuma', 'çaycuma', 'eregli', 'karaelmas'] },
  'Sinop': { priority: 1, keywords: ['sinop', 'merkez', 'boyabat'] },
  'Kastamonu': { priority: 1, keywords: ['kastamonu', 'merkez', 'taskopru', 'inebolu'] },
  'Mardin': { priority: 1, keywords: ['mardin', 'midyat', 'mardin merkez', 'artuklu'] },
  'Agri': { priority: 1, keywords: ['agri', 'ağrı', 'dogubayazit', 'patnos'] },
  'Mus': { priority: 1, keywords: ['mus', 'muş', 'merkez', 'malazgirt'] },
  'Sirnak': { priority: 1, keywords: ['sirnak', 'şırnak', 'merkez', 'cidlis'] },
  'Afyon': { priority: 1, keywords: ['afyon', 'afyonkarahisar', 'merkez', 'sandikli'] },
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
  'Sisli': { priority: 1, keywords: ['sisli', 'şişli', 'osmanbey', 'bomonti', 'harbiye'], city: 'Istanbul' },
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
  
  // Antalya - Each district matches DB exactly (Alanya is now a separate city)
  'Kaleici': { priority: 1, keywords: ['kaleici', 'kaleiçi', 'old town antalya', 'old city antalya', 'antalya old town', 'antalya', 'antalya center', 'antalya merkez'], city: 'Antalya' },
  'Konyaalti': { priority: 1, keywords: ['konyaalti', 'konyaaltı', 'konyaalti beach', 'konyaaltı plajı', 'konyaalti plaji'], city: 'Antalya' },
  'Lara': { priority: 1, keywords: ['lara', 'lara beach', 'lara plaji', 'lara plajı'], city: 'Antalya' },
  'Kundu': { priority: 1, keywords: ['kundu'], city: 'Antalya' },
  'Belek': { priority: 1, keywords: ['belek', 'belek golf'], city: 'Antalya' },
  'Kadriye': { priority: 1, keywords: ['kadriye', 'bogazkent', 'boğazkent'], city: 'Antalya' },
  'Serik': { priority: 2, keywords: ['serik'], city: 'Antalya' },
  'Side': { priority: 1, keywords: ['side', 'kumkoy', 'kumköy', 'colakli', 'çolaklı', 'evrenseki', 'titreyengol', 'titreyen gol', 'sorgun'], city: 'Antalya' },
  'Manavgat': { priority: 1, keywords: ['manavgat', 'gundogdu', 'gündoğdu'], city: 'Antalya' },
  'Kemer': { priority: 1, keywords: ['kemer', 'kemer center', 'kemer merkez', 'kemer marina', 'camyuva', 'kiriş', 'kiris'], city: 'Antalya' },
  'Beldibi': { priority: 1, keywords: ['beldibi', 'beldib'], city: 'Antalya' },
  'Goynuk': { priority: 1, keywords: ['goynuk', 'göynük', 'goynuk canyon', 'göynük kanyonu'], city: 'Antalya' },
  'Tekirova': { priority: 1, keywords: ['tekirova', 'phaselis', 'faselis'], city: 'Antalya' },
  'Cirali': { priority: 1, keywords: ['cirali', 'çıralı', 'chimaera', 'yanartaş'], city: 'Antalya' },
  'Olympos': { priority: 1, keywords: ['olympos', 'olimpos'], city: 'Antalya' },
  'Kas': { priority: 1, keywords: ['kas', 'kaş', 'patara'], city: 'Antalya' },
  'Kalkan': { priority: 1, keywords: ['kalkan', 'saklikent', 'saklıkent', 'xanthos', 'letoon'], city: 'Antalya' },

  // Alanya - Separate city and districts
  'Alanya': { priority: 1, keywords: ['alanya', 'alanya center', 'alanya merkez', 'alanya castle'], city: 'Alanya' },
  'Mahmutlar': { priority: 1, keywords: ['mahmutlar'], city: 'Alanya' },
  'Kestel': { priority: 1, keywords: ['kestel'], city: 'Alanya' },
  'Tosmur': { priority: 1, keywords: ['tosmur'], city: 'Alanya' },
  'Oba': { priority: 1, keywords: ['oba', 'oba mahallesi'], city: 'Alanya' },
  'Cikcilli': { priority: 1, keywords: ['cikcilli', 'cikilli'], city: 'Alanya' },
  'Konakli': { priority: 1, keywords: ['konakli', 'konaklı'], city: 'Alanya' },
  'Payallar': { priority: 1, keywords: ['payallar'], city: 'Alanya' },
  'Turkler': { priority: 1, keywords: ['turkler', 'türkler'], city: 'Alanya' },
  'Avsallar': { priority: 1, keywords: ['avsallar'], city: 'Alanya' },
  'Incekum': { priority: 1, keywords: ['incekum', 'ince kum'], city: 'Alanya' },
  'Okurcalar': { priority: 1, keywords: ['okurcalar'], city: 'Alanya' },
  'Kargicak': { priority: 1, keywords: ['kargicak', 'kargıcak'], city: 'Alanya' },
  'Demirtas': { priority: 1, keywords: ['demirtas', 'demirtaş'], city: 'Alanya' },
  'Gazipasa': { priority: 1, keywords: ['gazipasa', 'gazipaşa'], city: 'Alanya' },
  
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
  
  // South Cyprus (Güney Kıbrıs) - Kendi fiyatları ayrı
  'Nicosia South': { priority: 1, keywords: ['nicosia', 'south nicosia', 'lefkosia south'], city: 'Cyprus' },
  'Limassol': { priority: 1, keywords: ['limassol', 'lemesos', 'limassol marina'], city: 'Cyprus' },
  'Larnaca City': { priority: 1, keywords: ['larnaca city', 'larnaca center', 'larnaka', 'larnaca'], city: 'Cyprus' },
  'Paphos City': { priority: 1, keywords: ['paphos', 'pafos', 'kato paphos'], city: 'Cyprus' },
  'Coral Bay': { priority: 1, keywords: ['coral bay'], city: 'Cyprus' },
  'Ayia Napa': { priority: 1, keywords: ['ayia napa', 'agia napa', 'nissi beach', 'napa'], city: 'Cyprus' },
  'Protaras': { priority: 1, keywords: ['protaras', 'fig tree bay'], city: 'Cyprus' },
  'Paralimni': { priority: 2, keywords: ['paralimni'], city: 'Cyprus' },
  
  // KKTC (Kuzey Kıbrıs) - Veritabanındaki district isimleriyle BİREBİR eşleşen
  // DB'de city: "Kuzey Kıbrıs", airport: "ECN"
  // Veritabanındaki semtler: Girne Merkez, Lefkoşe, Mağusa, Alsancak, Bafra, Lapta, İskele, Çatalköy, Karakum
  'Girne Merkez': { priority: 1, keywords: ['girne merkez', 'girne center', 'girne', 'kyrenia', 'kyrenia center', 'girne liman', 'girne harbour', 'bellapais', 'girne kktc', 'girne kıbrıs'], city: 'Kuzey Kıbrıs' },
  'Lefkoşe': { priority: 1, keywords: ['lefkoşe', 'lefkose', 'lefkoşa', 'lefkosa', 'lefkoşa merkez', 'lefkosa merkez', 'kuzey lefkoşa', 'north nicosia', 'nicosia north', 'kuzey nicosia', 'lefkoşe kktc'], city: 'Kuzey Kıbrıs' },
  'Mağusa': { priority: 1, keywords: ['mağusa', 'magusa', 'gazimağusa', 'gazimagusa', 'gazimağusa merkez', 'gazimagusa merkez', 'famagusta', 'ammochostos', 'mağusa kktc'], city: 'Kuzey Kıbrıs' },
  'İskele': { priority: 1, keywords: ['iskele kktc', 'İskele', 'trikomo', 'long beach iskele', 'bogaz iskele', 'boğaz iskele', 'long beach kktc', 'iskele kıbrıs', 'iskele cyprus'], city: 'Kuzey Kıbrıs' },
  // Bu semtler Türkiye'deki aynı isimli semtlerle çakışıyor, KKTC prefix/suffix ile ayırt ediyoruz
  'Alsancak-KKTC': { priority: 1, keywords: ['alsancak kktc', 'alsancak girne', 'alsancak kıbrıs', 'karavostasi', 'alsancak cyprus', 'alsancak north cyprus'], city: 'Kuzey Kıbrıs' },
  'Lapta': { priority: 1, keywords: ['lapta', 'lapithos', 'lapta kktc', 'lapta girne', 'lapta kıbrıs', 'lapta cyprus'], city: 'Kuzey Kıbrıs' },
  'Bafra-KKTC': { priority: 1, keywords: ['bafra kktc', 'bafra beach', 'bafra iskele', 'bafra kıbrıs', 'bafra cyprus', 'bafra north cyprus'], city: 'Kuzey Kıbrıs' },
  'Çatalköy': { priority: 1, keywords: ['çatalköy', 'catalkoy', 'çatalköy girne', 'agios epiktitos', 'çatalköy kktc'], city: 'Kuzey Kıbrıs' },
  'Karakum': { priority: 1, keywords: ['karakum', 'karakum girne', 'karaoğlanoğlu', 'karaoglanoglu', 'karakum kktc'], city: 'Kuzey Kıbrıs' },
  // Ek KKTC semtleri (veritabanında henüz olmayan ama fiyat eklenebilir)
  'Güzelyurt-KKTC': { priority: 1, keywords: ['güzelyurt kktc', 'guzelyurt kktc', 'morphou', 'güzelyurt kıbrıs'], city: 'Kuzey Kıbrıs' },
  'Esentepe-KKTC': { priority: 1, keywords: ['esentepe kktc', 'agios amvrosios', 'bahçeli kktc', 'bahceli kktc', 'tatlısu', 'tatlisu', 'esentepe kıbrıs'], city: 'Kuzey Kıbrıs' },
  'Karşıyaka-KKTC': { priority: 1, keywords: ['karşıyaka kktc', 'karsiyaka kktc', 'karşıyaka girne', 'vasilia', 'karşıyaka kıbrıs'], city: 'Kuzey Kıbrıs' },
  'Yeni Boğaziçi': { priority: 1, keywords: ['yeni boğaziçi', 'yeni bogazici', 'yeniboğaziçi', 'yenibogazici', 'monarga'], city: 'Kuzey Kıbrıs' },
  'Maraş-KKTC': { priority: 1, keywords: ['maraş kktc', 'maras kktc', 'varosha', 'kapalı maraş', 'kapali maras', 'maraş kıbrıs'], city: 'Kuzey Kıbrıs' },
  'Dipkarpaz': { priority: 2, keywords: ['dipkarpaz', 'karpaz', 'karpaz peninsula', 'rizokarpaso', 'dipkarpaz kktc'], city: 'Kuzey Kıbrıs' },
  'Mehmetçik': { priority: 2, keywords: ['mehmetçik', 'mehmetcik', 'galateia', 'mehmetçik kktc'], city: 'Kuzey Kıbrıs' },
  'Yenierenköy': { priority: 2, keywords: ['yenierenköy', 'yenierekoy', 'yenierenk', 'yiallousa', 'yenierenköy kktc'], city: 'Kuzey Kıbrıs' },
  'Akdeniz-KKTC': { priority: 2, keywords: ['akdeniz kktc', 'akdeniz kıbrıs', 'agia irini'], city: 'Kuzey Kıbrıs' },
  'Lefke': { priority: 2, keywords: ['lefke', 'lefka', 'lefke kktc'], city: 'Kuzey Kıbrıs' },
  'Değirmenlik': { priority: 2, keywords: ['değirmenlik', 'degirmenlik', 'kythrea', 'değirmenlik kktc'], city: 'Kuzey Kıbrıs' },
};

// KKTC District name mapping: Code ID -> Database name
const KKTC_DISTRICT_DB_MAPPING: Record<string, string> = {
  'Alsancak-KKTC': 'Alsancak',
  'Bafra-KKTC': 'Bafra',
  'Güzelyurt-KKTC': 'Güzelyurt',
  'Esentepe-KKTC': 'Esentepe',
  'Karşıyaka-KKTC': 'Karşıyaka',
  'Maraş-KKTC': 'Maraş',
  'Akdeniz-KKTC': 'Akdeniz',
};

// Airport name to DB code mapping (how airports are stored in region_prices.airport)
// Türkiye + Dubai + Kıbrıs havalimanları
const AIRPORT_TO_DB_CODE: Record<string, string> = {
  'Istanbul Airport (IST)': 'IST',
  'Sabiha Gokcen Airport (SAW)': 'SAW',
  'Antalya Airport (AYT)': 'AYT',
  'Gazipasa-Alanya Airport (GZP)': 'GZP',
  'Bodrum-Milas Airport (BJV)': 'BJV',
  'Dalaman Airport (DLM)': 'DLM',
  'Izmir Adnan Menderes Airport (ADB)': 'ADB',
  'Kayseri Airport (ASR)': 'ASR',
  'Nevsehir-Kapadokya Airport (NAV)': 'NAV',
  'Ankara Esenboga Airport (ESB)': 'ESB',
  'Adana Sakirpasa Airport (ADA)': 'ADA',
  'Gaziantep Airport (GZT)': 'GZT',
  'Trabzon Airport (TZX)': 'TZX',
  'Diyarbakir Airport (DIY)': 'DIY',
  'Van Ferit Melen Airport (VAN)': 'VAN',
  'Malatya Airport (MLX)': 'MLX',
  'Samsun Carsamba Airport (SZF)': 'SZF',
  'Kocaeli Cengiz Topel Airport (KCO)': 'KCO',
  'Tekirdag Corlu Airport (TEQ)': 'TEQ',
  'Edirne Airport (EDN)': 'EDN',
  'Kars Harakani Airport (KHV)': 'KHV',
  'Denizli Cardak Airport (DNZ)': 'DNZ',
  'Elazig Airport (EZS)': 'EZS',
  'Sivas Nuri Demirag Airport (VAS)': 'VAS',
  'Sinop Airport (NOP)': 'NOP',
  'Kastamonu Airport (KFS)': 'KFS',
  'Zonguldak Caycuma Airport (ONQ)': 'ONQ',
  'Sirnak Airport (NKT)': 'NKT',
  'Agri Airport (AJI)': 'AJI',
  'Mardin Airport (MQM)': 'MQM',
  'Afyon Zafer Airport (KZR)': 'KZR',
  'Mus Airport (MSR)': 'MSR',
  'Erzurum Airport (ERZ)': 'ERZ',
  'Erzincan Airport (ERC)': 'ERC',
  'Sanliurfa GAP Airport (SFQ)': 'SFQ',
  'Hatay Airport (HTY)': 'HTY',
  'Balikesir Koca Seyit Airport (EDO)': 'EDO',
  'Canakkale Airport (CKZ)': 'CKZ',
  'Ordu-Giresun Airport (OGU)': 'OGU',
  'Rize-Artvin Airport (RZV)': 'RZV',
  'Dubai International Airport (DXB)': 'DXB',
  'Al Maktoum International Airport (DWC)': 'DWC',
  'Larnaca Airport (LCA)': 'LCA',
  'Paphos Airport (PFO)': 'PFO',
  'Ercan Airport (ECN)': 'ECN',
  'Bursa Yenisehir Airport (YEI)': 'YEI',
};

// ==================== NORMALIZATION ====================
function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .replace(/türkiye|turkey|türkei|turkiye/gi, '')
    .replace(/,\s*(tr|turkey)$/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[,.\-_/\\#&]/g, ' ')
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

// Normalized district names per city (frontend mirror of backend guard)
const DISTRICT_NAMES_BY_CITY_NORM: Record<string, Set<string>> = (() => {
  const map: Record<string, Set<string>> = {};
  for (const [district, data] of Object.entries(DISTRICT_KEYWORDS)) {
    const city = data.city;
    (map[city] ??= new Set()).add(normalizeLocation(district));
  }
  return map;
})();

// ==================== AIRPORT TO CITY MAPPING ====================
// When an airport is found, this determines the correct city for price matching
// This prevents false positives from district keywords matching wrong cities
// Türkiye - tüm havalimanları için şehir eşlemesi
const AIRPORT_TO_CITY: Record<string, string> = {
  'Istanbul Airport (IST)': 'Istanbul',
  'Sabiha Gokcen Airport (SAW)': 'Istanbul',
  'Antalya Airport (AYT)': 'Antalya',
  'Gazipasa-Alanya Airport (GZP)': 'Alanya',
  'Bodrum-Milas Airport (BJV)': 'Bodrum',
  'Dalaman Airport (DLM)': 'Dalaman',
  'Izmir Adnan Menderes Airport (ADB)': 'Izmir',
  'Kayseri Airport (ASR)': 'Cappadocia',
  'Nevsehir-Kapadokya Airport (NAV)': 'Cappadocia',
  'Ankara Esenboga Airport (ESB)': 'Ankara',
  'Adana Sakirpasa Airport (ADA)': 'Adana',
  'Gaziantep Airport (GZT)': 'Gaziantep',
  'Trabzon Airport (TZX)': 'Trabzon',
  'Diyarbakir Airport (DIY)': 'Diyarbakir',
  'Van Ferit Melen Airport (VAN)': 'Van',
  'Malatya Airport (MLX)': 'Malatya',
  'Samsun Carsamba Airport (SZF)': 'Samsun',
  'Kocaeli Cengiz Topel Airport (KCO)': 'Kocaeli',
  'Tekirdag Corlu Airport (TEQ)': 'Tekirdag',
  'Edirne Airport (EDN)': 'Edirne',
  'Kars Harakani Airport (KHV)': 'Kars',
  'Denizli Cardak Airport (DNZ)': 'Denizli',
  'Elazig Airport (EZS)': 'Elazig',
  'Sivas Nuri Demirag Airport (VAS)': 'Sivas',
  'Sinop Airport (NOP)': 'Sinop',
  'Kastamonu Airport (KFS)': 'Kastamonu',
  'Zonguldak Caycuma Airport (ONQ)': 'Zonguldak',
  'Sirnak Airport (NKT)': 'Sirnak',
  'Agri Airport (AJI)': 'Agri',
  'Mardin Airport (MQM)': 'Mardin',
  'Afyon Zafer Airport (KZR)': 'Afyon',
  'Mus Airport (MSR)': 'Mus',
  'Erzurum Airport (ERZ)': 'Erzurum',
  'Erzincan Airport (ERC)': 'Erzincan',
  'Sanliurfa GAP Airport (SFQ)': 'Sanliurfa',
  'Hatay Airport (HTY)': 'Hatay',
  'Balikesir Koca Seyit Airport (EDO)': 'Balikesir',
  'Canakkale Airport (CKZ)': 'Canakkale',
  'Ordu-Giresun Airport (OGU)': 'Ordu',
  'Rize-Artvin Airport (RZV)': 'Rize',
  'Dubai International Airport (DXB)': 'Dubai',
  'Al Maktoum International Airport (DWC)': 'Dubai',
  'Larnaca Airport (LCA)': 'Cyprus',
  'Paphos Airport (PFO)': 'Cyprus',
  'Ercan Airport (ECN)': 'Kuzey Kıbrıs',
  'Bursa Yenisehir Airport (YEI)': 'Bursa',
};

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

function findDistrict(location: string, cityHint?: string | null): DistrictInternalMatch | null {
  const normalized = normalizeLocation(location);
  let bestMatch: DistrictInternalMatch | null = null;

  for (const [district, data] of Object.entries(DISTRICT_KEYWORDS)) {
    if (cityHint && data.city !== cityHint) continue;

    const thisDistrictNorm = normalizeLocation(district);
    const districtNamesForCity = DISTRICT_NAMES_BY_CITY_NORM[data.city];

    // Prefer direct match on district name
    if (normalized.includes(thisDistrictNorm)) {
      const confidence = Math.min(1, 0.85 + (thisDistrictNorm.length / 40));
      if (
        !bestMatch ||
        confidence > bestMatch.confidence ||
        (confidence === bestMatch.confidence && data.priority < bestMatch.priority)
      ) {
        bestMatch = {
          value: district,
          city: data.city,
          confidence,
          priority: data.priority,
          matchedKeyword: district,
        };
      }
    }

    const keywords = data.keywords.includes(district) ? data.keywords : [district, ...data.keywords];

    for (const keyword of keywords) {
      const keywordNorm = normalizeLocation(keyword);

      // Guard: ignore keywords that equal another district name in same city
      if (
        districtNamesForCity &&
        keywordNorm !== thisDistrictNorm &&
        districtNamesForCity.has(keywordNorm)
      ) {
        continue;
      }

      if (normalized.includes(keywordNorm)) {
        const confidence = Math.min(1, 0.7 + (keywordNorm.length / 25));

        if (
          !bestMatch ||
          confidence > bestMatch.confidence ||
          (confidence === bestMatch.confidence && data.priority < bestMatch.priority)
        ) {
          bestMatch = {
            value: district,
            city: data.city,
            confidence,
            priority: data.priority,
            matchedKeyword: keyword,
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
  
  // CRITICAL FIX: When airport is found, derive city from airport to prevent false positives
  // Example: "Antalya Havalimanı, Yeşilköy" should NOT match Istanbul/Bakirkoy because of "Yeşilköy"
  const airportDerivedCity = airportMatch ? AIRPORT_TO_CITY[airportMatch.value] || null : null;
  
  // Only use findCity if no airport was found for that location
  const cityMatch = airportMatch && airportDerivedCity 
    ? { value: airportDerivedCity, confidence: 1, priority: 1, matchedKeyword: 'airport-derived' }
    : findCity(location);
  
  // For district search, use the airport-derived city as hint to constrain the search
  const cityHint = airportDerivedCity || cityMatch?.value || null;
  const districtMatch = findDistrict(location, cityHint);
  
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
    
    // Convert airport name to DB code (e.g., 'Ercan Airport (ECN)' -> 'ECN')
    let airportDbCode: string | null = null;
    if (airport && AIRPORT_TO_DB_CODE[airport]) {
      airportDbCode = AIRPORT_TO_DB_CODE[airport];
      console.log('🔄 Airport DB code mapping:', airport, '->', airportDbCode);
    } else if (airport) {
      // Fallback: extract code from parentheses if present
      const codeMatch = airport.match(/\(([A-Z]{3})\)/);
      airportDbCode = codeMatch ? codeMatch[1] : airport;
    }
    
    // Convert KKTC district codes to DB names (e.g., 'Alsancak-KKTC' -> 'Alsancak')
    if (district && KKTC_DISTRICT_DB_MAPPING[district]) {
      const originalDistrict = district;
      district = KKTC_DISTRICT_DB_MAPPING[district];
      console.log('🔄 KKTC district mapping:', originalDistrict, '->', district);
    }
    
    if (!city && !airport) {
      console.log('❌ No city or airport found in locations');
      return { found: false };
    }
    
    // 1. Try exact match
    if (airportDbCode && city && district) {
      const { data: exactMatch, error } = await supabase
        .from('region_prices')
        .select('*')
        .eq('city', city)
        .eq('airport', airportDbCode)
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
    if (airportDbCode && city) {
      const { data: cityMatch, error } = await supabase
        .from('region_prices')
        .select('*')
        .eq('city', city)
        .eq('airport', airportDbCode)
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
// Promo code validation now uses database - these are fallback codes only
const FALLBACK_PROMO_CODES = ['MEET25RETURN', 'GIDISDONUS', 'RETURN25', 'MEET25'];
const FALLBACK_DISCOUNT_PERCENT = 25; // Used only when DB is unavailable

export function applyPromoDiscount(
  price: number,
  hasReturnTrip: boolean,
  promoCode: string | null,
  discountPercent: number = FALLBACK_DISCOUNT_PERCENT // Accept dynamic discount from DB
): { finalPrice: number; discountApplied: boolean; discountPercent: number } {
  if (hasReturnTrip && promoCode && (FALLBACK_PROMO_CODES.includes(promoCode.toUpperCase()) || discountPercent > 0)) {
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
  
  const { finalPrice: discountedReturn, discountApplied, discountPercent: appliedPercent } = applyPromoDiscount(
    basePrice,
    true,
    promoCode,
    FALLBACK_DISCOUNT_PERCENT // Will be overridden by dynamic value when available
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
    discountPercent: appliedPercent,
    savings,
  };
}
