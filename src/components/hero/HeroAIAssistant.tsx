import { memo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
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
    <motion.div 
      className="mb-4 relative"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
    >
      {/* Glowing Background Effect */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl"
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Content Container */}
      <div className="relative bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl p-3 border border-primary/20 backdrop-blur-sm">
        {/* Animated Badge */}
        <motion.div 
          className="flex items-center gap-2 mb-3"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </motion.div>
          
          <span className="text-sm md:text-base font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
            {language === 'TR' 
              ? "🌍 Dünyada İlk: AI ile Transfer & Saatlik Kiralama" 
              : "🌍 World's First: Book Transfer & Hourly Rental With AI"}
          </span>
          
          {/* NEW Badge */}
          <motion.span 
            className="px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[9px] font-bold rounded-md shadow-lg"
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 0px rgba(239, 68, 68, 0.5)",
                "0 0 15px rgba(239, 68, 68, 0.8)",
                "0 0 0px rgba(239, 68, 68, 0.5)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            NEW
          </motion.span>
        </motion.div>
        
        {/* Chat Assistant */}
        <div className="relative">
          <Suspense fallback={<Skeleton className="h-[120px] w-full rounded-lg" />}>
            <BookingChatAssistant onApplyBooking={onApplyBooking} />
          </Suspense>
        </div>
      </div>
    </motion.div>
  );
});

HeroAIAssistant.displayName = "HeroAIAssistant";
