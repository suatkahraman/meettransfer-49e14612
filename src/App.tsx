import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { PromoProvider } from "./contexts/PromoContext";
import { AIChatProvider } from "./contexts/AIChatContext";
import { AITestProvider } from "./contexts/AITestContext";
import { AgencyLanguageProvider } from "./contexts/AgencyLanguageContext";
import { AdminRoute, DriverRoute, CustomerRoute, AgencyRoute } from "./components/ProtectedRoute";
import OAuthCallbackHandler from "./components/OAuthCallbackHandler";
import { lazy, Suspense, useEffect, useState } from "react";
import FloatingWhatsApp from "./components/website/FloatingWhatsApp";
import GeoLanguageInitializer from "./components/GeoLanguageInitializer";
import HashScroll from "@/components/HashScroll";
import LanguageQueryRedirect from "./components/LanguageQueryRedirect";
import { UpdateManager } from "./components/UpdateManager";
import { PWAInstallPrompt } from "./components/website/PWAInstallPrompt";
import ChunkErrorBoundary from "./components/ChunkErrorBoundary";
import AdBlockWarning from "./components/AdBlockWarning";
import { Button } from "@/components/ui/button";
import { PWADebugPanel } from "./components/website/PWADebugPanel"; // visible with ?pwa_debug=1
import CanonicalManager from "./components/seo/CanonicalManager";

// IMPORTANT: Keep the homepage eager-loaded.
// In installed PWAs, stale SW/cache edge-cases can cause lazy chunks to hang indefinitely,
// which leaves the app stuck on the Suspense loader.
import Index from "./pages/Index";

// Critical pages - NotFound can remain lazy
const NotFound = lazy(() => import("./pages/NotFound"));

// Auth pages - lazy loaded
const Auth = lazy(() => import("./pages/Auth"));
const LoginScreen = lazy(() => import("./pages/auth/LoginScreen"));
const SignupScreen = lazy(() => import("./pages/auth/SignupScreen"));
const SignupChoicePage = lazy(() => import("./pages/auth/SignupChoicePage"));
const AgencySignupScreen = lazy(() => import("./pages/auth/AgencySignupScreen"));
const AgencyLoginScreen = lazy(() => import("./pages/auth/AgencyLoginScreen"));
const DriverLoginScreen = lazy(() => import("./pages/auth/DriverLoginScreen"));
const ReservationForm = lazy(() => import("./pages/ReservationForm"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));

// Customer Pages - lazy loaded
const CustomerHome = lazy(() => import("./pages/customer/CustomerHome"));
const CustomerBookings = lazy(() => import("./pages/customer/CustomerBookings"));
const CustomerReservationDetail = lazy(() => import("./pages/customer/CustomerReservationDetail"));
const CustomerEditReservation = lazy(() => import("./pages/customer/CustomerEditReservation"));
const CustomerReviewPage = lazy(() => import("./pages/customer/CustomerReviewPage"));
const CustomerProfile = lazy(() => import("./pages/customer/CustomerProfile"));

// Driver Pages - lazy loaded
const DriverHome = lazy(() => import("./pages/driver/DriverHome"));
const DriverJobDetails = lazy(() => import("./pages/driver/DriverJobDetails"));
const DriverJobList = lazy(() => import("./pages/driver/DriverJobList"));
const DriverAccounting = lazy(() => import("./pages/driver/DriverAccounting"));
const DriverHistory = lazy(() => import("./pages/driver/DriverHistory"));
const DriverMonthlyAccounting = lazy(() => import("./pages/driver/DriverMonthlyAccounting"));

// Admin Pages - lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReservations = lazy(() => import("./pages/admin/AdminReservations"));
const AdminEditReservation = lazy(() => import("./pages/admin/AdminEditReservation"));
const AdminCreateReservation = lazy(() => import("./pages/admin/AdminCreateReservation"));
const AdminDrivers = lazy(() => import("./pages/admin/AdminDrivers"));
const AdminDriverJobs = lazy(() => import("./pages/admin/AdminDriverJobs"));
const AdminAccounting = lazy(() => import("./pages/admin/AdminAccounting"));
const AdminMonthlyAccounting = lazy(() => import("./pages/admin/AdminMonthlyAccounting"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminSetup = lazy(() => import("./pages/admin/AdminSetup"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates"));
const AdminCalendar = lazy(() => import("./pages/admin/AdminCalendar"));
const AdminAgencies = lazy(() => import("./pages/admin/AdminAgencies"));
const AdminAgencyAccounting = lazy(() => import("./pages/admin/AdminAgencyAccounting"));
const AdminFlightMonitor = lazy(() => import("./pages/admin/AdminFlightMonitor"));

const AdminWhatsAppChat = lazy(() => import("./pages/admin/AdminWhatsAppChat"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminAppInstallations = lazy(() => import("./pages/admin/AdminAppInstallations"));
const AdminAgencyApplications = lazy(() => import("./pages/admin/AdminAgencyApplications"));
const AdminFilteredReservations = lazy(() => import("./pages/admin/AdminFilteredReservations"));
const AdminMonthlyProfit = lazy(() => import("./pages/admin/AdminMonthlyProfit"));
const AdminRegionPrices = lazy(() => import("./pages/admin/AdminRegionPrices"));
const AdminLoginAttempts = lazy(() => import("./pages/admin/AdminLoginAttempts"));
const AdminHourlyRentalPrices = lazy(() => import("./pages/admin/AdminHourlyRentalPrices"));
const AdminPriceThresholds = lazy(() => import("./pages/admin/AdminPriceThresholds"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
// Customer Portal Pages
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const ConfirmBooking = lazy(() => import("./pages/ConfirmBooking"));
const QuickBookingCustomerInfo = lazy(() => import("./pages/QuickBookingCustomerInfo"));

// Admin Quick Bookings
const AdminQuickBookings = lazy(() => import("./pages/admin/AdminQuickBookings"));

// Agency Pages - lazy loaded
const AgencyHome = lazy(() => import("./pages/agency/AgencyHome"));
const AgencyReports = lazy(() => import("./pages/agency/AgencyReports"));
const AgencyReservationDetail = lazy(() => import("./pages/agency/AgencyReservationDetail"));
const AgencyEditReservation = lazy(() => import("./pages/agency/AgencyEditReservation"));
const AgencyCreateReservation = lazy(() => import("./pages/agency/AgencyCreateReservation"));
const AgencyTransactionHistory = lazy(() => import("./pages/agency/AgencyTransactionHistory"));
const AgencyCurrencyDetail = lazy(() => import("./pages/agency/AgencyCurrencyDetail"));

// Website Pages - lazy loaded
const IstanbulTransfer = lazy(() => import("./pages/website/IstanbulTransfer"));
const AntalyaTransfer = lazy(() => import("./pages/website/AntalyaTransfer"));
const BodrumTransfer = lazy(() => import("./pages/website/BodrumTransfer"));
const DalamanTransfer = lazy(() => import("./pages/website/DalamanTransfer"));
const IzmirTransfer = lazy(() => import("./pages/website/IzmirTransfer"));
const CappadociaTransfer = lazy(() => import("./pages/website/CappadociaTransfer"));
const EphesusPamukkale = lazy(() => import("./pages/website/EphesusPamukkale"));
const LuxuryChauffeur = lazy(() => import("./pages/website/LuxuryChauffeur"));
const DubaiTransfer = lazy(() => import("./pages/website/DubaiTransfer"));
const CyprusTransfer = lazy(() => import("./pages/website/CyprusTransfer"));
const NorthCyprusTransfer = lazy(() => import("./pages/website/NorthCyprusTransfer"));
const BursaTransfer = lazy(() => import("./pages/website/BursaTransfer"));
const FrankfurtTransfer = lazy(() => import("./pages/website/FrankfurtTransfer"));
const GreeceTransfer = lazy(() => import("./pages/website/GreeceTransfer"));
const SwitzerlandTransfer = lazy(() => import("./pages/website/SwitzerlandTransfer"));

// New SEO Landing Pages
const IstanbulAirportTransfer = lazy(() => import("./pages/website/IstanbulAirportTransfer"));
const AntalyaAirportTransfer = lazy(() => import("./pages/website/AntalyaAirportTransfer"));
const BodrumAirportTransfer = lazy(() => import("./pages/website/BodrumAirportTransfer"));
const CappadociaAirportTransfer = lazy(() => import("./pages/website/CappadociaAirportTransfer"));
const DalamanAirportTransfer = lazy(() => import("./pages/website/DalamanAirportTransfer"));
const IzmirAirportTransfer = lazy(() => import("./pages/website/IzmirAirportTransfer"));
const IstanbulAirportHotelTransfer = lazy(() => import("./pages/website/IstanbulAirportHotelTransfer"));
const IstCityCenterVipTransfer = lazy(() => import("./pages/website/IstCityCenterVipTransfer"));
const SabihaGokcenPrivateTransfer = lazy(() => import("./pages/website/SabihaGokcenPrivateTransfer"));
const FleetPage = lazy(() => import("./pages/website/FleetPage"));
const AboutPage = lazy(() => import("./pages/website/AboutPage"));
const ContactPage = lazy(() => import("./pages/website/ContactPage"));
const ReviewsPage = lazy(() => import("./pages/website/ReviewsPage"));
const DestinationsPage = lazy(() => import("./pages/website/DestinationsPage"));
const DestinationDetail = lazy(() => import("./pages/website/DestinationDetail"));
const WhatsAppBooking = lazy(() => import("./pages/website/WhatsAppBooking"));
const TermsPage = lazy(() => import("./pages/website/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/website/PrivacyPage"));
const ServicesPage = lazy(() => import("./pages/website/ServicesPage"));
const BlogPage = lazy(() => import("./pages/website/BlogPage"));
const IstanbulAirportToCityGuide = lazy(() => import("./pages/website/blog/IstanbulAirportToCityGuide"));
const IstanbulTransferPriceGuide = lazy(() => import("./pages/website/blog/IstanbulTransferPriceGuide"));
const PrivateVsTaxiTurkey = lazy(() => import("./pages/website/blog/PrivateVsTaxiTurkey"));
const AntalyaAirportTransferGuide = lazy(() => import("./pages/website/blog/AntalyaAirportTransferGuide"));
const IsPrivateTransferWorthIt = lazy(() => import("./pages/website/blog/IsPrivateTransferWorthIt"));
const DubaiAirportTransferGuide = lazy(() => import("./pages/website/blog/DubaiAirportTransferGuide"));
const CyprusAirportTransferGuide = lazy(() => import("./pages/website/blog/CyprusAirportTransferGuide"));
const BursaDayTourGuide = lazy(() => import("./pages/website/blog/BursaDayTourGuide"));
const CappadociaAirportTransferGuide = lazy(() => import("./pages/website/blog/CappadociaAirportTransferGuide"));
const FethiyeAirportTransferGuide = lazy(() => import("./pages/website/blog/FethiyeAirportTransferGuide"));
const MarmarisAirportTransferGuide = lazy(() => import("./pages/website/blog/MarmarisAirportTransferGuide"));
const OludenizAirportTransferGuide = lazy(() => import("./pages/website/blog/OludenizAirportTransferGuide"));
const AydinAirportTransferGuide = lazy(() => import("./pages/website/blog/AydinAirportTransferGuide"));
const MuglaAirportTransferGuide = lazy(() => import("./pages/website/blog/MuglaAirportTransferGuide"));
const FrankfurtAirportTransferGuide = lazy(() => import("./pages/website/blog/FrankfurtAirportTransferGuide"));
const AthensAirportTransferGuide = lazy(() => import("./pages/website/blog/AthensAirportTransferGuide"));
const AIBookingAssistantGuide = lazy(() => import("./pages/website/blog/AIBookingAssistantGuide"));
const WhyMeetTransferTrusted = lazy(() => import("./pages/website/blog/WhyMeetTransferTrusted"));
const BestVIPTransferIstanbul = lazy(() => import("./pages/website/blog/BestVIPTransferIstanbul"));
const HowToChooseReliableTransfer = lazy(() => import("./pages/website/blog/HowToChooseReliableTransfer"));
const AntalyaAirportTransferBestService = lazy(() => import("./pages/website/blog/AntalyaAirportTransferBestService"));
const BodrumAirportTransferBestService = lazy(() => import("./pages/website/blog/BodrumAirportTransferBestService"));
const IzmirAirportTransferBestService = lazy(() => import("./pages/website/blog/IzmirAirportTransferBestService"));
const CappadociaAirportTransferBestService = lazy(() => import("./pages/website/blog/CappadociaAirportTransferBestService"));
const SafeNightTransferTurkey = lazy(() => import("./pages/website/blog/SafeNightTransferTurkey"));
const FamilyAirportTransferTurkey = lazy(() => import("./pages/website/blog/FamilyAirportTransferTurkey"));
const BusinessTravelTransferIstanbul = lazy(() => import("./pages/website/blog/BusinessTravelTransferIstanbul"));
const AirportTransferBookingTips = lazy(() => import("./pages/website/blog/AirportTransferBookingTips"));
const VIPAirportTransferTurkey = lazy(() => import("./pages/website/blog/VIPAirportTransferTurkey"));
const IntercityTransferTurkey = lazy(() => import("./pages/website/blog/IntercityTransferTurkey"));
const LuxuryMaybachTransferTurkey = lazy(() => import("./pages/website/blog/LuxuryMaybachTransferTurkey"));
const MardinAirportTransferGuide = lazy(() => import("./pages/website/blog/MardinAirportTransferGuide"));
const MidyatAirportTransferGuide = lazy(() => import("./pages/website/blog/MidyatAirportTransferGuide"));
const AgencyPartnershipGuide = lazy(() => import("./pages/website/blog/AgencyPartnershipGuide"));
const SwitzerlandAirportTransferGuide = lazy(() => import("./pages/website/blog/SwitzerlandAirportTransferGuide"));
const AirportTransferIstanbul = lazy(() => import("./pages/website/AirportTransferIstanbul"));
const SEODebugPage = lazy(() => import("./pages/SEODebugPage"));
const DebugPage = lazy(() => import("./pages/DebugPage"));

const queryClient = new QueryClient();

// Language prefixes for non-English routes
const LANG_PREFIXES = ["tr", "de", "fr", "ru", "it", "es", "ar", "uk", "ja"];

// Simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center px-6">
      <div className="mx-auto animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  </div>
);

// Lazy-load BlogLayout to keep it out of main bundle
const BlogLayout = lazy(() => import("./components/blog/BlogLayout").then(m => ({ default: m.BlogLayout })));

// Helper to create localized routes with Suspense
const localizedRoutes = (basePath: string, element: React.ReactNode) => {
  const wrappedElement = <Suspense fallback={<PageLoader />}>{element}</Suspense>;
  const routes = [
    <Route key={`en-${basePath}`} path={basePath} element={wrappedElement} />,
  ];
  
  LANG_PREFIXES.forEach((prefix) => {
    const localizedPath = basePath === "/" 
      ? `/${prefix}` 
      : `/${prefix}${basePath}`;
    routes.push(
      <Route key={`${prefix}-${basePath}`} path={localizedPath} element={wrappedElement} />
    );
  });
  
  return routes;
};

// Helper to create localized blog routes with BlogLayout wrapper
const localizedBlogRoutes = (basePath: string, element: React.ReactNode) => {
  const wrappedElement = (
    <Suspense fallback={<PageLoader />}>
      <BlogLayout>{element}</BlogLayout>
    </Suspense>
  );
  const routes = [
    <Route key={`en-${basePath}`} path={basePath} element={wrappedElement} />,
  ];
  
  LANG_PREFIXES.forEach((prefix) => {
    const localizedPath = `/${prefix}${basePath}`;
    routes.push(
      <Route key={`${prefix}-${basePath}`} path={localizedPath} element={wrappedElement} />
    );
  });
  
  return routes;
};

// Wrapper for lazy-loaded routes
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const App = () => (
  <ChunkErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <HashScroll />
          <LanguageQueryRedirect />
          <OAuthCallbackHandler>
            <LanguageProvider>
              <GeoLanguageInitializer />
              <PromoProvider>
              <AIChatProvider>
              <AITestProvider>
              <UpdateManager />
              <PWAInstallPrompt />
              <PWADebugPanel />
              <AdBlockWarning />
              <CanonicalManager />
              <AuthProvider>
                <Routes>
              {/* Localized Website Pages - Support all languages */}
              {localizedRoutes("/", <Index />)}
              {localizedRoutes("/services", <ServicesPage />)}
              {localizedRoutes("/destinations", <DestinationsPage />)}
              {localizedRoutes("/destinations/:cityName", <DestinationDetail />)}
              {localizedRoutes("/fleet", <FleetPage />)}
              {localizedRoutes("/about", <AboutPage />)}
              {localizedRoutes("/contact", <ContactPage />)}
              {localizedRoutes("/reviews", <ReviewsPage />)}
              {localizedRoutes("/terms", <TermsPage />)}
              {localizedRoutes("/privacy", <PrivacyPage />)}
              {localizedRoutes("/whatsapp-booking", <WhatsAppBooking />)}
              {localizedRoutes("/istanbul-transfer", <IstanbulTransfer />)}
              {localizedRoutes("/antalya-transfer", <AntalyaTransfer />)}
              {localizedRoutes("/bodrum-transfer", <BodrumTransfer />)}
              {localizedRoutes("/dalaman-transfer", <DalamanTransfer />)}
              {localizedRoutes("/izmir-transfer", <IzmirTransfer />)}
              {localizedRoutes("/cappadocia-transfer", <CappadociaTransfer />)}
              {localizedRoutes("/ephesus-pamukkale", <EphesusPamukkale />)}
              {localizedRoutes("/luxury-chauffeur", <LuxuryChauffeur />)}
              {localizedRoutes("/dubai-transfer", <DubaiTransfer />)}
              {localizedRoutes("/cyprus-transfer", <CyprusTransfer />)}
              {localizedRoutes("/north-cyprus-transfer", <NorthCyprusTransfer />)}
              {localizedRoutes("/bursa-transfer", <BursaTransfer />)}
              {localizedRoutes("/frankfurt-transfer", <FrankfurtTransfer />)}
              {localizedRoutes("/greece-transfer", <GreeceTransfer />)}
              {localizedRoutes("/switzerland-transfer", <SwitzerlandTransfer />)}
              {localizedRoutes("/book", <BookingPage />)}
              {localizedRoutes("/book/complete", <ReservationForm />)}
              
              {/* SEO Landing Pages */}
              {localizedRoutes("/istanbul-airport-transfer", <IstanbulAirportTransfer />)}
              {localizedRoutes("/antalya-airport-transfer", <AntalyaAirportTransfer />)}
              {localizedRoutes("/bodrum-airport-transfer", <BodrumAirportTransfer />)}
              {localizedRoutes("/cappadocia-airport-transfer", <CappadociaAirportTransfer />)}
              {localizedRoutes("/dalaman-airport-transfer", <DalamanAirportTransfer />)}
              {localizedRoutes("/izmir-airport-transfer", <IzmirAirportTransfer />)}
              {localizedRoutes("/istanbul-airport-hotel-transfer", <IstanbulAirportHotelTransfer />)}
              {localizedRoutes("/ist-city-center-vip-transfer", <IstCityCenterVipTransfer />)}
              {localizedRoutes("/sabiha-gokcen-private-transfer", <SabihaGokcenPrivateTransfer />)}
              {localizedBlogRoutes("/blog", <BlogPage />)}
              {localizedBlogRoutes("/blog/istanbul-airport-to-city-best-way", <IstanbulAirportToCityGuide />)}
              {localizedBlogRoutes("/blog/istanbul-airport-transfer-price-guide", <IstanbulTransferPriceGuide />)}
              {localizedBlogRoutes("/blog/private-vs-taxi-transfer-turkey", <PrivateVsTaxiTurkey />)}
              {localizedBlogRoutes("/blog/antalya-airport-transfer-to-hotels", <AntalyaAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/is-private-transfer-worth-it-turkey", <IsPrivateTransferWorthIt />)}
              {localizedBlogRoutes("/blog/dubai-airport-transfer-guide", <DubaiAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/cyprus-airport-transfer-guide", <CyprusAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/istanbul-bursa-day-tour-guide", <BursaDayTourGuide />)}
              {localizedBlogRoutes("/blog/cappadocia-airport-transfer-guide", <CappadociaAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/fethiye-airport-transfer-guide", <FethiyeAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/marmaris-airport-transfer-guide", <MarmarisAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/oludeniz-airport-transfer-guide", <OludenizAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/aydin-airport-transfer-guide", <AydinAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/mugla-airport-transfer-guide", <MuglaAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/frankfurt-airport-transfer-guide", <FrankfurtAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/ai-booking-assistant-guide", <AIBookingAssistantGuide />)}
              {localizedBlogRoutes("/blog/athens-airport-transfer-guide", <AthensAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/why-meet-transfer-trusted-company", <WhyMeetTransferTrusted />)}
              {localizedBlogRoutes("/blog/best-vip-transfer-istanbul-review", <BestVIPTransferIstanbul />)}
              {localizedBlogRoutes("/blog/how-to-choose-reliable-transfer-turkey", <HowToChooseReliableTransfer />)}
              {localizedBlogRoutes("/blog/antalya-airport-transfer-best-service", <AntalyaAirportTransferBestService />)}
              {localizedBlogRoutes("/blog/bodrum-airport-transfer-best-service", <BodrumAirportTransferBestService />)}
              {localizedBlogRoutes("/blog/izmir-airport-transfer-best-service", <IzmirAirportTransferBestService />)}
              {localizedBlogRoutes("/blog/cappadocia-airport-transfer-best-service", <CappadociaAirportTransferBestService />)}
              {localizedBlogRoutes("/blog/safe-night-transfer-turkey", <SafeNightTransferTurkey />)}
              {localizedBlogRoutes("/blog/family-airport-transfer-turkey", <FamilyAirportTransferTurkey />)}
              {localizedBlogRoutes("/blog/business-travel-transfer-istanbul", <BusinessTravelTransferIstanbul />)}
              {localizedBlogRoutes("/blog/airport-transfer-booking-tips", <AirportTransferBookingTips />)}
              {localizedBlogRoutes("/blog/vip-airport-transfer-turkey", <VIPAirportTransferTurkey />)}
              {localizedBlogRoutes("/blog/intercity-transfer-turkey", <IntercityTransferTurkey />)}
              {localizedBlogRoutes("/blog/luxury-maybach-transfer-turkey", <LuxuryMaybachTransferTurkey />)}
              {localizedBlogRoutes("/blog/mardin-airport-transfer-guide", <MardinAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/midyat-airport-transfer-guide", <MidyatAirportTransferGuide />)}
              {localizedBlogRoutes("/blog/agency-partnership-b2b-turkey", <AgencyPartnershipGuide />)}
              {localizedBlogRoutes("/blog/switzerland-airport-transfer-guide", <SwitzerlandAirportTransferGuide />)}
              {localizedRoutes("/airporttransfer/istanbul", <AirportTransferIstanbul />)}
              
              {/* Auth routes - Not localized (use common language) */}
              <Route path="/auth" element={<LazyRoute><Auth /></LazyRoute>} />
              <Route path="/login" element={<LazyRoute><LoginScreen /></LazyRoute>} />
              <Route path="/signup" element={<LazyRoute><SignupChoicePage /></LazyRoute>} />
              <Route path="/signup/customer" element={<LazyRoute><SignupScreen /></LazyRoute>} />
              <Route path="/signup/agency" element={<LazyRoute><AgencySignupScreen /></LazyRoute>} />
              <Route path="/login/agency" element={<LazyRoute><AgencyLoginScreen /></LazyRoute>} />
              <Route path="/login/driver" element={<LazyRoute><DriverLoginScreen /></LazyRoute>} />
              <Route path="/install" element={<LazyRoute><InstallApp /></LazyRoute>} />
              
              {/* Customer Routes - Protected */}
              <Route path="/customer" element={<CustomerRoute><LazyRoute><CustomerHome /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/bookings" element={<CustomerRoute><LazyRoute><CustomerBookings /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/reservations" element={<CustomerRoute><LazyRoute><CustomerBookings /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/reservation/:id" element={<CustomerRoute><LazyRoute><CustomerReservationDetail /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/reservations/:id" element={<CustomerRoute><LazyRoute><CustomerReservationDetail /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/reservation/:id/edit" element={<CustomerRoute><LazyRoute><CustomerEditReservation /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/reservations/:id/edit" element={<CustomerRoute><LazyRoute><CustomerEditReservation /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/review/:reservationId" element={<CustomerRoute><LazyRoute><CustomerReviewPage /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/profile" element={<CustomerRoute><LazyRoute><CustomerProfile /></LazyRoute></CustomerRoute>} />
              
              {/* Driver Routes - Protected */}
              <Route path="/driver" element={<DriverRoute><LazyRoute><DriverHome /></LazyRoute></DriverRoute>} />
              <Route path="/driver/jobs/:type" element={<DriverRoute><LazyRoute><DriverJobList /></LazyRoute></DriverRoute>} />
              <Route path="/driver/job/:id" element={<DriverRoute><LazyRoute><DriverJobDetails /></LazyRoute></DriverRoute>} />
              <Route path="/driver/accounting" element={<DriverRoute><LazyRoute><DriverAccounting /></LazyRoute></DriverRoute>} />
              <Route path="/driver/monthly-accounting" element={<DriverRoute><LazyRoute><DriverMonthlyAccounting /></LazyRoute></DriverRoute>} />
              <Route path="/driver/history" element={<DriverRoute><LazyRoute><DriverHistory /></LazyRoute></DriverRoute>} />
              
              {/* Admin Routes - Protected */}
              <Route path="/admin" element={<AdminRoute><LazyRoute><AdminDashboard /></LazyRoute></AdminRoute>} />
              <Route path="/admin/setup" element={<LazyRoute><AdminSetup /></LazyRoute>} />
              <Route path="/admin/reservations" element={<AdminRoute><LazyRoute><AdminReservations /></LazyRoute></AdminRoute>} />
              <Route path="/admin/reservations/create" element={<AdminRoute><LazyRoute><AdminCreateReservation /></LazyRoute></AdminRoute>} />
              <Route path="/admin/reservations/:id" element={<AdminRoute><LazyRoute><AdminEditReservation /></LazyRoute></AdminRoute>} />
              <Route path="/admin/drivers" element={<AdminRoute><LazyRoute><AdminDrivers /></LazyRoute></AdminRoute>} />
              <Route path="/admin/drivers/:driverId/jobs" element={<AdminRoute><LazyRoute><AdminDriverJobs /></LazyRoute></AdminRoute>} />
              <Route path="/admin/accounting" element={<AdminRoute><LazyRoute><AdminAccounting /></LazyRoute></AdminRoute>} />
              <Route path="/admin/monthly-accounting" element={<AdminRoute><LazyRoute><AdminMonthlyAccounting /></LazyRoute></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><LazyRoute><AdminSettings /></LazyRoute></AdminRoute>} />
              <Route path="/admin/templates" element={<AdminRoute><LazyRoute><AdminTemplates /></LazyRoute></AdminRoute>} />
              <Route path="/admin/calendar" element={<AdminRoute><LazyRoute><AdminCalendar /></LazyRoute></AdminRoute>} />
              <Route path="/admin/flight-monitor" element={<AdminRoute><LazyRoute><AdminFlightMonitor /></LazyRoute></AdminRoute>} />
              <Route path="/admin/agencies" element={<AdminRoute><LazyRoute><AdminAgencies /></LazyRoute></AdminRoute>} />
              <Route path="/admin/agency-accounting/:agencyId" element={<AdminRoute><LazyRoute><AdminAgencyAccounting /></LazyRoute></AdminRoute>} />
              
              <Route path="/admin/whatsapp" element={<AdminRoute><LazyRoute><AdminWhatsAppChat /></LazyRoute></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><LazyRoute><AdminAnalytics /></LazyRoute></AdminRoute>} />
              <Route path="/admin/quick-bookings" element={<AdminRoute><LazyRoute><AdminQuickBookings /></LazyRoute></AdminRoute>} />
              <Route path="/admin/app-installations" element={<AdminRoute><LazyRoute><AdminAppInstallations /></LazyRoute></AdminRoute>} />
              <Route path="/admin/agency-applications" element={<AdminRoute><LazyRoute><AdminAgencyApplications /></LazyRoute></AdminRoute>} />
              <Route path="/admin/filtered-reservations" element={<AdminRoute><LazyRoute><AdminFilteredReservations /></LazyRoute></AdminRoute>} />
              <Route path="/admin/monthly-profit" element={<AdminRoute><LazyRoute><AdminMonthlyProfit /></LazyRoute></AdminRoute>} />
              <Route path="/admin/region-prices" element={<AdminRoute><LazyRoute><AdminRegionPrices /></LazyRoute></AdminRoute>} />
              <Route path="/admin/login-attempts" element={<AdminRoute><LazyRoute><AdminLoginAttempts /></LazyRoute></AdminRoute>} />
              <Route path="/admin/hourly-rental-prices" element={<AdminRoute><LazyRoute><AdminHourlyRentalPrices /></LazyRoute></AdminRoute>} />
              <Route path="/admin/price-thresholds" element={<AdminRoute><LazyRoute><AdminPriceThresholds /></LazyRoute></AdminRoute>} />
              <Route path="/admin/promo-codes" element={<AdminRoute><LazyRoute><AdminPromoCodes /></LazyRoute></AdminRoute>} />
              
              {/* Agency Routes - Protected */}
              <Route path="/agency" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyHome /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              <Route path="/agency/create-reservation" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyCreateReservation /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              <Route path="/agency/reports" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyReports /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              <Route path="/agency/transactions" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyTransactionHistory /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              <Route path="/agency/currency/:currency" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyCurrencyDetail /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              <Route path="/agency/reservation/:id" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyReservationDetail /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              <Route path="/agency/reservation/:id/edit" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyEditReservation /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              
              {/* Customer Portal & Booking Confirmation - Public */}
              <Route path="/customer-portal" element={<LazyRoute><CustomerPortal /></LazyRoute>} />
              <Route path="/confirm-booking" element={<LazyRoute><ConfirmBooking /></LazyRoute>} />
              <Route path="/quick-booking-info" element={<LazyRoute><QuickBookingCustomerInfo /></LazyRoute>} />
              
              {/* Security Settings - Protected (all authenticated users) */}
              <Route path="/security-settings" element={<LazyRoute><SecuritySettings /></LazyRoute>} />
              
              {/* SEO Debug Page - Public */}
              <Route path="/seo-debug" element={<LazyRoute><SEODebugPage /></LazyRoute>} />
              
              {/* Debug Page - Public */}
              <Route path="/debug" element={<LazyRoute><DebugPage /></LazyRoute>} />
              
                <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
              </Routes>
              <FloatingWhatsApp />
            </AuthProvider>
            </AITestProvider>
            </AIChatProvider>
            </PromoProvider>
          </LanguageProvider>
        </OAuthCallbackHandler>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ChunkErrorBoundary>
);

export default App;
