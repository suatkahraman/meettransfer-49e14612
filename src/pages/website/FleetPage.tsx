import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { PWAPromoBanner } from "@/components/website/PWAPromoBanner";
// Vehicle images - only landscape orientation
import vitoAirportAnime from "@/assets/vito-airport-anime.jpg";
import vitoAirportWelcome from "@/assets/vito-airport-welcome.jpg";
import vitoCappadociaBalloon from "@/assets/vito-cappadocia-balloon.jpg";
import vitoFamilyInterior from "@/assets/vito-family-interior.jpg";
import vitoInteriorLeather from "@/assets/vito-interior-leather.jpg";
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";
import vitoPassengerOrange from "@/assets/vito-passenger-orange.jpg";
import vitoExteriorOpendoor from "@/assets/vito-exterior-opendoor.jpg";
import vitoPassengerNight from "@/assets/vito-passenger-night.jpg";
import vitoPassengerCouple from "@/assets/vito-passenger-couple.jpg";
import vitoVipPassengers1 from "@/assets/vito-vip-passengers-1.jpg";
import vitoVipPassengers2 from "@/assets/vito-vip-passengers-2.jpg";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";
import vitoVipStarlightRoof from "@/assets/vito-vip-starlight-roof.jpg";
import vitoVipLuxuryWhite from "@/assets/vito-vip-luxury-white.jpg";
import vitoVipCoupleStarlight from "@/assets/vito-vip-couple-starlight.jpg";
import vitoVipPassengersDay from "@/assets/vito-vip-passengers-day.jpg";
import maybachInterior from "@/assets/maybach-interior-starlight.jpg";
import maybachPassengersBlue from "@/assets/maybach-passengers-blue.jpg";
import maybachInteriorPurple from "@/assets/maybach-interior-purple.jpg";
import maybachInteriorOrange from "@/assets/maybach-interior-orange.jpg";
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
import meetTransferPromoBanner from "@/assets/meet-transfer-promo-banner.png";

const FleetPage = () => {
  const { t } = useLanguage();

  const vehicles = [
    {
      name: t("vitoVipName"),
      description: t("vitoVipDesc"),
      passengers: 5,
      luggage: 5,
      features: ["Leather seats", "Individual climate control", "WiFi", "USB chargers", "Complimentary water", "Tinted windows"],
      images: [
        { src: meetTransferPromoBanner, alt: "Meet Transfer Premier VIP Airport Transfer - All Major Airports" },
        { src: vitoVipStarlightPurple, alt: "Mercedes VIP Vito purple starlight roof interior" },
        { src: meetTransferDubai, alt: "Meet Transfer VIP service in Dubai UAE" },
        { src: vitoVipStarlightRoof, alt: "Mercedes VIP Vito starlight ceiling ambient lighting" },
        { src: vitoVipPassengers1, alt: "VIP passengers enjoying Mercedes Vito luxury transfer" },
        { src: vitoVipLuxuryWhite, alt: "Mercedes VIP Vito white leather luxury interior" },
        { src: meetTransferCyprus, alt: "Meet Transfer VIP chauffeur service Cyprus" },
        { src: vitoVipCoupleStarlight, alt: "Couple enjoying Mercedes VIP Vito starlight transfer" },
        { src: vitoVipPassengers2, alt: "Business travelers in Mercedes VIP Vito" },
        { src: vitoVipPassengersDay, alt: "Mercedes VIP Vito daytime luxury transfer service" },
      ],
    },
    {
      name: t("vitoName"),
      description: t("vitoDesc"),
      passengers: 6,
      luggage: 6,
      features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
      images: [
        { src: meetTransferPromoBanner, alt: "Meet Transfer Premier VIP Airport Transfer - All Major Airports" },
        { src: vitoAirportAnime, alt: "Mercedes Vito private transfer at airport terminal" },
        { src: vitoAirportWelcome, alt: "Mercedes Vito airport pickup with welcome service" },
        { src: meetTransferCyprus, alt: "Meet Transfer VIP service in Cyprus" },
        { src: vitoCappadociaBalloon, alt: "Mercedes Vito transfer to Cappadocia hot air balloons" },
        { src: vitoFamilyInterior, alt: "Mercedes Vito spacious family interior with leather seats" },
        { src: vitoInteriorLeather, alt: "Mercedes Vito premium leather interior detail" },
        { src: meetTransferDubai, alt: "Meet Transfer luxury service in Dubai" },
        { src: vitoExteriorBlack, alt: "Mercedes Vito black exterior professional transfer" },
        { src: vitoPassengerOrange, alt: "Mercedes Vito passengers enjoying comfortable ride" },
        { src: vitoExteriorOpendoor, alt: "Mercedes Vito with open door welcoming passengers" },
        { src: vitoPassengerNight, alt: "Mercedes Vito night transfer service with ambient lighting" },
        { src: vitoPassengerCouple, alt: "Mercedes Vito romantic transfer for couples" },
      ],
    },
    {
      name: t("maybachName"),
      description: t("maybachDesc"),
      passengers: 4,
      luggage: 4,
      features: ["Leather seats", "Rear entertainment", "Ambient lighting", "Mini bar", "Star ceiling", "TV"],
      images: [
        { src: meetTransferPromoBanner, alt: "Meet Transfer Premier VIP Airport Transfer - All Major Airports" },
        { src: meetTransferDubai, alt: "Meet Transfer Maybach luxury service Dubai" },
        { src: maybachInterior, alt: "Mercedes Maybach starlight ceiling luxury interior" },
        { src: maybachPassengersBlue, alt: "VIP passengers in Mercedes Maybach blue ambient lighting" },
        { src: meetTransferCyprus, alt: "Meet Transfer Maybach service in Cyprus" },
        { src: maybachInteriorPurple, alt: "Mercedes Maybach purple starlight ceiling with TV entertainment" },
        { src: maybachInteriorOrange, alt: "Mercedes Maybach orange leather interior with starlight roof" },
      ],
    },
    {
      name: t("sprinterName"),
      description: t("sprinterDesc"),
      passengers: 16,
      luggage: 16,
      features: ["Leather Seats", "Large luggage space", "WiFi", "USB"],
      images: [
        { src: meetTransferPromoBanner, alt: "Meet Transfer Premier VIP Airport Transfer - All Major Airports" },
        { src: sprinterExteriorVip, alt: "Mercedes Sprinter VIP exterior luxury design" },
        { src: sprinterInteriorGrey, alt: "Mercedes Sprinter grey leather interior design" },
        { src: meetTransferDubai, alt: "Meet Transfer Sprinter minibus Dubai" },
        { src: sprinterInteriorTv, alt: "Mercedes Sprinter entertainment TV system" },
        { src: sprinterLuggage, alt: "Mercedes Sprinter large luggage capacity for groups" },
        { src: sprinterInteriorRed, alt: "Mercedes Sprinter red ambient lighting interior" },
        { src: sprinterInteriorStarlight, alt: "Mercedes Sprinter starlight ceiling luxury" },
        { src: meetTransferCyprus, alt: "Meet Transfer Sprinter minibus Cyprus" },
        { src: sprinterInteriorBlue, alt: "Mercedes Sprinter blue LED interior lighting" },
        { src: sprinterExteriorDark, alt: "Mercedes Sprinter black exterior professional service" },
        { src: sprinterAirportFront, alt: "Mercedes Sprinter airport transfer front view" },
        { src: sprinterInteriorNeon, alt: "Mercedes Sprinter neon interior party atmosphere" },
        { src: sprinterAirportNight, alt: "Mercedes Sprinter night airport transfer service" },
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