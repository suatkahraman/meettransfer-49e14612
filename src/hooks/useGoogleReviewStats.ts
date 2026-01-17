import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_RATING, DEFAULT_TOTAL_REVIEWS } from "@/constants/ratings";

// Safe hook to get language without requiring context
function useSafeLanguage(): string {
  try {
    // Dynamic import to avoid circular dependency issues
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useLanguage } = require("@/contexts/LanguageContext");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { language } = useLanguage();
    return language || "EN";
  } catch {
    return "EN";
  }
}

export function useGoogleReviewStats() {
  const [rating, setRating] = useState<number>(DEFAULT_RATING);
  const [totalReviews, setTotalReviews] = useState<number>(DEFAULT_TOTAL_REVIEWS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("EN");

  // Get language on mount/update from document lang attribute as fallback
  useEffect(() => {
    try {
      const docLang = document.documentElement.lang?.toUpperCase() || "EN";
      setLanguage(docLang === "EN" ? "EN" : docLang);
    } catch {
      setLanguage("EN");
    }
  }, []);

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
