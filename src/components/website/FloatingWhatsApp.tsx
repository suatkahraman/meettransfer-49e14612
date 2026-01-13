import { useLocation } from "react-router-dom";
import WhatsAppButton from "./WhatsAppButton";
import { useAIChat } from "@/contexts/AIChatContext";

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
  const { isAIChatOpen } = useAIChat();
  
  // Check if current route is excluded
  const isExcluded = EXCLUDED_ROUTES.some(route => 
    location.pathname.startsWith(route) || 
    location.pathname.includes(route)
  );

  // Hide when AI chat is open or route is excluded
  if (isExcluded || isAIChatOpen) {
    return null;
  }

  return <WhatsAppButton variant="floating" />;
};

export default FloatingWhatsApp;
