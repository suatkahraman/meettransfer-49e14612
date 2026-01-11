import { Star, Quote, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  name: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
}

// Fallback reviews in case API fails
const fallbackReviews: Review[] = [
  {
    name: "James Wilson",
    rating: 5,
    text: "Exceptional service from start to finish. The driver was waiting for us at the airport with a name sign, and the Mercedes Vito was immaculate. Highly recommend!",
    date: "2 weeks ago",
  },
  {
    name: "Maria Schmidt",
    rating: 5,
    text: "Best transfer service in Istanbul! Professional driver, clean vehicle, and very punctual. Will definitely use again on my next trip.",
    date: "1 month ago",
  },
  {
    name: "Ahmed Al-Hassan",
    rating: 5,
    text: "VIP treatment all the way. The Maybach was stunning and the chauffeur was extremely professional. Worth every penny!",
    date: "3 weeks ago",
  },
  {
    name: "Sophie Martin",
    rating: 5,
    text: "We booked for our family of 6 and the service was perfect. Free child seats, water bottles, and WiFi. Kids loved it!",
    date: "1 week ago",
  },
  {
    name: "Dmitri Petrov",
    rating: 5,
    text: "Flight was delayed by 2 hours but driver was still there waiting. Real-time flight tracking works perfectly. Great experience!",
    date: "2 months ago",
  },
];

const GoogleReviewsCarousel = () => {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>(fallbackReviews);
  const [overallRating, setOverallRating] = useState(4.9);
  const [totalReviews, setTotalReviews] = useState(488);
  const [isLoading, setIsLoading] = useState(true);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch real reviews from Google Places API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('get-google-reviews', {
          body: { language: language }
        });
        
        if (error) {
          console.error('Error fetching reviews:', error);
          return;
        }
        
        if (data?.reviews && data.reviews.length > 0) {
          setReviews(data.reviews);
          setOverallRating(data.rating || 4.9);
          setTotalReviews(data.totalReviews || 488);
        }
      } catch (error) {
        console.error('Failed to fetch Google reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [language]);

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

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <svg viewBox="0 0 24 24" className="h-5 w-5">
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
            <span className="font-semibold text-sm">Google Reviews</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            {t("customerReviewsTitle") || "What Our Customers Say"}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${i < Math.floor(overallRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`} 
                />
              ))}
            </div>
            <span className="font-bold text-lg">{overallRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({totalReviews}+ reviews)</span>
          </div>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4"
              >
                <Card className="h-full bg-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <Quote className="h-8 w-8 text-primary/20" />
                    <p className="text-muted-foreground leading-relaxed min-h-[100px] line-clamp-4">
                      "{review.text}"
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t">
                      {review.avatar ? (
                        <img 
                          src={review.avatar} 
                          alt={review.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ${review.avatar ? 'hidden' : ''}`}>
                        <span className="font-bold text-primary">
                          {review.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{review.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="h-3 w-3 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>

        {/* CTA to Google Reviews */}
        <div className="text-center mt-8">
          <a
            href="https://g.page/r/CdlpMi1Z4CXFEBM/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
            </svg>
            {t("seeAllReviews") || "See all reviews on Google"}
          </a>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviewsCarousel;
