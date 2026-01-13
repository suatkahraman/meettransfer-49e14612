import { ReactNode, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SwipeableBookingCardProps {
  activeTab: "ride" | "hourly";
  setActiveTab: (tab: "ride" | "hourly") => void;
  language: string;
  t: (key: string) => string;
  children: ReactNode;
}

export const SwipeableBookingCard = ({
  activeTab,
  setActiveTab,
  children,
}: SwipeableBookingCardProps) => {
  const handleSwipeLeft = useCallback(() => {
    if (activeTab === "ride") {
      setActiveTab("hourly");
    }
  }, [activeTab, setActiveTab]);

  const handleSwipeRight = useCallback(() => {
    if (activeTab === "hourly") {
      setActiveTab("ride");
    }
  }, [activeTab, setActiveTab]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    swipeDuration: 500,
    preventScrollOnSwipe: false,
  });

  return (
    <div
      {...swipeHandlers}
      className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] sm:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border sm:border-2 border-primary/20 overflow-hidden ring-1 ring-primary/10 touch-pan-y"
    >
      {children}
    </div>
  );
};
