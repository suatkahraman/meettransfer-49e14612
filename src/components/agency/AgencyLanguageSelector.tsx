import { useAgencyLanguage, AGENCY_LANGUAGES, AGENCY_CURRENCIES, AgencyLanguage, AgencyCurrency } from '@/contexts/AgencyLanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Coins } from 'lucide-react';

const AgencyLanguageSelector = () => {
  const { language, setLanguage, currency, setCurrency, currencySymbol } = useAgencyLanguage();
  const currentLang = AGENCY_LANGUAGES.find((l) => l.code === language);
  const currentCurrency = AGENCY_CURRENCIES.find((c) => c.code === currency);

  return (
    <div className="flex items-center gap-1">
      {/* Language Selector */}
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

      {/* Currency Selector */}
      <Select value={currency} onValueChange={(val) => setCurrency(val as AgencyCurrency)}>
        <SelectTrigger className="w-auto min-w-[70px] h-9 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-xs gap-1.5 hover:bg-primary-foreground/20 transition-colors">
          <Coins className="h-3.5 w-3.5" />
          <SelectValue>
            <span className="flex items-center gap-1">
              <span className="font-medium">{currencySymbol}</span>
              <span className="text-primary-foreground/70">{currency}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-card border shadow-lg z-50">
          {AGENCY_CURRENCIES.map((curr) => (
            <SelectItem 
              key={curr.code} 
              value={curr.code}
              className="cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-base font-medium">{curr.symbol}</span>
                <span>{curr.label}</span>
                <span className="text-muted-foreground text-xs">({curr.code})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AgencyLanguageSelector;