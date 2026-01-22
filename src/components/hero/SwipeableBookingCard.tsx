import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SwipeableBookingCardProps {
  activeTab: "ride" | "hourly";
  setActiveTab: (tab: "ride" | "hourly") => void;
  language: string;
  t: (key: string) => string;
  children: ReactNode;
  className?: string;
}

// Simplified booking card - removed react-swipeable and framer-motion for performance
// Touch swipe is not critical for tab switching as users prefer tapping
export const SwipeableBookingCard = ({
  children,
  className,
}: SwipeableBookingCardProps) => {
  return (
    <div
      className={cn(
        "bg-card rounded-lg sm:rounded-xl md:rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] sm:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border sm:border-2 border-primary/20 overflow-hidden ring-1 ring-primary/10",
        // CLS: reserve stable height for above-the-fold booking card on first paint
        "min-h-[430px] md:min-h-[460px]",
        className
      )}
    >
      {children}
    </div>
  );
};
