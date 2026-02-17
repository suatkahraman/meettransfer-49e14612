import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Cookie } from "lucide-react";

const translations = {
  en: {
    message: "We use cookies to improve your experience. By continuing to use our site, you accept our cookie policy.",
    accept: "Accept All",
    reject: "Essential Only",
    learnMore: "Learn More",
  },
  tr: {
    message: "Deneyiminizi geliştirmek için çerezler kullanıyoruz. Sitemizi kullanmaya devam ederek çerez politikamızı kabul etmiş olursunuz.",
    accept: "Tümünü Kabul Et",
    reject: "Sadece Gerekli",
    learnMore: "Daha Fazla Bilgi",
  },
  de: {
    message: "Wir verwenden Cookies, um Ihre Erfahrung zu verbessern. Durch die weitere Nutzung unserer Website akzeptieren Sie unsere Cookie-Richtlinie.",
    accept: "Alle akzeptieren",
    reject: "Nur notwendige",
    learnMore: "Mehr erfahren",
  },
  ru: {
    message: "Мы используем файлы cookie для улучшения вашего опыта. Продолжая использовать наш сайт, вы принимаете нашу политику использования файлов cookie.",
    accept: "Принять все",
    reject: "Только необходимые",
    learnMore: "Узнать больше",
  },
  ar: {
    message: "نستخدم ملفات تعريف الارتباط لتحسين تجربتك. من خلال الاستمرار في استخدام موقعنا، فإنك توافق على سياسة ملفات تعريف الارتباط الخاصة بنا.",
    accept: "قبول الكل",
    reject: "الضرورية فقط",
    learnMore: "اعرف المزيد",
  },
  fr: {
    message: "Nous utilisons des cookies pour améliorer votre expérience. En continuant à utiliser notre site, vous acceptez notre politique en matière de cookies.",
    accept: "Tout accepter",
    reject: "Essentiels uniquement",
    learnMore: "En savoir plus",
  },
  es: {
    message: "Utilizamos cookies para mejorar su experiencia. Al continuar utilizando nuestro sitio, acepta nuestra política de cookies.",
    accept: "Aceptar todo",
    reject: "Solo esenciales",
    learnMore: "Más información",
  },
  it: {
    message: "Utilizziamo i cookie per migliorare la tua esperienza. Continuando a utilizzare il nostro sito, accetti la nostra politica sui cookie.",
    accept: "Accetta tutti",
    reject: "Solo essenziali",
    learnMore: "Scopri di più",
  },
  pt: {
    message: "Usamos cookies para melhorar sua experiência. Ao continuar a usar nosso site, você aceita nossa política de cookies.",
    accept: "Aceitar todos",
    reject: "Apenas essenciais",
    learnMore: "Saiba mais",
  },
  nl: {
    message: "We gebruiken cookies om uw ervaring te verbeteren. Door onze site te blijven gebruiken, accepteert u ons cookiebeleid.",
    accept: "Alles accepteren",
    reject: "Alleen essentieel",
    learnMore: "Meer informatie",
  },
  pl: {
    message: "Używamy plików cookie, aby poprawić Twoje doświadczenie. Kontynuując korzystanie z naszej strony, akceptujesz naszą politykę dotyczącą plików cookie.",
    accept: "Zaakceptuj wszystkie",
    reject: "Tylko niezbędne",
    learnMore: "Dowiedz się więcej",
  },
  uk: {
    message: "Ми використовуємо файли cookie для покращення вашого досвіду. Продовжуючи користуватися нашим сайтом, ви приймаєте нашу політику щодо файлів cookie.",
    accept: "Прийняти всі",
    reject: "Лише необхідні",
    learnMore: "Дізнатися більше",
  },
  zh: {
    message: "我们使用 Cookie 来改善您的体验。继续使用我们的网站即表示您接受我们的 Cookie 政策。",
    accept: "接受全部",
    reject: "仅必要",
    learnMore: "了解更多",
  },
  ja: {
    message: "当サイトでは、お客様の体験向上のためにCookieを使用しています。サイトを引き続きご利用いただくことで、Cookieポリシーに同意したものとみなされます。",
    accept: "すべて受け入れる",
    reject: "必要なもののみ",
    learnMore: "詳細を見る",
  },
  ko: {
    message: "당사는 귀하의 경험을 개선하기 위해 쿠키를 사용합니다. 당사 사이트를 계속 사용하시면 쿠키 정책에 동의하시는 것입니다.",
    accept: "모두 수락",
    reject: "필수 항목만",
    learnMore: "자세히 보기",
  },
};

const COOKIE_CONSENT_KEY = "cookie_consent_accepted";

export const CookieConsent = () => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasAccepted) {
      // Small delay to avoid layout shift on initial load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "all");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "essential");
    setIsVisible(false);
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg shadow-lg p-4 md:p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.message}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
            <Button 
              onClick={handleReject}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              {t.reject}
            </Button>
            <Button 
              onClick={handleAccept}
              size="sm"
              className="whitespace-nowrap"
            >
              {t.accept}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
