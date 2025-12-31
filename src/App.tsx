import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AgencyLanguageProvider } from "./contexts/AgencyLanguageContext";
import { AdminRoute, DriverRoute, CustomerRoute, AgencyRoute } from "./components/ProtectedRoute";
import OAuthCallbackHandler from "./components/OAuthCallbackHandler";
import { lazy, Suspense } from "react";
import FloatingWhatsApp from "./components/website/FloatingWhatsApp";
import HashScroll from "@/components/HashScroll";
import LanguageQueryRedirect from "./components/LanguageQueryRedirect";

// Critical pages - lazy loaded with prefetch for better UX
const Index = lazy(() => import(/* webpackPrefetch: true */ "./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Auth pages - lazy loaded
const Auth = lazy(() => import("./pages/Auth"));
const LoginScreen = lazy(() => import("./pages/auth/LoginScreen"));
const SignupScreen = lazy(() => import("./pages/auth/SignupScreen"));
const ReservationForm = lazy(() => import("./pages/ReservationForm"));
const InstallApp = lazy(() => import("./pages/InstallApp"));

// Customer Pages - lazy loaded
const CustomerHome = lazy(() => import("./pages/customer/CustomerHome"));
const CustomerBookings = lazy(() => import("./pages/customer/CustomerBookings"));
const CustomerReservationDetail = lazy(() => import("./pages/customer/CustomerReservationDetail"));
const CustomerEditReservation = lazy(() => import("./pages/customer/CustomerEditReservation"));
const CustomerReviewPage = lazy(() => import("./pages/customer/CustomerReviewPage"));

// Driver Pages - lazy loaded
const DriverHome = lazy(() => import("./pages/driver/DriverHome"));
const DriverJobDetails = lazy(() => import("./pages/driver/DriverJobDetails"));
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
const AdminAgencyBalance = lazy(() => import("./pages/admin/AdminAgencyBalance"));
const AdminWhatsAppChat = lazy(() => import("./pages/admin/AdminWhatsAppChat"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminAppInstallations = lazy(() => import("./pages/admin/AdminAppInstallations"));

// Customer Portal Pages
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const ConfirmBooking = lazy(() => import("./pages/ConfirmBooking"));
const QuickBookingConfirm = lazy(() => import("./pages/QuickBookingConfirm"));
const QuickBookingCustomerInfo = lazy(() => import("./pages/QuickBookingCustomerInfo"));

// Admin Quick Bookings
const AdminQuickBookings = lazy(() => import("./pages/admin/AdminQuickBookings"));

// Agency Pages - lazy loaded
const AgencyHome = lazy(() => import("./pages/agency/AgencyHome"));
const AgencyReports = lazy(() => import("./pages/agency/AgencyReports"));
const AgencyReservationDetail = lazy(() => import("./pages/agency/AgencyReservationDetail"));
const AgencyCreateReservation = lazy(() => import("./pages/agency/AgencyCreateReservation"));

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
const BursaTransfer = lazy(() => import("./pages/website/BursaTransfer"));

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
const AirportTransferIstanbul = lazy(() => import("./pages/website/AirportTransferIstanbul"));

const queryClient = new QueryClient();

// Language prefixes for non-English routes
const LANG_PREFIXES = ["tr", "de", "fr", "ru", "it", "es", "ar", "uk", "ja"];

// Simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

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

// Wrapper for lazy-loaded routes
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <HashScroll />
        <LanguageQueryRedirect />
        <OAuthCallbackHandler>
          <LanguageProvider>
            <AuthProvider>
              <Routes>
              {/* Localized Website Pages - Support all languages */}
              {localizedRoutes("/", <Index />)}
              {localizedRoutes("/services", <ServicesPage />)}
              {localizedRoutes("/destinations", <DestinationsPage />)}
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
              {localizedRoutes("/bursa-transfer", <BursaTransfer />)}
              {localizedRoutes("/book", <ReservationForm />)}
              
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
              {localizedRoutes("/blog", <BlogPage />)}
              {localizedRoutes("/blog/istanbul-airport-to-city-best-way", <IstanbulAirportToCityGuide />)}
              {localizedRoutes("/blog/istanbul-airport-transfer-price-guide", <IstanbulTransferPriceGuide />)}
              {localizedRoutes("/blog/private-vs-taxi-transfer-turkey", <PrivateVsTaxiTurkey />)}
              {localizedRoutes("/blog/antalya-airport-transfer-to-hotels", <AntalyaAirportTransferGuide />)}
              {localizedRoutes("/blog/is-private-transfer-worth-it-turkey", <IsPrivateTransferWorthIt />)}
              {localizedRoutes("/blog/dubai-airport-transfer-guide", <DubaiAirportTransferGuide />)}
              {localizedRoutes("/blog/cyprus-airport-transfer-guide", <CyprusAirportTransferGuide />)}
              {localizedRoutes("/blog/istanbul-bursa-day-tour-guide", <BursaDayTourGuide />)}
              {localizedRoutes("/airporttransfer/istanbul", <AirportTransferIstanbul />)}
              
              {/* Auth routes - Not localized (use common language) */}
              <Route path="/auth" element={<LazyRoute><Auth /></LazyRoute>} />
              <Route path="/login" element={<LazyRoute><LoginScreen /></LazyRoute>} />
              <Route path="/signup" element={<LazyRoute><SignupScreen /></LazyRoute>} />
              <Route path="/install" element={<LazyRoute><InstallApp /></LazyRoute>} />
              
              {/* Customer Routes - Protected */}
              <Route path="/customer" element={<CustomerRoute><Navigate to="/customer/bookings" replace /></CustomerRoute>} />
              <Route path="/customer/bookings" element={<CustomerRoute><LazyRoute><CustomerBookings /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/reservations" element={<CustomerRoute><LazyRoute><CustomerBookings /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/reservation/:id" element={<CustomerRoute><LazyRoute><CustomerReservationDetail /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/reservation/:id/edit" element={<CustomerRoute><LazyRoute><CustomerEditReservation /></LazyRoute></CustomerRoute>} />
              <Route path="/customer/review/:reservationId" element={<CustomerRoute><LazyRoute><CustomerReviewPage /></LazyRoute></CustomerRoute>} />
              
              {/* Driver Routes - Protected */}
              <Route path="/driver" element={<DriverRoute><LazyRoute><DriverHome /></LazyRoute></DriverRoute>} />
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
              <Route path="/admin/agency-balance/:agencyId" element={<AdminRoute><LazyRoute><AdminAgencyBalance /></LazyRoute></AdminRoute>} />
              <Route path="/admin/whatsapp" element={<AdminRoute><LazyRoute><AdminWhatsAppChat /></LazyRoute></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><LazyRoute><AdminAnalytics /></LazyRoute></AdminRoute>} />
              <Route path="/admin/quick-bookings" element={<AdminRoute><LazyRoute><AdminQuickBookings /></LazyRoute></AdminRoute>} />
              <Route path="/admin/app-installations" element={<AdminRoute><LazyRoute><AdminAppInstallations /></LazyRoute></AdminRoute>} />
              
              {/* Agency Routes - Protected */}
              <Route path="/agency" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyHome /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              <Route path="/agency/create-reservation" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyCreateReservation /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              <Route path="/agency/reports" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyReports /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              <Route path="/agency/reservation/:id" element={<AgencyRoute><AgencyLanguageProvider><LazyRoute><AgencyReservationDetail /></LazyRoute></AgencyLanguageProvider></AgencyRoute>} />
              
              {/* Customer Portal & Booking Confirmation - Public */}
              <Route path="/customer-portal" element={<LazyRoute><CustomerPortal /></LazyRoute>} />
              <Route path="/confirm-booking" element={<LazyRoute><ConfirmBooking /></LazyRoute>} />
              <Route path="/quick-booking-confirm" element={<LazyRoute><QuickBookingConfirm /></LazyRoute>} />
              <Route path="/quick-booking-info" element={<LazyRoute><QuickBookingCustomerInfo /></LazyRoute>} />
              
                <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
              </Routes>
              <FloatingWhatsApp />
            </AuthProvider>
          </LanguageProvider>
        </OAuthCallbackHandler>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
