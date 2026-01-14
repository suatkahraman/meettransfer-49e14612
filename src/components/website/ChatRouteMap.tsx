import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Route, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface ChatRouteMapProps {
  pickup: string;
  dropoff: string;
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  distance?: string;
  duration?: string;
  language: string;
  compact?: boolean;
}

export const ChatRouteMap = memo(function ChatRouteMap({
  pickup,
  dropoff,
  pickupCoords,
  dropoffCoords,
  distance,
  duration,
  language,
  compact = true,
}: ChatRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const isTurkish = language === "TR";

  // Fetch Mapbox token from environment or edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // Try to get from environment first (for development)
        const envToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
        if (envToken) {
          setMapToken(envToken);
          return;
        }

        // Fallback: fetch from edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mapbox-token`,
          {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setMapToken(data.token);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Mapbox token:", err);
        setError(isTurkish ? "Harita yüklenemedi" : "Failed to load map");
      }
    };

    fetchToken();
  }, [isTurkish]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapToken || !pickupCoords || !dropoffCoords) {
      setIsLoading(false);
      return;
    }

    try {
      mapboxgl.accessToken = mapToken;

      // Calculate center and bounds
      const centerLat = (pickupCoords.lat + dropoffCoords.lat) / 2;
      const centerLng = (pickupCoords.lng + dropoffCoords.lng) / 2;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [centerLng, centerLat],
        zoom: 10,
        interactive: false, // Static map for chat
        attributionControl: false,
      });

      map.current.on("load", () => {
        if (!map.current) return;

        // Add pickup marker
        new mapboxgl.Marker({ color: "#22c55e" })
          .setLngLat([pickupCoords.lng, pickupCoords.lat])
          .addTo(map.current);

        // Add dropoff marker
        new mapboxgl.Marker({ color: "#ef4444" })
          .setLngLat([dropoffCoords.lng, dropoffCoords.lat])
          .addTo(map.current);

        // Fit bounds to show both markers
        const bounds = new mapboxgl.LngLatBounds()
          .extend([pickupCoords.lng, pickupCoords.lat])
          .extend([dropoffCoords.lng, dropoffCoords.lat]);

        map.current.fitBounds(bounds, {
          padding: { top: 30, bottom: 30, left: 30, right: 30 },
          maxZoom: 12,
        });

        // Try to draw route line
        fetchAndDrawRoute();
        
        setIsLoading(false);
      });

      map.current.on("error", () => {
        setError(isTurkish ? "Harita yüklenemedi" : "Failed to load map");
        setIsLoading(false);
      });

    } catch (err) {
      console.error("Map initialization error:", err);
      setError(isTurkish ? "Harita yüklenemedi" : "Failed to load map");
      setIsLoading(false);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapToken, pickupCoords, dropoffCoords, isTurkish]);

  // Fetch and draw route
  const fetchAndDrawRoute = async () => {
    if (!map.current || !pickupCoords || !dropoffCoords) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords.lng},${pickupCoords.lat};${dropoffCoords.lng},${dropoffCoords.lat}?geometries=geojson&access_token=${mapToken}`
      );

      if (!response.ok) return;

      const data = await response.json();
      const route = data.routes?.[0]?.geometry;

      if (route && map.current) {
        // Add route line
        map.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: route,
          },
        });

        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });
      }
    } catch (err) {
      console.error("Failed to fetch route:", err);
    }
  };

  // If no coordinates, show a placeholder with location info
  if (!pickupCoords || !dropoffCoords) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/30"
      >
        <div className="p-3 space-y-2">
          {/* Route visualization without map */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="w-0.5 h-6 bg-gradient-to-b from-green-500 to-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Navigation className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium truncate">{pickup}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-red-500" />
                <span className="text-xs font-medium truncate">{dropoff}</span>
              </div>
            </div>
          </div>

          {/* Distance & Duration */}
          {(distance || duration) && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
              {distance && (
                <span className="flex items-center gap-1">
                  <Route className="h-3 w-3" />
                  {distance}
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {duration}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 overflow-hidden rounded-xl border border-border"
    >
      {/* Map Container */}
      <div className={cn("relative", compact ? "h-32" : "h-48")}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 z-10 gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{error}</span>
          </div>
        )}
        
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Route Info Footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground truncate max-w-[80px]">{pickup.split(',')[0]}</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground truncate max-w-[80px]">{dropoff.split(',')[0]}</span>
          </div>
        </div>
        
        {(distance || duration) && (
          <div className="flex items-center gap-2 text-xs font-medium">
            {distance && <span>{distance}</span>}
            {duration && <span className="text-muted-foreground">• {duration}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default ChatRouteMap;
