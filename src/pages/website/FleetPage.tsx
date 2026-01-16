import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { PWAPromoBanner } from "@/components/website/PWAPromoBanner";

// Optimized WebP fleet images
import vitoVipPremium from "@/assets/fleet/vito-vip-premium.webp";
import vitoVipInterior from "@/assets/fleet/vito-vip-interior.webp";
import vitoAirport from "@/assets/fleet/vito-airport.webp";
import vitoFamily from "@/assets/fleet/vito-family.webp";
import sprinterExterior from "@/assets/fleet/sprinter-exterior.webp";
import sprinterInterior from "@/assets/fleet/sprinter-interior.webp";

// Maybach Minivan ultra luxury images
import maybachMinivan1 from "@/assets/maybach-minivan-1.jpg";
import maybachMinivan2 from "@/assets/maybach-minivan-2.jpg";
import maybachMinivan3 from "@/assets/maybach-minivan-3.jpg";

// Legacy images for additional variety
import meetTransferCyprus from "@/assets/meet-transfer-cyprus.png";
import meetTransferDubai from "@/assets/meet-transfer-dubai.png";
import meetTransferPromoBanner from "@/assets/meet-transfer-promo-banner.png";

const FleetPage = () => {
  const { t } = useLanguage();

  const vehicles = [
    {
      name: t("vitoVipName"),
      description: t("vitoVipDesc"),
      passengers: 5,
      luggage: 5,
      startingPrice: "€60",
      features: ["Leather seats", "Individual climate control", "WiFi", "USB chargers", "Complimentary water", "Tinted windows"],
      images: [
        { src: vitoVipPremium, alt: "Mercedes VIP Vito starlight ceiling luxury airport transfer" },
        { src: vitoVipInterior, alt: "Mercedes VIP Vito purple starlight interior with champagne" },
        { src: meetTransferPromoBanner, alt: "Meet Transfer Premier VIP Airport Transfer - All Major Airports" },
        { src: meetTransferDubai, alt: "Meet Transfer VIP service in Dubai UAE" },
        { src: meetTransferCyprus, alt: "Meet Transfer VIP chauffeur service Cyprus" },
      ],
    },
    {
      name: t("vitoName"),
      description: t("vitoDesc"),
      passengers: 6,
      luggage: 6,
      startingPrice: "€50",
      features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
      images: [
        { src: vitoAirport, alt: "Mercedes Vito airport transfer with professional chauffeur" },
        { src: vitoFamily, alt: "Mercedes Vito family interior with happy passengers" },
        { src: meetTransferPromoBanner, alt: "Meet Transfer Premier VIP Airport Transfer - All Major Airports" },
        { src: meetTransferCyprus, alt: "Meet Transfer VIP service in Cyprus" },
        { src: meetTransferDubai, alt: "Meet Transfer luxury service in Dubai" },
      ],
    },
    {
      name: t("maybachName"),
      description: t("maybachDesc"),
      passengers: 4,
      luggage: 4,
      startingPrice: "€150",
      features: ["Leather seats", "Rear entertainment", "Ambient lighting", "Mini bar", "Star ceiling", "TV"],
      images: [
        { src: maybachMinivan1, alt: "Mercedes Maybach Minivan ultra luxury exterior VIP transfer" },
        { src: maybachMinivan2, alt: "Mercedes Maybach Minivan premium cream leather interior with champagne" },
        { src: maybachMinivan3, alt: "Mercedes Maybach Minivan elegant black side profile executive shuttle" },
        { src: meetTransferPromoBanner, alt: "Meet Transfer Premier VIP Airport Transfer - All Major Airports" },
        { src: meetTransferDubai, alt: "Meet Transfer Maybach Minivan luxury service Dubai" },
      ],
    },
    {
      name: t("sprinterName"),
      description: t("sprinterDesc"),
      passengers: 16,
      luggage: 16,
      startingPrice: "€80",
      features: ["Leather Seats", "Large luggage space", "WiFi", "USB"],
      images: [
        { src: sprinterExterior, alt: "Mercedes Sprinter VIP minibus at airport terminal" },
        { src: sprinterInterior, alt: "Mercedes Sprinter VIP blue starlight interior with TV" },
        { src: meetTransferPromoBanner, alt: "Meet Transfer Premier VIP Airport Transfer - All Major Airports" },
        { src: meetTransferDubai, alt: "Meet Transfer Sprinter minibus Dubai" },
        { src: meetTransferCyprus, alt: "Meet Transfer Sprinter minibus Cyprus" },
      ],
    },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoFleetTitle")}
        description={t("seoFleetDesc")}
        keywords="Mercedes VIP transfer, luxury transfer fleet, Mercedes Vito transfer, Mercedes Maybach chauffeur, VIP minibus Turkey, airport transfer vehicles, Mercedes V-Class transfer"
        canonicalPath="/fleet"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul', 'Antalya', 'Bodrum', 'Dalaman', 'Izmir', 'Cappadocia', 'Dubai', 'Cyprus', 'Bursa'] },
          { type: 'LocalBusiness' },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Our Fleet', url: '/fleet' },
            ],
          },
          {
            type: 'Product',
            name: 'Mercedes VIP Transfer Fleet',
            description: 'Premium Mercedes vehicles for luxury airport transfers including Vito VIP, V-Class, Maybach, and Sprinter Minibus',
          },
        ]}
      />

      <PageHeader
        title={t("fleetTitle")}
        subtitle={t("fleetSubtitle")}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("fleetMainTitle")}
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto text-lg">
            {t("fleetIntro")}
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.name} {...vehicle} />
          ))}
        </div>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">{t("needHelp")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("contactForHelp")}
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I need help choosing the right vehicle for my transfer."
          />
        </div>

        {/* PWA Install Banner */}
        <PWAPromoBanner />
      </div>
    </WebsiteLayout>
  );
};

export default FleetPage;
