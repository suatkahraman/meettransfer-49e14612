import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { ArrowRight, Plane, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, memo, useEffect } from "react";

// City data with lazy-loaded image paths
// Images are dynamically imported only when component mounts
const cities = [
  {
    name: "Istanbul",
    nameTR: "İstanbul",
    imagePath: () => import("@/assets/destinations/istanbul-city.webp"),
    fromPrice: 45,
    airports: ["IST", "SAW"],
    rating: 4.7,
    popular: true,
    gradient: "from-blue-600/60 to-purple-600/60",
  },
  {
    name: "Antalya",
    nameTR: "Antalya",
    imagePath: () => import("@/assets/destinations/antalya-city.webp"),
    fromPrice: 35,
    airports: ["AYT"],
    rating: 4.7,
    popular: true,
    gradient: "from-amber-500/60 to-orange-600/60",
  },
  {
    name: "Bodrum",
    nameTR: "Bodrum",
    imagePath: () => import("@/assets/destinations/bodrum-city.webp"),
    fromPrice: 40,
    airports: ["BJV"],
    rating: 4.8,
    popular: true,
    gradient: "from-emerald-500/60 to-teal-600/60",
  },
  {
    name: "Dalaman",
    nameTR: "Dalaman",
    imagePath: () => import("@/assets/destinations/dalaman-city.webp"),
    fromPrice: 38,
    airports: ["DLM"],
    rating: 4.8,
    popular: false,
    gradient: "from-cyan-500/60 to-blue-600/60",
  },
  {
    name: "Izmir",
    nameTR: "İzmir",
    imagePath: () => import("@/assets/destinations/izmir-city.webp"),
    fromPrice: 42,
    airports: ["ADB"],
    rating: 4.7,
    popular: false,
    gradient: "from-indigo-500/60 to-blue-600/60",
  },
  {
    name: "Cappadocia",
    nameTR: "Kapadokya",
    imagePath: () => import("@/assets/destinations/cappadocia-city.webp"),
    fromPrice: 55,
    airports: ["NAV", "ASR"],
    rating: 4.7,
    popular: true,
    gradient: "from-violet-500/60 to-purple-600/60",
  },
  {
    name: "Dubai",
    nameTR: "Dubai",
    imagePath: () => import("@/assets/destinations/dubai-city.webp"),
    fromPrice: 65,
    airports: ["DXB"],
    rating: 4.7,
    popular: true,
    gradient: "from-amber-500/60 to-yellow-600/60",
  },
  {
    name: "Cyprus",
    nameTR: "Kıbrıs",
    imagePath: () => import("@/assets/destinations/cyprus-city.webp"),
    fromPrice: 50,
    airports: ["LCA", "ECN"],
    rating: 4.8,
    popular: true,
    gradient: "from-green-500/60 to-emerald-600/60",
  },
  {
    name: "Fethiye",
    nameTR: "Fethiye",
    imagePath: () => import("@/assets/destinations/fethiye-city.webp"),
    fromPrice: 45,
    airports: ["DLM"],
    rating: 4.8,
    popular: false,
    gradient: "from-sky-500/60 to-cyan-600/60",
  },
  {
    name: "Marmaris",
    nameTR: "Marmaris",
    imagePath: () => import("@/assets/destinations/marmaris-city.webp"),
    fromPrice: 48,
    airports: ["DLM"],
    rating: 4.7,
    popular: false,
    gradient: "from-rose-500/60 to-pink-600/60",
  },
  {
    name: "Frankfurt",
    nameTR: "Frankfurt",
    imagePath: () => import("@/assets/destinations/frankfurt-city.webp"),
    fromPrice: 55,
    airports: ["FRA"],
    rating: 4.7,
    popular: true,
    gradient: "from-slate-500/60 to-zinc-600/60",
  },
  {
    name: "Athens",
    nameTR: "Atina",
    imagePath: () => import("@/assets/destinations/athens-city.webp"),
    fromPrice: 45,
    airports: ["ATH"],
    rating: 4.7,
    popular: true,
    gradient: "from-blue-500/60 to-indigo-600/60",
  },
  {
    name: "Adana",
    nameTR: "Adana",
    imagePath: () => import("@/assets/destinations/adana-city.webp"),
    fromPrice: 40,
    airports: ["ADA"],
    rating: 4.7,
    popular: false,
    gradient: "from-orange-500/60 to-red-600/60",
  },
];

type CityType = typeof cities[0];

const CityMarquee = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleCityClick = (city: CityType) => {
    navigate(`/destinations/${city.name.toLowerCase()}`);
  };

  return (
    <div className="w-full py-8 md:py-12">
      {/* Section Title */}
      <div className="container px-4 mb-6">
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {language === 'TR' ? 'Popüler Destinasyonlar' : 'Popular Destinations'}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              {language === 'TR' 
                ? 'En çok tercih edilen transfer güzergahlarımız' 
                : 'Our most popular transfer destinations'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/destinations')}
            className="hidden md:flex items-center gap-2 text-primary font-medium hover:underline"
          >
            {language === 'TR' ? 'Tümünü Gör' : 'View All'}
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </div>

      {/* Scrollable City Cards */}
      <div className="relative overflow-hidden">
        {/* Gradient Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Animated Marquee */}
        <div className="flex">
          <motion.div 
            className="flex gap-4 md:gap-5"
            animate={{ x: [0, -2200] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 50,
                ease: "linear",
              },
            }}
          >
            {/* First set */}
            {cities.map((city, index) => (
              <CityCard 
                key={`first-${index}`} 
                city={city} 
                language={language}
                onClick={() => handleCityClick(city)}
                priority={index < 3} // First 3 visible cards get priority
              />
            ))}
            {/* Duplicate set for seamless loop */}
            {cities.map((city, index) => (
              <CityCard 
                key={`second-${index}`} 
                city={city} 
                language={language}
                onClick={() => handleCityClick(city)}
                priority={false}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile View All Button */}
      <div className="container px-4 mt-6 md:hidden">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/destinations')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary font-medium"
        >
          {language === 'TR' ? 'Tüm Destinasyonları Gör' : 'View All Destinations'}
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
};

// City Card Component with Dynamic Image Loading
interface CityCardProps {
  city: CityType;
  language: string;
  onClick: () => void;
  priority?: boolean;
}

const CityCard = memo(({ city, language, onClick, priority = false }: CityCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Dynamic import for image - only load when component mounts
  useEffect(() => {
    let mounted = true;
    
    city.imagePath().then((module) => {
      if (mounted) {
        setImageSrc(module.default);
      }
    }).catch(() => {
      if (mounted) {
        setImageError(true);
      }
    });

    return () => { mounted = false; };
  }, [city]);

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative flex-shrink-0 w-48 md:w-56 cursor-pointer group"
    >
      {/* Card */}
      <div className="relative h-64 md:h-72 rounded-2xl overflow-hidden shadow-lg bg-muted">
        {/* Gradient Background - Always visible as fallback */}
        <div className={`absolute inset-0 bg-gradient-to-br ${city.gradient}`} />
        
        {/* Skeleton Loading State */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 w-full h-full z-10 bg-gradient-to-r from-muted via-muted/80 to-muted animate-pulse" />
        )}
        
        {/* Real Image - Dynamically loaded with srcset */}
        {imageSrc && !imageError && (
          <img
            src={imageSrc}
            alt={city.name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            width={224}
            height={288}
            sizes="(max-width: 768px) 192px, 224px"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 z-20 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } group-hover:scale-110`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Gradient Overlay - Always on top of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-30" />
        
        {/* Popular Badge */}
        {city.popular && (
          <div className="absolute top-3 left-3 z-40">
            <div className="flex items-center gap-1 bg-yellow-500 text-yellow-950 rounded-full px-2.5 py-1 text-xs font-bold shadow-lg">
              <Star className="h-3 w-3 fill-current" />
              {language === 'TR' ? 'Popüler' : 'Popular'}
            </div>
          </div>
        )}
        
        {/* Airport Badge */}
        <div className="absolute top-3 right-3 z-40">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white rounded-full px-2.5 py-1 text-xs font-medium">
            <Plane className="h-3 w-3" />
            {city.airports.join(", ")}
          </div>
        </div>
        
        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-4 z-40">
          {/* City Name */}
          <h3 className="text-xl md:text-2xl font-bold text-white mb-1 drop-shadow-lg">
            {language === 'TR' ? city.nameTR : city.name}
          </h3>
          
          {/* Rating & Price Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-white/90 text-sm font-medium">{city.rating}</span>
            </div>
            
            <div className="text-right">
              <span className="text-white/70 text-[10px] uppercase tracking-wide block">
                {language === 'TR' ? 'Başlangıç' : 'From'}
              </span>
              <span className="text-white font-bold text-lg">
                €{city.fromPrice}
              </span>
            </div>
          </div>
        </div>
        
        {/* Hover Arrow */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ArrowRight className="h-4 w-4 text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
});

CityCard.displayName = 'CityCard';

export default CityMarquee;
