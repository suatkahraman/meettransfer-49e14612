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
