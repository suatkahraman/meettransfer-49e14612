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
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
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
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
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
          <div className="space-y-6">
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

          {/* Video */}
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
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
                  src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
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
                  alt="Meet Transfer VIP Service Video Thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="group w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                    aria-label="Play video"
                  >
                    <Play className="h-8 w-8 text-primary-foreground ml-1" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-semibold text-lg">
                    {t("watchPromoVideo") || "Watch Our Promo Video"}
                  </p>
                  <p className="text-white/80 text-sm">2:30 min</p>
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
