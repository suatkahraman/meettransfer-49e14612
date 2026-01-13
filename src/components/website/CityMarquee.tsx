import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Plane, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

// City data with images and starting prices
const cities = [
  {
    name: "Istanbul",
    nameTR: "İstanbul",
    image: "/placeholder.svg",
    fromPrice: 45,
    airports: ["IST", "SAW"],
    rating: 4.9,
    popular: true,
  },
  {
    name: "Antalya",
    nameTR: "Antalya",
    image: "/placeholder.svg",
    fromPrice: 35,
    airports: ["AYT"],
    rating: 4.9,
    popular: true,
  },
  {
    name: "Bodrum",
    nameTR: "Bodrum",
    image: "/placeholder.svg",
    fromPrice: 40,
    airports: ["BJV"],
    rating: 4.8,
    popular: true,
  },
  {
    name: "Dalaman",
    nameTR: "Dalaman",
    image: "/placeholder.svg",
    fromPrice: 38,
    airports: ["DLM"],
    rating: 4.8,
    popular: false,
  },
  {
    name: "Izmir",
    nameTR: "İzmir",
    image: "/placeholder.svg",
    fromPrice: 42,
    airports: ["ADB"],
    rating: 4.7,
    popular: false,
  },
  {
    name: "Cappadocia",
    nameTR: "Kapadokya",
    image: "/placeholder.svg",
    fromPrice: 55,
    airports: ["NAV", "ASR"],
    rating: 4.9,
    popular: true,
  },
  {
    name: "Dubai",
    nameTR: "Dubai",
    image: "/placeholder.svg",
    fromPrice: 65,
    airports: ["DXB"],
    rating: 4.9,
    popular: true,
  },
  {
    name: "Cyprus",
    nameTR: "Kıbrıs",
    image: "/placeholder.svg",
    fromPrice: 50,
    airports: ["LCA", "ECN"],
    rating: 4.8,
    popular: true,
  },
  {
    name: "Fethiye",
    nameTR: "Fethiye",
    image: "/placeholder.svg",
    fromPrice: 45,
    airports: ["DLM"],
    rating: 4.8,
    popular: false,
  },
  {
    name: "Marmaris",
    nameTR: "Marmaris",
    image: "/placeholder.svg",
    fromPrice: 48,
    airports: ["DLM"],
    rating: 4.7,
    popular: false,
  },
];

const CityMarquee = () => {
  const { t, language } = useLanguage();
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
        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Animated Marquee */}
        <div className="flex">
          <motion.div 
            className="flex gap-4 md:gap-6"
            animate={{ x: [0, -1920] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 40,
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
                index={index}
              />
            ))}
            {/* Duplicate set for seamless loop */}
            {cities.map((city, index) => (
              <CityCard 
                key={`second-${index}`} 
                city={city} 
                language={language}
                onClick={() => handleCityClick(city)}
                index={index}
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

// City Card Component
interface CityCardProps {
  city: typeof cities[0];
  language: string;
  onClick: () => void;
  index: number;
}

const CityCard = ({ city, language, onClick, index }: CityCardProps) => {
  // Generate gradient based on city name for visual variety
  const gradients = [
    "from-blue-600/80 to-purple-600/80",
    "from-amber-500/80 to-orange-600/80",
    "from-emerald-500/80 to-teal-600/80",
    "from-rose-500/80 to-pink-600/80",
    "from-indigo-500/80 to-blue-600/80",
    "from-cyan-500/80 to-blue-600/80",
    "from-violet-500/80 to-purple-600/80",
    "from-green-500/80 to-emerald-600/80",
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative flex-shrink-0 w-44 md:w-52 cursor-pointer group"
    >
      {/* Card */}
      <div className="relative h-56 md:h-64 rounded-2xl overflow-hidden shadow-lg">
        {/* Background Gradient (fallback for images) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id={`pattern-${index}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="white" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill={`url(#pattern-${index})`} />
          </svg>
        </div>
        
        {/* Popular Badge */}
        {city.popular && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1 bg-yellow-500 text-yellow-950 rounded-full px-2 py-0.5 text-[10px] font-bold">
              <Star className="h-2.5 w-2.5 fill-current" />
              {language === 'TR' ? 'Popüler' : 'Popular'}
            </div>
          </div>
        )}
        
        {/* Airport Badge */}
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white rounded-full px-2 py-0.5 text-[10px] font-medium">
            <Plane className="h-2.5 w-2.5" />
            {city.airports.join(", ")}
          </div>
        </div>
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          {/* City Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
            <MapPin className="h-20 w-20 text-white" />
          </div>
          
          {/* City Name */}
          <h3 className="text-xl md:text-2xl font-bold text-white mb-1 drop-shadow-lg">
            {language === 'TR' ? city.nameTR : city.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-white/90 text-xs font-medium">{city.rating}</span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white/70 text-[10px] uppercase tracking-wide">
                {language === 'TR' ? 'Başlangıç' : 'From'}
              </span>
              <div className="text-white font-bold text-lg">
                €{city.fromPrice}
              </div>
            </div>
            
            {/* Arrow */}
            <motion.div
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors"
            >
              <ArrowRight className="h-4 w-4 text-white" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CityMarquee;
