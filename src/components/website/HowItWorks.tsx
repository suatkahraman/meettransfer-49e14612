import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Shield, Car, ArrowRight, CheckCircle2, Sparkles, Clock, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

// Complete translations for all languages
const translations: Record<string, {
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  steps: Array<{
    title: string;
    desc: string;
    features: string[];
  }>;
}> = {
  en: {
    badge: "Simple Booking Process",
    title: "How It Works",
    subtitle: "Book your premium airport transfer in 3 simple steps. Fast, secure, and hassle-free.",
    cta: "Book Your Transfer Now",
    steps: [
      {
        title: "Enter Your Journey Details",
        desc: "Select pickup and drop-off locations, choose your travel date and time. View all available vehicles with transparent, fixed pricing.",
        features: ["Instant price quote", "All vehicle options", "24/7 availability"],
      },
      {
        title: "Secure Your Booking",
        desc: "Add passenger details and special requests. Complete payment securely and receive instant confirmation with your digital voucher.",
        features: ["256-bit encryption", "Instant confirmation", "Free cancellation"],
      },
      {
        title: "Enjoy Your Transfer",
        desc: "Your professional chauffeur will meet you with a name sign. We track your flight and adjust pickup time for any delays.",
        features: ["Meet & greet service", "Flight monitoring", "Professional drivers"],
      },
    ],
  },
  tr: {
    badge: "Kolay Rezervasyon Süreci",
    title: "Nasıl Çalışır",
    subtitle: "Premium havalimanı transferinizi 3 kolay adımda rezerve edin. Hızlı, güvenli ve zahmetsiz.",
    cta: "Hemen Rezervasyon Yap",
    steps: [
      {
        title: "Yolculuk Detaylarını Girin",
        desc: "Alış ve bırakış noktalarını seçin, seyahat tarihi ve saatinizi belirleyin. Şeffaf ve sabit fiyatlarla tüm araç seçeneklerini görüntüleyin.",
        features: ["Anında fiyat teklifi", "Tüm araç seçenekleri", "7/24 müsaitlik"],
      },
      {
        title: "Rezervasyonunuzu Tamamlayın",
        desc: "Yolcu bilgilerini ve özel isteklerinizi ekleyin. Güvenli ödeme yapın ve dijital voucherınızla anında onay alın.",
        features: ["256-bit şifreleme", "Anında onay", "Ücretsiz iptal"],
      },
      {
        title: "Transferin Keyfini Çıkarın",
        desc: "Profesyonel şoförünüz sizi isim tabelasıyla karşılayacak. Uçuşunuzu takip eder, gecikmelerde alış saatini ayarlarız.",
        features: ["Karşılama hizmeti", "Uçuş takibi", "Profesyonel sürücüler"],
      },
    ],
  },
  de: {
    badge: "Einfacher Buchungsprozess",
    title: "So Funktioniert Es",
    subtitle: "Buchen Sie Ihren Premium-Flughafentransfer in 3 einfachen Schritten. Schnell, sicher und unkompliziert.",
    cta: "Jetzt Transfer Buchen",
    steps: [
      {
        title: "Reisedetails Eingeben",
        desc: "Wählen Sie Abhol- und Zielort, Datum und Uhrzeit. Sehen Sie alle Fahrzeuge mit transparenten Festpreisen.",
        features: ["Sofortiger Preis", "Alle Fahrzeugoptionen", "24/7 verfügbar"],
      },
      {
        title: "Buchung Bestätigen",
        desc: "Fügen Sie Passagierdaten und Sonderwünsche hinzu. Bezahlen Sie sicher und erhalten Sie sofortige Bestätigung.",
        features: ["256-Bit Verschlüsselung", "Sofortige Bestätigung", "Kostenlose Stornierung"],
      },
      {
        title: "Transfer Genießen",
        desc: "Ihr professioneller Chauffeur erwartet Sie mit Namensschild. Wir verfolgen Ihren Flug und passen die Abholzeit an.",
        features: ["Meet & Greet", "Flugüberwachung", "Professionelle Fahrer"],
      },
    ],
  },
  fr: {
    badge: "Processus de Réservation Simple",
    title: "Comment Ça Marche",
    subtitle: "Réservez votre transfert aéroport premium en 3 étapes simples. Rapide, sécurisé et sans tracas.",
    cta: "Réserver Maintenant",
    steps: [
      {
        title: "Entrez Vos Détails de Voyage",
        desc: "Sélectionnez les lieux de prise en charge et de dépose, choisissez date et heure. Consultez tous les véhicules avec prix fixes transparents.",
        features: ["Devis instantané", "Tous les véhicules", "Disponible 24/7"],
      },
      {
        title: "Confirmez Votre Réservation",
        desc: "Ajoutez les détails passagers et demandes spéciales. Payez en sécurité et recevez une confirmation instantanée.",
        features: ["Cryptage 256-bit", "Confirmation instantanée", "Annulation gratuite"],
      },
      {
        title: "Profitez du Transfert",
        desc: "Votre chauffeur professionnel vous accueille avec pancarte nominative. Nous suivons votre vol et ajustons l'heure.",
        features: ["Service d'accueil", "Suivi de vol", "Chauffeurs professionnels"],
      },
    ],
  },
  ru: {
    badge: "Простой Процесс Бронирования",
    title: "Как Это Работает",
    subtitle: "Забронируйте премиум-трансфер из аэропорта за 3 простых шага. Быстро, безопасно и без хлопот.",
    cta: "Забронировать Трансфер",
    steps: [
      {
        title: "Введите Детали Поездки",
        desc: "Выберите места посадки и высадки, дату и время поездки. Посмотрите все автомобили с прозрачными фиксированными ценами.",
        features: ["Мгновенный расчёт", "Все варианты авто", "Доступно 24/7"],
      },
      {
        title: "Подтвердите Бронирование",
        desc: "Добавьте данные пассажиров и особые пожелания. Оплатите безопасно и получите мгновенное подтверждение.",
        features: ["256-бит шифрование", "Мгновенное подтверждение", "Бесплатная отмена"],
      },
      {
        title: "Наслаждайтесь Поездкой",
        desc: "Профессиональный водитель встретит вас с табличкой. Мы отслеживаем рейс и корректируем время при задержках.",
        features: ["Встреча с табличкой", "Отслеживание рейса", "Профессиональные водители"],
      },
    ],
  },
  it: {
    badge: "Processo di Prenotazione Semplice",
    title: "Come Funziona",
    subtitle: "Prenota il tuo transfer aeroportuale premium in 3 semplici passaggi. Veloce, sicuro e senza problemi.",
    cta: "Prenota Ora il Transfer",
    steps: [
      {
        title: "Inserisci i Dettagli del Viaggio",
        desc: "Seleziona i luoghi di ritiro e consegna, scegli data e ora. Visualizza tutti i veicoli con prezzi fissi trasparenti.",
        features: ["Preventivo istantaneo", "Tutte le opzioni veicolo", "Disponibile 24/7"],
      },
      {
        title: "Conferma la Prenotazione",
        desc: "Aggiungi dettagli passeggeri e richieste speciali. Paga in sicurezza e ricevi conferma istantanea.",
        features: ["Crittografia 256-bit", "Conferma istantanea", "Cancellazione gratuita"],
      },
      {
        title: "Goditi il Transfer",
        desc: "L'autista professionista ti accoglierà con cartello nominativo. Monitoriamo il volo e adattiamo l'orario.",
        features: ["Servizio di accoglienza", "Monitoraggio volo", "Autisti professionisti"],
      },
    ],
  },
  es: {
    badge: "Proceso de Reserva Simple",
    title: "Cómo Funciona",
    subtitle: "Reserve su traslado premium al aeropuerto en 3 simples pasos. Rápido, seguro y sin complicaciones.",
    cta: "Reservar Transfer Ahora",
    steps: [
      {
        title: "Ingrese Sus Detalles de Viaje",
        desc: "Seleccione los puntos de recogida y destino, elija fecha y hora. Vea todos los vehículos con precios fijos transparentes.",
        features: ["Cotización instantánea", "Todas las opciones", "Disponible 24/7"],
      },
      {
        title: "Confirme Su Reserva",
        desc: "Agregue datos de pasajeros y solicitudes especiales. Pague de forma segura y reciba confirmación instantánea.",
        features: ["Encriptación 256-bit", "Confirmación instantánea", "Cancelación gratuita"],
      },
      {
        title: "Disfrute del Traslado",
        desc: "Su chofer profesional lo recibirá con cartel con su nombre. Monitoreamos su vuelo y ajustamos el horario.",
        features: ["Servicio de bienvenida", "Seguimiento de vuelo", "Conductores profesionales"],
      },
    ],
  },
  ar: {
    badge: "عملية حجز بسيطة",
    title: "كيف يعمل",
    subtitle: "احجز خدمة النقل المميزة من المطار في 3 خطوات بسيطة. سريع وآمن وبدون متاعب.",
    cta: "احجز النقل الآن",
    steps: [
      {
        title: "أدخل تفاصيل رحلتك",
        desc: "حدد مواقع الاستلام والتوصيل، اختر التاريخ والوقت. عرض جميع المركبات بأسعار ثابتة وشفافة.",
        features: ["عرض سعر فوري", "جميع خيارات المركبات", "متاح 24/7"],
      },
      {
        title: "أكد حجزك",
        desc: "أضف تفاصيل الركاب والطلبات الخاصة. ادفع بأمان واحصل على تأكيد فوري مع قسيمتك الرقمية.",
        features: ["تشفير 256 بت", "تأكيد فوري", "إلغاء مجاني"],
      },
      {
        title: "استمتع بالنقل",
        desc: "سيستقبلك سائقك المحترف بلافتة تحمل اسمك. نتتبع رحلتك ونعدل وقت الاستلام لأي تأخيرات.",
        features: ["خدمة الاستقبال", "تتبع الرحلة", "سائقون محترفون"],
      },
    ],
  },
  uk: {
    badge: "Простий Процес Бронювання",
    title: "Як Це Працює",
    subtitle: "Забронюйте преміум-трансфер з аеропорту за 3 прості кроки. Швидко, безпечно і без клопоту.",
    cta: "Забронювати Трансфер",
    steps: [
      {
        title: "Введіть Деталі Поїздки",
        desc: "Виберіть місця посадки та висадки, дату і час. Перегляньте всі авто з прозорими фіксованими цінами.",
        features: ["Миттєвий розрахунок", "Усі варіанти авто", "Доступно 24/7"],
      },
      {
        title: "Підтвердіть Бронювання",
        desc: "Додайте дані пасажирів та особливі побажання. Оплатіть безпечно та отримайте миттєве підтвердження.",
        features: ["256-біт шифрування", "Миттєве підтвердження", "Безкоштовне скасування"],
      },
      {
        title: "Насолоджуйтесь Поїздкою",
        desc: "Професійний водій зустріне вас з табличкою. Ми відстежуємо рейс і коригуємо час при затримках.",
        features: ["Зустріч з табличкою", "Відстеження рейсу", "Професійні водії"],
      },
    ],
  },
  ja: {
    badge: "シンプルな予約プロセス",
    title: "ご利用方法",
    subtitle: "プレミアム空港送迎を3つの簡単なステップで予約。迅速、安全、手間いらず。",
    cta: "今すぐ送迎を予約",
    steps: [
      {
        title: "旅行の詳細を入力",
        desc: "乗車場所と降車場所を選択し、日時を指定。透明な固定料金ですべての車両オプションを確認できます。",
        features: ["即時見積もり", "全車両オプション", "24時間利用可能"],
      },
      {
        title: "予約を確定",
        desc: "乗客情報と特別なリクエストを追加。安全に支払いを完了し、デジタルバウチャーで即座に確認を受け取ります。",
        features: ["256ビット暗号化", "即時確認", "無料キャンセル"],
      },
      {
        title: "送迎をお楽しみください",
        desc: "プロのドライバーがネームボードでお出迎え。フライトを追跡し、遅延に合わせてピックアップ時間を調整します。",
        features: ["お出迎えサービス", "フライト追跡", "プロのドライバー"],
      },
    ],
  },
};

const stepIcons = [MapPin, Shield, Car];
const stepColors = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600", 
  "from-amber-500 to-orange-600"
];

const HowItWorks = () => {
  const { getLocalizedPath, language } = useLanguage();
  const lang = language.toLowerCase();
  
  // Get translations for current language, fallback to English
  const t = translations[lang] || translations.en;

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
            {t.badge}
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Steps - Timeline Style */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {t.steps.map((step, index) => {
              const StepIcon = stepIcons[index];
              const stepColor = stepColors[index];
              
              return (
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
                    <div className={`absolute inset-0 bg-gradient-to-br ${stepColor} rounded-2xl rotate-6 opacity-80`} />
                    <div className={`relative w-full h-full bg-gradient-to-br ${stepColor} rounded-2xl flex items-center justify-center shadow-xl`}>
                      <StepIcon className="h-7 w-7 text-white" />
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-background border-2 border-primary rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                  </motion.div>

                  {/* Card */}
                  <motion.div 
                    className="bg-card border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-primary/30 group h-full"
                    whileHover={{ y: -4 }}
                  >
                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3 text-center group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-center mb-4 text-sm md:text-base">
                      {step.desc}
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
              );
            })}
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
            {t.cta}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
