import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Briefcase, Wifi, Baby, Star, Check, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Vehicle images
import vitoImg from "@/assets/vito-1.jpg";
import vitoVipImg from "@/assets/vito-vip-1.jpg";
import maybachImg from "@/assets/maybach-1.jpg";
import sprinterImg from "@/assets/sprinter-1.jpg";

interface VehicleComparisonProps {
  cityName?: string;
  basePrice?: number;
}

const VehicleComparison = ({ cityName = "", basePrice = 45 }: VehicleComparisonProps) => {
  const { t, language, getLocalizedPath } = useLanguage();
  const isTR = language?.toLowerCase() === "tr";

  const vehicles = [
    {
      id: "economy",
      name: isTR ? "Ekonomi" : "Economy",
      subtitle: "Skoda Octavia / Toyota Prius",
      image: vitoImg,
      passengers: 3,
      luggage: 3,
      priceMultiplier: 0.8,
      features: [
        { key: "ac", label: isTR ? "Klima" : "Air Conditioning", included: true },
        { key: "usb", label: "USB", included: true },
        { key: "wifi", label: "WiFi", included: false },
        { key: "water", label: isTR ? "İkram" : "Refreshments", included: false },
        { key: "meet", label: isTR ? "Karşılama" : "Meet & Greet", included: true },
      ],
      popular: false,
    },
    {
      id: "business",
      name: "Business",
      subtitle: "Mercedes E-Class / BMW 5",
      image: vitoVipImg,
      passengers: 3,
      luggage: 3,
      priceMultiplier: 1.2,
      features: [
        { key: "ac", label: isTR ? "Klima" : "Air Conditioning", included: true },
        { key: "usb", label: "USB", included: true },
        { key: "wifi", label: "WiFi", included: true },
        { key: "water", label: isTR ? "İkram" : "Refreshments", included: true },
        { key: "meet", label: isTR ? "Karşılama" : "Meet & Greet", included: true },
      ],
      popular: false,
    },
    {
      id: "van-standard",
      name: isTR ? "Van Standart" : "Van Standard",
      subtitle: "Mercedes Vito",
      image: vitoImg,
      passengers: 7,
      luggage: 7,
      priceMultiplier: 1.0,
      features: [
        { key: "ac", label: isTR ? "Klima" : "Air Conditioning", included: true },
        { key: "usb", label: "USB", included: true },
        { key: "wifi", label: "WiFi", included: false },
        { key: "water", label: isTR ? "İkram" : "Refreshments", included: true },
        { key: "meet", label: isTR ? "Karşılama" : "Meet & Greet", included: true },
      ],
      popular: true,
    },
    {
      id: "van-vip",
      name: "Van VIP",
      subtitle: "Mercedes V-Class VIP",
      image: vitoVipImg,
      passengers: 6,
      luggage: 6,
      priceMultiplier: 1.5,
      features: [
        { key: "ac", label: isTR ? "Klima" : "Air Conditioning", included: true },
        { key: "usb", label: "USB", included: true },
        { key: "wifi", label: "WiFi", included: true },
        { key: "water", label: isTR ? "İkram" : "Refreshments", included: true },
        { key: "meet", label: isTR ? "Karşılama" : "Meet & Greet", included: true },
        { key: "tv", label: "TV", included: true },
      ],
      popular: true,
    },
    {
      id: "first-class",
      name: "First Class",
      subtitle: "Mercedes Maybach S-Class",
      image: maybachImg,
      passengers: 3,
      luggage: 3,
      priceMultiplier: 3.0,
      features: [
        { key: "ac", label: isTR ? "Klima" : "Air Conditioning", included: true },
        { key: "usb", label: "USB", included: true },
        { key: "wifi", label: "WiFi", included: true },
        { key: "water", label: isTR ? "Şampanya" : "Champagne", included: true },
        { key: "meet", label: isTR ? "Karşılama" : "Meet & Greet", included: true },
        { key: "tv", label: "TV", included: true },
        { key: "starlight", label: "Starlight Roof", included: true },
      ],
      popular: false,
    },
    {
      id: "minibus",
      name: isTR ? "Minibüs" : "Minibus",
      subtitle: "Mercedes Sprinter VIP",
      image: sprinterImg,
      passengers: 12,
      luggage: 12,
      priceMultiplier: 2.0,
      features: [
        { key: "ac", label: isTR ? "Klima" : "Air Conditioning", included: true },
        { key: "usb", label: "USB", included: true },
        { key: "wifi", label: "WiFi", included: true },
        { key: "water", label: isTR ? "İkram" : "Refreshments", included: true },
        { key: "meet", label: isTR ? "Karşılama" : "Meet & Greet", included: true },
        { key: "tv", label: "TV", included: true },
      ],
      popular: false,
    },
  ];

  return (
    <section className="py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
        >
          <Sparkles className="h-4 w-4" />
          {isTR ? "Araç Seçenekleri" : "Vehicle Options"}
        </motion.div>
        
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          {isTR ? "Araç Karşılaştırma" : "Compare Vehicles"}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {isTR 
            ? `${cityName} transferiniz için en uygun aracı seçin` 
            : `Choose the perfect vehicle for your ${cityName} transfer`}
        </p>
      </motion.div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            <div className={`relative bg-card rounded-2xl border overflow-hidden transition-all duration-300 h-full ${
              vehicle.popular ? "border-primary shadow-lg" : "hover:border-primary/50 hover:shadow-md"
            }`}>
              {/* Popular Badge */}
              {vehicle.popular && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="flex items-center gap-1 bg-yellow-500 text-yellow-950 rounded-full px-2.5 py-1 text-xs font-bold">
                    <Star className="h-3 w-3 fill-current" />
                    {isTR ? "Popüler" : "Popular"}
                  </span>
                </div>
              )}

              {/* Vehicle Image */}
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Name & Subtitle */}
                <h3 className="text-lg font-bold mb-1">{vehicle.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{vehicle.subtitle}</p>

                {/* Capacity */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{vehicle.passengers} {isTR ? "Yolcu" : "Pax"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{vehicle.luggage} {isTR ? "Bavul" : "Bags"}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-5">
                  {vehicle.features.slice(0, 5).map((feature) => (
                    <div key={feature.key} className="flex items-center gap-2">
                      <Check className={`h-4 w-4 ${feature.included ? "text-green-500" : "text-muted-foreground/30"}`} />
                      <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <span className="text-xs text-muted-foreground">{isTR ? "Başlangıç" : "From"}</span>
                    <div className="text-2xl font-bold text-primary">
                      €{Math.round(basePrice * vehicle.priceMultiplier)}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Button asChild className="w-full" variant={vehicle.popular ? "default" : "outline"}>
                  <Link to={getLocalizedPath("/book")} className="flex items-center justify-center gap-2">
                    {isTR ? "Şimdi Rezerve Et" : "Book Now"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Fleet Link */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mt-8"
      >
        <Link 
          to={getLocalizedPath("/fleet")}
          className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
        >
          {isTR ? "Tüm Filosu Görüntüle" : "View Full Fleet"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
};

export default VehicleComparison;
