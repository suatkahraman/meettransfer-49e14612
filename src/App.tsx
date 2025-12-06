import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Customer Pages
import CustomerHome from "./pages/customer/CustomerHome";
import CustomerBookings from "./pages/customer/CustomerBookings";

// Driver Pages
import DriverHome from "./pages/driver/DriverHome";
import DriverJobDetails from "./pages/driver/DriverJobDetails";
import DriverAccounting from "./pages/driver/DriverAccounting";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminEditReservation from "./pages/admin/AdminEditReservation";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminAccounting from "./pages/admin/AdminAccounting";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Customer Routes */}
            <Route path="/customer" element={<CustomerHome />} />
            <Route path="/customer/bookings" element={<CustomerBookings />} />
            
            {/* Driver Routes */}
            <Route path="/driver" element={<DriverHome />} />
            <Route path="/driver/job/:id" element={<DriverJobDetails />} />
            <Route path="/driver/accounting" element={<DriverAccounting />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/reservations" element={<AdminReservations />} />
            <Route path="/admin/reservations/:id" element={<AdminEditReservation />} />
            <Route path="/admin/drivers" element={<AdminDrivers />} />
            <Route path="/admin/accounting" element={<AdminAccounting />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
