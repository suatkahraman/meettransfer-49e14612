import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEFAULT_RATING, DEFAULT_TOTAL_REVIEWS } from "@/constants/ratings";

export function useGoogleReviewStats() {
  const { language } = useLanguage();
  const [rating, setRating] = useState<number>(DEFAULT_RATING);
  const [totalReviews, setTotalReviews] = useState<number>(DEFAULT_TOTAL_REVIEWS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke("get-google-reviews", {
          body: { language },
        });

        if (error) return;

        const nextRating = Number(data?.rating);
        const nextTotal = Number(data?.totalReviews);

        if (!cancelled) {
          if (Number.isFinite(nextRating) && nextRating > 0) setRating(nextRating);
          if (Number.isFinite(nextTotal) && nextTotal > 0) setTotalReviews(nextTotal);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [language]);

  return { rating, totalReviews, isLoading };
}
