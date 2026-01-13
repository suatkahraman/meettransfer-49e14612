import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePromo, getLocalizedDiscountText } from "@/contexts/PromoContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import { SEOHead, SchemaOrg } from "@/components/seo";
import FeatureList from "@/components/website/FeatureList";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import VehicleComparison from "@/components/website/VehicleComparison";
import LazyDestinationMap from "@/components/website/LazyDestinationMap";
import { motion } from "framer-motion";
import { 
  MapPin, Star, Plane, Users, Luggage, Clock, Shield, 
  Car, ArrowRight, Sparkles, Tag, Calendar, CheckCircle2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// City destination data
const destinationData: Record<string, {
  name: string;
  nameTR: string;
  airports: string[];
  rating: number;
  fromPrice: number;
  popular: boolean;
  description: {
    en: string;
    tr: string;
  };
  highlights: {
    en: string[];
    tr: string[];
  };
  prices: { route: string; price: string }[];
  faqItems: { question: string; answer: string }[];
  locations: string[];
  gradient: string;
}> = {
  istanbul: {
    name: "Istanbul",
    nameTR: "İstanbul",
    airports: ["IST", "SAW"],
    rating: 4.9,
    fromPrice: 45,
    popular: true,
    description: {
      en: "Experience seamless airport transfers in Istanbul, the magical city where East meets West. Our professional chauffeurs provide VIP service from both Istanbul Airport (IST) and Sabiha Gökçen Airport (SAW) to any destination in the city.",
      tr: "Doğu'nun Batı ile buluştuğu büyülü şehir İstanbul'da kesintisiz havalimanı transferi deneyimi yaşayın. Profesyonel şoförlerimiz, İstanbul Havalimanı (IST) ve Sabiha Gökçen Havalimanı'ndan (SAW) şehirdeki her noktaya VIP hizmet sunuyor."
    },
    highlights: {
      en: ["Two major airports: IST & SAW", "24/7 meet & greet service", "Fixed prices - no hidden fees", "All hotels & cruise ports covered"],
      tr: ["İki büyük havalimanı: IST & SAW", "7/24 karşılama hizmeti", "Sabit fiyatlar - gizli ücret yok", "Tüm oteller ve kruvaziyer limanları"]
    },
    prices: [
      { route: "IST Airport → Taksim", price: "€45" },
      { route: "IST Airport → Sultanahmet", price: "€48" },
      { route: "IST Airport → Kadıköy", price: "€55" },
      { route: "SAW Airport → Taksim", price: "€60" },
      { route: "SAW Airport → Kadıköy", price: "€45" },
      { route: "IST Airport → Galataport", price: "€50" },
    ],
    faqItems: [
      { question: "How long is the transfer from IST Airport to Taksim?", answer: "The journey typically takes 45-60 minutes depending on traffic conditions. Our drivers monitor traffic in real-time to choose the optimal route." },
      { question: "Do you offer transfers between IST and SAW airports?", answer: "Yes, we provide inter-airport transfers between Istanbul Airport (IST) and Sabiha Gökçen Airport (SAW). Journey time is approximately 60-90 minutes." },
      { question: "Is the price per person or per vehicle?", answer: "All our prices are per vehicle, not per person. You can travel with up to 7 passengers in our Mercedes Vito VIP vehicles." },
    ],
    locations: ["Taksim", "Sultanahmet", "Beşiktaş", "Levent", "Galataport", "Kadıköy", "Üsküdar"],
    gradient: "from-blue-600/80 to-purple-600/80",
  },
  antalya: {
    name: "Antalya",
    nameTR: "Antalya",
    airports: ["AYT"],
    rating: 4.9,
    fromPrice: 35,
    popular: true,
    description: {
      en: "Welcome to Antalya, Turkey's stunning Mediterranean paradise. Our premium transfer service connects Antalya Airport (AYT) to all resort destinations along the Turkish Riviera, from Belek's golf hotels to Alanya's beautiful beaches.",
      tr: "Türkiye'nin muhteşem Akdeniz cenneti Antalya'ya hoş geldiniz. Premium transfer hizmetimiz, Antalya Havalimanı'nı (AYT) Türk Rivierası boyunca tüm tatil beldelerine bağlar - Belek'in golf otellerinden Alanya'nın güzel sahillerine."
    },
    highlights: {
      en: ["Direct service to all resorts", "Golf hotel specialists", "Child seats available", "Meet & greet included"],
      tr: ["Tüm tatil beldelerine direkt servis", "Golf oteli uzmanları", "Çocuk koltuğu mevcut", "Karşılama dahil"]
    },
    prices: [
      { route: "AYT Airport → Lara", price: "€35" },
      { route: "AYT Airport → Belek", price: "€45" },
      { route: "AYT Airport → Side", price: "€55" },
      { route: "AYT Airport → Alanya", price: "€75" },
      { route: "AYT Airport → Kemer", price: "€50" },
      { route: "AYT Airport → Kaş", price: "€120" },
    ],
    faqItems: [
      { question: "How far is Belek from Antalya Airport?", answer: "Belek is approximately 35 km from Antalya Airport, with a transfer time of around 30-40 minutes in our comfortable VIP vehicles." },
      { question: "Do you provide transfers to golf resorts?", answer: "Yes! We specialize in golf resort transfers in Belek and the surrounding area. We can accommodate golf bags at no extra charge." },
    ],
    locations: ["Lara", "Kundu", "Belek", "Side", "Alanya", "Kaş", "Kemer"],
    gradient: "from-amber-500/80 to-orange-600/80",
  },
  bodrum: {
    name: "Bodrum",
    nameTR: "Bodrum",
    airports: ["BJV"],
    rating: 4.8,
    fromPrice: 40,
    popular: true,
    description: {
      en: "Discover Bodrum, the jewel of Turkey's Aegean coast. From Milas-Bodrum Airport (BJV), our luxury transfers take you to exclusive marinas, boutique hotels, and stunning beach clubs across the Bodrum Peninsula.",
      tr: "Türkiye'nin Ege kıyısının mücevheri Bodrum'u keşfedin. Milas-Bodrum Havalimanı'ndan (BJV), lüks transferlerimiz sizi Bodrum Yarımadası'ndaki özel marinalara, butik otellere ve muhteşem beach clublara ulaştırır."
    },
    highlights: {
      en: ["Marina & yacht transfers", "Luxury V-Class vehicles", "Beach club transfers", "VIP nightlife service"],
      tr: ["Marina ve yat transferleri", "Lüks V-Class araçlar", "Beach club transferleri", "VIP gece hayatı servisi"]
    },
    prices: [
      { route: "BJV Airport → Bodrum Center", price: "€40" },
      { route: "BJV Airport → Yalıkavak", price: "€55" },
      { route: "BJV Airport → Türkbükü", price: "€55" },
      { route: "BJV Airport → Gündoğan", price: "€50" },
      { route: "BJV Airport → Torba", price: "€45" },
      { route: "BJV Airport → Bitez", price: "€42" },
    ],
    faqItems: [
      { question: "Can you transfer us directly to Palmarina in Yalıkavak?", answer: "Absolutely! We provide direct transfers to Palmarina and all marinas in the Bodrum Peninsula. Our drivers can drop you right at the marina entrance." },
      { question: "Do you offer late night transfers for clubs?", answer: "Yes, we offer 24/7 transfer service including late-night pickups from beach clubs and nightlife venues in Bodrum." },
    ],
    locations: ["Yalıkavak", "Türkbükü", "Gündoğan", "Torba", "Bitez", "Gümüşlük", "Bodrum Center"],
    gradient: "from-emerald-500/80 to-teal-600/80",
  },
  dalaman: {
    name: "Dalaman",
    nameTR: "Dalaman",
    airports: ["DLM"],
    rating: 4.8,
    fromPrice: 38,
    popular: false,
    description: {
      en: "Dalaman Airport (DLM) is your gateway to Turkey's stunning Turquoise Coast. We provide premium transfers to Fethiye, Ölüdeniz, Göcek, Marmaris, and all destinations along this breathtaking coastline.",
      tr: "Dalaman Havalimanı (DLM), Türkiye'nin muhteşem Turkuaz Kıyısı'na açılan kapınızdır. Fethiye, Ölüdeniz, Göcek, Marmaris ve bu nefes kesen kıyı boyunca tüm destinasyonlara premium transfer sağlıyoruz."
    },
    highlights: {
      en: ["All Turquoise Coast destinations", "Yacht marina transfers", "Blue Lagoon access", "Villa & resort pickups"],
      tr: ["Tüm Turkuaz Kıyısı destinasyonları", "Yat marinası transferleri", "Mavi Lagün erişimi", "Villa ve resort alımları"]
    },
    prices: [
      { route: "DLM Airport → Fethiye", price: "€45" },
      { route: "DLM Airport → Ölüdeniz", price: "€50" },
      { route: "DLM Airport → Göcek", price: "€40" },
      { route: "DLM Airport → Marmaris", price: "€65" },
      { route: "DLM Airport → Kalkan", price: "€70" },
      { route: "DLM Airport → Kaş", price: "€85" },
    ],
    faqItems: [
      { question: "How long is the transfer to Ölüdeniz?", answer: "The transfer from Dalaman Airport to Ölüdeniz takes approximately 60-70 minutes through scenic mountain roads." },
      { question: "Do you transfer to villas in Kalkan?", answer: "Yes, we provide door-to-door service to all villas in Kalkan, Kaş, and the surrounding areas. Just provide the address!" },
    ],
    locations: ["Fethiye", "Ölüdeniz", "Göcek", "Marmaris", "Kalkan", "Kaş", "Hisarönü"],
    gradient: "from-cyan-500/80 to-blue-600/80",
  },
  izmir: {
    name: "Izmir",
    nameTR: "İzmir",
    airports: ["ADB"],
    rating: 4.7,
    fromPrice: 42,
    popular: false,
    description: {
      en: "Izmir, Turkey's third-largest city, offers easy access to beautiful Aegean destinations. From Adnan Menderes Airport (ADB), reach Çeşme, Alaçatı, ancient Ephesus, and Kuşadası with our comfortable transfer service.",
      tr: "Türkiye'nin üçüncü büyük şehri İzmir, güzel Ege destinasyonlarına kolay erişim sunar. Adnan Menderes Havalimanı'ndan (ADB), konforlu transfer hizmetimizle Çeşme, Alaçatı, antik Efes ve Kuşadası'na ulaşın."
    },
    highlights: {
      en: ["Çeşme & Alaçatı specialists", "Ephesus ancient city tours", "Cruise port transfers", "Wine region access"],
      tr: ["Çeşme ve Alaçatı uzmanları", "Efes antik şehir turları", "Kruvaziyer limanı transferleri", "Şarap bölgesi erişimi"]
    },
    prices: [
      { route: "ADB Airport → İzmir Center", price: "€35" },
      { route: "ADB Airport → Çeşme", price: "€65" },
      { route: "ADB Airport → Alaçatı", price: "€60" },
      { route: "ADB Airport → Ephesus", price: "€55" },
      { route: "ADB Airport → Kuşadası", price: "€70" },
      { route: "ADB Airport → Şirince", price: "€60" },
    ],
    faqItems: [
      { question: "Can you take us to Ephesus for a day trip?", answer: "Yes! We offer Ephesus day trip transfers with waiting time included. Our drivers can recommend the best times to visit to avoid crowds." },
      { question: "How far is Alaçatı from Izmir Airport?", answer: "Alaçatı is approximately 85 km from Izmir Airport, with a comfortable transfer time of around 70-80 minutes." },
    ],
    locations: ["Çeşme", "Alaçatı", "Ephesus", "Kuşadası", "Şirince", "Foça", "İzmir Center"],
    gradient: "from-indigo-500/80 to-blue-600/80",
  },
  cappadocia: {
    name: "Cappadocia",
    nameTR: "Kapadokya",
    airports: ["NAV", "ASR"],
    rating: 4.9,
    fromPrice: 55,
    popular: true,
    description: {
      en: "Experience the magic of Cappadocia with our premium transfer service. We connect Nevşehir (NAV) and Kayseri (ASR) airports to all cave hotels, hot air balloon sites, and underground cities in this UNESCO World Heritage region.",
      tr: "Premium transfer hizmetimizle Kapadokya'nın büyüsünü yaşayın. Nevşehir (NAV) ve Kayseri (ASR) havalimanlarını bu UNESCO Dünya Mirası bölgesindeki tüm mağara otellere, sıcak hava balonu alanlarına ve yeraltı şehirlerine bağlıyoruz."
    },
    highlights: {
      en: ["Balloon flight transfers", "Cave hotel specialists", "Underground city access", "Sunrise/sunset transfers"],
      tr: ["Balon uçuşu transferleri", "Mağara otel uzmanları", "Yeraltı şehri erişimi", "Gün doğumu/batımı transferleri"]
    },
    prices: [
      { route: "NAV Airport → Göreme", price: "€55" },
      { route: "NAV Airport → Ürgüp", price: "€60" },
      { route: "ASR Airport → Göreme", price: "€75" },
      { route: "ASR Airport → Ürgüp", price: "€80" },
      { route: "NAV Airport → Avanos", price: "€55" },
      { route: "NAV Airport → Uçhisar", price: "€55" },
    ],
    faqItems: [
      { question: "Which airport should I fly into for Cappadocia?", answer: "Nevşehir Airport (NAV) is closer to Göreme (30 min), while Kayseri Airport (ASR) is larger with more flight options (60-70 min to Göreme). We serve both!" },
      { question: "Can you pick us up for early morning balloon flights?", answer: "Absolutely! We specialize in early morning balloon flight pickups, typically at 4-5 AM. Our drivers are punctual and reliable." },
    ],
    locations: ["Göreme", "Ürgüp", "Avanos", "Uçhisar", "Ortahisar", "Mustafapaşa", "Derinkuyu"],
    gradient: "from-violet-500/80 to-purple-600/80",
  },
  dubai: {
    name: "Dubai",
    nameTR: "Dubai",
    airports: ["DXB"],
    rating: 4.9,
    fromPrice: 65,
    popular: true,
    description: {
      en: "Welcome to Dubai, the city of superlatives. Our luxury transfer service provides seamless connections from Dubai International Airport (DXB) and Al Maktoum Airport (DWC) to all hotels, resorts, and business destinations.",
      tr: "Süperlatifler şehri Dubai'ye hoş geldiniz. Lüks transfer hizmetimiz, Dubai Uluslararası Havalimanı (DXB) ve Al Maktoum Havalimanı'ndan (DWC) tüm otellere, tatil köylerine ve iş destinasyonlarına kesintisiz bağlantı sağlar."
    },
    highlights: {
      en: ["Luxury Maybach available", "Palm Jumeirah specialists", "Business district transfers", "24/7 VIP service"],
      tr: ["Lüks Maybach mevcut", "Palm Jumeirah uzmanları", "İş bölgesi transferleri", "7/24 VIP hizmet"]
    },
    prices: [
      { route: "DXB → Downtown Dubai", price: "€65" },
      { route: "DXB → Palm Jumeirah", price: "€75" },
      { route: "DXB → Dubai Marina", price: "€70" },
      { route: "DXB → JBR Beach", price: "€70" },
      { route: "DXB → Business Bay", price: "€65" },
      { route: "DWC → Downtown Dubai", price: "€85" },
    ],
    faqItems: [
      { question: "Do you offer Maybach transfers in Dubai?", answer: "Yes! We offer Mercedes Maybach S-Class for ultimate luxury transfers in Dubai. Perfect for special occasions or business executives." },
      { question: "Can you transfer us to Atlantis on Palm Jumeirah?", answer: "Absolutely! We provide direct transfers to Atlantis, The Royal, and all resorts on Palm Jumeirah. Door-to-door service included." },
    ],
    locations: ["Downtown Dubai", "Palm Jumeirah", "Dubai Marina", "JBR Beach", "Business Bay", "DIFC", "Jumeirah Beach"],
    gradient: "from-amber-500/80 to-yellow-600/80",
  },
  cyprus: {
    name: "Cyprus",
    nameTR: "Kıbrıs",
    airports: ["LCA", "ECN"],
    rating: 4.8,
    fromPrice: 50,
    popular: true,
    description: {
      en: "Discover the Mediterranean beauty of Cyprus with our premium transfer service. We connect Larnaca (LCA), Paphos (PFO), and Ercan (ECN) airports to all resorts, hotels, and destinations across the island.",
      tr: "Premium transfer hizmetimizle Kıbrıs'ın Akdeniz güzelliğini keşfedin. Larnaka (LCA), Baf (PFO) ve Ercan (ECN) havalimanlarını ada genelindeki tüm tatil köylerine, otellere ve destinasyonlara bağlıyoruz."
    },
    highlights: {
      en: ["Both North & South Cyprus", "All airports covered", "Beach resort transfers", "Historic site access"],
      tr: ["Kuzey ve Güney Kıbrıs", "Tüm havalimanları kapsanır", "Sahil resort transferleri", "Tarihi alan erişimi"]
    },
    prices: [
      { route: "LCA → Limassol", price: "€50" },
      { route: "LCA → Ayia Napa", price: "€55" },
      { route: "LCA → Nicosia", price: "€45" },
      { route: "PFO → Limassol", price: "€60" },
      { route: "ECN → Kyrenia", price: "€40" },
      { route: "ECN → Famagusta", price: "€50" },
    ],
    faqItems: [
      { question: "Can you transfer between North and South Cyprus?", answer: "Yes, we can arrange cross-border transfers. Please note that you'll need valid travel documents for the border crossing." },
      { question: "Which airport is closest to Ayia Napa?", answer: "Larnaca Airport (LCA) is the closest to Ayia Napa, with a transfer time of approximately 45-50 minutes." },
    ],
    locations: ["Limassol", "Ayia Napa", "Protaras", "Paphos", "Nicosia", "Kyrenia", "Famagusta"],
    gradient: "from-green-500/80 to-emerald-600/80",
  },
  fethiye: {
    name: "Fethiye",
    nameTR: "Fethiye",
    airports: ["DLM"],
    rating: 4.8,
    fromPrice: 45,
    popular: false,
    description: {
      en: "Fethiye is one of Turkey's most beautiful coastal towns, famous for the stunning Blue Lagoon at Ölüdeniz. Our transfers from Dalaman Airport (DLM) take you directly to your hotel, villa, or yacht in this paradise destination.",
      tr: "Fethiye, Ölüdeniz'deki muhteşem Mavi Lagün ile ünlü, Türkiye'nin en güzel kıyı kasabalarından biridir. Dalaman Havalimanı'ndan (DLM) transferlerimiz sizi bu cennet destinasyondaki otelinize, villanıza veya yatınıza doğrudan ulaştırır."
    },
    highlights: {
      en: ["Ölüdeniz Blue Lagoon", "Paragliding transfers", "Yacht marina access", "12 Islands boat tours"],
      tr: ["Ölüdeniz Mavi Lagün", "Yamaç paraşütü transferleri", "Yat marinası erişimi", "12 Ada tekne turları"]
    },
    prices: [
      { route: "DLM → Fethiye Center", price: "€45" },
      { route: "DLM → Ölüdeniz", price: "€50" },
      { route: "DLM → Hisarönü", price: "€48" },
      { route: "DLM → Ovacık", price: "€48" },
      { route: "DLM → Calis Beach", price: "€45" },
      { route: "DLM → Kayaköy", price: "€55" },
    ],
    faqItems: [
      { question: "How far is Ölüdeniz from Dalaman Airport?", answer: "Ölüdeniz is approximately 65 km from Dalaman Airport, with a scenic drive of around 60-70 minutes through beautiful mountain roads." },
      { question: "Can you pick us up from paragliding landing?", answer: "Yes! We can arrange pickup from the Ölüdeniz paragliding landing site to take you back to your hotel." },
    ],
    locations: ["Ölüdeniz", "Hisarönü", "Ovacık", "Calis Beach", "Kayaköy", "Fethiye Marina"],
    gradient: "from-sky-500/80 to-cyan-600/80",
  },
  marmaris: {
    name: "Marmaris",
    nameTR: "Marmaris",
    airports: ["DLM"],
    rating: 4.7,
    fromPrice: 48,
    popular: false,
    description: {
      en: "Marmaris is a vibrant resort town known for its marina, nightlife, and beautiful beaches. From Dalaman Airport (DLM), we provide comfortable transfers to Marmaris and surrounding areas including İçmeler and Turunç.",
      tr: "Marmaris, marinası, gece hayatı ve güzel plajlarıyla tanınan canlı bir tatil beldesidir. Dalaman Havalimanı'ndan (DLM) Marmaris ve İçmeler, Turunç dahil çevre bölgelere konforlu transferler sağlıyoruz."
    },
    highlights: {
      en: ["Mega yacht marina", "Nightlife district transfers", "Greek islands ferry port", "İçmeler & Turunç"],
      tr: ["Mega yat marinası", "Gece hayatı bölgesi transferleri", "Yunan adaları feribot limanı", "İçmeler ve Turunç"]
    },
    prices: [
      { route: "DLM → Marmaris Center", price: "€65" },
      { route: "DLM → İçmeler", price: "€68" },
      { route: "DLM → Turunç", price: "€70" },
      { route: "DLM → Marmaris Marina", price: "€65" },
      { route: "DLM → Datça", price: "€85" },
      { route: "DLM → Akyaka", price: "€55" },
    ],
    faqItems: [
      { question: "How long is the transfer from Dalaman to Marmaris?", answer: "The transfer takes approximately 90-100 minutes. The route passes through beautiful mountain scenery." },
      { question: "Can you take us to the ferry port for Greek islands?", answer: "Yes! We provide transfers to Marmaris ferry port for trips to Rhodes and other Greek islands." },
    ],
    locations: ["Marmaris Center", "İçmeler", "Turunç", "Marmaris Marina", "Datça", "Akyaka"],
    gradient: "from-rose-500/80 to-pink-600/80",
  },
  frankfurt: {
    name: "Frankfurt",
    nameTR: "Frankfurt",
    airports: ["FRA"],
    rating: 4.9,
    fromPrice: 55,
    popular: true,
    description: {
      en: "Welcome to Frankfurt, Germany's financial capital and major European hub. From Frankfurt Airport (FRA), one of Europe's busiest airports, we provide premium transfers to the city center, Messe Frankfurt trade fair, and all surrounding areas.",
      tr: "Almanya'nın finans başkenti ve önemli Avrupa hub'ı Frankfurt'a hoş geldiniz. Avrupa'nın en yoğun havalimanlarından biri olan Frankfurt Havalimanı'ndan (FRA) şehir merkezine, Messe Frankfurt fuarına ve tüm çevre bölgelere premium transferler sağlıyoruz."
    },
    highlights: {
      en: ["Europe's major hub airport", "Messe Frankfurt specialists", "Business district transfers", "Luxury Maybach available"],
      tr: ["Avrupa'nın önemli hub havalimanı", "Messe Frankfurt uzmanları", "İş bölgesi transferleri", "Lüks Maybach mevcut"]
    },
    prices: [
      { route: "FRA → Frankfurt City Center", price: "€55" },
      { route: "FRA → Messe Frankfurt", price: "€50" },
      { route: "FRA → Financial District", price: "€55" },
      { route: "FRA → Sachsenhausen", price: "€60" },
      { route: "FRA → Wiesbaden", price: "€75" },
      { route: "FRA → Mainz", price: "€70" },
    ],
    faqItems: [
      { question: "How long is the transfer from Frankfurt Airport to city center?", answer: "The transfer takes approximately 25-35 minutes depending on traffic. Our drivers know the best routes to avoid congestion." },
      { question: "Do you provide transfers to Messe Frankfurt?", answer: "Yes! We specialize in Messe Frankfurt transfers for trade fair visitors. We can accommodate luggage and exhibition materials." },
    ],
    locations: ["City Center", "Messe Frankfurt", "Financial District", "Sachsenhausen", "Wiesbaden", "Mainz"],
    gradient: "from-slate-500/80 to-zinc-600/80",
  },
};

const DestinationDetail = () => {
  const { cityName } = useParams<{ cityName: string }>();
  const { language, getLocalizedPath, t } = useLanguage();
  const { promoCode, loading: promoLoading } = usePromo();
  const navigate = useNavigate();

  const destination = cityName ? destinationData[cityName.toLowerCase()] : null;

  if (!destination) {
    return (
      <WebsiteLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Destination not found</h1>
            <Button onClick={() => navigate("/destinations")}>
              View All Destinations
            </Button>
          </div>
        </div>
      </WebsiteLayout>
    );
  }

  const isTR = language.toLowerCase() === "tr";
  const discountText = getLocalizedDiscountText(
    promoCode.discountPercentage, 
    promoCode.code, 
    language.toLowerCase(),
    promoCode.validUntil
  );

  // Transform prices for PriceTable component
  const priceItems = destination.prices.map(p => {
    const parts = p.route.split(" → ");
    return {
      from: parts[0] || p.route,
      to: parts[1] || "",
      price: p.price,
    };
  });

  return (
    <WebsiteLayout>
      <SEOHead
        title={`${destination.name} Airport Transfer | VIP Transfers from ${destination.airports.join(" & ")} | Meet Transfer`}
        description={destination.description.en}
        keywords={`${destination.name} airport transfer, ${destination.airports.join(", ")} transfer, VIP transfer ${destination.name}, private chauffeur ${destination.name}`}
        canonicalPath={`/destinations/${cityName}`}
      />
      <SchemaOrg
        schemas={[
          { type: "TransportationService", areaServed: [destination.name] },
          { type: "LocalBusiness" },
        ]}
      />

      {/* Hero Header */}
      <div className={`relative bg-gradient-to-br ${destination.gradient} py-16 md:py-24`}>
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="hero-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="white" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#hero-pattern)" />
          </svg>
        </div>

        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            {/* Badges */}
            <div className="flex justify-center gap-3 mb-4">
              {destination.popular && (
                <span className="flex items-center gap-1 bg-yellow-500 text-yellow-950 rounded-full px-3 py-1 text-sm font-bold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {isTR ? "Popüler" : "Popular"}
                </span>
              )}
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                <Plane className="h-3.5 w-3.5" />
                {destination.airports.join(", ")}
              </span>
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {destination.rating}
              </span>
            </div>

            {/* City Name */}
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
              {isTR ? destination.nameTR : destination.name}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-6 max-w-2xl mx-auto">
              {isTR ? "Havalimanı Transfer Hizmetleri" : "Airport Transfer Services"}
            </p>

            {/* Starting Price */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <span className="text-white/80 text-sm">{isTR ? "Başlangıç Fiyatı" : "Starting from"}</span>
              <span className="text-3xl font-bold">€{destination.fromPrice}</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container px-4 py-8 md:py-12">
        {/* Promo Banner */}
        {promoCode.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4 md:p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-primary">
                      {promoCode.discountPercentage}% {isTR ? "İNDİRİM" : "OFF"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {discountText.returnTripDiscount}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end gap-1">
                <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                  <span className="font-mono font-bold text-lg tracking-wider">{promoCode.code}</span>
                </div>
                {promoCode.validUntil && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{discountText.validUntilText}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Description Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl">
            {isTR ? destination.description.tr : destination.description.en}
          </p>
        </motion.section>

        {/* Highlights Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">
            {isTR ? "Neden Bizi Tercih Etmelisiniz?" : "Why Choose Us?"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(isTR ? destination.highlights.tr : destination.highlights.en).map((highlight, idx) => (
              <Card key={idx} className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{highlight}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Feature List */}
        <FeatureList />

        {/* City Map & Popular Locations */}
        <LazyDestinationMap cityKey={cityName || ''} />

        {/* Locations Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">
            {isTR ? "Hizmet Verilen Bölgeler" : "Areas We Cover"}
          </h2>
          <div className="flex flex-wrap gap-3">
            {destination.locations.map((location, idx) => (
              <span
                key={idx}
                className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm font-medium"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {location}
              </span>
            ))}
          </div>
        </motion.section>

        {/* Vehicle Comparison Section */}
        <VehicleComparison 
          cityName={isTR ? destination.nameTR : destination.name} 
          basePrice={destination.fromPrice} 
        />

        {/* Price Table */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {isTR ? "Rota Fiyatları" : "Route Prices"}
            </h2>
            {promoCode.isActive && (
              <span className="text-sm text-primary font-medium flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {promoCode.code}: {promoCode.discountPercentage}% {isTR ? "indirim dönüş yolculuklarında" : "off return trips"}
              </span>
            )}
          </div>
          <PriceTable items={priceItems} />
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-muted/50 rounded-2xl p-6 md:p-10 text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {isTR ? `${destination.nameTR} Transferinizi Şimdi Rezerve Edin` : `Book Your ${destination.name} Transfer Now`}
          </h2>
          {promoCode.isActive && (
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              {discountText.returnTripDiscount}
              {promoCode.validUntil && ` ${discountText.validUntilText}`}
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <WhatsAppButton variant="large" />
            <Button variant="outline" size="lg" asChild>
              <Link to={getLocalizedPath("/book")} className="flex items-center gap-2">
                {isTR ? "Online Rezervasyon" : "Book Online"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <FAQSection items={destination.faqItems} title={isTR ? "Sık Sorulan Sorular" : "Frequently Asked Questions"} />

        {/* Related Destinations */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold mb-6">
            {isTR ? "Diğer Destinasyonlar" : "Other Destinations"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(destinationData)
              .filter(([key]) => key !== cityName?.toLowerCase())
              .slice(0, 4)
              .map(([key, dest]) => (
                <Link
                  key={key}
                  to={getLocalizedPath(`/destinations/${key}`)}
                  className="group"
                >
                  <Card className="hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 text-center">
                      <h3 className="font-bold group-hover:text-primary transition-colors">
                        {isTR ? dest.nameTR : dest.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isTR ? "Başlangıç" : "From"} €{dest.fromPrice}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </motion.section>
      </div>
    </WebsiteLayout>
  );
};

export default DestinationDetail;
