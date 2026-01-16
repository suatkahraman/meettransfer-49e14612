import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { PWAPromoBanner } from "@/components/website/PWAPromoBanner";
import { MapPin, Plane } from "lucide-react";

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

// Dubai exclusive fleet images
import dubaiStandardSedan from "@/assets/dubai/dubai-standard-sedan.jpg";
import dubaiStandardSedanInterior from "@/assets/dubai/dubai-standard-sedan-interior.jpg";
import dubaiPremiumVan from "@/assets/dubai/dubai-v-class.jpg";
import dubaiPremiumVanInterior from "@/assets/dubai/dubai-v-class-interior.jpg";
import dubaiSuburban from "@/assets/dubai/dubai-suburban.jpg";
import dubaiSuburbanInterior from "@/assets/dubai/dubai-suburban-interior.jpg";
import dubaiVipSprinter from "@/assets/dubai/dubai-vip-mercedes-van.jpg";
import dubaiVipSprinterExterior from "@/assets/dubai/dubai-vip-van-exterior.jpg";

const FleetPage = () => {
  const { t, language } = useLanguage();
  const isTurkish = language === 'TR';

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
      ],
    },
  ];

  const dubaiVehicles = [
    {
      name: t("dubaiSedanName"),
      description: t("dubaiSedanDesc"),
      passengers: 3,
      luggage: 2,
      startingPrice: "$80",
      features: ["Climate Control", "Premium Leather", "Free WiFi", "USB Charging", "Bottled Water"],
      images: [
        { src: dubaiStandardSedan, alt: "Standard sedan Toyota Camry Dubai airport transfer" },
        { src: dubaiStandardSedanInterior, alt: "Standard sedan clean interior Dubai transfer service" },
      ],
    },
    {
      name: t("dubaiPremiumVanName"),
      description: t("dubaiPremiumVanDesc"),
      passengers: 6,
      luggage: 6,
      startingPrice: "$150",
      features: ["Dual-Zone Climate", "Leather Captain Seats", "High-Speed WiFi", "USB Charging", "Extra Luggage Space", "Refreshments"],
      images: [
        { src: dubaiPremiumVan, alt: "Mercedes Premium Van luxury Dubai airport transfer with Burj Al Arab" },
        { src: dubaiPremiumVanInterior, alt: "Mercedes Premium Van leather interior with ambient lighting" },
      ],
    },
    {
      name: t("dubaiSuburbanName"),
      description: t("dubaiSuburbanDesc"),
      passengers: 6,
      luggage: 6,
      startingPrice: "$180",
      features: ["Dual-Zone Climate", "Leather Captain Seats", "High-Speed WiFi", "USB Charging", "Extra Luggage Space", "Refreshments"],
      images: [
        { src: dubaiSuburban, alt: "Mercedes Suburban SUV luxury Dubai airport transfer with Burj Al Arab" },
        { src: dubaiSuburbanInterior, alt: "Mercedes Suburban premium black leather interior with ambient lighting" },
      ],
    },
    {
      name: t("dubaiVipSprinterName"),
      description: t("dubaiVipSprinterDesc"),
      passengers: 12,
      luggage: 12,
      startingPrice: "$350",
      features: ["Climate Control", "VIP Leather Seats", "Starlight Ceiling", "Premium WiFi", "Wireless Charging", "Ambient Lighting", "VIP Refreshments"],
      images: [
        { src: dubaiVipSprinter, alt: "VIP Mercedes Sprinter starlight ceiling Dubai Marina skyline" },
        { src: dubaiVipSprinterExterior, alt: "Mercedes VIP Sprinter exterior Dubai airport professional chauffeur" },
      ],
    },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoFleetTitle")}
        description={t("seoFleetDesc")}
        keywords="Mercedes VIP transfer, luxury transfer fleet, Mercedes Vito transfer, Mercedes Maybach chauffeur, VIP minibus Turkey, airport transfer vehicles, Mercedes V-Class transfer, Dubai airport transfer, Rolls Royce Dubai, Bentley chauffeur Dubai"
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

        {/* Dubai Exclusive Fleet Section */}
        <section className="mt-16">
          <div className="relative bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 rounded-3xl p-8 md:p-12 border border-amber-500/20 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-yellow-400/15 to-transparent rounded-full blur-2xl" />
            
            <div className="relative z-10">
              {/* Dubai Badge */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-full shadow-lg">
                  <MapPin className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase tracking-wider">Dubai Exclusive</span>
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  {t("dubaiFleetTitle")}
                </h2>
                <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-4">
                  <Plane className="w-5 h-5" />
                  <span className="font-semibold">
                    {t("dubaiFleetSubtitle")}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto text-lg">
                  {t("dubaiFleetDesc")}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {dubaiVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.name} {...vehicle} />
                ))}
              </div>

              {/* Dubai Contact CTA */}
              <div className="mt-10 text-center">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-6 py-4">
                  <span className="text-amber-700 dark:text-amber-300 font-medium">
                    {t("dubaiFleetCta")}
                  </span>
                </div>
                <div className="mt-4">
                  <WhatsAppButton
                    variant="large"
                    message={isTurkish 
                      ? "Merhaba, Dubai havalimanı transferi için lüks araç hakkında bilgi almak istiyorum."
                      : "Hello, I'd like to inquire about luxury vehicle options for Dubai airport transfer."}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

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
