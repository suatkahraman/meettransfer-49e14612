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
  "Ephesus", "Pamukkale", "Hierapolis", "Şirince", "House of Virgin Mary",
  "Laodicea", "Aphrodisias", "Priene", "Miletus", "Didyma"
];

const prices = [
  { from: "ADB Airport", to: "Ephesus", price: "€50" },
  { from: "Selçuk", to: "Pamukkale", price: "€120" },
  { from: "Kuşadası", to: "Ephesus", price: "€30" },
  { from: "Izmir", to: "Pamukkale", price: "€150" },
  { from: "Denizli Airport", to: "Pamukkale", price: "€40" },
];

const faqItems = [
  {
    question: "Can you arrange a combined Ephesus and Pamukkale tour?",
    answer: "Yes, we offer full-day private tours covering both Ephesus and Pamukkale with professional English-speaking guides.",
  },
  {
    question: "What is the distance between Ephesus and Pamukkale?",
    answer: "Ephesus to Pamukkale is approximately 190 km and takes about 2.5-3 hours by car through scenic Turkish countryside.",
  },
  {
    question: "Do you provide guided tours as well?",
    answer: "Yes, we can arrange licensed guides for historical sites. Our guides speak English, German, French, and other languages.",
  },
  {
    question: "Can I visit from a cruise ship?",
    answer: "Absolutely! We specialize in cruise shore excursions from Kuşadası port to Ephesus and other nearby sites.",
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

const EphesusPamukkale = () => {
  const { t } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoEphesusTitle")}
        description={t("seoEphesusDesc")}
        keywords="Ephesus transfer, Pamukkale transfer, Ephesus tour, Pamukkale tour, Kuşadası cruise excursion, Ephesus private tour, Hierapolis transfer, Turkey ancient sites tour, Selçuk transfer"
        canonicalPath="/ephesus-pamukkale"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Ephesus', 'Pamukkale', 'Kuşadası', 'Selçuk', 'Izmir'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Ephesus & Pamukkale', url: '/ephesus-pamukkale' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Ephesus & Pamukkale Transfer Service',
            description: 'Private transfers and guided tours to ancient Ephesus and Pamukkale cotton castle',
            offers: { price: '30', priceCurrency: 'EUR' },
          },
        ]}
      />

      <PageHeader
        title={t("ephesusTransferTitle")}
        subtitle={t("ephesusTransferSubtitle")}
        backgroundImage="https://images.unsplash.com/photo-1589561454226-796a8aa89b05?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("ephesusTransferH1")}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {t("ephesusTransferIntro")}
          </p>
        </section>

        <FeatureList />

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("historicalSitesWeCover")}</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("vipFleetForHistoricalTours")}</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("ephesusTransferPrices")}</h2>
          <PriceTable items={prices} title={t("fixedPriceTransfers")} />
        </section>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">{t("bookYourHistoricalTour")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("getWhatsAppConfirmationEphesus")}
          </p>
          <WhatsAppButton
            variant="large"
            message={t("ephesusWhatsApp")}
          />
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("ephesusTransferFaq")}</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default EphesusPamukkale;
