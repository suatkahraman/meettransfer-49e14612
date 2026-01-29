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
        // Mobile-first: base styles then desktop overrides
        "overflow-hidden rounded-2xl bg-card shadow-lg",
        // CLS: reserve stable height on desktop only
        "sm:min-h-[420px]",
        className
      )}
    >
      {children}
    </div>
  );
};
