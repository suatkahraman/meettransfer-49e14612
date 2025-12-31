import { useAgencyLanguage, AgencyLanguage } from '@/contexts/AgencyLanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languages = [
  { code: 'EN' as AgencyLanguage, label: 'English', flag: '🇬🇧' },
  { code: 'TR' as AgencyLanguage, label: 'Türkçe', flag: '🇹🇷' },
  { code: 'DE' as AgencyLanguage, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'FR' as AgencyLanguage, label: 'Français', flag: '🇫🇷' },
  { code: 'RU' as AgencyLanguage, label: 'Русский', flag: '🇷🇺' },
  { code: 'UK' as AgencyLanguage, label: 'Українська', flag: '🇺🇦' },
  { code: 'IT' as AgencyLanguage, label: 'Italiano', flag: '🇮🇹' },
  { code: 'ES' as AgencyLanguage, label: 'Español', flag: '🇪🇸' },
  { code: 'AR' as AgencyLanguage, label: 'العربية', flag: '🇸🇦' },
  { code: 'JA' as AgencyLanguage, label: '日本語', flag: '🇯🇵' },
] as const;

const AgencyLanguageSelector = () => {
  const { language, setLanguage } = useAgencyLanguage();

  return (
    <Select value={language} onValueChange={(val) => setLanguage(val as AgencyLanguage)}>
      <SelectTrigger className="w-[90px] h-8 bg-card border-border text-xs">
        <SelectValue>
          {languages.find((l) => l.code === language)?.flag} {language}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-card z-50">
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AgencyLanguageSelector;
