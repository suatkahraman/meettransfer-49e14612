import { memo, useState } from "react";
import { CalendarIcon, Clock, Users, ArrowRight, Loader2, Zap, ChevronDown, ChevronUp, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-datepicker";
import { LocationInputs, VehicleSelector } from "@/components/hero";
import { VehiclePrice } from "./types";
import { PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const [showVehicles, setShowVehicles] = useState(false);
  const hasRoute = !!(pickup && dropoff);
  const selectedPrice = allVehiclePrices.find(p => p.vehicleType === vehicleType);

  return (
    <div key="ride-form" className="space-y-2 md:space-y-3">
      {/* Location Inputs - Always visible */}
      <LocationInputs 
        pickup={pickup} 
        dropoff={dropoff} 
        onPickupSelected={onPickupSelected} 
        onDropoffSelected={onDropoffSelected} 
        onSwapLocations={onSwapLocations} 
        language={language} 
      />
      
      {/* Date/Time/Passengers - Always visible, larger touch targets on mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-2">
        <FloatingLabelDatePicker 
          label={t("date") || "Date"} 
          date={date} 
          onSelect={setDate} 
          icon={<CalendarIcon className="h-4 w-4 md:h-4 md:w-4" />} 
          disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
          className="col-span-1" 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
        <FloatingLabelSelect 
          label={t("time") || "Time"} 
          value={time} 
          onValueChange={setTime} 
          options={timeOptions.map(opt => ({ value: opt, label: opt }))} 
          icon={<Clock className="h-4 w-4 md:h-4 md:w-4" />} 
          className="col-span-1" 
          triggerClassName="h-14 md:h-12 min-h-[56px] md:min-h-[48px] text-base md:text-sm"
        />
        <FloatingLabelSelect 
          label={t("passengers") || "Pax"} 
          value={passengers} 
          onValueChange={setPassengers} 
          options={Array.from({ length: 18 }, (_, i) => ({ value: (i + 1).toString(), label: `${i + 1}` }))} 
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
                {transferPriceCurrency === "EUR" ? "€" : transferPriceCurrency}{selectedPrice.price}
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
                selectedVehicle={vehicleType} 
                onSelectVehicle={(type) => {
                  setVehicleType(type);
                  setShowVehicles(false);
                }} 
                passengers={passengers} 
                prices={allVehiclePrices} 
                loadingPrices={loadingTransferPrice} 
                hasRoute={hasRoute} 
                language={language} 
                currency={transferPriceCurrency} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop: Always visible */}
        <div className="hidden md:block">
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
      </div>

      {/* Submit Button - larger touch target on mobile */}
      <div>
        <Button 
          onClick={handleRideContinue} 
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