import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Briefcase, ArrowRight, Star, Wifi, Baby, Shield } from "lucide-react";
import { useState } from "react";

// Import vehicle images
import vitoImg from "@/assets/vito-1.jpg";
import vitoVipImg from "@/assets/vito-vip-1.jpg";
import maybachImg from "@/assets/maybach-1.jpg";
import sprinterImg from "@/assets/sprinter-1.jpg";

const FleetIconsBar = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const isTR = language.toLowerCase() === "tr";

  const fleetItems = [
    {
      name: "Economy",
      nameTR: "Ekonomi",
      passengers: "3",
      luggage: "3",
      description: "Skoda Octavia, Toyota Prius",
      image: vitoImg,
      features: ["AC", "USB"],
      popular: false,
    },
    {
      name: "Business",
      nameTR: "Business",
      passengers: "3",
      luggage: "3",
      description: "Mercedes E-Class, BMW 5",
      image: vitoVipImg,
      features: ["AC", "WiFi", "Water"],
      popular: false,
    },
    {
      name: "Van Standard",
      nameTR: "Van Standart",
      passengers: "7",
      luggage: "7",
      description: "Mercedes Vito",
      image: vitoImg,
      features: ["AC", "USB", "Water"],
      popular: true,
    },
    {
      name: "Van VIP",
      nameTR: "Van VIP",
      passengers: "6",
      luggage: "6",
      description: "Mercedes V-Class VIP",
      image: vitoVipImg,
      features: ["WiFi", "TV", "Bar"],
      popular: true,
    },
    {
      name: "First Class",
      nameTR: "First Class",
      passengers: "3",
      luggage: "3",
      description: "Mercedes Maybach S-Class",
      image: maybachImg,
      features: ["WiFi", "TV", "Bar", "Starlight"],
      popular: false,
    },
    {
      name: "Minibus",
      nameTR: "Minibüs",
      passengers: "12",
      luggage: "12",
      description: "Mercedes Sprinter VIP",
      image: sprinterImg,
      features: ["AC", "WiFi", "TV"],
      popular: false,
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

        {/* Fleet Grid - Transfeero Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {fleetItems.map((item, index) => (
            <VehicleCard key={index} item={item} index={index} isTR={isTR} getLocalizedPath={getLocalizedPath} />
          ))}
        </div>

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
    image: string;
    features: string[];
    popular: boolean;
  };
  index: number;
  isTR: boolean;
  getLocalizedPath: (path: string) => string;
}

const VehicleCard = ({ item, index, isTR, getLocalizedPath }: VehicleCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
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

        {/* Vehicle Image - Transfeero Style */}
        <div className="relative h-28 md:h-32 bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
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
