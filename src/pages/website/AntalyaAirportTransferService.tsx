import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Clock, Shield, Plane, Sun, Hotel, Users, Star, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Lara Beach", "Kundu", "Belek", "Side", "Alanya",
  "Kemer", "Kaleici", "Kaş", "Kalkan", "Manavgat",
  "Olympos", "Cirali", "Konyaaltı", "Beldibi", "Göynük"
];

const prices = [
  { from: "Antalya Airport (AYT)", to: "Lara / Kundu", price: "From €50" },
  { from: "Antalya Airport (AYT)", to: "Kaleici (Old Town)", price: "From €50" },
  { from: "Antalya Airport (AYT)", to: "Belek Resorts", price: "From €65" },
  { from: "Antalya Airport (AYT)", to: "Side / Manavgat", price: "From €72" },
  { from: "Antalya Airport (AYT)", to: "Alanya", price: "From €84" },
  { from: "Antalya Airport (AYT)", to: "Kemer", price: "From €65" },
  { from: "Antalya Airport (AYT)", to: "Kaş / Kalkan", price: "From €170" },
  { from: "Antalya Airport (AYT)", to: "Olympos / Cirali", price: "From €85" },
];

const faqItems = [
  {
    question: "How do I get from Antalya Airport to my hotel?",
    answer: "The most comfortable way is with our private Antalya Airport transfer service. We pick you up directly from the arrivals hall with a name board and drive you straight to your hotel in Lara, Belek, Side, Alanya, or any other destination. No waiting for other passengers, no shared shuttles - just direct door-to-door service with a professional driver.",
  },
  {
    question: "How much does Antalya Airport private transfer cost?",
    answer: "Our Antalya Airport private transfer prices start from €50 for nearby areas like Lara, Kundu, and Kaleici. Belek resort transfers are €65, Side is €72, and Alanya is €84. All prices are fixed with no hidden fees and include meet & greet service, flight tracking, and all taxes.",
  },
  {
    question: "How far is Antalya Airport from Belek?",
    answer: "Antalya Airport is approximately 35 km from Belek. With our private transfer, the journey takes about 30-40 minutes depending on traffic. We'll have you relaxing at your Belek golf or beach resort in no time.",
  },
  {
    question: "Is there private transfer from Antalya Airport to Alanya?",
    answer: "Yes, private transfer is the best option for the journey to Alanya. Regular transport can be uncomfortable for the 130 km trip. Our fixed-price private transfer at €84 offers a luxury Mercedes with AC, WiFi, and professional driver for a comfortable 2-hour journey.",
  },
  {
    question: "Can I book Antalya Airport transfer for late night arrival?",
    answer: "Absolutely! We provide 24/7 Antalya Airport private transfer service. Many charter flights arrive late at night, and we're always ready. Your driver will be waiting no matter what time your flight lands - even at 3 AM.",
  },
  {
    question: "Do you offer transfers to Antalya Airport for departures?",
    answer: "Yes, we provide both arrival and departure private transfers. For your return journey, we'll pick you up from your hotel at the agreed time and ensure you reach Antalya Airport with plenty of time for check-in and your flight.",
  },
  {
    question: "What vehicles do you use for Antalya Airport transfers?",
    answer: "We use premium Mercedes vehicles for all our Antalya Airport transfers. Our fleet includes Mercedes Vito VIP (6 passengers) and Mercedes Vito Family (7 passengers). All vehicles feature comfortable seats, powerful air conditioning (essential for Turkish summer), WiFi, and complimentary cold water.",
  },
  {
    question: "Are child seats available for Antalya Airport transfers?",
    answer: "Yes, we provide child seats and booster seats free of charge upon request. Simply mention the ages of your children when booking, and we'll ensure the appropriate safety seats are installed in your vehicle.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Premium 6-seater perfect for couples and small families arriving for their Antalya beach holiday. Enjoy leather seats, powerful AC, and a refreshing cold water after your flight.",
    passengers: 6,
    luggage: 6,
    features: ["Premium leather seats", "Powerful AC", "Cold water", "Free WiFi", "USB chargers", "Tinted windows"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Family",
    description: "Spacious 7-seater ideal for larger families and groups heading to Antalya resorts. Plenty of space for all your beach gear, suitcases, and everyone to travel comfortably.",
    passengers: 7,
    luggage: 7,
    features: ["Comfortable seats", "Powerful AC", "Complimentary water", "Free WiFi", "USB chargers", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const AntalyaAirportTransferService = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Antalya Airport Transfer | Private Transfer Service – Meet Transfer"
        description="Book Antalya Airport private transfer from €50. Direct service to Lara, Belek, Side, Alanya & all hotels. 24/7 meet & greet, luxury Mercedes vehicles. Fixed prices, no hidden fees. Book now!"
        keywords="private airport transfer antalya, antalya airport transfer, AYT airport private transfer, antalya to belek transfer, antalya airport shuttle, antalya hotel transfer, antalya airport to lara, antalya airport to side, antalya airport to alanya, antalya airport transfer service"
        canonicalPath="/antalya-airport-transfer"
        ogImage="https://meettransfer.app/og/antalya-airport-og.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness', includeRating: false },
          { type: 'TransportationService', areaServed: ['Antalya Airport', 'AYT', 'Belek', 'Lara', 'Side', 'Alanya', 'Kemer', 'Kaş', 'Kalkan'] },
          {
            type: 'WebPage',
            name: 'Antalya Airport Private Transfer | Meet Transfer',
            description: 'Book Antalya Airport private transfer from €50. Direct service to Lara, Belek, Side, Alanya.',
            url: 'https://meettransfer.app/antalya-airport-transfer',
            breadcrumb: [
              { name: 'Home', url: '/' },
              { name: 'Services', url: '/services' },
              { name: 'Antalya Airport Transfer', url: '/antalya-airport-transfer' },
            ],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Services', url: '/services' },
              { name: 'Antalya Airport Private Transfer', url: '/antalya-airport-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
        ]}
      />

      <PageHeader
        title="Antalya Airport Private Transfer"
        subtitle="Reliable & Comfortable Airport Transfer to Turkish Riviera"
        backgroundImage="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Content Section */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Antalya Airport Private Transfer
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6 font-medium">
            Reliable & Comfortable Airport Transfer to the Turkish Riviera
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Looking for a safe and reliable Antalya airport private transfer? Meet Transfer provides professional door-to-door transportation from Antalya Airport (AYT) to all resorts, hotels, and destinations along the beautiful Turkish Riviera. Start your beach holiday the right way with fixed prices, modern air-conditioned vehicles, and 24/7 customer support.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            With Meet Transfer, you skip the crowded shuttle buses and taxi queues. Your private driver will be waiting at Antalya Airport with a name sign and will take you directly to your resort - whether it's a 5-star all-inclusive in Belek, a boutique hotel in Side, or an apartment in Alanya. Enjoy the Mediterranean sunshine from the moment you land!
          </p>
        </section>

        {/* Key Benefits */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Choose Our Antalya Airport Private Transfer?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Hotel className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Direct Door-to-Door Service</h3>
                <p className="text-sm text-muted-foreground">We take you directly from Antalya Airport to your hotel lobby. No stops, no detours, no waiting for other passengers.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sun className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cool, Comfortable Journey</h3>
                <p className="text-sm text-muted-foreground">After a long flight, relax in our air-conditioned Mercedes vehicles with chilled water and WiFi. Arrive refreshed and ready for vacation.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Fixed Prices, All Inclusive</h3>
                <p className="text-sm text-muted-foreground">No surprises. Our Antalya Airport transfer prices are fixed and include everything – no tolls, no fuel surcharges, no hidden fees.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">24/7 Flight Monitoring</h3>
                <p className="text-sm text-muted-foreground">We track your flight in real-time. If it's delayed or early, we adjust automatically at no extra cost.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Family-Friendly Service</h3>
                <p className="text-sm text-muted-foreground">Free child seats available. Spacious vehicles for families with all their beach holiday luggage.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Local Expertise</h3>
                <p className="text-sm text-muted-foreground">Our drivers know every hotel on the Turkish Riviera. They'll get you there by the fastest route.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Antalya Airport Transfer Destinations</h2>
          <p className="text-muted-foreground mb-6">We cover all resort areas along the beautiful Turkish Riviera:</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {destinations.map((dest) => (
              <div
                key={dest}
                className="flex items-center gap-2 bg-card p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-sm font-medium">{dest}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Resort Areas Section */}
        <section className="bg-secondary/50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Popular Antalya Airport Transfer Routes</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card p-5 rounded-xl border border-border">
              <h3 className="font-bold mb-2">Antalya to Belek Transfer</h3>
              <p className="text-sm text-muted-foreground mb-2">35 km • 30-40 minutes</p>
              <p className="text-sm text-muted-foreground">Perfect for golf enthusiasts and families heading to Belek's famous all-inclusive resorts. Quick and comfortable journey along the coastal road.</p>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border">
              <h3 className="font-bold mb-2">Antalya to Side Transfer</h3>
              <p className="text-sm text-muted-foreground mb-2">75 km • 50-60 minutes</p>
              <p className="text-sm text-muted-foreground">Heading to the ancient city of Side? Our private transfer gets you to this beautiful resort town comfortably and quickly.</p>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border">
              <h3 className="font-bold mb-2">Antalya to Alanya Transfer</h3>
              <p className="text-sm text-muted-foreground mb-2">130 km • 2 hours</p>
              <p className="text-sm text-muted-foreground">The longest but most scenic route. Enjoy views of the Mediterranean as we drive you to Alanya's beautiful beaches and historic castle.</p>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border">
              <h3 className="font-bold mb-2">Antalya to Lara Transfer</h3>
              <p className="text-sm text-muted-foreground mb-2">15 km • 15-20 minutes</p>
              <p className="text-sm text-muted-foreground">Quick transfer to Lara Beach and its famous resort hotels. One of our most popular routes for luxury hotel guests.</p>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border">
              <h3 className="font-bold mb-2">Antalya to Kemer Transfer</h3>
              <p className="text-sm text-muted-foreground mb-2">45 km • 45-55 minutes</p>
              <p className="text-sm text-muted-foreground">Scenic drive through mountains to the pine-covered resort town of Kemer. Popular with European tourists.</p>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border">
              <h3 className="font-bold mb-2">Antalya to Kaş/Kalkan Transfer</h3>
              <p className="text-sm text-muted-foreground mb-2">180 km • 2.5-3 hours</p>
              <p className="text-sm text-muted-foreground">For those seeking the authentic Mediterranean charm of Kaş and Kalkan. A beautiful scenic drive worth every minute.</p>
            </div>
          </div>
        </section>

        {/* The Transfer Experience */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Your Antalya Airport Private Transfer Experience</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            When you book our Antalya Airport private transfer, here's what to expect: After landing at AYT and collecting your luggage, make your way to the arrivals hall. Your driver will be waiting with a name board, ready to greet you with a smile and a cold bottle of water.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Your driver will help with your luggage and escort you to your pre-assigned luxury Mercedes vehicle, parked in the nearby VIP parking area. Once settled in the cool, comfortable interior, you can relax while your driver takes the optimal route to your destination. All our vehicles are equipped with WiFi, so feel free to share your arrival photos with family back home.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Whether you're staying at a 5-star all-inclusive resort in Belek, a boutique hotel in Kalkan, or an apartment in Alanya, we know exactly where to take you. Our drivers are familiar with virtually every hotel on the Turkish Riviera coast and will deliver you right to the entrance - ready to start your vacation!
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Antalya Airport (AYT) is Turkey's busiest tourist airport, especially during summer months when charter flights arrive around the clock. Our 24/7 service means we're ready whenever your flight lands - even at 3 AM after a long delay. We track all flights in real-time, so there's never any stress about timing.
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
          <h2 className="text-2xl font-bold mb-4">Antalya Airport Private Transfer Prices</h2>
          <p className="text-muted-foreground mb-6">Fixed prices with no hidden fees – what you see is what you pay:</p>
          <PriceTable items={prices} title="Fixed Price Private Transfers from Antalya Airport" />
          <p className="text-sm text-muted-foreground mt-4">
            * Prices shown are starting prices for Mercedes Vito. Exact pricing depends on your specific hotel location. Contact us for a personalized quote.
          </p>
        </section>

        {/* Booking CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Antalya Airport Private Transfer Now</h3>
          <p className="mb-6 opacity-90">
            Instant WhatsApp confirmation. 24/7 service for all flights to Antalya Airport.
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi, I'd like to book a private Antalya Airport transfer. My flight details are:"
          />
        </div>

        {/* Additional Info */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Antalya Airport: Your Gateway to Paradise</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Antalya Airport (IATA: AYT) is located 13 km east of Antalya city center. It's one of Europe's busiest airports during summer, with charter flights arriving from across the continent. With two international terminals and excellent facilities, it's the starting point for millions of holidaymakers every year.
          </p>
          <h3 className="text-xl font-semibold mb-3">Antalya Airport Transfer Times:</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Antalya City/Konyaaltı:</strong> 15-20 minutes</li>
            <li><strong>Lara Beach:</strong> 15-20 minutes</li>
            <li><strong>Belek:</strong> 30-40 minutes</li>
            <li><strong>Side/Manavgat:</strong> 50-60 minutes</li>
            <li><strong>Alanya:</strong> 2 hours</li>
            <li><strong>Kemer:</strong> 45-55 minutes</li>
            <li><strong>Kaş/Kalkan:</strong> 2.5-3 hours</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Antalya Airport Private Transfer FAQ</h2>
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
            <Link to="/cyprus-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Cyprus Airport Transfer
            </Link>
            <Link to="/blog/antalya-airport-transfer-to-hotels" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Antalya Transfer Guide
            </Link>
            <Link to="/services" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              All Transfer Services
            </Link>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default AntalyaAirportTransferService;
