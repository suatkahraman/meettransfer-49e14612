import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plane, Hotel, Anchor, Camera, UtensilsCrossed, ShoppingBag, Loader2, Clock, Car, X, ChevronRight, Navigation, Image } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LocationPhotoGallery } from './LocationPhotoGallery';
interface Location {
  name: string;
  nameTR?: string;
  lat: number;
  lng: number;
  type: 'airport' | 'hotel' | 'landmark' | 'beach' | 'restaurant' | 'shopping' | 'marina';
  description?: string;
  descriptionTR?: string;
  image?: string;
  transferTime?: string; // from airport
  distance?: string; // from airport in km
}

// City coordinates data with enhanced location info
const cityCoordinates: Record<string, { center: { lat: number; lng: number }; zoom: number; locations: Location[] }> = {
  istanbul: {
    center: { lat: 41.0082, lng: 28.9784 },
    zoom: 10,
    locations: [
      { name: "Istanbul Airport (IST)", nameTR: "İstanbul Havalimanı (IST)", lat: 41.2608, lng: 28.7428, type: 'airport', description: "Turkey's largest international airport, opened in 2019. Modern facilities with excellent connections.", descriptionTR: "2019'da açılan Türkiye'nin en büyük uluslararası havalimanı. Modern tesisler ve mükemmel bağlantılar." },
      { name: "Sabiha Gökçen (SAW)", nameTR: "Sabiha Gökçen (SAW)", lat: 40.8989, lng: 29.3092, type: 'airport', description: "Istanbul's second international airport on the Asian side. Serves domestic and international flights.", descriptionTR: "Anadolu yakasındaki İstanbul'un ikinci uluslararası havalimanı." },
      { name: "Taksim Square", nameTR: "Taksim Meydanı", lat: 41.0369, lng: 28.9850, type: 'landmark', description: "The heart of modern Istanbul with hotels, restaurants, and nightlife. Famous İstiklal Avenue starts here.", descriptionTR: "Oteller, restoranlar ve gece hayatıyla modern İstanbul'un kalbi. Ünlü İstiklal Caddesi buradan başlar.", transferTime: "45-60 min", distance: "42 km" },
      { name: "Sultanahmet", nameTR: "Sultanahmet", lat: 41.0054, lng: 28.9768, type: 'landmark', description: "Historic district with Hagia Sophia, Blue Mosque, and Topkapı Palace. UNESCO World Heritage Site.", descriptionTR: "Ayasofya, Sultanahmet Camii ve Topkapı Sarayı'nın bulunduğu tarihi bölge. UNESCO Dünya Mirası.", transferTime: "50-70 min", distance: "45 km" },
      { name: "Galataport", nameTR: "Galataport", lat: 41.0242, lng: 28.9833, type: 'marina', description: "Istanbul's modern cruise port with luxury shopping and dining on the Bosphorus waterfront.", descriptionTR: "Boğaz kıyısında lüks alışveriş ve yemek seçenekleriyle İstanbul'un modern kruvaziyer limanı.", transferTime: "50-65 min", distance: "44 km" },
      { name: "Kadıköy", nameTR: "Kadıköy", lat: 40.9927, lng: 29.0277, type: 'shopping', description: "Vibrant neighborhood on the Asian side known for markets, cafes, and authentic local atmosphere.", descriptionTR: "Pazarları, kafeleri ve otantik yerel atmosferiyle Anadolu yakasının canlı semti.", transferTime: "70-90 min", distance: "55 km" },
      { name: "Beşiktaş", nameTR: "Beşiktaş", lat: 41.0432, lng: 29.0086, type: 'landmark', description: "Historic district with Dolmabahçe Palace, ferry terminals, and vibrant local markets.", descriptionTR: "Dolmabahçe Sarayı, feribot iskeleleri ve canlı yerel pazarlarıyla tarihi semt.", transferTime: "55-70 min", distance: "48 km" },
    ]
  },
  antalya: {
    center: { lat: 36.8969, lng: 30.7133 },
    zoom: 9,
    locations: [
      { name: "Antalya Airport (AYT)", nameTR: "Antalya Havalimanı (AYT)", lat: 36.8987, lng: 30.8005, type: 'airport', description: "One of Turkey's busiest airports serving the Turkish Riviera. Two international terminals.", descriptionTR: "Türk Rivierası'na hizmet veren Türkiye'nin en yoğun havalimanlarından biri." },
      { name: "Lara Beach", nameTR: "Lara Plajı", lat: 36.8500, lng: 30.7833, type: 'beach', description: "Famous golden sand beach with luxury all-inclusive resorts. Known as Turkey's Las Vegas.", descriptionTR: "Lüks her şey dahil otellerle ünlü altın kum plajı. Türkiye'nin Las Vegas'ı olarak bilinir.", transferTime: "15-20 min", distance: "12 km" },
      { name: "Belek Golf", nameTR: "Belek Golf", lat: 36.8530, lng: 31.0500, type: 'landmark', description: "World-class golf destination with championship courses. Home to Turkish Airlines Open.", descriptionTR: "Şampiyonluk sahalarıyla dünya standartlarında golf destinasyonu.", transferTime: "30-40 min", distance: "35 km" },
      { name: "Side", nameTR: "Side", lat: 36.7667, lng: 31.3833, type: 'landmark', description: "Ancient city with Greek and Roman ruins, beautiful beaches, and charming old town.", descriptionTR: "Yunan ve Roma kalıntıları, güzel plajlar ve büyüleyici eski şehriyle antik kent.", transferTime: "60-75 min", distance: "65 km" },
      { name: "Kemer", nameTR: "Kemer", lat: 36.5947, lng: 30.5561, type: 'beach', description: "Resort town surrounded by mountains and pine forests. Crystal clear waters and pebble beaches.", descriptionTR: "Dağlar ve çam ormanlarıyla çevrili tatil kasabası. Berrak sular ve çakıl plajları.", transferTime: "45-55 min", distance: "45 km" },
      { name: "Old Town (Kaleiçi)", nameTR: "Kaleiçi", lat: 36.8841, lng: 30.7056, type: 'landmark', description: "Antalya's charming old quarter with Ottoman houses, Roman harbor, and narrow streets.", descriptionTR: "Osmanlı evleri, Roma limanı ve dar sokaklarıyla Antalya'nın büyüleyici eski mahallesi.", transferTime: "20-25 min", distance: "15 km" },
    ]
  },
  bodrum: {
    center: { lat: 37.0344, lng: 27.4305 },
    zoom: 10,
    locations: [
      { name: "Milas-Bodrum Airport (BJV)", nameTR: "Milas-Bodrum Havalimanı (BJV)", lat: 37.2500, lng: 27.6667, type: 'airport', description: "Gateway to the Bodrum Peninsula serving the glamorous Turkish Riviera.", descriptionTR: "Çekici Türk Rivierası'na hizmet veren Bodrum Yarımadası'nın kapısı." },
      { name: "Bodrum Marina", nameTR: "Bodrum Marina", lat: 37.0323, lng: 27.4265, type: 'marina', description: "Iconic marina with Bodrum Castle views. Luxury yachts, restaurants, and nightlife.", descriptionTR: "Bodrum Kalesi manzaralı ikonik marina. Lüks yatlar, restoranlar ve gece hayatı.", transferTime: "35-45 min", distance: "36 km" },
      { name: "Yalıkavak (Palmarina)", nameTR: "Yalıkavak (Palmarina)", lat: 37.1089, lng: 27.2892, type: 'marina', description: "Exclusive marina destination for superyachts. Upscale dining and beach clubs.", descriptionTR: "Süper yatlar için özel marina destinasyonu. Üst düzey yemek ve beach clublar.", transferTime: "50-60 min", distance: "55 km" },
      { name: "Türkbükü", nameTR: "Türkbükü", lat: 37.1064, lng: 27.3711, type: 'beach', description: "Bodrum's most exclusive bay. Celebrity hotspot with luxury beach clubs and boutique hotels.", descriptionTR: "Bodrum'un en özel koyu. Lüks beach clublar ve butik otellerle ünlüler mekanı.", transferTime: "45-55 min", distance: "50 km" },
      { name: "Gündoğan", nameTR: "Gündoğan", lat: 37.0944, lng: 27.3625, type: 'beach', description: "Peaceful bay with crystal waters, traditional restaurants, and relaxed atmosphere.", descriptionTR: "Berrak suları, geleneksel restoranları ve rahat atmosferiyle huzurlu koy.", transferTime: "40-50 min", distance: "45 km" },
      { name: "Bitez Beach", nameTR: "Bitez Plajı", lat: 37.0361, lng: 27.3942, type: 'beach', description: "Popular windsurfing spot with shallow waters. Family-friendly beach with restaurants.", descriptionTR: "Sığ sularıyla popüler rüzgar sörfü noktası. Restoranlarla aile dostu plaj.", transferTime: "35-40 min", distance: "38 km" },
    ]
  },
  dalaman: {
    center: { lat: 36.7667, lng: 28.8000 },
    zoom: 9,
    locations: [
      { name: "Dalaman Airport (DLM)", nameTR: "Dalaman Havalimanı (DLM)", lat: 36.7131, lng: 28.7925, type: 'airport', description: "Gateway to Turkey's stunning Turquoise Coast. Serves Fethiye, Marmaris, and Göcek.", descriptionTR: "Türkiye'nin muhteşem Turkuaz Kıyısı'na açılan kapı. Fethiye, Marmaris ve Göcek'e hizmet verir." },
      { name: "Fethiye", nameTR: "Fethiye", lat: 36.6214, lng: 29.1167, type: 'landmark', description: "Charming coastal town with ancient Lycian rock tombs, harbor, and weekly market.", descriptionTR: "Antik Likya kaya mezarları, limanı ve haftalık pazarıyla büyüleyici kıyı kasabası.", transferTime: "55-65 min", distance: "55 km" },
      { name: "Ölüdeniz Blue Lagoon", nameTR: "Ölüdeniz Mavi Lagün", lat: 36.5491, lng: 29.1158, type: 'beach', description: "World-famous turquoise lagoon. Paragliding paradise with breathtaking mountain views.", descriptionTR: "Dünyaca ünlü turkuaz lagün. Nefes kesen dağ manzaralarıyla yamaç paraşütü cenneti.", transferTime: "65-75 min", distance: "65 km" },
      { name: "Göcek Marina", nameTR: "Göcek Marina", lat: 36.7508, lng: 28.9361, type: 'marina', description: "Boutique marina town with 6 marinas. Starting point for Blue Cruise adventures.", descriptionTR: "6 marinalı butik marina kasabası. Mavi Yolculuk maceraları için başlangıç noktası.", transferTime: "25-30 min", distance: "22 km" },
      { name: "Marmaris", nameTR: "Marmaris", lat: 36.8500, lng: 28.2750, type: 'beach', description: "Vibrant resort town with long beach promenade, marina, and famous nightlife.", descriptionTR: "Uzun sahil promenadı, marina ve ünlü gece hayatıyla canlı tatil kasabası.", transferTime: "85-100 min", distance: "95 km" },
      { name: "Kalkan", nameTR: "Kalkan", lat: 36.2667, lng: 29.4167, type: 'landmark', description: "Upscale village with whitewashed houses, rooftop restaurants, and boutique hotels.", descriptionTR: "Badanalı evleri, teras restoranları ve butik otelleriyle üst düzey köy.", transferTime: "80-95 min", distance: "90 km" },
    ]
  },
  izmir: {
    center: { lat: 38.4237, lng: 27.1428 },
    zoom: 9,
    locations: [
      { name: "Adnan Menderes Airport (ADB)", nameTR: "Adnan Menderes Havalimanı (ADB)", lat: 38.2924, lng: 27.1569, type: 'airport', description: "Izmir's international airport connecting to Aegean destinations.", descriptionTR: "Ege destinasyonlarına bağlanan İzmir uluslararası havalimanı." },
      { name: "Çeşme", nameTR: "Çeşme", lat: 38.3236, lng: 26.3033, type: 'beach', description: "Windsurfing paradise with pristine beaches, thermal springs, and Greek island views.", descriptionTR: "Bozulmamış plajları, termal kaynakları ve Yunan adası manzaralarıyla rüzgar sörfü cenneti.", transferTime: "70-85 min", distance: "85 km" },
      { name: "Alaçatı", nameTR: "Alaçatı", lat: 38.2750, lng: 26.3750, type: 'landmark', description: "Charming stone village famous for windsurfing, boutique hotels, and cobblestone streets.", descriptionTR: "Rüzgar sörfü, butik otelleri ve arnavut kaldırımlı sokaklarıyla ünlü taş köy.", transferTime: "65-80 min", distance: "80 km" },
      { name: "Ephesus", nameTR: "Efes", lat: 37.9394, lng: 27.3417, type: 'landmark', description: "Ancient Greek city with stunning Roman ruins. One of the best-preserved ancient cities.", descriptionTR: "Muhteşem Roma kalıntılarıyla antik Yunan şehri. En iyi korunmuş antik şehirlerden biri.", transferTime: "50-60 min", distance: "55 km" },
      { name: "Kuşadası", nameTR: "Kuşadası", lat: 37.8583, lng: 27.2583, type: 'marina', description: "Popular cruise port with beaches, shopping, and access to Ephesus and Greek islands.", descriptionTR: "Plajları, alışverişi ve Efes ile Yunan adalarına erişimiyle popüler kruvaziyer limanı.", transferTime: "65-80 min", distance: "75 km" },
      { name: "Izmir Center (Alsancak)", nameTR: "İzmir Merkez (Alsancak)", lat: 38.4333, lng: 27.1417, type: 'shopping', description: "Izmir's trendy waterfront district with cafes, bars, and the famous Kordon promenade.", descriptionTR: "Kafeler, barlar ve ünlü Kordon promenadıyla İzmir'in trend deniz kenarı bölgesi.", transferTime: "25-35 min", distance: "18 km" },
    ]
  },
  cappadocia: {
    center: { lat: 38.6431, lng: 34.8289 },
    zoom: 10,
    locations: [
      { name: "Nevşehir Airport (NAV)", nameTR: "Nevşehir Havalimanı (NAV)", lat: 38.7719, lng: 34.5350, type: 'airport', description: "Closest airport to Göreme. Quick access to cave hotels and balloon sites.", descriptionTR: "Göreme'ye en yakın havalimanı. Mağara otellere ve balon alanlarına hızlı erişim." },
      { name: "Kayseri Airport (ASR)", nameTR: "Kayseri Havalimanı (ASR)", lat: 38.7700, lng: 35.4956, type: 'airport', description: "Larger airport with more flight options. About 70 km from Göreme.", descriptionTR: "Daha fazla uçuş seçeneğiyle büyük havalimanı. Göreme'den yaklaşık 70 km." },
      { name: "Göreme", nameTR: "Göreme", lat: 38.6431, lng: 34.8289, type: 'landmark', description: "Heart of Cappadocia with fairy chimneys, cave hotels, and hot air balloon launches.", descriptionTR: "Peri bacaları, mağara otelleri ve sıcak hava balonu kalkışlarıyla Kapadokya'nın kalbi.", transferTime: "30-40 min", distance: "35 km" },
      { name: "Ürgüp", nameTR: "Ürgüp", lat: 38.6294, lng: 34.9114, type: 'hotel', description: "Upscale town with luxury cave hotels, wine houses, and Ottoman architecture.", descriptionTR: "Lüks mağara otelleri, şarap evleri ve Osmanlı mimarisiyle üst düzey kasaba.", transferTime: "35-45 min", distance: "40 km" },
      { name: "Uçhisar Castle", nameTR: "Uçhisar Kalesi", lat: 38.6297, lng: 34.8019, type: 'landmark', description: "Highest point in Cappadocia with panoramic valley views. Natural rock fortress.", descriptionTR: "Panoramik vadi manzaralarıyla Kapadokya'nın en yüksek noktası. Doğal kaya kalesi.", transferTime: "25-35 min", distance: "30 km" },
      { name: "Derinkuyu Underground City", nameTR: "Derinkuyu Yeraltı Şehri", lat: 38.3750, lng: 34.7333, type: 'landmark', description: "Deepest underground city in Cappadocia. Ancient multi-level refuge for thousands.", descriptionTR: "Kapadokya'nın en derin yeraltı şehri. Binlerce kişilik antik çok katlı sığınak.", transferTime: "45-55 min", distance: "45 km" },
    ]
  },
  dubai: {
    center: { lat: 25.2048, lng: 55.2708 },
    zoom: 10,
    locations: [
      { name: "Dubai International (DXB)", nameTR: "Dubai Uluslararası (DXB)", lat: 25.2532, lng: 55.3657, type: 'airport', description: "One of the world's busiest airports. Modern terminals with luxury facilities.", descriptionTR: "Dünyanın en yoğun havalimanlarından biri. Lüks tesislerle modern terminaller." },
      { name: "Downtown Dubai (Burj Khalifa)", nameTR: "Downtown Dubai (Burj Khalifa)", lat: 25.1972, lng: 55.2744, type: 'landmark', description: "Home to the world's tallest building. Dubai Mall and Dubai Fountain nearby.", descriptionTR: "Dünyanın en yüksek binasına ev sahipliği yapar. Yakınlarda Dubai Mall ve Dubai Çeşmesi.", transferTime: "20-30 min", distance: "15 km" },
      { name: "Palm Jumeirah", nameTR: "Palm Jumeirah", lat: 25.1124, lng: 55.1390, type: 'hotel', description: "Iconic man-made island shaped like a palm tree. Atlantis and luxury resorts.", descriptionTR: "Palmiye ağacı şeklinde ikonik yapay ada. Atlantis ve lüks tatil köyleri.", transferTime: "35-45 min", distance: "30 km" },
      { name: "Dubai Marina", nameTR: "Dubai Marina", lat: 25.0805, lng: 55.1403, type: 'marina', description: "Stunning waterfront district with skyscrapers, restaurants, and yacht tours.", descriptionTR: "Gökdelenler, restoranlar ve yat turlarıyla muhteşem deniz kenarı bölgesi.", transferTime: "35-45 min", distance: "32 km" },
      { name: "JBR Beach", nameTR: "JBR Beach", lat: 25.0795, lng: 55.1340, type: 'beach', description: "Popular public beach with dining promenade. Ain Dubai observation wheel views.", descriptionTR: "Yemek promenadıyla popüler halk plajı. Ain Dubai gözlem tekerleği manzarası.", transferTime: "35-45 min", distance: "33 km" },
      { name: "Dubai Mall", nameTR: "Dubai Mall", lat: 25.1985, lng: 55.2796, type: 'shopping', description: "World's largest shopping mall with 1200+ stores, aquarium, and ice rink.", descriptionTR: "1200'den fazla mağaza, akvaryum ve buz pateni pistiyle dünyanın en büyük AVM'si.", transferTime: "20-30 min", distance: "14 km" },
    ]
  },
  cyprus: {
    center: { lat: 35.1264, lng: 33.4299 },
    zoom: 8,
    locations: [
      { name: "Larnaca Airport (LCA)", nameTR: "Larnaka Havalimanı (LCA)", lat: 34.8751, lng: 33.6249, type: 'airport', description: "Cyprus's main international airport serving the southern part of the island.", descriptionTR: "Adanın güney kısmına hizmet veren Kıbrıs'ın ana uluslararası havalimanı." },
      { name: "Ercan Airport (ECN)", nameTR: "Ercan Havalimanı (ECN)", lat: 35.1544, lng: 33.4961, type: 'airport', description: "Northern Cyprus airport with connections via Turkey.", descriptionTR: "Türkiye üzerinden bağlantıları olan Kuzey Kıbrıs havalimanı." },
      { name: "Limassol", nameTR: "Limasol", lat: 34.7072, lng: 33.0226, type: 'marina', description: "Cyprus's second largest city with modern marina, wine villages, and ancient ruins.", descriptionTR: "Modern marinası, şarap köyleri ve antik kalıntılarıyla Kıbrıs'ın ikinci büyük şehri.", transferTime: "45-55 min", distance: "65 km" },
      { name: "Ayia Napa", nameTR: "Ayia Napa", lat: 34.9833, lng: 34.0000, type: 'beach', description: "Famous beach resort with crystal waters, sea caves, and vibrant nightlife.", descriptionTR: "Berrak suları, deniz mağaraları ve canlı gece hayatıyla ünlü plaj tatil beldesi.", transferTime: "40-50 min", distance: "50 km" },
      { name: "Nicosia", nameTR: "Lefkoşa", lat: 35.1856, lng: 33.3823, type: 'landmark', description: "World's last divided capital. Historic walled old town with museums and cafes.", descriptionTR: "Dünyanın son bölünmüş başkenti. Müzeler ve kafelerle tarihi surlu eski şehir.", transferTime: "50-60 min", distance: "55 km" },
      { name: "Kyrenia", nameTR: "Girne", lat: 35.3403, lng: 33.3192, type: 'marina', description: "Picturesque harbor town in North Cyprus with castle, old harbor, and mountain views.", descriptionTR: "Kalesi, eski limanı ve dağ manzaralarıyla Kuzey Kıbrıs'ta pitoresk liman kasabası.", transferTime: "75-90 min", distance: "85 km" },
    ]
  },
  fethiye: {
    center: { lat: 36.6214, lng: 29.1167 },
    zoom: 11,
    locations: [
      { name: "Dalaman Airport (DLM)", nameTR: "Dalaman Havalimanı (DLM)", lat: 36.7131, lng: 28.7925, type: 'airport', description: "Nearest airport to Fethiye, about 55 km away.", descriptionTR: "Fethiye'ye en yakın havalimanı, yaklaşık 55 km uzaklıkta." },
      { name: "Fethiye Marina", nameTR: "Fethiye Marina", lat: 36.6214, lng: 29.1167, type: 'marina', description: "Beautiful marina with Lycian rock tombs views. Blue Cruise starting point.", descriptionTR: "Likya kaya mezarları manzaralı güzel marina. Mavi Yolculuk başlangıç noktası.", transferTime: "55-65 min", distance: "55 km" },
      { name: "Ölüdeniz", nameTR: "Ölüdeniz", lat: 36.5491, lng: 29.1158, type: 'beach', description: "World-famous Blue Lagoon with calm turquoise waters. Paragliding destination.", descriptionTR: "Sakin turkuaz sularıyla dünyaca ünlü Mavi Lagün. Yamaç paraşütü destinasyonu.", transferTime: "65-75 min", distance: "65 km" },
      { name: "Hisarönü", nameTR: "Hisarönü", lat: 36.5667, lng: 29.1167, type: 'landmark', description: "Popular resort village with restaurants, bars, and easy access to Ölüdeniz.", descriptionTR: "Restoranları, barları ve Ölüdeniz'e kolay erişimiyle popüler tatil köyü.", transferTime: "60-70 min", distance: "60 km" },
      { name: "Kayaköy Ghost Village", nameTR: "Kayaköy Hayalet Köy", lat: 36.5833, lng: 29.0833, type: 'landmark', description: "Abandoned Greek village with 500+ stone houses. UNESCO heritage site.", descriptionTR: "500'den fazla taş evle terk edilmiş Rum köyü. UNESCO miras alanı.", transferTime: "55-65 min", distance: "58 km" },
      { name: "Çalış Beach", nameTR: "Çalış Plajı", lat: 36.6583, lng: 29.0917, type: 'beach', description: "Long pebble beach with stunning sunsets, waterfront restaurants, and dolmuş boats.", descriptionTR: "Muhteşem gün batımları, deniz kenarı restoranları ve dolmuş tekneleriyle uzun çakıl plajı.", transferTime: "50-60 min", distance: "50 km" },
    ]
  },
  marmaris: {
    center: { lat: 36.8500, lng: 28.2750 },
    zoom: 11,
    locations: [
      { name: "Dalaman Airport (DLM)", nameTR: "Dalaman Havalimanı (DLM)", lat: 36.7131, lng: 28.7925, type: 'airport', description: "Main airport serving Marmaris, about 95 km away.", descriptionTR: "Marmaris'e hizmet veren ana havalimanı, yaklaşık 95 km uzaklıkta." },
      { name: "Marmaris Marina", nameTR: "Marmaris Marina", lat: 36.8508, lng: 28.2697, type: 'marina', description: "Prestigious marina attracting superyachts. Excellent dining and shopping.", descriptionTR: "Süper yatları çeken prestijli marina. Mükemmel yemek ve alışveriş.", transferTime: "85-100 min", distance: "95 km" },
      { name: "Marmaris Castle", nameTR: "Marmaris Kalesi", lat: 36.8511, lng: 28.2689, type: 'landmark', description: "Ottoman-era castle overlooking the harbor. Houses archaeology museum.", descriptionTR: "Limanı gören Osmanlı dönemi kalesi. Arkeoloji müzesine ev sahipliği yapar.", transferTime: "85-100 min", distance: "95 km" },
      { name: "İçmeler Beach", nameTR: "İçmeler Plajı", lat: 36.8167, lng: 28.2333, type: 'beach', description: "Beautiful bay with calmer waters than Marmaris. Family-friendly resort area.", descriptionTR: "Marmaris'ten daha sakin sularla güzel koy. Aile dostu tatil bölgesi.", transferTime: "90-105 min", distance: "100 km" },
      { name: "Turunç", nameTR: "Turunç", lat: 36.7833, lng: 28.2333, type: 'beach', description: "Secluded bay accessible by boat or mountain road. Blue Flag beach.", descriptionTR: "Tekne veya dağ yoluyla ulaşılabilen tenha koy. Mavi Bayraklı plaj.", transferTime: "95-110 min", distance: "105 km" },
      { name: "Bar Street", nameTR: "Bar Sokağı", lat: 36.8500, lng: 28.2700, type: 'restaurant', description: "Marmaris's famous nightlife strip with clubs, bars, and entertainment.", descriptionTR: "Kulüpler, barlar ve eğlenceyle Marmaris'in ünlü gece hayatı caddesi.", transferTime: "85-100 min", distance: "95 km" },
    ]
  },
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '';

const getLocationIcon = (type: string) => {
  switch (type) {
    case 'airport': return Plane;
    case 'hotel': return Hotel;
    case 'marina': return Anchor;
    case 'beach': return Camera;
    case 'restaurant': return UtensilsCrossed;
    case 'shopping': return ShoppingBag;
    default: return MapPin;
  }
};

const getLocationColor = (type: string) => {
  switch (type) {
    case 'airport': return '#3b82f6';
    case 'hotel': return '#8b5cf6';
    case 'marina': return '#06b6d4';
    case 'beach': return '#f59e0b';
    case 'restaurant': return '#ef4444';
    case 'shopping': return '#ec4899';
    default: return '#10b981';
  }
};

export const DestinationMap = ({ cityKey }: { cityKey: string }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showRouteToLocation, setShowRouteToLocation] = useState<Location | null>(null);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const city = cityKey;
  const { language } = useLanguage();
  const isTR = language?.toLowerCase() === 'tr';

  const cityData = cityCoordinates[cityKey.toLowerCase()];
  const airport = cityData?.locations.find(l => l.type === 'airport');

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || !cityData) {
      if (!MAPBOX_TOKEN) setError('Map token not configured');
      if (!cityData) setError('City data not available');
      setLoading(false);
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [cityData.center.lng, cityData.center.lat],
      zoom: cityData.zoom,
      pitch: 30,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.scrollZoom.disable();

    map.current.on('load', () => {
      setLoading(false);

      cityData.locations.forEach((location) => {
        const color = getLocationColor(location.type);
        
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `
          <div style="
            background: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid white;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${location.type === 'airport' ? '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>' :
                location.type === 'hotel' ? '<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="m9 16 .348-.24c1.465-1.013 3.84-1.013 5.304 0L15 16"/><path d="M8 7h.01"/><path d="M16 7h.01"/><path d="M12 7h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 11h.01"/><path d="M10 22v-6.5m4 0V22"/>' :
                location.type === 'marina' ? '<circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>' :
                location.type === 'beach' ? '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>' :
                location.type === 'shopping' ? '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>' :
                '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'}
            </svg>
          </div>
        `;

        el.addEventListener('mouseenter', () => {
          el.firstElementChild && ((el.firstElementChild as HTMLElement).style.transform = 'scale(1.2)');
        });
        el.addEventListener('mouseleave', () => {
          el.firstElementChild && ((el.firstElementChild as HTMLElement).style.transform = 'scale(1)');
        });

        new mapboxgl.Marker(el)
          .setLngLat([location.lng, location.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25, closeButton: false })
              .setHTML(`
                <div style="padding: 8px; font-family: system-ui, sans-serif; min-width: 150px;">
                  <strong style="font-size: 14px;">${isTR ? (location.nameTR || location.name) : location.name}</strong>
                  ${location.transferTime ? `
                    <div style="display: flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 12px; color: #3b82f6;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      ${location.transferTime}
                    </div>
                  ` : ''}
                  ${location.distance ? `
                    <div style="font-size: 11px; color: #666; margin-top: 2px;">
                      ${location.distance} ${isTR ? 'havalimanından' : 'from airport'}
                    </div>
                  ` : ''}
                </div>
              `)
          )
          .addTo(map.current!);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [cityKey, cityData, isTR]);

  // Draw route to selected location
  useEffect(() => {
    if (!showRouteToLocation || !airport || !map.current) return;

    const drawRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${airport.lng},${airport.lat};${showRouteToLocation.lng},${showRouteToLocation.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          const route = data.routes[0].geometry;

          // Remove existing route layer if present
          if (map.current?.getSource('route')) {
            map.current.removeLayer('route');
            map.current.removeSource('route');
          }

          map.current?.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route
            }
          });

          map.current?.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          // Fit map to show route
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([airport.lng, airport.lat]);
          bounds.extend([showRouteToLocation.lng, showRouteToLocation.lat]);
          map.current?.fitBounds(bounds, { padding: 80 });
        }
      } catch (error) {
        console.error('Error drawing route:', error);
      }
    };

    drawRoute();

    return () => {
      if (map.current?.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
    };
  }, [showRouteToLocation, airport]);

  if (!cityData) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-12"
    >
      <h2 className="text-2xl font-bold mb-6">
        {isTR ? 'Şehir Haritası & Popüler Lokasyonlar' : 'City Map & Popular Locations'}
      </h2>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border shadow-lg h-[450px]">
          {loading && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
              <p className="text-muted-foreground">{error}</p>
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full" />
          
          {/* Route info overlay */}
          {showRouteToLocation && (
            <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border max-w-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {isTR ? 'Havalimanından Rota' : 'Route from Airport'}
                  </p>
                  <p className="font-semibold text-sm">
                    {isTR ? (showRouteToLocation.nameTR || showRouteToLocation.name) : showRouteToLocation.name}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="flex items-center gap-1 text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      {showRouteToLocation.transferTime}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Car className="h-3.5 w-3.5" />
                      {showRouteToLocation.distance}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowRouteToLocation(null)}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Location Legend */}
        <div className="bg-card border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 text-lg">
            {isTR ? 'Popüler Noktalar' : 'Popular Points'}
          </h3>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
            {cityData.locations.map((location, idx) => {
              const Icon = getLocationIcon(location.type);
              const color = getLocationColor(location.type);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.03 }}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedLocation(location);
                    map.current?.flyTo({
                      center: [location.lng, location.lat],
                      zoom: 14,
                      duration: 1000,
                    });
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {isTR ? (location.nameTR || location.name) : location.name}
                    </p>
                    {location.transferTime && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {location.transferTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {location.distance}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {['airport', 'beach', 'marina', 'landmark'].map((type) => (
                <div
                  key={type}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{ 
                    backgroundColor: `${getLocationColor(type)}15`,
                    color: getLocationColor(type)
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: getLocationColor(type) }}
                  />
                  <span className="capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Location Detail Dialog */}
      <Dialog open={!!selectedLocation} onOpenChange={() => setSelectedLocation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedLocation && (
                <>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${getLocationColor(selectedLocation.type)}20`, 
                      color: getLocationColor(selectedLocation.type) 
                    }}
                  >
                    {(() => {
                      const Icon = getLocationIcon(selectedLocation.type);
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <span>{isTR ? (selectedLocation.nameTR || selectedLocation.name) : selectedLocation.name}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLocation && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {isTR ? (selectedLocation.descriptionTR || selectedLocation.description) : selectedLocation.description}
              </p>
              
              {/* Photo Gallery Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPhotoGallery(true)}
              >
                <Image className="h-4 w-4 mr-2" />
                {isTR ? 'Fotoğrafları Görüntüle' : 'View Photos'}
              </Button>
              
              {selectedLocation.transferTime && selectedLocation.type !== 'airport' && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm font-medium mb-3">
                    {isTR ? 'Havalimanından Transfer' : 'Transfer from Airport'}
                  </p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">{selectedLocation.transferTime}</p>
                        <p className="text-xs text-muted-foreground">{isTR ? 'Tahmini Süre' : 'Est. Duration'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-semibold">{selectedLocation.distance}</p>
                        <p className="text-xs text-muted-foreground">{isTR ? 'Mesafe' : 'Distance'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      setShowRouteToLocation(selectedLocation);
                      setSelectedLocation(null);
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {isTR ? 'Rotayı Haritada Göster' : 'Show Route on Map'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Photo Gallery Modal */}
      {selectedLocation && (
        <LocationPhotoGallery
          city={city}
          locationName={selectedLocation.name}
          location={{
            name: selectedLocation.name,
            nameTR: selectedLocation.nameTR,
            description: selectedLocation.description,
            descriptionTR: selectedLocation.descriptionTR,
            transferTime: selectedLocation.transferTime,
            distance: selectedLocation.distance,
            photos: []
          }}
          isOpen={showPhotoGallery}
          onClose={() => setShowPhotoGallery(false)}
        />
      )}
    </motion.section>
  );
};

export default DestinationMap;
