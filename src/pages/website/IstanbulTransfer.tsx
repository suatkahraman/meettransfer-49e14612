import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRegionPricesPublic, transformToPriceTableFormat } from "@/hooks/useRegionPricesPublic";
import { Skeleton } from "@/components/ui/skeleton";
// Vito VIP images - WebP optimized
import vitoAirportPremium from "@/assets/vehicles/vito-airport-premium.webp";
import vitoLuxuryInterior from "@/assets/vito-luxury-interior.jpg";
import vipVitoStarlightLuxury from "@/assets/vehicles/vip-vito-starlight.webp";
import vitoVip1 from "@/assets/vito-vip-1.jpg";
import vitoVip2 from "@/assets/vito-vip-2.jpg";
import vitoVip3 from "@/assets/vito-vip-3.jpg";
// Vito images
import vito1 from "@/assets/vito-1.jpg";
import vito2 from "@/assets/vito-2.jpg";
import vito3 from "@/assets/vito-3.jpg";
import vito4 from "@/assets/vito-4.jpg";

const destinations = [
  "Taksim", "Sultanahmet", "Galataport", "Kadıköy", "Levent",
  "Şişli", "Beşiktaş", "Nişantaşı", "Maslak", "Bakırköy"
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
    images: [
      { src: vitoAirportPremium, alt: "Mercedes Vito VIP airport transfer Istanbul" },
      { src: vitoLuxuryInterior, alt: "Mercedes Vito VIP luxury interior" },
      { src: vipVitoStarlightLuxury, alt: "Mercedes Vito VIP starlight ceiling" },
      { src: vitoVip1, alt: "Mercedes Vito VIP exterior view" },
      { src: vitoVip2, alt: "Mercedes Vito VIP premium service" },
      { src: vitoVip3, alt: "Mercedes Vito VIP Istanbul transfer" },
    ],
  },
  {
    name: "Mercedes Vito",
    description: "The Mercedes Vito Comfortable family holiday transfer vehicles with best budget.",
    passengers: 7,
    luggage: 7,
    features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
    images: [
      { src: vito1, alt: "Mercedes Vito family transfer Istanbul" },
      { src: vito2, alt: "Mercedes Vito comfortable interior" },
      { src: vito3, alt: "Mercedes Vito airport service" },
      { src: vito4, alt: "Mercedes Vito group transfer" },
    ],
  },
];

const IstanbulTransfer = () => {
  const { t } = useLanguage();
  
  // Fetch prices from database
  const { data: regionPrices, isLoading: isPricesLoading } = useRegionPricesPublic({ 
    city: "Istanbul",
    pickupDate: new Date() 
  });
  
  // Transform to PriceTable format
  const dynamicPrices = regionPrices ? transformToPriceTableFormat(regionPrices, "mercedes-vito") : [];
  
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
          { type: 'TransportationService', areaServed: ['Istanbul', 'Istanbul Airport', 'IST', 'Sabiha Gokcen', 'SAW'] },
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
          {isPricesLoading ? (
            <div className="bg-card rounded-xl p-6 shadow-sm space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : dynamicPrices.length > 0 ? (
            <PriceTable items={dynamicPrices} title={t("fixedPriceTransfers")} />
          ) : (
            <div className="bg-card rounded-xl p-6 shadow-sm text-center">
              <p className="text-muted-foreground">{t("requestPrice")}</p>
              <WhatsAppButton
                variant="small"
                message="Hi, I'd like to request a price for Istanbul airport transfer."
                className="mt-4"
              />
            </div>
          )}
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
