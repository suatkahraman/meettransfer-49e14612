import { useEffect, useState } from "react";
import { Language } from "@/contexts/LanguageContext";

const GEO_LANG_DETECTED_KEY = "meet_transfer_geo_lang_detected";
const GEO_LANG_VALUE_KEY = "meet_transfer_detected_lang";

// Country code to language mapping
const COUNTRY_TO_LANGUAGE: Record<string, Language> = {
  // Turkish-speaking
  TR: "TR",
  CY: "TR", // Cyprus (can be Turkish or Greek, default Turkish for this service)
  
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

interface GeoData {
  country_code?: string;
  country_name?: string;
  city?: string;
}

export const useGeoLanguageDetection = () => {
  const [detectedLanguage, setDetectedLanguage] = useState<Language | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [geoData, setGeoData] = useState<GeoData | null>(null);

  useEffect(() => {
    const detectLanguage = async () => {
      // Check if already detected
      const alreadyDetected = localStorage.getItem(GEO_LANG_DETECTED_KEY);
      if (alreadyDetected) {
        const savedLang = localStorage.getItem(GEO_LANG_VALUE_KEY) as Language | null;
        setDetectedLanguage(savedLang || "EN");
        setIsDetecting(false);
        return;
      }

      try {
        // Try to get geo location from multiple sources
        let countryCode: string | null = null;

        // First try: ipapi.co (free tier)
        try {
          const response = await fetch("https://ipapi.co/json/", {
            signal: AbortSignal.timeout(3000),
          });
          if (response.ok) {
            const data = await response.json();
            countryCode = data.country_code;
            setGeoData({
              country_code: data.country_code,
              country_name: data.country_name,
              city: data.city,
            });
          }
        } catch {
          // Try fallback: ip-api.com
          try {
            const response = await fetch("http://ip-api.com/json/?fields=countryCode,country,city", {
              signal: AbortSignal.timeout(3000),
            });
            if (response.ok) {
              const data = await response.json();
              countryCode = data.countryCode;
              setGeoData({
                country_code: data.countryCode,
                country_name: data.country,
                city: data.city,
              });
            }
          } catch {
            // Geo detection failed, fall back to browser language
          }
        }

        let detectedLang: Language = "EN";

        if (countryCode && COUNTRY_TO_LANGUAGE[countryCode]) {
          detectedLang = COUNTRY_TO_LANGUAGE[countryCode];
        } else {
          // Fall back to browser language
          const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || "en";
          const primaryLang = browserLang.split("-")[0].toLowerCase();
          detectedLang = BROWSER_LANG_MAP[primaryLang] || "EN";
        }

        // Save detected language
        localStorage.setItem(GEO_LANG_DETECTED_KEY, "true");
        localStorage.setItem(GEO_LANG_VALUE_KEY, detectedLang);
        setDetectedLanguage(detectedLang);
      } catch {
        // On any error, default to EN
        setDetectedLanguage("EN");
        localStorage.setItem(GEO_LANG_DETECTED_KEY, "true");
        localStorage.setItem(GEO_LANG_VALUE_KEY, "EN");
      } finally {
        setIsDetecting(false);
      }
    };

    detectLanguage();
  }, []);

  const resetDetection = () => {
    localStorage.removeItem(GEO_LANG_DETECTED_KEY);
    localStorage.removeItem(GEO_LANG_VALUE_KEY);
    setDetectedLanguage(null);
    setIsDetecting(true);
  };

  return {
    detectedLanguage,
    isDetecting,
    geoData,
    resetDetection,
  };
};

export const getStoredLanguage = (): Language | null => {
  return localStorage.getItem(GEO_LANG_VALUE_KEY) as Language | null;
};

export const setStoredLanguage = (lang: Language): void => {
  localStorage.setItem(GEO_LANG_VALUE_KEY, lang);
  localStorage.setItem(GEO_LANG_DETECTED_KEY, "true");
};
