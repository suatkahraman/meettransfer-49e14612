import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "video" | "square" | "portrait" | "wide" | "auto";
  priority?: boolean;
  overlay?: React.ReactNode;
  caption?: string;
}

const OptimizedImage = ({
  src,
  alt,
  className,
  aspectRatio = "auto",
  priority = false,
  overlay,
  caption,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
    auto: "",
  };

  return (
    <figure ref={imgRef} className="relative">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-muted",
          aspectClasses[aspectRatio],
          className
        )}
      >
        {/* Skeleton placeholder */}
        {!isLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
        )}

        {/* Image */}
        {isInView && (
          <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Overlay */}
        {overlay && isLoaded && (
          <div className="absolute inset-0">{overlay}</div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default OptimizedImage;
