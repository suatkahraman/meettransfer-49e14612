import { memo, useState, useCallback, useMemo } from "react";
import { CalendarIcon, Clock, Users, ArrowRight, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-datepicker";
import { LocationInputs, VehicleSelector } from "@/components/hero";
import { VehiclePrice } from "./types";
import { PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  allVehiclePrices,
  loadingTransferPrice,
  transferPriceCurrency,
  submitting,
  language,
  t,
  onPickupSelected,
  onDropoffSelected,
  onSwapLocations,
  setDate,
  setTime,
  setPassengers,
  setVehicleType,
  handleRideContinue,
}: RideFormContentProps) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [shakeFields, setShakeFields] = useState<ValidationErrors>({});
  
  const hasRoute = !!(pickup && dropoff);
  
  // Vehicle selection is always visible; price will appear on each card once available.

  // Memoize time options for Select
  const memoizedTimeOptions = useMemo(() => 
    timeOptions.map(opt => ({ value: opt, label: opt })),
    []
  );
  
  // Memoize passenger options
  const passengerOptions = useMemo(() => 
    Array.from({ length: 18 }, (_, i) => ({ value: (i + 1).toString(), label: `${i + 1}` })),
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

  return (
    <div key="ride-form" className="space-y-2 md:space-y-3">
      {/* Location Inputs - Always visible */}
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
      
      {/* Date/Time/Passengers - Always visible, larger touch targets on mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-2">
        <div className={cn(shakeFields.date && "animate-shake")}>
          <FloatingLabelDatePicker 
            label={t("date") || "Date"} 
            date={date} 
            onSelect={handleDateChange} 
            icon={<CalendarIcon className="h-4 w-4 md:h-4 md:w-4" />} 
            disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
            className="col-span-1" 
            triggerClassName={cn(
              "h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm",
              errors.date && "border-destructive ring-2 ring-destructive/20"
            )}
          />
        </div>
        <div className={cn(shakeFields.time && "animate-shake")}>
        <FloatingLabelSelect 
          label={t("time") || "Time"} 
          value={time} 
          onValueChange={handleTimeChange} 
          options={memoizedTimeOptions} 
          icon={<Clock className="h-4 w-4 md:h-4 md:w-4" />} 
          className="col-span-1" 
          triggerClassName={cn(
            "h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm",
            errors.time && "border-destructive ring-2 ring-destructive/20"
          )}
        />
        </div>
        <FloatingLabelSelect 
          label={t("passengers") || "Pax"} 
          value={passengers} 
          onValueChange={setPassengers} 
          options={passengerOptions} 
          icon={<Users className="h-4 w-4 md:h-4 md:w-4" />} 
          className="col-span-1" 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
      </div>

      {/* Vehicle Selection - Always visible */}
      <div className="space-y-2">
        <VehicleSelector 
          selectedVehicle={vehicleType} 
          onSelectVehicle={setVehicleType}
          passengers={passengers} 
          prices={allVehiclePrices} 
          loadingPrices={loadingTransferPrice} 
          hasRoute={hasRoute} 
          language={language} 
          currency={transferPriceCurrency} 
        />
      </div>

      {/* Submit Button - larger touch target on mobile */}
      <div>
        <Button 
          onClick={validateAndContinue} 
          disabled={submitting} 
          className="w-full h-14 md:h-12 min-h-[56px] md:min-h-[48px] font-semibold bg-primary hover:bg-primary/90 active:bg-primary/80 shadow-lg rounded-xl text-base md:text-base group touch-manipulation"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 md:h-5 md:w-5 animate-spin" />
          ) : (
            <>
              <Zap className="mr-1.5 h-4 w-4 md:h-4 md:w-4" />
              {language === 'TR' ? 'Fiyat Al' : 'Get Quote'}
              <ArrowRight className="ml-2 h-5 w-5 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

RideFormContent.displayName = "RideFormContent";
