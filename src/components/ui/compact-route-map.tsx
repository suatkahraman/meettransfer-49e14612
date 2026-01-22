import { useEffect, useRef, useState, memo } from 'react';
import { MapPin, Loader2, Clock, Route, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadGoogleMapsScript, getGoogleMaps, geocodeAddress as geoCode } from '@/utils/googleMapsLoader';

interface CompactRouteMapProps {
  pickup: string;
  dropoff: string;
  className?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface TripInfo {
  duration: string;
  distance: string;
}

const CompactRouteMapComponent = ({
  pickup,
  dropoff,
  className,
}: CompactRouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);

  // Debounce address changes to prevent geocode + map init on each keystroke.
  // This component is rendered in the Hero and some forms where address may be updated while typing.
  const [stablePickup, setStablePickup] = useState(pickup);
  const [stableDropoff, setStableDropoff] = useState(dropoff);

  // Prevent redoing the same work (e.g., re-renders with same values).
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setStablePickup(pickup);
      setStableDropoff(dropoff);
    }, 600);
    return () => window.clearTimeout(timeoutId);
  }, [pickup, dropoff]);

  // Cleanup ONLY on unmount (avoid teardown/recreate on every address change)
  useEffect(() => {
    return () => {
      directionsRendererRef.current?.setMap(null);
      pickupMarkerRef.current?.setMap(null);
      dropoffMarkerRef.current?.setMap(null);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const initMap = async () => {
      if (!mapContainer.current) return;

      const workKey = `${stablePickup}__${stableDropoff}`;
      if (lastKeyRef.current === workKey) {
        setLoading(false);
        return;
      }
      lastKeyRef.current = workKey;
      
      setLoading(true);
      setError(null);
      setTripInfo(null);
      setPickupCoords(null);
      setDropoffCoords(null);

      try {
        await loadGoogleMapsScript();
      } catch (err) {
        setError('Failed to load map');
        setLoading(false);
        return;
      }

      const maps = getGoogleMaps();
      if (isCancelled || !maps) {
        setLoading(false);
        return;
      }

      let pickupResult: Coordinates | null = null;
      let dropoffResult: Coordinates | null = null;
      try {
        [pickupResult, dropoffResult] = await Promise.all([
          geoCode(stablePickup),
          geoCode(stableDropoff),
        ]);
      } catch {
        pickupResult = null;
        dropoffResult = null;
      }

      if (isCancelled) return;

      setPickupCoords(pickupResult);
      setDropoffCoords(dropoffResult);

      if (!pickupResult && !dropoffResult) {
        setError('Could not locate addresses');
        setLoading(false);
        return;
      }

      const coords = [pickupResult, dropoffResult].filter(Boolean) as Coordinates[];
      const center = coords.length === 2
        ? { lat: (coords[0].lat + coords[1].lat) / 2, lng: (coords[0].lng + coords[1].lng) / 2 }
        : coords[0];

      // Initialize the map ONCE; later updates just adjust center/options.
      if (!mapRef.current) {
        mapRef.current = new maps.Map(mapContainer.current!, {
          center,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          gestureHandling: 'none',
          disableDefaultUI: true,
        });
      } else {
        mapRef.current.setOptions({
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          gestureHandling: 'none',
          disableDefaultUI: true,
        });
        mapRef.current.setCenter(center);
      }

      const upsertMarker = (
        markerRef: { current: any },
        position: Coordinates | null,
        title: string,
        iconUrl: string
      ) => {
        if (!position) {
          markerRef.current?.setMap(null);
          return;
        }
        if (!markerRef.current) {
          markerRef.current = new maps.Marker({
            position,
            map: mapRef.current,
            title,
            icon: { url: iconUrl },
          });
          return;
        }
        markerRef.current.setMap(mapRef.current);
        markerRef.current.setPosition(position);
        markerRef.current.setTitle?.(title);
        markerRef.current.setIcon?.({ url: iconUrl });
      };

      if (pickupResult && dropoffResult) {
        // Hide single markers when showing a full route
        pickupMarkerRef.current?.setMap(null);
        dropoffMarkerRef.current?.setMap(null);

        if (!directionsServiceRef.current) {
          directionsServiceRef.current = new maps.DirectionsService();
        }
        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new maps.DirectionsRenderer({
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#3b82f6',
              strokeWeight: 4,
              strokeOpacity: 0.8,
            },
          });
        }
        directionsRendererRef.current.setMap(mapRef.current);

        directionsServiceRef.current.route(
          {
            origin: pickupResult,
            destination: dropoffResult,
            travelMode: maps.TravelMode.DRIVING,
          },
          (result: any, status: string) => {
            if (isCancelled) return;
            
            if (status === 'OK' && result) {
              directionsRendererRef.current?.setDirections(result);
              
              const leg = result.routes[0]?.legs[0];
              if (leg) {
                setTripInfo({
                  duration: leg.duration?.text || '',
                  distance: leg.distance?.text || '',
                });
              }
            }
            setLoading(false);
          }
        );
      } else {
        // Hide route renderer and show single markers
        directionsRendererRef.current?.setMap(null);
        upsertMarker(
          pickupMarkerRef,
          pickupResult,
          'Pickup',
          'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        );
        upsertMarker(
          dropoffMarkerRef,
          dropoffResult,
          'Drop-off',
          'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        );
        setLoading(false);
      }
    };

    if (stablePickup && stableDropoff) {
      initMap();
    } else {
      setLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [stablePickup, stableDropoff]);

  const openGoogleMaps = () => {
    if (pickupCoords && dropoffCoords) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${dropoffCoords.lat},${dropoffCoords.lng}`,
        '_blank'
      );
    }
  };

  if (!stablePickup || !stableDropoff) {
    return null;
  }

  if (error) {
    return (
      <div 
        className={cn("bg-muted/50 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/70 transition-colors", className)}
        onClick={openGoogleMaps}
      >
        <MapPin className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
        <p className="text-xs text-muted-foreground">View in Google Maps</p>
      </div>
    );
  }

  return (
    <div 
      className={cn("relative rounded-lg overflow-hidden border cursor-pointer group", className)}
      onClick={openGoogleMaps}
    >
      {loading && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      
      <div ref={mapContainer} className="h-[140px] w-full" />
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
          <ExternalLink className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Open in Maps</span>
        </div>
      </div>
      
      {/* Trip Info Overlay */}
      {tripInfo && !loading && (
        <div className="absolute bottom-2 left-2 right-2 bg-background/95 backdrop-blur-sm rounded-md px-2.5 py-1.5 shadow border">
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{tripInfo.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-medium">{tripInfo.distance}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CompactRouteMap = memo(CompactRouteMapComponent);
export default CompactRouteMap;
