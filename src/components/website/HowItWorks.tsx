import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  MapPin, 
  Shield, 
  Car, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  CreditCard,
  Plane,
  Users,
  Star,
  Headphones
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Complete translations for all 10 languages
const translations: Record<string, {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  cta: string;
  ctaSecondary: string;
  trustBadges: string[];
  steps: Array<{
    number: string;
    title: string;
    desc: string;
    features: string[];
    highlight: string;
  }>;
}> = {
  en: {
    badge: "Easy as 1-2-3",
    title: "Book Your Transfer",
    titleHighlight: "in Minutes",
    subtitle: "Experience seamless airport transfers with our simple 3-step booking process. No hidden fees, no surprises—just premium service from start to finish.",
    cta: "Book Your Transfer",
    ctaSecondary: "View Our Fleet",
    trustBadges: ["Free Cancellation", "24/7 Support", "Fixed Prices"],
    steps: [
      {
        number: "01",
        title: "Choose Your Route",
        desc: "Enter your pickup location (airport, hotel, or any address) and destination. Select your preferred date and time, then view instant pricing for all available vehicles.",
        features: ["Real-time price quotes", "All airports covered", "Door-to-door service"],
        highlight: "Instant pricing",
      },
      {
        number: "02",
        title: "Confirm & Pay Securely",
        desc: "Add passenger details and any special requests (child seats, extra luggage, meet & greet). Complete your booking with our secure payment system and receive instant confirmation.",
        features: ["256-bit SSL encryption", "Multiple payment options", "Instant e-voucher"],
        highlight: "100% secure",
      },
      {
        number: "03",
        title: "Relax & Enjoy",
        desc: "Your professional chauffeur will be waiting with a name board. We monitor your flight in real-time and automatically adjust pickup for any delays—no stress, just comfort.",
        features: ["Flight tracking included", "Meet & greet service", "Licensed chauffeurs"],
        highlight: "Stress-free travel",
      },
    ],
  },
  tr: {
    badge: "1-2-3 Kadar Kolay",
    title: "Transferinizi",
    titleHighlight: "Dakikalar İçinde Rezerve Edin",
    subtitle: "3 adımlık kolay rezervasyon sürecimizle kusursuz havalimanı transferleri deneyimleyin. Gizli ücret yok, sürpriz yok—baştan sona premium hizmet.",
    cta: "Transfer Rezervasyonu Yap",
    ctaSecondary: "Filomuzu Görüntüle",
    trustBadges: ["Ücretsiz İptal", "7/24 Destek", "Sabit Fiyatlar"],
    steps: [
      {
        number: "01",
        title: "Rotanızı Seçin",
        desc: "Alış noktanızı (havalimanı, otel veya herhangi bir adres) ve varış noktanızı girin. Tercih ettiğiniz tarih ve saati seçin, tüm araçlar için anında fiyat görün.",
        features: ["Anlık fiyat teklifi", "Tüm havalimanları", "Kapıdan kapıya hizmet"],
        highlight: "Anında fiyatlandırma",
      },
      {
        number: "02",
        title: "Onaylayın ve Güvenle Ödeyin",
        desc: "Yolcu bilgilerini ve özel isteklerinizi ekleyin (çocuk koltuğu, ekstra bagaj, karşılama). Güvenli ödeme sistemiyle rezervasyonunuzu tamamlayın ve anında onay alın.",
        features: ["256-bit SSL şifreleme", "Çoklu ödeme seçenekleri", "Anında e-voucher"],
        highlight: "%100 güvenli",
      },
      {
        number: "03",
        title: "Rahatlayın ve Keyfini Çıkarın",
        desc: "Profesyonel şoförünüz isim tabelasıyla sizi bekliyor olacak. Uçuşunuzu gerçek zamanlı takip eder, gecikmelerde alış saatini otomatik ayarlarız—stres yok, sadece konfor.",
        features: ["Uçuş takibi dahil", "Karşılama hizmeti", "Lisanslı şoförler"],
        highlight: "Stressiz seyahat",
      },
    ],
  },
  de: {
    badge: "So einfach wie 1-2-3",
    title: "Buchen Sie Ihren Transfer",
    titleHighlight: "in Minuten",
    subtitle: "Erleben Sie nahtlose Flughafentransfers mit unserem einfachen 3-Schritte-Buchungsprozess. Keine versteckten Gebühren, keine Überraschungen—nur Premium-Service von Anfang bis Ende.",
    cta: "Transfer Buchen",
    ctaSecondary: "Unsere Flotte",
    trustBadges: ["Kostenlose Stornierung", "24/7 Support", "Festpreise"],
    steps: [
      {
        number: "01",
        title: "Wählen Sie Ihre Route",
        desc: "Geben Sie Ihren Abholort (Flughafen, Hotel oder beliebige Adresse) und Ihr Ziel ein. Wählen Sie Datum und Uhrzeit und sehen Sie sofortige Preise für alle Fahrzeuge.",
        features: ["Echtzeit-Preisangebote", "Alle Flughäfen", "Tür-zu-Tür-Service"],
        highlight: "Sofortige Preise",
      },
      {
        number: "02",
        title: "Bestätigen & Sicher Bezahlen",
        desc: "Fügen Sie Passagierdaten und Sonderwünsche hinzu (Kindersitze, Gepäck, Meet & Greet). Schließen Sie die Buchung mit unserem sicheren Zahlungssystem ab.",
        features: ["256-Bit SSL-Verschlüsselung", "Mehrere Zahlungsoptionen", "Sofortiger E-Voucher"],
        highlight: "100% sicher",
      },
      {
        number: "03",
        title: "Entspannen & Genießen",
        desc: "Ihr professioneller Chauffeur wartet mit Namensschild. Wir überwachen Ihren Flug in Echtzeit und passen die Abholzeit bei Verspätungen automatisch an.",
        features: ["Flugverfolgung inklusive", "Meet & Greet-Service", "Lizenzierte Chauffeure"],
        highlight: "Stressfreies Reisen",
      },
    ],
  },
  fr: {
    badge: "Simple comme 1-2-3",
    title: "Réservez Votre Transfert",
    titleHighlight: "en Quelques Minutes",
    subtitle: "Découvrez des transferts aéroport fluides avec notre processus de réservation en 3 étapes. Pas de frais cachés, pas de surprises—uniquement un service premium du début à la fin.",
    cta: "Réserver un Transfert",
    ctaSecondary: "Voir Notre Flotte",
    trustBadges: ["Annulation Gratuite", "Support 24/7", "Prix Fixes"],
    steps: [
      {
        number: "01",
        title: "Choisissez Votre Itinéraire",
        desc: "Entrez votre lieu de prise en charge (aéroport, hôtel ou adresse) et votre destination. Sélectionnez date et heure, puis consultez les prix instantanés pour tous les véhicules.",
        features: ["Devis en temps réel", "Tous les aéroports", "Service porte-à-porte"],
        highlight: "Prix instantanés",
      },
      {
        number: "02",
        title: "Confirmez et Payez en Sécurité",
        desc: "Ajoutez les détails des passagers et demandes spéciales (sièges enfants, bagages, accueil). Finalisez avec notre système de paiement sécurisé et recevez une confirmation instantanée.",
        features: ["Cryptage SSL 256-bit", "Options de paiement multiples", "E-voucher instantané"],
        highlight: "100% sécurisé",
      },
      {
        number: "03",
        title: "Détendez-vous et Profitez",
        desc: "Votre chauffeur professionnel vous attend avec une pancarte. Nous suivons votre vol en temps réel et ajustons automatiquement l'heure de prise en charge.",
        features: ["Suivi de vol inclus", "Service d'accueil", "Chauffeurs agréés"],
        highlight: "Voyage sans stress",
      },
    ],
  },
  ru: {
    badge: "Просто как 1-2-3",
    title: "Забронируйте Трансфер",
    titleHighlight: "за Считанные Минуты",
    subtitle: "Оцените безупречные трансферы из аэропорта с нашим простым процессом бронирования в 3 шага. Никаких скрытых платежей, никаких сюрпризов—только премиум-сервис от начала до конца.",
    cta: "Забронировать Трансфер",
    ctaSecondary: "Наш Автопарк",
    trustBadges: ["Бесплатная Отмена", "Поддержка 24/7", "Фиксированные Цены"],
    steps: [
      {
        number: "01",
        title: "Выберите Маршрут",
        desc: "Введите место подачи (аэропорт, отель или любой адрес) и пункт назначения. Выберите дату и время, затем мгновенно узнайте цены на все автомобили.",
        features: ["Цены в реальном времени", "Все аэропорты", "От двери до двери"],
        highlight: "Мгновенные цены",
      },
      {
        number: "02",
        title: "Подтвердите и Оплатите Безопасно",
        desc: "Добавьте данные пассажиров и особые пожелания (детские кресла, багаж, встреча). Завершите бронирование через нашу безопасную систему оплаты.",
        features: ["256-бит SSL шифрование", "Несколько способов оплаты", "Мгновенный e-ваучер"],
        highlight: "100% безопасно",
      },
      {
        number: "03",
        title: "Расслабьтесь и Наслаждайтесь",
        desc: "Ваш профессиональный водитель встретит вас с табличкой. Мы отслеживаем рейс в реальном времени и автоматически корректируем время подачи при задержках.",
        features: ["Отслеживание рейса", "Услуга встречи", "Лицензированные водители"],
        highlight: "Путешествие без стресса",
      },
    ],
  },
  it: {
    badge: "Facile come 1-2-3",
    title: "Prenota il Tuo Transfer",
    titleHighlight: "in Pochi Minuti",
    subtitle: "Sperimenta trasferimenti aeroportuali impeccabili con il nostro semplice processo di prenotazione in 3 passaggi. Nessun costo nascosto, nessuna sorpresa—solo servizio premium dall'inizio alla fine.",
    cta: "Prenota Transfer",
    ctaSecondary: "Vedi la Flotta",
    trustBadges: ["Cancellazione Gratuita", "Supporto 24/7", "Prezzi Fissi"],
    steps: [
      {
        number: "01",
        title: "Scegli il Tuo Percorso",
        desc: "Inserisci il luogo di ritiro (aeroporto, hotel o qualsiasi indirizzo) e la destinazione. Seleziona data e ora, poi visualizza i prezzi istantanei per tutti i veicoli.",
        features: ["Preventivi in tempo reale", "Tutti gli aeroporti", "Servizio porta a porta"],
        highlight: "Prezzi istantanei",
      },
      {
        number: "02",
        title: "Conferma e Paga in Sicurezza",
        desc: "Aggiungi i dettagli dei passeggeri e richieste speciali (seggiolini, bagagli, accoglienza). Completa con il nostro sistema di pagamento sicuro e ricevi conferma istantanea.",
        features: ["Crittografia SSL 256-bit", "Opzioni di pagamento multiple", "E-voucher istantaneo"],
        highlight: "100% sicuro",
      },
      {
        number: "03",
        title: "Rilassati e Goditi il Viaggio",
        desc: "Il tuo autista professionista ti aspetterà con il cartello. Monitoriamo il tuo volo in tempo reale e regoliamo automaticamente l'orario di ritiro per eventuali ritardi.",
        features: ["Monitoraggio volo incluso", "Servizio di accoglienza", "Autisti con licenza"],
        highlight: "Viaggio senza stress",
      },
    ],
  },
  es: {
    badge: "Fácil como 1-2-3",
    title: "Reserve Su Traslado",
    titleHighlight: "en Minutos",
    subtitle: "Experimente traslados aeroportuarios impecables con nuestro sencillo proceso de reserva en 3 pasos. Sin costos ocultos, sin sorpresas—solo servicio premium de principio a fin.",
    cta: "Reservar Traslado",
    ctaSecondary: "Ver Nuestra Flota",
    trustBadges: ["Cancelación Gratuita", "Soporte 24/7", "Precios Fijos"],
    steps: [
      {
        number: "01",
        title: "Elija Su Ruta",
        desc: "Ingrese su punto de recogida (aeropuerto, hotel o cualquier dirección) y destino. Seleccione fecha y hora, luego vea precios instantáneos para todos los vehículos.",
        features: ["Cotizaciones en tiempo real", "Todos los aeropuertos", "Servicio puerta a puerta"],
        highlight: "Precios instantáneos",
      },
      {
        number: "02",
        title: "Confirme y Pague con Seguridad",
        desc: "Agregue detalles de pasajeros y solicitudes especiales (asientos infantiles, equipaje, recepción). Complete con nuestro sistema de pago seguro y reciba confirmación instantánea.",
        features: ["Encriptación SSL 256-bit", "Múltiples opciones de pago", "E-voucher instantáneo"],
        highlight: "100% seguro",
      },
      {
        number: "03",
        title: "Relájese y Disfrute",
        desc: "Su chofer profesional lo esperará con un cartel con su nombre. Monitoreamos su vuelo en tiempo real y ajustamos automáticamente la hora de recogida ante cualquier retraso.",
        features: ["Seguimiento de vuelo incluido", "Servicio de recepción", "Choferes licenciados"],
        highlight: "Viaje sin estrés",
      },
    ],
  },
  ar: {
    badge: "سهل كـ 1-2-3",
    title: "احجز خدمة النقل",
    titleHighlight: "في دقائق",
    subtitle: "استمتع بخدمات نقل المطار السلسة مع عملية الحجز البسيطة المكونة من 3 خطوات. لا رسوم خفية، لا مفاجآت—فقط خدمة متميزة من البداية حتى النهاية.",
    cta: "احجز النقل الآن",
    ctaSecondary: "عرض أسطولنا",
    trustBadges: ["إلغاء مجاني", "دعم 24/7", "أسعار ثابتة"],
    steps: [
      {
        number: "01",
        title: "اختر مسارك",
        desc: "أدخل موقع الاستلام (المطار، الفندق أو أي عنوان) ووجهتك. حدد التاريخ والوقت، ثم اطلع على الأسعار الفورية لجميع المركبات.",
        features: ["عروض أسعار فورية", "جميع المطارات", "خدمة من الباب للباب"],
        highlight: "أسعار فورية",
      },
      {
        number: "02",
        title: "أكّد وادفع بأمان",
        desc: "أضف تفاصيل الركاب والطلبات الخاصة (مقاعد الأطفال، الأمتعة الإضافية، الاستقبال). أكمل الحجز عبر نظام الدفع الآمن واحصل على تأكيد فوري.",
        features: ["تشفير SSL 256 بت", "خيارات دفع متعددة", "قسيمة إلكترونية فورية"],
        highlight: "آمن 100%",
      },
      {
        number: "03",
        title: "استرخِ واستمتع",
        desc: "سائقك المحترف سيكون بانتظارك حاملاً لافتة باسمك. نراقب رحلتك في الوقت الفعلي ونعدّل وقت الاستلام تلقائياً عند أي تأخير.",
        features: ["تتبع الرحلة مشمول", "خدمة الاستقبال", "سائقون مرخصون"],
        highlight: "سفر بدون توتر",
      },
    ],
  },
  uk: {
    badge: "Просто як 1-2-3",
    title: "Забронюйте Трансфер",
    titleHighlight: "за Лічені Хвилини",
    subtitle: "Оцініть бездоганні трансфери з аеропорту з нашим простим процесом бронювання у 3 кроки. Жодних прихованих платежів, жодних сюрпризів—лише преміум-сервіс від початку до кінця.",
    cta: "Забронювати Трансфер",
    ctaSecondary: "Наш Автопарк",
    trustBadges: ["Безкоштовне Скасування", "Підтримка 24/7", "Фіксовані Ціни"],
    steps: [
      {
        number: "01",
        title: "Оберіть Маршрут",
        desc: "Введіть місце подачі (аеропорт, готель або будь-яку адресу) та пункт призначення. Оберіть дату і час, потім миттєво дізнайтеся ціни на всі автомобілі.",
        features: ["Ціни в реальному часі", "Усі аеропорти", "Від дверей до дверей"],
        highlight: "Миттєві ціни",
      },
      {
        number: "02",
        title: "Підтвердіть і Оплатіть Безпечно",
        desc: "Додайте дані пасажирів та особливі побажання (дитячі крісла, багаж, зустріч). Завершіть бронювання через нашу безпечну систему оплати.",
        features: ["256-біт SSL шифрування", "Кілька способів оплати", "Миттєвий e-ваучер"],
        highlight: "100% безпечно",
      },
      {
        number: "03",
        title: "Розслабтеся і Насолоджуйтесь",
        desc: "Ваш професійний водій зустріне вас з табличкою. Ми відстежуємо рейс у реальному часі та автоматично коригуємо час подачі при затримках.",
        features: ["Відстеження рейсу", "Послуга зустрічі", "Ліцензовані водії"],
        highlight: "Подорож без стресу",
      },
    ],
  },
  ja: {
    badge: "1-2-3のように簡単",
    title: "送迎を予約",
    titleHighlight: "数分で完了",
    subtitle: "シンプルな3ステップの予約プロセスで、シームレスな空港送迎をご体験ください。隠れた料金なし、サプライズなし—最初から最後までプレミアムサービス。",
    cta: "送迎を予約する",
    ctaSecondary: "車両一覧を見る",
    trustBadges: ["無料キャンセル", "24時間サポート", "固定料金"],
    steps: [
      {
        number: "01",
        title: "ルートを選択",
        desc: "乗車場所（空港、ホテル、または任意の住所）と目的地を入力。日時を選択し、すべての車両の即時料金を確認できます。",
        features: ["リアルタイム見積もり", "全空港対応", "ドア・ツー・ドア"],
        highlight: "即時料金表示",
      },
      {
        number: "02",
        title: "確認して安全に支払い",
        desc: "乗客情報と特別リクエスト（チャイルドシート、追加荷物、お出迎え）を追加。安全な支払いシステムで予約を完了し、即座に確認を受け取ります。",
        features: ["256ビットSSL暗号化", "複数の支払いオプション", "即時eバウチャー"],
        highlight: "100%安全",
      },
      {
        number: "03",
        title: "リラックスしてお楽しみください",
        desc: "プロのドライバーがネームボードでお待ちしています。フライトをリアルタイムで追跡し、遅延があれば自動的にピックアップ時間を調整します。",
        features: ["フライト追跡込み", "お出迎えサービス", "免許を持つドライバー"],
        highlight: "ストレスフリーな旅",
      },
    ],
  },
};

const stepIcons = [MapPin, CreditCard, Car];
const stepAccents = [
  { bg: "bg-blue-500", ring: "ring-blue-500/20", text: "text-blue-500" },
  { bg: "bg-emerald-500", ring: "ring-emerald-500/20", text: "text-emerald-500" },
  { bg: "bg-amber-500", ring: "ring-amber-500/20", text: "text-amber-500" },
];

const HowItWorks = () => {
  const { getLocalizedPath, language } = useLanguage();
  const lang = language.toLowerCase();
  
  // Get translations for current language, fallback to English
  const t = translations[lang] || translations.en;

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      <div className="container max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6"
          >
            <Sparkles className="h-4 w-4" />
            {t.badge}
          </motion.div>
          
          {/* Title */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            {t.title}{" "}
            <span className="text-primary relative">
              {t.titleHighlight}
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 4 150 4 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30" />
              </svg>
            </span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {t.trustBadges.map((badge, idx) => (
              <motion.div
                key={badge}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-card border rounded-full text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="font-medium">{badge}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />
          
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
            {t.steps.map((step, index) => {
              const StepIcon = stepIcons[index];
              const accent = stepAccents[index];
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative group"
                >
                  {/* Card */}
                  <div className="relative bg-card border rounded-3xl p-8 h-full hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:border-primary/30 hover:-translate-y-2">
                    {/* Step number - top left */}
                    <div className="absolute -top-4 -left-2 md:left-4">
                      <div className={`w-14 h-14 ${accent.bg} rounded-2xl flex items-center justify-center shadow-lg ring-4 ${accent.ring} ring-offset-2 ring-offset-background`}>
                        <span className="text-xl font-bold text-white">{step.number}</span>
                      </div>
                    </div>

                    {/* Highlight badge */}
                    <div className="flex justify-end mb-6">
                      <span className={`text-xs font-semibold ${accent.text} bg-current/10 px-3 py-1 rounded-full`}>
                        {step.highlight}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <StepIcon className={`h-8 w-8 ${accent.text}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl md:text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {step.desc}
                    </p>

                    {/* Features list */}
                    <ul className="space-y-3">
                      {step.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                          <div className={`w-5 h-5 rounded-full ${accent.bg}/10 flex items-center justify-center flex-shrink-0`}>
                            <CheckCircle2 className={`h-3.5 w-3.5 ${accent.text}`} />
                          </div>
                          <span className="text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Arrow connector for mobile */}
                    {index < 2 && (
                      <div className="lg:hidden flex justify-center mt-6 pt-6 border-t border-dashed">
                        <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>

                  {/* Arrow connector for desktop */}
                  {index < 2 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3 z-10">
                      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 text-primary" />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16 md:mt-20"
        >
          <div className="inline-flex flex-col sm:flex-row gap-4 items-center">
            <Link to={getLocalizedPath("/")}>
              <Button size="lg" className="gap-2 px-8 h-14 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                {t.cta}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to={getLocalizedPath("/fleet")}>
              <Button variant="outline" size="lg" className="gap-2 px-8 h-14 text-base font-semibold rounded-xl hover:bg-muted">
                <Car className="h-5 w-5" />
                {t.ctaSecondary}
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>50,000+ Transfers</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              <span>24/7 Support</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
