import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Mountain, Sunrise, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Göreme", "Ürgüp", "Uçhisar", "Nevşehir", "Avanos",
  "Ortahisar", "Mustafapaşa", "Çavuşin", "Paşabağ", "Derinkuyu"
];

const prices = [
  { from: "Kayseri Airport", to: "Göreme", price: "Request Price" },
  { from: "Kayseri Airport", to: "Ürgüp", price: "Request Price" },
  { from: "Kayseri Airport", to: "Uçhisar", price: "Request Price" },
  { from: "Kayseri Airport", to: "Nevşehir", price: "Request Price" },
  { from: "Nevşehir Airport", to: "Göreme", price: "Request Price" },
  { from: "Nevşehir Airport", to: "Ürgüp", price: "Request Price" },
  { from: "Nevşehir Airport", to: "Uçhisar", price: "Request Price" },
];

const faqItems = [
  {
    question: "How do I get from Kayseri Airport to Cappadocia?",
    answer: "The best way to get from Kayseri Airport (ASR) to Cappadocia is by private transfer. We meet you at arrivals and drive you directly to your cave hotel in Göreme, Ürgüp, or Uçhisar. The journey takes approximately 1 hour through scenic Central Anatolian landscapes.",
  },
  {
    question: "Which airport is best for Cappadocia?",
    answer: "Cappadocia has two airports: Kayseri (ASR) and Nevşehir (NAV). Kayseri has more flight options and is about 80 km from Göreme. Nevşehir is closer (40 km) but has fewer flights. We provide private transfers from both airports.",
  },
  {
    question: "How much does Cappadocia airport transfer cost?",
    answer: "Our Kayseri Airport to Göreme transfer is $45. Nevşehir Airport to Göreme is $35. All prices are fixed and include meet & greet, professional driver, comfortable vehicle, and hotel delivery.",
  },
  {
    question: "Can I book a transfer for early morning balloon flights?",
    answer: "Yes! If you're taking an early morning hot air balloon ride, we can arrange your transfer to arrive the evening before. We also provide early morning transfers between hotels and balloon launch sites.",
  },
  {
    question: "Do you offer Cappadocia day tours and transfers?",
    answer: "Yes, beyond airport transfers, we offer private Cappadocia tours covering the fairy chimneys, underground cities, and cave churches. Ask us about combining your transfer with a personalized tour.",
  },
  {
    question: "Is there WiFi in the transfer vehicle?",
    answer: "Yes, all our vehicles are equipped with WiFi, so you can share your Cappadocia arrival photos immediately. We also provide complimentary water and USB chargers.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Perfect for couples on a romantic Cappadocia getaway. Comfortable journey through the fairy chimney landscape.",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Cold water", "USB charger", "Climate control"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Family",
    description: "Great for families and photography groups visiting Cappadocia. Plenty of room for camera equipment and luggage.",
    passengers: 7,
    luggage: 7,
    features: ["Comfortable seats", "WiFi", "Complimentary water", "USB chargers", "Air conditioning", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const CappadociaAirportTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Cappadocia Airport Transfer | Kayseri & Nevşehir to Göreme | Meet Transfer"
        description="Book Cappadocia Airport private transfer from $35. Kayseri (ASR) & Nevşehir (NAV) to Göreme, Ürgüp, Uçhisar. Meet & greet, cave hotel delivery. Book now!"
        keywords="Cappadocia Airport transfer, Kayseri Airport transfer, Nevşehir Airport transfer, Cappadocia private transfer, Kayseri to Göreme transfer, airport to Cappadocia, Cappadocia shuttle, Göreme airport transfer"
        canonicalPath="/cappadocia-airport-transfer"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Cappadocia', 'Kayseri Airport', 'Nevşehir Airport', 'Göreme', 'Ürgüp', 'Uçhisar'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Cappadocia Airport Transfer', url: '/cappadocia-airport-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Cappadocia Airport Transfer Service',
            description: 'Private transfer from Kayseri and Nevşehir airports to Cappadocia hotels',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg'],
            offers: { price: '35', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title="Cappadocia Airport Transfer"
        subtitle="Private Transfers from Kayseri & Nevşehir to Göreme & Ürgüp"
        backgroundImage="https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Main H1 Section */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Cappadocia Airport Transfer: Journey to the Land of Fairy Chimneys
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Welcome to one of the world's most magical destinations. Cappadocia's otherworldly landscape of fairy chimneys, cave hotels, and hot air balloons awaits you – and your journey begins with our seamless airport transfer service. Whether you're flying into Kayseri or Nevşehir Airport, we'll ensure you arrive at your cave hotel relaxed and ready to explore.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            The drive from the airport to Cappadocia is part of the adventure. As you travel through the central Anatolian plateau, you'll begin to see the famous rock formations that make this UNESCO World Heritage Site so unique. Our experienced drivers know the region intimately and can share insights about the landscape you'll be exploring during your stay.
          </p>
        </section>

        {/* Why Choose Section */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Choose Our Cappadocia Airport Transfer?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Mountain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cave Hotel Delivery</h3>
                <p className="text-sm text-muted-foreground">We know every cave hotel in Göreme, Ürgüp, and Uçhisar. We'll deliver you right to your unique accommodation's door.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sunrise className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Balloon Flight Coordination</h3>
                <p className="text-sm text-muted-foreground">Arriving for an early morning balloon ride? We'll ensure your transfer timing is perfect for that 5 AM launch.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Photography Stops Available</h3>
                <p className="text-sm text-muted-foreground">Want to stop for photos during your transfer? Just ask – we're happy to pause at scenic viewpoints.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Cappadocia Airport Transfer Destinations</h2>
          <p className="text-muted-foreground mb-6">We provide transfers to all Cappadocia towns and villages:</p>
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

        {/* Content Section */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Your Cappadocia Airport Transfer Experience</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Cappadocia is served by two airports: Kayseri Erkilet Airport (ASR) and Nevşehir Kapadokya Airport (NAV). Kayseri is the larger airport with more flight options, located about 80 km from Göreme. Nevşehir is closer at 40 km but has fewer flights. Whichever airport you choose, our transfer service provides the same seamless experience.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Many travelers arrive in Cappadocia specifically for the famous hot air balloon rides at sunrise. If you're planning a balloon flight, we recommend arriving the day before. Our transfer can bring you to your hotel in time to enjoy dinner and get a good night's rest before your early morning adventure. We can also arrange early morning balloon-site transfers if needed.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            During your transfer from the airport, you'll cross the Anatolian plateau – a vast, open landscape that gradually gives way to the strange, beautiful rock formations of Cappadocia. As the fairy chimneys come into view, you'll know you've arrived somewhere truly special.
          </p>
        </section>

        {/* Fleet Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Cappadocia Airport Transfer Fleet</h2>
          <p className="text-muted-foreground mb-6">Comfortable vehicles for your journey through Central Anatolia:</p>
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

        {/* Pricing Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Cappadocia Airport Transfer Prices</h2>
          <p className="text-muted-foreground mb-6">Fixed prices from both Kayseri and Nevşehir airports:</p>
          <PriceTable items={prices} title="Transfer Routes to Cappadocia" />
        </section>

        {/* Booking CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Cappadocia Airport Transfer Now</h3>
          <p className="mb-6 opacity-90">
            Instant WhatsApp confirmation. Cave hotel delivery guaranteed.
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi, I'd like to book a Cappadocia Airport transfer. My flight details are:"
          />
        </div>

        {/* Additional Info */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Getting to Cappadocia: Airport Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Kayseri Erkilet Airport (ASR)</strong> is the main gateway to Cappadocia, with regular flights from Istanbul (both airports), Ankara, and seasonal international flights. It's a modern airport with all standard facilities.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Nevşehir Kapadokya Airport (NAV)</strong> is closer to the main tourist areas but has fewer flights, primarily from Istanbul. If you can find a flight to Nevşehir, the shorter transfer time is a nice bonus.
          </p>
          <h3 className="text-xl font-semibold mb-3">Cappadocia Airport Transfer Times:</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Kayseri Airport → Göreme:</strong> 80 km (1 hour)</li>
            <li><strong>Kayseri Airport → Ürgüp:</strong> 75 km (55 minutes)</li>
            <li><strong>Kayseri Airport → Uçhisar:</strong> 85 km (1 hour 5 minutes)</li>
            <li><strong>Nevşehir Airport → Göreme:</strong> 40 km (30 minutes)</li>
            <li><strong>Nevşehir Airport → Ürgüp:</strong> 35 km (25 minutes)</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Cappadocia Airport Transfer FAQ</h2>
          <FAQSection items={faqItems} />
        </section>

        {/* Internal Links */}
        <section className="bg-secondary rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">Explore More Transfer Services</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/istanbul-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Istanbul Airport Transfer
            </Link>
            <Link to="/antalya-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Antalya Airport Transfer
            </Link>
            <Link to="/izmir-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Izmir Airport Transfer
            </Link>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default CappadociaAirportTransfer;
