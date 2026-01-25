import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Mountain, Landmark, Camera, Trees } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import bursaHeroImage from "@/assets/bursa-transfer-hero.jpg";

// Premium images - WebP optimized
import vitoAirportPremium from "@/assets/vehicles/vito-airport-premium.webp";
import vitoLuxuryInterior from "@/assets/vito-luxury-interior.jpg";
import vipVitoStarlightLuxury from "@/assets/vehicles/vip-vito-starlight.webp";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";

// Popular destinations in Bursa and between Istanbul-Bursa
const destinations = [
  "Bursa City Center", "Uludağ Ski Resort", "Cumalıkızık Village", 
  "Grand Mosque (Ulu Cami)", "Green Mosque & Tomb", "Mudanya",
  "Trilye", "Gölyazı", "Iznik", "Thermal Springs (Çekirge)"
];

// Istanbul-Bursa transfer and tour prices
const prices = [
  { from: "Istanbul Airport (IST)", to: "Bursa City Center", price: "From €245" },
  { from: "Sabiha Gökçen (SAW)", to: "Bursa City Center", price: "From €225" },
  { from: "Istanbul Airport (IST)", to: "Uludağ Ski Resort", price: "From €245" },
  { from: "Sabiha Gökçen (SAW)", to: "Uludağ Ski Resort", price: "From €225" },
  { from: "Istanbul Airport (IST)", to: "Mudanya", price: "From €245" },
  { from: "Sabiha Gökçen (SAW)", to: "Mudanya", price: "From €225" },
  { from: "Istanbul", to: "Bursa Day Tour", price: "From €300" },
];

// Day tour packages
const tourPackages = [
  {
    title: "Bursa Grand Tour",
    duration: "Full Day (10-12 hours)",
    highlights: ["Grand Mosque", "Green Mosque & Tomb", "Silk Bazaar", "Cable Car to Uludağ", "İskender Kebab Lunch"],
    price: "From €250",
    icon: Landmark,
  },
  {
    title: "Uludağ Mountain Tour",
    duration: "Full Day (8-10 hours)",
    highlights: ["Scenic drive to Uludağ", "Cable car experience", "Mountain views", "Snow activities (winter)", "Traditional lunch"],
    price: "From €245",
    icon: Mountain,
  },
  {
    title: "Ottoman Villages Tour",
    duration: "Half Day (5-6 hours)",
    highlights: ["Cumalıkızık UNESCO Village", "Traditional breakfast", "Historic Ottoman houses", "Photography stops"],
    price: "From €150",
    icon: Camera,
  },
  {
    title: "Thermal & Nature Tour",
    duration: "Full Day (8-10 hours)",
    highlights: ["Çekirge thermal baths", "Gölyazı island village", "Trilye seaside town", "Olive groves", "Seafood lunch"],
    price: "From €185",
    icon: Trees,
  },
];

const faqItems = [
  {
    question: "How long does it take to get from Istanbul to Bursa by private transfer?",
    answer: "The journey from Istanbul to Bursa takes approximately 2.5-3 hours depending on traffic and ferry vs. bridge route. We offer both options: the scenic ferry route via Mudanya or the direct highway route via Osmangazi Bridge.",
  },
  {
    question: "Can you arrange a day tour from Istanbul to Bursa?",
    answer: "Yes! Our Istanbul to Bursa day tours are very popular. We pick you up from your hotel, show you the best of Bursa (Grand Mosque, Green Mosque, Cumalıkızık, cable car to Uludağ), include an authentic İskender Kebab lunch, and return you to Istanbul by evening.",
  },
  {
    question: "What is included in the Bursa transfer price?",
    answer: "All our prices include luxury Mercedes vehicle, professional English-speaking driver, meet & greet service, flight tracking for airport pickups, complimentary water and WiFi, and all tolls/fees including ferry if chosen.",
  },
  {
    question: "Which route do you recommend: ferry or Osmangazi Bridge?",
    answer: "The ferry route (via Mudanya) is scenic and relaxing but weather-dependent. The Osmangazi Bridge route is faster and more reliable. We recommend the bridge route for tight schedules and the ferry for a more memorable experience.",
  },
  {
    question: "Do you offer transfers to Uludağ ski resort?",
    answer: "Absolutely! We provide transfers to Uludağ from both Bursa city and Istanbul. Our drivers are experienced with mountain roads and winter conditions. We can also arrange ski equipment stops if needed.",
  },
  {
    question: "Can I customize my Bursa tour itinerary?",
    answer: "Yes, all our tours are fully customizable. Whether you want to focus on history, nature, food, or shopping, we'll create a personalized itinerary. Just let us know your interests when booking.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Perfect for Istanbul-Bursa long-distance comfort with extra legroom and premium amenities",
    passengers: 6,
    luggage: 6,
    features: ["Leather seats", "WiFi", "Water", "USB charger", "Climate control"],
    images: [
      { src: vipVitoStarlightLuxury, alt: "Mercedes VIP Vito starlight luxury transfer Bursa" },
      { src: vitoVipStarlightPurple, alt: "Mercedes VIP Vito purple interior Bursa" },
    ],
  },
  {
    name: "Mercedes Vito",
    description: "Comfortable family transfer vehicle ideal for day tours and group excursions",
    passengers: 7,
    luggage: 7,
    features: ["Leather seats", "WiFi", "Complimentary water", "USB chargers", "Air Condition", "Extra legroom"],
    images: [
      { src: vitoAirportPremium, alt: "Mercedes Vito airport transfer Bursa with chauffeur" },
      { src: vitoLuxuryInterior, alt: "Mercedes Vito luxury interior Bursa transfer" },
    ],
  },
];

const BursaTransfer = () => {
  const { t } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title="Istanbul to Bursa Transfer & Day Tours | VIP Private Transport | Meet Transfer"
        description="Premium private transfers from Istanbul to Bursa. Book VIP day tours to Uludağ, Cumalıkızık, Grand Mosque & thermal springs. Professional drivers, Mercedes fleet, fixed prices. Ferry & bridge routes available."
        keywords="Istanbul Bursa transfer, Istanbul to Bursa private transfer, Bursa day tour from Istanbul, Uludağ transfer, Cumalıkızık tour, Bursa VIP transfer, Istanbul Bursa tour, Osmangazi bridge transfer, Mudanya ferry transfer, Bursa airport transfer, Green Bursa tour"
        canonicalPath="/bursa-transfer"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul', 'Bursa', 'Uludağ', 'Cumalıkızık', 'Mudanya', 'Iznik'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
              { name: 'Istanbul-Bursa Transfer & Tours', url: '/bursa-transfer' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
          { type: 'TransportationService', areaServed: ['Bursa', 'Istanbul', 'Uludag'] },
        ]}
      />

      <PageHeader
        title="Istanbul – Bursa Transfer & Tours"
        subtitle="VIP Private Transfers & Day Tours to Green Bursa"
        backgroundImage={bursaHeroImage}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Main Introduction */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Istanbul to Bursa Private Transfer & Day Tours
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Discover the ancient Ottoman capital with our premium transfer and tour services. Bursa, known as "Green Bursa" (Yeşil Bursa), 
            is just 2.5 hours from Istanbul and offers a perfect blend of history, nature, and gastronomy. From the majestic Uludağ mountain 
            to the UNESCO-listed Cumalıkızık village, experience the best of Bursa with professional drivers and luxury Mercedes vehicles. 
            Whether you need a one-way transfer or a comprehensive day tour, we provide fixed-price, hassle-free service with hotel pickup and drop-off.
          </p>
        </section>

        <FeatureList />

        {/* Day Tour Packages */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Bursa Day Tour Packages</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {tourPackages.map((tour) => {
              const IconComponent = tour.icon;
              return (
                <Card key={tour.title} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1">{tour.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{tour.duration}</p>
                        <ul className="space-y-1 mb-4">
                          {tour.highlights.map((highlight, idx) => (
                            <li key={idx} className="text-sm flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                        <p className="text-lg font-bold text-primary">{tour.price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Popular Destinations */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Popular Destinations in Bursa</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {destinations.map((dest) => (
              <div
                key={dest}
                className="flex items-center gap-2 bg-card p-3 rounded-lg shadow-sm border border-border/50"
              >
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">{dest}</span>
              </div>
            ))}
          </div>
        </section>

        {/* VIP Fleet */}
        <section>
          <h2 className="text-2xl font-bold mb-4">VIP Fleet for Long-Distance Comfort</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.name} {...vehicle} />
            ))}
          </div>
          <Link to="/fleet" className="inline-block mt-4">
            <Button variant="outline" className="gap-2">
              {t("viewAllVehicles")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>

        {/* Price Table */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Istanbul-Bursa Transfer & Tour Prices</h2>
          <PriceTable items={prices} title="Fixed Price Transfers & Tours" />
          <p className="text-sm text-muted-foreground mt-3">
            * Prices are for Mercedes Vito (up to 7 passengers). All tolls, ferry fees (if applicable), and taxes included.
          </p>
        </section>

        {/* Route Information */}
        <section className="bg-muted/50 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold mb-4">Two Routes to Bursa</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-lg mb-2">🌉 Osmangazi Bridge Route</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Duration: ~2.5 hours</li>
                <li>• All-weather reliable</li>
                <li>• Direct highway connection</li>
                <li>• Best for tight schedules</li>
                <li>• Bridge toll included in price</li>
              </ul>
            </div>
            <div className="bg-card rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-lg mb-2">⛴️ Mudanya Ferry Route</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Duration: ~3 hours (incl. ferry)</li>
                <li>• Scenic Sea of Marmara crossing</li>
                <li>• Relaxing ferry experience</li>
                <li>• Weather-dependent</li>
                <li>• Ferry tickets included</li>
              </ul>
            </div>
          </div>
        </section>

        {/* WhatsApp CTA */}
        <div className="bg-primary/10 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Book Your Bursa Transfer or Tour</h3>
          <p className="text-muted-foreground mb-4">
            Get instant confirmation and personalized itinerary via WhatsApp
          </p>
          <WhatsAppButton
            variant="large"
            message="Hi! I'm interested in Istanbul-Bursa transfer/tour. Can you help me plan my trip?"
          />
        </div>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <FAQSection items={faqItems} />
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default BursaTransfer;
