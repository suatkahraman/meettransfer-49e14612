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
import { useLanguage } from "@/contexts/LanguageContext";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Çeşme", "Alaçatı", "Foça", "Kuşadası", "Seferihisar",
  "Urla", "Dikili", "Selçuk", "Şirince", "Izmir Center"
];

const prices = [
  { from: "ADB Airport", to: "Izmir Center", price: "$35" },
  { from: "ADB Airport", to: "Alsancak", price: "$40" },
  { from: "ADB Airport", to: "Konak", price: "$40" },
  { from: "ADB Airport", to: "Çeşme", price: "$110" },
  { from: "ADB Airport", to: "Alaçatı", price: "$100" },
  { from: "ADB Airport", to: "Kuşadası", price: "$85" },
];

const faqItems = [
  {
    question: "What is included in the Izmir airport transfer price?",
    answer: "Our price includes meet & greet service at the airport, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes.",
  },
  {
    question: "How far is Çeşme from Izmir Airport?",
    answer: "Çeşme is approximately 85 km from Izmir Airport. The transfer takes about 1 hour 15 minutes.",
  },
  {
    question: "Do you provide transfers to Ephesus from Izmir?",
    answer: "Yes, we offer direct transfers to Ephesus and Selçuk from Izmir Airport. We can also arrange guided tours.",
  },
  {
    question: "Can I book a transfer to Izmir cruise port?",
    answer: "Yes, we provide transfers to and from Izmir cruise port and Kuşadası cruise port.",
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

const IzmirTransfer = () => {
  const { t } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoIzmirTitle")}
        description={t("seoIzmirDesc")}
        keywords="Izmir airport transfer, ADB airport transfer, Çeşme airport transfer, Alaçatı transfer, Kuşadası transfer, Ephesus transfer, Izmir VIP transfer, Izmir private driver, Aegean Coast transfer"
        canonicalPath="/izmir-transfer"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Izmir', 'Çeşme', 'Alaçatı', 'Kuşadası', 'Ephesus', 'Selçuk'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Izmir Airport Transfer', url: '/izmir-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Izmir Airport Transfer Service',
            description: 'Premium VIP airport transfer from Adnan Menderes Airport (ADB) to Aegean Coast destinations',
            offers: { price: '35', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title={t("izmirTransferTitle")}
        subtitle={t("transferSubtitle")}
        backgroundImage="https://images.unsplash.com/photo-1565361849078-294849288a2d?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("izmirTransferH1")}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {t("izmirTransferIntro")}
          </p>
        </section>

        <FeatureList />

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("popularTransferDestinations")} Izmir</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("vipFleetForTransfers")} Izmir</h2>
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

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("airportTransferPricesTitle")} Izmir</h2>
          <PriceTable items={prices} title={t("fixedPriceTransfers")} />
        </section>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">{t("bookYourAirportTransfer")} Izmir</h3>
          <p className="text-muted-foreground mb-4">
            {t("getWhatsAppConfirmation")}
          </p>
          <WhatsAppButton
            variant="large"
            message={t("izmirWhatsApp")}
          />
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("transferFaqTitle")} Izmir</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default IzmirTransfer;
