import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { MapPin, Plane, Hotel, Anchor, Camera, UtensilsCrossed, ShoppingBag, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Location {
  name: string;
  lat: number;
  lng: number;
  type: 'airport' | 'hotel' | 'landmark' | 'beach' | 'restaurant' | 'shopping' | 'marina';
}

interface DestinationMapProps {
  cityName: string;
  locations: Location[];
  center: { lat: number; lng: number };
  zoom?: number;
}

// City coordinates data
const cityCoordinates: Record<string, { center: { lat: number; lng: number }; zoom: number; locations: Location[] }> = {
  istanbul: {
    center: { lat: 41.0082, lng: 28.9784 },
    zoom: 10,
    locations: [
      { name: "Istanbul Airport (IST)", lat: 41.2608, lng: 28.7428, type: 'airport' },
      { name: "Sabiha Gökçen (SAW)", lat: 40.8989, lng: 29.3092, type: 'airport' },
      { name: "Taksim Square", lat: 41.0369, lng: 28.9850, type: 'landmark' },
      { name: "Sultanahmet", lat: 41.0054, lng: 28.9768, type: 'landmark' },
      { name: "Galataport", lat: 41.0242, lng: 28.9833, type: 'marina' },
      { name: "Kadıköy", lat: 40.9927, lng: 29.0277, type: 'shopping' },
      { name: "Beşiktaş", lat: 41.0432, lng: 29.0086, type: 'landmark' },
    ]
  },
  antalya: {
    center: { lat: 36.8969, lng: 30.7133 },
    zoom: 9,
    locations: [
      { name: "Antalya Airport (AYT)", lat: 36.8987, lng: 30.8005, type: 'airport' },
      { name: "Lara Beach", lat: 36.8500, lng: 30.7833, type: 'beach' },
      { name: "Belek Golf", lat: 36.8530, lng: 31.0500, type: 'landmark' },
      { name: "Side", lat: 36.7667, lng: 31.3833, type: 'landmark' },
      { name: "Kemer", lat: 36.5947, lng: 30.5561, type: 'beach' },
      { name: "Old Town (Kaleiçi)", lat: 36.8841, lng: 30.7056, type: 'landmark' },
    ]
  },
  bodrum: {
    center: { lat: 37.0344, lng: 27.4305 },
    zoom: 10,
    locations: [
      { name: "Milas-Bodrum Airport (BJV)", lat: 37.2500, lng: 27.6667, type: 'airport' },
      { name: "Bodrum Marina", lat: 37.0323, lng: 27.4265, type: 'marina' },
      { name: "Yalıkavak (Palmarina)", lat: 37.1089, lng: 27.2892, type: 'marina' },
      { name: "Türkbükü", lat: 37.1064, lng: 27.3711, type: 'beach' },
      { name: "Gündoğan", lat: 37.0944, lng: 27.3625, type: 'beach' },
      { name: "Bitez Beach", lat: 37.0361, lng: 27.3942, type: 'beach' },
    ]
  },
  dalaman: {
    center: { lat: 36.7667, lng: 28.8000 },
    zoom: 9,
    locations: [
      { name: "Dalaman Airport (DLM)", lat: 36.7131, lng: 28.7925, type: 'airport' },
      { name: "Fethiye", lat: 36.6214, lng: 29.1167, type: 'landmark' },
      { name: "Ölüdeniz Blue Lagoon", lat: 36.5491, lng: 29.1158, type: 'beach' },
      { name: "Göcek Marina", lat: 36.7508, lng: 28.9361, type: 'marina' },
      { name: "Marmaris", lat: 36.8500, lng: 28.2750, type: 'beach' },
      { name: "Kalkan", lat: 36.2667, lng: 29.4167, type: 'landmark' },
    ]
  },
  izmir: {
    center: { lat: 38.4237, lng: 27.1428 },
    zoom: 9,
    locations: [
      { name: "Adnan Menderes Airport (ADB)", lat: 38.2924, lng: 27.1569, type: 'airport' },
      { name: "Çeşme", lat: 38.3236, lng: 26.3033, type: 'beach' },
      { name: "Alaçatı", lat: 38.2750, lng: 26.3750, type: 'landmark' },
      { name: "Ephesus", lat: 37.9394, lng: 27.3417, type: 'landmark' },
      { name: "Kuşadası", lat: 37.8583, lng: 27.2583, type: 'marina' },
      { name: "İzmir Center (Alsancak)", lat: 38.4333, lng: 27.1417, type: 'shopping' },
    ]
  },
  cappadocia: {
    center: { lat: 38.6431, lng: 34.8289 },
    zoom: 10,
    locations: [
      { name: "Nevşehir Airport (NAV)", lat: 38.7719, lng: 34.5350, type: 'airport' },
      { name: "Kayseri Airport (ASR)", lat: 38.7700, lng: 35.4956, type: 'airport' },
      { name: "Göreme", lat: 38.6431, lng: 34.8289, type: 'landmark' },
      { name: "Ürgüp", lat: 38.6294, lng: 34.9114, type: 'hotel' },
      { name: "Uçhisar Castle", lat: 38.6297, lng: 34.8019, type: 'landmark' },
      { name: "Derinkuyu Underground City", lat: 38.3750, lng: 34.7333, type: 'landmark' },
    ]
  },
  dubai: {
    center: { lat: 25.2048, lng: 55.2708 },
    zoom: 10,
    locations: [
      { name: "Dubai International (DXB)", lat: 25.2532, lng: 55.3657, type: 'airport' },
      { name: "Downtown Dubai (Burj Khalifa)", lat: 25.1972, lng: 55.2744, type: 'landmark' },
      { name: "Palm Jumeirah", lat: 25.1124, lng: 55.1390, type: 'hotel' },
      { name: "Dubai Marina", lat: 25.0805, lng: 55.1403, type: 'marina' },
      { name: "JBR Beach", lat: 25.0795, lng: 55.1340, type: 'beach' },
      { name: "Dubai Mall", lat: 25.1985, lng: 55.2796, type: 'shopping' },
    ]
  },
  cyprus: {
    center: { lat: 35.1264, lng: 33.4299 },
    zoom: 8,
    locations: [
      { name: "Larnaca Airport (LCA)", lat: 34.8751, lng: 33.6249, type: 'airport' },
      { name: "Ercan Airport (ECN)", lat: 35.1544, lng: 33.4961, type: 'airport' },
      { name: "Limassol", lat: 34.7072, lng: 33.0226, type: 'marina' },
      { name: "Ayia Napa", lat: 34.9833, lng: 34.0000, type: 'beach' },
      { name: "Nicosia", lat: 35.1856, lng: 33.3823, type: 'landmark' },
      { name: "Kyrenia", lat: 35.3403, lng: 33.3192, type: 'marina' },
    ]
  },
  fethiye: {
    center: { lat: 36.6214, lng: 29.1167 },
    zoom: 11,
    locations: [
      { name: "Dalaman Airport (DLM)", lat: 36.7131, lng: 28.7925, type: 'airport' },
      { name: "Fethiye Marina", lat: 36.6214, lng: 29.1167, type: 'marina' },
      { name: "Ölüdeniz", lat: 36.5491, lng: 29.1158, type: 'beach' },
      { name: "Hisarönü", lat: 36.5667, lng: 29.1167, type: 'landmark' },
      { name: "Kayaköy Ghost Village", lat: 36.5833, lng: 29.0833, type: 'landmark' },
      { name: "Çalış Beach", lat: 36.6583, lng: 29.0917, type: 'beach' },
    ]
  },
  marmaris: {
    center: { lat: 36.8500, lng: 28.2750 },
    zoom: 11,
    locations: [
      { name: "Dalaman Airport (DLM)", lat: 36.7131, lng: 28.7925, type: 'airport' },
      { name: "Marmaris Marina", lat: 36.8508, lng: 28.2697, type: 'marina' },
      { name: "Marmaris Castle", lat: 36.8511, lng: 28.2689, type: 'landmark' },
      { name: "İçmeler Beach", lat: 36.8167, lng: 28.2333, type: 'beach' },
      { name: "Turunç", lat: 36.7833, lng: 28.2333, type: 'beach' },
      { name: "Bar Street", lat: 36.8500, lng: 28.2700, type: 'restaurant' },
    ]
  },
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '';

const getLocationIcon = (type: string) => {
  switch (type) {
    case 'airport': return Plane;
    case 'hotel': return Hotel;
    case 'marina': return Anchor;
    case 'beach': return Camera;
    case 'restaurant': return UtensilsCrossed;
    case 'shopping': return ShoppingBag;
    default: return MapPin;
  }
};

const getLocationColor = (type: string) => {
  switch (type) {
    case 'airport': return '#3b82f6'; // blue
    case 'hotel': return '#8b5cf6'; // purple
    case 'marina': return '#06b6d4'; // cyan
    case 'beach': return '#f59e0b'; // amber
    case 'restaurant': return '#ef4444'; // red
    case 'shopping': return '#ec4899'; // pink
    default: return '#10b981'; // emerald
  }
};

export const DestinationMap = ({ cityKey }: { cityKey: string }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const isTR = language?.toLowerCase() === 'tr';

  const cityData = cityCoordinates[cityKey.toLowerCase()];

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || !cityData) {
      if (!MAPBOX_TOKEN) setError('Map token not configured');
      if (!cityData) setError('City data not available');
      setLoading(false);
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [cityData.center.lng, cityData.center.lat],
      zoom: cityData.zoom,
      pitch: 30,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.scrollZoom.disable();

    map.current.on('load', () => {
      setLoading(false);

      // Add markers for each location
      cityData.locations.forEach((location) => {
        const color = getLocationColor(location.type);
        
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `
          <div style="
            background: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid white;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${location.type === 'airport' ? '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>' :
                location.type === 'hotel' ? '<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="m9 16 .348-.24c1.465-1.013 3.84-1.013 5.304 0L15 16"/><path d="M8 7h.01"/><path d="M16 7h.01"/><path d="M12 7h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 11h.01"/><path d="M10 22v-6.5m4 0V22"/>' :
                location.type === 'marina' ? '<circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>' :
                location.type === 'beach' ? '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>' :
                location.type === 'shopping' ? '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>' :
                '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'}
            </svg>
          </div>
        `;

        el.addEventListener('mouseenter', () => {
          el.firstElementChild && ((el.firstElementChild as HTMLElement).style.transform = 'scale(1.2)');
        });
        el.addEventListener('mouseleave', () => {
          el.firstElementChild && ((el.firstElementChild as HTMLElement).style.transform = 'scale(1)');
        });

        new mapboxgl.Marker(el)
          .setLngLat([location.lng, location.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25, closeButton: false })
              .setHTML(`
                <div style="padding: 8px; font-family: system-ui, sans-serif;">
                  <strong style="font-size: 14px;">${location.name}</strong>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #666; text-transform: capitalize;">${location.type}</p>
                </div>
              `)
          )
          .addTo(map.current!);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [cityKey, cityData]);

  if (!cityData) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-12"
    >
      <h2 className="text-2xl font-bold mb-6">
        {isTR ? 'Şehir Haritası & Popüler Lokasyonlar' : 'City Map & Popular Locations'}
      </h2>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border shadow-lg h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
              <p className="text-muted-foreground">{error}</p>
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full" />
        </div>

        {/* Location Legend */}
        <div className="bg-card border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 text-lg">
            {isTR ? 'Popüler Noktalar' : 'Popular Points'}
          </h3>
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
            {cityData.locations.map((location, idx) => {
              const Icon = getLocationIcon(location.type);
              const color = getLocationColor(location.type);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => {
                    map.current?.flyTo({
                      center: [location.lng, location.lat],
                      zoom: 14,
                      duration: 1000,
                    });
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{location.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{location.type}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              {isTR ? 'Konum Türleri' : 'Location Types'}
            </p>
            <div className="flex flex-wrap gap-2">
              {['airport', 'hotel', 'marina', 'beach', 'landmark', 'shopping'].map((type) => (
                <div
                  key={type}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{ 
                    backgroundColor: `${getLocationColor(type)}15`,
                    color: getLocationColor(type)
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: getLocationColor(type) }}
                  />
                  <span className="capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default DestinationMap;
