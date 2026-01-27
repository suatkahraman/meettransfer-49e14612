import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Clock, Shield, Star, Plane, CheckCircle, Users, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Taksim", "Sultanahmet", "Galataport", "Kadıköy", "Levent",
  "Şişli", "Beşiktaş", "Nişantaşı", "Maslak", "Bakırköy",
  "Fatih", "Eminönü", "Karaköy", "Beyoğlu", "Üsküdar"
];

const prices = [
  { from: "Istanbul Airport (IST)", to: "Taksim", price: "From €50" },
  { from: "Istanbul Airport (IST)", to: "Sultanahmet", price: "From €50" },
  { from: "Istanbul Airport (IST)", to: "Beşiktaş", price: "From €50" },
  { from: "Istanbul Airport (IST)", to: "Levent / Maslak", price: "From €50" },
  { from: "Istanbul Airport (IST)", to: "Kadıköy (Asian Side)", price: "From €65" },
  { from: "Istanbul Airport (IST)", to: "Üsküdar", price: "From €60" },
  { from: "Sabiha Gökçen (SAW)", to: "Taksim", price: "From €65" },
  { from: "Sabiha Gökçen (SAW)", to: "Sultanahmet", price: "From €65" },
  { from: "Sabiha Gökçen (SAW)", to: "Kadıköy", price: "From €50" },
];

const faqItems = [
  {
    question: "How do I get from Istanbul Airport to the city center?",
    answer: "The best way to get from Istanbul Airport (IST) to the city center is by private transfer. Our professional drivers will meet you at the arrivals gate with a name board and take you directly to your destination in a comfortable Mercedes vehicle. The journey takes approximately 45-60 minutes depending on traffic and your final destination. Unlike public transport or taxis, our service offers fixed prices with no surprises.",
  },
  {
    question: "How much does Istanbul Airport private transfer cost?",
    answer: "Our Istanbul Airport private transfer prices start from €50 for destinations like Taksim, Sultanahmet, and Beşiktaş. The price is fixed and includes meet & greet service, flight tracking, professional driver, luxury vehicle, complimentary water, WiFi, and all taxes. There are no hidden fees or surge pricing, even during peak hours or holidays.",
  },
  {
    question: "Is Istanbul Airport transfer safe and reliable?",
    answer: "Yes, our Istanbul Airport private transfer service is completely safe and reliable. All our drivers are licensed professionals with years of experience, vehicles are fully insured and regularly maintained, and we track all flights in real-time. We have a 99.9% on-time pickup rate and thousands of 5-star reviews from satisfied customers worldwide.",
  },
  {
    question: "Can I book Istanbul Airport transfer for early morning or late night flights?",
    answer: "Absolutely! We provide 24/7 Istanbul Airport private transfer service. Whether your flight arrives at 3 AM or departs at 5 AM, we will be there to pick you up. Our drivers are always punctual, professionally dressed, and ready to assist with your luggage at any hour.",
  },
  {
    question: "What happens if my flight is delayed?",
    answer: "We monitor all flights in real-time using advanced flight tracking technology. If your flight is delayed, we automatically adjust your pickup time at no extra charge. You don't need to call or notify us - we'll know and we'll be waiting when you land. This service is included free of charge in all our transfers.",
  },
  {
    question: "Do you offer transfers from Sabiha Gökçen Airport as well?",
    answer: "Yes, we provide private transfer services from both Istanbul Airport (IST) and Sabiha Gökçen Airport (SAW). Both airports are fully covered with the same high-quality service, professional drivers, and luxury vehicles. Prices may vary slightly due to distance differences.",
  },
  {
    question: "What vehicles do you use for Istanbul Airport transfers?",
    answer: "We use premium Mercedes vehicles for all our Istanbul Airport transfers. Our fleet includes Mercedes Vito VIP (6 passengers) and Mercedes Vito Family (7 passengers). All vehicles feature leather seats, air conditioning, WiFi, USB chargers, and complimentary water bottles.",
  },
  {
    question: "How far in advance should I book my Istanbul Airport transfer?",
    answer: "We recommend booking at least 24 hours in advance to guarantee availability, especially during peak travel seasons (summer months, holidays, and major events). However, we also accept same-day bookings subject to vehicle availability. Early booking also allows you to lock in your price.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Luxury 6-seater with premium leather interior, perfect for business travelers and families seeking maximum comfort on their Istanbul Airport private transfer experience.",
    passengers: 6,
    luggage: 6,
    features: ["Premium leather seats", "Free WiFi", "Complimentary water", "USB chargers", "Climate control", "Tinted windows"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Family",
    description: "Spacious 7-seater ideal for larger families and groups, offering excellent value without compromising on comfort for your Istanbul Airport journey.",
    passengers: 7,
    luggage: 7,
    features: ["Comfortable seats", "Free WiFi", "Complimentary water", "USB chargers", "Air conditioning", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const IstanbulAirportTransferService = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Istanbul Airport Transfer | Private Transfer Service – Meet Transfer"
        description="Book Istanbul Airport private transfer from €50. Professional meet & greet at IST & SAW airports. Luxury Mercedes vehicles, 24/7 service. Fixed prices, no hidden fees. Book your Istanbul Airport private transfer now!"
        keywords="private airport transfer istanbul, istanbul airport transfer, IST airport private transfer, istanbul airport shuttle, istanbul new airport transfer, sabiha gokcen private transfer, istanbul airport to city center, istanbul airport taxi alternative"
        canonicalPath="/istanbul-airport-transfer"
        ogImage="https://meettransfer.app/og/istanbul-airport-og.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness', includeRating: false },
          { type: 'TransportationService', areaServed: ['Istanbul Airport', 'IST', 'Sabiha Gökçen', 'SAW', 'Taksim', 'Sultanahmet', 'Beşiktaş', 'Kadıköy'] },
          {
            type: 'WebPage',
            name: 'Istanbul Airport Private Transfer | Meet Transfer',
            description: 'Book Istanbul Airport private transfer from €50. Professional meet & greet at IST & SAW airports.',
            url: 'https://meettransfer.app/istanbul-airport-transfer',
            breadcrumb: [
              { name: 'Home', url: '/' },
              { name: 'Services', url: '/services' },
              { name: 'Istanbul Airport Transfer', url: '/istanbul-airport-transfer' },
            ],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Services', url: '/services' },
              { name: 'Istanbul Airport Private Transfer', url: '/istanbul-airport-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
        ]}
      />

      <PageHeader
        title="Istanbul Airport Private Transfer"
        subtitle="Reliable & Comfortable Airport Transfer in Istanbul"
        backgroundImage="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Content Section */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Istanbul Airport Private Transfer
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6 font-medium">
            Reliable & Comfortable Airport Transfer in Istanbul
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Looking for a safe and reliable Istanbul airport private transfer? Meet Transfer provides professional door-to-door transportation from Istanbul Airport (IST) and Sabiha Gökçen Airport (SAW) to hotels, city centers, and all districts of Istanbul. Enjoy a stress-free journey with fixed prices, modern vehicles, and 24/7 customer support.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            With Meet Transfer, you avoid taxi queues, hidden fees, and language problems. Your private driver will be waiting for you at the airport with a name sign and will take you directly to your destination in comfort and safety.
          </p>
        </section>

        {/* Key Benefits */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Choose Our Istanbul Airport Private Transfer?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Plane className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Professional Meet & Greet</h3>
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
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Professional Licensed Drivers</h3>
                <p className="text-sm text-muted-foreground">All our drivers are licensed professionals with years of experience navigating Istanbul's streets safely.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Luxury Mercedes Fleet</h3>
                <p className="text-sm text-muted-foreground">Travel in style with our premium Mercedes vehicles featuring leather seats, WiFi, and climate control.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Easy Online Booking</h3>
                <p className="text-sm text-muted-foreground">Book in 2 minutes via WhatsApp or our website. Instant confirmation and easy payment options.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Airports We Serve */}
        <section className="bg-secondary/50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Istanbul Airports We Serve</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Plane className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Istanbul Airport (IST)</h3>
                  <p className="text-sm text-muted-foreground">Main International Airport</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Located 35 km from city center. One of the world's largest airports, serving as Turkish Airlines' main hub. Our private transfer takes 45-60 minutes to most destinations.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> 24/7 meet & greet service</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Flight tracking included</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Fixed prices from €50</li>
              </ul>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Plane className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sabiha Gökçen Airport (SAW)</h3>
                  <p className="text-sm text-muted-foreground">Asian Side Airport</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Located on the Asian side of Istanbul. Popular with budget airlines and domestic flights. Our private transfer takes 50-75 minutes to European side destinations.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Same premium service</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Bosphorus bridge crossing</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Asian side hotels closer</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Popular Istanbul Airport Transfer Destinations</h2>
          <p className="text-muted-foreground mb-6">We provide private transfers from Istanbul airports to all districts and neighborhoods:</p>
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

        {/* The Transfer Experience */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Your Istanbul Airport Private Transfer Experience</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Your Istanbul Airport private transfer experience begins before you even land. Once you book with us, you'll receive a confirmation with your driver's details and contact information. Our team monitors your flight status in real-time, ensuring your driver arrives precisely when needed.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            After collecting your luggage and passing through customs, you'll find your driver waiting in the arrivals hall with a professional name board. They'll assist with your bags and escort you to your pre-assigned luxury Mercedes vehicle parked conveniently nearby. No searching for taxis, no negotiating prices, no stress.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            During your transfer from Istanbul Airport to your destination, enjoy complimentary WiFi to stay connected with family or colleagues, chilled water to refresh after your flight, and USB charging ports to power up your devices. Our experienced drivers know Istanbul's streets intimately and will take the optimal route considering real-time traffic conditions.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Whether you're a business traveler heading to a meeting in Levent, a tourist exploring the wonders of Sultanahmet, or a family arriving for vacation, our Istanbul Airport private transfer service ensures you arrive relaxed and ready to enjoy your time in this magnificent city.
          </p>
        </section>

        {/* Fleet Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Istanbul Airport Transfer Fleet</h2>
          <p className="text-muted-foreground mb-6">All our vehicles are meticulously maintained Mercedes models, ensuring your comfort and safety throughout your Istanbul Airport private transfer:</p>
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
          <h2 className="text-2xl font-bold mb-4">Istanbul Airport Private Transfer Prices</h2>
          <p className="text-muted-foreground mb-6">All prices are fixed and include meet & greet, flight tracking, tolls, and taxes. No hidden fees:</p>
          <PriceTable items={prices} title="Private Transfer Routes from Istanbul Airports" />
          <p className="text-sm text-muted-foreground mt-4">
            * Prices shown are starting prices for Mercedes Vito. Exact pricing depends on your specific pickup and dropoff locations. Contact us for a personalized quote.
          </p>
        </section>

        {/* Booking CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Istanbul Airport Private Transfer Now</h3>
          <p className="mb-6 opacity-90">
            Get instant confirmation via WhatsApp. Available 24/7 for all flights from IST and SAW airports.
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi, I'd like to book a private Istanbul Airport transfer. My flight details are:"
          />
        </div>

        {/* Additional Info */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Istanbul Airport: Essential Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Istanbul Airport (IATA: IST, ICAO: LTFM) opened in 2019 and quickly became one of the world's busiest airports. With state-of-the-art facilities, excellent shopping, and world-class lounges, it serves as Turkish Airlines' main hub and welcomes flights from virtually every corner of the globe. The airport is designed to handle 200 million passengers annually at full capacity.
          </p>
          <h3 className="text-xl font-semibold mb-3">Distance from Istanbul Airport to Popular Destinations:</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Taksim Square:</strong> 40 km (45-60 minutes by private transfer)</li>
            <li><strong>Sultanahmet/Old City:</strong> 45 km (50-70 minutes by private transfer)</li>
            <li><strong>Beşiktaş:</strong> 38 km (40-55 minutes by private transfer)</li>
            <li><strong>Kadıköy (Asian Side):</strong> 55 km (60-80 minutes by private transfer)</li>
            <li><strong>Galataport Cruise Terminal:</strong> 42 km (45-65 minutes by private transfer)</li>
            <li><strong>Levent Business District:</strong> 35 km (35-50 minutes by private transfer)</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Istanbul Airport Private Transfer FAQ</h2>
          <FAQSection items={faqItems} />
        </section>

        {/* Internal Links */}
        <section className="bg-secondary rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">Explore More Transfer Services</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/istanbul-to-bursa-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Istanbul to Bursa Transfer
            </Link>
            <Link to="/sabiha-gokcen-private-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Sabiha Gökçen Private Transfer
            </Link>
            <Link to="/blog/istanbul-airport-to-city-best-way" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Istanbul Airport to City Guide
            </Link>
            <Link to="/antalya-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Antalya Airport Transfer
            </Link>
            <Link to="/cyprus-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Cyprus Airport Transfer
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

export default IstanbulAirportTransferService;
