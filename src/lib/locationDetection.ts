// Location detection utilities for country-specific features

// Check if a location is in Turkey
export function isTurkeyLocation(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  
  const turkeyKeywords = [
    // Country
    'turkey', 'türkiye', 'turkiye', 'türkei',
    
    // Major airports
    'ist', 'istanbul airport', 'istanbul havalimanı', 'istanbul havalimani',
    'saw', 'sabiha', 'sabiha gökçen', 'sabiha gokcen',
    'ayt', 'antalya airport', 'antalya havalimanı',
    'bjv', 'bodrum', 'milas', 'bodrum airport',
    'dlm', 'dalaman', 'dalaman airport',
    'adb', 'izmir airport', 'adnan menderes',
    'asr', 'kayseri airport',
    'nav', 'nevsehir', 'nevşehir', 'kapadokya airport', 'cappadocia airport',
    'yei', 'bursa airport', 'yenisehir',
    'ada', 'adana airport', 'adana şakirpaşa', 'adana sakirpasa', 'şakirpaşa',
    'mqm', 'mardin airport', 'mardin havalimanı',
    
    // Major cities
    'istanbul', 'İstanbul',
    'ankara',
    'izmir', 'İzmir',
    'antalya',
    'bursa',
    'konya',
    'adana',
    'gaziantep',
    'mersin',
    'kayseri',
    'eskisehir', 'eskişehir',
    'diyarbakir', 'diyarbakır',
    'samsun',
    'trabzon',
    'mardin',
    'midyat',
    'antakya', 'hatay',
    'tarsus',
    
    // Istanbul districts
    'taksim', 'sultanahmet', 'kadikoy', 'kadıköy', 'besiktas', 'beşiktaş',
    'sisli', 'şişli', 'fatih', 'beyoglu', 'beyoğlu', 'uskudar', 'üsküdar',
    'bakirkoy', 'bakırköy', 'atasehir', 'ataşehir', 'maltepe', 'pendik',
    'kartal', 'sariyer', 'sarıyer', 'zeytinburnu', 'mecidiyekoy', 'mecidiyeköy',
    'levent', 'maslak', 'yenikoy', 'yeniköy', 'bebek', 'ortakoy', 'ortaköy',
    'nisantasi', 'nişantaşı', 'cihangir', 'galata', 'karakoy', 'karaköy',
    'eminonu', 'eminönü', 'balat', 'eyup', 'eyüp', 'florya', 'yesilkoy', 'yeşilköy',
    'arnavutkoy', 'arnavutköy', 'kurtkoy', 'kurtköy',
    
    // Antalya regions
    'kaleici', 'kaleiçi', 'konyaalti', 'konyaaltı', 'lara', 'belek', 'side',
    'alanya', 'kemer', 'kas', 'kaş', 'kalkan', 'manavgat', 'serik', 'kundu',
    'beldibi', 'goynuk', 'göynük', 'tekirova', 'cirali', 'çıralı', 'olympos',
    
    // Cappadocia
    'cappadocia', 'kapadokya', 'goreme', 'göreme', 'urgup', 'ürgüp',
    'uchisar', 'uçhisar', 'avanos', 'ortahisar', 'mustafapasa', 'mustafapaşa',
    
    // Other popular destinations
    'fethiye', 'marmaris', 'kusadasi', 'kuşadası', 'cesme', 'çeşme',
    'alacati', 'alaçatı', 'didim', 'datca', 'datça', 'oludeniz', 'ölüdeniz',
    'sapanca', 'sakarya', 'kocaeli', 'izmit', 'gebze',
    'pamukkale', 'denizli', 'ephesus', 'efes',
    'canakkale', 'çanakkale', 'gallipoli', 'truva', 'troy',
    
    // Aegean & Mediterranean coast
    'bodrum peninsula', 'turgutreis', 'yalikavak', 'yalıkavak', 'gumbet', 'gümbet',
    'bitez', 'ortakent', 'gumusluk', 'gümüşlük',
    
    // Adana region
    'seyhan', 'çukurova', 'cukurova', 'yüreğir', 'yuregir',
    
    // Mardin/Midyat region
    'nusaybin', 'deyrulzafaran', 'mor gabriel', 'savur', 'dargeçit', 'hasankeyf',
  ];
  
  return turkeyKeywords.some(keyword => normalizedLocation.includes(keyword));
}

// Check if a location is in Dubai/UAE
export function isDubaiLocation(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  
  const dubaiKeywords = [
    'dubai',
    'دبي', // Arabic for Dubai
    'burj khalifa',
    'palm jumeirah',
    'dubai mall',
    'dubai marina',
    'dxb', // Dubai airport code
    'dubai international',
    'al maktoum',
    'dwc', // Al Maktoum airport code
    'jebel ali',
    'jumeirah',
    'downtown dubai',
    'business bay',
    'deira',
    'bur dubai',
    'sheikh zayed',
    'emirates hills',
    'arabian ranches',
    'jbr',
    'jumeirah beach',
    'jvc', 'jumeirah village',
    'sports city',
    'motor city',
    'silicon oasis',
    'al barsha',
    'discovery gardens',
    'international city',
    'dubai investment park',
    // New popular areas
    'difc', 'dubai international financial centre',
    'creek harbour', 'dubai creek harbour',
    'city walk',
    'al quoz',
    'mirdif',
    'al nahda',
    'al mamzar',
    'dubai hills',
    'damac hills',
    'town square',
    'mudon',
    'remraam',
    'meydan',
    'nad al sheba',
    'al khawaneej',
    'warsan',
    'dubai south',
    'expo city',
    // Other Emirates
    'abu dhabi',
    'sharjah',
    'ajman',
    'ras al khaimah',
    'fujairah',
    'uae',
    'united arab emirates',
  ];
  
  return dubaiKeywords.some(keyword => normalizedLocation.includes(keyword));
}

// Switzerland defined airports
const SWITZERLAND_AIRPORTS = ['zrh', 'zurich airport', 'zürich flughafen', 'gva', 'geneva airport', 'genève aéroport', 'bsl', 'basel airport', 'euroairport', 'basel-mulhouse', 'mxp', 'milan malpensa', 'malpensa'];

// Switzerland defined ski resorts (only these have prices)
const SWITZERLAND_SKI_RESORTS = [
  'st. moritz', 'st moritz', 'saint moritz', 'sankt moritz',
  'gstaad',
  'davos',
  'arosa',
  'zermatt',
  'verbier',
  'crans-montana', 'crans montana',
];

// Check if location matches Switzerland airports
export function isSwitzerlandAirport(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  return SWITZERLAND_AIRPORTS.some(keyword => normalizedLocation.includes(keyword));
}

// Check if location matches Switzerland defined ski resorts
export function isSwitzerlandSkiResort(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  return SWITZERLAND_SKI_RESORTS.some(keyword => normalizedLocation.includes(keyword));
}

// Check if a Switzerland route is valid (airport ↔ ski resort only)
export function isValidSwitzerlandRoute(pickup: string, dropoff: string): boolean {
  const pickupIsAirport = isSwitzerlandAirport(pickup);
  const dropoffIsAirport = isSwitzerlandAirport(dropoff);
  const pickupIsSkiResort = isSwitzerlandSkiResort(pickup);
  const dropoffIsSkiResort = isSwitzerlandSkiResort(dropoff);
  
  // Valid routes: Airport → Ski Resort OR Ski Resort → Airport
  return (pickupIsAirport && dropoffIsSkiResort) || (pickupIsSkiResort && dropoffIsAirport);
}

// Check if a location is in Switzerland
export function isSwitzerlandLocation(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  
  const switzerlandKeywords = [
    // Country
    'switzerland', 'schweiz', 'suisse', 'svizzera', 'swiss',
    
    // Major airports
    'zrh', 'zurich airport', 'zürich flughafen', 'zurich flughafen',
    'gva', 'geneva airport', 'genève aéroport', 'genf flughafen',
    'bsl', 'basel airport', 'euroairport', 'basel-mulhouse',
    'mxp', 'milan malpensa', 'malpensa airport',
    
    // Ski resorts & destinations
    'st. moritz', 'st moritz', 'saint moritz', 'sankt moritz',
    'zermatt',
    'verbier',
    'gstaad',
    'davos',
    'arosa',
    'crans-montana', 'crans montana',
    'klosters',
    'grindelwald',
    'wengen',
    'lauterbrunnen',
    'interlaken',
    'saas-fee', 'saas fee',
    'laax',
    'flims',
    'engelberg',
    'andermatt',
    'leukerbad',
    'champéry', 'champery',
    'nendaz',
    
    // Major cities
    'zurich', 'zürich',
    'geneva', 'genève', 'genf',
    'basel', 'bâle',
    'bern', 'berne',
    'lausanne',
    'lucerne', 'luzern',
    'lugano',
    'winterthur',
    'st. gallen', 'st gallen', 'sankt gallen',
    'montreux',
    
    // Cantons
    'graubünden', 'graubunden', 'grisons',
    'valais', 'wallis',
    'ticino',
    'vaud',
    
    // Popular areas
    'engadin', 'engadine',
    'jungfrau region',
    'bernese oberland',
    'swiss alps',
    'matterhorn',
  ];
  
  return switzerlandKeywords.some(keyword => normalizedLocation.includes(keyword));
}
