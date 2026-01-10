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

        // Try multiple geo APIs with CORS support
        const geoApis = [
          {
            url: "https://api.country.is",
            parse: (data: { country?: string }) => ({
              countryCode: data.country,
              countryName: null,
              city: null,
            }),
          },
          {
            url: "https://freeipapi.com/api/json",
            parse: (data: { countryCode?: string; countryName?: string; cityName?: string }) => ({
              countryCode: data.countryCode,
              countryName: data.countryName,
              city: data.cityName,
            }),
          },
          {
            url: "https://ipwho.is",
            parse: (data: { country_code?: string; country?: string; city?: string }) => ({
              countryCode: data.country_code,
              countryName: data.country,
              city: data.city,
            }),
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
              const parsed = api.parse(data);
              
              if (parsed.countryCode) {
                countryCode = parsed.countryCode;
                setGeoData({
                  country_code: parsed.countryCode,
                  country_name: parsed.countryName || undefined,
                  city: parsed.city || undefined,
                });
                console.log("[GeoLang] Detected country:", countryCode, "from", api.url);
              }
            }
          } catch (error) {
            console.log("[GeoLang] API failed:", api.url, error);
            // Continue to next API
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
