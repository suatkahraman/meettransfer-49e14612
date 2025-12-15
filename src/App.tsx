import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AdminRoute, DriverRoute, CustomerRoute } from "./components/ProtectedRoute";
import { lazy, Suspense } from "react";

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

// Website Pages - lazy loaded
const IstanbulTransfer = lazy(() => import("./pages/website/IstanbulTransfer"));
const AntalyaTransfer = lazy(() => import("./pages/website/AntalyaTransfer"));
const BodrumTransfer = lazy(() => import("./pages/website/BodrumTransfer"));
const DalamanTransfer = lazy(() => import("./pages/website/DalamanTransfer"));
const IzmirTransfer = lazy(() => import("./pages/website/IzmirTransfer"));
const CappadociaTransfer = lazy(() => import("./pages/website/CappadociaTransfer"));
const EphesusPamukkale = lazy(() => import("./pages/website/EphesusPamukkale"));
const LuxuryChauffeur = lazy(() => import("./pages/website/LuxuryChauffeur"));
const FleetPage = lazy(() => import("./pages/website/FleetPage"));
const AboutPage = lazy(() => import("./pages/website/AboutPage"));
const ContactPage = lazy(() => import("./pages/website/ContactPage"));
const ReviewsPage = lazy(() => import("./pages/website/ReviewsPage"));
const DestinationsPage = lazy(() => import("./pages/website/DestinationsPage"));
const WhatsAppBooking = lazy(() => import("./pages/website/WhatsAppBooking"));
const TermsPage = lazy(() => import("./pages/website/TermsPage"));
const ServicesPage = lazy(() => import("./pages/website/ServicesPage"));

const queryClient = new QueryClient();

// Language prefixes for non-English routes
const LANG_PREFIXES = ["de", "fr", "ru", "it", "es"];

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
              {localizedRoutes("/whatsapp-booking", <WhatsAppBooking />)}
              {localizedRoutes("/istanbul-transfer", <IstanbulTransfer />)}
              {localizedRoutes("/antalya-transfer", <AntalyaTransfer />)}
              {localizedRoutes("/bodrum-transfer", <BodrumTransfer />)}
              {localizedRoutes("/dalaman-transfer", <DalamanTransfer />)}
              {localizedRoutes("/izmir-transfer", <IzmirTransfer />)}
              {localizedRoutes("/cappadocia-transfer", <CappadociaTransfer />)}
              {localizedRoutes("/ephesus-pamukkale", <EphesusPamukkale />)}
              {localizedRoutes("/luxury-chauffeur", <LuxuryChauffeur />)}
              {localizedRoutes("/book", <ReservationForm />)}
              
              {/* Auth routes - Not localized (use common language) */}
              <Route path="/auth" element={<LazyRoute><Auth /></LazyRoute>} />
              <Route path="/login" element={<LazyRoute><LoginScreen /></LazyRoute>} />
              <Route path="/signup" element={<LazyRoute><SignupScreen /></LazyRoute>} />
              <Route path="/install" element={<LazyRoute><InstallApp /></LazyRoute>} />
              
              {/* Customer Routes - Protected */}
              <Route path="/customer" element={<CustomerRoute><LazyRoute><CustomerHome /></LazyRoute></CustomerRoute>} />
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
              
              <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
