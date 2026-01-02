import { useAgencyLanguage, AGENCY_LANGUAGES, AgencyLanguage } from '@/contexts/AgencyLanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const AgencyLanguageSelector = () => {
  const { language, setLanguage } = useAgencyLanguage();
  const currentLang = AGENCY_LANGUAGES.find((l) => l.code === language);

  return (
    <div className="flex items-center gap-1">
      {/* Language Selector Only - Currency is set at agency creation */}
      <Select value={language} onValueChange={(val) => setLanguage(val as AgencyLanguage)}>
        <SelectTrigger className="w-auto min-w-[80px] h-9 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-xs gap-1.5 hover:bg-primary-foreground/20 transition-colors">
          <Globe className="h-3.5 w-3.5" />
          <SelectValue>
            <span className="flex items-center gap-1">
              <span>{currentLang?.flag}</span>
              <span className="font-medium">{language}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-card border shadow-lg z-50">
          {AGENCY_LANGUAGES.map((lang) => (
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

export default AgencyLanguageSelector;
