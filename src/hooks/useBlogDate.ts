import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import type { Locale } from "date-fns";
import { enUS } from "date-fns/locale";
import { loadLocale, getCachedLocale, languageToLocaleKey } from "@/utils/dateFnsLocaleLoader";

export const useBlogDate = () => {
  const { language } = useLanguage();
  const [locale, setLocale] = useState<Locale>(() => {
    const localeKey = languageToLocaleKey[language] || 'en';
    return getCachedLocale(localeKey) || enUS;
  });

  // Load locale dynamically when language changes
  useEffect(() => {
    const localeKey = languageToLocaleKey[language] || 'en';
    loadLocale(localeKey).then(setLocale);
  }, [language]);

  const formatBlogDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    // Format: "10 January 2025" style, adapted per locale
    return format(date, "d MMMM yyyy", { locale });
  }, [locale]);

  return { formatBlogDate };
};
