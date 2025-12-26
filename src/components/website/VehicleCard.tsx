import { Users, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface VehicleCardProps {
  name: string;
  description: string;
  passengers: number;
  luggage: number;
  features?: string[];
  image?: string;
  images?: string[];
}

const VehicleCard = ({
  name,
  description,
  passengers,
  luggage,
  features = [],
  image,
  images: imagesProp,
}: VehicleCardProps) => {
  // Support both single image and multiple images
  const images = imagesProp || (image ? [image] : []);
  const { t } = useLanguage();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[4/3] bg-muted relative overflow-hidden group">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {images.map((image, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 h-full flex items-center justify-center bg-secondary/30">
                <img
                  src={image}
                  alt={`${name} - Image ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedIndex
                      ? "bg-primary w-4"
                      : "bg-white/60 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-accent" />
            <span>{passengers} {t("passengers")}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Briefcase className="h-4 w-4 text-accent" />
            <span>{luggage} {t("luggage")}</span>
          </div>
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <span
                key={feature}
                className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleCard;
