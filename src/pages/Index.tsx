import { lazy, Suspense } from "react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Hero } from "@/components/Hero";
import { HeroErrorBoundary } from "@/components/hero";
// BookingForm removed - form is now inside Hero component
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useBrowserLanguageRedirect } from "@/hooks/useBrowserLanguageRedirect";
import { useLanguage } from "@/contexts/LanguageContext";
import TrustBar from "@/components/website/TrustBar";


// Below-the-fold components are lazy loaded for better TTFB
const CoreServices = lazy(() => import("@/components/website/CoreServices"));
const StatsCounter = lazy(() => import("@/components/website/StatsCounter"));
const HowItWorks = lazy(() => import("@/components/website/HowItWorks"));
const FleetIconsBar = lazy(() => import("@/components/website/FleetIconsBar"));
const Destinations = lazy(() => import("@/components/Destinations").then(m => ({ default: m.Destinations })));
const WhyChooseUs = lazy(() => import("@/components/website/WhyChooseUs"));
const HourlyRentalSection = lazy(() => import("@/components/website/HourlyRentalSection"));
const GoogleReviewsCarousel = lazy(() => import("@/components/website/GoogleReviewsCarousel"));
const ReviewPlatformLogos = lazy(() => import("@/components/website/ReviewPlatformLogos"));
// AIAssistantPromo temporarily disabled
// TrustedPartners removed for performance
const PWAPromoBanner = lazy(() => import("@/components/website/PWAPromoBanner").then(m => ({ default: m.PWAPromoBanner })));
const PromoBannerCarousel = lazy(() => import("@/components/website/PromoBannerCarousel"));
const HomeFAQ = lazy(() => import("@/components/website/HomeFAQ"));

// Minimal loading placeholder for lazy sections
const SectionPlaceholder = () => (
  <div className="min-h-[200px]" aria-hidden="true" />
);

const Index = () => {
  // Auto-redirect first-time visitors based on browser language
  useBrowserLanguageRedirect();
  const { t, language } = useLanguage();

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
          { type: 'AIBookingAssistant' },
        ]}
      />
      {/* Critical above-the-fold content - wrapped with error boundary */}
      <HeroErrorBoundary>
        <Hero />
      </HeroErrorBoundary>
      <TrustBar />
      
      {/* Below-the-fold content - lazy loaded for better TTFB */}
      <Suspense fallback={<SectionPlaceholder />}>
        <PromoBannerCarousel />
      </Suspense>
      
      <Suspense fallback={<SectionPlaceholder />}>
        <CoreServices />
      </Suspense>
      
      <Suspense fallback={<SectionPlaceholder />}>
        <StatsCounter />
      </Suspense>
      
      <Suspense fallback={<SectionPlaceholder />}>
        <HowItWorks />
      </Suspense>
      
      <Suspense fallback={<SectionPlaceholder />}>
        <FleetIconsBar />
      </Suspense>
      
      <Suspense fallback={<SectionPlaceholder />}>
        <Destinations />
      </Suspense>
      
      <Suspense fallback={<SectionPlaceholder />}>
        <WhyChooseUs />
      </Suspense>
      
      <Suspense fallback={<SectionPlaceholder />}>
        <HomeFAQ />
      </Suspense>
      
      <Suspense fallback={<SectionPlaceholder />}>
        <HourlyRentalSection />
      </Suspense>
      
      <Suspense fallback={<SectionPlaceholder />}>
        <GoogleReviewsCarousel />
        <ReviewPlatformLogos />
      </Suspense>
      
      {/* AI Assistant Promo temporarily disabled */}
      
      <Suspense fallback={<SectionPlaceholder />}>
        <PWAPromoBanner />
      </Suspense>
      
      <Footer />
    </WebsiteLayout>
  );
};

export default Index;