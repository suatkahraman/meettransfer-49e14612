import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Sailboat, TreePine, Waves } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Fethiye", "Ölüdeniz", "Marmaris", "Dalyan", "Göcek",
  "Hisarönü", "Kalkan", "Kaş", "İçmeler", "Sarigerme"
];

const prices = [
  { from: "Dalaman Airport", to: "Fethiye", price: "Request Price" },
  { from: "Dalaman Airport", to: "Ölüdeniz", price: "Request Price" },
  { from: "Dalaman Airport", to: "Marmaris", price: "Request Price" },
  { from: "Dalaman Airport", to: "Dalyan", price: "Request Price" },
  { from: "Dalaman Airport", to: "Göcek", price: "Request Price" },
  { from: "Dalaman Airport", to: "Kalkan", price: "Request Price" },
  { from: "Dalaman Airport", to: "Kaş", price: "Request Price" },
];

const faqItems = [
  {
    question: "How do I get from Dalaman Airport to Fethiye?",
    answer: "Our private Dalaman Airport transfer to Fethiye takes about 45 minutes. We meet you at arrivals, help with your luggage, and drive you directly to your hotel in Fethiye or Ölüdeniz. Price is fixed at $45.",
  },
  {
    question: "How much is transfer from Dalaman Airport to Marmaris?",
    answer: "Our Dalaman Airport to Marmaris private transfer is $75 fixed price. This includes meet & greet, luxury Mercedes vehicle, and door-to-door service. The journey takes approximately 1.5 hours.",
  },
  {
    question: "Is Dalaman Airport close to Ölüdeniz?",
    answer: "Dalaman Airport is about 60 km from Ölüdeniz (the famous Blue Lagoon). With our private transfer, you'll arrive at your Ölüdeniz hotel in approximately 50-60 minutes.",
  },
  {
    question: "Can I book a transfer from Dalaman Airport to a yacht in Göcek?",
    answer: "Absolutely! We regularly transfer passengers to Göcek Marina for Blue Cruise yachts. We can coordinate with your yacht crew for the perfect handover. Göcek is only 25 km from Dalaman Airport.",
  },
  {
    question: "Do you offer transfers to Kalkan and Kaş?",
    answer: "Yes, we provide transfers all along the Turquoise Coast. Kalkan is $85 (about 1.5 hours) and Kaş is $95 (about 2 hours). Both journeys offer stunning Mediterranean views.",
  },
  {
    question: "What time can I book a Dalaman Airport transfer?",
    answer: "We operate 24/7. Whether your flight arrives at 3 AM or departs at 5 AM, we'll be there. Many charter flights to Dalaman have irregular schedules, and we accommodate them all.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Ideal for couples and small groups heading to the Turquoise Coast resorts. Cool AC and comfortable seats for the scenic drive.",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Cold water", "USB charger", "Climate control"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Family",
    description: "Perfect for families with children visiting Ölüdeniz or Dalyan. Spacious interior with room for beach toys and luggage.",
    passengers: 7,
    luggage: 7,
    features: ["Comfortable seats", "WiFi", "Complimentary water", "USB chargers", "Air conditioning", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const DalamanAirportTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Dalaman Airport Transfer | Fethiye, Marmaris, Ölüdeniz Shuttle | Meet Transfer"
        description="Book Dalaman Airport (DLM) private transfer from $35. Direct service to Fethiye, Ölüdeniz, Marmaris, Dalyan, Göcek & Kaş. 24/7 meet & greet. Book now!"
        keywords="Dalaman Airport transfer, DLM airport transfer, Dalaman to Fethiye transfer, Dalaman to Marmaris, Dalaman to Ölüdeniz, Dalaman Airport shuttle, Dalaman to Göcek yacht transfer"
        canonicalPath="/dalaman-airport-transfer"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Dalaman Airport', 'DLM', 'Fethiye', 'Ölüdeniz', 'Marmaris', 'Dalyan', 'Göcek', 'Kalkan', 'Kaş'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Dalaman Airport Transfer', url: '/dalaman-airport-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Dalaman Airport Transfer Service',
            description: 'Private transfer from Dalaman Airport to Fethiye, Marmaris, Ölüdeniz, and the Turquoise Coast',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg'],
            offers: { price: '35', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title="Dalaman Airport Transfer"
        subtitle="Private Transfers to Fethiye, Ölüdeniz, Marmaris & the Turquoise Coast"
        backgroundImage="https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Main H1 Section */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Dalaman Airport Transfer: Your Gateway to the Turquoise Coast
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Dalaman Airport is your gateway to some of Turkey's most beautiful coastline – the legendary Turquoise Coast. From the world-famous Blue Lagoon at Ölüdeniz to the yacht-filled harbor of Göcek, from the lively resort town of Marmaris to the ancient ruins of Dalyan, this region has it all. And our Dalaman Airport transfer service ensures you get there in comfort and style.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            After landing at Dalaman Airport (DLM), the last thing you want is the hassle of finding transport. Our professional drivers are waiting at arrivals, ready to whisk you away in an air-conditioned Mercedes to your beach resort, boutique hotel, or yacht charter. Start your holiday stress-free from the moment you land.
          </p>
        </section>

        {/* Why Choose Section */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Choose Our Dalaman Airport Transfer?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Waves className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Turquoise Coast Coverage</h3>
                <p className="text-sm text-muted-foreground">From Marmaris to Kaş, we cover every resort and hotel along Turkey's stunning Mediterranean coast.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sailboat className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Yacht & Marina Transfers</h3>
                <p className="text-sm text-muted-foreground">Starting a Blue Cruise? We transfer to Göcek, Fethiye, and Marmaris marinas with perfect timing.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <TreePine className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Scenic Routes</h3>
                <p className="text-sm text-muted-foreground">Enjoy beautiful coastal and mountain views during your transfer. We can stop for photos if you wish.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Dalaman Airport Transfer Destinations</h2>
          <p className="text-muted-foreground mb-6">We serve all resorts along the Turquoise Coast:</p>
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
          <h2 className="text-2xl font-bold mb-4">Experience the Best Dalaman Airport Transfer</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The region served by Dalaman Airport is one of Turkey's most diverse and beautiful. Whether you're seeking paragliding over Ölüdeniz, swimming with loggerhead turtles in Dalyan, exploring the ghost town of Kayaköy, or sailing on a traditional gulet, your adventure starts with a smooth, comfortable transfer from the airport.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Our drivers know every road, every shortcut, and every hotel in the region. From five-star beach resorts to boutique guesthouses, from yacht marinas to mountain retreats – we'll get you there efficiently and in comfort. The drives through this region are beautiful in themselves, with glimpses of the sparkling Mediterranean, pine-covered mountains, and charming Turkish villages.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Many of our clients are joining Blue Cruise yacht charters from Göcek or Fethiye. We specialize in marina transfers and can coordinate with your yacht captain for the perfect handover. Your holiday on the water starts smoothly with our professional service.
          </p>
        </section>

        {/* Fleet Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Dalaman Airport Transfer Fleet</h2>
          <p className="text-muted-foreground mb-6">Comfortable Mercedes vehicles for your coastal journey:</p>
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
          <h2 className="text-2xl font-bold mb-4">Dalaman Airport Transfer Prices</h2>
          <p className="text-muted-foreground mb-6">Fixed prices to all Turquoise Coast destinations:</p>
          <PriceTable items={prices} title="Fixed Price Transfers from Dalaman Airport" />
        </section>

        {/* Booking CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Dalaman Airport Transfer Now</h3>
          <p className="mb-6 opacity-90">
            Instant WhatsApp confirmation. Marina transfers available.
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi, I'd like to book a Dalaman Airport transfer. My flight details are:"
          />
        </div>

        {/* Additional Info */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Dalaman Airport: Essential Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Dalaman Airport (IATA: DLM) is located near the town of Dalaman in Muğla Province. It's one of Turkey's busiest airports during summer, with charter and scheduled flights from across Europe. The airport has excellent facilities and is the main gateway to the western Mediterranean coast.
          </p>
          <h3 className="text-xl font-semibold mb-3">Dalaman Airport Transfer Distances:</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Dalyan:</strong> 25 km (20-25 minutes)</li>
            <li><strong>Göcek:</strong> 22 km (20 minutes)</li>
            <li><strong>Fethiye:</strong> 45 km (45 minutes)</li>
            <li><strong>Ölüdeniz:</strong> 60 km (55 minutes)</li>
            <li><strong>Marmaris:</strong> 95 km (1.5 hours)</li>
            <li><strong>Kalkan:</strong> 130 km (1.5 hours)</li>
            <li><strong>Kaş:</strong> 155 km (2 hours)</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Dalaman Airport Transfer FAQ</h2>
          <FAQSection items={faqItems} />
        </section>

        {/* Internal Links */}
        <section className="bg-secondary rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">Explore More Transfer Services</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/bodrum-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Bodrum Airport Transfer
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

export default DalamanAirportTransfer;
