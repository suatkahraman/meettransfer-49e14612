import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

type BlogTranslationMap = Record<Language, Record<string, string>>;

// Singleton promise to avoid duplicate imports
let loadPromise: Promise<BlogTranslationMap> | null = null;
let cachedTranslations: BlogTranslationMap | null = null;

const loadBlogTranslations = (): Promise<BlogTranslationMap> => {
  if (cachedTranslations) {
    return Promise.resolve(cachedTranslations);
  }
  if (!loadPromise) {
    loadPromise = import("@/contexts/BlogTranslations").then((mod) => {
      cachedTranslations = mod.blogTranslations as BlogTranslationMap;
      return cachedTranslations;
    });
  }
  return loadPromise;
};

/**
 * Hook that lazily loads blog translations only when needed.
 * Call this in blog pages instead of relying on t() for blog keys.
 */
export function useBlogTranslations() {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, string> | null>(
    cachedTranslations ? cachedTranslations[language] : null
  );
  const [isLoading, setIsLoading] = useState(!cachedTranslations);

  useEffect(() => {
    let cancelled = false;

    if (cachedTranslations) {
      setTranslations(cachedTranslations[language]);
      setIsLoading(false);
      return;
    }

    loadBlogTranslations().then((loaded) => {
      if (!cancelled) {
        setTranslations(loaded[language]);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [language]);

  const tBlog = useCallback(
    (key: string): string => {
      if (!translations) {
        // During loading, return key as placeholder
        return key;
      }
      const value = translations[key];
      if (value) return value;

      // Fallback to English if we have the cache
      if (cachedTranslations) {
        const enValue = cachedTranslations["EN"]?.[key];
        if (enValue) return enValue;
      }

      return key;
    },
    [translations]
  );

  return { tBlog, isLoading };
}

/**
 * Prefetch blog translations ahead of time (e.g., when hovering on a blog link).
 */
export function prefetchBlogTranslations(): void {
  loadBlogTranslations();
}
