import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AdminRoute, DriverRoute, CustomerRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import LoginScreen from "./pages/auth/LoginScreen";
import SignupScreen from "./pages/auth/SignupScreen";
import ReservationForm from "./pages/ReservationForm";
import InstallApp from "./pages/InstallApp";
import NotFound from "./pages/NotFound";

// Customer Pages
import CustomerHome from "./pages/customer/CustomerHome";
import CustomerBookings from "./pages/customer/CustomerBookings";
import CustomerReservationDetail from "./pages/customer/CustomerReservationDetail";
import CustomerEditReservation from "./pages/customer/CustomerEditReservation";
import CustomerReviewPage from "./pages/customer/CustomerReviewPage";

// Driver Pages
import DriverHome from "./pages/driver/DriverHome";
import DriverJobDetails from "./pages/driver/DriverJobDetails";
import DriverAccounting from "./pages/driver/DriverAccounting";
import DriverHistory from "./pages/driver/DriverHistory";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminEditReservation from "./pages/admin/AdminEditReservation";
import AdminCreateReservation from "./pages/admin/AdminCreateReservation";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminDriverJobs from "./pages/admin/AdminDriverJobs";
import AdminAccounting from "./pages/admin/AdminAccounting";
import AdminMonthlyAccounting from "./pages/admin/AdminMonthlyAccounting";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminAgencies from "./pages/admin/AdminAgencies";
import AdminAgencyAccounting from "./pages/admin/AdminAgencyAccounting";
import AdminAgencyBalance from "./pages/admin/AdminAgencyBalance";

import DriverMonthlyAccounting from "./pages/driver/DriverMonthlyAccounting";

// Website Pages
import IstanbulTransfer from "./pages/website/IstanbulTransfer";
import AntalyaTransfer from "./pages/website/AntalyaTransfer";
import BodrumTransfer from "./pages/website/BodrumTransfer";
import DalamanTransfer from "./pages/website/DalamanTransfer";
import IzmirTransfer from "./pages/website/IzmirTransfer";
import CappadociaTransfer from "./pages/website/CappadociaTransfer";
import EphesusPamukkale from "./pages/website/EphesusPamukkale";
import LuxuryChauffeur from "./pages/website/LuxuryChauffeur";
import FleetPage from "./pages/website/FleetPage";
import AboutPage from "./pages/website/AboutPage";
import ContactPage from "./pages/website/ContactPage";
import ReviewsPage from "./pages/website/ReviewsPage";
import DestinationsPage from "./pages/website/DestinationsPage";
import WhatsAppBooking from "./pages/website/WhatsAppBooking";
import TermsPage from "./pages/website/TermsPage";
import ServicesPage from "./pages/website/ServicesPage";

const queryClient = new QueryClient();

// Language prefixes for non-English routes
const LANG_PREFIXES = ["de", "fr", "ru", "it", "es"];

// Helper to create localized routes
const localizedRoutes = (basePath: string, element: React.ReactNode) => {
  const routes = [
    <Route key={`en-${basePath}`} path={basePath} element={element} />,
  ];
  
  LANG_PREFIXES.forEach((prefix) => {
    const localizedPath = basePath === "/" 
      ? `/${prefix}` 
      : `/${prefix}${basePath}`;
    routes.push(
      <Route key={`${prefix}-${basePath}`} path={localizedPath} element={element} />
    );
  });
  
  return routes;
};

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
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/signup" element={<SignupScreen />} />
              <Route path="/install" element={<InstallApp />} />
              
              {/* Customer Routes - Protected */}
              <Route path="/customer" element={<CustomerRoute><CustomerHome /></CustomerRoute>} />
              <Route path="/customer/bookings" element={<CustomerRoute><CustomerBookings /></CustomerRoute>} />
              <Route path="/customer/reservations" element={<CustomerRoute><CustomerBookings /></CustomerRoute>} />
              <Route path="/customer/reservation/:id" element={<CustomerRoute><CustomerReservationDetail /></CustomerRoute>} />
              <Route path="/customer/reservation/:id/edit" element={<CustomerRoute><CustomerEditReservation /></CustomerRoute>} />
              <Route path="/customer/review/:reservationId" element={<CustomerRoute><CustomerReviewPage /></CustomerRoute>} />
              
              {/* Driver Routes - Protected */}
              <Route path="/driver" element={<DriverRoute><DriverHome /></DriverRoute>} />
              <Route path="/driver/job/:id" element={<DriverRoute><DriverJobDetails /></DriverRoute>} />
              <Route path="/driver/accounting" element={<DriverRoute><DriverAccounting /></DriverRoute>} />
              <Route path="/driver/monthly-accounting" element={<DriverRoute><DriverMonthlyAccounting /></DriverRoute>} />
              <Route path="/driver/history" element={<DriverRoute><DriverHistory /></DriverRoute>} />
              
              {/* Admin Routes - Protected */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/setup" element={<AdminSetup />} />
              <Route path="/admin/reservations" element={<AdminRoute><AdminReservations /></AdminRoute>} />
              <Route path="/admin/reservations/create" element={<AdminRoute><AdminCreateReservation /></AdminRoute>} />
              <Route path="/admin/reservations/:id" element={<AdminRoute><AdminEditReservation /></AdminRoute>} />
              <Route path="/admin/drivers" element={<AdminRoute><AdminDrivers /></AdminRoute>} />
              <Route path="/admin/drivers/:driverId/jobs" element={<AdminRoute><AdminDriverJobs /></AdminRoute>} />
              <Route path="/admin/accounting" element={<AdminRoute><AdminAccounting /></AdminRoute>} />
              <Route path="/admin/monthly-accounting" element={<AdminRoute><AdminMonthlyAccounting /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/templates" element={<AdminRoute><AdminTemplates /></AdminRoute>} />
              <Route path="/admin/calendar" element={<AdminRoute><AdminCalendar /></AdminRoute>} />
              <Route path="/admin/agencies" element={<AdminRoute><AdminAgencies /></AdminRoute>} />
              <Route path="/admin/agency-accounting/:agencyId" element={<AdminRoute><AdminAgencyAccounting /></AdminRoute>} />
              <Route path="/admin/agency-balance/:agencyId" element={<AdminRoute><AdminAgencyBalance /></AdminRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
