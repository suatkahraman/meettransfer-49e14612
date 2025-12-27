import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage, Language } from "@/contexts/LanguageContext";
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
] as const;

const LANGUAGE_PREFIXES = ["tr", "de", "fr", "ru", "it", "es", "ar", "uk"];

const LanguageSelector = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLanguageChange = (newLang: Language) => {
    if (newLang === language) return;

    // Get current path without language prefix
    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0]?.toLowerCase();
    
    let basePath: string;
    if (LANGUAGE_PREFIXES.includes(firstPart)) {
      basePath = "/" + pathParts.slice(1).join("/") || "/";
    } else {
      basePath = location.pathname;
    }

    // Build new path with target language prefix
    const targetLang = languages.find(l => l.code === newLang);
    const newPath = newLang === "EN" 
      ? basePath 
      : `${targetLang?.prefix}${basePath === "/" ? "" : basePath}`;

    navigate(newPath);
  };

  return (
    <Select value={language} onValueChange={(val) => handleLanguageChange(val as Language)}>
      <SelectTrigger className="w-[100px] h-9 bg-card border-border">
        <SelectValue>
          {languages.find((l) => l.code === language)?.flag} {language}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-card">
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
