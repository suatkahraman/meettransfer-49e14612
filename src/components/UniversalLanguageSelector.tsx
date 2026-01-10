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

// All supported languages
const LANGUAGES = [
  { code: "EN" as Language, label: "English", flag: "🇬🇧" },
  { code: "TR" as Language, label: "Türkçe", flag: "🇹🇷" },
  { code: "DE" as Language, label: "Deutsch", flag: "🇩🇪" },
  { code: "FR" as Language, label: "Français", flag: "🇫🇷" },
  { code: "RU" as Language, label: "Русский", flag: "🇷🇺" },
  { code: "UK" as Language, label: "Українська", flag: "🇺🇦" },
  { code: "IT" as Language, label: "Italiano", flag: "🇮🇹" },
  { code: "ES" as Language, label: "Español", flag: "🇪🇸" },
  { code: "AR" as Language, label: "العربية", flag: "🇸🇦" },
  { code: "JA" as Language, label: "日本語", flag: "🇯🇵" },
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
  const currentLang = LANGUAGES.find((l) => l.code === language);

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
      <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
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
