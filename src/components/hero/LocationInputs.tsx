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
      {/* Pickup - 2x bigger */}
      <GooglePlacesAutocomplete 
        onPlaceSelected={onPickupSelected} 
        placeholder={
          language === 'TR' ? 'Nereden alınacak?' :
          language === 'DE' ? 'Wo sollen wir Sie abholen?' :
          language === 'FR' ? 'Où vous récupérer ?' :
          language === 'RU' ? 'Откуда вас забрать?' :
          language === 'IT' ? 'Dove prelevarvi?' :
          language === 'ES' ? '¿Dónde le recogemos?' :
          language === 'AR' ? 'من أين نأخذك؟' :
          language === 'UK' ? 'Звідки вас забрати?' :
          language === 'JA' ? 'お迎え場所は？' :
          'Where to pick you up?'
        } 
        className={cn(
          "bg-background border-2 rounded-xl text-lg md:text-base shadow-sm transition-all h-16 md:h-14 min-h-[64px] md:min-h-[56px]",
          pickupError 
            ? "border-destructive ring-2 ring-destructive/20" 
            : "border-primary/30 hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        )}
        value={pickup}
        floatingLabel
        icon={
          <div className="transition-transform duration-200 hover:scale-110">
            <MapPin className={cn("h-6 w-6 md:h-5 md:w-5", pickupError ? "text-destructive" : "text-primary")} />
          </div>
        }
      />
      
      {/* Dropoff - 2x bigger, no swap button between */}
      <GooglePlacesAutocomplete 
        onPlaceSelected={onDropoffSelected} 
        placeholder={
          language === 'TR' ? 'Nereye gideceksiniz?' :
          language === 'DE' ? 'Wohin möchten Sie?' :
          language === 'FR' ? 'Où allez-vous ?' :
          language === 'RU' ? 'Куда вас отвезти?' :
          language === 'IT' ? 'Dove andate?' :
          language === 'ES' ? '¿A dónde va?' :
          language === 'AR' ? 'إلى أين تريد الذهاب؟' :
          language === 'UK' ? 'Куди вас відвезти?' :
          language === 'JA' ? '行き先は？' :
          'Where to drop you off?'
        } 
        className={cn(
          "bg-background border-2 rounded-xl text-lg md:text-base shadow-sm transition-all h-16 md:h-14 min-h-[64px] md:min-h-[56px]",
          dropoffError
            ? "border-destructive ring-2 ring-destructive/20"
            : "border-accent/30 hover:border-accent/50 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
        )}
        value={dropoff}
        floatingLabel
        icon={
          <div className="transition-transform duration-200 hover:scale-110">
            <Navigation className={cn("h-6 w-6 md:h-5 md:w-5", dropoffError ? "text-destructive" : "text-accent")} />
          </div>
        }
      />
      
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
