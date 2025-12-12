import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.jpg";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.jpg";

const destinations = [
  "Lara", "Kundu", "Belek", "Side", "Alanya",
  "Kemer", "Kalkan", "Kaş", "Olimpos", "Manavgat"
];

const prices = [
  { from: "AYT Airport", to: "Lara", price: "$35" },
  { from: "AYT Airport", to: "Kundu", price: "$40" },
  { from: "AYT Airport", to: "Belek", price: "$45" },
  { from: "AYT Airport", to: "Side", price: "$65" },
  { from: "AYT Airport", to: "Manavgat", price: "$70" },
  { from: "AYT Airport", to: "Alanya", price: "$90" },
  { from: "AYT Airport", to: "Kemer", price: "$55" },
];

const faqItems = [
  {
    question: "What is included in the Antalya airport transfer price?",
    answer: "Our price includes meet & greet service at the airport, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes.",
  },
  {
    question: "How long is the transfer from Antalya Airport to Belek?",
    answer: "The transfer from Antalya Airport to Belek takes approximately 30-40 minutes depending on traffic conditions.",
  },
  {
    question: "Can you accommodate child seats for Antalya transfers?",
    answer: "Yes, we provide child seats and booster seats free of charge upon request. Please mention this when booking.",
  },
  {
    question: "Do you offer return transfers from Antalya Airport?",
    answer: "Yes, we offer both one-way and round-trip transfers. You can book your return transfer at the same time for added convenience.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Comfortable 6-seater perfect for families and small groups",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Water", "USB charger"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito",
    description: "The Mercedes Vito Comfortable family holiday transfer vehicles with best budget.",
    passengers: 7,
    luggage: 7,
    features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const AntalyaTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Antalya Airport Transfer - VIP Private Chauffeur Service | Meet Transfer"
        description="Premium Antalya airport transfer service to Belek, Side, Alanya, Kemer. VIP meet & greet, Mercedes fleet, fixed prices. Book your private Antalya transfer today!"
        keywords="Antalya airport transfer, AYT airport transfer, Belek airport transfer, Side airport transfer, Alanya airport transfer, Kemer transfer, Antalya VIP transfer, Antalya private driver, Turkey Riviera transfer"
        canonicalPath="/antalya-transfer"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Antalya', 'Belek', 'Side', 'Alanya', 'Kemer', 'Lara'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Antalya Airport Transfer', url: '/antalya-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Antalya Airport Transfer Service',
            description: 'Premium VIP airport transfer from Antalya Airport (AYT) to all beach resorts',
            offers: { price: '35', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title="Antalya Airport Transfer – VIP Chauffeur Service"
        subtitle="Mercedes Vito, V-Class, Maybach | 24/7 Meet & Greet Service"
        backgroundImage="https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Private Airport Transfer in Antalya
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Welcome to the Turkish Riviera! Meet Transfer provides premium <strong>Antalya airport
            transfers</strong> from <strong>Antalya Airport (AYT)</strong> to all popular beach resorts
            including <strong>Lara, Belek, Side, Alanya, and Kemer</strong>. Our professional drivers
            ensure a comfortable and stress-free journey to your hotel. With <strong>VIP meet &
            greet service</strong>, flight monitoring, and luxury <strong>Mercedes vehicles</strong>, your vacation
            starts the moment you land. Book your <strong>private Antalya transfer</strong> today!
          </p>
        </section>

        <FeatureList />

        <section>
          <h2 className="text-2xl font-bold mb-4">Popular Antalya Transfer Destinations</h2>
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

        <section>
          <h2 className="text-2xl font-bold mb-4">VIP Fleet for Antalya Transfers</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.name} {...vehicle} />
            ))}
          </div>
          <Link to="/fleet" className="inline-block mt-4">
            <Button variant="outline" className="gap-2">
              View All Vehicles <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Antalya Airport Transfer Prices</h2>
          <PriceTable items={prices} title="Fixed Price Transfers" />
        </section>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Book Your Antalya Airport Transfer</h3>
          <p className="text-muted-foreground mb-4">
            Get instant confirmation via WhatsApp for your Antalya transfer
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer from Antalya Airport."
          />
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-4">Antalya Transfer FAQ</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default AntalyaTransfer;
