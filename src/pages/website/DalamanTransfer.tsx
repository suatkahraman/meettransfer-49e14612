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
  "Fethiye", "Ölüdeniz", "Marmaris", "İçmeler", "Göcek",
  "Dalyan", "Sarıgerme", "Hisarönü", "Kayaköy", "Sarigerme"
];

const prices = [
  { from: "DLM Airport", to: "Göcek", price: "$35" },
  { from: "DLM Airport", to: "Fethiye", price: "$45" },
  { from: "DLM Airport", to: "Ölüdeniz", price: "$50" },
  { from: "DLM Airport", to: "Marmaris", price: "$75" },
  { from: "DLM Airport", to: "İçmeler", price: "$80" },
  { from: "DLM Airport", to: "Kaş", price: "$110" },
  { from: "DLM Airport", to: "Kalkan", price: "$120" },
];

const faqItems = [
  {
    question: "What is included in the Dalaman airport transfer price?",
    answer: "Our price includes meet & greet service at the airport, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes.",
  },
  {
    question: "How long is the transfer from Dalaman Airport to Fethiye?",
    answer: "The transfer from Dalaman Airport to Fethiye takes approximately 45-50 minutes.",
  },
  {
    question: "Do you provide transfers to Ölüdeniz from Dalaman?",
    answer: "Yes, we provide direct transfers from Dalaman Airport to Ölüdeniz, including all beach resorts and hotels in the area.",
  },
  {
    question: "Can you pick up from hotels for Dalaman transfers?",
    answer: "Absolutely! We provide both airport pickup and hotel pickup services throughout the region.",
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

const DalamanTransfer = () => {
  const { t } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoDalamanTitle")}
        description={t("seoDalamanDesc")}
        keywords="Dalaman airport transfer, DLM airport transfer, Fethiye airport transfer, Ölüdeniz transfer, Marmaris transfer, Göcek transfer, Dalaman VIP transfer, Dalaman private driver, Turquoise Coast transfer"
        canonicalPath="/dalaman-transfer"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Dalaman', 'Fethiye', 'Ölüdeniz', 'Marmaris', 'Göcek', 'Kaş'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Dalaman Airport Transfer', url: '/dalaman-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Dalaman Airport Transfer Service',
            description: 'Premium VIP airport transfer from Dalaman Airport (DLM) to Turquoise Coast destinations',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg', 'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg'],
            offers: { price: '35', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title={t("dalamanTransferTitle")}
        subtitle={t("transferSubtitle")}
        backgroundImage="https://images.unsplash.com/photo-1600240644455-3edc55c375fe?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("dalamanTransferH1")}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {t("dalamanTransferIntro")}
          </p>
        </section>

        <FeatureList />

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("popularTransferDestinations")} Dalaman</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("vipFleetForTransfers")} Dalaman</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("airportTransferPricesTitle")} Dalaman</h2>
          <PriceTable items={prices} title={t("fixedPriceTransfers")} />
        </section>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">{t("bookYourAirportTransfer")} Dalaman</h3>
          <p className="text-muted-foreground mb-4">
            {t("getWhatsAppConfirmation")}
          </p>
          <WhatsAppButton
            variant="large"
            message={t("dalamanWhatsApp")}
          />
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("transferFaqTitle")} Dalaman</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default DalamanTransfer;
