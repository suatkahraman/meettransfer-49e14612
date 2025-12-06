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
    question: "What is included in the transfer price?",
    answer: "Our price includes meet & greet service at the airport, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes.",
  },
  {
    question: "How do I book a transfer?",
    answer: "You can book through our website, WhatsApp, or by calling us directly. We confirm all bookings within minutes.",
  },
  {
    question: "Is the price fixed or metered?",
    answer: "All our prices are fixed. The price you see is the price you pay – no hidden fees or surprises.",
  },
  {
    question: "Do you track flight arrivals?",
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
    image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800",
  },
  {
    name: "Mercedes V-Class",
    description: "Premium 7-seater with extra legroom and luxury features",
    passengers: 7,
    luggage: 7,
    features: ["Captain seats", "Star ceiling", "WiFi", "Mini bar"],
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
  },
];

const IstanbulTransfer = () => {
  return (
    <WebsiteLayout>
      <PageHeader
        title="Istanbul Airport Transfer – VIP Chauffeur Service"
        subtitle="Mercedes Vito, V-Class, Maybach | 24/7 Meet & Greet Service"
        backgroundImage="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Description */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">
            Private Airport Transfer in Istanbul
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Experience seamless airport transfers in Istanbul with Meet Transfer.
            Our professional chauffeurs provide door-to-door service from Istanbul
            Airport (IST) and Sabiha Gökçen Airport (SAW) to any destination in
            the city and beyond. With our meet & greet service, your driver will
            be waiting with a name board at the arrivals hall. We monitor all
            flights in real-time to ensure punctual pickup regardless of delays.
            Available 24/7, our luxury Mercedes vehicles offer comfort, WiFi,
            complimentary water, and professional service.
          </p>
        </section>

        {/* Features */}
        <FeatureList />

        {/* Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Popular Destinations</h2>
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
          <h2 className="text-2xl font-bold mb-4">VIP Fleet</h2>
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
        <PriceTable items={prices} title="Transfer Prices" />

        {/* WhatsApp CTA */}
        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Book Your Istanbul Transfer</h3>
          <p className="text-muted-foreground mb-4">
            Get instant confirmation via WhatsApp
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer from Istanbul Airport."
          />
        </div>

        {/* FAQ */}
        <FAQSection items={faqItems} />
      </div>
    </WebsiteLayout>
  );
};

export default IstanbulTransfer;
