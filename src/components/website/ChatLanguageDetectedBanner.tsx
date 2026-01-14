import { motion } from "framer-motion";
import { Globe, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatLanguageDetectedBannerProps {
  language: string;
  countryCode?: string;
  className?: string;
}

// Country code to flag emoji mapping
const COUNTRY_FLAGS: Record<string, string> = {
  TR: "🇹🇷",
  DE: "🇩🇪",
  FR: "🇫🇷",
  RU: "🇷🇺",
  IT: "🇮🇹",
  ES: "🇪🇸",
  GB: "🇬🇧",
  US: "🇺🇸",
  SA: "🇸🇦",
  AE: "🇦🇪",
  UA: "🇺🇦",
  JP: "🇯🇵",
  AT: "🇦🇹",
  CH: "🇨🇭",
  BE: "🇧🇪",
  NL: "🇳🇱",
  CA: "🇨🇦",
  AU: "🇦🇺",
  MX: "🇲🇽",
  AR: "🇦🇷",
  BR: "🇧🇷",
  EG: "🇪🇬",
  QA: "🇶🇦",
  KW: "🇰🇼",
  CY: "🇨🇾",
};

// Language code to flag emoji mapping
const LANGUAGE_FLAGS: Record<string, string> = {
  TR: "🇹🇷",
  DE: "🇩🇪",
  FR: "🇫🇷",
  RU: "🇷🇺",
  IT: "🇮🇹",
  ES: "🇪🇸",
  EN: "🇬🇧",
  AR: "🇸🇦",
  UK: "🇺🇦",
  JA: "🇯🇵",
};

// Language code to language name
const LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  TR: { TR: "Türkçe", EN: "Turkish", DE: "Türkisch", FR: "Turc", RU: "Турецкий", IT: "Turco", ES: "Turco", AR: "التركية", UK: "Турецька", JA: "トルコ語" },
  EN: { TR: "İngilizce", EN: "English", DE: "Englisch", FR: "Anglais", RU: "Английский", IT: "Inglese", ES: "Inglés", AR: "الإنجليزية", UK: "Англійська", JA: "英語" },
  DE: { TR: "Almanca", EN: "German", DE: "Deutsch", FR: "Allemand", RU: "Немецкий", IT: "Tedesco", ES: "Alemán", AR: "الألمانية", UK: "Німецька", JA: "ドイツ語" },
  FR: { TR: "Fransızca", EN: "French", DE: "Französisch", FR: "Français", RU: "Французский", IT: "Francese", ES: "Francés", AR: "الفرنسية", UK: "Французька", JA: "フランス語" },
  RU: { TR: "Rusça", EN: "Russian", DE: "Russisch", FR: "Russe", RU: "Русский", IT: "Russo", ES: "Ruso", AR: "الروسية", UK: "Російська", JA: "ロシア語" },
  IT: { TR: "İtalyanca", EN: "Italian", DE: "Italienisch", FR: "Italien", RU: "Итальянский", IT: "Italiano", ES: "Italiano", AR: "الإيطالية", UK: "Італійська", JA: "イタリア語" },
  ES: { TR: "İspanyolca", EN: "Spanish", DE: "Spanisch", FR: "Espagnol", RU: "Испанский", IT: "Spagnolo", ES: "Español", AR: "الإسبانية", UK: "Іспанська", JA: "スペイン語" },
  AR: { TR: "Arapça", EN: "Arabic", DE: "Arabisch", FR: "Arabe", RU: "Арабский", IT: "Arabo", ES: "Árabe", AR: "العربية", UK: "Арабська", JA: "アラビア語" },
  UK: { TR: "Ukraynaca", EN: "Ukrainian", DE: "Ukrainisch", FR: "Ukrainien", RU: "Украинский", IT: "Ucraino", ES: "Ucraniano", AR: "الأوكرانية", UK: "Українська", JA: "ウクライナ語" },
  JA: { TR: "Japonca", EN: "Japanese", DE: "Japanisch", FR: "Japonais", RU: "Японский", IT: "Giapponese", ES: "Japonés", AR: "اليابانية", UK: "Японська", JA: "日本語" },
};

const getLocalizedMessage = (language: string): string => {
  const messages: Record<string, string> = {
    TR: "Ben sizin dilinizi konuşuyorum!",
    EN: "I speak your language!",
    DE: "Ich spreche Ihre Sprache!",
    FR: "Je parle votre langue !",
    RU: "Я говорю на вашем языке!",
    IT: "Parlo la tua lingua!",
    ES: "¡Hablo tu idioma!",
    AR: "أنا أتحدث لغتك!",
    UK: "Я говорю вашою мовою!",
    JA: "あなたの言語を話します！",
  };
  return messages[language] || messages.EN;
};

export function ChatLanguageDetectedBanner({
  language,
  countryCode,
  className,
}: ChatLanguageDetectedBannerProps) {
  const flag = countryCode ? COUNTRY_FLAGS[countryCode] : LANGUAGE_FLAGS[language];
  const languageName = LANGUAGE_NAMES[language]?.[language] || language;
  const message = getLocalizedMessage(language);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl",
        "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
        "border border-primary/20",
        "text-sm",
        className
      )}
    >
      {/* Flag and Globe Icon */}
      <motion.div 
        className="flex items-center gap-1.5"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <span className="text-lg">{flag || "🌍"}</span>
        <Globe className="h-3.5 w-3.5 text-primary/70" />
      </motion.div>

      {/* Language Info */}
      <motion.div 
        className="flex flex-col leading-tight"
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="font-semibold text-foreground/90">{languageName}</span>
        <span className="text-xs text-muted-foreground">{message}</span>
      </motion.div>

      {/* Country indicator if available */}
      {countryCode && (
        <motion.div 
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <MapPin className="h-3 w-3" />
          <span>{countryCode}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
