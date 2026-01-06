import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import PriceTable from "@/components/website/PriceTable";
import { ArrowRight, Hotel, Clock, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead, SchemaOrg } from "@/components/seo";

const prices = [
  { from: "Istanbul Airport", to: "Taksim Hotels", price: "From €50" },
  { from: "Istanbul Airport", to: "Sultanahmet Hotels", price: "From €50" },
  { from: "Istanbul Airport", to: "Beşiktaş Hotels", price: "From €50" },
  { from: "Istanbul Airport", to: "Galataport Hotels", price: "From €50" },
  { from: "Istanbul Airport", to: "Kadıköy Hotels", price: "From €65" },
  { from: "Istanbul Airport", to: "Sisli Hotels", price: "From €50" },
];

const faqItems = [
  { question: "Do you deliver directly to my hotel door?", answer: "Yes, we provide door-to-door service. Your driver will drop you at your hotel entrance and help with luggage." },
  { question: "Can you wait if my hotel check-in is delayed?", answer: "We deliver you to the hotel. If check-in isn't ready, the hotel will store your luggage while you explore." },
  { question: "Do you know all Istanbul hotels?", answer: "Yes, our drivers are familiar with virtually every hotel in Istanbul, from major chains to boutique properties." },
  { question: "What if I don't know my hotel address?", answer: "Just provide the hotel name - we'll find it. We can also call ahead to confirm the best drop-off point." },
];

const IstanbulAirportHotelTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Istanbul Airport to Hotel Transfer | Direct Door-to-Door Service | Meet Transfer"
        description="Book Istanbul Airport to hotel private transfer from €50. Direct delivery to Taksim, Sultanahmet & all Istanbul hotels. Meet & greet, fixed prices. Book now!"
        keywords="Istanbul Airport hotel transfer, IST to hotel, Istanbul Airport to Taksim hotel, airport hotel shuttle Istanbul, Istanbul hotel pickup"
        canonicalPath="/istanbul-airport-hotel-transfer"
      />
      <SchemaOrg schemas={[
        { type: 'TransportationService', areaServed: ['Istanbul Airport', 'Taksim', 'Sultanahmet', 'Beşiktaş'] },
        { type: 'FAQPage', questions: faqItems },
      ]} />

      <PageHeader title="Istanbul Airport to Hotel Transfer" subtitle="Direct Door-to-Door Delivery to All Istanbul Hotels" backgroundImage="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600" />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Istanbul Airport to Hotel Transfer: Seamless Door-to-Door Service</h1>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">After a long flight to Istanbul, the last thing you want is the stress of finding your hotel. Our Istanbul Airport to hotel transfer service takes the hassle out of arrival. We pick you up at the airport and deliver you directly to your hotel entrance – whether it's a luxury property in Taksim, a boutique gem in Sultanahmet, or a business hotel in Levent.</p>
          <p className="text-muted-foreground leading-relaxed text-lg">Our drivers know every hotel in Istanbul, from the famous Four Seasons and Raffles to charming family-run guesthouses in the old city. No navigating confusing streets, no language barriers, no taxi negotiations. Just smooth, comfortable transfer from airport to hotel lobby.</p>
        </section>

        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Choose Our Hotel Transfer Service?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full"><Hotel className="h-6 w-6 text-primary" /></div>
              <div><h3 className="font-semibold mb-2">Every Hotel Covered</h3><p className="text-sm text-muted-foreground">We know every hotel, from 5-star chains to boutique properties.</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full"><Clock className="h-6 w-6 text-primary" /></div>
              <div><h3 className="font-semibold mb-2">Lobby Drop-Off</h3><p className="text-sm text-muted-foreground">We take you right to the entrance with luggage assistance.</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full"><Shield className="h-6 w-6 text-primary" /></div>
              <div><h3 className="font-semibold mb-2">Fixed Hotel Rates</h3><p className="text-sm text-muted-foreground">Same price regardless of your hotel location in each zone.</p></div>
            </div>
          </div>
        </section>

        <FeatureList />
        
        <section>
          <h2 className="text-2xl font-bold mb-4">Istanbul Airport to Hotel Prices</h2>
          <PriceTable items={prices} title="Transfer Routes to Hotels" />
        </section>

        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your Hotel Transfer Now</h3>
          <p className="mb-6 opacity-90">Instant confirmation. Direct hotel delivery.</p>
          <WhatsAppButton variant="large" message="Hi, I'd like to book an Istanbul Airport to hotel transfer. My hotel is:" />
        </div>

        <FAQSection items={faqItems} />

        <section className="bg-secondary rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">Related Services</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/istanbul-airport-transfer" className="flex items-center gap-2 text-primary hover:underline"><ArrowRight className="h-4 w-4" />Istanbul Airport Transfer</Link>
            <Link to="/ist-city-center-vip-transfer" className="flex items-center gap-2 text-primary hover:underline"><ArrowRight className="h-4 w-4" />IST VIP Transfer</Link>
            <Link to="/sabiha-gokcen-private-transfer" className="flex items-center gap-2 text-primary hover:underline"><ArrowRight className="h-4 w-4" />Sabiha Gökçen Transfer</Link>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default IstanbulAirportHotelTransfer;
