import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Phone, ExternalLink, Loader2, Clock, Route, Car, User, ChevronUp, ChevronDown, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface UberStyleMapProps {
  pickup: string;
  dropoff: string;
  pickupPlaceName?: string | null;
  dropoffPlaceName?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  driverName?: string | null;
  driverPhone?: string | null;
  vehicleModel?: string | null;
  plateNumber?: string | null;
  vehicleColor?: string | null;
  status?: string;
  pickupTime?: string; // HH:mm format
  pickupDate?: string; // YYYY-MM-DD format
  className?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface TripInfo {
  duration: string;
  distance: string;
  durationSeconds: number;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCk_A1D5LOqb2TuIFuOiVVjGDSAprap38M';

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

export const UberStyleMap = ({
  pickup,
  dropoff,
  pickupPlaceName,
  dropoffPlaceName,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  driverName,
  driverPhone,
  vehicleModel,
  plateNumber,
  vehicleColor,
  status,
  pickupTime,
  pickupDate,
  className,
}: UberStyleMapProps) => {
  const { t } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(
    pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : null
  );
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(
    dropoffLat && dropoffLng ? { lat: dropoffLat, lng: dropoffLng } : null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [countdownLabel, setCountdownLabel] = useState<string>('');

  // Calculate countdown to pickup time
  const calculateCountdown = useCallback(() => {
    if (!pickupDate || !pickupTime) return null;
    
    const [hours, minutes] = pickupTime.split(':').map(Number);
    const pickupDateTime = new Date(pickupDate);
    pickupDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const diff = pickupDateTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      // Pickup time has passed, show trip duration countdown if active
      if (status === 'active' && tripInfo?.durationSeconds) {
        return { type: 'arrival', seconds: tripInfo.durationSeconds };
      }
      return null;
    }
    
    return { type: 'pickup', diff };
  }, [pickupDate, pickupTime, status, tripInfo?.durationSeconds]);

  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => {
      const result = calculateCountdown();
      
      if (!result) {
        setCountdown(null);
        setCountdownLabel('');
        return;
      }
      
      if (result.type === 'pickup') {
        const totalSeconds = Math.floor(result.diff / 1000);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        setCountdown({ hours: hrs, minutes: mins, seconds: secs });
        setCountdownLabel(t('timeToPickup') || 'Time to pickup');
      } else if (result.type === 'arrival') {
        const totalSeconds = result.seconds;
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        setCountdown({ hours: hrs, minutes: mins, seconds: secs });
        setCountdownLabel(t('estimatedArrival') || 'Est. arrival');
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [calculateCountdown, t]);

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

      // Use provided coords or geocode
      let pCoords = pickupCoords;
      let dCoords = dropoffCoords;

      if (!pCoords) {
        pCoords = await geocodeAddress(pickup);
        if (!isCancelled) setPickupCoords(pCoords);
      }
      if (!dCoords) {
        dCoords = await geocodeAddress(dropoff);
        if (!isCancelled) setDropoffCoords(dCoords);
      }

      if (isCancelled) return;

      if (!pCoords && !dCoords) {
        setError('Could not locate addresses');
        setLoading(false);
        return;
      }

      const coords = [pCoords, dCoords].filter(Boolean) as Coordinates[];
      const center = coords.length === 2
        ? { lat: (coords[0].lat + coords[1].lat) / 2, lng: (coords[0].lng + coords[1].lng) / 2 }
        : coords[0];

      // Modern dark style for Uber-like look
      const mapStyles = [
        { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#303030' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d1d1d' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#404040' }] },
        { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1d1d1d' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e171d' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#242424' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2e1a' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f2f2f' }] },
      ];

      mapRef.current = new maps.Map(mapContainer.current!, {
        center,
        zoom: 12,
        styles: mapStyles,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'greedy',
      });

      if (pCoords && dCoords) {
        const directionsService = new maps.DirectionsService();
        directionsRendererRef.current = new maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#10b981',
            strokeWeight: 6,
            strokeOpacity: 1,
          },
        });

        // Custom markers
        new maps.Marker({
          position: pCoords,
          map: mapRef.current,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          zIndex: 100,
        });

        new maps.Marker({
          position: dCoords,
          map: mapRef.current,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          zIndex: 100,
        });

        directionsService.route(
          {
            origin: pCoords,
            destination: dCoords,
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
                  durationSeconds: leg.duration?.value || 0,
                });
              }

              // Fit bounds with padding
              const bounds = new maps.LatLngBounds();
              bounds.extend(pCoords);
              bounds.extend(dCoords);
              mapRef.current.fitBounds(bounds, { top: 80, right: 20, bottom: 200, left: 20 });
            }
            setLoading(false);
          }
        );
      } else {
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
  }, [pickup, dropoff, pickupLat, pickupLng, dropoffLat, dropoffLng]);

  const openNavigation = (destination: Coordinates | null, type: 'pickup' | 'dropoff') => {
    if (!destination) return;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${destination.lat},${destination.lng}&dirflg=d`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`, '_blank');
    }
  };

  const openFullRoute = () => {
    if (pickupCoords && dropoffCoords) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${dropoffCoords.lat},${dropoffCoords.lng}`,
        '_blank'
      );
    }
  };

  if (error) {
    return (
      <div className={cn("bg-neutral-900 rounded-2xl p-6 text-center", className)}>
        <MapPin className="h-8 w-8 mx-auto text-neutral-500 mb-2" />
        <p className="text-sm text-neutral-400">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={openFullRoute}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in Maps
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-neutral-900 rounded-2xl overflow-hidden", className)}>
      {/* Map Container - Full Height */}
      <div className="relative h-[400px] sm:h-[450px]">
        {loading && (
          <div className="absolute inset-0 bg-neutral-900 z-10 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Car className="h-6 w-6 text-emerald-500 animate-bounce" />
              </div>
            </div>
            <p className="text-neutral-400 text-sm mt-4">{t('loadingMap') || 'Loading map...'}</p>
          </div>
        )}
        <div ref={mapContainer} className="h-full w-full" />
        
        {/* Top Status Badge */}
        {status && !loading && (
          <div className="absolute top-4 left-4 right-4 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md shadow-lg",
                status === 'active' && "bg-emerald-500/90 text-white",
                status === 'completed' && "bg-blue-500/90 text-white",
                status === 'pending_admin_review' && "bg-amber-500/90 text-white",
                !['active', 'completed', 'pending_admin_review'].includes(status) && "bg-neutral-800/90 text-white"
              )}
            >
              {status === 'active' && (t('driverOnTheWay') || 'Driver on the way')}
              {status === 'completed' && (t('tripCompleted') || 'Trip completed')}
              {status === 'pending_admin_review' && (t('awaitingConfirmation') || 'Awaiting confirmation')}
              {!['active', 'completed', 'pending_admin_review'].includes(status || '') && (t('scheduled') || 'Scheduled')}
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom Card - Uber Style */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-900 via-neutral-900 to-transparent"
        initial={false}
      >
        <div className="p-4 space-y-4">
          {/* ETA Countdown Timer */}
          {countdown && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-amber-400 animate-pulse" />
                <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">
                  {countdownLabel}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {countdown.hours > 0 && (
                  <>
                    <div className="bg-neutral-800 rounded-lg px-3 py-2 min-w-[52px] text-center">
                      <span className="text-2xl font-bold text-white font-mono">
                        {countdown.hours.toString().padStart(2, '0')}
                      </span>
                      <p className="text-[10px] text-neutral-500 uppercase">{t('hours') || 'hrs'}</p>
                    </div>
                    <span className="text-xl font-bold text-neutral-500">:</span>
                  </>
                )}
                <div className="bg-neutral-800 rounded-lg px-3 py-2 min-w-[52px] text-center">
                  <span className="text-2xl font-bold text-white font-mono">
                    {countdown.minutes.toString().padStart(2, '0')}
                  </span>
                  <p className="text-[10px] text-neutral-500 uppercase">{t('minutes') || 'min'}</p>
                </div>
                <span className="text-xl font-bold text-neutral-500">:</span>
                <div className="bg-neutral-800 rounded-lg px-3 py-2 min-w-[52px] text-center">
                  <motion.span 
                    key={countdown.seconds}
                    initial={{ opacity: 0.5, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-2xl font-bold text-emerald-400 font-mono"
                  >
                    {countdown.seconds.toString().padStart(2, '0')}
                  </motion.span>
                  <p className="text-[10px] text-neutral-500 uppercase">{t('seconds') || 'sec'}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Trip Info */}
          {tripInfo && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-6"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">{t('estimatedTime') || 'Est. time'}</p>
                  <p className="font-bold text-white text-lg">{tripInfo.duration}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-neutral-700" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Route className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">{t('distance') || 'Distance'}</p>
                  <p className="font-bold text-white text-lg">{tripInfo.distance}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Route Summary - Expandable */}
          <div 
            className="bg-neutral-800/80 backdrop-blur-md rounded-xl p-3 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              {/* Route Visualization */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-red-500" />
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
              </div>
              
              {/* Locations */}
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <p className="text-xs text-emerald-400 font-medium">{t('pickup') || 'PICKUP'}</p>
                  <p className="text-white text-sm font-medium truncate">
                    {pickupPlaceName || pickup}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-red-400 font-medium">{t('dropoff') || 'DROP-OFF'}</p>
                  <p className="text-white text-sm font-medium truncate">
                    {dropoffPlaceName || dropoff}
                  </p>
                </div>
              </div>

              {/* Expand Arrow */}
              <div className="p-2">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-neutral-400" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-neutral-400" />
                )}
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-neutral-700 space-y-3">
                    {/* Driver Info */}
                    {driverName && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center">
                          <User className="h-6 w-6 text-neutral-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{driverName}</p>
                          {vehicleModel && (
                            <p className="text-neutral-400 text-sm">
                              {vehicleColor && `${vehicleColor} `}{vehicleModel}
                              {plateNumber && ` • ${plateNumber}`}
                            </p>
                          )}
                        </div>
                        {driverPhone && (
                          <a href={`tel:${driverPhone}`}>
                            <Button size="icon" variant="ghost" className="rounded-full bg-emerald-500/20 hover:bg-emerald-500/30">
                              <Phone className="h-4 w-4 text-emerald-400" />
                            </Button>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Full address texts */}
                    {!pickupPlaceName && (
                      <p className="text-xs text-neutral-500 pl-6">{pickup}</p>
                    )}
                    {pickupPlaceName && pickup !== pickupPlaceName && (
                      <p className="text-xs text-neutral-500 pl-6">{pickup}</p>
                    )}
                    {!dropoffPlaceName && (
                      <p className="text-xs text-neutral-500 pl-6">{dropoff}</p>
                    )}
                    {dropoffPlaceName && dropoff !== dropoffPlaceName && (
                      <p className="text-xs text-neutral-500 pl-6">{dropoff}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="default"
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl h-12"
              onClick={() => openNavigation(pickupCoords, 'pickup')}
              disabled={!pickupCoords}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {t('toPickup') || 'To Pickup'}
            </Button>
            <Button
              variant="default"
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl h-12"
              onClick={() => openNavigation(dropoffCoords, 'dropoff')}
              disabled={!dropoffCoords}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {t('toDropoff') || 'To Drop-off'}
            </Button>
          </div>

          {/* View Full Route Button */}
          <Button
            variant="ghost"
            className="w-full text-neutral-400 hover:text-white"
            onClick={openFullRoute}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('openInMaps') || 'Open in Google Maps'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default UberStyleMap;
