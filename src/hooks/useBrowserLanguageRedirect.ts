import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Language, SUPPORTED_LANGUAGES } from "./useLanguageFromUrl";

const LANGUAGE_DETECTED_KEY = "meet_transfer_lang_detected";
const GEO_LANG_VALUE_KEY = "meet_transfer_detected_lang";

// Session guard: prevents redirect loops if storage is blocked (iOS/private mode)
const hasSessionGuard = () => (window as any).__MEET_TRANSFER_LANG_REDIRECT_DONE__ === true;
const setSessionGuard = () => {
  (window as any).__MEET_TRANSFER_LANG_REDIRECT_DONE__ = true;
};

const safeStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

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
  pt: "PT",
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
  PT: "/pt",
};

export const useBrowserLanguageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    // Run at most once per tab/session even if storage is blocked
    if (hasSessionGuard()) {
      return;
    }

    // Only run on first visit
    if (safeStorageGet(LANGUAGE_DETECTED_KEY)) {
      setSessionGuard();
      return;
    }

    // Check if already on a language-prefixed path
    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0]?.toLowerCase();
    const languagePrefixes = ["tr", "de", "fr", "ru", "it", "es", "ar", "uk", "ja", "pt"];
    
    if (languagePrefixes.includes(firstPart)) {
      // Already on a language path, mark as detected
      safeStorageSet(LANGUAGE_DETECTED_KEY, "true");
      setSessionGuard();
      return;
    }

    const detectAndRedirect = async () => {
      setSessionGuard();
      setIsDetecting(true);
      let detectedLang: Language = "EN";

      // Try multiple geo APIs with CORS support
      const geoApis = [
        {
          url: "https://api.country.is",
          parse: (data: { country?: string }) => data.country,
        },
        {
          url: "https://freeipapi.com/api/json",
          parse: (data: { countryCode?: string }) => data.countryCode,
        },
        {
          url: "https://ipwho.is",
          parse: (data: { country_code?: string }) => data.country_code,
        },
      ];

      let countryCode: string | null = null;

      for (const api of geoApis) {
        if (countryCode) break;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(api.url, {
            signal: controller.signal,
            mode: "cors",
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            const code = api.parse(data);
            if (code) {
              countryCode = code;
              console.log("[BrowserLangRedirect] Detected country:", countryCode, "from", api.url);
            }
          }
        } catch (error) {
          console.log("[BrowserLangRedirect] API failed:", api.url, error);
          // Continue to next API
        }
      }

      if (countryCode && COUNTRY_TO_LANGUAGE[countryCode]) {
        detectedLang = COUNTRY_TO_LANGUAGE[countryCode];
      } else {
        // Fall back to browser language
        const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || "en";
        const primaryLang = browserLang.split("-")[0].toLowerCase();
        detectedLang = BROWSER_LANG_MAP[primaryLang] || "EN";
        console.log("[BrowserLangRedirect] Fallback to browser language:", detectedLang);
      }

      // Mark as detected and save the language
      safeStorageSet(LANGUAGE_DETECTED_KEY, "true");
      safeStorageSet(GEO_LANG_VALUE_KEY, detectedLang);
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
