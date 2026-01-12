import { useLanguage } from "@/contexts/LanguageContext";
import { format, Locale } from "date-fns";
import { enUS, de, fr, ru, it, es, ar, tr, uk, ja } from "date-fns/locale";

const localeMap: Record<string, Locale> = {
  EN: enUS,
  DE: de,
  FR: fr,
  RU: ru,
  IT: it,
  ES: es,
  AR: ar,
  TR: tr,
  UK: uk,
  JA: ja,
};

export const useBlogDate = () => {
  const { language } = useLanguage();

  const formatBlogDate = (dateString: string): string => {
    const date = new Date(dateString);
    const locale = localeMap[language] || enUS;
    
    // Format: "10 January 2025" style, adapted per locale
    return format(date, "d MMMM yyyy", { locale });
  };

  return { formatBlogDate };
};
