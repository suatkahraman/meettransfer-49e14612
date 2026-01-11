import { useState } from "react";
import { Play, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface VideoPromoProps {
  variant?: "hero" | "section";
}

// YouTube video ID - Meet Transfer promo video (Shorts format)
const YOUTUBE_VIDEO_ID = "bCt0pzE3HMA";

const VideoPromo = ({ variant = "section" }: VideoPromoProps) => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  if (variant === "hero") {
    return (
      <div className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-xl overflow-hidden shadow-2xl">
        {isPlaying ? (
          <div className="relative w-full h-full">
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close video"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=0&rel=0&playsinline=1`}
              title="Meet Transfer Promo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <>
            <img
              src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
              alt="Meet Transfer VIP Service Video"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(true)}
                className="group w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                aria-label="Play video"
              >
                <Play className="h-8 w-8 text-primary-foreground ml-1" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t("videoPromoTitle") || "Experience Luxury Travel"}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("videoPromoDesc") ||
                "Watch how we provide premium VIP transfer services across Turkey, Dubai, and Cyprus. From airport pickups to hotel transfers, see why thousands of travelers trust Meet Transfer."}
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <span>{t("videoPromoPoint1") || "Premium Mercedes Fleet"}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <span>{t("videoPromoPoint2") || "Professional Chauffeurs"}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <span>{t("videoPromoPoint3") || "Door-to-Door Service"}</span>
              </li>
            </ul>
          </div>

          {/* Video - Shorts Format (9:16 aspect ratio) */}
          <div className="relative max-w-xs mx-auto lg:mx-0 lg:ml-auto aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl order-1 lg:order-2">
            {isPlaying ? (
              <div className="relative w-full h-full">
                <button
                  onClick={() => setIsPlaying(false)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Close video"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
                <iframe
                  src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=0&rel=0&playsinline=1`}
                  title="Meet Transfer Promo Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <>
                <img
                  src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/sddefault.jpg`}
                  alt="Meet Transfer VIP Service Video Thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="group w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all hover:scale-110 shadow-lg backdrop-blur-sm"
                    aria-label="Play video"
                  >
                    <Play className="h-8 w-8 text-primary-foreground ml-1" />
                  </button>
                </div>
                {/* YouTube Shorts style badge */}
                <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-sm flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.77 10.32c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25zm-.23 5.86l-8.5 4.5c-1.34.71-3.01.2-3.72-1.14-.71-1.34-.2-3.01 1.14-3.72l2.04-1.08v-1.21l-.69-.28-1.11-.46c-.99-.41-1.65-1.35-1.7-2.41-.05-1.06.52-2.06 1.46-2.56l8.5-4.5c1.34-.71 3.01-.2 3.72 1.14.71 1.34.2 3.01-1.14 3.72L15.5 9.26v1.21l1.8.74c.99.41 1.65 1.35 1.7 2.41.05 1.06-.52 2.06-1.46 2.56z"/>
                  </svg>
                  Shorts
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-semibold text-base">
                    {t("watchPromoVideo") || "Watch Our Promo Video"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoPromo;
