import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { PWAPromoBanner } from "@/components/website/PWAPromoBanner";
import vitoVip1 from "@/assets/vito-vip-1.jpg";
import vito2 from "@/assets/vito-2.jpg";
import vito3 from "@/assets/vito-3.jpg";
import vito4 from "@/assets/vito-4.jpg";
import vito5 from "@/assets/vito-5.jpg";
import vito6 from "@/assets/vito-6.jpg";
import vitoVip2 from "@/assets/vito-vip-2.jpg";
import vitoVip3 from "@/assets/vito-vip-3.jpg";
import vitoVip4 from "@/assets/vito-vip-4.jpg";
import vitoVip5 from "@/assets/vito-vip-5.jpg";
import vitoVipPassengers1 from "@/assets/vito-vip-passengers-1.jpg";
import vitoVipPassengers2 from "@/assets/vito-vip-passengers-2.jpg";
import maybach1 from "@/assets/maybach-1.jpg";
import maybach2 from "@/assets/maybach-2.jpg";
import maybach3 from "@/assets/maybach-3.jpg";
import maybach4 from "@/assets/maybach-4.jpg";
import maybach5 from "@/assets/maybach-5.jpg";
import maybach6 from "@/assets/maybach-6.jpg";
import maybachInterior from "@/assets/maybach-interior-starlight.jpg";
import sprinter1 from "@/assets/sprinter-1.jpg";
import sprinter2 from "@/assets/sprinter-2.jpg";
import sprinter3 from "@/assets/sprinter-3.jpg";
import sprinter4 from "@/assets/sprinter-4.jpg";
import sprinter5 from "@/assets/sprinter-5.jpg";
import sprinter6 from "@/assets/sprinter-6.jpg";
import sprinterLuggage from "@/assets/sprinter-luggage.jpg";
import sprinterExteriorVip from "@/assets/sprinter-exterior-vip.jpg";
import sprinterAirportFront from "@/assets/sprinter-airport-front.jpg";
import sprinterInteriorGrey from "@/assets/sprinter-interior-grey.jpg";
import sprinterInteriorTv from "@/assets/sprinter-interior-tv.jpg";
import sprinterInteriorRed from "@/assets/sprinter-interior-red.jpg";
import sprinterInteriorStarlight from "@/assets/sprinter-interior-starlight.jpg";
import sprinterInteriorBlue from "@/assets/sprinter-interior-blue.jpg";
import sprinterExteriorDark from "@/assets/sprinter-exterior-dark.jpg";
import sprinterInteriorNeon from "@/assets/sprinter-interior-neon.jpg";
import sprinterAirportNight from "@/assets/sprinter-airport-night.jpg";
import meetTransferCyprus from "@/assets/meet-transfer-cyprus.png";
import meetTransferDubai from "@/assets/meet-transfer-dubai.png";

const FleetPage = () => {
  const { t } = useLanguage();

  const vehicles = [
    {
      name: t("vitoVipName"),
      description: t("vitoVipDesc"),
      passengers: 6,
      luggage: 6,
      features: ["Leather seats", "Individual climate control", "WiFi", "USB chargers", "Complimentary water", "Tinted windows"],
      images: [vitoVip1, meetTransferDubai, vitoVip2, vitoVipPassengers1, vitoVip3, meetTransferCyprus, vitoVip4, vitoVipPassengers2, vitoVip5],
    },
    {
      name: t("vitoName"),
      description: t("vitoDesc"),
      passengers: 7,
      luggage: 7,
      features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
      images: [vito2, meetTransferCyprus, vito3, vito4, meetTransferDubai, vito5, vito6],
    },
    {
      name: t("maybachName"),
      description: t("maybachDesc"),
      passengers: 4,
      luggage: 4,
      features: ["Leather seats", "Rear entertainment", "Ambient lighting", "Mini bar", "Star ceiling", "TV"],
      images: [maybach1, meetTransferDubai, maybach2, maybachInterior, maybach3, meetTransferCyprus, maybach4, maybach5, maybach6],
    },
    {
      name: t("sprinterName"),
      description: t("sprinterDesc"),
      passengers: 16,
      luggage: 16,
      features: ["Leather Seats", "Large luggage space", "WiFi", "USB"],
      images: [sprinter1, sprinterExteriorVip, sprinter2, sprinterInteriorGrey, meetTransferDubai, sprinter3, sprinterInteriorTv, sprinterLuggage, sprinterInteriorRed, sprinter4, sprinterInteriorStarlight, meetTransferCyprus, sprinterInteriorBlue, sprinter5, sprinterExteriorDark, sprinterAirportFront, sprinterInteriorNeon, sprinterAirportNight, sprinter6],
    },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoFleetTitle")}
        description={t("seoFleetDesc")}
        keywords="Mercedes VIP transfer, luxury transfer fleet, Mercedes Vito transfer, Mercedes Maybach chauffeur, VIP minibus Turkey, airport transfer vehicles, Mercedes V-Class transfer"
        canonicalPath="/fleet"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul', 'Antalya', 'Bodrum', 'Dalaman', 'Izmir', 'Cappadocia'] },
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