import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AgencyLanguage = 'EN' | 'TR' | 'DE' | 'FR' | 'RU' | 'IT' | 'ES' | 'AR' | 'UK' | 'JA';

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

  const setLanguage = (lang: AgencyLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <AgencyLanguageContext.Provider value={{ language, setLanguage }}>
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
