import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.jpg";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.jpg";
import mercedesMaybachImage from "@/assets/mercedes-maybach-interior.jpg";
import mercedesSprinterImage from "@/assets/mercedes-sprinter-minibus.jpg";

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
    name: "Mercedes Vito",
    description: "The Mercedes Vito Comfortable family holiday transfer vehicles with best budget.",
    passengers: 7,
    luggage: 7,
    features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
  {
    name: "Mercedes Maybach",
    description: "The pinnacle of automotive luxury. Our Maybach offers executive rear seating and the smoothest ride for VIP guests and business executives.",
    passengers: 4,
    luggage: 4,
    features: ["Leather seats", "Rear entertainment", "Ambient lighting", "Mini bar", "Star ceiling", "TV"],
    image: mercedesMaybachImage,
  },
  {
    name: "Mercedes Sprinter VIP Minibus",
    description: "Perfect for larger groups, our VIP Sprinter offers airline-style seating for up to 16 passengers with individual screens and premium amenities.",
    passengers: 16,
    luggage: 16,
    features: ["Leather Seats", "Large luggage space", "WiFi", "USB"],
    image: mercedesSprinterImage,
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
