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
  "Çeşme", "Alaçatı", "Foça", "Kuşadası", "Seferihisar",
  "Urla", "Dikili", "Selçuk", "Şirince", "Izmir Center"
];

const prices = [
  { from: "ADB Airport", to: "Izmir Center", price: "$35" },
  { from: "ADB Airport", to: "Alsancak", price: "$40" },
  { from: "ADB Airport", to: "Konak", price: "$40" },
  { from: "ADB Airport", to: "Çeşme", price: "$110" },
  { from: "ADB Airport", to: "Alaçatı", price: "$100" },
  { from: "ADB Airport", to: "Kuşadası", price: "$85" },
];

const faqItems = [
  {
    question: "What is included in the transfer price?",
    answer: "Our price includes meet & greet service at the airport, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes.",
  },
  {
    question: "How far is Çeşme from Izmir Airport?",
    answer: "Çeşme is approximately 85 km from Izmir Airport. The transfer takes about 1 hour 15 minutes.",
  },
  {
    question: "Do you provide transfers to Ephesus?",
    answer: "Yes, we offer direct transfers to Ephesus and Selçuk from Izmir Airport. We can also arrange guided tours.",
  },
  {
    question: "Can I book a transfer to cruise port?",
    answer: "Yes, we provide transfers to and from Izmir cruise port and Kuşadası cruise port.",
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

const IzmirTransfer = () => {
  return (
    <WebsiteLayout>
      <PageHeader
        title="Izmir Airport Transfer – VIP Chauffeur Service"
        subtitle="Mercedes Vito, V-Class, Maybach | 24/7 Meet & Greet Service"
        backgroundImage="https://images.unsplash.com/photo-1565361849078-294849288a2d?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">
            Private Airport Transfer in Izmir
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Explore the Aegean coast with Meet Transfer. We offer premium airport
            transfers from Adnan Menderes Airport (ADB) to popular destinations
            including Çeşme, Alaçatı, Kuşadası, and historical Ephesus. Our
            experienced drivers know the region well and provide comfortable
            journeys in luxury Mercedes vehicles. Available 24/7 with flight
            monitoring and meet & greet service.
          </p>
        </section>

        <FeatureList />

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

        <PriceTable items={prices} title="Transfer Prices" />

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Book Your Izmir Transfer</h3>
          <p className="text-muted-foreground mb-4">
            Get instant confirmation via WhatsApp
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer from Izmir Airport."
          />
        </div>

        <FAQSection items={faqItems} />
      </div>
    </WebsiteLayout>
  );
};

export default IzmirTransfer;
