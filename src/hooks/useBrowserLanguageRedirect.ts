import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Language, SUPPORTED_LANGUAGES } from "./useLanguageFromUrl";

const LANGUAGE_DETECTED_KEY = "meet_transfer_lang_detected";

const BROWSER_LANG_MAP: Record<string, Language> = {
  tr: "TR",
  de: "DE",
  fr: "FR",
  ru: "RU",
  it: "IT",
  es: "ES",
  en: "EN",
  ar: "AR",
};

const LANGUAGE_TO_PREFIX: Record<Language, string> = {
  EN: "",
  TR: "/tr",
  DE: "/de",
  FR: "/fr",
  RU: "/ru",
  IT: "/it",
  ES: "/es",
  AR: "/ar",
};

export const useBrowserLanguageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only run on first visit
    if (localStorage.getItem(LANGUAGE_DETECTED_KEY)) {
      return;
    }

    // Check if already on a language-prefixed path
    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0]?.toLowerCase();
    const languagePrefixes = ["tr", "de", "fr", "ru", "it", "es", "ar"];
    
    if (languagePrefixes.includes(firstPart)) {
      // Already on a language path, mark as detected
      localStorage.setItem(LANGUAGE_DETECTED_KEY, "true");
      return;
    }

    // Detect browser language
    const browserLang = navigator.language || (navigator as any).userLanguage || "en";
    const primaryLang = browserLang.split("-")[0].toLowerCase();
    
    // Find matching supported language
    const detectedLang = BROWSER_LANG_MAP[primaryLang] || "EN";
    
    // Mark as detected
    localStorage.setItem(LANGUAGE_DETECTED_KEY, "true");

    // Redirect if not English
    if (detectedLang !== "EN") {
      const prefix = LANGUAGE_TO_PREFIX[detectedLang];
      const newPath = `${prefix}${location.pathname === "/" ? "" : location.pathname}`;
      navigate(newPath, { replace: true });
    }
  }, [location.pathname, navigate]);
};
