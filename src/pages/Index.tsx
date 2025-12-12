import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Hero } from "@/components/Hero";
import { BookingForm } from "@/components/BookingForm";
import { Destinations } from "@/components/Destinations";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";

const Index = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Meet Transfer - Premium VIP Airport Transfer & Chauffeur Service in Turkey"
        description="Luxury VIP airport transfer and private chauffeur service in Turkey. Professional drivers, Mercedes fleet, 24/7 service. Istanbul, Antalya, Bodrum, Dalaman, Cappadocia transfers."
        keywords="airport transfer Turkey, VIP airport transfer, private chauffeur service, luxury airport transfer, Istanbul transfer, Antalya transfer, Bodrum transfer, Turkey private driver, Mercedes transfer"
        canonicalPath="/"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          { type: 'TransportationService', areaServed: ['Istanbul', 'Antalya', 'Bodrum', 'Dalaman', 'Izmir', 'Cappadocia'] },
        ]}
      />
      <Hero />
      <BookingForm />
      <Destinations />
      <Features />
      <Footer />
    </WebsiteLayout>
  );
};

export default Index;
