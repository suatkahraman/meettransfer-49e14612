import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Plane, Palmtree, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";
import cyprusHeroImage from "@/assets/cyprus-transfer-hero.jpg";

const destinations = [
  "Kyrenia (Girne)", "Famagusta (Gazimağusa)", "Nicosia (Lefkoşa)", 
  "Paphos", "Limassol", "Ayia Napa", "Protaras", "Larnaca City",
  "Troodos Mountains", "Karpaz Peninsula"
];

const airports = [
  { code: "LCA", name: "Larnaca International Airport", description: "Main airport of the Republic of Cyprus, serving the eastern and central regions" },
  { code: "PFO", name: "Paphos International Airport", description: "Serves the western region including Paphos and Limassol" },
  { code: "ECN", name: "Ercan International Airport", description: "Main airport in Northern Cyprus, serving Kyrenia and Famagusta" },
];

const prices = [
  { from: "Larnaca Airport", to: "Ayia Napa", price: "Request Price" },
  { from: "Larnaca Airport", to: "Limassol", price: "Request Price" },
  { from: "Larnaca Airport", to: "Paphos", price: "Request Price" },
  { from: "Larnaca Airport", to: "Nicosia", price: "Request Price" },
  { from: "Paphos Airport", to: "Limassol", price: "Request Price" },
  { from: "Ercan Airport", to: "Kyrenia", price: "Request Price" },
  { from: "Ercan Airport", to: "Famagusta", price: "Request Price" },
];

const faqItems = [
  {
    question: "Which airports do you serve in Cyprus?",
    answer: "We provide airport transfers from all three major airports: Larnaca (LCA), Paphos (PFO), and Ercan (ECN). Our service covers both the Republic of Cyprus and Northern Cyprus.",
  },
  {
    question: "How long is the transfer from Larnaca Airport to Ayia Napa?",
    answer: "The transfer from Larnaca International Airport to Ayia Napa takes approximately 40-50 minutes depending on traffic conditions.",
  },
  {
    question: "Can you arrange transfers across the border in Cyprus?",
    answer: "Yes, we can arrange cross-border transfers between the Republic of Cyprus and Northern Cyprus. Please note that border crossing procedures apply.",
  },
  {
    question: "Do you offer transfers to Troodos Mountains?",
    answer: "Yes, we provide comfortable transfers to Troodos Mountains and all mountain villages. Our drivers are experienced with mountain roads.",
  },
  {
    question: "Are child seats available for Cyprus transfers?",
    answer: "Yes, we provide child seats and booster seats free of charge upon request. Please mention the ages of children when booking.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Comfortable 6-seater perfect for families exploring Cyprus",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Water", "USB charger", "Air Condition"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito",
    description: "Spacious family transfer vehicle ideal for Cyprus beach holidays",
    passengers: 7,
    luggage: 7,
    features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const CyprusTransfer = () => {
  const { t } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title="Cyprus Airport Transfer 2025 | VIP Private Transfer Larnaca, Paphos, Ercan to Ayia Napa, Limassol | Meet Transfer"
        description="Book premium Cyprus airport transfer from Larnaca (LCA), Paphos (PFO) & Ercan (ECN). Luxury Mercedes fleet, professional drivers, 24/7 meet & greet. Fixed prices to Ayia Napa, Limassol, Kyrenia, Nicosia. Northern Cyprus included."
        keywords="Cyprus airport transfer, Larnaca airport transfer, Paphos airport transfer, Ercan airport transfer, Ayia Napa transfer, Limassol transfer, Kyrenia transfer, Northern Cyprus transfer, Cyprus VIP transfer, Cyprus private driver, Protaras transfer, Famagusta transfer, Troodos transfer, Cyprus chauffeur service"
        canonicalPath="/cyprus-transfer"
        ogImage="https://meettransfer.app/images/meet-transfer-vclass-interior.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Cyprus', 'Larnaca', 'Paphos', 'Ayia Napa', 'Limassol', 'Kyrenia', 'Famagusta', 'Northern Cyprus', 'Protaras', 'Nicosia', 'Troodos'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Cyprus Airport Transfer', url: '/cyprus-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          { type: 'LocalBusiness' },
          {
            type: 'Product',
            name: 'Cyprus Airport VIP Transfer Service',
            description: 'Premium VIP airport transfer from Larnaca, Paphos, and Ercan airports to Ayia Napa, Limassol, Kyrenia, and all Cyprus destinations including Northern Cyprus',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg', 'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg'],
            offers: { price: '35', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title="Cyprus Airport Transfer"
        subtitle="Mercedes Vito, V-Class | 24/7 Meet & Greet Service"
        backgroundImage={cyprusHeroImage}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Main H1 Content */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Private Airport Transfer in Cyprus
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Discover the beauty of Cyprus with Meet Transfer's premium airport transfer service. We provide professional chauffeur service from all three major airports: Larnaca International Airport (LCA), Paphos International Airport (PFO), and Ercan International Airport (ECN) in Northern Cyprus. Whether you're heading to the party beaches of Ayia Napa, the historic streets of Limassol, the stunning harbor of Kyrenia, or the ancient ruins of Paphos, our VIP meet & greet service ensures a comfortable journey. Our professional drivers know every destination on the island and provide 24/7 service with luxury Mercedes vehicles, complimentary water, WiFi, and flight monitoring for your private Cyprus transfer.
          </p>
        </section>

        {/* Airports Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            Cyprus Airports We Serve
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
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
          <h2 className="text-2xl font-bold mb-4">{t("popularTransferDestinations")} Cyprus</h2>
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

        {/* Why Cyprus Section */}
        <section className="bg-secondary/50 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Palmtree className="h-6 w-6 text-primary" />
            Why Choose Our Cyprus Transfer Service
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card p-4 rounded-lg">
              <Sun className="h-5 w-5 text-yellow-500 mb-2" />
              <h3 className="font-semibold mb-1">Island-Wide Coverage</h3>
              <p className="text-sm text-muted-foreground">Service to all destinations including Northern Cyprus</p>
            </div>
            <div className="bg-card p-4 rounded-lg">
              <Sun className="h-5 w-5 text-yellow-500 mb-2" />
              <h3 className="font-semibold mb-1">Local Expertise</h3>
              <p className="text-sm text-muted-foreground">Drivers who know every beach, village, and hotel in Cyprus</p>
            </div>
            <div className="bg-card p-4 rounded-lg">
              <Sun className="h-5 w-5 text-yellow-500 mb-2" />
              <h3 className="font-semibold mb-1">Cross-Border Service</h3>
              <p className="text-sm text-muted-foreground">Seamless transfers between South and North Cyprus</p>
            </div>
          </div>
        </section>

        {/* VIP Fleet */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("vipFleetForTransfers")} Cyprus</h2>
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

        {/* Prices */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("airportTransferPricesTitle")} Cyprus</h2>
          <PriceTable items={prices} title={t("fixedPriceTransfers")} />
        </section>

        {/* CTA */}
        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">{t("bookYourAirportTransfer")} Cyprus</h3>
          <p className="text-muted-foreground mb-4">
            {t("getWhatsAppConfirmation")}
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer from Cyprus Airport."
          />
        </div>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("transferFaqTitle")} Cyprus</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default CyprusTransfer;
