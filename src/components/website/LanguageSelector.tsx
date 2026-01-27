import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Plane } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages = [
  { code: "EN" as Language, label: "English", flag: "🇬🇧", prefix: "", hasPlane: false },
  { code: "TR" as Language, label: "Türkçe", flag: "🇹🇷", prefix: "/tr", hasPlane: true },
  { code: "DE" as Language, label: "Deutsch", flag: "🇩🇪", prefix: "/de", hasPlane: false },
  { code: "FR" as Language, label: "Français", flag: "🇫🇷", prefix: "/fr", hasPlane: false },
  { code: "RU" as Language, label: "Русский", flag: "🇷🇺", prefix: "/ru", hasPlane: false },
  { code: "UK" as Language, label: "Українська", flag: "🇺🇦", prefix: "/uk", hasPlane: false },
  { code: "IT" as Language, label: "Italiano", flag: "🇮🇹", prefix: "/it", hasPlane: false },
  { code: "ES" as Language, label: "Español", flag: "🇪🇸", prefix: "/es", hasPlane: false },
  { code: "AR" as Language, label: "العربية", flag: "🇸🇦", prefix: "/ar", hasPlane: false },
  { code: "JA" as Language, label: "日本語", flag: "🇯🇵", prefix: "/ja", hasPlane: false },
  { code: "PT" as Language, label: "Português", flag: "🇵🇹", prefix: "/pt", hasPlane: false },
] as const;

const LANGUAGE_PREFIXES = ["tr", "de", "fr", "ru", "it", "es", "ar", "uk", "ja", "pt"];

interface LanguageSelectorProps {
  onLanguageChange?: () => void;
}

const LanguageSelector = ({ onLanguageChange }: LanguageSelectorProps) => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLanguageChange = (newLang: Language) => {
    if (newLang === language) return;

    // Update language context - triggers instant re-render without page reload
    setLanguage(newLang);

    // Update URL to reflect language change (for bookmarking/sharing)
    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0]?.toLowerCase();
    
    let basePath: string;
    if (LANGUAGE_PREFIXES.includes(firstPart)) {
      basePath = "/" + pathParts.slice(1).join("/") || "/";
    } else {
      basePath = location.pathname;
    }

    const targetLang = languages.find(l => l.code === newLang);
    const newPath = newLang === "EN" 
      ? basePath 
      : `${targetLang?.prefix}${basePath === "/" ? "" : basePath}`;

    // Use replace to avoid adding to history stack
    navigate(newPath, { replace: true });
    
    // Close mobile menu
    onLanguageChange?.();
  };

  const currentLang = languages.find((l) => l.code === language);
  
  return (
    <Select value={language} onValueChange={(val) => handleLanguageChange(val as Language)}>
      <SelectTrigger className="w-[110px] h-9 bg-card border-border">
        <SelectValue>
          <span className="flex items-center gap-1">
            {currentLang?.flag}
            {currentLang?.hasPlane && <Plane className="h-3 w-3 text-primary" />}
            {language}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-card">
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-1">
              {lang.flag}
              {lang.hasPlane && <Plane className="h-3 w-3 text-primary" />}
              {lang.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
