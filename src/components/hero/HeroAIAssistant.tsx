import { memo, lazy, Suspense } from "react";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingData } from "./types";

const BookingChatAssistant = lazy(() => import("@/components/website/BookingChatAssistant"));

interface HeroAIAssistantProps {
  language: string;
  onApplyBooking: (data: BookingData) => void;
}

export const HeroAIAssistant = memo(({ language, onApplyBooking }: HeroAIAssistantProps) => {
  return (
    <div className="mb-4 relative">
      {/* Content Container - Softer colors */}
      <div className="relative bg-muted/50 rounded-xl p-3 border border-border backdrop-blur-sm">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          
          <span className="text-sm font-medium text-foreground">
            {language === 'TR' 
              ? "🌍 AI ile Transfer & Saatlik Kiralama" 
              : "🌍 Book Transfer & Hourly Rental With AI"}
          </span>
          
          {/* NEW Badge - Softer */}
          <span className="px-1.5 py-0.5 bg-primary/80 text-primary-foreground text-[9px] font-bold rounded-md">
            NEW
          </span>
        </div>
        
        {/* Chat Assistant */}
        <div className="relative">
          <Suspense fallback={<Skeleton className="h-[120px] w-full rounded-lg" />}>
            <BookingChatAssistant onApplyBooking={onApplyBooking} defaultOpen />
          </Suspense>
        </div>
      </div>
    </div>
  );
});

HeroAIAssistant.displayName = "HeroAIAssistant";
