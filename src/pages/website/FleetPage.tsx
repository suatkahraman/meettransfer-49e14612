import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";
import mercedesMaybachImage from "@/assets/mercedes-maybach-interior.webp";
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
      <SEOHead
        title="Mercedes VIP Fleet - Luxury Transfer Vehicles | Meet Transfer"
        description="Explore our premium Mercedes fleet: Vito VIP, V-Class, Maybach, Sprinter Minibus. Luxury airport transfer vehicles with leather seats, WiFi, professional drivers."
        keywords="Mercedes VIP transfer, luxury transfer fleet, Mercedes Vito transfer, Mercedes Maybach chauffeur, VIP minibus Turkey, airport transfer vehicles, Mercedes V-Class transfer"
        canonicalPath="/fleet"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul', 'Antalya', 'Bodrum', 'Dalaman', 'Izmir', 'Cappadocia'] },
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
        title="Our Fleet"
        subtitle="Premium Mercedes Vehicles for Every Journey"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Mercedes VIP Fleet - Travel in Style & Comfort
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto text-lg">
            Our carefully curated fleet of <strong>Mercedes vehicles</strong> ensures you travel
            in the utmost comfort and style. From efficient <strong>airport transfers</strong> to
            <strong> luxury chauffeur service</strong>, we have the perfect vehicle for every
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
          <h2 className="text-xl font-bold mb-2">Need Help Choosing?</h2>
          <p className="text-muted-foreground mb-4">
            Contact us and we'll recommend the best vehicle for your transfer needs
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
