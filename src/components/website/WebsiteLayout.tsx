import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import WebsiteHeader from "./WebsiteHeader";
import BottomNavigation from "./BottomNavigation";
import ChatBot from "./ChatBot";
import { PWAInstallBanner } from "./PWAInstallBanner";

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

  return (
    <div className="min-h-screen bg-background">
      <WebsiteHeader />
      <motion.main 
        key={location.pathname}
        className={showBottomNav ? "pb-20" : ""}
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
      <ChatBot />
    </div>
  );
};

export default WebsiteLayout;
