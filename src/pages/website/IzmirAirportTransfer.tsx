import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Building2, History, Grape } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";

const destinations = [
  "Izmir Center", "Alsancak", "Konak", "Çeşme", "Alaçatı",
  "Kuşadası", "Selçuk", "Ephesus", "Foça", "Seferihisar"
];

const prices = [
  { from: "Izmir Airport", to: "Izmir Center", price: "Request Price" },
  { from: "Izmir Airport", to: "Alsancak", price: "Request Price" },
  { from: "Izmir Airport", to: "Çeşme", price: "Request Price" },
  { from: "Izmir Airport", to: "Alaçatı", price: "Request Price" },
  { from: "Izmir Airport", to: "Kuşadası", price: "Request Price" },
  { from: "Izmir Airport", to: "Selçuk/Ephesus", price: "Request Price" },
  { from: "Izmir Airport", to: "Foça", price: "Request Price" },
];

const faqItems = [
  {
    question: "How do I get from Izmir Airport to Çeşme?",
    answer: "Our private Izmir Airport transfer to Çeşme takes about 50-60 minutes via the new highway. We meet you at arrivals and drive you directly to your hotel or villa in Çeşme or Alaçatı. Fixed price: $55 to Çeşme, $50 to Alaçatı.",
  },
  {
    question: "Is there a transfer from Izmir Airport to Ephesus?",
    answer: "Yes! We provide transfers from Izmir Airport to Ephesus (Efes) and Selçuk. The journey takes about 45 minutes. Perfect for day trips or if you're staying near the ancient ruins. Price: $45.",
  },
  {
    question: "How much is Izmir Airport transfer to city center?",
    answer: "Our Izmir Airport to city center transfer is $35 fixed price. This covers Alsancak, Konak, and central Izmir. Includes meet & greet, luxury vehicle, and door-to-door service.",
  },
  {
    question: "Can I book a transfer from Izmir Airport to Kuşadası?",
    answer: "Absolutely! Izmir Airport to Kuşadası is a popular route, especially for cruise passengers. The transfer takes about 1 hour and costs $60. We also serve Kuşadası Port for cruise ship arrivals.",
  },
  {
    question: "What is the distance from Izmir Airport to Alaçatı?",
    answer: "Izmir Adnan Menderes Airport is approximately 80 km from Alaçatı. With our private transfer, you'll reach this trendy windsurf and boutique hotel destination in about 50 minutes.",
  },
  {
    question: "Do you offer transfers to Pamukkale from Izmir Airport?",
    answer: "Yes, we can arrange transfers to Pamukkale (approximately 250 km). This is a longer journey of about 3 hours, but with our comfortable Mercedes vehicle, it's quite pleasant. Contact us for pricing.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Perfect for business travelers and couples visiting Izmir or heading to Çeşme's beach clubs. Leather interior and excellent AC.",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Cold water", "USB charger", "Climate control"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Family",
    description: "Great for families visiting Ephesus or enjoying a beach holiday in Çeşme. Comfortable and spacious for longer journeys.",
    passengers: 7,
    luggage: 7,
    features: ["Comfortable seats", "WiFi", "Complimentary water", "USB chargers", "Air conditioning", "Extra legroom"],
    image: mercedesVitoFamilyImage,
  },
];

const IzmirAirportTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Izmir Airport Transfer | Private Shuttle to Çeşme, Kuşadası, Ephesus | Meet Transfer"
        description="Book Izmir Airport (ADB) private transfer from $35. Direct service to Çeşme, Alaçatı, Kuşadası, Ephesus & city center. Meet & greet, fixed prices. Book now!"
        keywords="Izmir Airport transfer, ADB airport transfer, Izmir Airport taxi, Izmir to Çeşme transfer, Izmir Airport shuttle, Izmir to Kuşadası, Izmir to Ephesus, Izmir Airport to Alaçatı"
        canonicalPath="/izmir-airport-transfer"
        ogImage="https://meettransfer.app/og/izmir-airport-og.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Izmir Airport', 'ADB', 'Izmir', 'Çeşme', 'Alaçatı', 'Kuşadası', 'Ephesus', 'Selçuk'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Izmir Airport Transfer', url: '/izmir-airport-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          {
            type: 'Product',
            name: 'Izmir Airport Transfer Service',
            description: 'Private transfer from Izmir Airport to Çeşme, Kuşadası, Ephesus, and the Aegean coast',
            image: ['https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg'],
            offers: { price: '35', priceCurrency: 'USD' },
          },
        ]}
      />

      <PageHeader
        title="Izmir Airport Transfer"
        subtitle="Private Transfers to Çeşme, Alaçatı, Kuşadası & Ephesus"
        backgroundImage="https://images.unsplash.com/photo-1592234933721-df6a38c2d0c7?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Main H1 Section */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Izmir Airport Transfer: Discover Turkey's Aegean Paradise
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            Izmir Adnan Menderes Airport (ADB) is your gateway to Turkey's beautiful Aegean coast. From the trendy beach town of Alaçatı to the ancient wonders of Ephesus, from the bustling bazaars of Izmir to the turquoise waters of Kuşadası, this region offers an incredible variety of experiences. Our Izmir Airport transfer service ensures your journey begins in comfort and style.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Whether you're a business traveler heading to Izmir's commercial center, a history buff visiting Ephesus, a beach lover bound for Çeşme, or a cruise passenger joining your ship in Kuşadası, our professional drivers provide seamless airport transfers throughout the region.
          </p>
        </section>

        {/* Why Choose Section */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Choose Our Izmir Airport Transfer?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Business & City Transfers</h3>
                <p className="text-sm text-muted-foreground">Professional service to Izmir's business districts, hotels, and meeting venues. Corporate accounts available.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Ephesus & Historical Sites</h3>
                <p className="text-sm text-muted-foreground">Direct transfers to Ephesus, Selçuk, and other ancient sites. Perfect for day-trippers and history enthusiasts.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Grape className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Çeşme & Beach Resorts</h3>
                <p className="text-sm text-muted-foreground">Quick transfers to Çeşme, Alaçatı, and the beautiful Aegean beaches via the new expressway.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Izmir Airport Transfer Destinations</h2>
          <p className="text-muted-foreground mb-6">We serve the entire Izmir region and Aegean coast:</p>
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
          <h2 className="text-2xl font-bold mb-4">Your Izmir Airport Transfer Experience</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Izmir is Turkey's third-largest city and a fascinating blend of ancient history and modern life. The airport is well-connected by new expressways, making transfers to popular destinations like Çeşme and Alaçatı faster than ever. What used to be a 1.5-hour drive is now just 50 minutes on the excellent new highway.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            For visitors interested in ancient history, Ephesus is just 45 minutes from Izmir Airport. This incredibly preserved Roman city is one of the world's greatest archaeological sites, and we can take you there directly from the airport. Many travelers combine an Ephesus visit with a stay in the charming town of Selçuk.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The Aegean coast around Izmir is known for its distinctive cuisine, excellent wines, and laid-back atmosphere. Alaçatı has become one of Turkey's most fashionable destinations, known for its stone houses, boutique hotels, and windsurf beaches. Çeşme offers beautiful beaches and lively nightlife. Our transfers get you to these destinations quickly and comfortably.
          </p>
        </section>

        {/* Fleet Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Izmir Airport Transfer Fleet</h2>
          <p className="text-muted-foreground mb-6">Premium Mercedes vehicles for business and leisure:</p>
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
          <h2 className="text-2xl font-bold mb-4">Izmir Airport Transfer Prices</h2>
          <p className="text-muted-foreground mb-6">Fixed prices with no hidden fees:</p>
          <PriceTable items={prices} title="Fixed Price Transfers from Izmir Airport" />
        </section>

        {/* Booking CTA */}
        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Izmir Airport Transfer Now</h3>
          <p className="mb-6 opacity-90">
            Instant WhatsApp confirmation. Cruise port transfers available.
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi, I'd like to book an Izmir Airport transfer. My flight details are:"
          />
        </div>

        {/* Additional Info */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Izmir Airport: Essential Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Izmir Adnan Menderes Airport (IATA: ADB) is located in Gaziemir, about 18 km south of Izmir city center. It's well-served by both domestic and international flights, with convenient connections to Istanbul and major European cities.
          </p>
          <h3 className="text-xl font-semibold mb-3">Izmir Airport Transfer Distances:</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Izmir City Center/Alsancak:</strong> 18 km (20-25 minutes)</li>
            <li><strong>Alaçatı:</strong> 80 km (50 minutes via new highway)</li>
            <li><strong>Çeşme:</strong> 85 km (55 minutes)</li>
            <li><strong>Selçuk/Ephesus:</strong> 60 km (45 minutes)</li>
            <li><strong>Kuşadası:</strong> 95 km (1 hour)</li>
            <li><strong>Foça:</strong> 75 km (50 minutes)</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Izmir Airport Transfer FAQ</h2>
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
            <Link to="/bodrum-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Bodrum Airport Transfer
            </Link>
            <Link to="/antalya-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Antalya Airport Transfer
            </Link>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default IzmirAirportTransfer;
