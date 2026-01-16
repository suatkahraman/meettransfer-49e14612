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
import dubaiRollsRoyce from "@/assets/dubai-rolls-royce.jpg";
import dubaiBentley from "@/assets/dubai-bentley.jpg";
import dubaiRangeRover from "@/assets/dubai-range-rover.jpg";
import dubaiMercedesSClass from "@/assets/dubai-mercedes-s-class.jpg";

// Legacy images for additional variety
import meetTransferCyprus from "@/assets/meet-transfer-cyprus.png";
import meetTransferDubai from "@/assets/meet-transfer-dubai.png";
import meetTransferPromoBanner from "@/assets/meet-transfer-promo-banner.png";

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

  const dubaiVehicles = [
    {
      name: "Rolls Royce Phantom",
      description: isTurkish 
        ? "Otomotiv lüksünün zirvesi. Rolls Royce Phantom, eşsiz konforu ve prestiji ile Dubai'nin en seçkin misafirleri için ideal tercih."
        : "The pinnacle of automotive luxury. Rolls Royce Phantom offers unmatched comfort and prestige for Dubai's most distinguished guests.",
      passengers: 3,
      luggage: 3,
      startingPrice: "$350",
      features: ["Starlight headliner", "Massage seats", "Champagne cooler", "Bespoke audio", "Privacy partition", "Umbrellas"],
      images: [
        { src: dubaiRollsRoyce, alt: "Rolls Royce Phantom luxury VIP transfer Dubai" },
        { src: meetTransferDubai, alt: "Meet Transfer Rolls Royce service Dubai" },
      ],
    },
    {
      name: "Bentley Flying Spur",
      description: isTurkish 
        ? "İngiliz zanaatkarlığının şaheseri. Bentley Flying Spur, güç ve zarafeti mükemmel bir uyum içinde sunar."
        : "A masterpiece of British craftsmanship. Bentley Flying Spur delivers power and elegance in perfect harmony.",
      passengers: 3,
      luggage: 3,
      startingPrice: "$280",
      features: ["Diamond quilted leather", "Rotating display", "Naim audio", "Mood lighting", "Rear entertainment", "WiFi"],
      images: [
        { src: dubaiBentley, alt: "Bentley Flying Spur luxury airport transfer Dubai" },
        { src: meetTransferDubai, alt: "Meet Transfer Bentley service Dubai Marina" },
      ],
    },
    {
      name: "Range Rover Autobiography",
      description: isTurkish 
        ? "Lüks SUV segmentinin tartışmasız lideri. Range Rover Autobiography, konfor ve performansı bir arada sunar."
        : "The undisputed leader in luxury SUV segment. Range Rover Autobiography combines comfort and performance seamlessly.",
      passengers: 4,
      luggage: 4,
      startingPrice: "$220",
      features: ["Executive class seats", "Panoramic roof", "Meridian audio", "Climate seats", "Terrain response", "Air suspension"],
      images: [
        { src: dubaiRangeRover, alt: "Range Rover Autobiography VIP transfer Dubai" },
        { src: meetTransferDubai, alt: "Meet Transfer Range Rover desert safari Dubai" },
      ],
    },
    {
      name: "Mercedes S-Class S580",
      description: isTurkish 
        ? "Teknoloji ve lüksün mükemmel buluşması. Mercedes S-Class, iş dünyasının en çok tercih ettiği sedan."
        : "The perfect fusion of technology and luxury. Mercedes S-Class is the most preferred sedan for business executives.",
      passengers: 3,
      luggage: 3,
      startingPrice: "$180",
      features: ["MBUX system", "Energizing comfort", "Burmester audio", "Executive rear seats", "Ambient lighting", "Night vision"],
      images: [
        { src: dubaiMercedesSClass, alt: "Mercedes S-Class S580 airport transfer Dubai" },
        { src: meetTransferDubai, alt: "Meet Transfer Mercedes S-Class Dubai" },
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
                  {isTurkish ? "Dubai Özel Lüks Filo" : "Dubai Exclusive Luxury Fleet"}
                </h2>
                <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-4">
                  <Plane className="w-5 h-5" />
                  <span className="font-semibold">
                    {isTurkish ? "Sadece Dubai Havalimanı Transferleri" : "Dubai Airport Transfers Only"}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto text-lg">
                  {isTurkish 
                    ? "Bu özel lüks araç koleksiyonu sadece Dubai Uluslararası Havalimanı (DXB) ve Al Maktoum Havalimanı (DWC) transferleri için geçerlidir. Rolls Royce, Bentley, Range Rover ve Mercedes S-Class ile Dubai'de unutulmaz bir VIP deneyimi yaşayın."
                    : "This exclusive luxury vehicle collection is available only for Dubai International Airport (DXB) and Al Maktoum Airport (DWC) transfers. Experience an unforgettable VIP journey in Dubai with Rolls Royce, Bentley, Range Rover and Mercedes S-Class."}
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
                    {isTurkish 
                      ? "Dubai transferi için özel fiyat teklifi alın" 
                      : "Get a custom quote for Dubai transfers"}
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
