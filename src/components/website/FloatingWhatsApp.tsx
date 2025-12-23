import { useLocation } from "react-router-dom";
import WhatsAppButton from "./WhatsAppButton";

// Routes where floating WhatsApp button should NOT appear
const EXCLUDED_ROUTES = [
  "/admin",
  "/driver",
  "/customer",
  "/agency",
  "/auth",
  "/login",
  "/signup",
  "/customer-portal",
  "/confirm-booking",
];

const FloatingWhatsApp = () => {
  const location = useLocation();
  
  // Check if current route is excluded
  const isExcluded = EXCLUDED_ROUTES.some(route => 
    location.pathname.startsWith(route) || 
    location.pathname.includes(route)
  );

  if (isExcluded) {
    return null;
  }

  return <WhatsAppButton variant="floating" />;
};

export default FloatingWhatsApp;
