import { createContext, useContext, ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import enTranslations from "./i18n/en";

export type Language = "EN" | "DE" | "FR" | "RU" | "IT" | "ES" | "AR" | "TR" | "UK" | "JA" | "PT";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getLocalizedPath: (path: string) => string;
}

type TranslationMap = Record<string, string>;

const SUPPORTED_LANGUAGES: Language[] = ["EN", "DE", "FR", "RU", "IT", "ES", "AR", "TR", "UK", "JA", "PT"];

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
  pt: "PT",
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
  PT: "/pt",
};

const AUTH_LANGUAGE_ROUTES = [
  "/auth",
  "/login",
  "/login/agency",
  "/signup",
  "/signup/customer",
  "/signup/agency",
  "/install",
] as const;

const STORAGE_KEY = "mt_language";

const translationCache: Partial<Record<Language, TranslationMap>> = {
  EN: enTranslations as TranslationMap,
};

const isLanguage = (value: string): value is Language => {
  return SUPPORTED_LANGUAGES.includes(value as Language);
};

const loadLanguageTranslations = async (lang: Language): Promise<TranslationMap> => {
  const cached = translationCache[lang];
  if (cached) return cached;

  let loaded: TranslationMap;
  switch (lang) {
    case "DE":
      loaded = (await import("./i18n/de")).default as TranslationMap;
      break;
    case "FR":
      loaded = (await import("./i18n/fr")).default as TranslationMap;
      break;
    case "RU":
      loaded = (await import("./i18n/ru")).default as TranslationMap;
      break;
    case "IT":
      loaded = (await import("./i18n/it")).default as TranslationMap;
      break;
    case "ES":
      loaded = (await import("./i18n/es")).default as TranslationMap;
      break;
    case "AR":
      loaded = (await import("./i18n/ar")).default as TranslationMap;
      break;
    case "TR":
      loaded = (await import("./i18n/tr")).default as TranslationMap;
      break;
    case "UK":
      loaded = (await import("./i18n/uk")).default as TranslationMap;
      break;
    case "JA":
      loaded = (await import("./i18n/ja")).default as TranslationMap;
      break;
    case "PT":
      loaded = (await import("./i18n/pt")).default as TranslationMap;
      break;
    case "EN":
    default:
      loaded = enTranslations as TranslationMap;
      break;
  }

  translationCache[lang] = loaded;
  return loaded;
};

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
    const candidate = raw.toUpperCase();
    return isLanguage(candidate) ? candidate : null;
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

// Internal app routes that don't use URL prefixes for language
const isInternalAppRoute = (pathname: string): boolean => {
  const internalRoutes = ["/customer", "/driver", "/admin", "/agency", "/portal"];
  return internalRoutes.some((p) => pathname.startsWith(p));
};

// Get geo-detected language from localStorage (set by useGeoLanguageDetection hook)
const getGeoDetectedLanguage = (): Language | null => {
  try {
    const detected = localStorage.getItem("meet_transfer_detected_lang");
    if (!detected) return null;
    const candidate = detected.toUpperCase();
    return isLanguage(candidate) ? candidate : null;
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

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { language, fromPrefix } = resolveLanguage(location.pathname);
  const [currentTranslations, setCurrentTranslations] = useState<TranslationMap>(
    () => translationCache[language] ?? (enTranslations as TranslationMap)
  );

  useEffect(() => {
    let cancelled = false;

    const cached = translationCache[language];
    if (cached) {
      setCurrentTranslations(cached);
      return () => {
        cancelled = true;
      };
    }

    // Keep UI readable while language bundle is being loaded.
    setCurrentTranslations(enTranslations as TranslationMap);

    void loadLanguageTranslations(language)
      .then((loaded) => {
        if (!cancelled) {
          setCurrentTranslations(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentTranslations(enTranslations as TranslationMap);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  // Dev-only i18n logs can be silenced via env flag.
  // Default: enabled (current behavior). Set VITE_I18N_LOGS="false" to disable.
  const i18nLogsEnabled = import.meta.env.VITE_I18N_LOGS !== "false";

  const t = useMemo(
    () => (key: string): string => {
      const translation = currentTranslations[key];
      if (translation) {
        return translation;
      }

      // Fallback to English
      const englishTranslation = (enTranslations as TranslationMap)[key];
      if (englishTranslation) {
        // Only log in development and for non-blog keys to reduce noise
        if (import.meta.env.DEV && i18nLogsEnabled && !key.startsWith("blog") && !key.startsWith("seo")) {
          console.debug(`[i18n] Missing ${language} translation for: ${key}`);
        }
        return englishTranslation;
      }

      // Return key if no translation exists at all (likely a blog key that should use tBlog)
      if (import.meta.env.DEV && i18nLogsEnabled && !key.startsWith("blog")) {
        console.warn(`[i18n] Missing translation key: ${key}`);
      }
      return key;
    },
    [currentTranslations, i18nLogsEnabled, language]
  );

  const getLocalizedPath = (path: string): string => {
    const prefix = LANGUAGE_TO_PREFIX[language];
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    if (language === "EN") {
      return normalizedPath;
    }

    return `${prefix}${normalizedPath === "/" ? "" : normalizedPath}`;
  };

  const setLanguage = (lang: Language) => {
    storeLanguage(lang);
  };

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

  return <LanguageContext.Provider value={{ language, setLanguage, t, getLocalizedPath }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
