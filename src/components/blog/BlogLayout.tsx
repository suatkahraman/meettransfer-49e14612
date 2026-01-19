import { Suspense, lazy, ComponentType, useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useLanguage, Language } from "@/contexts/LanguageContext";

type TranslationMap = Record<string, string>;
type AllTranslations = Record<Language, TranslationMap>;

// Singleton for blog translations
let blogTranslationsCache: AllTranslations | null = null;
let loadingPromise: Promise<AllTranslations> | null = null;

const loadBlogTranslations = (): Promise<AllTranslations> => {
  if (blogTranslationsCache) return Promise.resolve(blogTranslationsCache);
  if (!loadingPromise) {
    loadingPromise = import("@/contexts/BlogTranslations").then((mod) => {
      blogTranslationsCache = mod.blogTranslations as AllTranslations;
      return blogTranslationsCache;
    });
  }
  return loadingPromise;
};

// Prefetch for link hover
export const prefetchBlogTranslations = () => void loadBlogTranslations();

// Context for blog pages
interface BlogContextValue {
  tBlog: (key: string) => string;
  isLoading: boolean;
}

const BlogContext = createContext<BlogContextValue | null>(null);

export function useBlogT() {
  const ctx = useContext(BlogContext);
  const { t, language } = useLanguage();
  
  if (ctx) {
    // Inside BlogLayout - use tBlog for blog keys, t for others
    return {
      t: (key: string) => {
        if (key.startsWith("blog")) {
          return ctx.tBlog(key);
        }
        return t(key);
      },
      tBlog: ctx.tBlog,
      isLoading: ctx.isLoading,
    };
  }
  
  // Fallback when not in BlogLayout - just use regular t
  return {
    t,
    tBlog: t,
    isLoading: false,
  };
}

/**
 * Wrapper layout for all blog pages. Loads blog translations lazily.
 */
export function BlogLayout({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<TranslationMap | null>(
    blogTranslationsCache ? blogTranslationsCache[language] : null
  );
  const [isLoading, setIsLoading] = useState(!blogTranslationsCache);

  useEffect(() => {
    if (blogTranslationsCache) {
      setTranslations(blogTranslationsCache[language]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    loadBlogTranslations().then((all) => {
      if (!cancelled) {
        setTranslations(all[language]);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [language]);

  const tBlog = (key: string): string => {
    if (!translations) return key;
    const val = translations[key];
    if (val) return val;
    
    // Fallback to English
    if (blogTranslationsCache) {
      const enVal = blogTranslationsCache["EN"]?.[key];
      if (enVal) return enVal;
    }
    
    return key;
  };

  return (
    <BlogContext.Provider value={{ tBlog, isLoading }}>
      {children}
    </BlogContext.Provider>
  );
}

/**
 * Simple loader for blog pages.
 */
export function BlogPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
