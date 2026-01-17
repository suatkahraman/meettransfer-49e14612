// Shared price matching utilities for edge functions
// Optimized location matching with fuzzy search and priority ordering

// ==================== AIRPORT KEYWORDS ====================
export const AIRPORT_KEYWORDS: Record<string, { keywords: string[]; priority: number }> = {
  'Istanbul Airport (IST)': {
    priority: 1,
    keywords: [
      'istanbul airport', 'ist airport', 'istanbul havalimanı', 'istanbul havalimani', 
      'new istanbul airport', 'yeni istanbul havalimanı', 'arnavutköy', 'arnavutkoy',
      'istanbul new airport', 'istanbul uluslararasi havalimani', 'istanbul international',
      'istanbul havaalani', 'iğa', 'iga', 'istanbul ist', 'ist istanbul'
      // Note: Removed 'ist' - too short, matches any Istanbul address
    ]
  },
  'Sabiha Gokcen Airport (SAW)': {
    priority: 2,
    keywords: [
      'sabiha', 'saw', 'sabiha gökçen', 'sabiha gokcen', 'sabiha gokçen', 
      'sabiha gokcen airport', 'saw airport', 'sabiha gökçen havalimanı', 'kurtköy', 'kurtkoy',
      'sabiha gokcen havalimani', 'sabiha gocken', 'pendik airport', 'asian side airport'
    ]
  },
  'Antalya Airport (AYT)': {
    priority: 1,
    keywords: [
      'antalya airport', 'ayt', 'antalya havalimanı', 'antalya havalimani',
      'antalya international', 'ayt airport', 'antalya havaalani', 'antalya ayt'
    ]
  },
  'Bodrum-Milas Airport (BJV)': {
    priority: 1,
    keywords: [
      'bodrum airport', 'milas airport', 'bjv', 'bodrum milas', 'milas bodrum',
      'bodrum havalimanı', 'milas havalimanı', 'bodrum milas havalimani',
      'milas bodrum airport', 'bodrum bjv'
    ]
  },
  'Dalaman Airport (DLM)': {
    priority: 1,
    keywords: [
      'dalaman airport', 'dlm', 'dalaman havalimanı', 'dalaman havalimani', 'dalaman dlm'
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
      'erkilet', 'erkilet airport', 'kayseri asr'
    ]
  },
  'Nevsehir-Kapadokya Airport (NAV)': {
    priority: 1,
    keywords: [
      'nevsehir airport', 'nevşehir havalimanı', 'kapadokya airport', 'nav',
      'cappadocia airport', 'kapadokya havalimanı', 'kapadokya havalimani',
      'nevsehir nav', 'goreme airport'
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
      'eminonu', 'eminönü', 'balat', 'eyup', 'eyüp', 'florya', 'yesilkoy', 'yeşilköy',
      'bagcilar', 'bağcılar', 'bahcelievler', 'bahçelievler', 'bayrampasa', 'bayrampaşa',
      'esenyurt', 'avcilar', 'avcılar', 'kucukcekmece', 'küçükçekmece', 'buyukcekmece',
      'silivri', 'catalca', 'çatalca', 'arnavutkoy', 'basaksehir', 'başakşehir',
      'beylikduzu', 'beylikdüzü', 'cekmekoy', 'çekmeköy', 'sancaktepe', 'sultanbeyli',
      'umraniye', 'ümraniye', 'beykoz', 'sile', 'şile', 'adalar', 'princes islands'
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
      'avsallar', 'konakli', 'konaklı', 'incekum', 'titreyen gol', 'titreyen göl',
      'aksu', 'dosemealti', 'döşemealtı', 'kepez', 'muratpasa', 'muratpaşa'
    ]
  },
  'Bodrum': {
    priority: 1,
    keywords: [
      'bodrum', 'yalikavak', 'yalıkavak', 'turgutreis', 'gumbet', 'gümbet', 
      'bitez', 'turkbuku', 'türkbükü', 'golturkbuku', 'göltürkbükü',
      'ortakent', 'gumusluk', 'gümüşlük', 'akyarlar', 'gundogan', 'gündoğan',
      'kadikalesi', 'torba', 'gulluk', 'güllük', 'konacik', 'konacık',
      'yahsi', 'yahşi', 'palmarina'
    ]
  },
  'Dalaman': {
    priority: 1,
    keywords: [
      'dalaman', 'fethiye', 'oludeniz', 'ölüdeniz', 'hisaronu', 'hisarönü', 
      'marmaris', 'gocek', 'göcek', 'dalyan', 'koycegiz', 'köyceğiz',
      'icmeler', 'içmeler', 'turunc', 'turunç', 'akyaka', 'ortaca',
      'ovacik', 'ovacık', 'calis', 'çalış', 'kayakoy', 'kayaköy',
      'saklikent', 'saklıkent', 'sarigerme', 'sarıgerme', 'ekincik',
      'uzumlu', 'üzümlü', 'mugla', 'muğla'
    ]
  },
  'Izmir': {
    priority: 1,
    keywords: [
      'izmir', 'İzmir', 'cesme', 'çeşme', 'alacati', 'alaçatı', 
      'kusadasi', 'kuşadası', 'selcuk', 'selçuk', 'ephesus', 'efes',
      'urla', 'seferihisar', 'dikili', 'foca', 'foça', 'bergama',
      'sirince', 'şirince', 'konak', 'karsiyaka', 'karşıyaka', 'alsancak',
      'bornova', 'buca', 'guzelbahce', 'güzelbahçe', 'ildir', 'ildır',
      'ozdere', 'özdere', 'pamukkale', 'pamucak'
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
      'kocaeli', 'izmit', 'İzmit', 'gebze', 'kartepe', 'sapanca', 'kandira', 'kandıra',
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
      'arabian ranches', 'dubai creek', 'al quoz', 'jlt', 'motor city',
      'silicon oasis', 'sports city', 'mirdif', 'al nahda', 'sharjah'
    ]
  },
  'Cyprus': {
    priority: 1,
    keywords: [
      'cyprus', 'kıbrıs', 'kibris', 'nicosia', 'lefkosa', 'lefkoşa', 
      'limassol', 'larnaca', 'paphos', 'famagusta', 'magusa', 'mağusa',
      'kyrenia', 'girne', 'ayia napa', 'protaras', 'paralimni', 'polis',
      'coral bay', 'latchi', 'troodos', 'platres', 'bafra', 'iskele', 'karpaz'
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
  'Taksim': { priority: 1, keywords: ['taksim', 'taksim square', 'taksim meydanı', 'taksim meydani', 'talimhane', 'harbiye', 'elmadağ', 'elmadag'], city: 'Istanbul' },
  'Sultanahmet': { priority: 1, keywords: ['sultanahmet', 'blue mosque', 'hagia sophia', 'ayasofya', 'topkapi', 'topkapı', 'hippodrome', 'sultanahmet meydanı', 'grand bazaar', 'kapali carsi'], city: 'Istanbul' },
  'Beyoglu': { priority: 1, keywords: ['beyoglu', 'beyoğlu', 'galata', 'karakoy', 'karaköy', 'cihangir', 'istiklal', 'pera', 'tunel', 'tünel', 'galata tower', 'galata kulesi'], city: 'Istanbul' },
  'Sisli': { priority: 1, keywords: ['sisli', 'şişli', 'mecidiyekoy', 'mecidiyeköy', 'nisantasi', 'nişantaşı', 'osmanbey', 'bomonti', 'esentepe', 'fulya', 'tesvikiye', 'teşvikiye'], city: 'Istanbul' },
  'Besiktas': { priority: 1, keywords: ['besiktas', 'beşiktaş', 'ortakoy', 'ortaköy', 'bebek', 'etiler', 'levent', 'akaretler', 'ciragan', 'çırağan', 'yildiz', 'yıldız'], city: 'Istanbul' },
  'Fatih': { priority: 1, keywords: ['fatih', 'aksaray', 'laleli', 'eminonu', 'eminönü', 'sirkeci', 'balat', 'fener', 'unkapani', 'vefa', 'carsamba', 'çarşamba'], city: 'Istanbul' },
  'Levent': { priority: 2, keywords: ['levent', 'maslak', '4. levent', 'zorlu', 'kanyon', 'sapphire', '1. levent', '2. levent', '3. levent', 'levazim', 'levazım'], city: 'Istanbul' },
  'Bakirkoy': { priority: 1, keywords: ['bakirkoy', 'bakırköy', 'florya', 'yesilkoy', 'yeşilköy', 'atakoy', 'ataköy', 'bahcelievler', 'bahçelievler', 'yenibosna'], city: 'Istanbul' },
  'Sariyer': { priority: 2, keywords: ['sariyer', 'sarıyer', 'istinye', 'tarabya', 'yenikoy', 'yeniköy', 'emirgan', 'maslak', 'rumeli', 'rumeli feneri'], city: 'Istanbul' },
  'Zeytinburnu': { priority: 2, keywords: ['zeytinburnu', 'kazlicesme', 'kazlıçeşme', 'veliefendi'], city: 'Istanbul' },
  'Eyup': { priority: 2, keywords: ['eyup', 'eyüp', 'eyup sultan', 'pierre loti', 'sutluce', 'sütlüce'], city: 'Istanbul' },
  
  // Istanbul - Batı Yakası (Eksik ilçeler eklendi)
  'Beylikduzu': { priority: 1, keywords: ['beylikduzu', 'beylikdüzü', 'beylikduzu migros', 'gurpinar', 'gürpınar', 'yakuplu', 'adnan kahveci', 'beylikduzunde'], city: 'Istanbul' },
  'Esenyurt': { priority: 1, keywords: ['esenyurt', 'kiraç', 'kirac', 'saadetdere', 'yenikent'], city: 'Istanbul' },
  'Avcilar': { priority: 1, keywords: ['avcilar', 'avcılar', 'firuzköy', 'firuzkoy', 'cihangir avcilar', 'ambarli', 'ambarlı'], city: 'Istanbul' },
  'Kucukcekmece': { priority: 1, keywords: ['kucukcekmece', 'küçükçekmece', 'cennet', 'halkalı', 'halkali', 'sefakoy', 'şefaköy', 'atakent', 'ikitelli'], city: 'Istanbul' },
  'Buyukcekmece': { priority: 2, keywords: ['buyukcekmece', 'büyükçekmece', 'tepecik', 'guzelce', 'güzelce', 'mimarsinan', 'mimar sinan'], city: 'Istanbul' },
  'Basaksehir': { priority: 1, keywords: ['basaksehir', 'başakşehir', 'kayasehir', 'kayaşehir', 'bahcesehir', 'bahçeşehir', 'metrokent'], city: 'Istanbul' },
  'Bagcilar': { priority: 2, keywords: ['bagcilar', 'bağcılar', 'gunesli', 'güneşli', 'mahmutbey', 'kirazli', 'kirazlı'], city: 'Istanbul' },
  'Bahcelievler': { priority: 2, keywords: ['bahcelievler', 'bahçelievler', 'yenibosna', 'kocasinan', 'cobancesme', 'çobançeşme'], city: 'Istanbul' },
  'Catalca': { priority: 2, keywords: ['catalca', 'çatalca', 'ferhatpasa', 'ferhatpaşa'], city: 'Istanbul' },
  'Silivri': { priority: 2, keywords: ['silivri', 'kumburgaz', 'selimpasa', 'selimpaşa'], city: 'Istanbul' },
  'Arnavutkoy': { priority: 2, keywords: ['arnavutkoy', 'arnavutköy', 'hadimkoy', 'hadımköy', 'haraççı', 'haracci'], city: 'Istanbul' },
  'Esenler': { priority: 2, keywords: ['esenler', 'atisalani', 'atışalanı', 'otogar', 'menderes'], city: 'Istanbul' },
  'Gaziosmanpasa': { priority: 2, keywords: ['gaziosmanpasa', 'gaziosmanpaşa', 'sultanciftligi', 'sultançiftliği', 'kucukkoy', 'küçükköy'], city: 'Istanbul' },
  'Gungoren': { priority: 2, keywords: ['gungoren', 'güngören', 'merkez mahallesi', 'tozkoparan'], city: 'Istanbul' },
  'Sultangazi': { priority: 2, keywords: ['sultangazi', 'cebeci', 'esentepe sultangazi', 'habibler'], city: 'Istanbul' },
  
  // Istanbul - Anadolu Yakası
  'Kadikoy': { priority: 1, keywords: ['kadikoy', 'kadıköy', 'caferaga', 'caferağa', 'moda', 'fenerbahce', 'fenerbahçe', 'bostanci', 'bostancı', 'caddebostan', 'suadiye', 'goztepe', 'göztepe', 'kozyatagi', 'kozyatağı'], city: 'Istanbul' },
  'Uskudar': { priority: 1, keywords: ['uskudar', 'üsküdar', 'cengelkoy', 'çengelköy', 'kuzguncuk', 'beylerbeyi', 'salacak', 'kandilli', 'vanikoy', 'vaniköy', 'anadolu hisari', 'anadolu hisarı'], city: 'Istanbul' },
  'Atasehir': { priority: 1, keywords: ['atasehir', 'ataşehir', 'finance center', 'finans merkezi', 'watergarden', 'batikent', 'barbaros', 'istmarina'], city: 'Istanbul' },
  'Pendik': { priority: 2, keywords: ['pendik', 'kaynarca', 'tersane', 'guzelyali', 'güzelyalı', 'esenyali', 'esenyalı'], city: 'Istanbul' },
  'Tuzla': { priority: 2, keywords: ['tuzla', 'tuzla organize', 'aydınlı', 'aydinli', 'orhanlı', 'orhanli', 'tepeoren', 'içmeler tuzla'], city: 'Istanbul' },
  'Kartal': { priority: 2, keywords: ['kartal', 'soganlik', 'soğanlık', 'kordonboyu', 'cevizli', 'yakacik', 'yakacık'], city: 'Istanbul' },
  'Maltepe': { priority: 2, keywords: ['maltepe', 'altaycesme', 'altayçeşme', 'dragos', 'ideal tepe', 'idealtepe', 'kucukyali', 'küçükyalı', 'cevizli maltepe'], city: 'Istanbul' },
  'Umraniye': { priority: 2, keywords: ['umraniye', 'ümraniye', 'dudullu', 'ihlamurkuyu', 'ihlamur kuyu', 'yamanevler'], city: 'Istanbul' },
  'Cekmekoy': { priority: 2, keywords: ['cekmekoy', 'çekmeköy', 'alemdag', 'alemdağ', 'omerli', 'ömerli', 'tasdelen', 'taşdelen'], city: 'Istanbul' },
  'Sancaktepe': { priority: 2, keywords: ['sancaktepe', 'samandira', 'samandıra', 'sarıgazi', 'sarigazi', 'sultanbeyli'], city: 'Istanbul' },
  'Sultanbeyli': { priority: 2, keywords: ['sultanbeyli', 'hasanpasa', 'hasanpaşa', 'mecidiye'], city: 'Istanbul' },
  'Beykoz': { priority: 2, keywords: ['beykoz', 'pasabahce', 'paşabahçe', 'kavacik', 'kavacık', 'riva', 'anadolu kavagi', 'anadolu kavağı', 'acarlar'], city: 'Istanbul' },
  'Sile': { priority: 2, keywords: ['sile', 'şile', 'agva', 'ağva', 'kumbaba', 'sahilkoy', 'sahilköy'], city: 'Istanbul' },
  
  // Antalya - Each district matches DB exactly (Beldibi, Goynuk, Tekirova, Cirali, Olympos are separate from Kemer)
  'Kaleici': { priority: 1, keywords: ['kaleici', 'kaleiçi', 'old town antalya', 'old city antalya', 'antalya old town', 'antalya marina', 'yat limani'], city: 'Antalya' },
  'Konyaalti': { priority: 1, keywords: ['konyaalti', 'konyaaltı', 'konyaalti beach', 'konyaaltı plajı', 'konyaalti plaji', 'hurma', 'liman'], city: 'Antalya' },
  'Lara': { priority: 1, keywords: ['lara', 'lara beach', 'lara plaji', 'lara plajı', 'lower lara', 'upper lara'], city: 'Antalya' },
  'Kundu': { priority: 1, keywords: ['kundu'], city: 'Antalya' },
  'Belek': { priority: 1, keywords: ['belek', 'belek golf', 'the land of legends', 'land of legends'], city: 'Antalya' },
  'Kadriye': { priority: 1, keywords: ['kadriye', 'bogazkent', 'boğazkent'], city: 'Antalya' },
  'Serik': { priority: 2, keywords: ['serik'], city: 'Antalya' },
  'Side': { priority: 1, keywords: ['side', 'kumkoy', 'kumköy', 'colakli', 'çolaklı', 'evrenseki', 'titreyengol', 'titreyen gol', 'sorgun'], city: 'Antalya' },
  'Manavgat': { priority: 1, keywords: ['manavgat', 'gundogdu', 'gündoğdu'], city: 'Antalya' },
  'Alanya': { priority: 1, keywords: ['alanya', 'mahmutlar', 'okurcalar', 'avsallar', 'konakli', 'konaklı', 'incekum', 'alanya castle', 'cleopatra beach', 'kleopatra plaji', 'kestel', 'oba', 'tosmur'], city: 'Antalya' },
  'Kemer': { priority: 1, keywords: ['kemer', 'kemer center', 'kemer merkez', 'kemer marina', 'camyuva', 'kiriş', 'kiris'], city: 'Antalya' },
  'Beldibi': { priority: 1, keywords: ['beldibi', 'beldib'], city: 'Antalya' },
  'Goynuk': { priority: 1, keywords: ['goynuk', 'göynük', 'goynuk canyon', 'göynük kanyonu'], city: 'Antalya' },
  'Tekirova': { priority: 1, keywords: ['tekirova', 'phaselis', 'faselis'], city: 'Antalya' },
  'Cirali': { priority: 1, keywords: ['cirali', 'çıralı', 'chimaera', 'yanartaş'], city: 'Antalya' },
  'Olympos': { priority: 1, keywords: ['olympos', 'olimpos'], city: 'Antalya' },
  'Kas': { priority: 1, keywords: ['kas', 'kaş', 'patara'], city: 'Antalya' },
  'Kalkan': { priority: 1, keywords: ['kalkan', 'saklikent', 'saklıkent', 'xanthos', 'letoon'], city: 'Antalya' },
  
  // Bodrum - Each district separate for exact matching
  'Bodrum Center': { priority: 1, keywords: ['bodrum center', 'bodrum merkez', 'bodrum centrum', 'bodrum city', 'bodrum town', 'bodrum castle', 'bodrum marina', 'bodrum kalesi', 'bodrum bar street', 'barlar sokagi'], city: 'Bodrum' },
  'Yalikavak': { priority: 1, keywords: ['yalikavak', 'yalıkavak', 'palmarina', 'yalikavak marina', 'yalıkavak marina'], city: 'Bodrum' },
  'Turgutreis': { priority: 1, keywords: ['turgutreis', 'turgut reis', 'turgutreis marina'], city: 'Bodrum' },
  'Akyarlar': { priority: 1, keywords: ['akyarlar'], city: 'Bodrum' },
  'Guvercinlik': { priority: 2, keywords: ['guvercinlik', 'güvercinlik'], city: 'Bodrum' },
  'Gumbet': { priority: 1, keywords: ['gumbet', 'gümbet', 'gumbet beach'], city: 'Bodrum' },
  'Turkbuku': { priority: 1, keywords: ['turkbuku', 'türkbükü', 'golturkbuku', 'göltürkbükü', 'gol turkbuku'], city: 'Bodrum' },
  'Bitez': { priority: 1, keywords: ['bitez', 'bitez beach'], city: 'Bodrum' },
  'Ortakent': { priority: 2, keywords: ['ortakent', 'ortakent yahsi', 'yahsi', 'yahşi', 'ortakent yahşi'], city: 'Bodrum' },
  'Gumusluk': { priority: 1, keywords: ['gumusluk', 'gümüşlük', 'rabbit island', 'tavsan adasi', 'tavşan adası'], city: 'Bodrum' },
  'Gundogan': { priority: 2, keywords: ['gundogan', 'gündoğan', 'farilya'], city: 'Bodrum' },
  'Torba': { priority: 2, keywords: ['torba', 'torba bay', 'torba koy', 'torba koyu'], city: 'Bodrum' },
  
  // Dalaman / Fethiye / Marmaris - Each district separate
  'Fethiye': { priority: 1, keywords: ['fethiye', 'fethiye marina', 'fethiye center', 'fethiye merkez'], city: 'Dalaman' },
  'Calis': { priority: 1, keywords: ['calis', 'çalış', 'calis beach', 'çalış plajı'], city: 'Dalaman' },
  'Oludeniz': { priority: 1, keywords: ['oludeniz', 'ölüdeniz', 'blue lagoon', 'belcekiz', 'belceğiz'], city: 'Dalaman' },
  'Hisaronu': { priority: 1, keywords: ['hisaronu', 'hisarönü'], city: 'Dalaman' },
  'Ovacik': { priority: 1, keywords: ['ovacik', 'ovacık'], city: 'Dalaman' },
  'Marmaris': { priority: 1, keywords: ['marmaris', 'marmaris marina', 'marmaris center', 'marmaris merkez', 'marmaris bar street', 'armutalan', 'siteler'], city: 'Dalaman' },
  'Icmeler': { priority: 1, keywords: ['icmeler', 'içmeler'], city: 'Dalaman' },
  'Turunc': { priority: 1, keywords: ['turunc', 'turunç'], city: 'Dalaman' },
  'Gocek': { priority: 1, keywords: ['gocek', 'göcek', 'gocek marina', 'd-marin', 'marinturk'], city: 'Dalaman' },
  'Dalyan': { priority: 1, keywords: ['dalyan', 'iztuzu', 'turtle beach', 'dalyan river', 'mud baths', 'camur banyolari'], city: 'Dalaman' },
  'Koycegiz': { priority: 1, keywords: ['koycegiz', 'köyceğiz', 'koycegiz lake'], city: 'Dalaman' },
  'Sarigerme': { priority: 2, keywords: ['sarigerme', 'sarıgerme', 'sarigerme beach'], city: 'Dalaman' },
  
  // Izmir - Each district separate
  'Cesme': { priority: 1, keywords: ['cesme', 'çeşme', 'cesme marina', 'boyalik', 'boyalık'], city: 'Izmir' },
  'Ilica': { priority: 1, keywords: ['ilica', 'ılıca', 'ilica beach'], city: 'Izmir' },
  'Alacati': { priority: 1, keywords: ['alacati', 'alaçatı', 'alacati windmill', 'alacati stone houses', 'alacati tas evler'], city: 'Izmir' },
  'Kusadasi': { priority: 1, keywords: ['kusadasi', 'kuşadası', 'ladies beach', 'kadınlar denizi', 'kusadasi marina', 'kusadasi merkez', 'pigeons island', 'guvercin adasi', 'güvercin adası'], city: 'Izmir' },
  'Selcuk': { priority: 1, keywords: ['selcuk', 'selçuk', 'ephesus', 'efes', 'ephesus ancient city', 'efes antik kenti'], city: 'Izmir' },
  'Sirince': { priority: 1, keywords: ['sirince', 'şirince'], city: 'Izmir' },
  'Alsancak': { priority: 1, keywords: ['alsancak', 'konak', 'kordon', 'pasaport', 'izmir center', 'izmir merkez'], city: 'Izmir' },
  'Karsiyaka': { priority: 2, keywords: ['karsiyaka', 'karşıyaka'], city: 'Izmir' },
  'Bornova': { priority: 2, keywords: ['bornova'], city: 'Izmir' },
  
  // Cappadocia - Each district separate
  'Goreme': { priority: 1, keywords: ['goreme', 'göreme', 'goreme town', 'goreme open air museum', 'goreme acik hava muzesi'], city: 'Cappadocia' },
  'Urgup': { priority: 1, keywords: ['urgup', 'ürgüp', 'urgup center', 'urgup merkez'], city: 'Cappadocia' },
  'Uchisar': { priority: 1, keywords: ['uchisar', 'uçhisar', 'uchisar castle', 'uchisar kalesi', 'uçhisar kalesi'], city: 'Cappadocia' },
  'Avanos': { priority: 1, keywords: ['avanos', 'avanos pottery', 'kizilirmak', 'kızılırmak'], city: 'Cappadocia' },
  'Ortahisar': { priority: 2, keywords: ['ortahisar', 'ortahisar castle', 'ortahisar kalesi'], city: 'Cappadocia' },
  'Nevsehir Center': { priority: 2, keywords: ['nevsehir center', 'nevşehir merkez', 'nevsehir merkez', 'nevsehir city'], city: 'Cappadocia' },
  'Mustafapasa': { priority: 2, keywords: ['mustafapasa', 'mustafapaşa', 'sinasos'], city: 'Cappadocia' },
  'Cavusin': { priority: 2, keywords: ['cavusin', 'çavuşin'], city: 'Cappadocia' },
  
  // Bursa - Each district separate
  'Osmangazi': { priority: 1, keywords: ['osmangazi', 'bursa center', 'bursa merkez', 'heykel', 'bursa city', 'setbasi', 'setbaşı', 'altiparmak', 'altıparmak', 'ulucami', 'ulu cami', 'bursa otogar', 'otogar', 'bus station', 'otobus terminali', 'otobüs terminali', 'terminal cd', 'terminal caddesi', 'demirtas', 'demirtaş', 'dumlupinar', 'dumlupınar'], city: 'Bursa' },
  'Nilufer': { priority: 2, keywords: ['nilufer', 'nilüfer', 'gorukle', 'görükle', 'ozluece', 'özlüce'], city: 'Bursa' },
  'Yildirim': { priority: 2, keywords: ['yildirim', 'yıldırım'], city: 'Bursa' },
  'Mudanya': { priority: 1, keywords: ['mudanya', 'guzelyali', 'güzelyalı', 'tirilye', 'trilye', 'mudanya iskele'], city: 'Bursa' },
  'Uludag': { priority: 1, keywords: ['uludag', 'uludağ', 'mount uludag', 'uludag ski', 'uludag kayak', 'oteller bolgesi', 'hotels region'], city: 'Bursa' },
  'Cumalikizik': { priority: 1, keywords: ['cumalikizik', 'cumalıkızık', 'cumalikizik village', 'cumalikizik koyu'], city: 'Bursa' },
  'Iznik': { priority: 2, keywords: ['iznik', 'nicaea', 'iznik lake', 'iznik golu', 'iznik gölü'], city: 'Bursa' },
  'Gemlik': { priority: 2, keywords: ['gemlik', 'gemlik zeytini'], city: 'Bursa' },
  'Orhangazi': { priority: 2, keywords: ['orhangazi'], city: 'Bursa' },
  
  // Kocaeli - Each district separate
  'Izmit': { priority: 1, keywords: ['izmit', 'İzmit', 'kocaeli center', 'kocaeli merkez', 'kocaeli city'], city: 'Kocaeli' },
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
  'Adapazari': { priority: 1, keywords: ['adapazari', 'adapazarı', 'sakarya center', 'sakarya merkez'], city: 'Sakarya' },
  'Serdivan': { priority: 2, keywords: ['serdivan', 'bahcesehir', 'bahçeşehir'], city: 'Sakarya' },
  
  // Dubai
  'Downtown Dubai': { priority: 1, keywords: ['downtown', 'downtown dubai', 'burj khalifa', 'dubai mall', 'boulevard', 'dubai fountain'], city: 'Dubai' },
  'Dubai Marina': { priority: 1, keywords: ['marina', 'dubai marina', 'jbr', 'jumeirah beach residence', 'the walk', 'marina walk', 'marina mall'], city: 'Dubai' },
  'Palm Jumeirah': { priority: 1, keywords: ['palm', 'palm jumeirah', 'atlantis', 'the palm', 'atlantis the palm', 'palm beach'], city: 'Dubai' },
  'Deira': { priority: 2, keywords: ['deira', 'gold souk', 'spice souk', 'naif', 'al ras', 'creek side'], city: 'Dubai' },
  'Jumeirah': { priority: 1, keywords: ['jumeirah', 'jumeira', 'jumeirah beach', 'umm suqeim', 'burj al arab', 'madinat jumeirah'], city: 'Dubai' },
  'Business Bay': { priority: 2, keywords: ['business bay', 'bay square', 'executive towers', 'canal walk'], city: 'Dubai' },
  'Al Barsha': { priority: 2, keywords: ['al barsha', 'barsha', 'mall of emirates', 'mall of the emirates', 'moe'], city: 'Dubai' },
  
  // Cyprus
  'Nicosia': { priority: 1, keywords: ['nicosia', 'lefkosa', 'lefkoşa', 'north nicosia', 'south nicosia', 'ledra street'], city: 'Cyprus' },
  'Limassol': { priority: 1, keywords: ['limassol', 'lemesos', 'limassol marina', 'limassol old town'], city: 'Cyprus' },
  'Larnaca City': { priority: 1, keywords: ['larnaca city', 'larnaca center', 'larnaka', 'larnaca', 'larnaca marina', 'finikoudes'], city: 'Cyprus' },
  'Paphos City': { priority: 1, keywords: ['paphos', 'pafos', 'kato paphos', 'coral bay', 'paphos harbor', 'paphos marina'], city: 'Cyprus' },
  'Ayia Napa': { priority: 1, keywords: ['ayia napa', 'agia napa', 'nissi beach', 'napa', 'ayia napa marina'], city: 'Cyprus' },
  'Kyrenia': { priority: 1, keywords: ['kyrenia', 'girne', 'bellapais', 'kyrenia harbor', 'girne limani', 'girne limanı', 'alsancak', 'lapta'], city: 'Cyprus' },
  'Protaras': { priority: 1, keywords: ['protaras', 'fig tree bay', 'paralimni', 'cape greco', 'kapparis'], city: 'Cyprus' },
  'Famagusta': { priority: 2, keywords: ['famagusta', 'gazimagusa', 'gazimağusa', 'magosa', 'mağosa', 'salamis'], city: 'Cyprus' },
};

// ==================== VEHICLE TYPE MAPPING ====================
// Import from shared vehicleConfig - kept here for backward compatibility
export { VEHICLE_FALLBACK_ORDER, getVehicleFallbackList, getVehicleLabel, VEHICLE_LABELS } from "./vehicleConfig.ts";

// ==================== NORMALIZATION ====================
export function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .replace(/türkiye|turkey|türkei|turkiye|türkei|tuerkei/gi, '')
    .replace(/,\s*(tr|turkey|türkiye|turkiye)$/i, '')
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
    // Common typos and variations
    .replace(/air\s*port/g, 'airport')
    .replace(/havaalani/g, 'havalimani')
    .replace(/hava\s*limani/g, 'havalimani')
    .replace(/hava\s*alani/g, 'havalimani')
    .trim();
}

// Build a normalized set of district names per city.
// This is used as a safety guard: if a district's keyword accidentally equals another district name
// in the SAME city (e.g. Side keywords containing "manavgat"), we ignore that keyword to prevent
// misclassification and missing price matches.
const DISTRICT_NAMES_BY_CITY_NORM: Record<string, Set<string>> = (() => {
  const map: Record<string, Set<string>> = {};
  for (const [district, data] of Object.entries(DISTRICT_KEYWORDS)) {
    const city = data.city;
    (map[city] ??= new Set()).add(normalizeLocation(district));
  }
  return map;
})();

// ==================== FUZZY MATCHING ====================
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Common address stopwords that should not trigger matches
const ADDRESS_STOPWORDS = new Set([
  'mah', 'mahalle', 'mahallesi', 'cad', 'cadde', 'caddesi', 'cd',
  'sk', 'sok', 'sokak', 'sokagi', 'no', 'apt', 'apartman', 'daire',
  'kat', 'blok', 'site', 'sitesi', 'konut', 'konutlari', 'evleri',
  'plaza', 'is', 'merkezi', 'center', 'bulvar', 'bulvari', 'yolu',
  'hotel', 'otel', 'resort', 'luxury', 'beach', 'garden', 'park',
  'magic', 'life', 'club', 'spa', 'villa', 'residence', 'suites',
  'havalimanı', 'havalimani', 'airport', 'terminal', 'ege'
]);

function fuzzyMatch(text: string, keyword: string, threshold: number = 0.8): boolean {
  const normalizedText = normalizeLocation(text);
  const normalizedKeyword = normalizeLocation(keyword);
  
  // Exact match
  if (normalizedText.includes(normalizedKeyword)) {
    return true;
  }
  
  // Word-by-word match for multi-word keywords
  // CRITICAL FIX: Filter out short words (1-2 chars) AND common address stopwords
  // This prevents false matches like "L HOTEL" matching "Istanbul" via single letters
  const keywordWords = normalizedKeyword.split(' ').filter(w => w.length > 2 && !ADDRESS_STOPWORDS.has(w));
  const textWords = normalizedText.split(' ').filter(w => w.length > 2 && !ADDRESS_STOPWORDS.has(w));
  
  for (const kw of keywordWords) {
    let found = false;
    for (const tw of textWords) {
      if (tw.includes(kw) || kw.includes(tw)) {
        found = true;
        break;
      }
      // Levenshtein for short words
      if (kw.length >= 4 && tw.length >= 4) {
        const distance = levenshteinDistance(kw, tw);
        const maxLen = Math.max(kw.length, tw.length);
        if (1 - (distance / maxLen) >= threshold) {
          found = true;
          break;
        }
      }
    }
    if (!found && kw.length > 3) {
      return false;
    }
  }
  
  return true;
}

// ==================== AIRPORT TO CITY MAPPING ====================
// When an airport is found, this determines the correct city for price matching
// This prevents false positives from district keywords matching wrong cities
export const AIRPORT_TO_CITY: Record<string, string> = {
  'Istanbul Airport (IST)': 'Istanbul',
  'Sabiha Gokcen Airport (SAW)': 'Istanbul',
  'Antalya Airport (AYT)': 'Antalya',
  'Bodrum-Milas Airport (BJV)': 'Bodrum',
  'Dalaman Airport (DLM)': 'Dalaman',
  'Izmir Adnan Menderes Airport (ADB)': 'Izmir',
  'Kayseri Airport (ASR)': 'Cappadocia',
  'Nevsehir-Kapadokya Airport (NAV)': 'Cappadocia',
  'Dubai International Airport (DXB)': 'Dubai',
  'Al Maktoum International Airport (DWC)': 'Dubai',
  'Larnaca Airport (LCA)': 'Cyprus',
  'Paphos Airport (PFO)': 'Cyprus',
  'Ercan Airport (ECN)': 'Cyprus',
  'Bursa Yenisehir Airport (YEI)': 'Bursa',
};

// ==================== MATCHING FUNCTIONS ====================
export interface MatchResult {
  value: string;
  confidence: number;
  priority: number;
  matchedKeyword: string;
}

// Airport indicator words - location must contain at least one of these for fuzzy matching
const AIRPORT_INDICATOR_WORDS = [
  'airport', 'havalimanı', 'havalimani', 'havaalani', 'havaalanı',
  'terminal', 'arrivals', 'departures', 'gelen', 'giden',
  'ist', 'saw', 'ayt', 'bjv', 'dlm', 'adb', 'asr', 'nav', 'dxb', 'dwc', 'lca', 'pfo', 'ecn', 'yei'
];

function hasAirportIndicator(normalized: string): boolean {
  return AIRPORT_INDICATOR_WORDS.some(indicator => normalized.includes(indicator));
}

export function findAirport(location: string): MatchResult | null {
  const normalized = normalizeLocation(location);
  let bestMatch: MatchResult | null = null;
  
  // Check if location has any airport indicator words
  const hasIndicator = hasAirportIndicator(normalized);
  
  for (const [airport, data] of Object.entries(AIRPORT_KEYWORDS)) {
    for (const keyword of data.keywords) {
      const keywordNorm = normalizeLocation(keyword);
      
      // Direct include check - always allowed
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
      // Fuzzy match for longer keywords - ONLY if location has airport indicator
      // This prevents false positives like "baf havalimanı" matching random addresses
      else if (hasIndicator && keywordNorm.length >= 6 && fuzzyMatch(normalized, keywordNorm, 0.85)) {
        const confidence = Math.min(0.8, 0.5 + (keywordNorm.length / 40));
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            value: airport,
            confidence,
            priority: data.priority,
            matchedKeyword: keyword + ' (fuzzy)'
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
      // Fuzzy match
      else if (keywordNorm.length >= 5 && fuzzyMatch(normalized, keywordNorm, 0.85)) {
        const confidence = Math.min(0.7, 0.4 + (keywordNorm.length / 25));
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            value: city,
            confidence,
            priority: data.priority,
            matchedKeyword: keyword + ' (fuzzy)'
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

// Turkish postal code to district mapping for precise location detection
const POSTAL_CODE_TO_DISTRICT: Record<string, { district: string; city: string }> = {
  // Antalya - Kaş district
  '07580': { district: 'Kas', city: 'Antalya' },
  '07960': { district: 'Kas', city: 'Antalya' },
  // Antalya - Kalkan district
  '07970': { district: 'Kalkan', city: 'Antalya' },
  // Antalya - Alanya district
  '07400': { district: 'Alanya', city: 'Antalya' },
  '07430': { district: 'Alanya', city: 'Antalya' },
  '07450': { district: 'Alanya', city: 'Antalya' },
  // Antalya - Manavgat district
  '07500': { district: 'Manavgat', city: 'Antalya' },
  '07600': { district: 'Manavgat', city: 'Antalya' },
  // Antalya - Side district
  '07330': { district: 'Side', city: 'Antalya' },
  '07550': { district: 'Side', city: 'Antalya' },
  // Antalya - Belek/Serik district
  '07506': { district: 'Belek', city: 'Antalya' },
  '07300': { district: 'Serik', city: 'Antalya' },
  // Antalya - Kemer district
  '07190': { district: 'Kemer', city: 'Antalya' },
  '07980': { district: 'Finike', city: 'Antalya' },
  '07570': { district: 'Demre', city: 'Antalya' },
  '07350': { district: 'Kumluca', city: 'Antalya' },
  // Istanbul districts
  '34000': { district: 'Fatih', city: 'Istanbul' },
  '34130': { district: 'Fatih', city: 'Istanbul' },
  '34122': { district: 'Beyoglu', city: 'Istanbul' },
  '34421': { district: 'Beyoglu', city: 'Istanbul' },
  '34437': { district: 'Beyoglu', city: 'Istanbul' },
  '34435': { district: 'Taksim', city: 'Istanbul' },
  '34360': { district: 'Sisli', city: 'Istanbul' },
  '34340': { district: 'Besiktas', city: 'Istanbul' },
  '34357': { district: 'Besiktas', city: 'Istanbul' },
  '34710': { district: 'Kadikoy', city: 'Istanbul' },
  '34714': { district: 'Kadikoy', city: 'Istanbul' },
  '34740': { district: 'Kadikoy', city: 'Istanbul' },
  '34758': { district: 'Atasehir', city: 'Istanbul' },
  // Izmir districts
  '35000': { district: 'Konak', city: 'Izmir' },
  '35220': { district: 'Konak', city: 'Izmir' },
  '35040': { district: 'Bornova', city: 'Izmir' },
  '35390': { district: 'Karsiyaka', city: 'Izmir' },
  '35930': { district: 'Cesme', city: 'Izmir' },
  '09400': { district: 'Kusadasi', city: 'Izmir' },
  // Mugla districts
  '48400': { district: 'Bodrum Center', city: 'Bodrum' },
  '48700': { district: 'Marmaris', city: 'Dalaman' },
  '48300': { district: 'Fethiye', city: 'Dalaman' },
  '48340': { district: 'Oludeniz', city: 'Dalaman' },
  '48770': { district: 'Dalyan', city: 'Dalaman' },
};

// Extract postal code from address string
function extractPostalCode(location: string): string | null {
  // Turkish postal codes are 5 digits
  const match = location.match(/\b(0[1-9]\d{3}|[1-9]\d{4})\b/);
  return match ? match[1] : null;
}

// Check if keyword appears in the end portion of address (more reliable for district identification)
function isKeywordInEndPortion(normalized: string, keywordNorm: string): boolean {
  // Split by common separators and check last 2-3 parts
  const parts = normalized.split(/\s+/);
  if (parts.length <= 2) return normalized.includes(keywordNorm);
  
  // Check if keyword appears in the last half of the address
  const midPoint = Math.floor(parts.length / 2);
  const endPortion = parts.slice(midPoint).join(' ');
  return endPortion.includes(keywordNorm);
}

export function findDistrict(location: string, cityHint?: string | null): DistrictMatchResult | null {
  const normalized = normalizeLocation(location);
  let bestMatch: DistrictMatchResult | null = null;
  
  // PRIORITY 1: Check postal code first - most reliable method
  const postalCode = extractPostalCode(location);
  if (postalCode && POSTAL_CODE_TO_DISTRICT[postalCode]) {
    const postalMatch = POSTAL_CODE_TO_DISTRICT[postalCode];
    // If cityHint is provided, verify it matches
    if (!cityHint || postalMatch.city === cityHint) {
      console.log(`[findDistrict] Postal code ${postalCode} matched to ${postalMatch.district}, ${postalMatch.city}`);
      return {
        value: postalMatch.district,
        city: postalMatch.city,
        confidence: 0.99, // Very high confidence for postal code match
        priority: 0, // Highest priority
        matchedKeyword: `postal:${postalCode}`,
      };
    }
  }

  // Skip fuzzy matching for very short inputs (likely just city names)
  const isShortInput = normalized.split(' ').filter((w) => w.length > 2).length <= 1;
  
  // Collect all matching districts first
  const allMatches: DistrictMatchResult[] = [];

  for (const [district, data] of Object.entries(DISTRICT_KEYWORDS)) {
    if (cityHint && data.city !== cityHint) continue;

    const thisDistrictNorm = normalizeLocation(district);
    const districtNamesForCity = DISTRICT_NAMES_BY_CITY_NORM[data.city];

    // Always prefer direct match on the district name itself
    if (normalized.includes(thisDistrictNorm)) {
      // ENHANCEMENT: Check if this keyword appears in the end portion of the address
      const isInEndPortion = isKeywordInEndPortion(normalized, thisDistrictNorm);
      const positionBonus = isInEndPortion ? 0.15 : 0;
      
      const confidence = Math.min(1, 0.85 + (thisDistrictNorm.length / 40) + positionBonus);
      allMatches.push({
        value: district,
        city: data.city,
        confidence,
        priority: isInEndPortion ? 0 : data.priority, // Boost priority if in end portion
        matchedKeyword: district + (isInEndPortion ? ' (end-position)' : ''),
      });
    }

    // Ensure the district's own name is always a keyword (defensive)
    const keywords = data.keywords.includes(district) ? data.keywords : [district, ...data.keywords];

    for (const keyword of keywords) {
      const keywordNorm = normalizeLocation(keyword);

      // Safety guard: if a keyword equals ANOTHER district name in the same city, ignore it.
      // This prevents wrong matches when keyword lists overlap.
      if (
        districtNamesForCity &&
        keywordNorm !== thisDistrictNorm &&
        districtNamesForCity.has(keywordNorm)
      ) {
        continue;
      }

      // Only do exact substring match
      if (normalized.includes(keywordNorm)) {
        // ENHANCEMENT: Check position in address string
        const isInEndPortion = isKeywordInEndPortion(normalized, keywordNorm);
        const positionBonus = isInEndPortion ? 0.15 : 0;
        
        const confidence = Math.min(1, 0.7 + (keywordNorm.length / 25) + positionBonus);
        
        allMatches.push({
          value: district,
          city: data.city,
          confidence,
          priority: isInEndPortion ? 0 : data.priority,
          matchedKeyword: keyword + (isInEndPortion ? ' (end-position)' : ''),
        });
      }
      // Fuzzy match for districts - BUT only for longer inputs to avoid false positives
      // Skip fuzzy for short inputs like "Bursa, Türkiye"
      else if (!isShortInput && keywordNorm.length >= 6 && fuzzyMatch(normalized, keywordNorm, 0.9)) {
        const confidence = Math.min(0.7, 0.4 + (keywordNorm.length / 35));

        allMatches.push({
          value: district,
          city: data.city,
          confidence,
          priority: data.priority,
          matchedKeyword: keyword + ' (fuzzy)',
        });
      }
    }
  }
  
  // Sort matches: first by priority (lower is better), then by confidence (higher is better)
  allMatches.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.confidence - a.confidence;
  });
  
  if (allMatches.length > 0) {
    bestMatch = allMatches[0];
    
    // Log if there were multiple candidates
    if (allMatches.length > 1) {
      console.log(`[findDistrict] Multiple matches found for "${location}":`);
      allMatches.slice(0, 3).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.value} (confidence: ${m.confidence.toFixed(2)}, priority: ${m.priority}, keyword: ${m.matchedKeyword})`);
      });
      console.log(`  Selected: ${bestMatch.value}`);
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
  pickupAnalysis: {
    airport: MatchResult | null;
    city: MatchResult | null;
    district: DistrictMatchResult | null;
  };
  dropoffAnalysis: {
    airport: MatchResult | null;
    city: MatchResult | null;
    district: DistrictMatchResult | null;
  };
}

export function analyzeTransfer(pickup: string, dropoff: string): TransferInfo {
  const pickupAirport = findAirport(pickup);
  const dropoffAirport = findAirport(dropoff);
  
  // CRITICAL FIX: When airport is found, derive city from airport to prevent false positives
  // Example: "Antalya Havalimanı, Yeşilköy" should NOT match Istanbul/Bakirkoy because of "Yeşilköy"
  const pickupAirportCity = pickupAirport ? AIRPORT_TO_CITY[pickupAirport.value] || null : null;
  const dropoffAirportCity = dropoffAirport ? AIRPORT_TO_CITY[dropoffAirport.value] || null : null;
  
  // Only use findCity if no airport was found for that location
  // This prevents district keywords from other cities causing wrong city matches
  const pickupCity = pickupAirport ? (pickupAirportCity ? { value: pickupAirportCity, confidence: 1, priority: 1, matchedKeyword: 'airport-derived' } : null) : findCity(pickup);
  const dropoffCity = dropoffAirport ? (dropoffAirportCity ? { value: dropoffAirportCity, confidence: 1, priority: 1, matchedKeyword: 'airport-derived' } : null) : findCity(dropoff);
  
  // For district search, use the airport-derived city as hint to constrain the search
  const pickupCityHint = pickupAirportCity || pickupCity?.value || null;
  const dropoffCityHint = dropoffAirportCity || dropoffCity?.value || null;
  
  const pickupDistrict = findDistrict(pickup, pickupCityHint);
  const dropoffDistrict = findDistrict(dropoff, dropoffCityHint);

  // Special rule: Istanbul (Europe/Asia side) → Bursa/Kocaeli/Sapanca should use
  // Istanbul Airport / Sabiha Gokcen Airport price tables.
  // This prevents wrong matches like Istanbul-district rows (e.g. Taksim) being used for intercity routes.
  const ISTANBUL_ASIAN_DISTRICTS = new Set([
    "Kadikoy",
    "Uskudar",
    "Atasehir",
    "Pendik",
    "Kartal",
    "Maltepe",
    "Umraniye",
    "Beykoz",
  ]);

  const ISTANBUL_PROXY_DEST_CITIES = new Set(["Bursa", "Kocaeli", "Sapanca"]);

  const DEFAULT_DEST_DISTRICT: Record<string, string> = {
    Bursa: "Bursa Merkez",
    Kocaeli: "Izmit",
    Sapanca: "Kirkpinar",
  };

  const pickupCityValue = pickupCity?.value || pickupDistrict?.city || null;
  const dropoffCityValue = dropoffCity?.value || dropoffDistrict?.city || null;

  const getIstanbulProxyAirport = () => {
    const pickupDistrictValue = pickupDistrict?.value || null;
    return pickupDistrictValue && ISTANBUL_ASIAN_DISTRICTS.has(pickupDistrictValue)
      ? "Sabiha Gokcen Airport (SAW)"
      : "Istanbul Airport (IST)";
  };

  let result: TransferInfo = {
    airport: null,
    city: null,
    district: null,
    direction: "unknown",
    confidence: "low",
    pickupAnalysis: {
      airport: pickupAirport,
      city: pickupCity,
      district: pickupDistrict,
    },
    dropoffAnalysis: {
      airport: dropoffAirport,
      city: dropoffCity,
      district: dropoffDistrict,
    },
  };

  // Case 1: Airport to destination (district/city)
  if (pickupAirport && (dropoffDistrict || dropoffCity)) {
    result.airport = pickupAirport.value;
    result.district = dropoffDistrict?.value || null;
    result.city = dropoffDistrict?.city || dropoffCity?.value || null;
    result.direction = "from_airport";
    result.confidence = dropoffDistrict ? "high" : "medium";
  }
  // Case 2: Destination (district/city) to airport
  else if (dropoffAirport && (pickupDistrict || pickupCity)) {
    result.airport = dropoffAirport.value;
    result.district = pickupDistrict?.value || null;
    result.city = pickupDistrict?.city || pickupCity?.value || null;
    result.direction = "to_airport";
    result.confidence = pickupDistrict ? "high" : "medium";
  }
  // Case 3: City to city (no airport)
  else if (pickupCity && dropoffCity) {
    result.city = pickupCity.value;
    result.district = pickupDistrict?.value || dropoffDistrict?.value || null;
    result.direction = "city_to_city";
    result.confidence = "medium";
  }
  // Case 4: Only airport found (one side)
  else if (pickupAirport || dropoffAirport) {
    result.airport = pickupAirport?.value || dropoffAirport?.value || null;
    result.direction = pickupAirport ? "from_airport" : "to_airport";
    result.confidence = "low";
  }
  // Case 5: Only city/district found
  else if (pickupCity || dropoffCity || pickupDistrict || dropoffDistrict) {
    result.city =
      pickupCity?.value ||
      dropoffCity?.value ||
      pickupDistrict?.city ||
      dropoffDistrict?.city ||
      null;
    result.district = pickupDistrict?.value || dropoffDistrict?.value || null;
    result.confidence = "low";
  }

  // Apply Istanbul proxy-airport override (requested business rule)
  if (
    !pickupAirport &&
    !dropoffAirport &&
    pickupCityValue === "Istanbul" &&
    dropoffCityValue &&
    ISTANBUL_PROXY_DEST_CITIES.has(dropoffCityValue)
  ) {
    result.airport = getIstanbulProxyAirport();
    result.city = dropoffCityValue;
    result.district = dropoffDistrict?.value || DEFAULT_DEST_DISTRICT[dropoffCityValue] || null;
    result.direction = "from_airport";
    result.confidence = "high";
  }

  return result;
}

// Vehicle matching is now in vehicleConfig.ts - re-exported above

// ==================== DISCOUNT CALCULATION ====================
export const VALID_PROMO_CODES = ['MEET25RETURN', 'GIDISDONUS', 'RETURN25', 'MEET25', 'MEET10', 'WELCOME10'];

export interface PromoCodeInfo {
  code: string;
  discountPercent: number;
  appliesToReturn: boolean;
  appliesToTotal: boolean;
}

// Default promo code configuration - can be overridden by database
export const PROMO_CODE_CONFIG: Record<string, PromoCodeInfo> = {
  'MEET25RETURN': { code: 'MEET25RETURN', discountPercent: 25, appliesToReturn: true, appliesToTotal: false },
  'GIDISDONUS': { code: 'GIDISDONUS', discountPercent: 25, appliesToReturn: true, appliesToTotal: false },
  'RETURN25': { code: 'RETURN25', discountPercent: 25, appliesToReturn: true, appliesToTotal: false },
  'MEET10': { code: 'MEET10', discountPercent: 10, appliesToReturn: false, appliesToTotal: true },
  'WELCOME10': { code: 'WELCOME10', discountPercent: 10, appliesToReturn: false, appliesToTotal: true },
};

// Fetch promo code config from database
export async function getPromoCodeFromDB(supabase: any, code: string): Promise<PromoCodeInfo | null> {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('code, discount_percentage, applies_to, is_active')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      // Fallback to hardcoded config
      return PROMO_CODE_CONFIG[code.toUpperCase()] || null;
    }

    return {
      code: data.code,
      discountPercent: data.discount_percentage,
      appliesToReturn: data.applies_to === 'return_transfer' || data.applies_to === 'all',
      appliesToTotal: data.applies_to === 'all' || data.applies_to === 'one_way',
    };
  } catch (err) {
    console.error('Error fetching promo code from DB:', err);
    return PROMO_CODE_CONFIG[code.toUpperCase()] || null;
  }
}

// Fetch active promo code for return transfers from database
export async function getActiveReturnPromoCode(supabase: any): Promise<PromoCodeInfo | null> {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('code, discount_percentage, applies_to, is_active')
      .eq('applies_to', 'return_transfer')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.log('No active return promo code found in DB, using fallback MEET25RETURN');
      return PROMO_CODE_CONFIG['MEET25RETURN'];
    }

    console.log('Active return promo code from DB:', data.code, data.discount_percentage + '%');
    return {
      code: data.code,
      discountPercent: data.discount_percentage,
      appliesToReturn: true,
      appliesToTotal: false,
    };
  } catch (err) {
    console.error('Error fetching active return promo code:', err);
    return PROMO_CODE_CONFIG['MEET25RETURN'];
  }
}

// Calculate discount using promo code config (already fetched from DB)
export function calculateDiscountWithConfig(
  basePrice: number,
  hasReturnTrip: boolean,
  promoConfig: PromoCodeInfo | null
): { price: number; returnPrice: number | null; totalPrice: number; discountApplied: boolean; discountPercent: number; promoCode: string | null } {
  let discountApplied = false;
  let discountPercent = 0;
  let returnPrice: number | null = null;
  let price = basePrice;
  
  if (hasReturnTrip) {
    returnPrice = basePrice;
    
    // Apply discount for return trip with valid promo code
    if (promoConfig && promoConfig.appliesToReturn) {
      returnPrice = Math.round(basePrice * (1 - promoConfig.discountPercent / 100));
      discountApplied = true;
      discountPercent = promoConfig.discountPercent;
      console.log(`Applied ${promoConfig.discountPercent}% discount to return trip: ${basePrice} -> ${returnPrice}`);
    }
  }
  
  // Apply discount to total if applicable
  if (promoConfig && promoConfig.appliesToTotal && !discountApplied) {
    price = Math.round(basePrice * (1 - promoConfig.discountPercent / 100));
    if (returnPrice !== null) {
      returnPrice = Math.round(returnPrice * (1 - promoConfig.discountPercent / 100));
    }
    discountApplied = true;
    discountPercent = promoConfig.discountPercent;
  }
  
  const totalPrice = hasReturnTrip && returnPrice !== null ? price + returnPrice : price;
  
  return {
    price,
    returnPrice,
    totalPrice,
    discountApplied,
    discountPercent,
    promoCode: promoConfig?.code || null
  };
}

// Legacy function for backward compatibility - uses hardcoded config
export function calculateDiscount(
  basePrice: number,
  hasReturnTrip: boolean,
  promoCode: string | null
): { price: number; returnPrice: number | null; totalPrice: number; discountApplied: boolean; discountPercent: number } {
  const promoConfig = promoCode ? PROMO_CODE_CONFIG[promoCode.toUpperCase()] : null;
  const result = calculateDiscountWithConfig(basePrice, hasReturnTrip, promoConfig);
  return {
    price: result.price,
    returnPrice: result.returnPrice,
    totalPrice: result.totalPrice,
    discountApplied: result.discountApplied,
    discountPercent: result.discountPercent
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
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚗 AUTO-PRICING ${type.toUpperCase()}: ${id}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 PICKUP: ${pickup}`);
  console.log(`   → Airport: ${transferInfo.pickupAnalysis.airport?.value || 'NOT FOUND'} ${transferInfo.pickupAnalysis.airport ? `(${transferInfo.pickupAnalysis.airport.matchedKeyword})` : ''}`);
  console.log(`   → City: ${transferInfo.pickupAnalysis.city?.value || 'NOT FOUND'} ${transferInfo.pickupAnalysis.city ? `(${transferInfo.pickupAnalysis.city.matchedKeyword})` : ''}`);
  console.log(`   → District: ${transferInfo.pickupAnalysis.district?.value || 'NOT FOUND'} ${transferInfo.pickupAnalysis.district ? `(${transferInfo.pickupAnalysis.district.matchedKeyword})` : ''}`);
  console.log(`📍 DROPOFF: ${dropoff}`);
  console.log(`   → Airport: ${transferInfo.dropoffAnalysis.airport?.value || 'NOT FOUND'} ${transferInfo.dropoffAnalysis.airport ? `(${transferInfo.dropoffAnalysis.airport.matchedKeyword})` : ''}`);
  console.log(`   → City: ${transferInfo.dropoffAnalysis.city?.value || 'NOT FOUND'} ${transferInfo.dropoffAnalysis.city ? `(${transferInfo.dropoffAnalysis.city.matchedKeyword})` : ''}`);
  console.log(`   → District: ${transferInfo.dropoffAnalysis.district?.value || 'NOT FOUND'} ${transferInfo.dropoffAnalysis.district ? `(${transferInfo.dropoffAnalysis.district.matchedKeyword})` : ''}`);
  console.log(`🎯 RESULT: Airport=${transferInfo.airport}, City=${transferInfo.city}, District=${transferInfo.district}`);
  console.log(`   Direction: ${transferInfo.direction} | Confidence: ${transferInfo.confidence}`);
  console.log(`${'='.repeat(60)}\n`);
}

// ==================== PRICE SANITY CHECK ====================
// Dynamic price validation system based on route type and vehicle

// City pairs with approximate distances and minimum prices (EUR, for Vito base)
interface CityDistanceInfo {
  distanceKm: number;
  minPriceVito: number;
  minPriceSprinter: number;
  minPriceMaybach: number;
  minPriceVip?: number;
  description: string;
}

// All city distance pairs - bidirectional lookup
const CITY_DISTANCES: Record<string, CityDistanceInfo> = {
  // Istanbul routes
  'Istanbul|Bursa': { distanceKm: 250, minPriceVito: 160, minPriceSprinter: 260, minPriceMaybach: 320, minPriceVip: 180, description: 'Istanbul - Bursa (250 km)' },
  'Istanbul|Kocaeli': { distanceKm: 100, minPriceVito: 70, minPriceSprinter: 120, minPriceMaybach: 150, minPriceVip: 80, description: 'Istanbul - Kocaeli (100 km)' },
  'Istanbul|Sapanca': { distanceKm: 150, minPriceVito: 100, minPriceSprinter: 170, minPriceMaybach: 210, minPriceVip: 120, description: 'Istanbul - Sapanca (150 km)' },
  'Istanbul|Sakarya': { distanceKm: 170, minPriceVito: 120, minPriceSprinter: 200, minPriceMaybach: 250, minPriceVip: 140, description: 'Istanbul - Sakarya (170 km)' },
  'Istanbul|Antalya': { distanceKm: 700, minPriceVito: 400, minPriceSprinter: 650, minPriceMaybach: 800, minPriceVip: 450, description: 'Istanbul - Antalya (700 km)' },
  'Istanbul|Cappadocia': { distanceKm: 750, minPriceVito: 420, minPriceSprinter: 680, minPriceMaybach: 850, minPriceVip: 480, description: 'Istanbul - Cappadocia (750 km)' },
  'Istanbul|Izmir': { distanceKm: 570, minPriceVito: 320, minPriceSprinter: 520, minPriceMaybach: 650, minPriceVip: 360, description: 'Istanbul - Izmir (570 km)' },
  'Istanbul|Bodrum': { distanceKm: 700, minPriceVito: 400, minPriceSprinter: 650, minPriceMaybach: 800, minPriceVip: 450, description: 'Istanbul - Bodrum (700 km)' },

  // Bursa routes  
  'Bursa|Kocaeli': { distanceKm: 130, minPriceVito: 90, minPriceSprinter: 150, minPriceMaybach: 190, minPriceVip: 100, description: 'Bursa - Kocaeli (130 km)' },
  'Bursa|Sapanca': { distanceKm: 160, minPriceVito: 110, minPriceSprinter: 180, minPriceMaybach: 220, minPriceVip: 125, description: 'Bursa - Sapanca (160 km)' },
  'Bursa|Sakarya': { distanceKm: 180, minPriceVito: 130, minPriceSprinter: 210, minPriceMaybach: 260, minPriceVip: 150, description: 'Bursa - Sakarya (180 km)' },

  // Antalya routes
  'Antalya|Cappadocia': { distanceKm: 530, minPriceVito: 280, minPriceSprinter: 450, minPriceMaybach: 560, minPriceVip: 320, description: 'Antalya - Cappadocia (530 km)' },
  'Antalya|Izmir': { distanceKm: 450, minPriceVito: 250, minPriceSprinter: 400, minPriceMaybach: 500, minPriceVip: 280, description: 'Antalya - Izmir (450 km)' },
  'Antalya|Bodrum': { distanceKm: 400, minPriceVito: 220, minPriceSprinter: 350, minPriceMaybach: 440, minPriceVip: 250, description: 'Antalya - Bodrum (400 km)' },

  // Cappadocia routes
  'Cappadocia|Izmir': { distanceKm: 700, minPriceVito: 380, minPriceSprinter: 620, minPriceMaybach: 770, minPriceVip: 430, description: 'Cappadocia - Izmir (700 km)' },

  // Izmir routes
  'Izmir|Bodrum': { distanceKm: 250, minPriceVito: 140, minPriceSprinter: 230, minPriceMaybach: 280, minPriceVip: 160, description: 'Izmir - Bodrum (250 km)' },
  'Izmir|Dalaman': { distanceKm: 200, minPriceVito: 110, minPriceSprinter: 180, minPriceMaybach: 220, minPriceVip: 125, description: 'Izmir - Dalaman (200 km)' },

  // Bodrum routes
  'Bodrum|Dalaman': { distanceKm: 200, minPriceVito: 110, minPriceSprinter: 180, minPriceMaybach: 220, minPriceVip: 125, description: 'Bodrum - Dalaman (200 km)' },

  // Dalaman routes
  'Dalaman|Antalya': { distanceKm: 220, minPriceVito: 120, minPriceSprinter: 200, minPriceMaybach: 250, minPriceVip: 140, description: 'Dalaman - Antalya (220 km)' },
};

// Airport to city minimum prices (for non-local transfers)
// Local airport transfers (30-50 km) have different minimums than distant cities
const AIRPORT_CITY_MIN_PRICES: Record<string, CityDistanceInfo> = {
  // Istanbul Airport routes
  'Istanbul Airport (IST)|Bursa': { distanceKm: 200, minPriceVito: 140, minPriceSprinter: 230, minPriceMaybach: 280, minPriceVip: 160, description: 'IST Airport - Bursa (200 km)' },
  'Istanbul Airport (IST)|Kocaeli': { distanceKm: 70, minPriceVito: 55, minPriceSprinter: 90, minPriceMaybach: 110, minPriceVip: 65, description: 'IST Airport - Kocaeli (70 km)' },
  'Istanbul Airport (IST)|Sapanca': { distanceKm: 120, minPriceVito: 85, minPriceSprinter: 140, minPriceMaybach: 170, minPriceVip: 100, description: 'IST Airport - Sapanca (120 km)' },
  
  // Sabiha Gokcen Airport routes
  'Sabiha Gokcen Airport (SAW)|Bursa': { distanceKm: 180, minPriceVito: 120, minPriceSprinter: 200, minPriceMaybach: 250, minPriceVip: 140, description: 'SAW Airport - Bursa (180 km)' },
  'Sabiha Gokcen Airport (SAW)|Kocaeli': { distanceKm: 50, minPriceVito: 40, minPriceSprinter: 70, minPriceMaybach: 85, minPriceVip: 50, description: 'SAW Airport - Kocaeli (50 km)' },
  'Sabiha Gokcen Airport (SAW)|Sapanca': { distanceKm: 90, minPriceVito: 65, minPriceSprinter: 110, minPriceMaybach: 135, minPriceVip: 75, description: 'SAW Airport - Sapanca (90 km)' },
};

// Default fallback: km-based minimum price calculation
function calculateKmBasedMinimum(distanceKm: number, vehicleType: string): number {
  // Base rate per km (EUR)
  const ratePerKm: Record<string, number> = {
    'vito': 0.55,
    'vito-vip': 0.65,
    'sprinter': 0.90,
    'maybach': 1.10,
  };
  
  // Minimum base prices
  const minBase: Record<string, number> = {
    'vito': 35,
    'vito-vip': 45,
    'sprinter': 70,
    'maybach': 100,
  };
  
  const normalizedVehicle = vehicleType.toLowerCase().replace(/[_\s]/g, '-');
  const rate = ratePerKm[normalizedVehicle] || ratePerKm['vito'];
  const base = minBase[normalizedVehicle] || minBase['vito'];
  
  return Math.max(base, Math.round(distanceKm * rate));
}

// Get minimum price for a vehicle type from CityDistanceInfo
function getMinPriceForVehicle(info: CityDistanceInfo, vehicleType: string): number {
  const normalizedVehicle = vehicleType.toLowerCase().replace(/[_\s]/g, '-');
  
  if (normalizedVehicle.includes('maybach')) {
    return info.minPriceMaybach;
  } else if (normalizedVehicle.includes('sprinter')) {
    return info.minPriceSprinter;
  } else if (normalizedVehicle.includes('vip')) {
    return info.minPriceVip || Math.round(info.minPriceVito * 1.15);
  }
  return info.minPriceVito;
}

// Create bidirectional lookup key
function getCityPairKey(city1: string, city2: string): string {
  // Sort alphabetically for consistent lookup
  const sorted = [city1, city2].sort();
  return `${sorted[0]}|${sorted[1]}`;
}

export interface PriceSanityResult {
  isValid: boolean;
  reason?: string;
  minimumExpected?: number;
  actualPrice?: number;
  routeKey?: string;
  routeDescription?: string;
  vehicleType?: string;
  confidence: 'high' | 'medium' | 'low';
}

export function checkPriceSanity(
  pickupCity: string | null,
  dropoffCity: string | null,
  price: number,
  currency: string,
  vehicleType?: string,
  airport?: string | null,
  isReturnTrip?: boolean,
  hasReturnDiscount?: boolean
): PriceSanityResult {
  // Skip sanity check for return trips with discount applied
  // Return trip discounts are legitimate business promotions and should not trigger low price warnings
  if (isReturnTrip && hasReturnDiscount) {
    console.log(`✅ Skipping price sanity check for return trip with discount applied. Price: ${price}${currency}`);
    return { isValid: true, confidence: 'high' };
  }
  // Convert TRY to EUR for comparison (approximate)
  let priceInEur = price;
  if (currency === 'TRY') {
    priceInEur = price / 38; // Approximate TRY/EUR rate
  } else if (currency === 'USD') {
    priceInEur = price / 1.08; // Approximate USD/EUR rate
  } else if (currency === 'GBP') {
    priceInEur = price * 1.17; // Approximate GBP/EUR rate
  }
  
  const vehicle = vehicleType || 'vito';
  
  // Skip if we don't have location info
  if (!pickupCity && !dropoffCity && !airport) {
    return { isValid: true, confidence: 'low' };
  }
  
  // Case 1: Airport to City route
  if (airport && (pickupCity || dropoffCity)) {
    const city = pickupCity || dropoffCity;
    if (city) {
      // Check airport-specific minimum prices
      const airportCityKey = `${airport}|${city}`;
      const reverseAirportCityKey = `${city}|${airport}`;
      
      const airportInfo = AIRPORT_CITY_MIN_PRICES[airportCityKey] || AIRPORT_CITY_MIN_PRICES[reverseAirportCityKey];
      
      if (airportInfo) {
        const minPrice = getMinPriceForVehicle(airportInfo, vehicle);
        
        // Allow up to 7€ below minimum (fixed tolerance instead of percentage)
        const toleranceAmount = 7;
        if (priceInEur < minPrice - toleranceAmount) {
          return {
            isValid: false,
            reason: `Fiyat ${price}${currency} çok düşük. ${airportInfo.description} için minimum: ${minPrice}€ (${vehicle}). Tolerans: ${toleranceAmount}€`,
            minimumExpected: minPrice,
            actualPrice: price,
            routeKey: airportCityKey,
            routeDescription: airportInfo.description,
            vehicleType: vehicle,
            confidence: 'high',
          };
        }
      }
    }
  }
  
  // Case 2: City to City route
  if (pickupCity && dropoffCity && pickupCity !== dropoffCity) {
    const pairKey = getCityPairKey(pickupCity, dropoffCity);
    const cityInfo = CITY_DISTANCES[pairKey];
    
    if (cityInfo) {
      const minPrice = getMinPriceForVehicle(cityInfo, vehicle);
      
      // Allow up to 7€ below minimum (fixed tolerance instead of percentage)
      const toleranceAmount = 7;
      if (priceInEur < minPrice - toleranceAmount) {
        return {
          isValid: false,
          reason: `Fiyat ${price}${currency} çok düşük. ${cityInfo.description} için minimum: ${minPrice}€ (${vehicle}). Tolerans: ${toleranceAmount}€`,
          minimumExpected: minPrice,
          actualPrice: price,
          routeKey: pairKey,
          routeDescription: cityInfo.description,
          vehicleType: vehicle,
          confidence: 'high',
        };
      }
    } else {
      // No predefined route - use heuristic based on city name differences
      // If cities are different major regions, flag suspiciously low prices
      const majorCities = new Set(['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa', 'Cappadocia', 'Bodrum', 'Dalaman', 'Dubai', 'Cyprus']);
      
      if (majorCities.has(pickupCity) && majorCities.has(dropoffCity)) {
        // Assume 300km average for unknown major city pairs
        const estimatedMin = calculateKmBasedMinimum(300, vehicle);
        
        // Allow up to 7€ tolerance for unknown routes too
        const toleranceAmount = 7;
        if (priceInEur < estimatedMin - toleranceAmount) {
          return {
            isValid: false,
            reason: `Fiyat ${price}${currency} şehirlerarası transfer için çok düşük görünüyor. ${pickupCity} - ${dropoffCity} (tahmini min: ${estimatedMin}€)`,
            minimumExpected: estimatedMin,
            actualPrice: price,
            routeKey: `${pickupCity}->${dropoffCity}`,
            routeDescription: `${pickupCity} - ${dropoffCity} (tahmini)`,
            vehicleType: vehicle,
            confidence: 'medium',
          };
        }
      }
    }
  }
  
  // Case 3: Generic price floor check (absolute minimums)
  const absoluteMinimums: Record<string, number> = {
    'vito': 25,
    'vito-vip': 35,
    'sprinter': 50,
    'maybach': 80,
  };
  
  const normalizedVehicle = vehicle.toLowerCase().replace(/[_\s]/g, '-');
  const absoluteMin = absoluteMinimums[normalizedVehicle] || absoluteMinimums['vito'];
  
  if (priceInEur < absoluteMin) {
    return {
      isValid: false,
      reason: `Fiyat ${price}${currency} tüm transferler için minimum değerin altında. Minimum: ${absoluteMin}€ (${vehicle})`,
      minimumExpected: absoluteMin,
      actualPrice: price,
      vehicleType: vehicle,
      confidence: 'high',
    };
  }
  
  return { isValid: true, confidence: 'high' };
}

// Enhanced logging for sanity check
export function logPriceSanityCheck(
  type: 'reservation' | 'quick_booking',
  id: string,
  sanityResult: PriceSanityResult
): void {
  if (!sanityResult.isValid) {
    console.log(`\n${'⚠️'.repeat(30)}`);
    console.log(`🚨 PRICE SANITY CHECK FAILED - ${type.toUpperCase()}: ${id}`);
    console.log(`${'⚠️'.repeat(30)}`);
    console.log(`   Route: ${sanityResult.routeKey || 'N/A'}`);
    console.log(`   Description: ${sanityResult.routeDescription || 'N/A'}`);
    console.log(`   Actual Price: ${sanityResult.actualPrice}€`);
    console.log(`   Minimum Expected: ${sanityResult.minimumExpected}€`);
    console.log(`   Vehicle: ${sanityResult.vehicleType || 'N/A'}`);
    console.log(`   Confidence: ${sanityResult.confidence}`);
    console.log(`   Reason: ${sanityResult.reason}`);
    console.log(`${'⚠️'.repeat(30)}\n`);
  }
}
