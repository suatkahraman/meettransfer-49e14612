import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AgencyLanguage = 'EN' | 'TR' | 'DE' | 'FR' | 'RU' | 'IT' | 'ES' | 'AR' | 'UK' | 'JA';
export type AgencyCurrency = 'TRY' | 'EUR' | 'GBP' | 'USD' | 'RUB' | 'UAH' | 'AED' | 'JPY';

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

export const AGENCY_CURRENCIES: CurrencyConfig[] = [
  { code: 'TRY', symbol: '₺', label: 'Turkish Lira' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'RUB', symbol: '₽', label: 'Russian Ruble' },
  { code: 'UAH', symbol: '₴', label: 'Ukrainian Hryvnia' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
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

const LANGUAGE_STORAGE_KEY = 'agency_language';
const CURRENCY_STORAGE_KEY = 'agency_currency';

const getBrowserLanguage = (): AgencyLanguage => {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const primaryLang = browserLang.split('-')[0].toLowerCase();
  return BROWSER_LANG_MAP[primaryLang] || 'EN';
};

interface AgencyLanguageContextType {
  language: AgencyLanguage;
  setLanguage: (lang: AgencyLanguage) => void;
  currency: AgencyCurrency;
  setCurrency: (curr: AgencyCurrency) => void;
  currencySymbol: string;
  currencyCode: string;
  languageConfig: LanguageConfig;
  currencyConfig: CurrencyConfig;
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

  const [currency, setCurrencyState] = useState<AgencyCurrency>(() => {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved && AGENCY_CURRENCIES.some(c => c.code === saved)) {
      return saved as AgencyCurrency;
    }
    return 'EUR'; // Default to EUR
  });

  const languageConfig = AGENCY_LANGUAGES.find(l => l.code === language) || AGENCY_LANGUAGES[0];
  const currencyConfig = AGENCY_CURRENCIES.find(c => c.code === currency) || AGENCY_CURRENCIES[0];

  const setLanguage = (lang: AgencyLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const setCurrency = (curr: AgencyCurrency) => {
    setCurrencyState(curr);
    localStorage.setItem(CURRENCY_STORAGE_KEY, curr);
  };

  return (
    <AgencyLanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      currency,
      setCurrency,
      currencySymbol: currencyConfig.symbol,
      currencyCode: currencyConfig.code,
      languageConfig,
      currencyConfig
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