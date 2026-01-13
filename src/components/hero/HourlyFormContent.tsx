import { memo, useState } from "react";
import { CalendarIcon, Clock, Users, MapPin, Timer, ArrowRight, Loader2, Zap, ChevronDown, ChevronUp, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-datepicker";
import { VehicleSelector } from "@/components/hero";
import { VehiclePrice } from "./types";
import { motion, AnimatePresence } from "framer-motion";

const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

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
  const [showVehicles, setShowVehicles] = useState(false);
  const hasRoute = !!(hourlyCity && hourlyDuration);
  const selectedPrice = allHourlyPrices.find(p => p.vehicleType === hourlyVehicleType);
  const currency = allHourlyPrices[0]?.currency || "EUR";

  return (
    <div key="hourly-form" className="space-y-2 md:space-y-3">
      {/* City & Duration - larger touch targets on mobile */}
      <div className="grid grid-cols-2 gap-2 md:gap-2">
        <FloatingLabelSelect 
          label={t("city") || "City"} 
          value={hourlyCity} 
          onValueChange={setHourlyCity} 
          options={availableCities.map(city => ({ value: city, label: city }))} 
          icon={<MapPin className="h-4 w-4 md:h-4 md:w-4" />} 
          className="col-span-1" 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
        <FloatingLabelSelect 
          label={t("duration") || "Duration"} 
          value={hourlyDuration} 
          onValueChange={setHourlyDuration} 
          options={availableDurations.map(d => { 
            const opt = hourlyDurationOptions.find(o => o.value === d); 
            return { value: d, label: opt ? (t(opt.labelKey) || opt.defaultLabel) : `${d}h` }; 
          })} 
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
          options={Array.from({ length: 16 }, (_, i) => ({ value: (i + 9).toString(), label: `${i + 9} ${t("hours") || "hours"}` }))} 
          icon={<Timer className="h-4 w-4 md:h-4 md:w-4" />} 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
      )}

      {/* Date/Time/Passengers - larger touch targets on mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-2">
        <FloatingLabelDatePicker 
          label={t("date") || "Date"} 
          date={hourlyDate} 
          onSelect={setHourlyDate} 
          icon={<CalendarIcon className="h-4 w-4 md:h-4 md:w-4" />} 
          disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
          className="col-span-1" 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
        <FloatingLabelSelect 
          label={t("time") || "Time"} 
          value={hourlyTime} 
          onValueChange={setHourlyTime} 
          options={timeOptions.map(opt => ({ value: opt, label: opt }))} 
          icon={<Clock className="h-4 w-4 md:h-4 md:w-4" />} 
          className="col-span-1" 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
        <FloatingLabelSelect 
          label={t("passengers") || "Pax"} 
          value={hourlyPassengers} 
          onValueChange={setHourlyPassengers} 
          options={Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: `${i + 1}` }))} 
          icon={<Users className="h-4 w-4 md:h-4 md:w-4" />} 
          className="col-span-1" 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
      </div>

      {/* Vehicle Selection - Collapsible on mobile */}
      <div className="md:block">
        {/* Mobile: Collapsible toggle - larger touch target */}
        <button
          type="button"
          onClick={() => setShowVehicles(!showVehicles)}
          className="md:hidden w-full flex items-center justify-between p-3 min-h-[52px] bg-muted/50 rounded-xl border border-border mb-2 active:bg-muted/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Car className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {language === 'TR' ? 'Araç Seçimi' : 'Select Vehicle'}
            </span>
            {selectedPrice && (
              <span className="text-sm font-bold text-primary">
                {currency === "EUR" ? "€" : currency}{selectedPrice.price}
              </span>
            )}
          </div>
          {showVehicles ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {/* Mobile: Expandable vehicle selector */}
        <AnimatePresence>
          {showVehicles && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden md:hidden"
            >
              <VehicleSelector 
                selectedVehicle={hourlyVehicleType} 
                onSelectVehicle={(type) => {
                  setHourlyVehicleType(type);
                  setShowVehicles(false);
                }} 
                passengers={hourlyPassengers} 
                prices={allHourlyPrices} 
                loadingPrices={loadingPrice} 
                hasRoute={hasRoute} 
                language={language} 
                currency={currency} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop: Always visible */}
        <div className="hidden md:block">
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
      </div>

      {/* Submit Button - larger touch target on mobile */}
      <div>
        <Button 
          onClick={handleHourlyContinue} 
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