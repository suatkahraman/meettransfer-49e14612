import { ReactNode } from "react";

interface SwipeableBookingCardProps {
  activeTab: "ride" | "hourly";
  setActiveTab: (tab: "ride" | "hourly") => void;
  language: string;
  t: (key: string) => string;
  children: ReactNode;
}

// Simplified booking card - removed react-swipeable and framer-motion for performance
// Touch swipe is not critical for tab switching as users prefer tapping
export const SwipeableBookingCard = ({
  children,
}: SwipeableBookingCardProps) => {
  return (
    <div
      className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] sm:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border sm:border-2 border-primary/20 overflow-hidden ring-1 ring-primary/10"
    >
      {children}
    </div>
  );
};
