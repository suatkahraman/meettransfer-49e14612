import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useCallback } from "react";

export type Language = "EN" | "DE" | "FR" | "RU" | "IT" | "ES";

const LANGUAGE_PREFIXES: Record<string, Language> = {
  de: "DE",
  fr: "FR",
  ru: "RU",
  it: "IT",
  es: "ES",
};

const LANGUAGE_TO_PREFIX: Record<Language, string> = {
  EN: "",
  DE: "/de",
  FR: "/fr",
  RU: "/ru",
  IT: "/it",
  ES: "/es",
};

export const SUPPORTED_LANGUAGES: Language[] = ["EN", "DE", "FR", "RU", "IT", "ES"];

export const useLanguageFromUrl = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract language from URL path
  const { language, basePath } = useMemo(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0]?.toLowerCase();

    if (firstPart && LANGUAGE_PREFIXES[firstPart]) {
      return {
        language: LANGUAGE_PREFIXES[firstPart],
        basePath: "/" + pathParts.slice(1).join("/") || "/",
      };
    }

    return {
      language: "EN" as Language,
      basePath: location.pathname,
    };
  }, [location.pathname]);

  // Get localized path for a given route
  const getLocalizedPath = useCallback(
    (path: string, targetLang?: Language): string => {
      const lang = targetLang || language;
      const prefix = LANGUAGE_TO_PREFIX[lang];
      
      // Normalize path
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      
      // Don't add prefix for English (default)
      if (lang === "EN") {
        return normalizedPath;
      }

      // Add language prefix
      return `${prefix}${normalizedPath === "/" ? "" : normalizedPath}`;
    },
    [language]
  );

  // Switch to a different language (same page, different language)
  const switchLanguage = useCallback(
    (newLang: Language) => {
      if (newLang === language) return;

      const newPath = getLocalizedPath(basePath, newLang);
      navigate(newPath);
    },
    [language, basePath, getLocalizedPath, navigate]
  );

  // Get all hreflang URLs for current page
  const getHreflangUrls = useCallback((): Record<string, string> => {
    const baseUrl = "https://meettransfer.app";
    const urls: Record<string, string> = {};

    SUPPORTED_LANGUAGES.forEach((lang) => {
      const langCode = lang.toLowerCase();
      const path = getLocalizedPath(basePath, lang);
      urls[langCode] = `${baseUrl}${path}`;
    });

    // Add x-default pointing to English
    urls["x-default"] = `${baseUrl}${basePath}`;

    return urls;
  }, [basePath, getLocalizedPath]);

  return {
    language,
    basePath,
    getLocalizedPath,
    switchLanguage,
    getHreflangUrls,
  };
};
