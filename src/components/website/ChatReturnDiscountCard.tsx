import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Percent, CalendarCheck, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatReturnDiscountCardProps {
  language: string;
  returnDate?: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage?: number;
  currency?: string;
  hasReturnTrip?: boolean;
  onAcceptReturn?: () => void;
}

export const ChatReturnDiscountCard = memo(function ChatReturnDiscountCard({
  language,
  returnDate,
  originalPrice,
  discountedPrice,
  discountPercentage = 25, // Default fallback - should be passed dynamically from usePromo
  currency = "EUR",
  hasReturnTrip = false,
  onAcceptReturn,
}: ChatReturnDiscountCardProps) {
  const isTurkish = language === "TR";
  const currencySymbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
  const savings = originalPrice - discountedPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mt-3 overflow-hidden rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/5 via-green-500/10 to-emerald-500/5"
    >
      {/* Header with discount badge */}
      <div className="flex items-center justify-between px-3 py-2 bg-green-500/10 border-b border-green-500/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
            <ArrowLeftRight className="h-4 w-4 text-green-600" />
          </div>
          <span className="font-semibold text-sm text-green-700 dark:text-green-400">
            {isTurkish ? "Dönüş Transferi" : "Return Transfer"}
          </span>
        </div>
        <motion.div
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg shadow-green-500/30"
        >
          <Percent className="h-3 w-3" />
          <span>-{discountPercentage}%</span>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Return date if provided */}
        {returnDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarCheck className="h-3.5 w-3.5 text-green-600" />
            <span>{isTurkish ? "Dönüş Tarihi:" : "Return Date:"}</span>
            <span className="font-medium text-foreground">{returnDate}</span>
          </div>
        )}

        {/* Price comparison */}
        <div className="flex items-center justify-between p-2.5 bg-background/80 rounded-lg border border-border/50">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {isTurkish ? "Normal Fiyat" : "Regular Price"}
            </span>
            <span className="text-sm text-muted-foreground line-through">
              {currencySymbol}{originalPrice}
            </span>
          </div>
          
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-end"
          >
            <span className="text-[10px] text-green-600 uppercase tracking-wide font-medium">
              {isTurkish ? "İndirimli Fiyat" : "Discounted Price"}
            </span>
            <span className="text-lg font-bold text-green-600">
              {currencySymbol}{discountedPrice}
            </span>
          </motion.div>
        </div>

        {/* Savings badge */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 py-1.5 px-3 bg-green-500/10 rounded-lg"
        >
          <Gift className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            {isTurkish 
              ? `${currencySymbol}${savings} tasarruf ediyorsunuz!` 
              : `You save ${currencySymbol}${savings}!`
            }
          </span>
        </motion.div>

        {/* CTA if no return trip yet */}
        {!hasReturnTrip && onAcceptReturn && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAcceptReturn}
            className="w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {isTurkish ? "Dönüş Transferi Ekle" : "Add Return Transfer"}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
});

export default ChatReturnDiscountCard;
