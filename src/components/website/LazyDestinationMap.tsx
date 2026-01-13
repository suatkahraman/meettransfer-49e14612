import { lazy, Suspense, useEffect, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { preloadMapbox } from '@/utils/mapboxLoader';

// Lazy load the actual map component
const DestinationMap = lazy(() => import('./DestinationMap'));

interface LazyDestinationMapProps {
  cityKey: string;
}

const MapPlaceholder = () => (
  <div className="w-full h-[500px] md:h-[600px] rounded-2xl bg-muted/30 flex flex-col items-center justify-center gap-4">
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
      <MapPin className="w-8 h-8 text-primary" />
    </div>
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Loading map...</span>
    </div>
  </div>
);

const LazyDestinationMap = ({ cityKey }: LazyDestinationMapProps) => {
  const [shouldLoad, setShouldLoad] = useState(false);

  // Preload mapbox-gl when component mounts (user is likely to interact)
  useEffect(() => {
    preloadMapbox();
    // Small delay to let critical content load first
    const timer = setTimeout(() => setShouldLoad(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) {
    return <MapPlaceholder />;
  }

  return (
    <Suspense fallback={<MapPlaceholder />}>
      <DestinationMap cityKey={cityKey} />
    </Suspense>
  );
};

export default LazyDestinationMap;
