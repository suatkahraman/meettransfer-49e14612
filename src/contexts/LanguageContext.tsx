import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { criticalTranslations } from "./translations/critical";

// BlogTranslations removed from main bundle – use useBlogTranslations hook in blog pages

export type Language = "EN" | "DE" | "FR" | "RU" | "IT" | "ES" | "AR" | "TR" | "UK" | "JA";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getLocalizedPath: (path: string) => string;
}

const LANGUAGE_PREFIXES: Record<string, Language> = {
  de: "DE",
  fr: "FR",
  ru: "RU",
  it: "IT",
  es: "ES",
  ar: "AR",
  tr: "TR",
  uk: "UK",
  ja: "JA",
};

const LANGUAGE_TO_PREFIX: Record<Language, string> = {
  EN: "",
  DE: "/de",
  FR: "/fr",
  RU: "/ru",
  IT: "/it",
  ES: "/es",
  AR: "/ar",
  TR: "/tr",
  UK: "/uk",
  JA: "/ja",
};

// Full translations are lazy-loaded
let fullTranslations: Record<Language, Record<string, string>> | null = null;
let fullTranslationsPromise: Promise<void> | null = null;

// Export for lazy loader reference (used internally)
export const __translations = fullTranslations;

const loadFullTranslations = (): Promise<void> => {
  if (fullTranslations) {
    return Promise.resolve();
  }
  
  if (fullTranslationsPromise) {
    return fullTranslationsPromise;
  }
  
  fullTranslationsPromise = import("./translations/full").then((module) => {
    fullTranslations = module.fullTranslations;
  });
  
  return fullTranslationsPromise;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "mt_language";

const AUTH_LANGUAGE_ROUTES = [
  "/auth",
  "/login",
  "/login/agency",
  "/signup",
  "/signup/customer",
  "/signup/agency",
  "/install",
] as const;

const getPrefixLanguage = (pathname: string): Language | null => {
  const pathParts = pathname.split("/").filter(Boolean);
  const firstPart = pathParts[0]?.toLowerCase();

  if (firstPart && LANGUAGE_PREFIXES[firstPart]) {
    return LANGUAGE_PREFIXES[firstPart];
  }

  return null;
};

const getStoredLanguage = (): Language | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const candidate = raw.toUpperCase() as Language;
    return candidate in criticalTranslations ? candidate : null;
  } catch {
    return null;
  }
};

const storeLanguage = (lang: Language) => {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
};

const isAuthLanguageRoute = (pathname: string): boolean => {
  return AUTH_LANGUAGE_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
};

// Get geo-detected language from localStorage (set by useGeoLanguageDetection hook)
const getGeoDetectedLanguage = (): Language | null => {
  try {
    const detected = localStorage.getItem('meet_transfer_detected_lang');
    if (detected) {
      const candidate = detected.toUpperCase() as Language;
      return candidate in criticalTranslations ? candidate : null;
    }
    return null;
  } catch {
    return null;
  }
};

const resolveLanguage = (pathname: string): { language: Language; fromPrefix: boolean } => {
  const prefixLang = getPrefixLanguage(pathname);
  if (prefixLang) {
    return { language: prefixLang, fromPrefix: true };
  }

  // For auth routes AND internal app routes, use stored language
  if (isAuthLanguageRoute(pathname) || isInternalAppRoute(pathname)) {
    return { language: getStoredLanguage() ?? "EN", fromPrefix: false };
  }

  // For public website root without prefix, check stored language first
  const stored = getStoredLanguage();
  if (stored) {
    return { language: stored, fromPrefix: false };
  }

  // Fall back to geo-detected language if available
  const geoLang = getGeoDetectedLanguage();
  if (geoLang) {
    return { language: geoLang, fromPrefix: false };
  }

  return { language: "EN", fromPrefix: false };
};

// Internal app routes that don't use URL prefixes for language
const isInternalAppRoute = (pathname: string): boolean => {
  const internalRoutes = ["/customer", "/driver", "/admin", "/agency", "/portal"];
  return internalRoutes.some((p) => pathname.startsWith(p));
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { language, fromPrefix } = resolveLanguage(location.pathname);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  // Load full translations after initial render (non-blocking)
  useEffect(() => {
    // Use requestIdleCallback for non-critical loading
    const loadTranslations = () => {
      loadFullTranslations().then(() => {
        setTranslationsLoaded(true);
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadTranslations, { timeout: 2000 });
    } else {
      setTimeout(loadTranslations, 100);
    }
  }, []);

  const t = useCallback((key: string): string => {
    // First check critical translations (always available, inline)
    const criticalValue = criticalTranslations[language]?.[key];
    if (criticalValue) {
      return criticalValue;
    }

    // Then check full translations if loaded
    if (fullTranslations) {
      const fullValue = fullTranslations[language]?.[key];
      if (fullValue) {
        return fullValue;
      }
    }

    // Fallback to English in critical translations
    const englishCritical = criticalTranslations["EN"]?.[key];
    if (englishCritical) {
      return englishCritical;
    }

    // Fallback to English in full translations
    if (fullTranslations) {
      const englishFull = fullTranslations["EN"]?.[key];
      if (englishFull) {
        return englishFull;
      }
    }

    // Return key if no translation exists at all (likely a blog key that should use tBlog)
    if (import.meta.env.DEV && !key.startsWith("blog") && !key.startsWith("seo")) {
      console.debug(`[i18n] Missing translation for: ${key}`);
    }
    return key;
  }, [language, translationsLoaded]);

  const getLocalizedPath = useCallback((path: string): string => {
    const prefix = LANGUAGE_TO_PREFIX[language];
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    if (language === "EN") {
      return normalizedPath;
    }

    return `${prefix}${normalizedPath === "/" ? "" : normalizedPath}`;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    storeLanguage(lang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language.toLowerCase();
    // Set RTL direction for Arabic
    document.documentElement.dir = language === "AR" ? "rtl" : "ltr";

    // Persist user preference only when it came from an explicit language prefix
    // (so we don't accidentally turn "EN" into the stored preference when users visit /)
    if (fromPrefix) {
      storeLanguage(language);
    }
  }, [language, fromPrefix]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLocalizedPath }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
