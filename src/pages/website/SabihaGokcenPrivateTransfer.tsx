import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import PriceTable from "@/components/website/PriceTable";
import { ArrowRight, Plane, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead, SchemaOrg } from "@/components/seo";

const prices = [
  { from: "Sabiha Gökçen", to: "Taksim", price: "Request Price" },
  { from: "Sabiha Gökçen", to: "Sultanahmet", price: "Request Price" },
  { from: "Sabiha Gökçen", to: "Kadıköy", price: "Request Price" },
  { from: "Sabiha Gökçen", to: "Üsküdar", price: "Request Price" },
  { from: "Sabiha Gökçen", to: "Beşiktaş", price: "Request Price" },
];

const faqItems = [
  { question: "How far is Sabiha Gökçen from Istanbul center?", answer: "SAW is about 40 km from Taksim on the Asian side. Transfer takes 45-75 minutes depending on traffic." },
  { question: "Is Sabiha Gökçen cheaper than Istanbul Airport?", answer: "Flights to SAW can be cheaper, but it's farther from European Istanbul. Our fixed-price transfer makes it easy." },
  { question: "Do you offer transfers to the Asian side from SAW?", answer: "Yes! SAW is ideal for Asian side destinations like Kadıköy ($35) and Üsküdar ($40) - much quicker than from IST." },
  { question: "What about late night SAW arrivals?", answer: "We operate 24/7. Many budget airlines arrive late at SAW - we're always there for pickup." },
];

const SabihaGokcenPrivateTransfer = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Sabiha Gökçen Private Transfer | SAW Airport Shuttle Service | Meet Transfer"
        description="Book Sabiha Gökçen Airport (SAW) private transfer from $35. Direct service to Taksim, Kadıköy & all Istanbul. Meet & greet, fixed prices. Book now!"
        keywords="Sabiha Gökçen transfer, SAW airport transfer, Sabiha Gökçen taxi, SAW to Taksim, Sabiha Gökçen private transfer, SAW airport shuttle"
        canonicalPath="/sabiha-gokcen-private-transfer"
      />
      <SchemaOrg schemas={[
        { type: 'TransportationService', areaServed: ['Sabiha Gökçen Airport', 'SAW', 'Kadıköy', 'Üsküdar', 'Taksim'] },
        { type: 'FAQPage', questions: faqItems },
      ]} />

      <PageHeader title="Sabiha Gökçen Private Transfer" subtitle="Professional Airport Transfer from SAW to All Istanbul" backgroundImage="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600" />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Sabiha Gökçen Private Transfer: Istanbul's Asian Side Gateway</h1>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">Sabiha Gökçen Airport (SAW) on Istanbul's Asian side is increasingly popular with budget airlines and domestic flights. Our Sabiha Gökçen private transfer service ensures you reach your destination smoothly, whether on the Asian or European side of the city.</p>
          <p className="text-muted-foreground leading-relaxed text-lg">Located in the Pendik district, SAW is perfect for travelers heading to Kadıköy, Üsküdar, or the Asian side neighborhoods. For European Istanbul destinations, our experienced drivers know the best routes across the Bosphorus bridges to minimize travel time.</p>
        </section>

        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Why Choose SAW Private Transfer?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full"><Plane className="h-6 w-6 text-primary" /></div>
              <div><h3 className="font-semibold mb-2">All SAW Flights</h3><p className="text-sm text-muted-foreground">24/7 service for all airlines including Pegasus, AnadoluJet.</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full"><MapPin className="h-6 w-6 text-primary" /></div>
              <div><h3 className="font-semibold mb-2">Both Sides Covered</h3><p className="text-sm text-muted-foreground">Asian side nearby, European side via bridge – we know all routes.</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full"><Clock className="h-6 w-6 text-primary" /></div>
              <div><h3 className="font-semibold mb-2">Late Night Ready</h3><p className="text-sm text-muted-foreground">Many SAW flights arrive late – we're always there waiting.</p></div>
            </div>
          </div>
        </section>

        <FeatureList />
        
        <section>
          <h2 className="text-2xl font-bold mb-4">Sabiha Gökçen Transfer Prices</h2>
          <PriceTable items={prices} title="Transfer Routes from SAW" />
        </section>

        <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Book Your SAW Transfer</h3>
          <p className="mb-6 opacity-90">Meet & greet service. Fixed prices.</p>
          <WhatsAppButton variant="large" message="Hi, I'd like to book a Sabiha Gökçen transfer. My flight details are:" />
        </div>

        <FAQSection items={faqItems} />

        <section className="bg-secondary rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">Related Services</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/istanbul-airport-transfer" className="flex items-center gap-2 text-primary hover:underline"><ArrowRight className="h-4 w-4" />Istanbul Airport (IST)</Link>
            <Link to="/istanbul-airport-hotel-transfer" className="flex items-center gap-2 text-primary hover:underline"><ArrowRight className="h-4 w-4" />Hotel Transfer</Link>
            <Link to="/ist-city-center-vip-transfer" className="flex items-center gap-2 text-primary hover:underline"><ArrowRight className="h-4 w-4" />VIP Transfer</Link>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default SabihaGokcenPrivateTransfer;
