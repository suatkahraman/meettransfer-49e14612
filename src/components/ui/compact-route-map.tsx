import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Clock, Route, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Same API key as Google Places Autocomplete
const GOOGLE_MAPS_API_KEY = 'AIzaSyCk_A1D5LOqb2TuIFuOiVVjGDSAprap38M';

// Track script loading globally
let isScriptLoading = false;
let isScriptLoaded = false;
const loadCallbacks: (() => void)[] = [];

const getGoogleMaps = (): any => {
  return (window as any).google?.maps;
};

const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve) => {
    const maps = getGoogleMaps();
    if (isScriptLoaded && maps) {
      resolve();
      return;
    }

    if (isScriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript && getGoogleMaps()) {
      isScriptLoaded = true;
      resolve();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        isScriptLoaded = true;
        resolve();
      });
      return;
    }

    isScriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      resolve();
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      isScriptLoading = false;
      console.error('Failed to load Google Maps script');
    };

    document.head.appendChild(script);
  });
};

export const CompactRouteMap = ({
  pickup,
  dropoff,
  className,
}: CompactRouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);

  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    const maps = getGoogleMaps();
    if (!maps) return null;
    
    return new Promise((resolve) => {
      const geocoder = new maps.Geocoder();
      geocoder.geocode(
        { address, region: 'TR' },
        (results: any[], status: string) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({ lat: location.lat(), lng: location.lng() });
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  useEffect(() => {
    let isCancelled = false;

    const initMap = async () => {
      if (!mapContainer.current) return;
      
      setLoading(true);
      setError(null);

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

      const [pickupResult, dropoffResult] = await Promise.all([
        geocodeAddress(pickup),
        geocodeAddress(dropoff)
      ]);

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

      if (pickupResult && dropoffResult) {
        const directionsService = new maps.DirectionsService();
        directionsRendererRef.current = new maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#3b82f6',
            strokeWeight: 4,
            strokeOpacity: 0.8,
          },
        });

        directionsService.route(
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
        if (pickupResult) {
          new maps.Marker({
            position: pickupResult,
            map: mapRef.current,
            title: 'Pickup',
            icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' },
          });
        }
        if (dropoffResult) {
          new maps.Marker({
            position: dropoffResult,
            map: mapRef.current,
            title: 'Drop-off',
            icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' },
          });
        }
        setLoading(false);
      }
    };

    if (pickup && dropoff) {
      initMap();
    } else {
      setLoading(false);
    }

    return () => {
      isCancelled = true;
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [pickup, dropoff]);

  const openGoogleMaps = () => {
    if (pickupCoords && dropoffCoords) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${dropoffCoords.lat},${dropoffCoords.lng}`,
        '_blank'
      );
    }
  };

  if (!pickup || !dropoff) {
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

export default CompactRouteMap;
