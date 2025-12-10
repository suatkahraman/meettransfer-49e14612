import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.jpg";

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Our most popular choice for airport transfers. The Mercedes Vito VIP offers spacious seating, ample luggage space, and premium comfort features perfect for families and small groups.",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "Individual climate control", "WiFi", "USB chargers", "Complimentary water", "Tinted windows"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes V-Class",
    description: "The ultimate in luxury minivan travel. The V-Class features captain seats with extra legroom, star ceiling lighting, and a mini bar for the most discerning travelers.",
    passengers: 7,
    luggage: 7,
    features: ["Captain seats", "Star ceiling", "Mini bar", "Premium WiFi", "Massage seats", "Extra legroom"],
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
  },
  {
    name: "Mercedes-Maybach S-Class",
    description: "The pinnacle of automotive luxury. Our Maybach S-Class offers executive rear seating, champagne cooler, and the smoothest ride for VIP guests and business executives.",
    passengers: 3,
    luggage: 3,
    features: ["Executive rear seats", "Champagne cooler", "Burmester sound", "Rear entertainment", "Partition screen", "Ambient lighting"],
    image: "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800",
  },
  {
    name: "Mercedes Sprinter VIP Minibus",
    description: "Perfect for larger groups, our VIP Sprinter offers airline-style seating for up to 16 passengers with individual screens and premium amenities.",
    passengers: 16,
    luggage: 16,
    features: ["Individual screens", "Airline seats", "Large luggage space", "PA system", "WiFi", "USB at every seat"],
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
  },
];

const FleetPage = () => {
  const { t } = useLanguage();

  return (
    <WebsiteLayout>
      <PageHeader
        title="Our Fleet"
        subtitle="Premium Mercedes Vehicles for Every Journey"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none text-center">
          <h2 className="text-2xl font-bold mb-4">
            Travel in Style & Comfort
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Our carefully curated fleet of Mercedes vehicles ensures you travel
            in the utmost comfort and style. From efficient airport transfers to
            luxury chauffeur service, we have the perfect vehicle for every
            occasion. All vehicles are regularly maintained and cleaned to the
            highest standards.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.name} {...vehicle} />
          ))}
        </div>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Need Help Choosing?</h3>
          <p className="text-muted-foreground mb-4">
            Contact us and we'll recommend the best vehicle for your needs
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I need help choosing the right vehicle for my transfer."
          />
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default FleetPage;
