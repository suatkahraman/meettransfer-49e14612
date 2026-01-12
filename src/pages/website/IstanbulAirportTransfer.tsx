import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Clock, Shield, Star, Users, Plane, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Taksim", "Sultanahmet", "Galataport", "Kadıköy", "Levent",
  "Şişli", "Beşiktaş", "Nişantaşı", "Maslak", "Bakırköy"
];

const prices = [
  { from: "Istanbul Airport", to: "Taksim", price: "From €50" },
  { from: "Istanbul Airport", to: "Sultanahmet", price: "From €50" },
  { from: "Istanbul Airport", to: "Beşiktaş", price: "From €50" },
  { from: "Istanbul Airport", to: "Levent", price: "From €50" },
  { from: "Istanbul Airport", to: "Kadıköy", price: "From €65" },
  { from: "Istanbul Airport", to: "Üsküdar", price: "From €60" },
  { from: "Istanbul Airport", to: "Galataport", price: "From €50" },
  { from: "Istanbul Airport", to: "Bursa", price: "From €185" },
  { from: "Istanbul Airport", to: "Sapanca", price: "From €245" },
  { from: "Istanbul Airport", to: "Kartepe", price: "From €255" },
];

const faqItems = [
  {
    question: "How do I get from Istanbul Airport to the city center?",
    answer: "The best way to get from Istanbul Airport (IST) to the city center is by private transfer. Our professional drivers will meet you at the arrivals gate with a name board and take you directly to your destination in a comfortable Mercedes vehicle. The journey takes approximately 45-60 minutes depending on traffic and your final destination.",
  },
  {
    question: "How much does Istanbul Airport transfer cost?",
    answer: "Our Istanbul Airport transfer prices start from €50 for destinations like Taksim, Sultanahmet, and Beşiktaş. The price is fixed and includes meet & greet service, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes. No hidden fees or surge pricing.",
  },
  {
    question: "Is Istanbul Airport transfer safe and reliable?",
    answer: "Yes, our Istanbul Airport transfer service is completely safe and reliable. All our drivers are licensed professionals, vehicles are fully insured, and we track all flights in real-time. We have a 99.9% on-time pickup rate and thousands of 5-star reviews from satisfied customers.",
  },
  {
    question: "Can I book Istanbul Airport transfer for early morning or late night flights?",
    answer: "Absolutely! We provide 24/7 Istanbul Airport transfer service. Whether your flight arrives at 3 AM or departs at 5 AM, we will be there to pick you up. Our drivers are always punctual and professionally dressed.",
  },
  {
    question: "What happens if my flight is delayed?",
    answer: "We monitor all flights in real-time using advanced flight tracking technology. If your flight is delayed, we automatically adjust your pickup time at no extra charge. You don't need to call or notify us - we'll know and we'll be waiting when you land.",
  },
  {
    question: "How far in advance should I book my Istanbul Airport transfer?",
    answer: "We recommend booking at least 24 hours in advance to guarantee availability, especially during peak travel seasons. However, we also accept same-day bookings subject to vehicle availability. Book now to secure your preferred vehicle type.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Luxury 6-seater with leather interior, perfect for business travelers and families seeking premium comfort on their Istanbul Airport transfer.",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Water", "USB charger", "Climate control"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Family",
    description: "Spacious 7-seater ideal for families and groups, offering excellent value without compromising on comfort for your Istanbul Airport journey.",
    passengers: 7,
    luggage: 7,
    features: ["Comfortable seats", "WiFi", "Complimentary water", "USB chargers", "Air conditioning", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const IstanbulAirportTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Istanbul Airport Transfer | Private VIP Service from IST Airport | Meet Transfer"
        description="Book Istanbul Airport (IST) private transfer from €50. Professional meet & greet, flight tracking, luxury Mercedes vehicles. 24/7 service. Fixed prices, no hidden fees. Book now!"
        keywords="Istanbul Airport transfer, IST airport transfer, Istanbul Airport private transfer, IST to city center, Istanbul Airport VIP transfer, Istanbul Airport shuttle, Istanbul new airport transfer"
        canonicalPath="/istanbul-airport-transfer"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul Airport', 'IST', 'Taksim', 'Sultanahmet', 'Beşiktaş', 'Kadıköy'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Istanbul Airport Transfer', url: '/istanbul-airport-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Istanbul Airport Transfer Service',
            description: 'Premium private transfer from Istanbul Airport (IST) to city center with meet & greet',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg'],
            offers: { price: '50', priceCurrency: 'EUR' },
          },
        ]}
      />

      <PageHeader
        title="Istanbul Airport Transfer"
        subtitle="Premium Private Transfer from IST Airport to City Center"
        backgroundImage="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Main H1 Section */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Istanbul Airport Transfer: Your Gateway to Hassle-Free Travel
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Welcome to Meet Transfer's premium Istanbul Airport transfer service. When you land at Istanbul Airport (IST), the last thing you want is the stress of navigating public transport. Our professional private transfer service ensures you start your Turkish adventure in comfort and style, with a professional driver waiting just for you at the arrivals gate.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Istanbul Airport, officially known as Istanbul Havalimanı, is one of the world's largest airports and the main international gateway to Turkey. Located approximately 35 kilometers from the city center, it serves millions of passengers annually. Our Istanbul Airport transfer service has been perfected over years of experience, ensuring seamless journeys for business travelers, tourists, and families alike.
          </p>
        </section>

        {/* Why Choose Section */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Choose Our Istanbul Airport Transfer Service?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Plane className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Meet & Greet Service</h3>
                <p className="text-sm text-muted-foreground">Your driver waits at arrivals with your name on a board, ready to assist with luggage and guide you to your luxury vehicle.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Real-Time Flight Tracking</h3>
                <p className="text-sm text-muted-foreground">We monitor your flight 24/7. If it's early or delayed, we adjust automatically - no extra calls needed.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Fixed Prices, No Surprises</h3>
                <p className="text-sm text-muted-foreground">The price you see is the price you pay. No surge pricing, no hidden fees, no meters running in traffic.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Popular Istanbul Airport Transfer Destinations</h2>
          <p className="text-muted-foreground mb-6">We provide transfers from Istanbul Airport to all major neighborhoods and tourist destinations:</p>
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
          <h2 className="text-2xl font-bold mb-4">The Istanbul Airport Transfer Experience</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Your Istanbul Airport transfer experience begins before you even land. Once you book with us, you'll receive a confirmation with your driver's details and contact information. Our team monitors your flight status in real-time, ensuring your driver arrives precisely when needed.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            After collecting your luggage and passing through customs, you'll find your driver waiting in the arrivals hall with a professional name board. They'll assist with your bags and escort you to your pre-assigned luxury vehicle parked conveniently nearby.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            During your transfer from Istanbul Airport to your destination, enjoy complimentary WiFi to stay connected, chilled water to refresh after your flight, and USB charging ports to power up your devices. Our experienced drivers know Istanbul's streets intimately and will take the optimal route considering real-time traffic conditions.
          </p>
        </section>

        {/* Fleet Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Istanbul Airport Transfer Fleet</h2>
          <p className="text-muted-foreground mb-6">All our vehicles are meticulously maintained Mercedes models, ensuring your comfort and safety throughout your Istanbul Airport transfer:</p>
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
          <h2 className="text-2xl font-bold mb-4">Istanbul Airport Transfer Prices</h2>
          <p className="text-muted-foreground mb-6">All prices are fixed and include meet & greet, flight tracking, tolls, and taxes:</p>
          <PriceTable items={prices} title="Transfer Routes from Istanbul Airport" />
        </section>

        {/* Booking CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Istanbul Airport Transfer Now</h3>
          <p className="mb-6 opacity-90">
            Get instant confirmation via WhatsApp. Available 24/7 for all flights.
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi, I'd like to book an Istanbul Airport transfer. My flight details are:"
          />
        </div>

        {/* Additional Info */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Istanbul Airport: Essential Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Istanbul Airport (IATA: IST, ICAO: LTFM) opened in 2019 and quickly became one of the world's busiest airports. With state-of-the-art facilities and excellent connectivity, it serves as Turkish Airlines' main hub and welcomes flights from virtually every corner of the globe.
          </p>
          <h3 className="text-xl font-semibold mb-3">Distance from Istanbul Airport to Popular Destinations:</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Taksim Square:</strong> 40 km (45-60 minutes)</li>
            <li><strong>Sultanahmet/Old City:</strong> 45 km (50-70 minutes)</li>
            <li><strong>Beşiktaş:</strong> 38 km (40-55 minutes)</li>
            <li><strong>Kadıköy (Asian Side):</strong> 55 km (60-80 minutes)</li>
            <li><strong>Galataport Cruise Terminal:</strong> 42 km (45-65 minutes)</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Istanbul Airport Transfer FAQ</h2>
          <FAQSection items={faqItems} />
        </section>

        {/* Internal Links */}
        <section className="bg-secondary rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">Explore More Transfer Services</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/istanbul-airport-hotel-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Istanbul Airport to Hotel Transfer
            </Link>
            <Link to="/ist-city-center-vip-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              IST City Center VIP Transfer
            </Link>
            <Link to="/sabiha-gokcen-private-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Sabiha Gökçen Private Transfer
            </Link>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default IstanbulAirportTransfer;
