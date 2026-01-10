import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage, Language } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

// All supported languages with URL prefixes
const LANGUAGES = [
  { code: "EN" as Language, label: "English", flag: "🇬🇧", prefix: "" },
  { code: "TR" as Language, label: "Türkçe", flag: "🇹🇷", prefix: "/tr" },
  { code: "DE" as Language, label: "Deutsch", flag: "🇩🇪", prefix: "/de" },
  { code: "FR" as Language, label: "Français", flag: "🇫🇷", prefix: "/fr" },
  { code: "RU" as Language, label: "Русский", flag: "🇷🇺", prefix: "/ru" },
  { code: "UK" as Language, label: "Українська", flag: "🇺🇦", prefix: "/uk" },
  { code: "IT" as Language, label: "Italiano", flag: "🇮🇹", prefix: "/it" },
  { code: "ES" as Language, label: "Español", flag: "🇪🇸", prefix: "/es" },
  { code: "AR" as Language, label: "العربية", flag: "🇸🇦", prefix: "/ar" },
  { code: "JA" as Language, label: "日本語", flag: "🇯🇵", prefix: "/ja" },
] as const;

const LANGUAGE_PREFIXES = ["tr", "de", "fr", "ru", "it", "es", "ar", "uk", "ja"];

// Routes where URL navigation should NOT happen (internal app routes)
const NO_NAVIGATE_ROUTES = [
  "/customer",
  "/driver",
  "/admin",
  "/agency",
  "/auth",
  "/login",
  "/signup",
  "/portal",
] as const;

interface UniversalLanguageSelectorProps {
  variant?: 'default' | 'compact' | 'header';
  className?: string;
  showLabel?: boolean;
}

const UniversalLanguageSelector = ({ 
  variant = 'default', 
  className,
  showLabel = false 
}: UniversalLanguageSelectorProps) => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = LANGUAGES.find((l) => l.code === language);

  // Check if current route is an internal app route (no URL navigation needed)
  const isInternalRoute = NO_NAVIGATE_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  const handleLanguageChange = (newLang: Language) => {
    if (newLang === language) return;

    // Always save to localStorage
    setLanguage(newLang);

    // For internal routes, just update the context (no URL change)
    if (isInternalRoute) {
      return;
    }

    // For public website routes, navigate to the localized URL
    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0]?.toLowerCase();
    
    let basePath: string;
    if (LANGUAGE_PREFIXES.includes(firstPart)) {
      basePath = "/" + pathParts.slice(1).join("/") || "/";
    } else {
      basePath = location.pathname;
    }

    // Build new path with target language prefix
    const targetLang = LANGUAGES.find(l => l.code === newLang);
    const newPath = newLang === "EN" 
      ? basePath 
      : `${targetLang?.prefix}${basePath === "/" ? "" : basePath}`;

    navigate(newPath);
  };

  const triggerClasses = cn(
    "transition-colors",
    {
      // Default variant - for forms and general use
      'w-[140px] h-10 bg-card border-border': variant === 'default',
      // Compact variant - for mobile headers
      'w-auto min-w-[60px] h-8 sm:h-9 px-2 text-sm gap-1': variant === 'compact',
      // Header variant - for primary colored headers
      'w-auto min-w-[60px] h-8 sm:h-9 px-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 text-sm gap-1': variant === 'header',
    },
    className
  );

  return (
    <div className="flex items-center gap-1">
      {showLabel && (
        <Globe className="h-4 w-4 text-muted-foreground" />
      )}
      <Select value={language} onValueChange={(val) => handleLanguageChange(val as Language)}>
        <SelectTrigger className={triggerClasses}>
          {variant === 'header' && <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          <SelectValue>
            <span className="flex items-center gap-1">
              <span className="text-sm">{currentLang?.flag}</span>
              {variant !== 'compact' && variant !== 'header' && (
                <span className="font-medium">{currentLang?.label}</span>
              )}
              {(variant === 'compact' || variant === 'header') && (
                <span className="font-medium">{language}</span>
              )}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-card border shadow-lg z-50">
          {LANGUAGES.map((lang) => (
            <SelectItem 
              key={lang.code} 
              value={lang.code}
              className="cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UniversalLanguageSelector;
export { LANGUAGES };
