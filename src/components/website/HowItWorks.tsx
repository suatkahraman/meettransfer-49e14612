import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, CreditCard, Car, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const lang = language.toLowerCase();

  // Localized feature tags for all supported languages
  const getFeatures = (step: number) => {
    const features: Record<string, string[][]> = {
      en: [
        ["Instant pricing", "All vehicles", "24/7 booking"],
        ["Secure payment", "Instant confirm", "Email voucher"],
        ["Name sign", "Driver info", "Flight tracking"],
      ],
      tr: [
        ["Anında fiyat", "Tüm araçlar", "7/24 rezervasyon"],
        ["Güvenli ödeme", "Anında onay", "E-posta voucher"],
        ["İsim tabelası", "Şoför bilgisi", "Uçuş takibi"],
      ],
      de: [
        ["Sofortpreis", "Alle Fahrzeuge", "24/7 Buchung"],
        ["Sichere Zahlung", "Sofortige Bestätigung", "E-Mail Gutschein"],
        ["Namensschild", "Fahrerinfo", "Flugverfolgung"],
      ],
      fr: [
        ["Prix instantané", "Tous véhicules", "Réservation 24/7"],
        ["Paiement sécurisé", "Confirmation instantanée", "Voucher par e-mail"],
        ["Panneau nominatif", "Info chauffeur", "Suivi de vol"],
      ],
      ru: [
        ["Мгновенная цена", "Все авто", "Бронь 24/7"],
        ["Безопасная оплата", "Мгновенное подтверждение", "Ваучер на e-mail"],
        ["Табличка с именем", "Данные водителя", "Отслеживание рейса"],
      ],
      it: [
        ["Prezzo istantaneo", "Tutti i veicoli", "Prenotazione 24/7"],
        ["Pagamento sicuro", "Conferma istantanea", "Voucher via e-mail"],
        ["Cartello con nome", "Info autista", "Tracciamento volo"],
      ],
      es: [
        ["Precio instantáneo", "Todos los vehículos", "Reserva 24/7"],
        ["Pago seguro", "Confirmación instantánea", "Voucher por e-mail"],
        ["Cartel con nombre", "Info del conductor", "Seguimiento de vuelo"],
      ],
      ar: [
        ["سعر فوري", "جميع المركبات", "حجز 24/7"],
        ["دفع آمن", "تأكيد فوري", "قسيمة بالبريد"],
        ["لافتة باسمك", "بيانات السائق", "تتبع الرحلة"],
      ],
      uk: [
        ["Миттєва ціна", "Всі авто", "Бронювання 24/7"],
        ["Безпечна оплата", "Миттєве підтвердження", "Ваучер на e-mail"],
        ["Табличка з іменем", "Дані водія", "Відстеження рейсу"],
      ],
      ja: [
        ["即時価格", "全車両", "24時間予約"],
        ["安全決済", "即時確認", "メールバウチャー"],
        ["ネームサイン", "ドライバー情報", "フライト追跡"],
      ],
    };
    return features[lang]?.[step] || features.en[step];
  };

  // Localized badge text
  const getBadgeText = () => {
    const badges: Record<string, string> = {
      en: "3 Easy Steps",
      tr: "3 Kolay Adım",
      de: "3 Einfache Schritte",
      fr: "3 Étapes Simples",
      ru: "3 Простых Шага",
      it: "3 Semplici Passaggi",
      es: "3 Pasos Fáciles",
      ar: "3 خطوات سهلة",
      uk: "3 Прості Кроки",
      ja: "3つの簡単なステップ",
    };
    return badges[lang] || badges.en;
  };

  // Localized CTA button text
  const getCtaText = () => {
    const ctas: Record<string, string> = {
      en: "Book Your Transfer Now",
      tr: "Hemen Rezervasyon Yap",
      de: "Jetzt Transfer Buchen",
      fr: "Réservez Maintenant",
      ru: "Забронировать Сейчас",
      it: "Prenota Ora",
      es: "Reserva Ahora",
      ar: "احجز الآن",
      uk: "Забронювати Зараз",
      ja: "今すぐ予約",
    };
    return ctas[lang] || ctas.en;
  };

  const steps = [
    {
      number: "01",
      icon: Search,
      titleKey: "howStep1Title",
      titleFallback: "Select Your Route",
      descKey: "howStep1Desc",
      descFallback: "Enter pickup and dropoff locations, select your preferred date and time. Compare all vehicle options with transparent pricing.",
      color: "from-blue-500 to-indigo-600",
      features: getFeatures(0),
    },
    {
      number: "02",
      icon: CreditCard,
      titleKey: "howStep2Title",
      titleFallback: "Confirm & Pay Securely",
      descKey: "howStep2Desc",
      descFallback: "Add passenger details and any extras. Complete your booking with our secure payment system and receive instant confirmation.",
      color: "from-emerald-500 to-teal-600",
      features: getFeatures(1),
    },
    {
      number: "03",
      icon: Car,
      titleKey: "howStep3Title",
      titleFallback: "Meet Your Chauffeur",
      descKey: "howStep3Desc",
      descFallback: "Receive your driver's details 6 hours before pickup. They'll greet you with a name sign and track your flight for any delays.",
      color: "from-amber-500 to-orange-600",
      features: getFeatures(2),
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            <Sparkles className="h-4 w-4" />
            {getBadgeText()}
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("howItWorks") || "How It Works"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("howItWorksDesc") || "Book your premium airport transfer in just a few clicks"}
          </p>
        </motion.div>

        {/* Steps - Timeline Style */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {/* Step Number Circle */}
                <motion.div 
                  className="relative mx-auto w-16 h-16 mb-6 z-10"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl rotate-6 opacity-80`} />
                  <div className={`relative w-full h-full bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-xl`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-background border-2 border-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{step.number}</span>
                  </div>
                </motion.div>

                {/* Card */}
                <motion.div 
                  className="bg-card border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-primary/30 group"
                  whileHover={{ y: -4 }}
                >
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 text-center group-hover:text-primary transition-colors">
                    {t(step.titleKey) || step.titleFallback}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-center mb-4">
                    {t(step.descKey) || step.descFallback}
                  </p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {step.features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs font-medium"
                      >
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link 
            to={getLocalizedPath("/book")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            {getCtaText()}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
