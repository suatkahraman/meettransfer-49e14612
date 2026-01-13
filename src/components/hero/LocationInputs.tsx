import { memo, lazy, Suspense } from "react";
import { MapPin, Navigation, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
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
        className="bg-background border-2 border-primary/30 rounded-xl text-base md:text-sm shadow-sm hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all h-14 md:h-12 min-h-[56px] md:min-h-[48px]"
        value={pickup}
        floatingLabel
        icon={
          <motion.div
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            animate={{ y: [0, -2, 0] }}
            transition={{ 
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.2 },
              rotate: { duration: 0.2 }
            }}
          >
            <MapPin className="h-5 w-5 md:h-4 md:w-4 text-primary" />
          </motion.div>
        }
      />
      
      <div className="flex justify-center -my-0.5">
        <button
          type="button"
          onClick={onSwapLocations}
          disabled={!pickup && !dropoff}
          className="w-9 h-9 md:w-7 md:h-7 rounded-full bg-primary text-primary-foreground shadow hover:shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center touch-manipulation"
        >
          <ArrowUpDown className="h-4 w-4 md:h-3 md:w-3" />
        </button>
      </div>
      
      <GooglePlacesAutocomplete 
        onPlaceSelected={onDropoffSelected} 
        placeholder={language === 'TR' ? 'Nereye gideceksiniz?' : 'Where to drop you off?'} 
        className="bg-background border-2 border-accent/30 rounded-xl text-base md:text-sm shadow-sm hover:border-accent/50 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all h-14 md:h-12 min-h-[56px] md:min-h-[48px]"
        value={dropoff}
        floatingLabel
        icon={
          <motion.div
            whileHover={{ scale: 1.2, rotate: -10 }}
            whileTap={{ scale: 0.9 }}
            animate={{ y: [0, -2, 0] }}
            transition={{ 
              y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
              scale: { duration: 0.2 },
              rotate: { duration: 0.2 }
            }}
          >
            <Navigation className="h-5 w-5 md:h-4 md:w-4 text-accent" />
          </motion.div>
        }
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
