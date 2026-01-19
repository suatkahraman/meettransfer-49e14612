import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_RATING, DEFAULT_TOTAL_REVIEWS } from "@/constants/ratings";

// Global cache to prevent multiple API calls from different components
let globalCache: { rating: number; totalReviews: number; timestamp: number } | null = null;
let inFlight: Promise<{ rating: number; totalReviews: number } | null> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useGoogleReviewStats() {
  const [rating, setRating] = useState<number>(() => globalCache?.rating ?? DEFAULT_RATING);
  const [totalReviews, setTotalReviews] = useState<number>(() => globalCache?.totalReviews ?? DEFAULT_TOTAL_REVIEWS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Skip if already fetched in this component instance
    if (fetchedRef.current) return;

    // Check cache validity
    if (globalCache && Date.now() - globalCache.timestamp < CACHE_DURATION) {
      setRating(globalCache.rating);
      setTotalReviews(globalCache.totalReviews);
      return;
    }

    let cancelled = false;
    fetchedRef.current = true;

    const fetchOnce = async (): Promise<{ rating: number; totalReviews: number } | null> => {
      try {
        // Get language from document
        const docLang = document.documentElement.lang?.toUpperCase() || "EN";

        const { data, error } = await supabase.functions.invoke("get-google-reviews", {
          body: { language: docLang },
        });

        if (error) return null;

        const nextRating = Number(data?.rating);
        const nextTotal = Number(data?.totalReviews);

        if (!Number.isFinite(nextRating) || nextRating <= 0) return null;

        return {
          rating: nextRating,
          totalReviews: Number.isFinite(nextTotal) && nextTotal > 0 ? nextTotal : DEFAULT_TOTAL_REVIEWS,
        };
      } catch {
        return null;
      }
    };

    const run = async () => {
      try {
        setIsLoading(true);

        if (!inFlight) {
          inFlight = fetchOnce();
        }

        const local = inFlight;
        const result = await local;
        if (inFlight === local) inFlight = null;

        if (cancelled || !result) return;

        setRating(result.rating);
        setTotalReviews(result.totalReviews);

        // Update global cache
        globalCache = {
          rating: result.rating,
          totalReviews: result.totalReviews,
          timestamp: Date.now(),
        };
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    // Defer the network call so it doesn't compete with the hero/LCP resources
    const start = () => {
      void run();
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => start(), { timeout: 2500 });
    } else {
      setTimeout(start, 1200);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return { rating, totalReviews, isLoading };
}

