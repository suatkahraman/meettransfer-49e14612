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
// Premium images - WebP optimized
import vitoAirportPremium from "@/assets/vehicles/vito-airport-premium.webp";
import vitoLuxuryInterior from "@/assets/vito-luxury-interior.jpg";
import vipVitoStarlightLuxury from "@/assets/vehicles/vip-vito-starlight.webp";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";

const destinations = [
  "Göreme", "Ürgüp", "Uçhisar", "Avanos", "Ortahisar",
  "Nevşehir", "Kayseri", "Mustafapaşa", "Çavuşin", "Zelve"
];

const prices = [
  { from: "NAV Airport", to: "Göreme", price: "Request Price" },
  { from: "NAV Airport", to: "Ürgüp", price: "Request Price" },
  { from: "NAV Airport", to: "Avanos", price: "Request Price" },
  { from: "NAV Airport", to: "Uçhisar", price: "Request Price" },
  { from: "ASR Airport", to: "Göreme", price: "Request Price" },
  { from: "ASR Airport", to: "Ürgüp", price: "Request Price" },
  { from: "ASR Airport", to: "Avanos", price: "Request Price" },
  { from: "ASR Airport", to: "Uçhisar", price: "Request Price" },
];

const faqItems = [
  {
    question: "Which airport should I fly into for Cappadocia?",
    answer: "Nevşehir Airport (NAV) is closer to Göreme (30 min), while Kayseri Airport (ASR) has more flight options but is further (1 hour 15 min).",
  },
  {
    question: "Can you arrange early morning balloon flight transfers in Cappadocia?",
    answer: "Yes, we provide early morning transfers (4-5 AM) to hot air balloon departure points. Book your return transfer too!",
  },
  {
    question: "Do you offer day tours in Cappadocia?",
    answer: "We can arrange full-day tours to explore the fairy chimneys, underground cities, and valleys with private driver and guide.",
  },
  {
    question: "Is the Cappadocia transfer available 24/7?",
    answer: "Yes, we operate 24/7 and can accommodate any flight arrival time, including late-night arrivals.",
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
      { src: vipVitoStarlightLuxury, alt: "Mercedes VIP Vito couple champagne starlight ceiling luxury Cappadocia" },
      { src: vitoVipStarlightPurple, alt: "Mercedes VIP Vito purple starlight roof interior Cappadocia" },
    ],
  },
  {
    name: "Mercedes Vito",
    description: "The Mercedes Vito Comfortable family holiday transfer vehicles with best budget.",
    passengers: 7,
    luggage: 7,
    features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
    images: [
      { src: vitoAirportPremium, alt: "Mercedes Vito VIP airport transfer Cappadocia with chauffeur" },
      { src: vitoLuxuryInterior, alt: "Mercedes Vito luxury interior passengers Cappadocia transfer" },
    ],
  },
];

const CappadociaTransfer = () => {
  const { t } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoCappadociaTitle")}
        description={t("seoCappadociaDesc")}
        keywords="Cappadocia airport transfer, Nevşehir airport transfer, Kayseri airport transfer, Göreme transfer, Ürgüp transfer, Cappadocia VIP transfer, Cappadocia private driver, balloon flight transfer, cave hotel transfer"
        canonicalPath="/cappadocia-transfer"
        ogImage="https://meettransfer.app/images/meet-transfer-vclass-interior.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Cappadocia', 'Göreme', 'Ürgüp', 'Uçhisar', 'Nevşehir', 'Kayseri'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Cappadocia Airport Transfer', url: '/cappadocia-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          { type: 'TransportationService', areaServed: ['Cappadocia', 'Nevsehir Airport', 'NAV', 'Kayseri Airport', 'ASR'] },
        ]}
      />

      <PageHeader
        title={t("cappadociaTransferTitle")}
        subtitle={t("transferSubtitle")}
        backgroundImage="https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("cappadociaTransferH1")}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {t("cappadociaTransferIntro")}
          </p>
        </section>

        <FeatureList />

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("popularTransferDestinations")} Cappadocia</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("vipFleetForTransfers")} Cappadocia</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("airportTransferPricesTitle")} Cappadocia</h2>
          <PriceTable items={prices} title={t("fixedPriceTransfers")} />
        </section>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">{t("bookYourAirportTransfer")} Cappadocia</h3>
          <p className="text-muted-foreground mb-4">
            {t("getWhatsAppConfirmation")}
          </p>
          <WhatsAppButton
            variant="large"
            message={t("cappadociaWhatsApp")}
          />
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("transferFaqTitle")} Cappadocia</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default CappadociaTransfer;
