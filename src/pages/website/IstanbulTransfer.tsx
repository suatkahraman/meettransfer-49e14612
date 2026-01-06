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
  "Taksim", "Sultanahmet", "Galataport", "Kadıköy", "Levent",
  "Şişli", "Beşiktaş", "Nişantaşı", "Maslak", "Bakırköy"
];

const prices = [
  { from: "IST Airport", to: "Taksim", price: "From €50" },
  { from: "IST Airport", to: "Sultanahmet", price: "From €50" },
  { from: "IST Airport", to: "Beşiktaş", price: "From €50" },
  { from: "IST Airport", to: "Levent", price: "From €50" },
  { from: "IST Airport", to: "Kadıköy", price: "From €65" },
  { from: "IST Airport", to: "Üsküdar", price: "From €60" },
  { from: "IST Airport", to: "Galataport", price: "From €50" },
  { from: "SAW Airport", to: "Taksim", price: "From €65" },
  { from: "SAW Airport", to: "Sultanahmet", price: "From €65" },
  { from: "SAW Airport", to: "Beşiktaş", price: "From €65" },
  { from: "SAW Airport", to: "Kadıköy", price: "From €45" },
  { from: "SAW Airport", to: "Üsküdar", price: "From €45" },
  { from: "IST Airport", to: "Bursa", price: "From €185" },
  { from: "SAW Airport", to: "Bursa", price: "From €165" },
  { from: "IST Airport", to: "Sapanca", price: "From €245" },
  { from: "SAW Airport", to: "Sapanca", price: "From €225" },
  { from: "IST Airport", to: "Kartepe", price: "From €255" },
  { from: "SAW Airport", to: "Kartepe", price: "From €235" },
];

const faqItems = [
  {
    question: "What is included in the Istanbul airport transfer price?",
    answer: "Our price includes meet & greet service at the airport, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes.",
  },
  {
    question: "How do I book an Istanbul airport transfer?",
    answer: "You can book through our website, WhatsApp, or by calling us directly. We confirm all bookings within minutes.",
  },
  {
    question: "Is the Istanbul transfer price fixed or metered?",
    answer: "All our prices are fixed. The price you see is the price you pay – no hidden fees or surprises.",
  },
  {
    question: "Do you track flight arrivals at Istanbul Airport?",
    answer: "Yes, we track all flights in real-time. If your flight is early or delayed, your driver will be there when you land.",
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

const IstanbulTransfer = () => {
  const { t } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoIstanbulTitle")}
        description={t("seoIstanbulDesc")}
        keywords="Istanbul airport transfer, IST airport transfer, Sabiha Gökçen transfer, Istanbul private driver, Istanbul VIP transfer, Istanbul chauffeur service, Taksim airport transfer, Sultanahmet airport transfer"
        canonicalPath="/istanbul-transfer"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul', 'Taksim', 'Sultanahmet', 'Beşiktaş', 'Kadıköy'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Istanbul Airport Transfer', url: '/istanbul-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Istanbul Airport Transfer Service',
            description: 'Premium VIP airport transfer from Istanbul Airport (IST) and Sabiha Gökçen (SAW)',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg', 'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg'],
            offers: { price: '50', priceCurrency: 'EUR' },
          },
        ]}
      />

      <PageHeader
        title={t("istanbulTransferTitle")}
        subtitle={t("transferSubtitle")}
        backgroundImage="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("istanbulTransferH1")}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {t("istanbulTransferIntro")}
          </p>
        </section>

        <FeatureList />

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("popularTransferDestinations")} Istanbul</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("vipFleetForTransfers")} Istanbul</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("airportTransferPricesTitle")} Istanbul</h2>
          <PriceTable items={prices} title={t("fixedPriceTransfers")} />
        </section>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">{t("bookYourAirportTransfer")} Istanbul</h3>
          <p className="text-muted-foreground mb-4">
            {t("getWhatsAppConfirmation")}
          </p>
          <WhatsAppButton
            variant="large"
            message={t("istanbulWhatsApp")}
          />
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("transferFaqTitle")} Istanbul</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default IstanbulTransfer;
