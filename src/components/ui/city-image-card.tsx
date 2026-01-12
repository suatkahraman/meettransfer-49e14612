import { Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface CityImageCardProps {
  city: string;
  className?: string;
}

// City to image mapping - using Unsplash for high quality city images
const CITY_IMAGES: Record<string, string> = {
  "istanbul": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=400&fit=crop",
  "ankara": "https://images.unsplash.com/photo-1569360155989-7d40ed562cb8?w=800&h=400&fit=crop",
  "izmir": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=400&fit=crop",
  "antalya": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=400&fit=crop",
  "bodrum": "https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=800&h=400&fit=crop",
  "fethiye": "https://images.unsplash.com/photo-1602510385025-bf2c715b70e0?w=800&h=400&fit=crop",
  "cappadocia": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&h=400&fit=crop",
  "kapadokya": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&h=400&fit=crop",
  "marmaris": "https://images.unsplash.com/photo-1600240644455-3edc55c375fe?w=800&h=400&fit=crop",
  "alanya": "https://images.unsplash.com/photo-1615461066159-fea0960485d5?w=800&h=400&fit=crop",
  "side": "https://images.unsplash.com/photo-1590076082239-4c49f28a2db3?w=800&h=400&fit=crop",
  "kusadasi": "https://images.unsplash.com/photo-1586803151882-c46ad53a92f9?w=800&h=400&fit=crop",
  "bursa": "https://images.unsplash.com/photo-1603467711530-8df80e2e3f26?w=800&h=400&fit=crop",
};

// Default fallback image for cities not in the mapping
const DEFAULT_CITY_IMAGE = "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop";

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
  const imageUrl = getCityImage(city);
  
  return (
    <div className={cn("relative rounded-xl overflow-hidden", className)}>
      {/* City Image */}
      <div className="relative h-40 sm:h-48 md:h-56">
        <img
          src={imageUrl}
          alt={city}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* City Name Badge */}
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
        
        {/* Decorative Pin */}
        <div className="absolute top-3 right-3">
          <div className="p-2 rounded-full bg-purple-500/90 shadow-lg">
            <MapPin className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
