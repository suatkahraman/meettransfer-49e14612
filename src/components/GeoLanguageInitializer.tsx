import { useEffect } from "react";
import { useLanguage, Language } from "@/contexts/LanguageContext";

const GEO_LANG_DETECTED_KEY = "meet_transfer_geo_lang_detected";
const GEO_LANG_VALUE_KEY = "meet_transfer_detected_lang";
const LANG_STORAGE_KEY = "meet_transfer_language";

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
  EC: "ES",
  GT: "ES",
  CU: "ES",
  BO: "ES",
  DO: "ES",
  HN: "ES",
  PY: "ES",
  SV: "ES",
  NI: "ES",
  CR: "ES",
  PA: "ES",
  UY: "ES",
  
  // Arabic-speaking
  SA: "AR",
  AE: "AR",
  EG: "AR",
  IQ: "AR",
  JO: "AR",
  KW: "AR",
  LB: "AR",
  LY: "AR",
  MA: "AR",
  OM: "AR",
  QA: "AR",
  SY: "AR",
  TN: "AR",
  YE: "AR",
  BH: "AR",
  
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
  ZA: "EN",
  IN: "EN",
  PK: "EN",
  NG: "EN",
  PH: "EN",
  SG: "EN",
  MY: "EN",
};

// Browser language to Language mapping
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

/**
 * This component runs geo-language detection on first visit
 * and stores the detected language for the LanguageContext to use.
 */
export const GeoLanguageInitializer = () => {
  const { setLanguage } = useLanguage();

  useEffect(() => {
    const detectLanguage = async () => {
      // Check if we've already detected and user hasn't manually selected
      const alreadyDetected = localStorage.getItem(GEO_LANG_DETECTED_KEY);
      const storedLanguage = localStorage.getItem(LANG_STORAGE_KEY);
      
      // If user has manually selected a language, don't override
      if (storedLanguage) {
        return;
      }
      
      // If already detected via geo, use that
      if (alreadyDetected) {
        return;
      }

      try {
        let countryCode: string | null = null;

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
                console.log("[GeoLang] Detected country:", countryCode, "from", api.url);
              }
            }
          } catch {
            // Continue to next API
          }
        }

        let detectedLang: Language = "EN";

        if (countryCode && COUNTRY_TO_LANGUAGE[countryCode]) {
          detectedLang = COUNTRY_TO_LANGUAGE[countryCode];
        } else {
          // Fall back to browser language
          const browserLang = navigator.language || "en";
          const primaryLang = browserLang.split("-")[0].toLowerCase();
          detectedLang = BROWSER_LANG_MAP[primaryLang] || "EN";
        }

        console.log("[GeoLang] Setting initial language to:", detectedLang);
        
        // Save detected language
        localStorage.setItem(GEO_LANG_DETECTED_KEY, "true");
        localStorage.setItem(GEO_LANG_VALUE_KEY, detectedLang);
        
        // Also update the context
        setLanguage(detectedLang);
      } catch {
        // On any error, default to EN
        localStorage.setItem(GEO_LANG_DETECTED_KEY, "true");
        localStorage.setItem(GEO_LANG_VALUE_KEY, "EN");
      }
    };

    detectLanguage();
  }, [setLanguage]);

  return null;
};

export default GeoLanguageInitializer;
