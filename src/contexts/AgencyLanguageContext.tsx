import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AgencyLanguage = 'EN' | 'TR' | 'DE' | 'FR' | 'RU' | 'IT' | 'ES' | 'AR' | 'UK' | 'JA';

export interface LanguageConfig {
  code: AgencyLanguage;
  label: string;
  flag: string;
  currencySymbol: string;
  currencyCode: string;
}

export const AGENCY_LANGUAGES: LanguageConfig[] = [
  { code: 'EN', label: 'English', flag: '🇬🇧', currencySymbol: '£', currencyCode: 'GBP' },
  { code: 'TR', label: 'Türkçe', flag: '🇹🇷', currencySymbol: '₺', currencyCode: 'TRY' },
  { code: 'DE', label: 'Deutsch', flag: '🇩🇪', currencySymbol: '€', currencyCode: 'EUR' },
  { code: 'FR', label: 'Français', flag: '🇫🇷', currencySymbol: '€', currencyCode: 'EUR' },
  { code: 'RU', label: 'Русский', flag: '🇷🇺', currencySymbol: '₽', currencyCode: 'RUB' },
  { code: 'UK', label: 'Українська', flag: '🇺🇦', currencySymbol: '₴', currencyCode: 'UAH' },
  { code: 'IT', label: 'Italiano', flag: '🇮🇹', currencySymbol: '€', currencyCode: 'EUR' },
  { code: 'ES', label: 'Español', flag: '🇪🇸', currencySymbol: '€', currencyCode: 'EUR' },
  { code: 'AR', label: 'العربية', flag: '🇸🇦', currencySymbol: 'د.إ', currencyCode: 'AED' },
  { code: 'JA', label: '日本語', flag: '🇯🇵', currencySymbol: '¥', currencyCode: 'JPY' },
];

const BROWSER_LANG_MAP: Record<string, AgencyLanguage> = {
  tr: 'TR',
  de: 'DE',
  fr: 'FR',
  ru: 'RU',
  it: 'IT',
  es: 'ES',
  en: 'EN',
  ar: 'AR',
  uk: 'UK',
  ja: 'JA',
};

const STORAGE_KEY = 'agency_language';

const getBrowserLanguage = (): AgencyLanguage => {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const primaryLang = browserLang.split('-')[0].toLowerCase();
  return BROWSER_LANG_MAP[primaryLang] || 'EN';
};

interface AgencyLanguageContextType {
  language: AgencyLanguage;
  setLanguage: (lang: AgencyLanguage) => void;
  currencySymbol: string;
  currencyCode: string;
  languageConfig: LanguageConfig;
}

const AgencyLanguageContext = createContext<AgencyLanguageContextType | undefined>(undefined);

export const AgencyLanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<AgencyLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Object.values(BROWSER_LANG_MAP).includes(saved as AgencyLanguage)) {
      return saved as AgencyLanguage;
    }
    return getBrowserLanguage();
  });

  const languageConfig = AGENCY_LANGUAGES.find(l => l.code === language) || AGENCY_LANGUAGES[0];

  const setLanguage = (lang: AgencyLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <AgencyLanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      currencySymbol: languageConfig.currencySymbol,
      currencyCode: languageConfig.currencyCode,
      languageConfig
    }}>
      {children}
    </AgencyLanguageContext.Provider>
  );
};

export const useAgencyLanguage = () => {
  const context = useContext(AgencyLanguageContext);
  if (!context) {
    throw new Error('useAgencyLanguage must be used within an AgencyLanguageProvider');
  }
  return context;
};
