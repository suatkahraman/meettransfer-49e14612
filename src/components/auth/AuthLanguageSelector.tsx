import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages = [
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
  { code: "PT" as Language, label: "Português", flag: "🇵🇹", prefix: "/pt" },
] as const;

const AuthLanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={(val) => handleLanguageChange(val as Language)}>
        <SelectTrigger className="w-[120px] h-8 text-sm bg-background border-border">
          <SelectValue>
            {languages.find((l) => l.code === language)?.flag} {languages.find((l) => l.code === language)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-card">
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="text-sm">
              {lang.flag} {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AuthLanguageSelector;
