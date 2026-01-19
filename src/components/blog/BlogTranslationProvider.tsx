import { createContext, useContext, ReactNode } from "react";
import { useBlogTranslations } from "@/hooks/useBlogTranslations";
import { useLanguage } from "@/contexts/LanguageContext";

interface BlogTranslationContextType {
  tBlog: (key: string) => string;
  t: (key: string) => string;
  isLoading: boolean;
}

const BlogTranslationContext = createContext<BlogTranslationContextType | null>(null);

/**
 * Wrap blog pages with this provider to get access to lazy-loaded blog translations.
 * tBlog should be used for keys starting with "blog", while t handles general keys.
 */
export function BlogTranslationProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { tBlog, isLoading } = useBlogTranslations();

  // Combined translation function: tries tBlog first for blog keys, falls back to t
  const combinedT = (key: string): string => {
    if (key.startsWith("blog")) {
      return tBlog(key);
    }
    return t(key);
  };

  return (
    <BlogTranslationContext.Provider value={{ tBlog, t: combinedT, isLoading }}>
      {children}
    </BlogTranslationContext.Provider>
  );
}

/**
 * Use inside blog pages wrapped with BlogTranslationProvider.
 * Returns { t, tBlog, isLoading } where t works for all keys (preferring tBlog for blog* keys).
 */
export function useBlogT() {
  const ctx = useContext(BlogTranslationContext);
  if (!ctx) {
    throw new Error("useBlogT must be used within BlogTranslationProvider");
  }
  return ctx;
}
