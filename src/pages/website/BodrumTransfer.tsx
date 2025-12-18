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
import bodrumMeetTransfer from "@/assets/bodrum-meet-transfer.png";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Yalıkavak", "Türkbükü", "Gümüşlük", "Bodrum Center", "Gündoğan",
  "Torba", "Göltürkbükü", "Ortakent", "Bitez", "Gümbet"
];

const prices = [
  { from: "BJV Airport", to: "Bodrum Center", price: "$45" },
  { from: "BJV Airport", to: "Torba", price: "$40" },
  { from: "BJV Airport", to: "Yalıkavak", price: "$60" },
  { from: "BJV Airport", to: "Türkbükü", price: "$60" },
  { from: "BJV Airport", to: "Gündoğan", price: "$65" },
  { from: "BJV Airport", to: "Turgutreis", price: "$60" },
  { from: "BJV Airport", to: "Akyarlar", price: "$70" },
];

const faqItems = [
  {
    question: "What is included in the Bodrum airport transfer price?",
    answer: "Our price includes meet & greet service at the airport, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes.",
  },
  {
    question: "How far is Yalıkavak from Bodrum Airport?",
    answer: "Yalıkavak is approximately 45 km from Bodrum Airport. The transfer takes about 50-60 minutes.",
  },
  {
    question: "Do you provide transfers to Bodrum marinas?",
    answer: "Yes, we provide transfers to all Bodrum marinas including Yalıkavak Marina, D-Marin Turgutreis, and Palmarina.",
  },
  {
    question: "Can I book a transfer to Greek islands from Bodrum?",
    answer: "We can transfer you to the ferry ports in Bodrum and Turgutreis for connections to Greek islands like Kos.",
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

const BodrumTransfer = () => {
  const { t } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoBodrumTitle")}
        description={t("seoBodrumDesc")}
        keywords="Bodrum airport transfer, BJV airport transfer, Yalıkavak transfer, Türkbükü transfer, Gümüşlük transfer, Bodrum VIP transfer, Bodrum private driver, Bodrum marina transfer, Bodrum Peninsula transfer"
        canonicalPath="/bodrum-transfer"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Bodrum', 'Yalıkavak', 'Türkbükü', 'Gümüşlük', 'Gündoğan'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Bodrum Airport Transfer', url: '/bodrum-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Bodrum Airport Transfer Service',
            description: 'Premium VIP airport transfer from Milas-Bodrum Airport (BJV) to all Bodrum Peninsula destinations',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg', 'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg'],
            offers: { price: '40', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title={t("bodrumTransferTitle")}
        subtitle={t("transferSubtitle")}
        backgroundImage="https://images.unsplash.com/photo-1568196555325-8c46f49ed55e?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("bodrumTransferH1")}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {t("bodrumTransferIntro")}
          </p>
        </section>

        <FeatureList />

        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">{t("bodrumCityServiceTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("bodrumCityServiceDesc")}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {t("meetGreetArrival")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {t("doorToDoorAnyLocation")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {t("professionalEnglishDrivers")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {t("flexibleScheduling")}
              </li>
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img 
              src={bodrumMeetTransfer} 
              alt="Meet Transfer VIP service at Bodrum Airport - professional driver greeting passenger with name sign"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("popularTransferDestinations")} Bodrum</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("vipFleetForTransfers")} Bodrum</h2>
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
          <h2 className="text-2xl font-bold mb-4">{t("airportTransferPricesTitle")} Bodrum</h2>
          <PriceTable items={prices} title={t("fixedPriceTransfers")} />
        </section>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">{t("bookYourAirportTransfer")} Bodrum</h3>
          <p className="text-muted-foreground mb-4">
            {t("getWhatsAppConfirmation")}
          </p>
          <WhatsAppButton
            variant="large"
            message={t("bodrumWhatsApp")}
          />
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("transferFaqTitle")} Bodrum</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default BodrumTransfer;
