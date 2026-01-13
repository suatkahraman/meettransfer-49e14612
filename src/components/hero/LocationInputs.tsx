import { memo, lazy, Suspense, useCallback } from "react";
import { MapPin, Navigation, ArrowUpDown } from "lucide-react";
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
  onSwapLocations,
  language,
  pickupError,
  dropoffError
}: LocationInputsProps) => {
  // Memoize swap handler to prevent re-renders
  const handleSwap = useCallback(() => {
    // Use requestAnimationFrame to batch DOM updates
    requestAnimationFrame(() => {
      onSwapLocations();
    });
  }, [onSwapLocations]);

  return (
    <div className="space-y-2">
      <GooglePlacesAutocomplete 
        onPlaceSelected={onPickupSelected} 
        placeholder={language === 'TR' ? 'Nereden alınacak?' : 'Where to pick you up?'} 
        className={cn(
          "bg-background border-2 rounded-xl text-base md:text-sm shadow-sm transition-all h-14 md:h-12 min-h-[56px] md:min-h-[48px]",
          pickupError 
            ? "border-destructive ring-2 ring-destructive/20" 
            : "border-primary/30 hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        )}
        value={pickup}
        floatingLabel
        icon={
          <div className="transition-transform duration-200 hover:scale-110">
            <MapPin className={cn("h-5 w-5 md:h-4 md:w-4", pickupError ? "text-destructive" : "text-primary")} />
          </div>
        }
      />
      
      <div className="flex justify-center -my-0.5">
        <button
          type="button"
          onClick={handleSwap}
          disabled={!pickup && !dropoff}
          className="w-11 h-11 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center touch-manipulation min-h-[44px] md:min-h-[32px]"
        >
          <ArrowUpDown className="h-5 w-5 md:h-4 md:w-4" />
        </button>
      </div>
      
      <GooglePlacesAutocomplete 
        onPlaceSelected={onDropoffSelected} 
        placeholder={language === 'TR' ? 'Nereye gideceksiniz?' : 'Where to drop you off?'} 
        className={cn(
          "bg-background border-2 rounded-xl text-base md:text-sm shadow-sm transition-all h-14 md:h-12 min-h-[56px] md:min-h-[48px]",
          dropoffError
            ? "border-destructive ring-2 ring-destructive/20"
            : "border-accent/30 hover:border-accent/50 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
        )}
        value={dropoff}
        floatingLabel
        icon={
          <div className="transition-transform duration-200 hover:scale-110">
            <Navigation className={cn("h-5 w-5 md:h-4 md:w-4", dropoffError ? "text-destructive" : "text-accent")} />
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
    // Callback references - if parent uses useCallback, these will be stable
    prevProps.onPickupSelected === nextProps.onPickupSelected &&
    prevProps.onDropoffSelected === nextProps.onDropoffSelected &&
    prevProps.onSwapLocations === nextProps.onSwapLocations
  );
};

export const LocationInputs = memo(LocationInputsComponent, arePropsEqual);

LocationInputs.displayName = "LocationInputs";
