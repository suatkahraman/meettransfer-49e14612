import { Star } from "lucide-react";
import { useMemo, useEffect, useRef, useState } from "react";
import { useGoogleReviewStats } from "@/hooks/useGoogleReviewStats";
import { PLATFORM_RATINGS } from "@/constants/ratings";

type Platform = {
  name: string;
  logo: React.ReactNode;
  rating: string;
  reviews: string;
  url: string | null;
  color: string;
};

const staticPlatforms: Omit<Platform, "rating" | "reviews">[] = [
  {
    name: "Tripadvisor",
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <circle fill="#34E0A1" cx="12" cy="12" r="12" />
        <circle fill="#000" cx="8" cy="11" r="3" />
        <circle fill="#fff" cx="8" cy="11" r="1.5" />
        <circle fill="#000" cx="16" cy="11" r="3" />
        <circle fill="#fff" cx="16" cy="11" r="1.5" />
        <path
          fill="#000"
          d="M12 6c-2.5 0-4.5 1-5.5 2h11c-1-1-3-2-5.5-2z"
        />
      </svg>
    ),
    url: "https://www.tripadvisor.com/Attraction_Review-g293974-d9884368-Reviews-Meet_Transfer-Istanbul.html",
    color: "hover:bg-green-50 dark:hover:bg-green-950",
  },
  {
    name: "App Store",
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#000">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    url: null,
    color: "hover:bg-gray-100 dark:hover:bg-gray-800",
  },
  {
    name: "Google Play",
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path
          fill="#EA4335"
          d="M3.18 3.12l8.91 8.88-8.91 8.88c-.37-.37-.6-.88-.6-1.47V4.59c0-.59.23-1.1.6-1.47z"
        />
        <path
          fill="#FBBC04"
          d="M16.85 7.57l-4.76 4.43 4.76 4.43 3.62-2.12c.82-.48.82-1.66 0-2.14l-3.62-2.6z"
        />
        <path fill="#4285F4" d="M3.18 3.12L12.09 12l-8.91 8.88" />
        <path
          fill="#34A853"
          d="M3.18 20.88l9.91-9.88L16.85 14l-8.91 8.88c-.37.37-.88.6-1.47.6-.59 0-1.1-.23-1.29-.6z"
        />
      </svg>
    ),
    url: null,
    color: "hover:bg-green-50 dark:hover:bg-green-950",
  },
  {
    name: "Trustpilot",
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <rect fill="#00B67A" width="24" height="24" rx="4" />
        <path
          fill="#fff"
          d="M12 4l2.35 7.24H22l-6.18 4.49 2.36 7.27L12 18.51 5.82 23l2.36-7.27L2 11.24h7.65z"
        />
        <path fill="#005128" d="M16.18 15.73l-.94-2.9L12 15.73z" />
      </svg>
    ),
    url: "https://www.trustpilot.com/review/meettransfer.app",
    color: "hover:bg-emerald-50 dark:hover:bg-emerald-950",
  },
];

const ReviewPlatformLogos = () => {
  const { rating, totalReviews } = useGoogleReviewStats();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // IntersectionObserver for viewport animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const platforms: Platform[] = useMemo(
    () => [
      {
        name: "Google",
        logo: (
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        ),
        rating: rating.toFixed(1),
        reviews: `${totalReviews.toLocaleString()}+`,
        url: "https://g.page/r/Ccr28aszxPk0EAE/review",
        color: "hover:bg-blue-50 dark:hover:bg-blue-950",
      },
      ...staticPlatforms.map((p) => {
        // Platform-specific ratings (these are verified independently per platform)
        if (p.name === "Tripadvisor") return { ...p, rating: PLATFORM_RATINGS.tripadvisor.rating.toFixed(1), reviews: `${PLATFORM_RATINGS.tripadvisor.reviews}+` };
        if (p.name === "App Store") return { ...p, rating: PLATFORM_RATINGS.appStore.rating.toFixed(1), reviews: `${PLATFORM_RATINGS.appStore.reviews.toLocaleString()}+` };
        if (p.name === "Google Play") return { ...p, rating: PLATFORM_RATINGS.googlePlay.rating.toFixed(1), reviews: `${PLATFORM_RATINGS.googlePlay.reviews.toLocaleString()}+` };
        if (p.name === "Trustpilot") return { ...p, rating: PLATFORM_RATINGS.trustpilot.rating.toFixed(1), reviews: `${PLATFORM_RATINGS.trustpilot.reviews}+` };
        return { ...p, rating: rating.toFixed(1), reviews: "" };
      }),
    ],
    [rating, totalReviews]
  );

  const renderPlatformContent = (platform: Platform) => (
    <>
      {platform.logo}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="font-bold text-sm text-foreground">{platform.rating}</span>
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        </div>
        <span className="text-[10px] text-muted-foreground">{platform.reviews}</span>
      </div>
    </>
  );

  return (
    <section ref={sectionRef} className="py-8 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
          {platforms.map((platform, index) => (
            <div
              key={platform.name}
              className={`transition-all duration-500 ${
                isVisible 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {platform.url ? (
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card ${platform.color} transition-colors cursor-pointer`}
                >
                  {renderPlatformContent(platform)}
                </a>
              ) : (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card ${platform.color} transition-colors cursor-default`}
                >
                  {renderPlatformContent(platform)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewPlatformLogos;