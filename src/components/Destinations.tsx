import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Plane } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { OptimizedImage } from "@/components/ui/optimized-image";
import cappadociaTransfer from "@/assets/cappadocia-transfer.webp";
import bodrumTransfer from "@/assets/bodrum-transfer.webp";
import istanbulTransfer from "@/assets/istanbul-transfer.webp";
import antalyaTransfer from "@/assets/antalya-transfer.webp";
import bursaTransfer from "@/assets/bursa-transfer.webp";

export const Destinations = () => {
  const { t, getLocalizedPath } = useLanguage();

  const destinations = [
    {
      routeKey: "istanbulHotels",
      airports: "IST / SAW",
      descKey: "istanbulDesc",
      image: istanbulTransfer,
      link: "/istanbul-airport-transfer",
      featured: true,
    },
    {
      routeKey: "antalyaResorts",
      airports: "AYT",
      descKey: "antalyaDesc",
      image: antalyaTransfer,
      link: "/antalya-airport-transfer",
    },
    {
      routeKey: "bodrumCity",
      airports: "BJV",
      descKey: "bodrumDesc",
      image: bodrumTransfer,
      link: "/bodrum-airport-transfer",
    },
    {
      routeKey: "cappadociaTours",
      airports: "NAV / ASR",
      descKey: "cappadociaDesc",
      image: cappadociaTransfer,
      link: "/cappadocia-airport-transfer",
    },
    {
      routeKey: "bursaTours",
      airports: "IST / SAW",
      descKey: "bursaDesc",
      image: bursaTransfer,
      link: "/bursa-transfer",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Professional Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full mb-6">
            <Plane className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {t("popularRoutes") || "Popular Routes"}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("topDestinations")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("topDestinationsDesc")}
          </p>
        </motion.div>

        {/* Destinations Grid - Professional Transfeero Style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {destinations.map((destination, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group ${index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}
            >
              <Link 
                to={getLocalizedPath(destination.link)}
                className="block h-full"
              >
                <div className={`relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl h-full ${index === 0 ? 'min-h-[400px] lg:min-h-[500px]' : 'min-h-[280px]'}`}>
                  {/* Image with optimization */}
                  <div className="absolute inset-0">
                    <OptimizedImage 
                      src={destination.image} 
                      alt={t(destination.routeKey)}
                      className="group-hover:scale-105 transition-transform duration-700"
                      priority={index === 0}
                      sizes={index === 0 ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  </div>
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    {/* Airport Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full w-fit mb-3 border border-white/20">
                      <MapPin className="h-3.5 w-3.5 text-white" />
                      <span className="text-xs font-semibold text-white tracking-wide">
                        {destination.airports}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h3 className={`font-bold text-white mb-2 ${index === 0 ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                      {t(destination.routeKey)}
                    </h3>
                    
                    {/* Description */}
                    <p className={`text-white/80 mb-4 line-clamp-2 ${index === 0 ? 'text-base max-w-xl' : 'text-sm'}`}>
                      {t(destination.descKey)}
                    </p>
                    
                    {/* CTA Button */}
                    <div className="flex items-center gap-2 text-white font-medium group/btn">
                      <span className="border-b border-transparent group-hover/btn:border-white transition-all">
                        {t("bookNow")}
                      </span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Featured Badge for first item */}
                  {destination.featured && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      {t("popular") || "Popular"}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Destinations CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Button 
            asChild 
            size="lg"
            variant="outline"
            className="rounded-full px-8 border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
          >
            <Link to={getLocalizedPath("/destinations")}>
              {t("viewAllDestinations") || "View All Destinations"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};