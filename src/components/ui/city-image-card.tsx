import { useState } from "react";
import { Building2, MapPin, Loader2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CityImageCardProps {
  city: string;
  className?: string;
}

// City to image mapping - using Unsplash for high quality city images
const CITY_IMAGES: Record<string, string> = {
  // Major cities
  "istanbul": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=400&fit=crop&q=80",
  "ankara": "https://images.unsplash.com/photo-1569360155989-7d40ed562cb8?w=800&h=400&fit=crop&q=80",
  "izmir": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=400&fit=crop&q=80",
  "bursa": "https://images.unsplash.com/photo-1603467711530-8df80e2e3f26?w=800&h=400&fit=crop&q=80",
  
  // Coastal & Tourist cities
  "antalya": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=400&fit=crop&q=80",
  "bodrum": "https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=800&h=400&fit=crop&q=80",
  "fethiye": "https://images.unsplash.com/photo-1602510385025-bf2c715b70e0?w=800&h=400&fit=crop&q=80",
  "marmaris": "https://images.unsplash.com/photo-1600240644455-3edc55c375fe?w=800&h=400&fit=crop&q=80",
  "alanya": "https://images.unsplash.com/photo-1615461066159-fea0960485d5?w=800&h=400&fit=crop&q=80",
  "side": "https://images.unsplash.com/photo-1590076082239-4c49f28a2db3?w=800&h=400&fit=crop&q=80",
  "kusadasi": "https://images.unsplash.com/photo-1586803151882-c46ad53a92f9?w=800&h=400&fit=crop&q=80",
  "kuşadası": "https://images.unsplash.com/photo-1586803151882-c46ad53a92f9?w=800&h=400&fit=crop&q=80",
  "kas": "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&h=400&fit=crop&q=80",
  "kaş": "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&h=400&fit=crop&q=80",
  "kemer": "https://images.unsplash.com/photo-1596627116790-af6f46dddbf5?w=800&h=400&fit=crop&q=80",
  "belek": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop&q=80",
  "oludeniz": "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&h=400&fit=crop&q=80",
  "ölüdeniz": "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&h=400&fit=crop&q=80",
  
  // Cappadocia region
  "cappadocia": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&h=400&fit=crop&q=80",
  "kapadokya": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&h=400&fit=crop&q=80",
  "nevsehir": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&h=400&fit=crop&q=80",
  "nevşehir": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&h=400&fit=crop&q=80",
  "goreme": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&h=400&fit=crop&q=80",
  "göreme": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&h=400&fit=crop&q=80",
  "urgup": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&h=400&fit=crop&q=80",
  "ürgüp": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&h=400&fit=crop&q=80",
  "kayseri": "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=800&h=400&fit=crop&q=80",
  
  // Muğla province
  "mugla": "https://images.unsplash.com/photo-1602510385025-bf2c715b70e0?w=800&h=400&fit=crop&q=80",
  "muğla": "https://images.unsplash.com/photo-1602510385025-bf2c715b70e0?w=800&h=400&fit=crop&q=80",
  "dalaman": "https://images.unsplash.com/photo-1602510385025-bf2c715b70e0?w=800&h=400&fit=crop&q=80",
  "datca": "https://images.unsplash.com/photo-1600240644455-3edc55c375fe?w=800&h=400&fit=crop&q=80",
  "datça": "https://images.unsplash.com/photo-1600240644455-3edc55c375fe?w=800&h=400&fit=crop&q=80",
  "gocek": "https://images.unsplash.com/photo-1602510385025-bf2c715b70e0?w=800&h=400&fit=crop&q=80",
  "göcek": "https://images.unsplash.com/photo-1602510385025-bf2c715b70e0?w=800&h=400&fit=crop&q=80",
  
  // Aegean region
  "cesme": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=400&fit=crop&q=80",
  "çeşme": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=400&fit=crop&q=80",
  "alacati": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=400&fit=crop&q=80",
  "alaçatı": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=400&fit=crop&q=80",
  "ayvalik": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=400&fit=crop&q=80",
  "ayvalık": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=400&fit=crop&q=80",
  "selcuk": "https://images.unsplash.com/photo-1586803151882-c46ad53a92f9?w=800&h=400&fit=crop&q=80",
  "selçuk": "https://images.unsplash.com/photo-1586803151882-c46ad53a92f9?w=800&h=400&fit=crop&q=80",
  "efes": "https://images.unsplash.com/photo-1586803151882-c46ad53a92f9?w=800&h=400&fit=crop&q=80",
  "ephesus": "https://images.unsplash.com/photo-1586803151882-c46ad53a92f9?w=800&h=400&fit=crop&q=80",
  "pamukkale": "https://images.unsplash.com/photo-1600240644455-3edc55c375fe?w=800&h=400&fit=crop&q=80",
  "denizli": "https://images.unsplash.com/photo-1600240644455-3edc55c375fe?w=800&h=400&fit=crop&q=80",
  
  // Black Sea region
  "trabzon": "https://images.unsplash.com/photo-1566371053325-67bc8bc0eb1c?w=800&h=400&fit=crop&q=80",
  "rize": "https://images.unsplash.com/photo-1566371053325-67bc8bc0eb1c?w=800&h=400&fit=crop&q=80",
  "samsun": "https://images.unsplash.com/photo-1566371053325-67bc8bc0eb1c?w=800&h=400&fit=crop&q=80",
  
  // Other major cities
  "konya": "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=800&h=400&fit=crop&q=80",
  "gaziantep": "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=800&h=400&fit=crop&q=80",
  "adana": "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=800&h=400&fit=crop&q=80",
  "mersin": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=400&fit=crop&q=80",
  "eskisehir": "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=800&h=400&fit=crop&q=80",
  "eskişehir": "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=800&h=400&fit=crop&q=80",
  "sakarya": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop&q=80",
  "kocaeli": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop&q=80",
  
  // Eastern Turkey
  "mardin": "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=800&h=400&fit=crop&q=80",
  "sanliurfa": "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=800&h=400&fit=crop&q=80",
  "şanlıurfa": "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=800&h=400&fit=crop&q=80",
  "diyarbakir": "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=800&h=400&fit=crop&q=80",
  "diyarbakır": "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=800&h=400&fit=crop&q=80",
  "van": "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=800&h=400&fit=crop&q=80",
};

// High quality default fallback - beautiful Turkish landscape
const DEFAULT_CITY_IMAGE = "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=400&fit=crop&q=80";

function getCityImage(city: string): string {
  const normalizedCity = city.toLowerCase().trim();
  
  // Check for exact match first
  if (CITY_IMAGES[normalizedCity]) {
    return CITY_IMAGES[normalizedCity];
  }
  
  // Check if city name contains any of our mapped cities
  for (const [key, url] of Object.entries(CITY_IMAGES)) {
    if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
      return url;
    }
  }
  
  return DEFAULT_CITY_IMAGE;
}

export function CityImageCard({ city, className }: CityImageCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageUrl = getCityImage(city);
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };
  
  return (
    <div className={cn("relative rounded-xl overflow-hidden", className)}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          </div>
        </div>
      )}
      
      {/* City Image */}
      <div className="relative h-40 sm:h-48 md:h-56">
        {hasError ? (
          // Error Fallback
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 via-primary/10 to-accent/20 flex items-center justify-center">
            <div className="text-center">
              <div className="p-4 rounded-full bg-muted/50 inline-block mb-2">
                <Building2 className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground">{city}</p>
              <p className="text-xs text-muted-foreground">Saatlik Kiralama</p>
            </div>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={city}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
        
        {/* Gradient Overlay - only show when image loaded successfully */}
        {!hasError && !isLoading && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        )}
        
        {/* City Name Badge - show after loading */}
        {!isLoading && !hasError && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs font-medium">Saatlik Kiralama</p>
                <p className="text-white text-lg sm:text-xl font-bold">{city}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Decorative Pin - show after loading */}
        {!isLoading && !hasError && (
          <div className="absolute top-3 right-3">
            <div className="p-2 rounded-full bg-purple-500/90 shadow-lg">
              <MapPin className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
