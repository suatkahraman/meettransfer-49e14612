import { ReactNode, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import WebsiteHeader from "./WebsiteHeader";
import BottomNavigation from "./BottomNavigation";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useAdvancedTracking } from "@/hooks/useAdvancedTracking";
import { useAIChat } from "@/contexts/AIChatContext";

// Lazy load the proactive help popup
const ProactiveHelpPopup = lazy(() => import("./ProactiveHelpPopup"));
interface WebsiteLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 12 
  },
  animate: { 
    opacity: 1, 
    y: 0
  },
  exit: { 
    opacity: 0, 
    y: -12
  }
};

const pageTransition = {
  duration: 0.3,
  ease: "easeOut" as const
};

const WebsiteLayout = ({ children, showBottomNav = true }: WebsiteLayoutProps) => {
  const location = useLocation();
  const { isAIChatOpen } = useAIChat();
  
  // Track visitor for analytics
  useVisitorTracking();
  
  // Advanced tracking for scroll, clicks, form interactions
  const { visitorId } = useAdvancedTracking();

  // Only show proactive help on main pages (not admin, auth, etc.) and when AI chat is closed
  const showProactiveHelp = !isAIChatOpen &&
                            !location.pathname.includes('/admin') && 
                            !location.pathname.includes('/driver') && 
                            !location.pathname.includes('/agency') &&
                            !location.pathname.includes('/auth') &&
                            !location.pathname.includes('/customer');
  return (
    <div className="min-h-screen bg-background">
      <WebsiteHeader />
      <motion.main 
        key={location.pathname}
        className={`pt-12 sm:pt-16 ${showBottomNav ? "pb-20 md:pb-0" : ""}`}
        style={{ paddingTop: `calc(3rem + env(safe-area-inset-top, 0px))` }}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {children}
      </motion.main>
      {showBottomNav && <BottomNavigation />}
      
    </div>
  );
};

export default WebsiteLayout;
