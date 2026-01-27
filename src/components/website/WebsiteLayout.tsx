import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import WebsiteHeader from "./WebsiteHeader";
import BottomNavigation from "./BottomNavigation";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useAdvancedTracking } from "@/hooks/useAdvancedTracking";
import LazyMotionMain from "@/components/motion/LazyMotionMain";

interface WebsiteLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

const WebsiteLayout = ({ children, showBottomNav = true }: WebsiteLayoutProps) => {
  const location = useLocation();
  
  // Track visitor for analytics
  useVisitorTracking();
  
  // Advanced tracking for scroll, clicks, form interactions
  useAdvancedTracking();

  return (
    <div className="min-h-screen bg-background">
      <WebsiteHeader />
      <LazyMotionMain
        key={location.pathname}
        className={showBottomNav ? "pb-20 md:pb-0" : ""}
      >
        {children}
      </LazyMotionMain>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

export default WebsiteLayout;
