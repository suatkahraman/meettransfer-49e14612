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
import LazyOnView from "@/components/performance/LazyOnView";


// Below-the-fold components are lazy loaded with deferred imports
// These load AFTER the critical hero section renders
const PromoBannerCarousel = lazy(() => import("@/components/website/PromoBannerCarousel"));
const CoreServices = lazy(() => import("@/components/website/CoreServices"));
const StatsCounter = lazy(() => import("@/components/website/StatsCounter"));
const HowItWorks = lazy(() => import("@/components/website/HowItWorks"));
const FleetIconsBar = lazy(() => import("@/components/website/FleetIconsBar"));
const Destinations = lazy(() => import("@/components/Destinations").then(m => ({ default: m.Destinations })));
const WhyChooseUs = lazy(() => import("@/components/website/WhyChooseUs"));
const HourlyRentalSection = lazy(() => import("@/components/website/HourlyRentalSection"));
const GoogleReviewsCarousel = lazy(() => import("@/components/website/GoogleReviewsCarousel"));
const ReviewPlatformLogos = lazy(() => import("@/components/website/ReviewPlatformLogos"));
const PWAPromoBanner = lazy(() => import("@/components/website/PWAPromoBanner").then(m => ({ default: m.PWAPromoBanner })));
const HomeFAQ = lazy(() => import("@/components/website/HomeFAQ"));

// Smaller placeholder - reduces layout shift perception
const SectionPlaceholder = () => <div className="min-h-[100px]" aria-hidden="true" />;

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
      {/* Hero and TrustBar are critical - no Suspense wrapper */}
      <HeroErrorBoundary>
        <Hero />
      </HeroErrorBoundary>
      <TrustBar />
      
      {/* All below-the-fold content - deferred loading */}
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <PromoBannerCarousel />
        </Suspense>
      </LazyOnView>
      
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <CoreServices />
        </Suspense>
      </LazyOnView>
      
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <StatsCounter />
        </Suspense>
      </LazyOnView>
      
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <HowItWorks />
        </Suspense>
      </LazyOnView>
      
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <FleetIconsBar />
        </Suspense>
      </LazyOnView>
      
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <Destinations />
        </Suspense>
      </LazyOnView>
      
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <WhyChooseUs />
        </Suspense>
      </LazyOnView>
      
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <HomeFAQ />
        </Suspense>
      </LazyOnView>
      
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <HourlyRentalSection />
        </Suspense>
      </LazyOnView>
      
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <GoogleReviewsCarousel />
          <ReviewPlatformLogos />
        </Suspense>
      </LazyOnView>
      
      {/* AI Assistant Promo temporarily disabled */}
      
      <LazyOnView placeholder={<SectionPlaceholder />}>
        <Suspense fallback={<SectionPlaceholder />}>
          <PWAPromoBanner />
        </Suspense>
      </LazyOnView>
      
      <Footer />
    </WebsiteLayout>
  );
};

export default Index;
