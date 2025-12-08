import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Phone, ExternalLink, Loader2, Clock, Route } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverRouteMapProps {
  pickup: string;
  dropoff: string;
  customerPhone?: string;
  className?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface TripInfo {
  duration: number; // in seconds
  distance: number; // in meters
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '';

const DriverRouteMap = ({ pickup, dropoff, customerPhone, className }: DriverRouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);

  // Format duration to human readable string
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  // Format distance to human readable string
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // Geocode an address to coordinates
  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    if (!MAPBOX_TOKEN) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  // Initialize map and geocode addresses
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current || !MAPBOX_TOKEN) {
        setError('Map token not configured');
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Geocode both addresses
      const [pickupResult, dropoffResult] = await Promise.all([
        geocodeAddress(pickup),
        geocodeAddress(dropoff)
      ]);

      setPickupCoords(pickupResult);
      setDropoffCoords(dropoffResult);

      if (!pickupResult && !dropoffResult) {
        setError('Could not locate addresses');
        setLoading(false);
        return;
      }

      // Set the access token
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Calculate center and bounds
      const coords = [pickupResult, dropoffResult].filter(Boolean) as Coordinates[];
      const center: [number, number] = coords.length === 2 
        ? [(coords[0].lng + coords[1].lng) / 2, (coords[0].lat + coords[1].lat) / 2]
        : [coords[0].lng, coords[0].lat];

      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: 10,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Wait for map to load
      map.current.on('load', async () => {
        if (!map.current) return;

        // Add pickup marker
        if (pickupResult) {
          const pickupEl = document.createElement('div');
          pickupEl.className = 'pickup-marker';
          pickupEl.innerHTML = `
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `;
          
          new mapboxgl.Marker({ element: pickupEl })
            .setLngLat([pickupResult.lng, pickupResult.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<strong>Pickup</strong><br/>${pickup}`))
            .addTo(map.current);
        }

        // Add dropoff marker
        if (dropoffResult) {
          const dropoffEl = document.createElement('div');
          dropoffEl.className = 'dropoff-marker';
          dropoffEl.innerHTML = `
            <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `;
          
          new mapboxgl.Marker({ element: dropoffEl })
            .setLngLat([dropoffResult.lng, dropoffResult.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<strong>Drop-off</strong><br/>${dropoff}`))
            .addTo(map.current);
        }

        // Draw route if both coordinates exist
        if (pickupResult && dropoffResult) {
          try {
            const routeResponse = await fetch(
              `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupResult.lng},${pickupResult.lat};${dropoffResult.lng},${dropoffResult.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
            );
            const routeData = await routeResponse.json();

            if (routeData.routes && routeData.routes.length > 0) {
              const routeInfo = routeData.routes[0];
              const route = routeInfo.geometry;

              // Extract trip duration and distance
              setTripInfo({
                duration: routeInfo.duration,
                distance: routeInfo.distance
              });

              map.current.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: route
                }
              });

              map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#3b82f6',
                  'line-width': 5,
                  'line-opacity': 0.8
                }
              });

              // Fit map to show entire route
              const coordinates = route.coordinates;
              const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
                return bounds.extend(coord as mapboxgl.LngLatLike);
              }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

              map.current.fitBounds(bounds, {
                padding: 60,
                maxZoom: 14
              });
            }
          } catch (err) {
            console.error('Route error:', err);
          }
        }

        setLoading(false);
      });
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, [pickup, dropoff]);

  // Open navigation in external app
  const openNavigation = (destination: Coordinates | null, address: string) => {
    if (!destination) return;
    
    // Try to detect platform and open appropriate navigation
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      // Apple Maps
      window.open(`maps://maps.apple.com/?daddr=${destination.lat},${destination.lng}&dirflg=d`, '_blank');
    } else if (isAndroid) {
      // Google Maps on Android
      window.open(`google.navigation:q=${destination.lat},${destination.lng}`, '_blank');
    } else {
      // Fallback to Google Maps web
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`, '_blank');
    }
  };

  const openGoogleMaps = (coords: Coordinates | null) => {
    if (!coords) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`, '_blank');
  };

  if (error) {
    return (
      <div className={cn("bg-muted/50 rounded-lg p-6 text-center", className)}>
        <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => openGoogleMaps(pickupCoords)}
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
      <div className="relative rounded-xl overflow-hidden shadow-lg">
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
                    <p className="font-semibold text-sm">{formatDuration(tripInfo.duration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Route className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-semibold text-sm">{formatDistance(tripInfo.distance)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="default"
          className="flex items-center gap-2"
          onClick={() => openNavigation(pickupCoords, pickup)}
          disabled={!pickupCoords}
        >
          <Navigation className="h-4 w-4" />
          <span className="text-sm">Navigate to Pickup</span>
        </Button>
        <Button
          variant="secondary"
          className="flex items-center gap-2"
          onClick={() => openNavigation(dropoffCoords, dropoff)}
          disabled={!dropoffCoords}
        >
          <Navigation className="h-4 w-4" />
          <span className="text-sm">Navigate to Drop-off</span>
        </Button>
      </div>

      {/* Call Customer */}
      {customerPhone && (
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

export default DriverRouteMap;
