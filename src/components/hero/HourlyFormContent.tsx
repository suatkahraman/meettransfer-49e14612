import { memo, useState, useCallback, useMemo } from "react";
import { CalendarIcon, Clock, Users, MapPin, Timer, ArrowRight, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-datepicker";
import { VehicleSelector } from "@/components/hero";
import { VehiclePrice } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Memoize time options - only compute once
const timeOptions = (() => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return times;
})();

const hourlyDurationOptions = [
  { value: "4", labelKey: "halfDay", defaultLabel: "4 Hours (Half Day)" },
  { value: "6", labelKey: "sixHours", defaultLabel: "6 Hours" },
  { value: "8", labelKey: "fullDay", defaultLabel: "8 Hours (Full Day)" },
  { value: "custom", labelKey: "customHourly", defaultLabel: "9+ Hours (Custom)" },
];

interface HourlyFormContentProps {
  hourlyCity: string;
  hourlyDuration: string;
  customHours: string;
  hourlyDate: Date | undefined;
  hourlyTime: string;
  hourlyPassengers: string;
  hourlyVehicleType: string;
  allHourlyPrices: VehiclePrice[];
  loadingPrice: boolean;
  submitting: boolean;
  availableCities: string[];
  availableDurations: string[];
  language: string;
  t: (key: string) => string;
  setHourlyCity: (city: string) => void;
  setHourlyDuration: (duration: string) => void;
  setCustomHours: (hours: string) => void;
  setHourlyDate: (date: Date | undefined) => void;
  setHourlyTime: (time: string) => void;
  setHourlyPassengers: (passengers: string) => void;
  setHourlyVehicleType: (type: string) => void;
  handleHourlyContinue: () => void;
}

interface ValidationErrors {
  city?: boolean;
  date?: boolean;
  time?: boolean;
}

export const HourlyFormContent = memo(({
  hourlyCity,
  hourlyDuration,
  customHours,
  hourlyDate,
  hourlyTime,
  hourlyPassengers,
  hourlyVehicleType,
  allHourlyPrices,
  loadingPrice,
  submitting,
  availableCities,
  availableDurations,
  language,
  t,
  setHourlyCity,
  setHourlyDuration,
  setCustomHours,
  setHourlyDate,
  setHourlyTime,
  setHourlyPassengers,
  setHourlyVehicleType,
  handleHourlyContinue,
}: HourlyFormContentProps) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [shakeFields, setShakeFields] = useState<ValidationErrors>({});
  
  const hasRoute = !!(hourlyCity && hourlyDuration);
  
  const currency = allHourlyPrices[0]?.currency || "EUR";

  // Memoize options
  const memoizedTimeOptions = useMemo(() => 
    timeOptions.map(opt => ({ value: opt, label: opt })),
    []
  );
  
  const passengerOptions = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: `${i + 1}` })),
    []
  );
  
  const cityOptions = useMemo(() => 
    availableCities.map(city => ({ value: city, label: city })),
    [availableCities]
  );
  
  const durationOptions = useMemo(() => 
    availableDurations.map(d => { 
      const opt = hourlyDurationOptions.find(o => o.value === d); 
      return { value: d, label: opt ? (t(opt.labelKey) || opt.defaultLabel) : `${d}h` }; 
    }),
    [availableDurations, t]
  );
  
  const customHoursOptions = useMemo(() => 
    Array.from({ length: 16 }, (_, i) => ({ value: (i + 9).toString(), label: `${i + 9} ${t("hours") || "hours"}` })),
    [t]
  );

  const validateAndContinue = useCallback(() => {
    const newErrors: ValidationErrors = {};
    const missing: string[] = [];
    
    if (!hourlyCity) {
      newErrors.city = true;
      missing.push(t("city") || "City");
    }
    if (!hourlyDate) {
      newErrors.date = true;
      missing.push(t("pickupDate") || "Date");
    }
    if (!hourlyTime) {
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
    handleHourlyContinue();
  }, [hourlyCity, hourlyDate, hourlyTime, t, handleHourlyContinue]);

  // Clear error when field is filled
  const handleCityChange = useCallback((value: string) => {
    if (errors.city && value) {
      setErrors(prev => ({ ...prev, city: false }));
    }
    setHourlyCity(value);
  }, [errors.city, setHourlyCity]);

  const handleDateChange = useCallback((newDate: Date | undefined) => {
    if (errors.date && newDate) {
      setErrors(prev => ({ ...prev, date: false }));
    }
    setHourlyDate(newDate);
  }, [errors.date, setHourlyDate]);

  const handleTimeChange = useCallback((newTime: string) => {
    if (errors.time && newTime) {
      setErrors(prev => ({ ...prev, time: false }));
    }
    setHourlyTime(newTime);
  }, [errors.time, setHourlyTime]);

  return (
    <div key="hourly-form" className="space-y-2 md:space-y-3">
      {/* City & Duration - larger touch targets on mobile */}
      <div className="grid grid-cols-2 gap-2 md:gap-2">
        <div className={cn(shakeFields.city && "animate-shake")}>
          <FloatingLabelSelect 
            label={t("city") || "City"} 
            value={hourlyCity} 
            onValueChange={handleCityChange} 
            options={cityOptions} 
            icon={<MapPin className="h-4 w-4 md:h-4 md:w-4" />} 
            className="col-span-1" 
            triggerClassName={cn(
              "h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm",
              errors.city && "border-destructive ring-2 ring-destructive/20"
            )}
          />
        </div>
        <FloatingLabelSelect 
          label={t("duration") || "Duration"} 
          value={hourlyDuration} 
          onValueChange={setHourlyDuration} 
          options={durationOptions} 
          icon={<Timer className="h-4 w-4 md:h-4 md:w-4" />} 
          disabled={!hourlyCity} 
          className="col-span-1" 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
      </div>

      {/* Custom Hours - larger touch target on mobile */}
      {hourlyDuration === "custom" && (
        <FloatingLabelSelect 
          label={t("customHours") || "Custom Hours"} 
          value={customHours} 
          onValueChange={setCustomHours} 
          options={customHoursOptions} 
          icon={<Timer className="h-4 w-4 md:h-4 md:w-4" />} 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
      )}

      {/* Date/Time/Passengers - larger touch targets on mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-2">
        <div className={cn(shakeFields.date && "animate-shake")}>
          <FloatingLabelDatePicker 
            label={t("date") || "Date"} 
            date={hourlyDate} 
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
          value={hourlyTime} 
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
          value={hourlyPassengers} 
          onValueChange={setHourlyPassengers} 
          options={passengerOptions} 
          icon={<Users className="h-4 w-4 md:h-4 md:w-4" />} 
          className="col-span-1" 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
      </div>

      {/* Vehicle Selection - Always visible */}
      <div className="space-y-2">
        <VehicleSelector 
          selectedVehicle={hourlyVehicleType} 
          onSelectVehicle={setHourlyVehicleType}
          passengers={hourlyPassengers} 
          prices={allHourlyPrices} 
          loadingPrices={loadingPrice} 
          hasRoute={hasRoute} 
          language={language} 
          currency={currency} 
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

HourlyFormContent.displayName = "HourlyFormContent";
