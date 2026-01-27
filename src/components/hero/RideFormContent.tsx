import { memo, useState, useCallback, useMemo } from "react";
import { CalendarIcon, Clock, Users, ArrowRight, Loader2, Zap, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LazyFloatingLabelSelect } from "@/components/ui/lazy-select";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-datepicker";
import { LocationInputs } from "@/components/hero";
import { VehiclePrice } from "./types";
import { PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePromo } from "@/contexts/PromoContext";
import { VehicleRegion } from "@/lib/vehicleRegions";
import { format } from "date-fns";

// Memoize time options generation - only compute once
const timeOptions = (() => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return times;
})();

interface RideFormContentProps {
  pickup: string;
  dropoff: string;
  date: Date | undefined;
  time: string;
  passengers: string;
  vehicleType: string;
  allVehiclePrices: VehiclePrice[];
  loadingTransferPrice: boolean;
  transferPriceCurrency: string;
  submitting: boolean;
  language: string;
  t: (key: string) => string;
  onPickupSelected: (value: string, details?: PlaceDetails) => void;
  onDropoffSelected: (value: string, details?: PlaceDetails) => void;
  onSwapLocations: () => void;
  setDate: (date: Date | undefined) => void;
  setTime: (time: string) => void;
  setPassengers: (passengers: string) => void;
  setVehicleType: (type: string) => void;
  handleRideContinue: () => void;
  // Return trip
  returnDate?: Date | undefined;
  returnTime?: string;
  hasReturnTrip?: boolean;
  setReturnDate?: (date: Date | undefined) => void;
  setReturnTime?: (time: string) => void;
  setHasReturnTrip?: (value: boolean) => void;
  // Extras
  babySeatCount?: number;
  luggageCount?: number;
  setBabySeatCount?: (count: number) => void;
  setLuggageCount?: (count: number) => void;
  // Route region from edge function
  routeRegion?: VehicleRegion;
}

interface ValidationErrors {
  pickup?: boolean;
  dropoff?: boolean;
  date?: boolean;
  time?: boolean;
}

export const RideFormContent = memo(({
  pickup,
  dropoff,
  date,
  time,
  passengers,
  vehicleType,
  submitting,
  language,
  t,
  onPickupSelected,
  onDropoffSelected,
  onSwapLocations,
  setDate,
  setTime,
  setPassengers,
  handleRideContinue,
  // Return trip
  returnDate,
  returnTime,
  hasReturnTrip = false,
  setReturnDate,
  setReturnTime,
  setHasReturnTrip,
  // Extras
  babySeatCount = 0,
  luggageCount = 0,
  setBabySeatCount,
  setLuggageCount,
  // Route region
  routeRegion = 'default',
}: RideFormContentProps) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [shakeFields, setShakeFields] = useState<ValidationErrors>({});
  
  // Get dynamic promo discount from context
  const { promoCode } = usePromo();
  const discountPercent = promoCode?.discountPercentage || 25;
  
  // Disable return trip discount for Dubai and Switzerland regions
  const isDiscountDisabledRegion = routeRegion === 'dubai' || routeRegion === 'switzerland';
  
  // Memoize time options for Select
  const memoizedTimeOptions = useMemo(() => 
    timeOptions.map(opt => ({ value: opt, label: opt })),
    []
  );

  const validateAndContinue = useCallback(() => {
    const newErrors: ValidationErrors = {};
    const missing: string[] = [];
    
    if (!pickup) {
      newErrors.pickup = true;
      missing.push(t("pickupPoint") || "Pickup");
    }
    if (!dropoff) {
      newErrors.dropoff = true;
      missing.push(t("dropoffLocation") || "Drop-off");
    }
    if (!date) {
      newErrors.date = true;
      missing.push(t("pickupDate") || "Date");
    }
    if (!time) {
      newErrors.time = true;
      missing.push(t("pickupTime") || "Time");
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShakeFields(newErrors);
      
      // Remove shake after animation
      setTimeout(() => setShakeFields({}), 500);
      
      toast.error(`${t("pleaseFilAllFields") || "Please fill in"}: ${missing.join(", ")}`);
      return;
    }
    
    setErrors({});
    handleRideContinue();
  }, [pickup, dropoff, date, time, t, handleRideContinue]);

  // Clear error when field is filled
  const handlePickupChange = useCallback((value: string, details?: PlaceDetails) => {
    if (errors.pickup && value) {
      setErrors(prev => ({ ...prev, pickup: false }));
    }
    onPickupSelected(value, details);
  }, [errors.pickup, onPickupSelected]);

  const handleDropoffChange = useCallback((value: string, details?: PlaceDetails) => {
    if (errors.dropoff && value) {
      setErrors(prev => ({ ...prev, dropoff: false }));
    }
    onDropoffSelected(value, details);
  }, [errors.dropoff, onDropoffSelected]);

  const handleDateChange = useCallback((newDate: Date | undefined) => {
    if (errors.date && newDate) {
      setErrors(prev => ({ ...prev, date: false }));
    }
    setDate(newDate);
  }, [errors.date, setDate]);

  const handleTimeChange = useCallback((newTime: string) => {
    if (errors.time && newTime) {
      setErrors(prev => ({ ...prev, time: false }));
    }
    setTime(newTime);
  }, [errors.time, setTime]);

  const handlePassengerIncrement = useCallback(() => {
    const current = parseInt(passengers) || 1;
    if (current < 18) {
      setPassengers((current + 1).toString());
    }
  }, [passengers, setPassengers]);

  const handlePassengerDecrement = useCallback(() => {
    const current = parseInt(passengers) || 1;
    if (current > 1) {
      setPassengers((current - 1).toString());
    }
  }, [passengers, setPassengers]);

  return (
    <div key="ride-form" className="space-y-3 md:space-y-3">
      {/* Location Inputs - Always visible, enlarged */}
      <div className={cn(
        (shakeFields.pickup || shakeFields.dropoff) && "animate-shake"
      )}>
        <LocationInputs 
          pickup={pickup} 
          dropoff={dropoff} 
          onPickupSelected={handlePickupChange} 
          onDropoffSelected={handleDropoffChange} 
          onSwapLocations={onSwapLocations} 
          language={language}
          pickupError={errors.pickup}
          dropoffError={errors.dropoff}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 pb-2 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700",
          shakeFields.date && "animate-shake",
          errors.date && "ring-2 ring-destructive/30"
        )}>
          <label className="block text-sm font-medium text-foreground/60 mb-1">
            {t("pickupDate") || "Pickup date"}
          </label>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-foreground/50 flex-shrink-0" />
            <FloatingLabelDatePicker 
              label="" 
              date={date} 
              onSelect={handleDateChange} 
              disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
              dateFormat="EEE, dd MMM"
              triggerClassName="bg-transparent border-0 p-0 h-auto text-base font-semibold text-foreground hover:bg-transparent focus:ring-0 shadow-none justify-start"
            />
          </div>
        </div>
        <div className={cn(
          "bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 pb-2 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700",
          shakeFields.time && "animate-shake",
          errors.time && "ring-2 ring-destructive/30"
        )}>
          <label className="block text-sm font-medium text-foreground/60 mb-1">
            {t("pickupTime") || "Pickup time"}
          </label>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-foreground/50 flex-shrink-0" />
            <LazyFloatingLabelSelect 
              label="" 
              value={time} 
              onValueChange={handleTimeChange} 
              options={memoizedTimeOptions} 
              triggerClassName="bg-transparent border-0 p-0 h-auto text-base font-semibold text-foreground hover:bg-transparent focus:ring-0 shadow-none justify-start min-w-0"
            />
          </div>
        </div>
      </div>

      {/* Return Trip Button - Uppercase centered like reference */}
      {setHasReturnTrip && !isDiscountDisabledRegion && (
        <button
          type="button"
          onClick={() => setHasReturnTrip(!hasReturnTrip)}
          className={cn(
            "w-full py-4 rounded-xl transition-all text-base font-bold tracking-wide uppercase",
            hasReturnTrip 
              ? "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 ring-2 ring-green-500" 
              : "bg-zinc-100 dark:bg-zinc-800 text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700"
          )}
        >
          {hasReturnTrip ? (
            <span className="flex items-center justify-center gap-2">
              <RotateCcw className="h-5 w-5" />
              {t("returnAdded") || "RETURN ADDED"} • {discountPercent}% OFF
            </span>
          ) : (
            <span>{t("addReturn")?.toUpperCase() || "ADD RETURN"}</span>
          )}
        </button>
      )}

      {/* Return Date/Time - Show when return trip is enabled */}
      {hasReturnTrip && setReturnDate && setReturnTime && (
        <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 pb-2">
            <label className="block text-sm font-medium text-foreground/60 mb-1">
              {t("returnDate") || "Return date"}
            </label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-foreground/50 flex-shrink-0" />
              <FloatingLabelDatePicker 
                label="" 
                date={returnDate} 
                onSelect={setReturnDate} 
                disabledDates={(d) => d < (date || new Date())} 
                dateFormat="EEE, dd MMM"
                triggerClassName="bg-transparent border-0 p-0 h-auto text-base font-semibold text-foreground hover:bg-transparent focus:ring-0 shadow-none justify-start"
              />
            </div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 pb-2">
            <label className="block text-sm font-medium text-foreground/60 mb-1">
              {t("returnTime") || "Return time"}
            </label>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-foreground/50 flex-shrink-0" />
              <LazyFloatingLabelSelect 
                label="" 
                value={returnTime || ""} 
                onValueChange={setReturnTime} 
                options={timeOptions.map(opt => ({ value: opt, label: opt }))} 
                triggerClassName="bg-transparent border-0 p-0 h-auto text-base font-semibold text-foreground hover:bg-transparent focus:ring-0 shadow-none justify-start min-w-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Passengers - Floating label with dark square +/- buttons like reference */}
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-foreground/50" />
          <span className="text-sm font-medium text-foreground/60">
            {t("passengers") || "Passengers"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{passengers}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePassengerDecrement}
              disabled={parseInt(passengers) <= 1}
              className="w-11 h-11 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xl hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="h-5 w-5" strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={handlePassengerIncrement}
              disabled={parseInt(passengers) >= 18}
              className="w-11 h-11 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xl hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Baby Seat & Luggage removed from Hero - now only in Book page */}

      {/* Submit Button */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-2xl animate-pulse md:hidden" />
        <Button 
          onClick={validateAndContinue} 
          disabled={submitting} 
          className="relative w-full h-16 md:h-14 min-h-[64px] md:min-h-[56px] font-bold bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:to-primary active:from-primary/80 active:to-primary/80 shadow-xl shadow-primary/30 md:shadow-lg rounded-xl text-lg md:text-base group touch-manipulation border-0 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/40"
        >
          {submitting ? (
            <Loader2 className="h-6 w-6 md:h-5 md:w-5 animate-spin" />
          ) : (
            <>
              <Zap className="mr-2 h-5 w-5 md:h-4 md:w-4 animate-pulse" />
              <span className="tracking-wide">{t("getQuote")}</span>
              <ArrowRight className="ml-2 h-6 w-6 md:h-5 md:w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

RideFormContent.displayName = "RideFormContent";
