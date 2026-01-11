import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Plane, Building2, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import dubaiHeroImage from "@/assets/dubai-transfer-hero.jpg";
// Vito VIP images
import vitoAirportPremium from "@/assets/vito-airport-premium.jpg";
import vitoLuxuryInterior from "@/assets/vito-luxury-interior.jpg";
import vipVitoStarlightLuxury from "@/assets/vip-vito-starlight-luxury.jpg";
import vitoVip1 from "@/assets/vito-vip-1.jpg";
import vitoVip2 from "@/assets/vito-vip-2.jpg";
// Vito images
import vito1 from "@/assets/vito-1.jpg";
import vito2 from "@/assets/vito-2.jpg";
import vito3 from "@/assets/vito-3.jpg";
// Maybach images
import maybachUltraLuxury from "@/assets/maybach-ultra-luxury.jpg";
import maybach1 from "@/assets/maybach-1.jpg";
import maybach2 from "@/assets/maybach-2.jpg";
import maybach3 from "@/assets/maybach-3.jpg";

const destinations = [
  "Burj Khalifa", "Palm Jumeirah", "Dubai Marina", "Downtown Dubai",
  "JBR Beach", "Dubai Mall", "Deira", "Business Bay", "DIFC", "Jumeirah"
];

const airports = [
  { code: "DXB", name: "Dubai International Airport", description: "World's busiest international airport, main gateway to Dubai" },
  { code: "DWC", name: "Al Maktoum International (Dubai World Central)", description: "Modern airport serving low-cost carriers and cargo" },
];

const prices = [
  { from: "DXB Airport", to: "Downtown Dubai", price: "$55" },
  { from: "DXB Airport", to: "Palm Jumeirah", price: "$70" },
  { from: "DXB Airport", to: "Dubai Marina", price: "$65" },
  { from: "DXB Airport", to: "JBR Beach", price: "$65" },
  { from: "DXB Airport", to: "Business Bay", price: "$50" },
  { from: "DWC Airport", to: "Downtown Dubai", price: "$85" },
  { from: "DWC Airport", to: "Palm Jumeirah", price: "$90" },
];

const faqItems = [
  {
    question: "What is included in the Dubai airport transfer price?",
    answer: "Our price includes meet & greet service at the airport, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes. No hidden fees.",
  },
  {
    question: "How long is the transfer from Dubai Airport to Downtown Dubai?",
    answer: "The transfer from Dubai International Airport (DXB) to Downtown Dubai takes approximately 15-25 minutes depending on traffic conditions.",
  },
  {
    question: "Do you offer transfers from Al Maktoum Airport (DWC)?",
    answer: "Yes, we provide premium transfers from both Dubai International Airport (DXB) and Al Maktoum International Airport (DWC) to all Dubai destinations.",
  },
  {
    question: "Can I book a luxury car like Mercedes Maybach in Dubai?",
    answer: "Absolutely! We offer a premium fleet including Mercedes Vito VIP, V-Class, and Maybach for the ultimate luxury transfer experience in Dubai.",
  },
  {
    question: "Are your drivers familiar with Dubai hotels and landmarks?",
    answer: "Yes, all our drivers are experienced professionals who know Dubai thoroughly, including all major hotels, resorts, and landmarks.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Comfortable 6-seater perfect for families and small groups visiting Dubai",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Water", "USB charger", "Air Condition"],
    images: [
      { src: vitoAirportPremium, alt: "Mercedes Vito VIP Dubai airport transfer" },
      { src: vitoLuxuryInterior, alt: "Mercedes Vito VIP luxury interior Dubai" },
      { src: vipVitoStarlightLuxury, alt: "Mercedes Vito VIP starlight ceiling" },
      { src: vitoVip1, alt: "Mercedes Vito VIP exterior Dubai" },
      { src: vitoVip2, alt: "Mercedes Vito VIP premium service Dubai" },
    ],
  },
  {
    name: "Mercedes Vito",
    description: "Spacious family transfer vehicle ideal for Dubai airport transfers",
    passengers: 7,
    luggage: 7,
    features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
    images: [
      { src: vito1, alt: "Mercedes Vito family transfer Dubai" },
      { src: vito2, alt: "Mercedes Vito comfortable interior Dubai" },
      { src: vito3, alt: "Mercedes Vito airport service Dubai" },
    ],
  },
  {
    name: "Mercedes Maybach",
    description: "Ultimate luxury for VIP guests and business executives in Dubai",
    passengers: 3,
    luggage: 3,
    features: ["Executive seating", "Premium leather", "Privacy glass", "Champagne cooler", "WiFi"],
    images: [
      { src: maybachUltraLuxury, alt: "Mercedes Maybach ultra luxury interior Dubai" },
      { src: maybach1, alt: "Mercedes Maybach VIP transfer Dubai" },
      { src: maybach2, alt: "Mercedes Maybach executive service Dubai" },
      { src: maybach3, alt: "Mercedes Maybach starlight ceiling Dubai" },
    ],
  },
];

const DubaiTransfer = () => {
  const { t } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoDubaiTitle")}
        description={t("seoDubaiDesc")}
        keywords={t("seoDubaiKeywords")}
        canonicalPath="/dubai-transfer"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Dubai', 'Palm Jumeirah', 'Downtown Dubai', 'Dubai Marina', 'JBR', 'Business Bay', 'Burj Khalifa', 'Deira', 'DIFC', 'Jumeirah'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Dubai Airport Transfer', url: '/dubai-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          { type: 'LocalBusiness' },
          {
            type: 'Product',
            name: 'Dubai Airport VIP Transfer Service',
            description: 'Premium VIP airport transfer from Dubai International Airport (DXB) and Al Maktoum Airport (DWC) to Palm Jumeirah, Downtown Dubai, Marina, and all destinations',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg', 'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg'],
            offers: { price: '50', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title={t("dubaiAirportTransfer")}
        subtitle={t("dubaiSubtitle")}
        backgroundImage={dubaiHeroImage}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Main H1 Content */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("dubaiH1")}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {t("dubaiIntro")}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            {t("dubaiAirportsTitle")}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {airports.map((airport) => (
              <div
                key={airport.code}
                className="bg-card p-4 rounded-lg shadow-sm border border-border/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-primary">{airport.code}</span>
                  <span className="text-sm font-medium">{airport.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{airport.description}</p>
              </div>
            ))}
          </div>
        </section>

        <FeatureList />

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("popularTransferDestinations")} Dubai</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {destinations.map((dest) => (
              <div
                key={dest}
                className="flex items-center gap-2 bg-card p-3 rounded-lg shadow-sm"
              >
                <MapPin className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{dest}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Why Dubai Section */}
        <section className="bg-secondary/50 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {t("whyChooseDubaiTransfer")}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card p-4 rounded-lg">
              <Star className="h-5 w-5 text-yellow-500 mb-2" />
              <h3 className="font-semibold mb-1">Luxury Fleet</h3>
              <p className="text-sm text-muted-foreground">Premium Mercedes vehicles including Maybach for VIP guests</p>
            </div>
            <div className="bg-card p-4 rounded-lg">
              <Star className="h-5 w-5 text-yellow-500 mb-2" />
              <h3 className="font-semibold mb-1">Local Expertise</h3>
              <p className="text-sm text-muted-foreground">Drivers who know every hotel, resort, and landmark in Dubai</p>
            </div>
            <div className="bg-card p-4 rounded-lg">
              <Star className="h-5 w-5 text-yellow-500 mb-2" />
              <h3 className="font-semibold mb-1">24/7 Availability</h3>
              <p className="text-sm text-muted-foreground">Round-the-clock service for all arrivals and departures</p>
            </div>
          </div>
        </section>

        {/* VIP Fleet */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("vipFleetForTransfers")} Dubai</h2>
          <div className="grid md:grid-cols-3 gap-6">
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

        {/* Prices */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("airportTransferPricesTitle")} Dubai</h2>
          <PriceTable items={prices} title={t("fixedPriceTransfers")} />
        </section>

        {/* CTA */}
        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">{t("bookYourAirportTransfer")} Dubai</h3>
          <p className="text-muted-foreground mb-4">
            {t("getWhatsAppConfirmation")}
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer from Dubai Airport."
          />
        </div>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("transferFaqTitle")} Dubai</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default DubaiTransfer;
