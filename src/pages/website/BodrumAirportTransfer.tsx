import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Anchor, Waves, Hotel } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Bodrum Center", "Yalıkavak", "Gümbet", "Bitez", "Türkbükü",
  "Gündoğan", "Göltürkbükü", "Torba", "Ortakent", "Turgutreis"
];

const prices = [
  { from: "Bodrum Airport", to: "Bodrum Center", price: "Request Price" },
  { from: "Bodrum Airport", to: "Gümbet", price: "Request Price" },
  { from: "Bodrum Airport", to: "Bitez", price: "Request Price" },
  { from: "Bodrum Airport", to: "Yalıkavak", price: "Request Price" },
  { from: "Bodrum Airport", to: "Türkbükü", price: "Request Price" },
  { from: "Bodrum Airport", to: "Torba", price: "Request Price" },
  { from: "Bodrum Airport", to: "Turgutreis", price: "Request Price" },
];

const faqItems = [
  {
    question: "How do I get from Bodrum Airport to Bodrum town?",
    answer: "The most comfortable way is with our private Bodrum Airport transfer. We meet you at arrivals and drive you directly to your hotel or destination in Bodrum town. The journey takes approximately 35-45 minutes depending on traffic.",
  },
  {
    question: "How much is a taxi from Bodrum Airport to Yalıkavak?",
    answer: "Our fixed-price Bodrum Airport transfer to Yalıkavak is $55. This includes meet & greet service, luxury Mercedes vehicle, and door-to-door delivery. Regular taxis are often more expensive and don't offer the same comfort level.",
  },
  {
    question: "Is there public transport from Bodrum Airport?",
    answer: "There are buses (Havaş) from Bodrum Airport to the town center, but they don't serve individual hotels or resort areas like Yalıkavak and Türkbükü. For a stress-free start to your Bodrum holiday, private transfer is the best choice.",
  },
  {
    question: "Can I book a Bodrum Airport transfer for a large group?",
    answer: "Absolutely! We have Mercedes Sprinter vehicles for groups up to 14 passengers. Perfect for families, wedding parties, or groups of friends visiting Bodrum together. All luggage included in the price.",
  },
  {
    question: "How far is Bodrum Airport from Türkbükü?",
    answer: "Bodrum Airport (BJV) is approximately 50 km from Türkbükü. With our private transfer, the journey takes about 45-55 minutes through the beautiful Bodrum peninsula scenery.",
  },
  {
    question: "Do you offer yacht/marina transfers in Bodrum?",
    answer: "Yes, we provide transfers to all Bodrum marinas including Bodrum Marina, Yalıkavak Marina, and D-Marin Turgutreis. Our drivers can coordinate with your yacht crew for seamless arrivals and departures.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Perfect for couples and small groups arriving for their Bodrum luxury experience. Leather seats, AC, and all the comfort you deserve.",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Cold water", "USB charger", "Climate control"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Family",
    description: "Ideal for families heading to Bodrum resorts. Comfortable seating and plenty of luggage space for all your beach essentials.",
    passengers: 7,
    luggage: 7,
    features: ["Comfortable seats", "WiFi", "Complimentary water", "USB chargers", "Air conditioning", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const BodrumAirportTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Bodrum Airport Transfer | Private Shuttle to Hotels & Marinas | Meet Transfer"
        description="Book Bodrum Airport (BJV) private transfer from $45. Direct service to Bodrum, Yalıkavak, Türkbükü, Gümbet & all areas. Meet & greet included. Book now!"
        keywords="Bodrum Airport transfer, BJV airport transfer, Bodrum Airport taxi, Bodrum to Yalıkavak transfer, Bodrum Airport shuttle, Bodrum hotel transfer, Bodrum Airport to Türkbükü, Bodrum marina transfer"
        canonicalPath="/bodrum-airport-transfer"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Bodrum Airport', 'BJV', 'Bodrum', 'Yalıkavak', 'Türkbükü', 'Gümbet', 'Bitez'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Bodrum Airport Transfer', url: '/bodrum-airport-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Bodrum Airport Transfer Service',
            description: 'Private transfer from Bodrum Airport to hotels and marinas across the Bodrum Peninsula',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg'],
            offers: { price: '45', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title="Bodrum Airport Transfer"
        subtitle="Private Transfers to Yalıkavak, Türkbükü, Gümbet & All Peninsula"
        backgroundImage="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Main H1 Section */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Bodrum Airport Transfer: Your Luxury Journey to the Aegean Coast
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Welcome to Bodrum, Turkey's premier Aegean destination where ancient history meets modern luxury. Our Bodrum Airport transfer service ensures your arrival is as stylish as your destination. Whether you're heading to the chic beach clubs of Yalıkavak, the exclusive coves of Türkbükü, or the vibrant nightlife of Bodrum town, we'll get you there in comfort and style.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Bodrum Airport (Milas-Bodrum Airport, BJV) serves the entire Bodrum Peninsula, known for its whitewashed houses, crystal-clear waters, and world-class resorts. The airport is located about 36 km from Bodrum town center, making private transfer the most convenient way to reach your destination quickly and comfortably.
          </p>
        </section>

        {/* Why Choose Section */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Choose Our Bodrum Airport Transfer?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Anchor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Marina & Yacht Transfers</h3>
                <p className="text-sm text-muted-foreground">Direct transfers to Bodrum Marina, Yalıkavak Marina, and D-Marin. We coordinate with your yacht crew for perfect timing.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Waves className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">All Peninsula Covered</h3>
                <p className="text-sm text-muted-foreground">From Türkbükü to Turgutreis, Gümbet to Göltürkbükü – we know every corner of the beautiful Bodrum Peninsula.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Hotel className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Door-to-Door Luxury</h3>
                <p className="text-sm text-muted-foreground">From airport arrivals to your hotel entrance or villa gate. We carry your luggage and ensure you arrive refreshed.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Bodrum Airport Transfer Destinations</h2>
          <p className="text-muted-foreground mb-6">We serve all towns and resorts across the Bodrum Peninsula:</p>
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
          <h2 className="text-2xl font-bold mb-4">Experience the Bodrum Airport Transfer Difference</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The Bodrum Peninsula is unlike anywhere else in Turkey. With its stunning coastline, ancient castle views, and sophisticated atmosphere, it attracts discerning travelers from around the world. Your Bodrum experience deserves to start with a transfer service that matches this level of quality.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            When you book our Bodrum Airport transfer, you're not just getting a ride – you're getting a stress-free start to your holiday. Our driver will be waiting at arrivals with your name, ready to assist with luggage and guide you to your premium vehicle. As you travel through the peninsula's scenic roads, you can start planning your beach days, boat trips, and sunset dinners.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Whether you're visiting the iconic Bodrum Castle, sailing on a traditional gulet, exploring the boutiques of Yalıkavak, or simply relaxing on a sun lounger in Türkbükü, your Bodrum adventure starts the moment your driver says "Hoş geldiniz" – welcome.
          </p>
        </section>

        {/* Fleet Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Bodrum Airport Transfer Fleet</h2>
          <p className="text-muted-foreground mb-6">Arrive in style with our premium Mercedes vehicles:</p>
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
          <h2 className="text-2xl font-bold mb-4">Bodrum Airport Transfer Prices</h2>
          <p className="text-muted-foreground mb-6">Fixed prices with meet & greet service included:</p>
          <PriceTable items={prices} title="Fixed Price Transfers from Bodrum Airport" />
        </section>

        {/* Booking CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Bodrum Airport Transfer Now</h3>
          <p className="mb-6 opacity-90">
            Instant WhatsApp confirmation. Available 24/7.
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi, I'd like to book a Bodrum Airport transfer. My flight details are:"
          />
        </div>

        {/* Additional Info */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Bodrum Airport: Essential Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Milas-Bodrum Airport (IATA: BJV) is located inland from the peninsula, requiring a transfer to reach the coast. The modern airport handles both domestic and international flights, with peak season seeing arrivals from across Europe.
          </p>
          <h3 className="text-xl font-semibold mb-3">Bodrum Airport Transfer Distances:</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Bodrum Town Center:</strong> 36 km (35-45 minutes)</li>
            <li><strong>Gümbet:</strong> 38 km (40-50 minutes)</li>
            <li><strong>Yalıkavak:</strong> 50 km (50-60 minutes)</li>
            <li><strong>Türkbükü:</strong> 52 km (55-65 minutes)</li>
            <li><strong>Turgutreis:</strong> 55 km (55-65 minutes)</li>
            <li><strong>Bitez:</strong> 40 km (40-50 minutes)</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Bodrum Airport Transfer FAQ</h2>
          <FAQSection items={faqItems} />
        </section>

        {/* Internal Links */}
        <section className="bg-secondary rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">Explore More Transfer Services</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/dalaman-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Dalaman Airport Transfer
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

export default BodrumAirportTransfer;
