import { memo, useState, useCallback, useMemo } from "react";
import { CalendarIcon, Clock, Users, ArrowRight, Loader2, Zap, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimePickerAMPM } from "@/components/ui/time-picker-ampm";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-datepicker";
import { LocationInputs } from "./LocationInputs";
import { VehiclePrice } from "./types";
import { PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePromo } from "@/contexts/PromoContext";
import { VehicleRegion } from "@/lib/vehicleRegions";
import { format } from "date-fns";
import { scrollToFirstError } from "@/lib/formValidation";


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
  

  const validateAndContinue = useCallback(() => {
    const newErrors: ValidationErrors = {};
    const missing: string[] = [];
    const errorFieldIds: string[] = [];
    
    if (!pickup) {
      newErrors.pickup = true;
      missing.push(t("pickupPoint") || "Pickup");
      errorFieldIds.push("ride-pickup-field");
    }
    if (!dropoff) {
      newErrors.dropoff = true;
      missing.push(t("dropoffLocation") || "Drop-off");
      errorFieldIds.push("ride-dropoff-field");
    }
    if (!date) {
      newErrors.date = true;
      missing.push(t("pickupDate") || "Date");
      errorFieldIds.push("ride-date-field");
    }
    if (!time) {
      newErrors.time = true;
      missing.push(t("pickupTime") || "Time");
      errorFieldIds.push("ride-time-field");
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShakeFields(newErrors);
      
      // Remove shake after animation
      setTimeout(() => setShakeFields({}), 500);
      
      // Scroll to first error field
      if (errorFieldIds.length > 0) {
        scrollToFirstError(errorFieldIds);
      }
      
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
    <div key="ride-form" className="flex flex-1 flex-col space-y-3">
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
      
      {/* Date & Time Row - mobile-first grid */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          id="ride-date-field"
          className={cn(
            "flex h-[75px] cursor-pointer flex-col justify-center overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-3 transition-all hover:bg-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700",
            shakeFields.date && "animate-shake",
            errors.date && "ring-2 ring-destructive/30"
          )}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('button')) {
              const trigger = (e.currentTarget as HTMLElement).querySelector('button') as HTMLButtonElement;
              trigger?.click();
            }
          }}
        >
          <label className={cn(
            "pointer-events-none mb-0.5 block text-xs font-medium",
            errors.date ? "text-destructive" : "text-foreground/70"
          )}>
            {t("pickupDate") || "Pickup date"}
          </label>
          <div className="flex min-w-0 items-center gap-2">
            <CalendarIcon className={cn("pointer-events-none h-4 w-4 flex-shrink-0", errors.date ? "text-destructive" : "text-foreground")} />
            <div className="min-w-0 flex-1 overflow-hidden">
              <FloatingLabelDatePicker 
                label="" 
                date={date} 
                onSelect={handleDateChange} 
                disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                dateFormat="EEE, dd MMM"
                triggerClassName="h-auto w-full justify-start truncate border-0 bg-transparent p-0 text-sm font-semibold text-foreground shadow-none hover:bg-transparent focus:ring-0"
                icon={<span />}
              />
            </div>
          </div>
          {errors.date && (
            <p className="pointer-events-none mt-0.5 animate-fade-in text-xs font-medium text-destructive">
              {t('required') || 'Required'}
            </p>
          )}
        </div>
        <div 
          id="ride-time-field"
          className={cn(
            "flex h-[75px] cursor-pointer flex-col justify-center overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-3 transition-all hover:bg-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700",
            shakeFields.time && "animate-shake",
            errors.time && "ring-2 ring-destructive/30"
          )}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('button')) {
              const trigger = (e.currentTarget as HTMLElement).querySelector('button') as HTMLButtonElement;
              trigger?.click();
            }
          }}
        >
          <label className={cn(
            "pointer-events-none mb-0.5 block text-xs font-medium",
            errors.time ? "text-destructive" : "text-foreground/70"
          )}>
            {t("pickupTime") || "Pickup time"}
          </label>
          <div className="flex min-w-0 items-center gap-2">
            <Clock className={cn("pointer-events-none h-4 w-4 flex-shrink-0", errors.time ? "text-destructive" : "text-foreground")} />
            <TimePickerAMPM 
              value={time} 
              onValueChange={handleTimeChange} 
              triggerClassName="text-sm font-semibold text-foreground"
              labels={{
                hour: t("timeHour") || "Hour",
                minute: t("timeMinute") || "Minute",
                save: t("timeSave") || "Save"
              }}
            />
          </div>
          {errors.time && (
            <p className="pointer-events-none mt-0.5 animate-fade-in text-xs font-medium text-destructive">
              {t('required') || 'Required'}
            </p>
          )}
        </div>
      </div>

      {/* Return Trip Button - Compact like other buttons */}
      {setHasReturnTrip && !isDiscountDisabledRegion && (
        <button
          type="button"
          onClick={() => setHasReturnTrip(!hasReturnTrip)}
          className={cn(
            "flex h-[75px] w-full items-center justify-center rounded-xl border text-sm font-bold uppercase tracking-wide transition-all",
            hasReturnTrip 
              ? "border-green-500 bg-green-100 text-green-700 ring-2 ring-green-500 dark:bg-green-950/50 dark:text-green-400" 
              : "border-amber-200 bg-amber-50 text-foreground hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-900/30"
          )}
        >
          {hasReturnTrip ? (
            <span className="flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4" />
              {t("returnAdded") || "RETURN ADDED"} • {discountPercent}% OFF
            </span>
          ) : (
            <span>{t("addReturn")?.toUpperCase() || "ADD RETURN"}</span>
          )}
        </button>
      )}

      {/* Return Date/Time - Show when return trip is enabled */}
      {hasReturnTrip && setReturnDate && setReturnTime && (
        <div className="grid animate-in slide-in-from-top-2 grid-cols-2 gap-3 duration-200">
          <div 
            className="flex h-[75px] cursor-pointer flex-col justify-center overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-3 transition-all hover:bg-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest('button')) {
                const trigger = (e.currentTarget as HTMLElement).querySelector('button') as HTMLButtonElement;
                trigger?.click();
              }
            }}
          >
            <label className="pointer-events-none mb-0.5 block text-xs font-medium text-foreground/70">
              {t("returnDate") || "Return date"}
            </label>
            <div className="flex min-w-0 items-center gap-2">
              <CalendarIcon className="pointer-events-none h-4 w-4 flex-shrink-0 text-foreground" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <FloatingLabelDatePicker 
                  label="" 
                  date={returnDate} 
                  onSelect={setReturnDate} 
                  disabledDates={(d) => d < (date || new Date())} 
                  dateFormat="EEE, dd MMM"
                  triggerClassName="h-auto w-full justify-start truncate border-0 bg-transparent p-0 text-sm font-semibold text-foreground shadow-none hover:bg-transparent focus:ring-0"
                  icon={<span />}
                />
              </div>
            </div>
          </div>
          <div 
            className="flex h-[75px] cursor-pointer flex-col justify-center overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-3 transition-all hover:bg-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest('button')) {
                const trigger = (e.currentTarget as HTMLElement).querySelector('button') as HTMLButtonElement;
                trigger?.click();
              }
            }}
          >
            <label className="pointer-events-none mb-0.5 block text-xs font-medium text-foreground/70">
              {t("returnTime") || "Return time"}
            </label>
            <div className="flex min-w-0 items-center gap-2">
              <Clock className="pointer-events-none h-4 w-4 flex-shrink-0 text-foreground" />
              <TimePickerAMPM 
                value={returnTime || ""} 
                onValueChange={setReturnTime} 
                triggerClassName="text-sm font-semibold text-foreground"
                labels={{
                  hour: t("timeHour") || "Hour",
                  minute: t("timeMinute") || "Minute",
                  save: t("timeSave") || "Save"
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Passengers - Compact like other fields */}
      <div className="flex h-[75px] items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 transition-all hover:bg-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-foreground" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground/70">
              {t("passengers") || "Passengers"}
            </span>
            <span className="text-lg font-bold">{passengers}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePassengerDecrement}
            disabled={parseInt(passengers) <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-lg font-bold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={handlePassengerIncrement}
            disabled={parseInt(passengers) >= 18}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-lg font-bold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Spacer to push button to bottom on mobile */}
      <div className="min-h-2 flex-1 sm:hidden" />

      {/* Baby Seat & Luggage removed from Hero - now only in Book page */}

      {/* Submit Button - Same height as other elements, sticky at bottom on mobile */}
      <div className="mt-auto">
        <Button 
          onClick={validateAndContinue} 
          disabled={submitting} 
          className="group h-[75px] w-full touch-manipulation rounded-xl border-0 bg-gradient-to-r from-primary via-primary to-primary/90 text-sm font-bold shadow-lg shadow-primary/30 transition-all duration-300 hover:from-primary/90 hover:to-primary hover:shadow-xl hover:shadow-primary/40 active:from-primary/80 active:to-primary/80"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4 animate-pulse" />
              <span className="tracking-wide">{t("getQuote")}</span>
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

RideFormContent.displayName = "RideFormContent";
