import { ReactNode, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import WebsiteHeader from "./WebsiteHeader";
import BottomNavigation from "./BottomNavigation";
import { PWAInstallBanner } from "./PWAInstallBanner";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useAdvancedTracking } from "@/hooks/useAdvancedTracking";

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
  
  // Track visitor for analytics
  useVisitorTracking();
  
  // Advanced tracking for scroll, clicks, form interactions
  const { visitorId } = useAdvancedTracking();

  // Only show proactive help on main pages (not admin, auth, etc.)
  const showProactiveHelp = !location.pathname.includes('/admin') && 
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
      <PWAInstallBanner />
      
      {/* Proactive help popup - appears after 90 seconds */}
      {showProactiveHelp && (
        <Suspense fallback={null}>
          <ProactiveHelpPopup delaySeconds={90} visitorId={visitorId} />
        </Suspense>
      )}
    </div>
  );
};

export default WebsiteLayout;
