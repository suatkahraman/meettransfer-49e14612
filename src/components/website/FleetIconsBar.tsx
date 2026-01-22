import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Briefcase, ArrowRight, Star, Shield, ChevronLeft, ChevronRight, Snowflake } from "lucide-react";
import { useState, useEffect } from "react";

// Dynamic image paths - loaded lazily when fleet section comes into view
const vehicleImagePaths = {
  vito: () => import("@/assets/vehicles/vito-hero.webp"),
  vitoVip: () => import("@/assets/vehicles/vito-vip-hero.webp"),
  maybach: () => import("@/assets/vehicles/maybach-hero.webp"),
  sprinter: () => import("@/assets/vehicles/sprinter-hero.webp"),
  switzerlandSClassExterior: () => import("@/assets/switzerland/switzerland-s-class-exterior.webp"),
  switzerlandSClassInterior: () => import("@/assets/switzerland/switzerland-s-class-interior.webp"),
  switzerlandVClassExterior: () => import("@/assets/switzerland/switzerland-v-class-exterior.webp"),
  switzerlandVClassInterior: () => import("@/assets/switzerland/switzerland-v-class-interior.webp"),
};

// Placeholder for lazy-loaded images
const PLACEHOLDER_GRADIENT = "bg-gradient-to-br from-muted to-muted/50";

const FleetIconsBar = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const isTR = language?.toLowerCase() === "tr";

  const fleetItems = [
    {
      name: "Economy",
      nameTR: "Ekonomi",
      passengers: "3",
      luggage: "3",
      description: "Skoda Octavia, Toyota Prius",
      imagePaths: [vehicleImagePaths.vito],
      features: ["AC", "USB"],
      popular: false,
      badge: null,
    },
    {
      name: "Business",
      nameTR: "Business",
      passengers: "3",
      luggage: "3",
      description: "Mercedes E-Class, BMW 5",
      imagePaths: [vehicleImagePaths.vitoVip],
      features: ["AC", "WiFi", "Water"],
      popular: false,
      badge: null,
    },
    {
      name: "Van Standard",
      nameTR: "Van Standart",
      passengers: "7",
      luggage: "7",
      description: "Mercedes Vito",
      imagePaths: [vehicleImagePaths.vito],
      features: ["AC", "USB", "Water"],
      popular: true,
      badge: null,
    },
    {
      name: "Van VIP",
      nameTR: "Van VIP",
      passengers: "6",
      luggage: "6",
      description: "VIP Mercedes Vito",
      imagePaths: [vehicleImagePaths.vitoVip],
      features: ["WiFi", "TV", "Bar"],
      popular: true,
      badge: null,
    },
    {
      name: "First Class",
      nameTR: "First Class",
      passengers: "4",
      luggage: "4",
      description: "Mercedes Maybach Minivan",
      imagePaths: [vehicleImagePaths.maybach],
      features: ["WiFi", "TV", "Bar", "Starlight"],
      popular: false,
      badge: null,
    },
    {
      name: "Minibus",
      nameTR: "Minibüs",
      passengers: "12",
      luggage: "12",
      description: "Mercedes Sprinter VIP",
      imagePaths: [vehicleImagePaths.sprinter],
      features: ["AC", "WiFi", "TV"],
      popular: false,
      badge: null,
    },
  ];

  // Switzerland exclusive fleet items
  const switzerlandFleetItems = [
    {
      name: "S-Class",
      nameTR: "S-Class",
      passengers: "3",
      luggage: "3",
      description: isTR ? "İsviçre Kayak Transferi" : "Swiss Ski Transfer",
      imagePaths: [vehicleImagePaths.switzerlandSClassExterior, vehicleImagePaths.switzerlandSClassInterior],
      features: ["Massage", "WiFi", "Climate"],
      popular: false,
      badge: "switzerland",
    },
    {
      name: "V-Class",
      nameTR: "V-Class",
      passengers: "7",
      luggage: "7",
      description: isTR ? "İsviçre Grup Transferi" : "Swiss Group Transfer",
      imagePaths: [vehicleImagePaths.switzerlandVClassExterior, vehicleImagePaths.switzerlandVClassInterior],
      features: ["Ski Storage", "WiFi", "Panoramic"],
      popular: false,
      badge: "switzerland",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            <Shield className="h-4 w-4" />
            {isTR ? "Lisanslı & Sigortalı" : "Licensed & Insured"}
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("maximumComfort") || "Maximum Comfort & Safety"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("licensedVehicles") || "Premium vehicles, professional chauffeurs for your journey"}
          </p>
        </motion.div>

        {/* Fleet Grid - Main Fleet */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {fleetItems.map((item, index) => (
            <VehicleCard key={index} item={item} index={index} isTR={isTR} getLocalizedPath={getLocalizedPath} />
          ))}
        </div>

        {/* Switzerland Fleet Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20">
              <Snowflake className="h-4 w-4 text-sky-500" />
              <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                {isTR ? "İsviçre Kayak Transferleri" : "Swiss Ski Transfers"}
              </span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {switzerlandFleetItems.map((item, index) => (
              <VehicleCard key={`ch-${index}`} item={item} index={index + 6} isTR={isTR} getLocalizedPath={getLocalizedPath} />
            ))}
          </div>
        </motion.div>

        {/* View Fleet CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link 
            to={getLocalizedPath("/fleet")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            {t("viewFullFleet") || "View Full Fleet"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

interface VehicleCardProps {
  item: {
    name: string;
    nameTR: string;
    passengers: string;
    luggage: string;
    description: string;
    imagePaths: (() => Promise<{ default: string }>)[];
    features: string[];
    popular: boolean;
    badge: string | null;
  };
  index: number;
  isTR: boolean;
  getLocalizedPath: (path: string) => string;
}

const CAROUSEL_INTERVAL = 4000; // 4 seconds - adjustable

const VehicleCard = ({ item, index, isTR, getLocalizedPath }: VehicleCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);

  // Dynamic image loading - only load images when component mounts
  useEffect(() => {
    let mounted = true;
    
    Promise.all(
      item.imagePaths.map(loader => loader().then(m => m.default))
    ).then(images => {
      if (mounted) {
        setLoadedImages(images);
      }
    }).catch(() => {
      // Silent fail - gradient fallback will show
    });

    return () => { mounted = false; };
  }, [item.imagePaths]);

  // Auto-rotate images
  useEffect(() => {
    if (loadedImages.length <= 1 || isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % loadedImages.length);
    }, CAROUSEL_INTERVAL + index * 300); // Stagger timing

    return () => clearInterval(timer);
  }, [loadedImages.length, index, isPaused]);

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + loadedImages.length) % loadedImages.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000); // Resume auto-play after 5s
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % loadedImages.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={getLocalizedPath("/fleet")}
        className="group block bg-card rounded-2xl border hover:border-primary/30 hover:shadow-xl transition-all duration-300 h-full overflow-hidden relative"
      >
        {/* Popular Badge */}
        {item.popular && (
          <div className="absolute top-2 right-2 z-10">
            <span className="flex items-center gap-1 bg-yellow-500 text-yellow-950 rounded-full px-2 py-0.5 text-[10px] font-bold">
              <Star className="h-2.5 w-2.5 fill-current" />
              {isTR ? "Popüler" : "Popular"}
            </span>
          </div>
        )}

        {/* Switzerland Badge */}
        {item.badge === "switzerland" && (
          <div className="absolute top-2 right-2 z-10">
            <span className="flex items-center gap-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full px-2 py-0.5 text-[10px] font-bold shadow-lg">
              <Snowflake className="h-2.5 w-2.5" />
              {isTR ? "İsviçre" : "Swiss"}
            </span>
          </div>
        )}

        {/* Vehicle Image - Carousel Style with Dynamic Loading */}
        <div className="relative h-28 md:h-32 bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
          {loadedImages.map((image, imgIndex) => (
            <img
              key={imgIndex}
              src={image}
              alt={`${item.name} ${imgIndex + 1}`}
              loading="lazy"
              decoding="async"
              width={224}
              height={128}
              onLoad={() => imgIndex === 0 && setImageLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                imgIndex === currentImageIndex 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-105'
              } ${isHovered ? 'scale-110' : ''}`}
            />
          ))}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          
          {/* Loading skeleton */}
          {(!imageLoaded || loadedImages.length === 0) && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {/* Arrow Navigation - Show on hover */}
          {loadedImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className={`absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md transition-all duration-300 hover:bg-background hover:scale-110 z-10 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={goToNext}
                className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md transition-all duration-300 hover:bg-background hover:scale-110 z-10 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {/* Carousel Dots */}
          {loadedImages.length > 1 && (
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {loadedImages.map((_, imgIndex) => (
                <button
                  key={imgIndex}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentImageIndex(imgIndex);
                    setIsPaused(true);
                    setTimeout(() => setIsPaused(false), 5000);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    imgIndex === currentImageIndex 
                      ? "bg-primary w-3" 
                      : "bg-white/50 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name */}
          <h3 className="font-bold text-foreground mb-1 text-center group-hover:text-primary transition-colors text-sm md:text-base">
            {isTR ? item.nameTR : item.name}
          </h3>

          {/* Description */}
          <p className="text-[10px] md:text-xs text-muted-foreground text-center mb-3 line-clamp-1">
            {item.description}
          </p>

          {/* Capacity Row */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{item.passengers}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{item.luggage}</span>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-1">
            {item.features.slice(0, 3).map((feature, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 bg-muted rounded-full text-[10px] font-medium text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default FleetIconsBar;
