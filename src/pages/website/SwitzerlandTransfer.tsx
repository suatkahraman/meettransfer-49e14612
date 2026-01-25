import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Plane, Clock, Route, Sparkles, Shield, Mountain, Snowflake } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";

// Zurich Airport (ZRH) prices
const zurichPrices = [
  { destination: "St. Moritz", price: 920, duration: "2h 30min" },
  { destination: "Gstaad", price: 920, duration: "2h 15min" },
  { destination: "Davos", price: 900, duration: "2h" },
  { destination: "Arosa", price: 900, duration: "2h" },
  { destination: "Zermatt", price: 1100, duration: "3h 30min" },
  { destination: "Verbier", price: 980, duration: "2h 45min" },
  { destination: "Crans-Montana", price: 1240, duration: "3h" },
];

// Geneva Airport (GVA) prices
const genevaPrices = [
  { destination: "St. Moritz", price: 1850, duration: "4h 30min" },
  { destination: "Gstaad", price: 820, duration: "2h" },
  { destination: "Davos", price: 1500, duration: "4h" },
  { destination: "Arosa", price: 1500, duration: "4h" },
  { destination: "Zermatt", price: 1050, duration: "2h 30min" },
  { destination: "Verbier", price: 750, duration: "1h 45min" },
  { destination: "Crans-Montana", price: 800, duration: "2h" },
];

// Basel Airport (BSL) prices
const baselPrices = [
  { destination: "St. Moritz", price: 1200, duration: "3h 30min" },
  { destination: "Gstaad", price: 900, duration: "2h 30min" },
  { destination: "Davos", price: 960, duration: "2h 45min" },
  { destination: "Arosa", price: 960, duration: "2h 45min" },
  { destination: "Zermatt", price: 1070, duration: "3h" },
  { destination: "Verbier", price: 1080, duration: "3h" },
  { destination: "Crans-Montana", price: 1050, duration: "2h 45min" },
];

// Milan Malpensa Airport (MXP) prices
const milanPrices = [
  { destination: "St. Moritz", price: 960, duration: "2h 30min" },
  { destination: "Gstaad", price: 1200, duration: "3h 30min" },
  { destination: "Davos", price: 1080, duration: "3h" },
  { destination: "Arosa", price: 1080, duration: "3h" },
  { destination: "Zermatt", price: 870, duration: "2h 30min" },
  { destination: "Verbier", price: 1050, duration: "3h" },
  { destination: "Crans-Montana", price: 920, duration: "2h 30min" },
];

const destinations = [
  "St. Moritz", "Gstaad", "Davos", "Arosa", 
  "Zermatt", "Verbier", "Crans-Montana", "Zurich City", "Geneva City"
];

// Vehicles available in Switzerland
const vehicles = [
  {
    name: "Mercedes-Benz S-Class",
    description: "The epitome of luxury sedan travel. Perfect for executives and VIP guests seeking the ultimate comfort.",
    passengers: 3,
    luggage: 3,
    features: ["Heated massage seats", "Ambient lighting", "Premium sound system", "Climate control", "Privacy glass", "Wi-Fi"],
    image: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&auto=format&fit=crop",
  },
  {
    name: "Mercedes V-Class",
    description: "Spacious luxury MPV ideal for families and groups traveling to Swiss ski resorts.",
    passengers: 7,
    luggage: 7,
    features: ["Leather seats", "Extra legroom", "Ski equipment storage", "USB chargers", "Air conditioning", "Panoramic roof"],
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop",
  },
];

const faqItems = [
  {
    question: "What vehicles are available for Switzerland transfers?",
    answer: "We offer Mercedes-Benz S-Class sedan and Mercedes V-Class for all Switzerland transfers. Both vehicles are perfect for luxury ski resort transfers with ample space for luggage and ski equipment.",
  },
  {
    question: "How long is the transfer from Zurich Airport to St. Moritz?",
    answer: "The transfer from Zurich Airport (ZRH) to St. Moritz takes approximately 2 hours and 30 minutes, depending on weather and road conditions.",
  },
  {
    question: "Can you transport ski equipment?",
    answer: "Yes, both our Mercedes S-Class and V-Class can accommodate ski equipment. Please mention your equipment when booking so we can ensure sufficient space.",
  },
  {
    question: "Are prices the same for all vehicle types?",
    answer: "Yes, we offer flat-rate pricing for all our Switzerland transfers. Whether you choose the S-Class or V-Class, the price remains the same for maximum flexibility.",
  },
  {
    question: "Do you provide transfers in winter conditions?",
    answer: "Yes, our vehicles are equipped with winter tires and our experienced drivers are trained for alpine road conditions. Safety is our priority.",
  },
  {
    question: "Can I pay in Swiss Francs?",
    answer: "Our prices are quoted in Euros, but we accept payment in Swiss Francs, Euros, or major credit cards. Cash payment to driver is also available.",
  },
];

const SwitzerlandTransfer = () => {
  const { language } = useLanguage();
  
  const translations = {
    en: {
      pageTitle: "Switzerland Airport Transfer | Zurich, Geneva, Basel & Milan to Ski Resorts",
      pageSubtitle: "Luxury private transfers from Zurich, Geneva, Basel and Milan Airports to St. Moritz, Gstaad, Davos, Zermatt and all Swiss ski resorts",
      h1: "Switzerland Airport Private Transfer to Swiss Ski Resorts",
      intro: "Experience luxury private transfers from Zurich (ZRH), Geneva (GVA), Basel (BSL) and Milan Malpensa (MXP) Airports to Switzerland's premier ski destinations. Our professional chauffeurs provide seamless, comfortable transportation in premium Mercedes vehicles to St. Moritz, Gstaad, Davos, Zermatt, and beyond.",
      zurichAirportTitle: "Zurich International Airport (ZRH)",
      zurichAirportDesc: "Switzerland's largest airport, ideal gateway to eastern Swiss resorts like St. Moritz, Davos, and Arosa",
      genevaAirportTitle: "Geneva International Airport (GVA)",
      genevaAirportDesc: "Perfect gateway to western Swiss resorts including Verbier, Zermatt, and Crans-Montana",
      baselAirportTitle: "Basel EuroAirport (BSL)",
      baselAirportDesc: "Convenient tri-national airport serving northern Switzerland, ideal for central Swiss destinations",
      milanAirportTitle: "Milan Malpensa Airport (MXP)",
      milanAirportDesc: "Italian gateway to southern Swiss resorts, ideal for St. Moritz, Zermatt, and Engadin valley",
      zurichPricesTitle: "From Zurich Airport (ZRH)",
      genevaPricesTitle: "From Geneva Airport (GVA)",
      baselPricesTitle: "From Basel Airport (BSL)",
      milanPricesTitle: "From Milan Malpensa Airport (MXP)",
      pricesSubtitle: "Fixed prices in EUR • Same rate for all vehicles • Winter-equipped fleet",
      destinationColumn: "Destination",
      priceColumn: "Price (All Vehicles)",
      durationColumn: "Approx. Duration",
      destinationsTitle: "Transfer Destinations in Switzerland",
      vehiclesTitle: "Our Switzerland Fleet",
      vehiclesSubtitle: "Premium vehicles equipped for alpine conditions",
      whyChooseTitle: "Why Choose Our Switzerland Transfer?",
      feature1Title: "Alpine Expertise",
      feature1Desc: "Experienced drivers trained for mountain road conditions",
      feature2Title: "Winter Ready",
      feature2Desc: "All vehicles equipped with winter tires and snow chains",
      feature3Title: "Ski Equipment",
      feature3Desc: "Ample space for skis, snowboards, and luggage",
      ctaTitle: "Book Your Swiss Alps Transfer",
      ctaDesc: "Get instant WhatsApp confirmation with driver details",
      faqTitle: "Switzerland Transfer FAQ",
      bookNow: "Book Now",
      askAI: "Ask AI",
      passengers: "passengers",
      luggage: "luggage",
    },
    tr: {
      pageTitle: "İsviçre Havalimanı Transfer | Zürih, Cenevre, Basel & Milano'dan Kayak Merkezlerine",
      pageSubtitle: "Zürih, Cenevre, Basel ve Milano Havalimanları'ndan St. Moritz, Gstaad, Davos, Zermatt ve tüm İsviçre kayak merkezlerine lüks özel transfer",
      h1: "İsviçre Havalimanlarından Kayak Merkezlerine Özel Transfer",
      intro: "Zürih (ZRH), Cenevre (GVA), Basel (BSL) ve Milano Malpensa (MXP) Havalimanları'ndan İsviçre'nin en prestijli kayak destinasyonlarına lüks özel transfer deneyimi yaşayın. Profesyonel şoförlerimiz, premium Mercedes araçlarla St. Moritz, Gstaad, Davos, Zermatt ve daha fazlasına sorunsuz ve konforlu ulaşım sağlar.",
      zurichAirportTitle: "Zürih Uluslararası Havalimanı (ZRH)",
      zurichAirportDesc: "İsviçre'nin en büyük havalimanı, St. Moritz, Davos ve Arosa gibi doğu İsviçre tatil merkezlerine ideal kapı",
      genevaAirportTitle: "Cenevre Uluslararası Havalimanı (GVA)",
      genevaAirportDesc: "Verbier, Zermatt ve Crans-Montana dahil batı İsviçre tatil merkezlerine mükemmel kapı",
      baselAirportTitle: "Basel EuroAirport (BSL)",
      baselAirportDesc: "Kuzey İsviçre'ye hizmet veren uluslararası havalimanı, merkezi İsviçre destinasyonları için ideal",
      milanAirportTitle: "Milano Malpensa Havalimanı (MXP)",
      milanAirportDesc: "Güney İsviçre tatil merkezlerine İtalyan kapısı, St. Moritz, Zermatt ve Engadin vadisi için ideal",
      zurichPricesTitle: "Zürih Havalimanı'ndan (ZRH)",
      genevaPricesTitle: "Cenevre Havalimanı'ndan (GVA)",
      baselPricesTitle: "Basel Havalimanı'ndan (BSL)",
      milanPricesTitle: "Milano Malpensa Havalimanı'ndan (MXP)",
      pricesSubtitle: "Euro cinsinden sabit fiyatlar • Tüm araçlar için aynı ücret • Kış donanımlı filo",
      destinationColumn: "Destinasyon",
      priceColumn: "Fiyat (Tüm Araçlar)",
      durationColumn: "Yaklaşık Süre",
      destinationsTitle: "İsviçre Transfer Destinasyonları",
      vehiclesTitle: "İsviçre Filomuz",
      vehiclesSubtitle: "Alp koşullarına uygun premium araçlar",
      whyChooseTitle: "Neden İsviçre Transferimizi Tercih Etmelisiniz?",
      feature1Title: "Alp Uzmanlığı",
      feature1Desc: "Dağ yolu koşullarında eğitimli deneyimli şoförler",
      feature2Title: "Kışa Hazır",
      feature2Desc: "Tüm araçlar kış lastikleri ve kar zincirleriyle donatılmış",
      feature3Title: "Kayak Ekipmanı",
      feature3Desc: "Kayak, snowboard ve bagaj için geniş alan",
      ctaTitle: "İsviçre Alpleri Transferinizi Rezerve Edin",
      ctaDesc: "WhatsApp ile anında onay ve şoför bilgisi alın",
      faqTitle: "İsviçre Transfer SSS",
      bookNow: "Şimdi Rezerve Et",
      askAI: "AI'a Sor",
      passengers: "yolcu",
      luggage: "bagaj",
    },
  };

  const txt = translations[language as keyof typeof translations] || translations.en;

  return (
    <WebsiteLayout>
      <SEOHead
        title={txt.pageTitle}
        description={txt.intro}
        keywords="Zurich airport transfer, Switzerland ski resort transfer, St Moritz transfer, Gstaad transfer, Davos transfer, Zermatt transfer, Swiss Alps private car, luxury chauffeur Switzerland"
        canonicalPath="/switzerland-transfer"
        ogImage="https://meettransfer.app/og/switzerland-airport-og.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Switzerland', 'Zurich', 'St. Moritz', 'Gstaad', 'Davos', 'Arosa', 'Zermatt', 'Verbier', 'Crans-Montana', 'Swiss Alps'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Switzerland Transfer', url: '/switzerland-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          { type: 'LocalBusiness' },
          { type: 'TransportationService', areaServed: ['Switzerland', 'Zurich Airport', 'ZRH', 'St. Moritz', 'Gstaad', 'Davos', 'Zermatt'] },
        ]}
      />

      <PageHeader
        title={txt.pageTitle}
        subtitle={txt.pageSubtitle}
        backgroundImage="https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&auto=format&fit=crop"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Main H1 Content */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {txt.h1}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {txt.intro}
          </p>
        </section>

        {/* Airports Info */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-6 flex items-start gap-4">
            <Plane className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">{txt.zurichAirportTitle}</h2>
              <p className="text-muted-foreground text-sm">{txt.zurichAirportDesc}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl p-6 flex items-start gap-4">
            <Plane className="h-8 w-8 text-red-500 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">{txt.genevaAirportTitle}</h2>
              <p className="text-muted-foreground text-sm">{txt.genevaAirportDesc}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl p-6 flex items-start gap-4">
            <Plane className="h-8 w-8 text-amber-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">{txt.baselAirportTitle}</h2>
              <p className="text-muted-foreground text-sm">{txt.baselAirportDesc}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-6 flex items-start gap-4">
            <Plane className="h-8 w-8 text-green-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">{txt.milanAirportTitle}</h2>
              <p className="text-muted-foreground text-sm">{txt.milanAirportDesc}</p>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Zurich Airport Price Table */}
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <span className="text-xs font-bold bg-blue-500/20 text-blue-600 px-2 py-1 rounded">ZRH</span>
            {txt.zurichPricesTitle}
          </h2>
          <p className="text-muted-foreground mb-4">{txt.pricesSubtitle}</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-blue-500/10">
                  <th className="text-left p-4 font-semibold">{txt.destinationColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.priceColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.durationColumn}</th>
                  <th className="text-center p-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {zurichPrices.map((item, index) => (
                  <tr key={index} className="border-t border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mountain className="h-4 w-4 text-primary" />
                        <span className="font-medium">{item.destination}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-2xl font-bold text-primary">€{item.price}</span>
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.duration}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link to={`/?ai=true&route=${encodeURIComponent(`Zurich Airport to ${item.destination}`)}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          {txt.bookNow}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Geneva Airport Price Table */}
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <span className="text-xs font-bold bg-red-500/20 text-red-600 px-2 py-1 rounded">GVA</span>
            {txt.genevaPricesTitle}
          </h2>
          <p className="text-muted-foreground mb-4">{txt.pricesSubtitle}</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-red-500/10">
                  <th className="text-left p-4 font-semibold">{txt.destinationColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.priceColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.durationColumn}</th>
                  <th className="text-center p-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {genevaPrices.map((item, index) => (
                  <tr key={index} className="border-t border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mountain className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{item.destination}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-2xl font-bold text-red-600">€{item.price}</span>
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.duration}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link to={`/?ai=true&route=${encodeURIComponent(`Geneva Airport to ${item.destination}`)}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          {txt.bookNow}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Basel Airport Price Table */}
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <span className="text-xs font-bold bg-amber-500/20 text-amber-600 px-2 py-1 rounded">BSL</span>
            {txt.baselPricesTitle}
          </h2>
          <p className="text-muted-foreground mb-4">{txt.pricesSubtitle}</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-amber-500/10">
                  <th className="text-left p-4 font-semibold">{txt.destinationColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.priceColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.durationColumn}</th>
                  <th className="text-center p-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {baselPrices.map((item, index) => (
                  <tr key={index} className="border-t border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mountain className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">{item.destination}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-2xl font-bold text-amber-600">€{item.price}</span>
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.duration}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link to={`/?ai=true&route=${encodeURIComponent(`Basel Airport to ${item.destination}`)}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          {txt.bookNow}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Milan Malpensa Airport Price Table */}
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <span className="text-xs font-bold bg-green-500/20 text-green-600 px-2 py-1 rounded">MXP</span>
            {txt.milanPricesTitle}
          </h2>
          <p className="text-muted-foreground mb-4">{txt.pricesSubtitle}</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-green-500/10">
                  <th className="text-left p-4 font-semibold">{txt.destinationColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.priceColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.durationColumn}</th>
                  <th className="text-center p-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {milanPrices.map((item, index) => (
                  <tr key={index} className="border-t border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mountain className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{item.destination}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-2xl font-bold text-green-600">€{item.price}</span>
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.duration}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link to={`/?ai=true&route=${encodeURIComponent(`Milan Malpensa Airport to ${item.destination}`)}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          {txt.bookNow}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Vehicles - Switzerland specific */}
        <section className="bg-gradient-to-br from-secondary/80 to-secondary/40 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-2">{txt.vehiclesTitle}</h2>
          <p className="text-muted-foreground mb-6">{txt.vehiclesSubtitle}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.name} className="overflow-hidden">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={vehicle.image} 
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white">{vehicle.name}</h3>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">{vehicle.description}</p>
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">{vehicle.passengers}</span> {txt.passengers}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">{vehicle.luggage}</span> {txt.luggage}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.slice(0, 4).map((feature) => (
                      <span key={feature} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{txt.destinationsTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {destinations.map((dest) => (
              <div
                key={dest}
                className="flex items-center gap-2 bg-card p-3 rounded-lg shadow-sm border border-border/50"
              >
                <Snowflake className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{dest}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-secondary/50 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">{txt.whyChooseTitle}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card p-4 rounded-lg">
              <Mountain className="h-5 w-5 text-primary mb-2" />
              <h3 className="font-semibold mb-1">{txt.feature1Title}</h3>
              <p className="text-sm text-muted-foreground">{txt.feature1Desc}</p>
            </div>
            <div className="bg-card p-4 rounded-lg">
              <Snowflake className="h-5 w-5 text-blue-500 mb-2" />
              <h3 className="font-semibold mb-1">{txt.feature2Title}</h3>
              <p className="text-sm text-muted-foreground">{txt.feature2Desc}</p>
            </div>
            <div className="bg-card p-4 rounded-lg">
              <Shield className="h-5 w-5 text-primary mb-2" />
              <h3 className="font-semibold mb-1">{txt.feature3Title}</h3>
              <p className="text-sm text-muted-foreground">{txt.feature3Desc}</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">{txt.ctaTitle}</h3>
          <p className="text-white/80 mb-4">
            {txt.ctaDesc}
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer from Zurich Airport to a Swiss ski resort."
          />
        </div>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{txt.faqTitle}</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default SwitzerlandTransfer;
