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
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Göreme", "Ürgüp", "Uçhisar", "Avanos", "Ortahisar",
  "Nevşehir", "Kayseri", "Mustafapaşa", "Çavuşin", "Zelve"
];

const prices = [
  { from: "NAV Airport", to: "Göreme", price: "$40" },
  { from: "NAV Airport", to: "Ürgüp", price: "$45" },
  { from: "NAV Airport", to: "Avanos", price: "$40" },
  { from: "NAV Airport", to: "Uçhisar", price: "$40" },
  { from: "ASR Airport", to: "Göreme", price: "$55" },
  { from: "ASR Airport", to: "Ürgüp", price: "$60" },
  { from: "ASR Airport", to: "Avanos", price: "$55" },
  { from: "ASR Airport", to: "Uçhisar", price: "$55" },
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

const CappadociaTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Cappadocia Airport Transfer - VIP Private Chauffeur Service | Meet Transfer"
        description="Premium Cappadocia airport transfer service from Nevşehir and Kayseri airports to Göreme, Ürgüp, Uçhisar. VIP meet & greet, Mercedes fleet. Book your private Cappadocia transfer!"
        keywords="Cappadocia airport transfer, Nevşehir airport transfer, Kayseri airport transfer, Göreme transfer, Ürgüp transfer, Cappadocia VIP transfer, Cappadocia private driver, balloon flight transfer, cave hotel transfer"
        canonicalPath="/cappadocia-transfer"
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
          {
            type: 'Product',
            name: 'Cappadocia Airport Transfer Service',
            description: 'Premium VIP airport transfer from Nevşehir (NAV) and Kayseri (ASR) airports to Cappadocia cave hotels',
            offers: { price: '40', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title="Cappadocia Airport Transfer – VIP Chauffeur Service"
        subtitle="Mercedes Vito, V-Class, Maybach | 24/7 Meet & Greet Service"
        backgroundImage="https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Private Airport Transfer in Cappadocia
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Experience the magic of <strong>Cappadocia</strong> with Meet Transfer. We provide
            premium <strong>Cappadocia airport transfers</strong> from both <strong>Nevşehir Airport (NAV)</strong> and <strong>Kayseri
            Airport (ASR)</strong> to all cave hotels and destinations in the region
            including <strong>Göreme, Ürgüp, and Uçhisar</strong>. Our drivers are familiar with
            every fairy chimney and can assist with <strong>balloon flight schedules</strong>.
            Start your Cappadocia adventure in comfort and style with our <strong>VIP transfer service</strong>.
          </p>
        </section>

        <FeatureList />

        <section>
          <h2 className="text-2xl font-bold mb-4">Popular Cappadocia Transfer Destinations</h2>
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
          <h2 className="text-2xl font-bold mb-4">VIP Fleet for Cappadocia Transfers</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.name} {...vehicle} />
            ))}
          </div>
          <Link to="/fleet" className="inline-block mt-4">
            <Button variant="outline" className="gap-2">
              View All Vehicles <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Cappadocia Airport Transfer Prices</h2>
          <PriceTable items={prices} title="Fixed Price Transfers" />
        </section>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Book Your Cappadocia Airport Transfer</h3>
          <p className="text-muted-foreground mb-4">
            Get instant confirmation via WhatsApp for your Cappadocia transfer
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer in Cappadocia."
          />
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-4">Cappadocia Transfer FAQ</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default CappadociaTransfer;
