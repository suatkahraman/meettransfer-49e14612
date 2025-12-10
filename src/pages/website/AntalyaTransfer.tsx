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
import mercedesVipImage from "@/assets/mercedes-vip-transfer.jpg";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.jpg";

const destinations = [
  "Lara", "Kundu", "Belek", "Side", "Alanya",
  "Kemer", "Kalkan", "Kaş", "Olimpos", "Manavgat"
];

const prices = [
  { from: "AYT Airport", to: "Lara", price: "$35" },
  { from: "AYT Airport", to: "Kundu", price: "$40" },
  { from: "AYT Airport", to: "Belek", price: "$45" },
  { from: "AYT Airport", to: "Side", price: "$65" },
  { from: "AYT Airport", to: "Manavgat", price: "$70" },
  { from: "AYT Airport", to: "Alanya", price: "$90" },
  { from: "AYT Airport", to: "Kemer", price: "$55" },
];

const faqItems = [
  {
    question: "What is included in the transfer price?",
    answer: "Our price includes meet & greet service at the airport, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes.",
  },
  {
    question: "How long is the transfer from Antalya Airport to Belek?",
    answer: "The transfer from Antalya Airport to Belek takes approximately 30-40 minutes depending on traffic conditions.",
  },
  {
    question: "Can you accommodate child seats?",
    answer: "Yes, we provide child seats and booster seats free of charge upon request. Please mention this when booking.",
  },
  {
    question: "Do you offer return transfers?",
    answer: "Yes, we offer both one-way and round-trip transfers. You can book your return transfer at the same time for added convenience.",
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

const AntalyaTransfer = () => {
  return (
    <WebsiteLayout>
      <PageHeader
        title="Antalya Airport Transfer – VIP Chauffeur Service"
        subtitle="Mercedes Vito, V-Class, Maybach | 24/7 Meet & Greet Service"
        backgroundImage="https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">
            Private Airport Transfer in Antalya
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to the Turkish Riviera! Meet Transfer provides premium airport
            transfers from Antalya Airport (AYT) to all popular beach resorts
            including Lara, Belek, Side, Alanya, and Kemer. Our professional drivers
            ensure a comfortable and stress-free journey to your hotel. With meet &
            greet service, flight monitoring, and luxury vehicles, your vacation
            starts the moment you land.
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
          <h3 className="text-xl font-bold mb-2">Book Your Antalya Transfer</h3>
          <p className="text-muted-foreground mb-4">
            Get instant confirmation via WhatsApp
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer from Antalya Airport."
          />
        </div>

        <FAQSection items={faqItems} />
      </div>
    </WebsiteLayout>
  );
};

export default AntalyaTransfer;
