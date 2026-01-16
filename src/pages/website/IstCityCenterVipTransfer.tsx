import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import PriceTable from "@/components/website/PriceTable";
import { ArrowRight, Crown, Car, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead, SchemaOrg } from "@/components/seo";

const prices = [
  { from: "IST Airport", to: "Taksim VIP", price: "From €55" },
  { from: "IST Airport", to: "Sultanahmet VIP", price: "From €55" },
  { from: "IST Airport", to: "Nişantaşı VIP", price: "From €55" },
  { from: "IST Airport", to: "Levent VIP", price: "From €55" },
  { from: "IST Airport", to: "Maslak VIP", price: "From €60" },
];

const faqItems = [
  { question: "What makes VIP transfer different?", answer: "VIP transfer includes premium Mercedes vehicles, professional suited driver, complimentary refreshments, and priority service." },
  { question: "Is VIP transfer suitable for business travelers?", answer: "Absolutely. Our VIP service is designed for executives who need reliable, professional transport with WiFi to work en route." },
  { question: "Can I book VIP transfer for corporate clients?", answer: "Yes, we offer corporate accounts with invoicing for companies hosting VIP guests in Istanbul." },
  { question: "What vehicles are used for VIP transfers?", answer: "Mercedes Vito VIP with leather interior, or Mercedes V-Class for ultimate luxury. Mercedes Maybach Minivan available on request." },
];

const IstCityCenterVipTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="IST City Center VIP Transfer | Luxury Airport Service Istanbul | Meet Transfer"
        description="Book IST Airport VIP transfer to Istanbul city center from €55. Premium Mercedes, professional chauffeur, executive service. Corporate accounts available."
        keywords="IST VIP transfer, Istanbul Airport VIP, luxury airport transfer Istanbul, executive transfer IST, business transfer Istanbul Airport"
        canonicalPath="/ist-city-center-vip-transfer"
        ogImage="https://meettransfer.app/images/meet-transfer-vclass-interior.jpg"
      />
      <SchemaOrg schemas={[
        { type: 'TransportationService', areaServed: ['IST Airport', 'Istanbul', 'Taksim', 'Levent', 'Maslak'] },
        { type: 'FAQPage', questions: faqItems },
      ]} />

      <PageHeader title="IST City Center VIP Transfer" subtitle="Executive Luxury Transfer from Istanbul Airport" backgroundImage="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600" />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">IST City Center VIP Transfer: Executive Excellence</h1>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">For discerning travelers and business executives, our IST City Center VIP transfer offers an elevated airport experience. From the moment you land at Istanbul Airport, you'll enjoy white-glove service designed for those who expect the best.</p>
          <p className="text-muted-foreground leading-relaxed text-lg">Your professional chauffeur meets you at arrivals in formal attire, assists with luggage, and escorts you to a premium Mercedes vehicle. Enjoy chilled water, WiFi connectivity, and a peaceful environment to decompress or continue working as you travel to Istanbul's city center.</p>
        </section>

        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">VIP Transfer Benefits</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full"><Crown className="h-6 w-6 text-primary" /></div>
              <div><h3 className="font-semibold mb-2">Premium Service</h3><p className="text-sm text-muted-foreground">Professional chauffeur, priority pickup, executive treatment.</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full"><Car className="h-6 w-6 text-primary" /></div>
              <div><h3 className="font-semibold mb-2">Luxury Vehicles</h3><p className="text-sm text-muted-foreground">Mercedes Vito VIP, V-Class, or Maybach on request.</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full"><Shield className="h-6 w-6 text-primary" /></div>
              <div><h3 className="font-semibold mb-2">Corporate Ready</h3><p className="text-sm text-muted-foreground">Invoice billing, corporate accounts, confidential service.</p></div>
            </div>
          </div>
        </section>

        <FeatureList />
        
        <section>
          <h2 className="text-2xl font-bold mb-4">IST VIP Transfer Prices</h2>
          <PriceTable items={prices} title="VIP Transfer Routes" />
        </section>

        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your VIP Transfer</h3>
          <p className="mb-6 opacity-90">Executive service. Instant confirmation.</p>
          <WhatsAppButton variant="large" message="Hi, I'd like to book an IST VIP transfer. My details are:" />
        </div>

        <FAQSection items={faqItems} />

        <section className="bg-secondary rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">Related Services</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/istanbul-airport-transfer" className="flex items-center gap-2 text-primary hover:underline"><ArrowRight className="h-4 w-4" />Istanbul Airport Transfer</Link>
            <Link to="/istanbul-airport-hotel-transfer" className="flex items-center gap-2 text-primary hover:underline"><ArrowRight className="h-4 w-4" />Hotel Transfer</Link>
            <Link to="/luxury-chauffeur" className="flex items-center gap-2 text-primary hover:underline"><ArrowRight className="h-4 w-4" />Luxury Chauffeur</Link>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default IstCityCenterVipTransfer;
