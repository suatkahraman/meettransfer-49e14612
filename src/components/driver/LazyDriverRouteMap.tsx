import { lazy, Suspense, useEffect, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { preloadMapbox } from '@/utils/mapboxLoader';

// Lazy load the actual map component
const DriverRouteMap = lazy(() => import('./DriverRouteMap'));

interface LazyDriverRouteMapProps {
  pickup: string;
  dropoff: string;
  customerPhone?: string;
  className?: string;
}

const MapPlaceholder = ({ className }: { className?: string }) => (
  <div className={cn("space-y-3", className)}>
    <div className="relative rounded-xl overflow-hidden shadow-lg h-[300px] bg-muted/30 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
        <MapPin className="w-6 h-6 text-primary" />
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading route map...</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="h-10 bg-muted/30 rounded-lg animate-pulse" />
      <div className="h-10 bg-muted/30 rounded-lg animate-pulse" />
    </div>
  </div>
);

const LazyDriverRouteMap = ({ pickup, dropoff, customerPhone, className }: LazyDriverRouteMapProps) => {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Preload mapbox immediately for driver panel (critical feature)
    preloadMapbox();
    setShouldLoad(true);
  }, []);

  if (!shouldLoad) {
    return <MapPlaceholder className={className} />;
  }

  return (
    <Suspense fallback={<MapPlaceholder className={className} />}>
      <DriverRouteMap 
        pickup={pickup} 
        dropoff={dropoff} 
        customerPhone={customerPhone}
        className={className}
      />
    </Suspense>
  );
};

export default LazyDriverRouteMap;
