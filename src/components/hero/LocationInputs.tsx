import { memo, lazy, Suspense } from "react";
import { MapPin, Navigation } from "lucide-react";
import { LazyGooglePlacesAutocomplete as GooglePlacesAutocomplete } from "@/components/ui/lazy-google-places-autocomplete";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceSelectedHandler } from "./types";
import { cn } from "@/lib/utils";

const CompactRouteMap = lazy(() => import("@/components/ui/compact-route-map").then(m => ({ default: m.CompactRouteMap })));

interface LocationInputsProps {
  pickup: string;
  dropoff: string;
  onPickupSelected: PlaceSelectedHandler;
  onDropoffSelected: PlaceSelectedHandler;
  onSwapLocations: () => void;
  language: string;
  pickupError?: boolean;
  dropoffError?: boolean;
}

const LocationInputsComponent = ({
  pickup,
  dropoff,
  onPickupSelected,
  onDropoffSelected,
  language,
  pickupError,
  dropoffError
}: LocationInputsProps) => {

  return (
    <div className="space-y-3">
      {/* Pickup - Floating label structure like reference */}
      <div className={cn(
        "bg-zinc-200 dark:bg-zinc-800 rounded-xl p-3 h-[75px] flex flex-col justify-center transition-all",
        pickupError 
          ? "ring-2 ring-destructive/30" 
          : "hover:bg-zinc-300 dark:hover:bg-zinc-700"
      )}>
        <label className="block text-xs font-medium text-foreground/70 mb-0.5">
          {language === 'TR' ? 'Nereden' :
           language === 'DE' ? 'Von' :
           language === 'FR' ? 'De' :
           language === 'RU' ? 'Откуда' :
           language === 'IT' ? 'Da' :
           language === 'ES' ? 'Desde' :
           language === 'AR' ? 'من' :
           language === 'UK' ? 'Звідки' :
           language === 'JA' ? '乗車地' :
           'From'}
        </label>
        <div className="flex items-center gap-2">
          <MapPin className={cn("h-4 w-4 flex-shrink-0", pickupError ? "text-destructive" : "text-foreground")} />
          <GooglePlacesAutocomplete 
            onPlaceSelected={onPickupSelected} 
            placeholder={
              language === 'TR' ? 'Adres, havalimanı, otel...' :
              language === 'DE' ? 'Adresse, Flughafen, Hotel...' :
              language === 'FR' ? 'Adresse, aéroport, hôtel...' :
              language === 'RU' ? 'Адрес, аэропорт, отель...' :
              language === 'IT' ? 'Indirizzo, aeroporto, hotel...' :
              language === 'ES' ? 'Dirección, aeropuerto, hotel...' :
              language === 'AR' ? 'عنوان، مطار، فندق...' :
              language === 'UK' ? 'Адреса, аеропорт, готель...' :
              language === 'JA' ? '住所、空港、ホテル...' :
              'Address, airport, hotel...'
            } 
            className="bg-transparent border-0 p-0 h-auto text-lg font-bold text-foreground placeholder:text-foreground/50 focus:ring-0 focus-visible:ring-0"
            value={pickup}
          />
        </div>
      </div>
      
      {/* Dropoff - Floating label structure like reference */}
      <div className={cn(
        "bg-zinc-200 dark:bg-zinc-800 rounded-xl p-3 h-[75px] flex flex-col justify-center transition-all",
        dropoffError
          ? "ring-2 ring-destructive/30"
          : "hover:bg-zinc-300 dark:hover:bg-zinc-700"
      )}>
        <label className="block text-xs font-medium text-foreground/70 mb-0.5">
          {language === 'TR' ? 'Nereye' :
           language === 'DE' ? 'Nach' :
           language === 'FR' ? 'À' :
           language === 'RU' ? 'Куда' :
           language === 'IT' ? 'A' :
           language === 'ES' ? 'Hasta' :
           language === 'AR' ? 'إلى' :
           language === 'UK' ? 'Куди' :
           language === 'JA' ? '降車地' :
           'To'}
        </label>
        <div className="flex items-center gap-2">
          <Navigation className={cn("h-4 w-4 flex-shrink-0", dropoffError ? "text-destructive" : "text-foreground")} />
          <GooglePlacesAutocomplete 
            onPlaceSelected={onDropoffSelected} 
            placeholder={
              language === 'TR' ? 'Adres, havalimanı, otel...' :
              language === 'DE' ? 'Adresse, Flughafen, Hotel...' :
              language === 'FR' ? 'Adresse, aéroport, hôtel...' :
              language === 'RU' ? 'Адрес, аэропорт, отель...' :
              language === 'IT' ? 'Indirizzo, aeroporto, hotel...' :
              language === 'ES' ? 'Dirección, aeropuerto, hotel...' :
              language === 'AR' ? 'عنوان، مطار، فندق...' :
              language === 'UK' ? 'Адреса, аеропорт, готель...' :
              language === 'JA' ? '住所、空港、ホテル...' :
              'Address, airport, hotel...'
            } 
            className="bg-transparent border-0 p-0 h-auto text-lg font-bold text-foreground placeholder:text-foreground/50 focus:ring-0 focus-visible:ring-0"
            value={dropoff}
          />
        </div>
      </div>
      
      {pickup && dropoff && (
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg mt-2" />}>
          <CompactRouteMap pickup={pickup} dropoff={dropoff} className="mt-2" />
        </Suspense>
      )}
    </div>
  );
};

// Custom comparison function - only re-render when these specific values change
const arePropsEqual = (prevProps: LocationInputsProps, nextProps: LocationInputsProps): boolean => {
  return (
    prevProps.pickup === nextProps.pickup &&
    prevProps.dropoff === nextProps.dropoff &&
    prevProps.language === nextProps.language &&
    prevProps.pickupError === nextProps.pickupError &&
    prevProps.dropoffError === nextProps.dropoffError &&
    prevProps.onPickupSelected === nextProps.onPickupSelected &&
    prevProps.onDropoffSelected === nextProps.onDropoffSelected
  );
};

export const LocationInputs = memo(LocationInputsComponent, arePropsEqual);

LocationInputs.displayName = "LocationInputs";
