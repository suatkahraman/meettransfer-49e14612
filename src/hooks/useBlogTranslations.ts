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

  // Helper function to format camelCase to readable text
  const formatCamelCase = useCallback((text: string): string => {
    if (!text) return text;
    return text
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }, []);

  const tBlog = useCallback(
    (key: string): string => {
      if (!translations) {
        // During loading, return formatted key as placeholder
        return formatCamelCase(key);
      }
      const value = translations[key];
      if (value) return value;

      // Fallback to English if we have the cache
      if (cachedTranslations) {
        const enValue = cachedTranslations["EN"]?.[key];
        if (enValue) return enValue;
      }

      // If no translation found, format the key as readable text
      return formatCamelCase(key);
    },
    [translations, formatCamelCase]
  );

  return { tBlog, isLoading };
}

/**
 * Prefetch blog translations ahead of time (e.g., when hovering on a blog link).
 */
export function prefetchBlogTranslations(): void {
  loadBlogTranslations();
}
