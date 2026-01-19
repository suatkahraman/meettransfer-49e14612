import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { PWAPromoBanner } from "@/components/website/PWAPromoBanner";
import { MapPin, Plane, Snowflake } from "lucide-react";

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

// Switzerland fleet images
import switzerlandSClassExterior from "@/assets/switzerland/switzerland-s-class-exterior.webp";
import switzerlandSClassInterior from "@/assets/switzerland/switzerland-s-class-interior.webp";
import switzerlandVClassExterior from "@/assets/switzerland/switzerland-v-class-exterior.webp";
import switzerlandVClassInterior from "@/assets/switzerland/switzerland-v-class-interior.webp";

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
        { src: dubaiStandardSedan, alt: "Private Standard Sedan Dubai Airport Transfer - DXB to Downtown Dubai luxury chauffeur service with professional driver" },
        { src: dubaiStandardSedanInterior, alt: "Private Sedan interior - premium leather seats Dubai airport pickup and drop-off service" },
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
        { src: dubaiPremiumVan, alt: "Mercedes V-Class Premium Van Dubai Airport Transfer - luxury group transportation to Burj Khalifa Palm Jumeirah" },
        { src: dubaiPremiumVanInterior, alt: "Mercedes V-Class interior - captain leather seats ambient lighting Dubai VIP airport shuttle" },
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
        { src: dubaiSuburban, alt: "Mercedes Suburban SUV Dubai Airport Transfer - premium black SUV chauffeur service to Dubai Marina JBR" },
        { src: dubaiSuburbanInterior, alt: "Mercedes Suburban SUV interior - spacious black leather executive seating Dubai luxury airport transfer" },
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
        { src: dubaiVipSprinter, alt: "VIP Mercedes Sprinter Dubai Airport Transfer - starlight ceiling luxury minibus group transportation Palm Jumeirah" },
        { src: dubaiVipSprinterExterior, alt: "Mercedes VIP Sprinter exterior - professional chauffeur driven airport transfer Dubai International DXB" },
      ],
    },
  ];

  // Switzerland exclusive fleet - luxury vehicles for Swiss Alps ski transfers
  const switzerlandVehicles = [
    {
      name: isTurkish ? "Mercedes S-Class" : "Mercedes S-Class",
      description: isTurkish 
        ? "Lüks sedan seyahatinin zirvesi. İsviçre alp yollarında en yüksek konforu arayan yöneticiler ve VIP misafirler için mükemmel."
        : "The epitome of luxury sedan travel. Perfect for executives and VIP guests seeking the ultimate comfort on Swiss alpine roads.",
      passengers: 3,
      luggage: 3,
      startingPrice: "CHF 450",
      features: ["Climate Control", "Heated Massage Seats", "Burmester Sound", "Ambient Lighting", "Privacy Glass", "Free WiFi"],
      images: [
        { src: switzerlandSClassExterior, alt: "Mercedes S-Class luxury sedan Switzerland airport transfer Zurich Geneva to ski resorts" },
        { src: switzerlandSClassInterior, alt: "Mercedes S-Class interior premium leather Swiss Alps St. Moritz Zermatt transfer" },
      ],
    },
    {
      name: isTurkish ? "Mercedes V-Class" : "Mercedes V-Class",
      description: isTurkish 
        ? "İsviçre kayak merkezlerine tüm ekipmanlarıyla seyahat eden aileler ve kayak grupları için ideal geniş lüks MPV."
        : "Spacious luxury MPV ideal for families and ski groups traveling to Swiss ski resorts with all their equipment.",
      passengers: 7,
      luggage: 7,
      startingPrice: "CHF 450",
      features: ["Dual-Zone Climate", "Leather Captain Seats", "Ski Equipment Storage", "USB Chargers", "Panoramic Roof", "Free WiFi"],
      images: [
        { src: switzerlandVClassExterior, alt: "Mercedes V-Class luxury MPV Swiss ski resort transfer St. Moritz Verbier Gstaad" },
        { src: switzerlandVClassInterior, alt: "Mercedes V-Class interior spacious Swiss Alps group transfer ski families" },
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

        {/* Switzerland Exclusive Fleet Section */}
        <section className="mt-16">
          <div className="relative bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-cyan-500/10 rounded-3xl p-8 md:p-12 border border-sky-500/20 overflow-hidden">
            {/* Decorative elements - snow/mountain theme */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-400/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/15 to-transparent rounded-full blur-2xl" />
            <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl" />
            
            <div className="relative z-10">
              {/* Switzerland Badge */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg">
                  <Snowflake className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase tracking-wider">
                    {isTurkish ? "İsviçre Özel" : "Switzerland Exclusive"}
                  </span>
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-sky-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {isTurkish ? "İsviçre Kayak Merkezi Transferleri" : "Swiss Ski Resort Transfers"}
                </h2>
                <div className="flex items-center justify-center gap-2 text-sky-600 dark:text-sky-400 mb-4">
                  <Plane className="w-5 h-5" />
                  <span className="font-semibold">
                    {isTurkish ? "ZRH • GVA • BSL • MXP Havalimanları" : "ZRH • GVA • BSL • MXP Airports"}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto text-lg">
                  {isTurkish 
                    ? "St. Moritz, Zermatt, Verbier, Gstaad, Davos, Arosa ve Crans-Montana gibi İsviçre'nin en prestijli kayak merkezlerine lüks Mercedes araçlarla konforlu transfer hizmeti."
                    : "Premium Mercedes transfers to Switzerland's most prestigious ski destinations including St. Moritz, Zermatt, Verbier, Gstaad, Davos, Arosa, and Crans-Montana."}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {switzerlandVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.name} {...vehicle} />
                ))}
              </div>

              {/* Switzerland Contact CTA */}
              <div className="mt-10 text-center">
                <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 rounded-xl px-6 py-4">
                  <span className="text-sky-700 dark:text-sky-300 font-medium">
                    {isTurkish 
                      ? "Sabit Fiyat: Tüm araçlar için aynı fiyat • Kayak ekipmanı taşıma dahil"
                      : "Flat Rate Pricing: Same price for all vehicles • Ski equipment transport included"}
                  </span>
                </div>
                <div className="mt-4">
                  <WhatsAppButton
                    variant="large"
                    message={isTurkish 
                      ? "Merhaba, İsviçre kayak merkezi transferi için bilgi almak istiyorum."
                      : "Hello, I'd like to inquire about Switzerland ski resort transfer options."}
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
