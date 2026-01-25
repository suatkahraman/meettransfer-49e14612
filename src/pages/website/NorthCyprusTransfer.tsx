import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Plane, Clock, Route, Sparkles, Shield, Car, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import cyprusHeroImage from "@/assets/cyprus-transfer-hero.jpg";

// Premium images - WebP optimized
import vitoAirportPremium from "@/assets/vehicles/vito-airport-premium.webp";
import vitoLuxuryInterior from "@/assets/vito-luxury-interior.jpg";
import vipVitoStarlightLuxury from "@/assets/vehicles/vip-vito-starlight.webp";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";

// Ercan Airport prices by region
const ercanPrices = [
  { 
    region: "Girne Merkez / Lefkoşa / Karakum / Çatalköy", 
    sedan: 62, 
    vito: 68, 
    vipVito: 88,
    duration: "30-40 min"
  },
  { 
    region: "Alsancak / Mağusa / İskele", 
    sedan: 74, 
    vito: 82, 
    vipVito: 108,
    duration: "40-55 min"
  },
  { 
    region: "Lapta", 
    sedan: 88, 
    vito: 98, 
    vipVito: 148,
    duration: "45-55 min"
  },
  { 
    region: "Bafra", 
    sedan: 96, 
    vito: 108, 
    vipVito: 188,
    duration: "50-60 min"
  },
];

const destinations = [
  "Girne (Kyrenia)", "Lefkoşa (Nicosia)", "Mağusa (Famagusta)", 
  "İskele", "Alsancak", "Lapta", "Bafra", "Karakum", 
  "Çatalköy", "Esentepe", "Karpaz"
];

const popularRoutes = [
  { key: "ErcanGirne", from: "Ercan Airport", to: "Girne Merkez", duration: "30-40 min" },
  { key: "ErcanLefkosa", from: "Ercan Airport", to: "Lefkoşa", duration: "25-35 min" },
  { key: "ErcanMagusa", from: "Ercan Airport", to: "Mağusa", duration: "45-55 min" },
  { key: "ErcanAlsancak", from: "Ercan Airport", to: "Alsancak", duration: "35-45 min" },
  { key: "ErcanLapta", from: "Ercan Airport", to: "Lapta", duration: "45-55 min" },
  { key: "ErcanBafra", from: "Ercan Airport", to: "Bafra", duration: "50-60 min" },
  { key: "ErcanIskele", from: "Ercan Airport", to: "İskele", duration: "50-60 min" },
  { key: "ErcanKarpaz", from: "Ercan Airport", to: "Karpaz", duration: "70-90 min" },
];

const faqItems = [
  {
    question: "Which airport serves Northern Cyprus?",
    answer: "Ercan International Airport (ECN) is the main airport serving Northern Cyprus (TRNC). It's located centrally on the island, making it convenient for transfers to Girne, Lefkoşa, Mağusa, and other destinations.",
  },
  {
    question: "How long is the transfer from Ercan Airport to Girne?",
    answer: "The transfer from Ercan Airport to Girne (Kyrenia) center takes approximately 30-40 minutes depending on traffic conditions.",
  },
  {
    question: "What vehicle types are available for Ercan Airport transfers?",
    answer: "We offer Standard Sedan (up to 3 passengers), Mercedes Vito (up to 7 passengers), and VIP Mercedes Vito (up to 6 passengers with luxury interior). Mercedes Maybach Minivan and Sprinter are not available for Ercan routes.",
  },
  {
    question: "Are your prices fixed for Ercan Airport transfers?",
    answer: "Yes, all our Ercan Airport transfer prices are fixed. No hidden fees, no surge pricing. The price you see is the price you pay.",
  },
  {
    question: "Do you offer meet and greet service at Ercan Airport?",
    answer: "Yes, our professional driver will meet you at the arrivals hall with a name sign. We track your flight and adjust pickup time if your flight is delayed.",
  },
  {
    question: "Can I pay in cash for Ercan Airport transfers?",
    answer: "Yes, you can pay in cash (Euro, GBP, or Turkish Lira) directly to the driver upon arrival. We also accept credit cards and online payment.",
  },
];

const vehicles = [
  {
    name: "VIP Mercedes Vito",
    description: "Luxury 6-seater with starlight ceiling, perfect for VIP guests",
    passengers: 6,
    luggage: 6,
    features: ["Starlight ceiling", "Leather seats", "WiFi", "Water", "USB charger", "Air Condition"],
    images: [
      { src: vipVitoStarlightLuxury, alt: "VIP Mercedes Vito starlight luxury transfer North Cyprus" },
      { src: vitoVipStarlightPurple, alt: "VIP Mercedes Vito purple interior Ercan Airport" },
    ],
  },
  {
    name: "Mercedes Vito",
    description: "Spacious family transfer vehicle ideal for groups",
    passengers: 7,
    luggage: 7,
    features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
    images: [
      { src: vitoAirportPremium, alt: "Mercedes Vito airport transfer Ercan with chauffeur" },
      { src: vitoLuxuryInterior, alt: "Mercedes Vito luxury interior North Cyprus transfer" },
    ],
  },
];

const NorthCyprusTransfer = () => {
  const { t, language } = useLanguage();
  
  // Translations
  const translations = {
    en: {
      pageTitle: "North Cyprus Ercan Airport Transfer",
      pageSubtitle: "Premium private transfers from Ercan Airport (ECN) to Girne, Lefkoşa, Mağusa and all TRNC destinations",
      h1: "Ercan Airport Private Transfer Service | North Cyprus",
      intro: "Book your premium private transfer from Ercan International Airport to any destination in Northern Cyprus (TRNC). Our professional drivers offer meet & greet service, flight tracking, and fixed prices with no hidden fees.",
      airportTitle: "Ercan International Airport (ECN)",
      airportDesc: "Main gateway to Northern Cyprus, serving Girne (Kyrenia), Lefkoşa (Nicosia), Mağusa (Famagusta), and all TRNC destinations",
      pricesTitle: "Ercan Airport Transfer Prices",
      pricesSubtitle: "Fixed prices in EUR • No hidden fees • Free flight tracking",
      regionColumn: "Region / Destinations",
      sedanColumn: "Standard Sedan",
      vitoColumn: "Mercedes Vito",
      vipVitoColumn: "VIP Mercedes Vito",
      durationColumn: "Duration",
      popularRoutesTitle: "Popular Ercan Airport Transfer Routes",
      destinationsTitle: "Transfer Destinations in North Cyprus",
      whyChooseTitle: "Why Choose Our Ercan Airport Transfer?",
      feature1Title: "Fixed Prices",
      feature1Desc: "No surge pricing, no hidden fees. Pay what you see.",
      feature2Title: "Professional Drivers",
      feature2Desc: "English-speaking, licensed drivers who know every destination",
      feature3Title: "Flight Tracking",
      feature3Desc: "We monitor your flight and adjust pickup for delays",
      bookNow: "Book Your Transfer",
      getQuote: "Get Instant Quote",
      ctaTitle: "Book Your Ercan Airport Transfer",
      ctaDesc: "Get instant WhatsApp confirmation with driver details",
      faqTitle: "Frequently Asked Questions - Ercan Airport Transfer",
      vehicleNote: "Note: Mercedes Maybach Minivan and Mercedes Sprinter are not available for Ercan Airport routes.",
      requestPrice: "Book Now",
      askAI: "Ask AI",
    },
    tr: {
      pageTitle: "Kuzey Kıbrıs Ercan Havalimanı Transfer",
      pageSubtitle: "Ercan Havalimanı'ndan Girne, Lefkoşa, Mağusa ve tüm KKTC destinasyonlarına özel transfer",
      h1: "Ercan Havalimanı Özel Transfer Hizmeti | Kuzey Kıbrıs",
      intro: "Ercan Havalimanı'ndan Kuzey Kıbrıs'ın (KKTC) herhangi bir noktasına premium özel transfer rezervasyonu yapın. Profesyonel şoförlerimiz karşılama hizmeti, uçuş takibi ve gizli ücret olmadan sabit fiyatlar sunar.",
      airportTitle: "Ercan Uluslararası Havalimanı (ECN)",
      airportDesc: "Girne, Lefkoşa, Mağusa ve tüm KKTC destinasyonlarına hizmet veren Kuzey Kıbrıs'ın ana kapısı",
      pricesTitle: "Ercan Havalimanı Transfer Fiyatları",
      pricesSubtitle: "Euro cinsinden sabit fiyatlar • Gizli ücret yok • Ücretsiz uçuş takibi",
      regionColumn: "Bölge / Destinasyonlar",
      sedanColumn: "Standart Sedan",
      vitoColumn: "Mercedes Vito",
      vipVitoColumn: "VIP Mercedes Vito",
      durationColumn: "Süre",
      popularRoutesTitle: "Popüler Ercan Havalimanı Transfer Güzergahları",
      destinationsTitle: "Kuzey Kıbrıs Transfer Destinasyonları",
      whyChooseTitle: "Neden Ercan Havalimanı Transferimizi Tercih Etmelisiniz?",
      feature1Title: "Sabit Fiyatlar",
      feature1Desc: "Gizli ücret yok, sürpriz fiyat artışı yok. Gördüğünüz fiyatı ödersiniz.",
      feature2Title: "Profesyonel Şoförler",
      feature2Desc: "Her destinasyonu bilen, lisanslı ve deneyimli şoförler",
      feature3Title: "Uçuş Takibi",
      feature3Desc: "Uçuşunuzu takip eder, gecikmeler için alış saatini ayarlarız",
      bookNow: "Transfer Rezervasyonu",
      getQuote: "Anlık Fiyat Al",
      ctaTitle: "Ercan Havalimanı Transferinizi Rezerve Edin",
      ctaDesc: "WhatsApp ile anında onay ve şoför bilgisi alın",
      faqTitle: "Sık Sorulan Sorular - Ercan Havalimanı Transfer",
      vehicleNote: "Not: Mercedes Maybach Minivan ve Mercedes Sprinter, Ercan Havalimanı güzergahları için mevcut değildir.",
      requestPrice: "Şimdi Rezerve Et",
      askAI: "AI'a Sor",
    },
  };

  const txt = translations[language as keyof typeof translations] || translations.en;

  return (
    <WebsiteLayout>
      <SEOHead
        title={txt.pageTitle}
        description={txt.intro}
        keywords="Ercan airport transfer, North Cyprus transfer, TRNC airport taxi, Girne transfer, Lefkosa transfer, Magusa transfer, Ercan havalimanı transfer, Kuzey Kıbrıs transfer"
        canonicalPath="/north-cyprus-transfer"
        ogImage="https://meettransfer.app/og/cyprus-airport-og.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['North Cyprus', 'TRNC', 'Ercan', 'Girne', 'Kyrenia', 'Lefkosa', 'Nicosia', 'Magusa', 'Famagusta', 'Alsancak', 'Lapta', 'Bafra', 'Iskele', 'Karpaz'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'North Cyprus Transfer', url: '/north-cyprus-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          { type: 'LocalBusiness' },
          { type: 'TransportationService', areaServed: ['North Cyprus', 'Ercan Airport', 'ECN', 'Girne', 'Lefkosa', 'Magusa'] },
        ]}
      />

      <PageHeader
        title={txt.pageTitle}
        subtitle={txt.pageSubtitle}
        backgroundImage={cyprusHeroImage}
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

        {/* Airport Info */}
        <section>
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 flex items-start gap-4">
            <Plane className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">{txt.airportTitle}</h2>
              <p className="text-muted-foreground">{txt.airportDesc}</p>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Price Table */}
        <section>
          <h2 className="text-2xl font-bold mb-2">{txt.pricesTitle}</h2>
          <p className="text-muted-foreground mb-4">{txt.pricesSubtitle}</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-primary/10">
                  <th className="text-left p-4 font-semibold">{txt.regionColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.sedanColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.vitoColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.vipVitoColumn}</th>
                  <th className="text-center p-4 font-semibold">{txt.durationColumn}</th>
                </tr>
              </thead>
              <tbody>
                {ercanPrices.map((price, index) => (
                  <tr key={index} className="border-t border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{price.region}</td>
                    <td className="p-4 text-center text-primary font-bold">€{price.sedan}</td>
                    <td className="p-4 text-center text-primary font-bold">€{price.vito}</td>
                    <td className="p-4 text-center text-primary font-bold">€{price.vipVito}</td>
                    <td className="p-4 text-center text-muted-foreground text-sm">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {price.duration}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {txt.vehicleNote}
          </p>
        </section>

        {/* Popular Routes */}
        <section className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" />
            {txt.popularRoutesTitle}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularRoutes.map((route) => (
              <div
                key={route.key}
                className="bg-card p-4 rounded-xl shadow-sm border border-border/50 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-sm mb-1">{route.from} → {route.to}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Clock className="h-3 w-3" />
                  {route.duration}
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/" className="flex-1">
                    <Button size="sm" variant="outline" className="text-xs h-7 w-full">
                      {txt.requestPrice}
                    </Button>
                  </Link>
                  <Link to={`/?ai=true&route=${encodeURIComponent(`${route.from} to ${route.to}`)}`}>
                    <Button size="sm" variant="secondary" className="text-xs h-7 gap-1">
                      <Sparkles className="h-3 w-3" />
                      {txt.askAI}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{txt.destinationsTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {destinations.map((dest) => (
              <div
                key={dest}
                className="flex items-center gap-2 bg-card p-3 rounded-lg shadow-sm border border-border/50"
              >
                <MapPin className="h-4 w-4 text-primary" />
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
              <Shield className="h-5 w-5 text-primary mb-2" />
              <h3 className="font-semibold mb-1">{txt.feature1Title}</h3>
              <p className="text-sm text-muted-foreground">{txt.feature1Desc}</p>
            </div>
            <div className="bg-card p-4 rounded-lg">
              <Users className="h-5 w-5 text-primary mb-2" />
              <h3 className="font-semibold mb-1">{txt.feature2Title}</h3>
              <p className="text-sm text-muted-foreground">{txt.feature2Desc}</p>
            </div>
            <div className="bg-card p-4 rounded-lg">
              <Car className="h-5 w-5 text-primary mb-2" />
              <h3 className="font-semibold mb-1">{txt.feature3Title}</h3>
              <p className="text-sm text-muted-foreground">{txt.feature3Desc}</p>
            </div>
          </div>
        </section>

        {/* Vehicles */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("vipFleetForTransfers")} North Cyprus</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.name} {...vehicle} />
            ))}
          </div>
          <Link to="/fleet" className="inline-block mt-4">
            <Button variant="outline" className="gap-2">
              {t("viewAllVehicles")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>

        {/* CTA */}
        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">{txt.ctaTitle}</h3>
          <p className="text-muted-foreground mb-4">
            {txt.ctaDesc}
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer from Ercan Airport in North Cyprus."
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

export default NorthCyprusTransfer;
