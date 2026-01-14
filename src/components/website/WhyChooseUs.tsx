import { Clock, Shield, CreditCard, Plane, Baby, Wifi, Car, Award, HeadphonesIcon, XCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoogleReviewStats } from "@/hooks/useGoogleReviewStats";
import { motion } from "framer-motion";

// Complete translations for WhyChooseUs section
const whyTranslations: Record<string, Record<string, string>> = {
  badge: {
    EN: "Trusted Since 2001",
    TR: "2001'den Beri Güvenilir",
    DE: "Vertrauenswürdig Seit 2001",
    FR: "De Confiance Depuis 2001",
    RU: "Надежность с 2001 года",
    IT: "Affidabile Dal 2001",
    ES: "Confiable Desde 2001",
    AR: "موثوق منذ 2001",
    UK: "Надійність з 2001 року",
    JA: "2001年から信頼されています",
  },
  title: {
    EN: "Why Choose",
    TR: "Neden",
    DE: "Warum",
    FR: "Pourquoi Choisir",
    RU: "Почему",
    IT: "Perché Scegliere",
    ES: "Por Qué Elegir",
    AR: "لماذا تختار",
    UK: "Чому",
    JA: "なぜ",
  },
  titleHighlight: {
    EN: "Meet Transfer?",
    TR: "Meet Transfer?",
    DE: "Meet Transfer?",
    FR: "Meet Transfer?",
    RU: "Meet Transfer?",
    IT: "Meet Transfer?",
    ES: "Meet Transfer?",
    AR: "Meet Transfer؟",
    UK: "Meet Transfer?",
    JA: "Meet Transferを選ぶのか?",
  },
  subtitle: {
    EN: "Experience the difference with our premium transfer service. Professional drivers, luxury vehicles, and seamless booking.",
    TR: "Premium transfer hizmetimizle farkı yaşayın. Profesyonel sürücüler, lüks araçlar ve sorunsuz rezervasyon.",
    DE: "Erleben Sie den Unterschied mit unserem Premium-Transferservice. Professionelle Fahrer, Luxusfahrzeuge und nahtlose Buchung.",
    FR: "Vivez la différence avec notre service de transfert premium. Chauffeurs professionnels, véhicules de luxe et réservation sans souci.",
    RU: "Ощутите разницу с нашим премиум-сервисом трансфера. Профессиональные водители, роскошные автомобили и простое бронирование.",
    IT: "Scopri la differenza con il nostro servizio di trasferimento premium. Autisti professionisti, veicoli di lusso e prenotazione senza problemi.",
    ES: "Experimente la diferencia con nuestro servicio de traslado premium. Conductores profesionales, vehículos de lujo y reserva sin problemas.",
    AR: "اختبر الفرق مع خدمة النقل المميزة لدينا. سائقون محترفون، مركبات فاخرة وحجز سلس.",
    UK: "Відчуйте різницю з нашим преміум-сервісом трансферу. Професійні водії, розкішні автомобілі та просте бронювання.",
    JA: "プレミアム送迎サービスで違いを体験してください。プロのドライバー、高級車両、シームレスな予約。",
  },
  yearsExperience: {
    EN: "Years Experience",
    TR: "Yıllık Tecrübe",
    DE: "Jahre Erfahrung",
    FR: "Années d'Expérience",
    RU: "Лет Опыта",
    IT: "Anni di Esperienza",
    ES: "Años de Experiencia",
    AR: "سنوات الخبرة",
    UK: "Років Досвіду",
    JA: "年の経験",
  },
  happyCustomers: {
    EN: "Happy Customers",
    TR: "Mutlu Müşteri",
    DE: "Zufriedene Kunden",
    FR: "Clients Satisfaits",
    RU: "Довольных Клиентов",
    IT: "Clienti Soddisfatti",
    ES: "Clientes Felices",
    AR: "عملاء سعداء",
    UK: "Задоволених Клієнтів",
    JA: "満足した顧客",
  },
  destinations: {
    EN: "Destinations",
    TR: "Destinasyon",
    DE: "Reiseziele",
    FR: "Destinations",
    RU: "Направлений",
    IT: "Destinazioni",
    ES: "Destinos",
    AR: "وجهات",
    UK: "Напрямків",
    JA: "目的地",
  },
  averageRating: {
    EN: "Average Rating",
    TR: "Ortalama Puan",
    DE: "Durchschnittsbewertung",
    FR: "Note Moyenne",
    RU: "Средний Рейтинг",
    IT: "Valutazione Media",
    ES: "Calificación Promedio",
    AR: "التقييم المتوسط",
    UK: "Середній Рейтинг",
    JA: "平均評価",
  },
  freeWaiting: {
    EN: "Free Waiting Time",
    TR: "Ücretsiz Bekleme Süresi",
    DE: "Kostenlose Wartezeit",
    FR: "Temps d'Attente Gratuit",
    RU: "Бесплатное Ожидание",
    IT: "Tempo di Attesa Gratuito",
    ES: "Tiempo de Espera Gratuito",
    AR: "وقت انتظار مجاني",
    UK: "Безкоштовне Очікування",
    JA: "無料待機時間",
  },
  freeWaitingDesc: {
    EN: "60 minutes free waiting for airport pickups, so you can collect luggage without rush",
    TR: "Havalimanı karşılamalarında 60 dakika ücretsiz bekleme, acele etmeden bagajınızı alabilirsiniz",
    DE: "60 Minuten kostenlose Wartezeit bei Flughafenabholungen, damit Sie Ihr Gepäck in Ruhe abholen können",
    FR: "60 minutes d'attente gratuite pour les transferts aéroport, prenez votre temps pour récupérer vos bagages",
    RU: "60 минут бесплатного ожидания в аэропорту, чтобы вы могли спокойно получить багаж",
    IT: "60 minuti di attesa gratuita per i prelievi in aeroporto, così puoi ritirare i bagagli senza fretta",
    ES: "60 minutos de espera gratuita para recogidas en aeropuerto, para que pueda recoger su equipaje sin prisa",
    AR: "60 دقيقة انتظار مجاني لاستقبال المطار، لتتمكن من جمع أمتعتك دون استعجال",
    UK: "60 хвилин безкоштовного очікування в аеропорту, щоб ви могли спокійно отримати багаж",
    JA: "空港送迎で60分の無料待機時間、荷物をゆっくり受け取れます",
  },
  freeCancellation: {
    EN: "Free Cancellation",
    TR: "Ücretsiz İptal",
    DE: "Kostenlose Stornierung",
    FR: "Annulation Gratuite",
    RU: "Бесплатная Отмена",
    IT: "Cancellazione Gratuita",
    ES: "Cancelación Gratuita",
    AR: "إلغاء مجاني",
    UK: "Безкоштовне Скасування",
    JA: "無料キャンセル",
  },
  freeCancellationDesc: {
    EN: "Plans changed? Cancel your booking for free up to 24 hours before pickup",
    TR: "Planlar değişti mi? Alış saatinden 24 saat öncesine kadar ücretsiz iptal edin",
    DE: "Pläne geändert? Stornieren Sie Ihre Buchung kostenlos bis zu 24 Stunden vor der Abholung",
    FR: "Plans changés? Annulez gratuitement jusqu'à 24 heures avant la prise en charge",
    RU: "Планы изменились? Отмените бронирование бесплатно за 24 часа до трансфера",
    IT: "Piani cambiati? Cancella gratuitamente fino a 24 ore prima del prelievo",
    ES: "¿Planes cambiados? Cancele gratis hasta 24 horas antes de la recogida",
    AR: "تغيرت الخطط؟ ألغِ حجزك مجانًا حتى 24 ساعة قبل الاستلام",
    UK: "Плани змінилися? Скасуйте бронювання безкоштовно за 24 години до трансферу",
    JA: "予定変更？出発24時間前まで無料でキャンセル可能",
  },
  flightTracking: {
    EN: "Flight Tracking",
    TR: "Uçuş Takibi",
    DE: "Flugverfolgung",
    FR: "Suivi de Vol",
    RU: "Отслеживание Рейса",
    IT: "Monitoraggio Volo",
    ES: "Seguimiento de Vuelo",
    AR: "تتبع الرحلة",
    UK: "Відстеження Рейсу",
    JA: "フライト追跡",
  },
  flightTrackingDesc: {
    EN: "We monitor your flight in real-time and adjust pickup times for any delays automatically",
    TR: "Uçuşunuzu gerçek zamanlı takip eder, gecikmeler için alış saatini otomatik ayarlarız",
    DE: "Wir überwachen Ihren Flug in Echtzeit und passen die Abholzeiten bei Verspätungen automatisch an",
    FR: "Nous suivons votre vol en temps réel et ajustons automatiquement les horaires en cas de retard",
    RU: "Мы отслеживаем ваш рейс в реальном времени и автоматически корректируем время встречи при задержках",
    IT: "Monitoriamo il tuo volo in tempo reale e adattiamo automaticamente gli orari per eventuali ritardi",
    ES: "Monitoreamos su vuelo en tiempo real y ajustamos automáticamente los horarios para cualquier retraso",
    AR: "نراقب رحلتك في الوقت الفعلي ونضبط أوقات الاستلام تلقائيًا لأي تأخيرات",
    UK: "Ми відстежуємо ваш рейс у реальному часі та автоматично коригуємо час зустрічі при затримках",
    JA: "フライトをリアルタイムで監視し、遅延に自動で対応します",
  },
  noHiddenFees: {
    EN: "No Hidden Fees",
    TR: "Gizli Ücret Yok",
    DE: "Keine Versteckten Gebühren",
    FR: "Pas de Frais Cachés",
    RU: "Без Скрытых Платежей",
    IT: "Nessun Costo Nascosto",
    ES: "Sin Cargos Ocultos",
    AR: "لا رسوم خفية",
    UK: "Без Прихованих Платежів",
    JA: "隠れた料金なし",
  },
  noHiddenFeesDesc: {
    EN: "The price you see is the price you pay. All inclusive with no surprises at the end",
    TR: "Gördüğünüz fiyat ödeyeceğiniz fiyattır. Her şey dahil, sonunda sürpriz yok",
    DE: "Der Preis, den Sie sehen, ist der Preis, den Sie zahlen. Alles inklusive ohne Überraschungen",
    FR: "Le prix que vous voyez est le prix que vous payez. Tout compris sans surprises à la fin",
    RU: "Цена, которую вы видите — это цена, которую вы платите. Все включено без сюрпризов",
    IT: "Il prezzo che vedi è il prezzo che paghi. Tutto incluso senza sorprese alla fine",
    ES: "El precio que ve es el precio que paga. Todo incluido sin sorpresas al final",
    AR: "السعر الذي تراه هو السعر الذي تدفعه. شامل كل شيء بدون مفاجآت في النهاية",
    UK: "Ціна, яку ви бачите — це ціна, яку ви платите. Все включено без сюрпризів",
    JA: "表示価格がお支払い価格です。追加料金なし、すべて込み",
  },
  freeChildSeat: {
    EN: "Free Child Seat",
    TR: "Ücretsiz Çocuk Koltuğu",
    DE: "Kostenloser Kindersitz",
    FR: "Siège Enfant Gratuit",
    RU: "Бесплатное Детское Кресло",
    IT: "Seggiolino Gratuito",
    ES: "Silla Infantil Gratuita",
    AR: "مقعد طفل مجاني",
    UK: "Безкоштовне Дитяче Крісло",
    JA: "無料チャイルドシート",
  },
  freeChildSeatDesc: {
    EN: "Traveling with kids? Request a child seat at no extra cost during booking",
    TR: "Çocuklarla mı seyahat ediyorsunuz? Rezervasyon sırasında ücretsiz çocuk koltuğu talep edin",
    DE: "Reisen mit Kindern? Fordern Sie bei der Buchung kostenlos einen Kindersitz an",
    FR: "Vous voyagez avec des enfants? Demandez un siège enfant gratuitement lors de la réservation",
    RU: "Путешествуете с детьми? Запросите детское кресло бесплатно при бронировании",
    IT: "Viaggi con bambini? Richiedi un seggiolino senza costi aggiuntivi durante la prenotazione",
    ES: "¿Viaja con niños? Solicite una silla infantil sin costo adicional al reservar",
    AR: "تسافر مع أطفال؟ اطلب مقعد طفل مجانًا أثناء الحجز",
    UK: "Подорожуєте з дітьми? Замовте дитяче крісло безкоштовно при бронюванні",
    JA: "お子様連れですか？予約時にチャイルドシートを無料でリクエスト可能",
  },
  freeWifi: {
    EN: "Free WiFi",
    TR: "Ücretsiz WiFi",
    DE: "Kostenloses WLAN",
    FR: "WiFi Gratuit",
    RU: "Бесплатный WiFi",
    IT: "WiFi Gratuito",
    ES: "WiFi Gratuito",
    AR: "واي فاي مجاني",
    UK: "Безкоштовний WiFi",
    JA: "無料WiFi",
  },
  freeWifiDesc: {
    EN: "Stay connected during your journey with complimentary high-speed WiFi in all vehicles",
    TR: "Tüm araçlarımızda ücretsiz yüksek hızlı WiFi ile yolculuğunuz boyunca bağlı kalın",
    DE: "Bleiben Sie während Ihrer Fahrt mit kostenlosem Highspeed-WLAN in allen Fahrzeugen verbunden",
    FR: "Restez connecté pendant votre trajet avec WiFi haut débit gratuit dans tous les véhicules",
    RU: "Оставайтесь на связи во время поездки с бесплатным высокоскоростным WiFi во всех автомобилях",
    IT: "Rimani connesso durante il viaggio con WiFi ad alta velocità gratuito in tutti i veicoli",
    ES: "Manténgase conectado durante su viaje con WiFi de alta velocidad gratuito en todos los vehículos",
    AR: "ابقَ متصلاً خلال رحلتك مع واي فاي عالي السرعة مجاني في جميع المركبات",
    UK: "Залишайтеся на зв'язку під час поїздки з безкоштовним швидкісним WiFi у всіх автомобілях",
    JA: "全車両で無料高速WiFiをご利用いただけます",
  },
  premiumFleet: {
    EN: "Premium Fleet",
    TR: "Premium Filo",
    DE: "Premium-Flotte",
    FR: "Flotte Premium",
    RU: "Премиум Автопарк",
    IT: "Flotta Premium",
    ES: "Flota Premium",
    AR: "أسطول فاخر",
    UK: "Преміум Автопарк",
    JA: "プレミアム車両",
  },
  premiumFleetDesc: {
    EN: "Mercedes-Benz, BMW, and other luxury vehicles. All maintained to the highest standards",
    TR: "Mercedes-Benz, BMW ve diğer lüks araçlar. Tümü en yüksek standartlarda bakımlı",
    DE: "Mercedes-Benz, BMW und andere Luxusfahrzeuge. Alle auf höchstem Niveau gewartet",
    FR: "Mercedes-Benz, BMW et autres véhicules de luxe. Tous entretenus aux normes les plus élevées",
    RU: "Mercedes-Benz, BMW и другие люксовые автомобили. Все обслуживаются по высшим стандартам",
    IT: "Mercedes-Benz, BMW e altri veicoli di lusso. Tutti mantenuti ai massimi standard",
    ES: "Mercedes-Benz, BMW y otros vehículos de lujo. Todos mantenidos con los más altos estándares",
    AR: "مرسيدس بنز، بي إم دبليو وسيارات فاخرة أخرى. جميعها بأعلى معايير الصيانة",
    UK: "Mercedes-Benz, BMW та інші люксові автомобілі. Всі обслуговуються за найвищими стандартами",
    JA: "メルセデス・ベンツ、BMWなど高級車両。すべて最高水準で維持管理",
  },
  support247: {
    EN: "24/7 Support",
    TR: "7/24 Destek",
    DE: "24/7 Support",
    FR: "Support 24h/24",
    RU: "Поддержка 24/7",
    IT: "Supporto 24/7",
    ES: "Soporte 24/7",
    AR: "دعم على مدار الساعة",
    UK: "Підтримка 24/7",
    JA: "24時間サポート",
  },
  support247Desc: {
    EN: "Our customer support team is available around the clock via phone, chat, or WhatsApp",
    TR: "Müşteri destek ekibimiz telefon, chat veya WhatsApp ile 7/24 hizmetinizde",
    DE: "Unser Kundensupport-Team ist rund um die Uhr per Telefon, Chat oder WhatsApp erreichbar",
    FR: "Notre équipe de support client est disponible 24h/24 par téléphone, chat ou WhatsApp",
    RU: "Наша служба поддержки работает круглосуточно по телефону, в чате или WhatsApp",
    IT: "Il nostro team di supporto clienti è disponibile 24/7 via telefono, chat o WhatsApp",
    ES: "Nuestro equipo de soporte está disponible las 24 horas por teléfono, chat o WhatsApp",
    AR: "فريق دعم العملاء لدينا متاح على مدار الساعة عبر الهاتف أو الدردشة أو واتساب",
    UK: "Наша служба підтримки працює цілодобово по телефону, в чаті або WhatsApp",
    JA: "カスタマーサポートチームが電話、チャット、WhatsAppで24時間対応",
  },
};

interface Benefit {
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  highlight?: string;
  gradient: string;
  iconColor: string;
}

const benefits: Benefit[] = [
  {
    icon: Clock,
    titleKey: "freeWaiting",
    descKey: "freeWaitingDesc",
    highlight: "60 min",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: XCircle,
    titleKey: "freeCancellation",
    descKey: "freeCancellationDesc",
    highlight: "Free",
    gradient: "from-red-500/20 to-pink-500/20",
    iconColor: "text-red-500",
  },
  {
    icon: Plane,
    titleKey: "flightTracking",
    descKey: "flightTrackingDesc",
    gradient: "from-purple-500/20 to-indigo-500/20",
    iconColor: "text-purple-500",
  },
  {
    icon: CreditCard,
    titleKey: "noHiddenFees",
    descKey: "noHiddenFeesDesc",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500",
  },
  {
    icon: Baby,
    titleKey: "freeChildSeat",
    descKey: "freeChildSeatDesc",
    gradient: "from-amber-500/20 to-yellow-500/20",
    iconColor: "text-amber-500",
  },
  {
    icon: Wifi,
    titleKey: "freeWifi",
    descKey: "freeWifiDesc",
    gradient: "from-cyan-500/20 to-sky-500/20",
    iconColor: "text-cyan-500",
  },
  {
    icon: Car,
    titleKey: "premiumFleet",
    descKey: "premiumFleetDesc",
    gradient: "from-slate-500/20 to-zinc-500/20",
    iconColor: "text-slate-600",
  },
  {
    icon: HeadphonesIcon,
    titleKey: "support247",
    descKey: "support247Desc",
    gradient: "from-teal-500/20 to-green-500/20",
    iconColor: "text-teal-500",
  },
];

const WhyChooseUs = () => {
  const { language } = useLanguage();
  const { rating } = useGoogleReviewStats();
  const lang = language || "EN";

  const wt = (key: string) => whyTranslations[key]?.[lang] || whyTranslations[key]?.["EN"] || key;

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 relative z-10">
        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column - Header & Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-24"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6"
            >
              <Award className="h-4 w-4" />
              {wt("badge")}
            </motion.div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {wt("title")}{" "}
              <span className="text-primary">{wt("titleHighlight")}</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              {wt("subtitle")}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "25+", label: wt("yearsExperience") },
                { value: "50K+", label: wt("happyCustomers") },
                { value: "15+", label: wt("destinations") },
                { value: rating.toFixed(1), label: wt("averageRating") },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="p-5 bg-card rounded-2xl border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Benefits */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group flex items-start gap-4 p-5 bg-card rounded-xl border hover:border-primary/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${benefit.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${benefit.iconColor}`} />
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {wt(benefit.titleKey)}
                      </h3>
                      {benefit.highlight && (
                        <span className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                          {benefit.highlight}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {wt(benefit.descKey)}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1 relative z-10" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
