import { memo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plane, Users, Briefcase } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Import promo banner images
import airportBanner from "@/assets/promo/airport-transfer-banner.webp";
import familyBanner from "@/assets/promo/family-transfer-banner.webp";
import businessBanner from "@/assets/promo/business-transfer-banner.webp";

interface PromoBanner {
  id: string;
  image: string;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  ctaKey: string;
  gradient: string;
  action: "book" | "fleet" | "contact";
}

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "airport",
    image: airportBanner,
    icon: <Plane className="h-6 w-6" />,
    titleKey: "promoAirportTitle",
    descKey: "promoAirportDesc",
    ctaKey: "promoAirportCta",
    gradient: "from-primary/90 via-primary/70 to-transparent",
    action: "book",
  },
  {
    id: "family",
    image: familyBanner,
    icon: <Users className="h-6 w-6" />,
    titleKey: "promoFamilyTitle",
    descKey: "promoFamilyDesc",
    ctaKey: "promoFamilyCta",
    gradient: "from-emerald-600/90 via-emerald-600/70 to-transparent",
    action: "fleet",
  },
  {
    id: "business",
    image: businessBanner,
    icon: <Briefcase className="h-6 w-6" />,
    titleKey: "promoBusinessTitle",
    descKey: "promoBusinessDesc",
    ctaKey: "promoBusinessCta",
    gradient: "from-slate-800/90 via-slate-800/70 to-transparent",
    action: "contact",
  },
];

// Translations for promo banners
const translations: Record<string, Record<string, string>> = {
  en: {
    promoAirportTitle: "Airport Transfer Special",
    promoAirportDesc: "Enjoy 10% off on all airport transfers. Professional drivers, flight tracking included.",
    promoAirportCta: "Book Now",
    promoFamilyTitle: "Family Friendly",
    promoFamilyDesc: "Free child seats available. Safe & comfortable rides for your loved ones.",
    promoFamilyCta: "Learn More",
    promoBusinessTitle: "Corporate Solutions",
    promoBusinessDesc: "Dedicated account managers, priority booking & invoicing for businesses.",
    promoBusinessCta: "Contact Us",
  },
  tr: {
    promoAirportTitle: "Havalimanı Transfer Kampanyası",
    promoAirportDesc: "Tüm havalimanı transferlerinde %10 indirim. Profesyonel sürücüler, uçuş takibi dahil.",
    promoAirportCta: "Hemen Rezervasyon",
    promoFamilyTitle: "Aile Dostu",
    promoFamilyDesc: "Ücretsiz çocuk koltuğu mevcut. Sevdikleriniz için güvenli ve konforlu yolculuk.",
    promoFamilyCta: "Detaylı Bilgi",
    promoBusinessTitle: "Kurumsal Çözümler",
    promoBusinessDesc: "Özel hesap yöneticileri, öncelikli rezervasyon ve kurumsal faturalandırma.",
    promoBusinessCta: "İletişime Geçin",
  },
  de: {
    promoAirportTitle: "Flughafentransfer Angebot",
    promoAirportDesc: "10% Rabatt auf alle Flughafentransfers. Professionelle Fahrer, Flugverfolgung inklusive.",
    promoAirportCta: "Jetzt Buchen",
    promoFamilyTitle: "Familienfreundlich",
    promoFamilyDesc: "Kostenlose Kindersitze verfügbar. Sichere & komfortable Fahrten für Ihre Lieben.",
    promoFamilyCta: "Mehr Erfahren",
    promoBusinessTitle: "Unternehmenslösungen",
    promoBusinessDesc: "Dedizierte Kundenbetreuer, Prioritätsbuchung & Rechnungsstellung für Unternehmen.",
    promoBusinessCta: "Kontaktieren Sie Uns",
  },
  fr: {
    promoAirportTitle: "Offre Transfert Aéroport",
    promoAirportDesc: "Profitez de 10% de réduction sur tous les transferts aéroport. Chauffeurs professionnels, suivi de vol inclus.",
    promoAirportCta: "Réserver",
    promoFamilyTitle: "Adapté aux Familles",
    promoFamilyDesc: "Sièges enfants gratuits disponibles. Trajets sûrs et confortables pour vos proches.",
    promoFamilyCta: "En Savoir Plus",
    promoBusinessTitle: "Solutions Entreprises",
    promoBusinessDesc: "Gestionnaires dédiés, réservation prioritaire et facturation pour les entreprises.",
    promoBusinessCta: "Nous Contacter",
  },
  ru: {
    promoAirportTitle: "Специальное предложение трансфера",
    promoAirportDesc: "Скидка 10% на все трансферы из аэропорта. Профессиональные водители, отслеживание рейсов.",
    promoAirportCta: "Забронировать",
    promoFamilyTitle: "Для всей семьи",
    promoFamilyDesc: "Бесплатные детские кресла. Безопасные и комфортные поездки для ваших близких.",
    promoFamilyCta: "Подробнее",
    promoBusinessTitle: "Корпоративные решения",
    promoBusinessDesc: "Персональные менеджеры, приоритетное бронирование и счета для бизнеса.",
    promoBusinessCta: "Связаться с нами",
  },
  ar: {
    promoAirportTitle: "عرض خاص للنقل من المطار",
    promoAirportDesc: "خصم 10% على جميع خدمات النقل من المطار. سائقون محترفون، تتبع الرحلات.",
    promoAirportCta: "احجز الآن",
    promoFamilyTitle: "مناسب للعائلات",
    promoFamilyDesc: "مقاعد أطفال مجانية متاحة. رحلات آمنة ومريحة لأحبائك.",
    promoFamilyCta: "اعرف المزيد",
    promoBusinessTitle: "حلول الشركات",
    promoBusinessDesc: "مديرو حسابات مخصصون، حجز أولوية وفواتير للشركات.",
    promoBusinessCta: "اتصل بنا",
  },
};

const PromoBannerCarousel = memo(() => {
  const { language, getLocalizedPath } = useLanguage();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const t = (key: string) => {
    const lang = language.toLowerCase();
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  const handleCTAClick = useCallback((action: PromoBanner["action"]) => {
    switch (action) {
      case "book":
        // Scroll to booking form on homepage
        const bookingForm = document.getElementById("booking-form");
        if (bookingForm) {
          bookingForm.scrollIntoView({ behavior: "smooth" });
        } else {
          navigate(getLocalizedPath("/"));
        }
        break;
      case "fleet":
        navigate(getLocalizedPath("/fleet"));
        break;
      case "contact":
        navigate(getLocalizedPath("/contact"));
        break;
    }
  }, [navigate, getLocalizedPath]);

  // Auto-rotate banners
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
  };

  const currentBanner = PROMO_BANNERS[currentIndex];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl">
          {/* Banner Image */}
          <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <img
                  src={currentBanner.image}
                  alt={t(currentBanner.titleKey)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Gradient Overlay */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r",
                  currentBanner.gradient
                )} />
              </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-6 md:px-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`content-${currentIndex}`}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-lg text-white"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        {currentBanner.icon}
                      </div>
                      <span className="text-sm font-medium uppercase tracking-wider opacity-90">
                        Meet Transfer
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                      {t(currentBanner.titleKey)}
                    </h2>
                    <p className="text-base sm:text-lg opacity-90 mb-6 leading-relaxed">
                      {t(currentBanner.descKey)}
                    </p>
                    <button 
                      onClick={() => handleCTAClick(currentBanner.action)}
                      className="px-6 py-3 bg-white text-foreground font-semibold rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {t(currentBanner.ctaKey)}
                    </button>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300 hidden sm:flex items-center justify-center"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300 hidden sm:flex items-center justify-center"
              aria-label="Next banner"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {/* Dots Navigation */}
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {PROMO_BANNERS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    currentIndex === index
                      ? "bg-white w-8"
                      : "bg-white/50 hover:bg-white/70"
                  )}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

PromoBannerCarousel.displayName = "PromoBannerCarousel";

export default PromoBannerCarousel;
