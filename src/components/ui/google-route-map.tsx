import { useEffect, useRef, useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Phone, ExternalLink, Loader2, Clock, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadGoogleMapsScript, getGoogleMaps, geocodeAddress as geoCode } from '@/utils/googleMapsLoader';

const withTimeout = async <T,>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage: string
): Promise<T> => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

interface GoogleRouteMapProps {
  pickup: string;
  dropoff: string;
  customerPhone?: string;
  className?: string;
  showNavigationButtons?: boolean;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface TripInfo {
  duration: string;
  distance: string;
}

const GoogleRouteMapComponent = ({
  pickup,
  dropoff,
  customerPhone,
  className,
  showNavigationButtons = true,
}: GoogleRouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);

  // Debounce pickup/dropoff changes to avoid heavy geocoding + map re-init on every keystroke.
  // (Some forms update address state while the user is typing.)
  const [stablePickup, setStablePickup] = useState(pickup);
  const [stableDropoff, setStableDropoff] = useState(dropoff);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setStablePickup(pickup);
      setStableDropoff(dropoff);
    }, 600);
    return () => window.clearTimeout(timeoutId);
  }, [pickup, dropoff]);

  useEffect(() => {
    let isCancelled = false;

    const initMap = async () => {
      if (!mapContainer.current) return;
      
      setLoading(true);
      setError(null);
      setTripInfo(null);
      setPickupCoords(null);
      setDropoffCoords(null);

      try {
        await withTimeout(loadGoogleMapsScript(), 15000, 'Google Maps yükleme zaman aşımı');
      } catch (err) {
        setError('Google Maps yüklenemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.');
        setLoading(false);
        return;
      }

      const maps = getGoogleMaps();
      if (isCancelled || !maps) {
        setLoading(false);
        return;
      }

      // Geocode both addresses
      let pickupResult: Coordinates | null = null;
      let dropoffResult: Coordinates | null = null;
      try {
        [pickupResult, dropoffResult] = await Promise.all([
          withTimeout(geoCode(stablePickup), 12000, 'Alış noktası çözümlenemedi (zaman aşımı)'),
          withTimeout(geoCode(stableDropoff), 12000, 'Bırakış noktası çözümlenemedi (zaman aşımı)'),
        ]);
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Adresler çözümlenirken bir hata oluştu.'
          );
          setLoading(false);
        }
        return;
      }

      if (isCancelled) return;

      setPickupCoords(pickupResult);
      setDropoffCoords(dropoffResult);

      if (!pickupResult && !dropoffResult) {
        setError('Could not locate addresses');
        setLoading(false);
        return;
      }

      // Calculate center
      const coords = [pickupResult, dropoffResult].filter(Boolean) as Coordinates[];
      const center = coords.length === 2
        ? { lat: (coords[0].lat + coords[1].lat) / 2, lng: (coords[0].lng + coords[1].lng) / 2 }
        : coords[0];

      // Initialize map
      mapRef.current = new maps.Map(mapContainer.current!, {
        center,
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      // Add traffic layer
      const trafficLayer = new maps.TrafficLayer();
      trafficLayer.setMap(mapRef.current);

      // If we have both coordinates, draw the route
      if (pickupResult && dropoffResult) {
        const directionsService = new maps.DirectionsService();
        directionsRendererRef.current = new maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: false,
          polylineOptions: {
            // Keep theme-safe: color is handled by Google, but we avoid Tailwind color tokens here.
            strokeColor: '#3b82f6',
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });

        try {
          const { result, status } = await withTimeout(
            new Promise<{ result: any; status: string }>((resolve) => {
              directionsService.route(
                {
                  origin: pickupResult,
                  destination: dropoffResult,
                  travelMode: maps.TravelMode.DRIVING,
                },
                (res: any, st: string) => resolve({ result: res, status: st })
              );
            }),
            15000,
            'Rota hesaplama zaman aşımı'
          );

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
          } else {
            // Common statuses: REQUEST_DENIED, ZERO_RESULTS, OVER_QUERY_LIMIT, NOT_FOUND
            const message =
              status === 'REQUEST_DENIED'
                ? 'Harita servis izni reddedildi (API key/domain kısıtı olabilir).'
                : status === 'OVER_QUERY_LIMIT'
                  ? 'Harita sorgu limiti aşıldı. Lütfen biraz sonra tekrar deneyin.'
                  : status === 'ZERO_RESULTS'
                    ? 'Bu iki nokta arasında rota bulunamadı.'
                    : 'Rota oluşturulamadı.';
            setError(message);
          }
        } catch (err) {
          if (!isCancelled) {
            setError(err instanceof Error ? err.message : 'Rota oluşturulamadı.');
          }
        } finally {
          if (!isCancelled) setLoading(false);
        }
      } else {
        // Just show single marker
        if (pickupResult) {
          new maps.Marker({
            position: pickupResult,
            map: mapRef.current,
            title: 'Pickup',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            },
          });
        }
        if (dropoffResult) {
          new maps.Marker({
            position: dropoffResult,
            map: mapRef.current,
            title: 'Drop-off',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            },
          });
        }
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
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [stablePickup, stableDropoff]);

  // Open navigation in external app
  const openNavigation = (destination: Coordinates | null) => {
    if (!destination) return;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${destination.lat},${destination.lng}&dirflg=d`, '_blank');
    } else if (isAndroid) {
      window.open(`google.navigation:q=${destination.lat},${destination.lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`, '_blank');
    }
  };

  const openGoogleMaps = () => {
    if (pickupCoords && dropoffCoords) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${dropoffCoords.lat},${dropoffCoords.lng}`,
        '_blank'
      );
    } else if (pickupCoords) {
      window.open(`https://www.google.com/maps?q=${pickupCoords.lat},${pickupCoords.lng}`, '_blank');
    } else if (dropoffCoords) {
      window.open(`https://www.google.com/maps?q=${dropoffCoords.lat},${dropoffCoords.lng}`, '_blank');
    }
  };

  if (!stablePickup && !stableDropoff) {
    return null;
  }

  if (error) {
    return (
      <div className={cn("bg-muted/50 rounded-lg p-6 text-center", className)}>
        <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={openGoogleMaps}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Google Maps
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden shadow-lg border">
        {loading && (
          <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <div ref={mapContainer} className="h-[300px] w-full" />
        
        {/* Trip Info Overlay */}
        {tripInfo && !loading && (
          <div className="absolute bottom-3 left-3 right-3 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold text-sm">{tripInfo.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Route className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-semibold text-sm">{tripInfo.distance}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {showNavigationButtons && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => openNavigation(pickupCoords)}
            disabled={!pickupCoords}
          >
            <Navigation className="h-4 w-4" />
            <span className="text-sm">Navigate to Pickup</span>
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => openNavigation(dropoffCoords)}
            disabled={!dropoffCoords}
          >
            <Navigation className="h-4 w-4" />
            <span className="text-sm">Navigate to Drop-off</span>
          </Button>
        </div>
      )}

      {/* Call Customer */}
      {customerPhone && showNavigationButtons && (
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          asChild
        >
          <a href={`tel:${customerPhone}`}>
            <Phone className="h-4 w-4" />
            <span>Call Customer: {customerPhone}</span>
          </a>
        </Button>
      )}
    </div>
  );
};

export const GoogleRouteMap = memo(GoogleRouteMapComponent);
export default GoogleRouteMap;
