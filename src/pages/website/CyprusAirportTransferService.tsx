import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Clock, Shield, Plane, Sun, Globe, Users, Star, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Kyrenia (Girne)", "Famagusta (Gazimağusa)", "Nicosia (Lefkoşa)",
  "Paphos", "Limassol", "Ayia Napa", "Protaras", "Larnaca City",
  "Coral Bay", "Troodos Mountains", "Polis", "Karpaz Peninsula"
];

const prices = [
  { from: "Larnaca Airport (LCA)", to: "Ayia Napa", price: "Request Quote" },
  { from: "Larnaca Airport (LCA)", to: "Limassol", price: "Request Quote" },
  { from: "Larnaca Airport (LCA)", to: "Paphos", price: "Request Quote" },
  { from: "Larnaca Airport (LCA)", to: "Nicosia", price: "Request Quote" },
  { from: "Paphos Airport (PFO)", to: "Limassol", price: "Request Quote" },
  { from: "Paphos Airport (PFO)", to: "Coral Bay", price: "Request Quote" },
  { from: "Ercan Airport (ECN)", to: "Kyrenia", price: "Request Quote" },
  { from: "Ercan Airport (ECN)", to: "Famagusta", price: "Request Quote" },
];

const faqItems = [
  {
    question: "Which airports do you serve in Cyprus?",
    answer: "We provide private airport transfers from all three major Cyprus airports: Larnaca International Airport (LCA), Paphos International Airport (PFO), and Ercan Airport (ECN) in Northern Cyprus. Our service covers the entire island, including both the Republic of Cyprus and Northern Cyprus.",
  },
  {
    question: "How long is the transfer from Larnaca Airport to Ayia Napa?",
    answer: "The private transfer from Larnaca International Airport to Ayia Napa takes approximately 40-50 minutes depending on traffic conditions. Our drivers know the fastest routes and will get you to your resort or hotel quickly and comfortably.",
  },
  {
    question: "Can you arrange private transfers across the border in Cyprus?",
    answer: "Yes, we can arrange private cross-border transfers between the Republic of Cyprus and Northern Cyprus. Please note that border crossing procedures apply at checkpoints, but our experienced drivers will guide you through the process smoothly.",
  },
  {
    question: "Do you offer transfers to Troodos Mountains?",
    answer: "Yes, we provide comfortable private transfers to Troodos Mountains and all mountain villages including Platres, Kakopetria, and Pedoulas. Our drivers are experienced with mountain roads and will ensure a safe, scenic journey.",
  },
  {
    question: "Are child seats available for Cyprus airport transfers?",
    answer: "Yes, we provide child seats and booster seats free of charge upon request. Simply mention the ages of your children when booking, and we'll ensure appropriate safety seats are installed in your vehicle for a safe journey.",
  },
  {
    question: "What happens if my flight to Cyprus is delayed?",
    answer: "We monitor all flights in real-time. If your flight is delayed, we automatically adjust your pickup time at no extra charge. You don't need to call us - we'll be waiting when you land, no matter how late your flight arrives.",
  },
  {
    question: "Do you provide transfers from Ercan Airport in Northern Cyprus?",
    answer: "Yes, we offer private transfers from Ercan Airport (ECN) to all destinations in Northern Cyprus including Kyrenia (Girne), Famagusta (Gazimağusa), and Nicosia (Lefkoşa). We also provide cross-border transfers to South Cyprus.",
  },
  {
    question: "How far in advance should I book my Cyprus airport transfer?",
    answer: "We recommend booking at least 24-48 hours in advance, especially during peak tourist season (June-September). However, we also accept last-minute bookings subject to vehicle availability. Early booking guarantees your preferred vehicle type.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Comfortable 6-seater perfect for couples and small families exploring Cyprus. Features leather seats, powerful AC (essential for Cyprus summer), WiFi, and complimentary water.",
    passengers: 6,
    luggage: 6,
    features: ["Premium leather seats", "Powerful AC", "Free WiFi", "Cold water", "USB chargers", "Tinted windows"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Family",
    description: "Spacious 7-seater ideal for larger families heading to Cyprus beach resorts. Plenty of space for luggage and all the beach essentials for your Mediterranean holiday.",
    passengers: 7,
    luggage: 7,
    features: ["Comfortable seats", "Powerful AC", "Free WiFi", "Complimentary water", "USB chargers", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const CyprusAirportTransferService = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Cyprus Airport Transfer | Private Transfer Service – Meet Transfer"
        description="Book Cyprus airport private transfer from Larnaca, Paphos & Ercan airports. Professional meet & greet, 24/7 service. Transfers to Ayia Napa, Limassol, Kyrenia & all destinations. Fixed prices, no hidden fees."
        keywords="cyprus airport transfer service, larnaca airport transfer, paphos airport transfer, ercan airport transfer, cyprus private transfer, ayia napa transfer, limassol transfer, kyrenia transfer, north cyprus transfer, cyprus airport shuttle"
        canonicalPath="/cyprus-airport-transfer"
        ogImage="https://meettransfer.app/og/cyprus-airport-og.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Cyprus', 'Larnaca Airport', 'Paphos Airport', 'Ercan Airport', 'Ayia Napa', 'Limassol', 'Kyrenia', 'Famagusta', 'Northern Cyprus'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Services', url: '/services' },
              { name: 'Cyprus Airport Private Transfer', url: '/cyprus-airport-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
        ]}
      />

      <PageHeader
        title="Cyprus Airport Private Transfer"
        subtitle="Reliable & Comfortable Airport Transfer Across Cyprus"
        backgroundImage="https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Content Section */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Cyprus Airport Private Transfer
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6 font-medium">
            Reliable & Comfortable Airport Transfer Service Across Cyprus
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Looking for a safe and reliable Cyprus airport private transfer? Meet Transfer provides professional door-to-door transportation from all Cyprus airports - Larnaca (LCA), Paphos (PFO), and Ercan (ECN) - to hotels, resorts, and all destinations across the island. Enjoy a stress-free journey with fixed prices, modern air-conditioned vehicles, and 24/7 customer support.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            With Meet Transfer, you avoid the hassle of shared shuttles, taxi negotiations, and language barriers. Your private driver will be waiting at the airport with a name sign and will take you directly to your destination - whether it's a beach resort in Ayia Napa, a hotel in Limassol, or a villa in Kyrenia. We cover both the Republic of Cyprus and Northern Cyprus with the same high-quality service.
          </p>
        </section>

        {/* Airports Section */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            Cyprus Airports We Serve
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-secondary/50 p-5 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-primary">LCA</span>
                <span className="text-sm font-medium">Larnaca Airport</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Main international airport of Republic of Cyprus, serving the eastern and central regions.</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> 40 min to Ayia Napa</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> 45 min to Limassol</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> 35 min to Nicosia</li>
              </ul>
            </div>
            <div className="bg-secondary/50 p-5 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-primary">PFO</span>
                <span className="text-sm font-medium">Paphos Airport</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Serves the western region including Paphos, Coral Bay, and western Limassol.</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> 15 min to Paphos City</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> 25 min to Coral Bay</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> 55 min to Limassol</li>
              </ul>
            </div>
            <div className="bg-secondary/50 p-5 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-primary">ECN</span>
                <span className="text-sm font-medium">Ercan Airport</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Main airport in Northern Cyprus, serving Kyrenia, Famagusta, and North Nicosia.</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> 30 min to Kyrenia</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> 45 min to Famagusta</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> 15 min to N. Nicosia</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="bg-secondary/50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Choose Our Cyprus Airport Private Transfer?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Island-Wide Coverage</h3>
                <p className="text-sm text-muted-foreground">Service to all destinations across Cyprus, including Northern Cyprus. One company for the entire island.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sun className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Local Expertise</h3>
                <p className="text-sm text-muted-foreground">Drivers who know every beach, village, and hotel in Cyprus. Get insider tips on the best spots!</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cross-Border Service</h3>
                <p className="text-sm text-muted-foreground">Seamless transfers between South and North Cyprus. We handle the border crossing smoothly.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">24/7 Flight Tracking</h3>
                <p className="text-sm text-muted-foreground">We monitor all flights. Delays? No problem - we adjust automatically at no extra cost.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Family-Friendly</h3>
                <p className="text-sm text-muted-foreground">Free child seats available. Spacious vehicles for families with all their beach holiday gear.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Fixed Prices</h3>
                <p className="text-sm text-muted-foreground">No surprises. The price we quote is the price you pay. No hidden fees or surge pricing.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Cyprus Airport Transfer Destinations</h2>
          <p className="text-muted-foreground mb-6">We provide private transfers to all popular destinations across Cyprus:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

        {/* Popular Routes */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Popular Cyprus Airport Transfer Routes</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-secondary/50 p-5 rounded-xl">
              <h3 className="font-bold mb-2">Larnaca to Ayia Napa</h3>
              <p className="text-sm text-muted-foreground mb-2">50 km • 40-50 minutes</p>
              <p className="text-sm text-muted-foreground">The most popular route for party-goers and beach lovers heading to Cyprus's famous resort town.</p>
            </div>
            <div className="bg-secondary/50 p-5 rounded-xl">
              <h3 className="font-bold mb-2">Larnaca to Protaras</h3>
              <p className="text-sm text-muted-foreground mb-2">60 km • 50-60 minutes</p>
              <p className="text-sm text-muted-foreground">Perfect for families seeking the beautiful beaches and calm waters of Protaras.</p>
            </div>
            <div className="bg-secondary/50 p-5 rounded-xl">
              <h3 className="font-bold mb-2">Larnaca to Limassol</h3>
              <p className="text-sm text-muted-foreground mb-2">70 km • 45-55 minutes</p>
              <p className="text-sm text-muted-foreground">Quick transfer to Cyprus's second-largest city and its famous promenade and marina.</p>
            </div>
            <div className="bg-secondary/50 p-5 rounded-xl">
              <h3 className="font-bold mb-2">Paphos to Coral Bay</h3>
              <p className="text-sm text-muted-foreground mb-2">15 km • 20-25 minutes</p>
              <p className="text-sm text-muted-foreground">Short transfer to one of Cyprus's most beautiful beach areas near Paphos.</p>
            </div>
            <div className="bg-secondary/50 p-5 rounded-xl">
              <h3 className="font-bold mb-2">Ercan to Kyrenia</h3>
              <p className="text-sm text-muted-foreground mb-2">40 km • 30-40 minutes</p>
              <p className="text-sm text-muted-foreground">Direct transfer to North Cyprus's beautiful harbor town and its historic castle.</p>
            </div>
            <div className="bg-secondary/50 p-5 rounded-xl">
              <h3 className="font-bold mb-2">Ercan to Famagusta</h3>
              <p className="text-sm text-muted-foreground mb-2">50 km • 45-55 minutes</p>
              <p className="text-sm text-muted-foreground">Transfer to the historic walled city and its beautiful beaches in North Cyprus.</p>
            </div>
          </div>
        </section>

        {/* The Transfer Experience */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Your Cyprus Airport Private Transfer Experience</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            When you book our Cyprus airport private transfer, here's what awaits you: After landing at Larnaca, Paphos, or Ercan airport and collecting your luggage, make your way to the arrivals hall. Your driver will be waiting with a name board, ready to greet you and help with your bags.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Step into your air-conditioned Mercedes vehicle - a welcome relief from the Cyprus summer heat! Cold water bottles await, WiFi is available for staying connected, and you can relax while your driver takes the optimal route to your destination. Our drivers know every corner of Cyprus and will share local tips if you're interested.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Whether you're heading to a beachfront hotel in Ayia Napa, a villa in Paphos, or a boutique property in Kyrenia, we'll deliver you right to the door. For cross-border transfers between South and North Cyprus, our drivers are experienced with the checkpoint procedures and will make the crossing as smooth as possible.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Cyprus is a year-round destination, and we operate 24/7 regardless of your arrival time. Early morning flight? Late-night charter? No problem - we track all flights and adjust for any delays automatically.
          </p>
        </section>

        {/* Fleet Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Cyprus Airport Transfer Fleet</h2>
          <p className="text-muted-foreground mb-6">Travel in comfort with our well-maintained Mercedes fleet, perfect for the Cyprus climate:</p>
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
          <h2 className="text-2xl font-bold mb-4">Cyprus Airport Private Transfer Prices</h2>
          <p className="text-muted-foreground mb-6">Fixed prices with no hidden fees. Request a personalized quote for your route:</p>
          <PriceTable items={prices} title="Private Transfer Routes from Cyprus Airports" />
          <p className="text-sm text-muted-foreground mt-4">
            * Prices vary by route and vehicle type. Contact us for an instant quote for your specific journey.
          </p>
        </section>

        {/* Booking CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Cyprus Airport Private Transfer Now</h3>
          <p className="mb-6 opacity-90">
            Get instant confirmation via WhatsApp. Available 24/7 for all flights to Cyprus airports.
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi, I'd like to book a private Cyprus airport transfer. My flight details are:"
          />
        </div>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Cyprus Airport Private Transfer FAQ</h2>
          <FAQSection items={faqItems} />
        </section>

        {/* Internal Links */}
        <section className="bg-secondary rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">Explore More Transfer Services</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/north-cyprus-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              North Cyprus Transfers
            </Link>
            <Link to="/blog/cyprus-airport-transfer-guide" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Cyprus Transfer Guide
            </Link>
            <Link to="/istanbul-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Istanbul Airport Transfer
            </Link>
            <Link to="/antalya-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Antalya Airport Transfer
            </Link>
            <Link to="/dubai-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Dubai Airport Transfer
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

export default CyprusAirportTransferService;
