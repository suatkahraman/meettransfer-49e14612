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
import HourlyRentalSection from "@/components/website/HourlyRentalSection";
import StatsCounter from "@/components/website/StatsCounter";
import TrustBar from "@/components/website/TrustBar";
import FleetIconsBar from "@/components/website/FleetIconsBar";
import ReviewPlatformLogos from "@/components/website/ReviewPlatformLogos";
import AIAssistantPromo from "@/components/website/AIAssistantPromo";
import HowItWorks from "@/components/website/HowItWorks";
import CoreServices from "@/components/website/CoreServices";


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
          { type: 'LocalBusiness', includeRating: true },
          { type: 'TransportationService', areaServed: ['Istanbul', 'Antalya', 'Bodrum', 'Dalaman', 'Izmir', 'Cappadocia', 'Dubai', 'Cyprus'] },
          { type: 'MerchantProduct' },
        ]}
      />
      {/* Hero with Booking Form integrated */}
      <Hero />
      <TrustBar />
      <BookingForm />
      
      {/* Core Services - Transfeero style */}
      <CoreServices />
      
      {/* Stats - Dark section like Transfeero */}
      <StatsCounter />
      
      {/* How It Works - 3 step process */}
      <HowItWorks />
      
      {/* Fleet Showcase */}
      <FleetIconsBar />
      
      {/* Top Destinations - Bento grid style */}
      <Destinations />
      
      {/* Why Choose Us - Two column layout */}
      <WhyChooseUs />
      
      {/* Hourly Rental */}
      <HourlyRentalSection />
      
      {/* Reviews */}
      <GoogleReviewsCarousel />
      <ReviewPlatformLogos />
      
      {/* AI Assistant */}
      <AIAssistantPromo />
      
      {/* Partners & Trust */}
      <TrustedPartners />
      <PWAPromoBanner />
      
      <Footer />
    </WebsiteLayout>
  );
};

export default Index;