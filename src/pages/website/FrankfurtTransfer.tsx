import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import LazyDestinationMap from "@/components/website/LazyDestinationMap";
import { MapPin, ArrowRight, Plane, Building2, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import frankfurtHeroImage from "@/assets/destinations/frankfurt-city.webp";
// Vito VIP images - WebP optimized
import vitoAirportPremium from "@/assets/vehicles/vito-airport-premium.webp";
import vitoLuxuryInterior from "@/assets/vito-luxury-interior.jpg";
import vipVitoStarlightLuxury from "@/assets/vehicles/vip-vito-starlight.webp";
import vitoVip1 from "@/assets/vito-vip-1.jpg";
import vitoVip2 from "@/assets/vito-vip-2.jpg";
// Vito images
import vito1 from "@/assets/vito-1.jpg";
import vito2 from "@/assets/vito-2.jpg";
import vito3 from "@/assets/vito-3.jpg";
// Maybach images - WebP optimized
import maybachUltraLuxury from "@/assets/vehicles/maybach-luxury.webp";
import maybach1 from "@/assets/maybach-1.jpg";
import maybach2 from "@/assets/maybach-2.jpg";
import maybach3 from "@/assets/maybach-3.jpg";

const destinations = [
  "City Center", "Messe Frankfurt", "Financial District", "Main Tower",
  "Palmengarten", "Sachsenhausen", "Mannheim", "Wiesbaden", "Mainz", "Darmstadt", "Offenbach"
];

const airports = [
  { code: "FRA", name: "Frankfurt Airport", description: "Germany's busiest airport and major European hub with excellent connections worldwide" },
];

const prices = [
  { from: "FRA Airport", to: "Frankfurt City Center", price: "€55" },
  { from: "FRA Airport", to: "Messe Frankfurt", price: "€50" },
  { from: "FRA Airport", to: "Financial District", price: "€55" },
  { from: "FRA Airport", to: "Sachsenhausen", price: "€60" },
  { from: "FRA Airport", to: "Mannheim", price: "€130" },
  { from: "FRA Airport", to: "Wiesbaden", price: "€75" },
  { from: "FRA Airport", to: "Mainz", price: "€70" },
  { from: "FRA Airport", to: "Darmstadt", price: "€65" },
];

const faqItems = [
  {
    question: "What is included in the Frankfurt airport transfer price?",
    answer: "Our price includes meet & greet service at the airport, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes. No hidden fees.",
  },
  {
    question: "How long is the transfer from Frankfurt Airport to city center?",
    answer: "The transfer from Frankfurt Airport (FRA) to Frankfurt city center takes approximately 25-35 minutes depending on traffic conditions.",
  },
  {
    question: "Do you provide transfers to Messe Frankfurt for trade fairs?",
    answer: "Yes! We specialize in Messe Frankfurt transfers for trade fair visitors and exhibitors. We can accommodate luggage and exhibition materials.",
  },
  {
    question: "Can I book a luxury car like Mercedes Maybach in Frankfurt?",
    answer: "Absolutely! We offer a premium fleet including Mercedes Vito VIP, V-Class, and Maybach for the ultimate luxury transfer experience in Frankfurt.",
  },
  {
    question: "Do you offer transfers to nearby cities like Wiesbaden and Mainz?",
    answer: "Yes, we provide transfers to all cities in the Frankfurt metropolitan area including Wiesbaden, Mainz, Darmstadt, and Offenbach.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Comfortable 6-seater perfect for business travelers and families visiting Frankfurt",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Water", "USB charger", "Air Condition"],
    images: [
      { src: vitoAirportPremium, alt: "Mercedes Vito VIP Frankfurt airport transfer" },
      { src: vitoLuxuryInterior, alt: "Mercedes Vito VIP luxury interior Frankfurt" },
      { src: vipVitoStarlightLuxury, alt: "Mercedes Vito VIP starlight ceiling" },
      { src: vitoVip1, alt: "Mercedes Vito VIP exterior Frankfurt" },
      { src: vitoVip2, alt: "Mercedes Vito VIP premium service Frankfurt" },
    ],
  },
  {
    name: "Mercedes Vito",
    description: "Spacious family transfer vehicle ideal for Frankfurt airport transfers",
    passengers: 7,
    luggage: 7,
    features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
    images: [
      { src: vito1, alt: "Mercedes Vito family transfer Frankfurt" },
      { src: vito2, alt: "Mercedes Vito comfortable interior Frankfurt" },
      { src: vito3, alt: "Mercedes Vito airport service Frankfurt" },
    ],
  },
  {
    name: "Mercedes Maybach",
    description: "Ultimate luxury for VIP guests and business executives in Frankfurt",
    passengers: 3,
    luggage: 3,
    features: ["Executive seating", "Premium leather", "Privacy glass", "Champagne cooler", "WiFi"],
    images: [
      { src: maybachUltraLuxury, alt: "Mercedes Maybach ultra luxury interior Frankfurt" },
      { src: maybach1, alt: "Mercedes Maybach VIP transfer Frankfurt" },
      { src: maybach2, alt: "Mercedes Maybach executive service Frankfurt" },
      { src: maybach3, alt: "Mercedes Maybach starlight ceiling Frankfurt" },
    ],
  },
];

const FrankfurtTransfer = () => {
  const { t, getLocalizedPath } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title="Frankfurt Airport Transfer | VIP Transfers from FRA | Meet Transfer"
        description="Premium VIP airport transfer from Frankfurt Airport (FRA) to city center, Messe Frankfurt, Financial District and all destinations. Mercedes fleet, professional drivers, 24/7 service."
        keywords="Frankfurt airport transfer, FRA transfer, Frankfurt VIP transfer, Messe Frankfurt transfer, Frankfurt taxi, Frankfurt chauffeur, Frankfurt airport taxi, Germany airport transfer"
        canonicalPath="/frankfurt-transfer"
        ogImage="https://meettransfer.app/og/frankfurt-airport-og.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Frankfurt', 'Messe Frankfurt', 'Financial District', 'Sachsenhausen', 'Wiesbaden', 'Mainz', 'Darmstadt'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Frankfurt Airport Transfer', url: '/frankfurt-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          { type: 'LocalBusiness' },
          { type: 'TransportationService', areaServed: ['Frankfurt', 'Frankfurt Airport', 'FRA', 'Messe Frankfurt'] },
        ]}
      />

      <PageHeader
        title="Frankfurt Airport Transfer"
        subtitle="Premium VIP transfers from Frankfurt Airport (FRA)"
        backgroundImage={frankfurtHeroImage}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Main H1 Content */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Frankfurt Airport VIP Transfer Service
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Welcome to Frankfurt, Germany's financial capital and major European hub. Frankfurt Airport (FRA) is one of Europe's busiest airports, 
            connecting travelers worldwide. Our premium VIP transfer service ensures you reach your destination in comfort and style. 
            Whether you're attending a trade fair at Messe Frankfurt, visiting the financial district, or exploring the historic old town, 
            our professional chauffeurs and luxury Mercedes fleet are at your service 24/7.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            Frankfurt Airport Information
          </h2>
          <div className="grid md:grid-cols-1 gap-4">
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

        {/* Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Popular Destinations from Frankfurt Airport
          </h2>
          <div className="flex flex-wrap gap-2">
            {destinations.map((dest) => (
              <span
                key={dest}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {dest}
              </span>
            ))}
          </div>
        </section>

        {/* Price Table */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Frankfurt Airport Transfer Prices</h2>
          <PriceTable items={prices} />
          <p className="text-sm text-muted-foreground mt-2">
            * Prices are for Mercedes Vito VIP (up to 6 passengers). Maybach and larger vehicles available on request.
          </p>
        </section>

        {/* Vehicles */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Luxury Fleet in Frankfurt</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.name} {...vehicle} />
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Why Choose Meet Transfer in Frankfurt?</h2>
          <FeatureList />
        </section>

        {/* Map */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Frankfurt Destinations Map
          </h2>
          <LazyDestinationMap cityKey="frankfurt" />
        </section>

        {/* FAQ */}
        <section>
          <FAQSection items={faqItems} />
        </section>

        {/* CTA */}
        <section className="bg-card rounded-xl p-8 text-center border border-border/50">
          <h2 className="text-2xl font-bold mb-4">Ready to Book Your Frankfurt Transfer?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Book your premium Frankfurt airport transfer now. We offer meet & greet service, 
            flight tracking, and door-to-door service with our luxury Mercedes fleet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/book")}>
              <Button size="lg" variant="default" className="gap-2">
                {t("requestPrice")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <WhatsAppButton
              message="Hello, I need a transfer from Frankfurt Airport."
            />
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default FrankfurtTransfer;
