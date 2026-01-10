import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Language, SUPPORTED_LANGUAGES } from "./useLanguageFromUrl";

const LANGUAGE_DETECTED_KEY = "meet_transfer_lang_detected";
const GEO_LANG_VALUE_KEY = "meet_transfer_detected_lang";

// Country code to language mapping
const COUNTRY_TO_LANGUAGE: Record<string, Language> = {
  // Turkish-speaking
  TR: "TR",
  CY: "TR",
  
  // German-speaking
  DE: "DE",
  AT: "DE",
  CH: "DE",
  LI: "DE",
  
  // French-speaking
  FR: "FR",
  BE: "FR",
  LU: "FR",
  MC: "FR",
  
  // Russian-speaking
  RU: "RU",
  BY: "RU",
  KZ: "RU",
  KG: "RU",
  
  // Italian-speaking
  IT: "IT",
  SM: "IT",
  VA: "IT",
  
  // Spanish-speaking
  ES: "ES",
  MX: "ES",
  AR: "ES",
  CO: "ES",
  PE: "ES",
  VE: "ES",
  CL: "ES",
  
  // Arabic-speaking
  SA: "AR",
  AE: "AR",
  EG: "AR",
  IQ: "AR",
  JO: "AR",
  KW: "AR",
  QA: "AR",
  
  // Ukrainian-speaking
  UA: "UK",
  
  // Japanese-speaking
  JP: "JA",
  
  // English-speaking (default)
  US: "EN",
  GB: "EN",
  CA: "EN",
  AU: "EN",
  NZ: "EN",
  IE: "EN",
};

const BROWSER_LANG_MAP: Record<string, Language> = {
  tr: "TR",
  de: "DE",
  fr: "FR",
  ru: "RU",
  it: "IT",
  es: "ES",
  en: "EN",
  ar: "AR",
  uk: "UK",
  ja: "JA",
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
  UK: "/uk",
  JA: "/ja",
};

export const useBrowserLanguageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    // Only run on first visit
    if (localStorage.getItem(LANGUAGE_DETECTED_KEY)) {
      return;
    }

    // Check if already on a language-prefixed path
    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0]?.toLowerCase();
    const languagePrefixes = ["tr", "de", "fr", "ru", "it", "es", "ar", "uk", "ja"];
    
    if (languagePrefixes.includes(firstPart)) {
      // Already on a language path, mark as detected
      localStorage.setItem(LANGUAGE_DETECTED_KEY, "true");
      return;
    }

    const detectAndRedirect = async () => {
      setIsDetecting(true);
      let detectedLang: Language = "EN";

      try {
        // Try to get geo location
        const response = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(3000),
        });
        
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code;
          
          if (countryCode && COUNTRY_TO_LANGUAGE[countryCode]) {
            detectedLang = COUNTRY_TO_LANGUAGE[countryCode];
          }
        }
      } catch {
        // Fall back to browser language on error
        const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || "en";
        const primaryLang = browserLang.split("-")[0].toLowerCase();
        detectedLang = BROWSER_LANG_MAP[primaryLang] || "EN";
      }

      // Mark as detected and save the language
      localStorage.setItem(LANGUAGE_DETECTED_KEY, "true");
      localStorage.setItem(GEO_LANG_VALUE_KEY, detectedLang);
      setIsDetecting(false);

      // Redirect if not English
      if (detectedLang !== "EN") {
        const prefix = LANGUAGE_TO_PREFIX[detectedLang];
        const newPath = `${prefix}${location.pathname === "/" ? "" : location.pathname}`;
        navigate(newPath, { replace: true });
      }
    };

    detectAndRedirect();
  }, [location.pathname, navigate]);

  return { isDetecting };
};
