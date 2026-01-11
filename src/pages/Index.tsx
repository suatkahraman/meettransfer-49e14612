import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Hero } from "@/components/Hero";
import { BookingForm } from "@/components/BookingForm";
import { Destinations } from "@/components/Destinations";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useBrowserLanguageRedirect } from "@/hooks/useBrowserLanguageRedirect";
import { useLanguage } from "@/contexts/LanguageContext";
import { PWAPromoBanner } from "@/components/website/PWAPromoBanner";
import TrustedPartners from "@/components/website/TrustedPartners";
import WhyChooseUs from "@/components/website/WhyChooseUs";
import GoogleReviewsCarousel from "@/components/website/GoogleReviewsCarousel";
import VideoPromo from "@/components/website/VideoPromo";
import HourlyRentalSection from "@/components/website/HourlyRentalSection";


const Index = () => {
  // Auto-redirect first-time visitors based on browser language
  useBrowserLanguageRedirect();
  const { t } = useLanguage();

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoHomeTitle")}
        description={t("seoHomeDesc")}
        keywords={t("seoHomeKeywords")}
        canonicalPath="/"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          { type: 'TransportationService', areaServed: ['Istanbul', 'Antalya', 'Bodrum', 'Dalaman', 'Izmir', 'Cappadocia', 'Dubai', 'Cyprus'] },
          { type: 'MerchantProduct' },
        ]}
      />
      <Hero />
      <BookingForm />
      <WhyChooseUs />
      <Destinations />
      <HourlyRentalSection />
      <VideoPromo />
      <GoogleReviewsCarousel />
      <TrustedPartners />
      <PWAPromoBanner />
      <Footer />
    </WebsiteLayout>
  );
};

export default Index;
