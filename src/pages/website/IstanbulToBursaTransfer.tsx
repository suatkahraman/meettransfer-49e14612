import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Clock, Shield, Mountain, History, TreePine, Users, Star, CheckCircle, Route } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Bursa City Center", "Uludağ Mountain", "Cumalıkızık Village", "Mudanya",
  "Trilye", "Iznik", "Green Mosque", "Grand Bazaar Bursa", "Teleferik",
  "Bursa Ulu Cami", "Koza Han", "Thermal Spas"
];

const prices = [
  { from: "Istanbul Airport (IST)", to: "Bursa City Center", price: "From €185" },
  { from: "Istanbul Airport (IST)", to: "Uludağ Mountain", price: "From €210" },
  { from: "Sabiha Gökçen (SAW)", to: "Bursa City Center", price: "From €165" },
  { from: "Istanbul Taksim", to: "Bursa City Center", price: "From €175" },
  { from: "Istanbul Sultanahmet", to: "Bursa City Center", price: "From €175" },
  { from: "Bursa City Center", to: "Istanbul Airport (IST)", price: "From €185" },
  { from: "Bursa City Center", to: "Iznik", price: "From €85" },
  { from: "Bursa City Center", to: "Cumalıkızık", price: "From €45" },
];

const faqItems = [
  {
    question: "How long does the transfer from Istanbul to Bursa take?",
    answer: "The private transfer from Istanbul to Bursa takes approximately 2.5 to 3 hours depending on traffic and your exact pickup/dropoff locations. From Istanbul Airport (IST), it's about 2.5 hours. From Sabiha Gökçen (SAW), it's slightly shorter at around 2 hours since it's on the Asian side closer to Bursa.",
  },
  {
    question: "Can I do a day trip from Istanbul to Bursa?",
    answer: "Absolutely! A Bursa day trip from Istanbul is very popular. We pick you up in the morning, take you to Bursa's highlights (Green Mosque, Grand Bazaar, Uludağ cable car, Cumalıkızık village), and return you to Istanbul in the evening. It's the perfect way to experience Turkey's first Ottoman capital.",
  },
  {
    question: "How much does Istanbul to Bursa private transfer cost?",
    answer: "Our Istanbul to Bursa private transfer starts from €185 from Istanbul Airport and €175 from city center locations like Taksim or Sultanahmet. The price is fixed, all-inclusive, and there are no hidden fees. We also offer day tour packages that include the transfer plus guided sightseeing.",
  },
  {
    question: "What is the best route from Istanbul to Bursa?",
    answer: "We take the scenic route via the Osmangazi Bridge (one of the world's longest suspension bridges), which significantly reduces travel time. This route offers beautiful views of the Marmara Sea and is the fastest, most comfortable way to travel between the two cities.",
  },
  {
    question: "Do you offer Uludağ Mountain transfers?",
    answer: "Yes, we provide private transfers to Uludağ Mountain, Turkey's most popular ski resort. Whether you're visiting for winter skiing or summer hiking, we'll take you directly to your hotel or the Teleferik (cable car) station. The journey from Bursa city center to Uludağ takes about 45 minutes.",
  },
  {
    question: "Can I stop at places along the way from Istanbul to Bursa?",
    answer: "Of course! We're happy to make stops along the way. Popular stops include Iznik (famous for its tiles and lake), the Osmangazi Bridge viewpoint, or the charming coastal town of Mudanya. Just let us know your preferences when booking.",
  },
  {
    question: "Is Istanbul to Bursa transfer suitable for families with children?",
    answer: "Yes, our Istanbul to Bursa transfer is perfect for families. Our spacious Mercedes vehicles have plenty of room for car seats (provided free upon request), luggage, and all your travel essentials. Children often enjoy the scenic drive, especially crossing the impressive Osmangazi Bridge.",
  },
  {
    question: "What can I see in Bursa during a day trip?",
    answer: "Bursa offers incredible attractions: the stunning Green Mosque and Tomb, the historic Koza Han silk market, Cumalıkızık UNESCO village, the Uludağ cable car ride, traditional Turkish baths, and the famous Iskender kebab. We can arrange a guided tour to maximize your time.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Luxury 6-seater perfect for the scenic journey from Istanbul to Bursa. Comfortable leather seats make the 2.5-hour drive feel like a breeze. Enjoy WiFi, USB charging, and complimentary water.",
    passengers: 6,
    luggage: 6,
    features: ["Premium leather seats", "Powerful AC", "Free WiFi", "Cold water", "USB chargers", "Panoramic views"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Family",
    description: "Spacious 7-seater ideal for larger families and groups making the Istanbul to Bursa journey. Extra legroom ensures everyone arrives comfortable and ready to explore.",
    passengers: 7,
    luggage: 7,
    features: ["Comfortable seats", "Powerful AC", "Free WiFi", "Complimentary water", "USB chargers", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const IstanbulToBursaTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Istanbul to Bursa Transfer | Private Transfer Service – Meet Transfer"
        description="Book Istanbul to Bursa private transfer from €175. Professional door-to-door service, scenic route via Osmangazi Bridge. Day trips available. Luxury Mercedes vehicles, 24/7 service. Fixed prices."
        keywords="istanbul to bursa transfer, istanbul bursa private transfer, istanbul airport to bursa, bursa day trip from istanbul, istanbul to uludag transfer, istanbul bursa shuttle, bursa private car service, cumalikizik tour"
        canonicalPath="/istanbul-to-bursa-transfer"
        ogImage="https://meettransfer.app/og/istanbul-bursa-og.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul', 'Bursa', 'Uludağ', 'Cumalıkızık', 'Iznik', 'Mudanya'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Services', url: '/services' },
              { name: 'Istanbul to Bursa Private Transfer', url: '/istanbul-to-bursa-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
        ]}
      />

      <PageHeader
        title="Istanbul to Bursa Private Transfer"
        subtitle="Comfortable Intercity Transfer to Turkey's First Ottoman Capital"
        backgroundImage="https://images.unsplash.com/photo-1589561454226-796a8aa89b05?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Content Section */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Istanbul to Bursa Private Transfer
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6 font-medium">
            Comfortable Intercity Transfer to Turkey's First Ottoman Capital
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Looking for a comfortable and reliable Istanbul to Bursa private transfer? Meet Transfer provides professional door-to-door transportation between Istanbul and Bursa, Turkey's first Ottoman capital. Whether you're planning a day trip from Istanbul or need an airport transfer to Bursa, we offer the most scenic and comfortable journey via the impressive Osmangazi Bridge.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            With Meet Transfer, you avoid crowded buses and complicated ferry connections. Your private driver will pick you up from your Istanbul hotel, airport, or any location and take you directly to Bursa in a luxury Mercedes vehicle. Enjoy the stunning views of the Marmara Sea as you cross one of the world's longest suspension bridges – a journey that's part of the experience itself.
          </p>
        </section>

        {/* Route Highlights */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" />
            The Istanbul to Bursa Journey
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Scenic Route via Osmangazi Bridge</h3>
              <p className="text-muted-foreground mb-4">
                Our Istanbul to Bursa transfer takes the modern route via the Osmangazi Bridge, one of the world's longest suspension bridges spanning the Gulf of İzmit. This impressive engineering marvel cuts travel time significantly while offering breathtaking views.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> 2.5-3 hour journey time</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Stunning Marmara Sea views</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Photo stops available</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> All tolls included in price</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Why Choose Private Transfer?</h3>
              <p className="text-muted-foreground mb-4">
                The traditional route involves ferry crossings and multiple connections. Our direct private transfer is faster, more comfortable, and surprisingly affordable for groups.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Door-to-door service</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> No ferry queues or connections</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Flexible departure times</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Stop for photos along the way</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Why Visit Bursa */}
        <section className="bg-secondary/50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Visit Bursa?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">First Ottoman Capital</h3>
                <p className="text-sm text-muted-foreground">Discover Turkey's first Ottoman capital with stunning mosques, historic bazaars, and UNESCO World Heritage sites like Cumalıkızık village.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Mountain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Uludağ Mountain</h3>
                <p className="text-sm text-muted-foreground">Turkey's premier ski resort in winter, beautiful hiking destination in summer. Take the famous Teleferik cable car for panoramic views.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <TreePine className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Thermal Spas</h3>
                <p className="text-sm text-muted-foreground">Famous for natural hot springs and thermal baths. Bursa's Çekirge district has been a spa destination for centuries.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Destinations in Bursa */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Popular Bursa Destinations</h2>
          <p className="text-muted-foreground mb-6">We provide private transfers to all destinations in and around Bursa:</p>
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

        {/* Day Trip Section */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Bursa Day Trip from Istanbul</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A Bursa day trip from Istanbul is one of the most popular excursions for visitors to Turkey. We pick you up from your Istanbul hotel early in the morning and take you on an unforgettable journey to Turkey's first Ottoman capital.
              </p>
              <h3 className="font-semibold text-lg mb-3">Typical Day Trip Itinerary:</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary min-w-[80px]">08:00</span>
                  <span>Pickup from Istanbul hotel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary min-w-[80px]">10:30</span>
                  <span>Arrive Bursa, visit Green Mosque & Tomb</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary min-w-[80px]">12:00</span>
                  <span>Lunch - Famous Iskender Kebab</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary min-w-[80px]">13:30</span>
                  <span>Koza Han & Grand Bazaar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary min-w-[80px]">15:00</span>
                  <span>Teleferik (Cable Car) to Uludağ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary min-w-[80px]">17:00</span>
                  <span>Cumalıkızık UNESCO Village</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary min-w-[80px]">19:30</span>
                  <span>Return to Istanbul</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">What's Included:</h3>
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Luxury Mercedes private transfer</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Professional English-speaking driver</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> All tolls and parking fees</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Free WiFi and water</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Flexible itinerary</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Photo stops along the way</li>
              </ul>
              <p className="text-sm text-muted-foreground italic">
                Note: Entry tickets and meals are not included. Guide services available upon request.
              </p>
            </div>
          </div>
        </section>

        {/* Fleet Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Istanbul to Bursa Transfer Fleet</h2>
          <p className="text-muted-foreground mb-6">Comfortable vehicles for the scenic journey:</p>
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
          <h2 className="text-2xl font-bold mb-4">Istanbul to Bursa Private Transfer Prices</h2>
          <p className="text-muted-foreground mb-6">Fixed prices with no hidden fees. All tolls included:</p>
          <PriceTable items={prices} title="Private Transfer Routes" />
          <p className="text-sm text-muted-foreground mt-4">
            * Prices shown are for Mercedes Vito. Day tour packages with guide available upon request.
          </p>
        </section>

        {/* Booking CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Istanbul to Bursa Transfer Now</h3>
          <p className="mb-6 opacity-90">
            Get instant confirmation via WhatsApp. Day trips and one-way transfers available 24/7.
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi, I'd like to book an Istanbul to Bursa private transfer. My travel details are:"
          />
        </div>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Istanbul to Bursa Transfer FAQ</h2>
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
            <Link to="/blog/istanbul-bursa-day-tour-guide" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Bursa Day Tour Guide
            </Link>
            <Link to="/bursa-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Bursa Transfer Services
            </Link>
            <Link to="/cappadocia-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Cappadocia Transfer
            </Link>
            <Link to="/blog/intercity-transfer-turkey" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Intercity Transfers Turkey
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

export default IstanbulToBursaTransfer;
