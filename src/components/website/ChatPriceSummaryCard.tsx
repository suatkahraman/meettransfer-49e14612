import { memo } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Calendar, Clock, Users, Car, CreditCard, Plane, ArrowLeftRight, CheckCircle2, Sparkles, Baby, Briefcase, Wifi, Tv, Wine, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleFeatures {
  wifi?: boolean;
  tv?: boolean;
  minibar?: boolean;
  waterService?: boolean;
}

interface ChatPriceSummaryCardProps {
  language: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  passengers: number;
  vehicleType: string;
  vehicleLabel?: string;
  outboundPrice: number;
  returnPrice?: number;
  returnDiscountPercentage?: number;
  discountPercentage?: number;
  currency?: string;
  paymentMethod?: string;
  distance?: string;
  duration?: string;
  babySeatCount?: number;
  luggageCount?: number;
  vehicleFeatures?: VehicleFeatures;
}

export const ChatPriceSummaryCard = memo(function ChatPriceSummaryCard({
  language,
  pickup,
  dropoff,
  date,
  time,
  passengers,
  vehicleType,
  vehicleLabel,
  outboundPrice,
  returnPrice,
  returnDiscountPercentage = 25,
  discountPercentage,
  currency = "EUR",
  paymentMethod,
  distance,
  duration,
  babySeatCount = 0,
  luggageCount,
  vehicleFeatures,
}: ChatPriceSummaryCardProps) {
  const isTurkish = language === "TR";
  const currencySymbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
  
  // Calculate discounted prices
  const discountedOutbound = discountPercentage 
    ? Math.round(outboundPrice * (1 - discountPercentage / 100)) 
    : outboundPrice;
  
  const discountedReturn = returnPrice 
    ? Math.round(returnPrice * (1 - returnDiscountPercentage / 100))
    : 0;
  
  const totalPrice = discountedOutbound + discountedReturn;
  const originalTotal = outboundPrice + (returnPrice || 0);
  const totalSavings = originalTotal - totalPrice;

  // Vehicle display names
  const vehicleNames: Record<string, string> = {
    'mercedes-vito': 'Mercedes Vito',
    'vip-mercedes': 'Mercedes Vito VIP',
    'maybach-minibus': 'Mercedes Maybach Minivan',
    'minibus': 'Mercedes Sprinter'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-4 overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-xl shadow-primary/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <Sparkles className="h-4 w-4 text-primary" />
          </motion.div>
          <div>
            <h4 className="font-bold text-sm text-foreground">
              {isTurkish ? "Rezervasyon Özeti" : "Booking Summary"}
            </h4>
            <p className="text-[10px] text-muted-foreground">
              {isTurkish ? "Tüm detaylar aşağıda" : "All details below"}
            </p>
          </div>
        </div>
        <CheckCircle2 className="h-6 w-6 text-green-500" />
      </div>

      {/* Route Section */}
      <div className="p-4 space-y-4">
        {/* Route */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-500/20" />
            <div className="w-0.5 h-8 bg-gradient-to-b from-green-500 to-red-500" />
            <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {isTurkish ? "Alış Noktası" : "Pickup"}
              </p>
              <p className="text-sm font-medium truncate">{pickup}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {isTurkish ? "Varış Noktası" : "Dropoff"}
              </p>
              <p className="text-sm font-medium truncate">{dropoff}</p>
            </div>
          </div>
        </div>

        {/* Distance & Duration */}
        {(distance || duration) && (
          <div className="flex items-center gap-4 px-3 py-2 bg-muted/50 rounded-lg text-xs">
            {distance && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {distance}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {duration}
              </span>
            )}
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">{isTurkish ? "Tarih" : "Date"}</p>
              <p className="text-xs font-medium">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">{isTurkish ? "Saat" : "Time"}</p>
              <p className="text-xs font-medium">{time}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">{isTurkish ? "Yolcu" : "Passengers"}</p>
              <p className="text-xs font-medium">{passengers} {isTurkish ? "kişi" : "people"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <Car className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">{isTurkish ? "Araç" : "Vehicle"}</p>
              <p className="text-xs font-medium truncate">{vehicleLabel || vehicleNames[vehicleType] || vehicleType}</p>
            </div>
          </div>
          
          {/* Baby Seat */}
          {babySeatCount > 0 && (
            <div className="flex items-center gap-2 p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
              <Baby className="h-4 w-4 text-pink-500" />
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">{isTurkish ? "Bebek Koltuğu" : "Baby Seat"}</p>
                <p className="text-xs font-medium text-pink-600">{babySeatCount} {isTurkish ? "adet" : "pc"}</p>
              </div>
            </div>
          )}
          
          {/* Luggage */}
          {luggageCount !== undefined && luggageCount > 0 && (
            <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Briefcase className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">{isTurkish ? "Valiz" : "Luggage"}</p>
                <p className="text-xs font-medium text-amber-600">{luggageCount} {isTurkish ? "adet" : "pc"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Features */}
        {vehicleFeatures && (vehicleFeatures.wifi || vehicleFeatures.tv || vehicleFeatures.minibar || vehicleFeatures.waterService) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {vehicleFeatures.wifi && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-medium rounded-full">
                <Wifi className="h-3 w-3" /> WiFi
              </span>
            )}
            {vehicleFeatures.tv && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-600 text-[10px] font-medium rounded-full">
                <Tv className="h-3 w-3" /> TV
              </span>
            )}
            {vehicleFeatures.minibar && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-medium rounded-full">
                <Wine className="h-3 w-3" /> Minibar
              </span>
            )}
            {vehicleFeatures.waterService && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 text-cyan-600 text-[10px] font-medium rounded-full">
                <Droplets className="h-3 w-3" /> {isTurkish ? "Su" : "Water"}
              </span>
            )}
          </div>
        )}

        {/* Payment Method */}
        {paymentMethod && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-xs">
              {isTurkish ? "Ödeme:" : "Payment:"} {paymentMethod === 'card' ? (isTurkish ? 'Kredi Kartı' : 'Credit Card') : (isTurkish ? 'Nakit' : 'Cash')}
            </span>
          </div>
        )}

        {/* Pricing Section */}
        <div className="space-y-2 pt-3 border-t border-border/50">
          {/* Outbound Price */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {isTurkish ? "Gidiş Transferi" : "Outbound Transfer"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {discountPercentage && (
                <span className="text-xs text-muted-foreground line-through">
                  {currencySymbol}{outboundPrice}
                </span>
              )}
              <span className="font-semibold">{currencySymbol}{discountedOutbound}</span>
            </div>
          </div>

          {/* Return Price */}
          {returnPrice && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  {isTurkish ? "Dönüş Transferi" : "Return Transfer"}
                </span>
                <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-bold rounded">
                  -{returnDiscountPercentage}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground line-through">
                  {currencySymbol}{returnPrice}
                </span>
                <span className="font-semibold text-green-600">{currencySymbol}{discountedReturn}</span>
              </div>
            </div>
          )}

          {/* Total */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between pt-3 mt-2 border-t-2 border-dashed border-primary/30"
          >
            <span className="font-bold text-base">
              {isTurkish ? "Toplam" : "Total"}
            </span>
            <div className="flex flex-col items-end">
              {totalSavings > 0 && (
                <span className="text-[10px] text-green-600 font-medium">
                  {isTurkish ? `${currencySymbol}${totalSavings} tasarruf!` : `Save ${currencySymbol}${totalSavings}!`}
                </span>
              )}
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xl font-bold text-primary"
              >
                {currencySymbol}{totalPrice}
              </motion.span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

export default ChatPriceSummaryCard;
