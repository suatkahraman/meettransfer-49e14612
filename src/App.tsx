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

// Driver Pages
import DriverHome from "./pages/driver/DriverHome";
import DriverJobDetails from "./pages/driver/DriverJobDetails";
import DriverAccounting from "./pages/driver/DriverAccounting";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminEditReservation from "./pages/admin/AdminEditReservation";
import AdminCreateReservation from "./pages/admin/AdminCreateReservation";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminDriverJobs from "./pages/admin/AdminDriverJobs";
import AdminAccounting from "./pages/admin/AdminAccounting";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminTemplates from "./pages/admin/AdminTemplates";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/signup" element={<SignupScreen />} />
              <Route path="/book" element={<ReservationForm />} />
              <Route path="/install" element={<InstallApp />} />
              
              {/* Website Pages */}
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/destinations" element={<DestinationsPage />} />
              <Route path="/fleet" element={<FleetPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/whatsapp-booking" element={<WhatsAppBooking />} />
              <Route path="/istanbul-transfer" element={<IstanbulTransfer />} />
              <Route path="/antalya-transfer" element={<AntalyaTransfer />} />
              <Route path="/bodrum-transfer" element={<BodrumTransfer />} />
              <Route path="/dalaman-transfer" element={<DalamanTransfer />} />
              <Route path="/izmir-transfer" element={<IzmirTransfer />} />
              <Route path="/cappadocia-transfer" element={<CappadociaTransfer />} />
              <Route path="/ephesus-pamukkale" element={<EphesusPamukkale />} />
              <Route path="/luxury-chauffeur" element={<LuxuryChauffeur />} />
              
              {/* Customer Routes - Protected */}
              <Route path="/customer" element={<CustomerRoute><CustomerHome /></CustomerRoute>} />
              <Route path="/customer/bookings" element={<CustomerRoute><CustomerBookings /></CustomerRoute>} />
              <Route path="/customer/reservations" element={<CustomerRoute><CustomerBookings /></CustomerRoute>} />
              <Route path="/customer/reservation/:id" element={<CustomerRoute><CustomerReservationDetail /></CustomerRoute>} />
              
              {/* Driver Routes - Protected */}
              <Route path="/driver" element={<DriverRoute><DriverHome /></DriverRoute>} />
              <Route path="/driver/job/:id" element={<DriverRoute><DriverJobDetails /></DriverRoute>} />
              <Route path="/driver/accounting" element={<DriverRoute><DriverAccounting /></DriverRoute>} />
              
              {/* Admin Routes - Protected (except setup which is for initial admin creation) */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/setup" element={<AdminSetup />} />
              <Route path="/admin/reservations" element={<AdminRoute><AdminReservations /></AdminRoute>} />
              <Route path="/admin/reservations/create" element={<AdminRoute><AdminCreateReservation /></AdminRoute>} />
              <Route path="/admin/reservations/:id" element={<AdminRoute><AdminEditReservation /></AdminRoute>} />
              <Route path="/admin/drivers" element={<AdminRoute><AdminDrivers /></AdminRoute>} />
              <Route path="/admin/drivers/:driverId/jobs" element={<AdminRoute><AdminDriverJobs /></AdminRoute>} />
              <Route path="/admin/accounting" element={<AdminRoute><AdminAccounting /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/templates" element={<AdminRoute><AdminTemplates /></AdminRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
