import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { ArrowRight, Plane, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Import optimized WebP city images
import istanbulImg from "@/assets/destinations/istanbul-city.webp";
import antalyaImg from "@/assets/destinations/antalya-city.webp";
import bodrumImg from "@/assets/destinations/bodrum-city.webp";
import dalamanImg from "@/assets/destinations/dalaman-city.webp";
import izmirImg from "@/assets/destinations/izmir-city.webp";
import cappadociaImg from "@/assets/destinations/cappadocia-city.webp";
import dubaiImg from "@/assets/destinations/dubai-city.webp";
import cyprusImg from "@/assets/destinations/cyprus-city.webp";
import fethiyeImg from "@/assets/destinations/fethiye-city.webp";
import marmarisImg from "@/assets/destinations/marmaris-city.webp";
import frankfurtImg from "@/assets/destinations/frankfurt-city.webp";
import athensImg from "@/assets/destinations/athens-city.webp";

// Preload critical images for faster display
const preloadImages = (images: string[]) => {
  images.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

// Preload first 4 images immediately (visible in viewport)
if (typeof window !== 'undefined') {
  preloadImages([istanbulImg, antalyaImg, bodrumImg, dalamanImg]);
}

// City data with images and starting prices
const cities = [
  {
    name: "Istanbul",
    nameTR: "İstanbul",
    image: istanbulImg,
    fromPrice: 45,
    airports: ["IST", "SAW"],
    rating: 4.9,
    popular: true,
    gradient: "from-blue-600/60 to-purple-600/60",
  },
  {
    name: "Antalya",
    nameTR: "Antalya",
    image: antalyaImg,
    fromPrice: 35,
    airports: ["AYT"],
    rating: 4.9,
    popular: true,
    gradient: "from-amber-500/60 to-orange-600/60",
  },
  {
    name: "Bodrum",
    nameTR: "Bodrum",
    image: bodrumImg,
    fromPrice: 40,
    airports: ["BJV"],
    rating: 4.8,
    popular: true,
    gradient: "from-emerald-500/60 to-teal-600/60",
  },
  {
    name: "Dalaman",
    nameTR: "Dalaman",
    image: dalamanImg,
    fromPrice: 38,
    airports: ["DLM"],
    rating: 4.8,
    popular: false,
    gradient: "from-cyan-500/60 to-blue-600/60",
  },
  {
    name: "Izmir",
    nameTR: "İzmir",
    image: izmirImg,
    fromPrice: 42,
    airports: ["ADB"],
    rating: 4.7,
    popular: false,
    gradient: "from-indigo-500/60 to-blue-600/60",
  },
  {
    name: "Cappadocia",
    nameTR: "Kapadokya",
    image: cappadociaImg,
    fromPrice: 55,
    airports: ["NAV", "ASR"],
    rating: 4.9,
    popular: true,
    gradient: "from-violet-500/60 to-purple-600/60",
  },
  {
    name: "Dubai",
    nameTR: "Dubai",
    image: dubaiImg,
    fromPrice: 65,
    airports: ["DXB"],
    rating: 4.9,
    popular: true,
    gradient: "from-amber-500/60 to-yellow-600/60",
  },
  {
    name: "Cyprus",
    nameTR: "Kıbrıs",
    image: cyprusImg,
    fromPrice: 50,
    airports: ["LCA", "ECN"],
    rating: 4.8,
    popular: true,
    gradient: "from-green-500/60 to-emerald-600/60",
  },
  {
    name: "Fethiye",
    nameTR: "Fethiye",
    image: fethiyeImg,
    fromPrice: 45,
    airports: ["DLM"],
    rating: 4.8,
    popular: false,
    gradient: "from-sky-500/60 to-cyan-600/60",
  },
  {
    name: "Marmaris",
    nameTR: "Marmaris",
    image: marmarisImg,
    fromPrice: 48,
    airports: ["DLM"],
    rating: 4.7,
    popular: false,
    gradient: "from-rose-500/60 to-pink-600/60",
  },
  {
    name: "Frankfurt",
    nameTR: "Frankfurt",
    image: frankfurtImg,
    fromPrice: 55,
    airports: ["FRA"],
    rating: 4.9,
    popular: true,
    gradient: "from-slate-500/60 to-zinc-600/60",
  },
  {
    name: "Athens",
    nameTR: "Atina",
    image: athensImg,
    fromPrice: 45,
    airports: ["ATH"],
    rating: 4.9,
    popular: true,
    gradient: "from-blue-500/60 to-indigo-600/60",
  },
];

const CityMarquee = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleCityClick = (city: typeof cities[0]) => {
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
              />
            ))}
            {/* Duplicate set for seamless loop */}
            {cities.map((city, index) => (
              <CityCard 
                key={`second-${index}`} 
                city={city} 
                language={language}
                onClick={() => handleCityClick(city)}
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

// City Card Component with Real Images
interface CityCardProps {
  city: typeof cities[0];
  language: string;
  onClick: () => void;
}

const CityCard = memo(({ city, language, onClick }: CityCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Set image as loaded immediately since we're using imported modules
  useEffect(() => {
    // Since images are imported as ES modules, they're already bundled
    // Set loaded to true immediately as the src is a valid bundled asset
    if (city.image) {
      setImageLoaded(true);
    }
  }, [city.image]);

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative flex-shrink-0 w-48 md:w-56 cursor-pointer group"
    >
      {/* Card */}
      <div className="relative h-64 md:h-72 rounded-2xl overflow-hidden shadow-lg bg-muted">
        {/* Skeleton Loading State */}
        {!imageLoaded && !imageError && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        
        {/* Gradient Fallback Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${city.gradient} ${imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`} />
        
        {/* Real Image - Using imported bundled assets */}
        {!imageError && (
          <img
            src={city.image}
            alt={city.name}
            loading="eager"
            decoding="sync"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } group-hover:scale-110`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Popular Badge */}
        {city.popular && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1 bg-yellow-500 text-yellow-950 rounded-full px-2.5 py-1 text-xs font-bold shadow-lg">
              <Star className="h-3 w-3 fill-current" />
              {language === 'TR' ? 'Popüler' : 'Popular'}
            </div>
          </div>
        )}
        
        {/* Airport Badge */}
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white rounded-full px-2.5 py-1 text-xs font-medium">
            <Plane className="h-3 w-3" />
            {city.airports.join(", ")}
          </div>
        </div>
        
        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-4">
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
