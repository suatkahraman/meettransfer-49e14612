import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import cappadociaTransfer from "@/assets/cappadocia-transfer.png";
import bodrumTransfer from "@/assets/bodrum-transfer.png";
import istanbulTransfer from "@/assets/istanbul-transfer.png";
import antalyaTransfer from "@/assets/antalya-transfer.png";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

const LazyImage = ({ src, alt, className }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img 
        src={isInView ? src : undefined}
        data-src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setIsLoaded(true)}
        ref={(el) => {
          if (el && !isInView) {
            const observer = new IntersectionObserver(
              ([entry]) => {
                if (entry.isIntersecting) {
                  setIsInView(true);
                  observer.disconnect();
                }
              },
              { rootMargin: '100px' }
            );
            observer.observe(el);
          }
        }}
      />
    </div>
  );
};

export const Destinations = () => {
  const { t, getLocalizedPath } = useLanguage();

  const destinations = [
    {
      routeKey: "istanbulHotels",
      airports: "IST / SAW",
      descKey: "istanbulDesc",
      image: istanbulTransfer,
    },
    {
      routeKey: "antalyaResorts",
      airports: "AYT",
      descKey: "antalyaDesc",
      image: antalyaTransfer,
    },
    {
      routeKey: "bodrumCity",
      airports: "BJV",
      descKey: "bodrumDesc",
      image: bodrumTransfer,
    },
    {
      routeKey: "cappadociaTours",
      airports: "NAV / ASR",
      descKey: "cappadociaDesc",
      image: cappadociaTransfer,
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">{t("topDestinations")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            {t("topDestinationsDesc")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((destination, index) => (
            <Card 
              key={index} 
              className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom-8" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <LazyImage 
                  src={destination.image} 
                  alt={t(destination.routeKey)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 text-white/90 text-xs mb-1">
                    <MapPin className="h-3 w-3" />
                    <span className="font-sans">{destination.airports}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{t(destination.routeKey)}</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">{t(destination.descKey)}</p>
                <Button asChild variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <Link to={getLocalizedPath("/book")}>
                    {t("bookNow")}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
