import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Clock, Shield, Plane, Sun, Hotel } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Konyaaltı", "Lara", "Belek", "Side", "Alanya",
  "Kemer", "Kaş", "Kalkan", "Kundu", "Manavgat"
];

const prices = [
  { from: "Antalya Airport", to: "Lara / Kundu", price: "€50" },
  { from: "Antalya Airport", to: "Kaleici (Old Town)", price: "€50" },
  { from: "Antalya Airport", to: "Belek", price: "€65" },
  { from: "Antalya Airport", to: "Side", price: "€72" },
  { from: "Antalya Airport", to: "Alanya", price: "€84" },
  { from: "Antalya Airport", to: "Kemer", price: "€65" },
  { from: "Antalya Airport", to: "Kaş / Kalkan", price: "€170" },
];

const faqItems = [
  {
    question: "How do I get from Antalya Airport to my hotel?",
    answer: "The easiest way is with our private Antalya Airport transfer service. We pick you up directly from the arrivals hall and drive you straight to your hotel in Lara, Belek, Side, Alanya, or any other destination. No waiting, no shared shuttles, just door-to-door service.",
  },
  {
    question: "How much does Antalya Airport transfer cost?",
    answer: "Our Antalya Airport transfer prices start from €50 for nearby areas like Lara, Kundu and Kaleici. Belek transfers are €65, Side is €72, and Alanya is €84. All prices are fixed with no hidden fees and include meet & greet service.",
  },
  {
    question: "How far is Antalya Airport from Belek?",
    answer: "Antalya Airport is approximately 35 km from Belek. With our private transfer, the journey takes about 30-40 minutes depending on traffic. We'll have you relaxing at your Belek resort in no time.",
  },
  {
    question: "Is there transfer from Antalya Airport to Alanya?",
    answer: "Yes, private transfer is the best option for the long journey to Alanya. Regular transport can be expensive and uncomfortable for the 130 km trip. Our fixed-price transfer at €84 offers a luxury Mercedes with AC, WiFi, and professional driver.",
  },
  {
    question: "Can I book Antalya Airport transfer for late night arrival?",
    answer: "Absolutely! We provide 24/7 Antalya Airport transfer service. Many charter flights arrive late at night, and we're always ready. Your driver will be waiting no matter what time your flight lands.",
  },
  {
    question: "Do you offer transfers to Antalya Airport for departures?",
    answer: "Yes, we provide both arrival and departure transfers. For your return journey, we'll pick you up from your hotel at the agreed time and ensure you reach Antalya Airport with plenty of time for your flight.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Premium 6-seater perfect for couples and small families arriving for their Antalya beach holiday. Enjoy leather seats and excellent AC.",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Cold water", "USB charger", "Climate control"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Family",
    description: "Ideal for larger families and groups heading to Antalya resorts. Plenty of space for all your beach gear and luggage.",
    passengers: 7,
    luggage: 7,
    features: ["Comfortable seats", "WiFi", "Complimentary water", "USB chargers", "Air conditioning", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const AntalyaAirportTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Antalya Airport Transfer | Private Hotel Shuttle from AYT | Meet Transfer"
        description="Book Antalya Airport (AYT) private transfer from $25. Direct service to Lara, Belek, Side, Alanya & all hotels. 24/7 meet & greet. Fixed prices. Book now!"
        keywords="Antalya Airport transfer, AYT airport transfer, Antalya to Belek transfer, Antalya Airport shuttle, Antalya hotel transfer, Antalya Airport to Lara, Antalya Airport to Side, Antalya Airport to Alanya"
        canonicalPath="/antalya-airport-transfer"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Antalya Airport', 'AYT', 'Belek', 'Lara', 'Side', 'Alanya', 'Kemer'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Antalya Airport Transfer', url: '/antalya-airport-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Antalya Airport Transfer Service',
            description: 'Private transfer from Antalya Airport to hotels in Belek, Lara, Side, and Alanya',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg'],
            offers: { price: '25', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title="Antalya Airport Transfer"
        subtitle="Private Transfers to Belek, Lara, Side, Alanya & All Hotels"
        backgroundImage="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Main H1 Section */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Antalya Airport Transfer: Start Your Turkish Riviera Holiday Right
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Welcome to the gateway of the Turkish Riviera! Antalya Airport (AYT) is Turkey's busiest tourist airport, welcoming millions of sun-seekers every year to the stunning Mediterranean coast. Our Antalya Airport transfer service ensures your holiday begins the moment you land, with a professional driver and luxury vehicle ready to whisk you to your resort in comfort.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Whether you're heading to the famous beaches of Lara, the golf resorts of Belek, the historic charm of Side, or the vibrant resort town of Alanya, our experienced drivers know every route and every hotel. Skip the crowded shuttle buses and queues – with our private Antalya Airport transfer, you're on vacation from the moment you step off the plane.
          </p>
        </section>

        {/* Why Choose Section */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Book Our Antalya Airport Transfer?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Hotel className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Door-to-Door Service</h3>
                <p className="text-sm text-muted-foreground">We take you directly from Antalya Airport to your hotel lobby. No stops, no detours, no waiting for other passengers.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sun className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cool, Comfortable Vehicles</h3>
                <p className="text-sm text-muted-foreground">After a long flight, relax in our air-conditioned Mercedes vehicles with chilled water and WiFi. Arrive refreshed.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Fixed Prices, All Inclusive</h3>
                <p className="text-sm text-muted-foreground">No surprises. Our Antalya Airport transfer prices are fixed and include everything – no tolls, no fuel surcharges.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Antalya Airport Transfer Destinations</h2>
          <p className="text-muted-foreground mb-6">We cover all resort areas along the Turkish Riviera:</p>
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
          <h2 className="text-2xl font-bold mb-4">Your Antalya Airport Transfer Experience</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            When you book our Antalya Airport transfer, here's what to expect: After landing at AYT and collecting your luggage, make your way to the arrivals hall. Your driver will be waiting with a name board, ready to greet you with a smile.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Your driver will help with your luggage and escort you to your pre-assigned luxury vehicle, parked in the nearby VIP parking area. Once settled in the cool, comfortable interior, you can relax while your driver takes the optimal route to your destination. All our vehicles are equipped with WiFi, so feel free to share your arrival photos or check in with family.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Whether you're staying at a 5-star all-inclusive resort in Belek, a boutique hotel in Kalkan, or an apartment in Alanya, we know exactly where to take you. Our drivers are familiar with virtually every hotel on the coast and will deliver you right to the entrance.
          </p>
        </section>

        {/* Fleet Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Antalya Airport Transfer Fleet</h2>
          <p className="text-muted-foreground mb-6">Travel in style with our well-maintained Mercedes fleet:</p>
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
          <h2 className="text-2xl font-bold mb-4">Antalya Airport Transfer Prices</h2>
          <p className="text-muted-foreground mb-6">Fixed prices with no hidden fees – what you see is what you pay:</p>
          <PriceTable items={prices} title="Fixed Price Transfers from Antalya Airport" />
        </section>

        {/* Booking CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Antalya Airport Transfer Now</h3>
          <p className="mb-6 opacity-90">
            Instant WhatsApp confirmation. 24/7 service for all flights.
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi, I'd like to book an Antalya Airport transfer. My flight details are:"
          />
        </div>

        {/* Additional Info */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Antalya Airport: Your Gateway to Paradise</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Antalya Airport (IATA: AYT) is located 13 km east of Antalya city center. It's one of Europe's busiest airports during summer, with flights arriving from across the continent. With two international terminals and excellent facilities, it's the starting point for millions of holidaymakers every year.
          </p>
          <h3 className="text-xl font-semibold mb-3">Antalya Airport Transfer Times:</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Antalya City/Konyaaltı:</strong> 15-20 minutes</li>
            <li><strong>Lara Beach:</strong> 15-20 minutes</li>
            <li><strong>Belek:</strong> 30-40 minutes</li>
            <li><strong>Side/Manavgat:</strong> 50-60 minutes</li>
            <li><strong>Alanya:</strong> 2 hours</li>
            <li><strong>Kemer:</strong> 45-55 minutes</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Antalya Airport Transfer FAQ</h2>
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
            <Link to="/dalaman-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Dalaman Airport Transfer
            </Link>
            <Link to="/istanbul-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Istanbul Airport Transfer
            </Link>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default AntalyaAirportTransfer;
