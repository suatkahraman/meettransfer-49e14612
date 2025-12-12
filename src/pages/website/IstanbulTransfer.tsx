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
import mercedesVipImage from "@/assets/mercedes-vip-transfer.jpg";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.jpg";

const destinations = [
  "Taksim", "Sultanahmet", "Galataport", "Kadıköy", "Levent",
  "Şişli", "Beşiktaş", "Nişantaşı", "Maslak", "Bakırköy"
];

const prices = [
  { from: "IST Airport", to: "Taksim", price: "$45" },
  { from: "IST Airport", to: "Sultanahmet", price: "$45" },
  { from: "IST Airport", to: "Beşiktaş", price: "$45" },
  { from: "IST Airport", to: "Levent", price: "$45" },
  { from: "IST Airport", to: "Kadıköy", price: "$60" },
  { from: "IST Airport", to: "Üsküdar", price: "$60" },
  { from: "IST Airport", to: "Galataport", price: "$50" },
  { from: "SAW Airport", to: "Taksim", price: "$60" },
  { from: "SAW Airport", to: "Sultanahmet", price: "$55" },
  { from: "SAW Airport", to: "Beşiktaş", price: "$55" },
  { from: "SAW Airport", to: "Kadıköy", price: "$35" },
  { from: "SAW Airport", to: "Üsküdar", price: "$40" },
  { from: "SAW Airport", to: "Galataport", price: "$60" },
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

const IstanbulTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Istanbul Airport Transfer - VIP Private Chauffeur Service | Meet Transfer"
        description="Premium Istanbul airport transfer service from IST and Sabiha Gökçen Airport. VIP meet & greet, Mercedes fleet, fixed prices. Book your private Istanbul transfer today!"
        keywords="Istanbul airport transfer, IST airport transfer, Sabiha Gökçen transfer, Istanbul private driver, Istanbul VIP transfer, Istanbul chauffeur service, Taksim airport transfer, Sultanahmet airport transfer"
        canonicalPath="/istanbul-transfer"
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
          {
            type: 'Product',
            name: 'Istanbul Airport Transfer Service',
            description: 'Premium VIP airport transfer from Istanbul Airport (IST) and Sabiha Gökçen Airport (SAW)',
            offers: { price: '45', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title="Istanbul Airport Transfer – VIP Chauffeur Service"
        subtitle="Mercedes Vito, V-Class, Maybach | 24/7 Meet & Greet Service"
        backgroundImage="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Main H1 for SEO */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Private Airport Transfer in Istanbul
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Experience seamless <strong>Istanbul airport transfers</strong> with Meet Transfer.
            Our professional chauffeurs provide door-to-door service from <strong>Istanbul
            Airport (IST)</strong> and <strong>Sabiha Gökçen Airport (SAW)</strong> to any destination in
            the city and beyond. With our <strong>VIP meet & greet service</strong>, your driver will
            be waiting with a name board at the arrivals hall. We monitor all
            flights in real-time to ensure punctual pickup regardless of delays.
            Available 24/7, our luxury <strong>Mercedes vehicles</strong> offer comfort, WiFi,
            complimentary water, and professional service for your <strong>private Istanbul transfer</strong>.
          </p>
        </section>

        {/* Features */}
        <FeatureList />

        {/* Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Popular Istanbul Transfer Destinations</h2>
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

        {/* Fleet */}
        <section>
          <h2 className="text-2xl font-bold mb-4">VIP Fleet for Istanbul Transfers</h2>
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

        {/* Price List */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Istanbul Airport Transfer Prices</h2>
          <PriceTable items={prices} title="Fixed Price Transfers" />
        </section>

        {/* WhatsApp CTA */}
        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Book Your Istanbul Airport Transfer</h3>
          <p className="text-muted-foreground mb-4">
            Get instant confirmation via WhatsApp for your Istanbul transfer
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer from Istanbul Airport."
          />
        </div>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Istanbul Transfer FAQ</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default IstanbulTransfer;
