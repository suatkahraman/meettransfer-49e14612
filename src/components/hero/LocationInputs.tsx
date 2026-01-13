import { memo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, ArrowUpDown } from "lucide-react";
import { LazyGooglePlacesAutocomplete as GooglePlacesAutocomplete } from "@/components/ui/lazy-google-places-autocomplete";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceSelectedHandler } from "./types";

const CompactRouteMap = lazy(() => import("@/components/ui/compact-route-map").then(m => ({ default: m.CompactRouteMap })));

interface LocationInputsProps {
  pickup: string;
  dropoff: string;
  onPickupSelected: PlaceSelectedHandler;
  onDropoffSelected: PlaceSelectedHandler;
  onSwapLocations: () => void;
  language: string;
}

export const LocationInputs = memo(({
  pickup,
  dropoff,
  onPickupSelected,
  onDropoffSelected,
  onSwapLocations,
  language
}: LocationInputsProps) => {
  return (
    <div className="space-y-2">
      <GooglePlacesAutocomplete 
        onPlaceSelected={onPickupSelected} 
        placeholder={language === 'TR' ? 'Nereden alınacak?' : 'Where to pick you up?'} 
        className="bg-muted/50 border border-border rounded-xl text-sm"
        value={pickup}
        floatingLabel
        icon={<MapPin className="h-4 w-4 text-primary" />}
      />
      
      <motion.div 
        className="flex justify-center -my-0.5"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          type="button"
          onClick={onSwapLocations}
          disabled={!pickup && !dropoff}
          className="w-7 h-7 rounded-full bg-primary text-primary-foreground shadow hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
        >
          <ArrowUpDown className="h-3 w-3" />
        </button>
      </motion.div>
      
      <GooglePlacesAutocomplete 
        onPlaceSelected={onDropoffSelected} 
        placeholder={language === 'TR' ? 'Nereye gideceksiniz?' : 'Where to drop you off?'} 
        className="bg-muted/50 border border-border rounded-xl text-sm"
        value={dropoff}
        floatingLabel
        icon={<Navigation className="h-4 w-4 text-accent" />}
      />
      
      {pickup && dropoff && (
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg mt-2" />}>
          <CompactRouteMap pickup={pickup} dropoff={dropoff} className="mt-2" />
        </Suspense>
      )}
    </div>
  );
});

LocationInputs.displayName = "LocationInputs";
