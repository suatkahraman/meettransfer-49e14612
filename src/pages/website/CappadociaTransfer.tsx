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
    question: "Can you arrange early morning balloon flight transfers?",
    answer: "Yes, we provide early morning transfers (4-5 AM) to hot air balloon departure points. Book your return transfer too!",
  },
  {
    question: "Do you offer day tours in Cappadocia?",
    answer: "We can arrange full-day tours to explore the fairy chimneys, underground cities, and valleys with private driver and guide.",
  },
  {
    question: "Is the transfer available 24/7?",
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
    name: "Mercedes V-Class",
    description: "Premium 7-seater with extra legroom and luxury features",
    passengers: 7,
    luggage: 7,
    features: ["Captain seats", "Star ceiling", "WiFi", "Mini bar"],
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
  },
];

const CappadociaTransfer = () => {
  return (
    <WebsiteLayout>
      <PageHeader
        title="Cappadocia Airport Transfer – VIP Chauffeur Service"
        subtitle="Mercedes Vito, V-Class, Maybach | 24/7 Meet & Greet Service"
        backgroundImage="https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">
            Private Airport Transfer in Cappadocia
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Experience the magic of Cappadocia with Meet Transfer. We provide
            premium transfers from both Nevşehir Airport (NAV) and Kayseri
            Airport (ASR) to all cave hotels and destinations in the region
            including Göreme, Ürgüp, and Uçhisar. Our drivers are familiar with
            every fairy chimney and can assist with balloon flight schedules.
            Start your Cappadocia adventure in comfort and style.
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
          <h3 className="text-xl font-bold mb-2">Book Your Cappadocia Transfer</h3>
          <p className="text-muted-foreground mb-4">
            Get instant confirmation via WhatsApp
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to book a transfer in Cappadocia."
          />
        </div>

        <FAQSection items={faqItems} />
      </div>
    </WebsiteLayout>
  );
};

export default CappadociaTransfer;
