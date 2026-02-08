import { memo, lazy, Suspense } from "react";
import { MapPin, Navigation } from "lucide-react";
import { LazyGooglePlacesAutocomplete as GooglePlacesAutocomplete } from "@/components/ui/lazy-google-places-autocomplete";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceSelectedHandler } from "./types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      {/* Pickup - Floating label structure like reference */}
      <div 
        id="ride-pickup-field"
        className={cn(
          "bg-amber-50 dark:bg-zinc-800 rounded-xl px-3 py-2 h-[75px] flex items-center gap-3 transition-all border border-amber-200 dark:border-zinc-700",
          pickupError 
            ? "ring-2 ring-destructive/30" 
            : "hover:bg-amber-200 dark:hover:bg-zinc-700"
        )}>
        <MapPin className={cn("h-6 w-6 flex-shrink-0", pickupError ? "text-destructive" : "text-foreground")} />
        <div className="flex flex-1 flex-col justify-center min-w-0">
          <label className="block text-[10px] font-medium text-foreground/60 leading-tight">
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
            className="h-8 w-full border-0 bg-transparent p-0 text-xl font-bold text-foreground placeholder:text-foreground/40 focus:ring-0 focus-visible:ring-0"
            value={pickup}
            myLocationLabel={t('useMyLocation')}
          />
        </div>
        {pickupError && (
          <p className="text-xs text-destructive font-medium animate-fade-in flex-shrink-0">!</p>
        )}
      </div>
      
      {/* Dropoff */}
      <div 
        id="ride-dropoff-field"
        className={cn(
          "bg-amber-50 dark:bg-zinc-800 rounded-xl px-3 py-2 h-[75px] flex items-center gap-3 transition-all border border-amber-200 dark:border-zinc-700",
          dropoffError
            ? "ring-2 ring-destructive/30"
            : "hover:bg-amber-200 dark:hover:bg-zinc-700"
        )}>
        <Navigation className={cn("h-6 w-6 flex-shrink-0", dropoffError ? "text-destructive" : "text-foreground")} />
        <div className="flex flex-1 flex-col justify-center min-w-0">
          <label className="block text-[10px] font-medium text-foreground/60 leading-tight">
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
            className="h-8 w-full border-0 bg-transparent p-0 text-xl font-bold text-foreground placeholder:text-foreground/40 focus:ring-0 focus-visible:ring-0"
            value={dropoff}
            myLocationLabel={t('useMyLocation')}
          />
        </div>
        {dropoffError && (
          <p className="text-xs text-destructive font-medium animate-fade-in flex-shrink-0">!</p>
        )}
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
