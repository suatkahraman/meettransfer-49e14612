import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CURRENCY_OPTIONS } from '@/lib/currency';

export type AgencyLanguage = 'EN' | 'TR' | 'DE' | 'FR' | 'RU' | 'IT' | 'ES' | 'AR' | 'UK' | 'JA';
export type AgencyCurrency = 'TRY' | 'EUR' | 'GBP' | 'USD' | 'RUB' | 'UAH' | 'AED' | 'JPY' | 'AUD';

export interface LanguageConfig {
  code: AgencyLanguage;
  label: string;
  flag: string;
}

export interface CurrencyConfig {
  code: AgencyCurrency;
  symbol: string;
  label: string;
}

export const AGENCY_LANGUAGES: LanguageConfig[] = [
  { code: 'EN', label: 'English', flag: '🇬🇧' },
  { code: 'TR', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'FR', label: 'Français', flag: '🇫🇷' },
  { code: 'RU', label: 'Русский', flag: '🇷🇺' },
  { code: 'UK', label: 'Українська', flag: '🇺🇦' },
  { code: 'IT', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ES', label: 'Español', flag: '🇪🇸' },
  { code: 'AR', label: 'العربية', flag: '🇸🇦' },
  { code: 'JA', label: '日本語', flag: '🇯🇵' },
];

// Use centralized currency options - derive AGENCY_CURRENCIES from CURRENCY_OPTIONS
export const AGENCY_CURRENCIES: CurrencyConfig[] = CURRENCY_OPTIONS.map(c => ({
  code: c.value as AgencyCurrency,
  symbol: c.symbol,
  label: c.label.split(' - ')[1] || c.label,
}));

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

const LANGUAGE_STORAGE_KEY = 'agency_language';

const getBrowserLanguage = (): AgencyLanguage => {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const primaryLang = browserLang.split('-')[0].toLowerCase();
  return BROWSER_LANG_MAP[primaryLang] || 'EN';
};

interface AgencyLanguageContextType {
  language: AgencyLanguage;
  setLanguage: (lang: AgencyLanguage) => void;
  languageConfig: LanguageConfig;
}

const AgencyLanguageContext = createContext<AgencyLanguageContextType | undefined>(undefined);

export const AgencyLanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<AgencyLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && Object.values(BROWSER_LANG_MAP).includes(saved as AgencyLanguage)) {
      return saved as AgencyLanguage;
    }
    return getBrowserLanguage();
  });

  const languageConfig = AGENCY_LANGUAGES.find(l => l.code === language) || AGENCY_LANGUAGES[0];

  const setLanguage = (lang: AgencyLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  return (
    <AgencyLanguageContext.Provider value={{ 
      language, 
      setLanguage, 
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
