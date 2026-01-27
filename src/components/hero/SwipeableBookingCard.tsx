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
        "bg-card rounded-2xl shadow-lg overflow-hidden",
        // CLS: reserve stable height for above-the-fold booking card on first paint (reduced for simplified design)
        "min-h-[380px] md:min-h-[420px]",
        className
      )}
    >
      {children}
    </div>
  );
};
