import { memo, useState, useCallback, useMemo } from "react";
import { CalendarIcon, Clock, Users, MapPin, Timer, ArrowRight, Loader2, Zap, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LazyFloatingLabelSelect } from "@/components/ui/lazy-select";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-datepicker";
import { TimePickerAMPM } from "@/components/ui/time-picker-ampm";
import { LazyGooglePlacesAutocomplete as GooglePlacesAutocomplete, PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";
import { VehiclePrice } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Generate hour options (4-24) - just numbers
const generateHourOptions = (t: (key: string) => string) => {
  const hourSuffix = t("hourlyHours") || "h";
  return Array.from({ length: 21 }, (_, i) => ({
    value: (i + 4).toString(),
    label: `${i + 4}${hourSuffix}`,
  }));
};

// Day options (1-5)
const generateDayOptions = (t: (key: string) => string) => [
  { value: "1d", label: t("day1") || "1 Day" },
  { value: "2d", label: t("day2") || "2 Days" },
  { value: "3d", label: t("day3") || "3 Days" },
  { value: "4d", label: t("day4") || "4 Days" },
  { value: "5d", label: t("day5") || "5 Days" },
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

  // Duration options: 4-24 hours + 1-5 days
  const durationOptions = useMemo(() => [
    ...generateHourOptions(t),
    ...generateDayOptions(t),
  ], [t]);

  const validateAndContinue = useCallback(() => {
    const newErrors: ValidationErrors = {};
    const missing: string[] = [];
    
    if (!hourlyCity) {
      newErrors.city = true;
      missing.push(t("hourlyPickupLocation") || t("pickupPoint") || "Pickup Location");
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
  const handleCityChange = useCallback((value: string, details?: PlaceDetails) => {
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

  const handlePassengerIncrement = useCallback(() => {
    const current = parseInt(hourlyPassengers) || 1;
    if (current < 18) {
      setHourlyPassengers((current + 1).toString());
    }
  }, [hourlyPassengers, setHourlyPassengers]);

  const handlePassengerDecrement = useCallback(() => {
    const current = parseInt(hourlyPassengers) || 1;
    if (current > 1) {
      setHourlyPassengers((current - 1).toString());
    }
  }, [hourlyPassengers, setHourlyPassengers]);

  // Get pickup label based on language
  const getPickupLabel = () => {
    return t("hourlyPickupLocation") || (language === 'TR' ? 'Alış Noktası' : 'Pickup Location');
  };

  const getPickupPlaceholder = () => {
    return t("hourlyPickupPlaceholder") || (language === 'TR' ? 'Adres, havalimanı, otel...' : 'Address, airport, hotel...');
  };

  return (
    <div key="hourly-form" className="space-y-3 md:space-y-3 flex-1 flex flex-col">
      {/* Pickup Location - Google Places Autocomplete */}
      <div className={cn(
        "bg-amber-50 dark:bg-zinc-800 rounded-xl p-3 h-[75px] flex flex-col justify-center transition-all border border-amber-200 dark:border-zinc-700",
        shakeFields.city && "animate-shake",
        errors.city 
          ? "ring-2 ring-destructive/30" 
          : "hover:bg-amber-200 dark:hover:bg-zinc-700"
      )}>
        <label className="block text-xs font-medium text-foreground/70 mb-0.5">
          {getPickupLabel()}
        </label>
        <div className="flex items-center gap-2">
          <MapPin className={cn("h-4 w-4 flex-shrink-0", errors.city ? "text-destructive" : "text-foreground")} />
          <GooglePlacesAutocomplete 
            onPlaceSelected={handleCityChange} 
            placeholder={getPickupPlaceholder()} 
            className="bg-transparent border-0 p-0 h-auto text-lg font-bold text-foreground placeholder:text-foreground/50 focus:ring-0 focus-visible:ring-0"
            value={hourlyCity}
            myLocationLabel={t('useMyLocation')}
          />
        </div>
      </div>

      {/* Duration and Date Row */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          className="bg-amber-50 dark:bg-zinc-800 rounded-xl p-3 h-[75px] flex flex-col justify-center transition-all hover:bg-amber-200 dark:hover:bg-zinc-700 overflow-hidden cursor-pointer border border-amber-200 dark:border-zinc-700"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('button')) {
              const trigger = (e.currentTarget as HTMLElement).querySelector('button') as HTMLButtonElement;
              trigger?.click();
            }
          }}
        >
          <label className="block text-xs font-medium text-foreground/70 mb-0.5 pointer-events-none">
            {t("duration") || "Duration"}
          </label>
          <div className="flex items-center gap-2 min-w-0">
            <Timer className="h-4 w-4 text-foreground flex-shrink-0 pointer-events-none" />
            <LazyFloatingLabelSelect 
              label="" 
              value={hourlyDuration} 
              onValueChange={setHourlyDuration} 
              options={durationOptions} 
              triggerClassName="bg-transparent border-0 p-0 h-auto text-sm font-bold text-foreground hover:bg-transparent focus:ring-0 shadow-none justify-start"
              icon={<span />}
            />
          </div>
        </div>
        
        <div 
          className={cn(
            "bg-amber-50 dark:bg-zinc-800 rounded-xl p-3 h-[75px] flex flex-col justify-center transition-all hover:bg-amber-100 dark:hover:bg-zinc-700 overflow-hidden cursor-pointer border border-amber-200 dark:border-zinc-700",
            shakeFields.date && "animate-shake",
            errors.date 
              ? "ring-2 ring-destructive/30" 
              : "hover:bg-amber-200"
          )}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('button')) {
              const trigger = (e.currentTarget as HTMLElement).querySelector('button') as HTMLButtonElement;
              trigger?.click();
            }
          }}
        >
          <label className="block text-xs font-medium text-foreground/70 mb-0.5 pointer-events-none">
            {t("pickupDate") || "Pickup date"}
          </label>
          <div className="flex items-center gap-2 min-w-0">
            <CalendarIcon className="h-4 w-4 text-foreground flex-shrink-0 pointer-events-none" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <FloatingLabelDatePicker 
                label="" 
                date={hourlyDate} 
                onSelect={handleDateChange} 
                disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                dateFormat="EEE, dd MMM"
                triggerClassName="bg-transparent border-0 p-0 h-auto text-sm font-semibold text-foreground hover:bg-transparent focus:ring-0 shadow-none justify-start w-full truncate"
                icon={<span />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Time Row */}
      <div 
        className={cn(
          "bg-amber-50 dark:bg-zinc-800 rounded-xl p-3 h-[75px] flex flex-col justify-center transition-all hover:bg-amber-100 dark:hover:bg-zinc-700 cursor-pointer border border-amber-200 dark:border-zinc-700",
          shakeFields.time && "animate-shake",
          errors.time 
            ? "ring-2 ring-destructive/30" 
            : "hover:bg-amber-200"
        )}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('button')) {
            const trigger = (e.currentTarget as HTMLElement).querySelector('button') as HTMLButtonElement;
            trigger?.click();
          }
        }}
      >
        <label className="block text-xs font-medium text-foreground/70 mb-0.5 pointer-events-none">
          {t("pickupTime") || "Pickup time"}
        </label>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-foreground flex-shrink-0 pointer-events-none" />
          <TimePickerAMPM 
            value={hourlyTime} 
            onValueChange={handleTimeChange} 
            triggerClassName="text-sm font-semibold text-foreground"
          />
        </div>
      </div>

      {/* Passengers Row */}
      <div className="bg-amber-50 dark:bg-zinc-800 rounded-xl p-3 h-[75px] flex items-center justify-between border border-amber-200 dark:border-zinc-700 transition-all hover:bg-amber-200 dark:hover:bg-zinc-700">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-foreground" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground/70">
              {t("passengers") || "Passengers"}
            </span>
            <span className="text-lg font-bold">{hourlyPassengers}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePassengerDecrement}
            disabled={parseInt(hourlyPassengers) <= 1}
            className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={handlePassengerIncrement}
            disabled={parseInt(hourlyPassengers) >= 18}
            className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Spacer to push button to bottom on mobile */}
      <div className="flex-1 min-h-2 sm:hidden" />

      {/* Submit Button - Same height as other elements */}
      <div className="mt-auto">
        <Button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            validateAndContinue();
          }} 
          disabled={submitting} 
          className="w-full h-[75px] font-bold bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:to-primary active:from-primary/80 active:to-primary/80 shadow-lg shadow-primary/30 rounded-xl text-sm group touch-manipulation border-0 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4 animate-pulse" />
              <span className="tracking-wide">{t("getQuote") || (language === 'TR' ? 'Fiyat Al' : 'Get Quote')}</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

HourlyFormContent.displayName = "HourlyFormContent";
