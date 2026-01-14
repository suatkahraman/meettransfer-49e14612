import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Users, Clock, Building2, ArrowRight, Sparkles, Shield, Star, Zap, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

// Translations for CoreServices
const coreTranslations: Record<string, Record<string, string>> = {
  coreServices: {
    EN: "Complete Transfer Solutions",
    TR: "Eksiksiz Transfer Çözümleri",
    DE: "Komplette Transferlösungen",
    FR: "Solutions de Transfert Complètes",
    RU: "Комплексные Трансферные Решения",
    IT: "Soluzioni di Trasferimento Complete",
    ES: "Soluciones de Traslado Completas",
    AR: "حلول النقل الكاملة",
    UK: "Комплексні Трансферні Рішення",
    JA: "完全な送迎ソリューション",
  },
  coreServicesDesc: {
    EN: "From airport pickups to hourly chauffeur service, we deliver premium transportation tailored to your every need",
    TR: "Havalimanı transferlerinden saatlik şoförlü hizmete kadar, her ihtiyacınıza özel premium ulaşım çözümleri sunuyoruz",
    DE: "Von Flughafen-Abholungen bis zum stündlichen Chauffeurservice bieten wir erstklassigen Transport nach Ihren Wünschen",
    FR: "Des transferts aéroport au service de chauffeur à l'heure, nous offrons un transport premium adapté à chaque besoin",
    RU: "От встречи в аэропорту до почасовой услуги шофера — премиальный транспорт под ваши потребности",
    IT: "Dai prelievi aeroportuali al servizio autista a ore, offriamo trasporti premium su misura per ogni esigenza",
    ES: "Desde recogidas en aeropuerto hasta servicio de chófer por horas, transporte premium adaptado a sus necesidades",
    AR: "من الاستقبال في المطار إلى خدمة السائق بالساعة، نقدم نقل فاخر مصمم لكل احتياجاتك",
    UK: "Від зустрічей в аеропорту до погодинних послуг шофера — преміальний транспорт під ваші потреби",
    JA: "空港送迎から時間制ドライバーサービスまで、あらゆるニーズに合わせたプレミアム送迎",
  },
  premiumServices: {
    EN: "Premium Services",
    TR: "Premium Hizmetler",
    DE: "Premium-Dienste",
    FR: "Services Premium",
    RU: "Премиум Услуги",
    IT: "Servizi Premium",
    ES: "Servicios Premium",
    AR: "الخدمات المميزة",
    UK: "Преміум Послуги",
    JA: "プレミアムサービス",
  },
  airportTransfers: {
    EN: "Airport Transfers",
    TR: "Havalimanı Transferi",
    DE: "Flughafentransfers",
    FR: "Transferts Aéroport",
    RU: "Трансферы из Аэропорта",
    IT: "Trasferimenti Aeroportuali",
    ES: "Traslados al Aeropuerto",
    AR: "نقل المطار",
    UK: "Трансфери з Аеропорту",
    JA: "空港送迎",
  },
  airportTransfersDesc: {
    EN: "Seamless door-to-door airport transfers with real-time flight tracking and professional meet & greet service",
    TR: "Gerçek zamanlı uçuş takibi ve profesyonel karşılama hizmeti ile kapıdan kapıya sorunsuz havalimanı transferi",
    DE: "Nahtloser Tür-zu-Tür-Flughafentransfer mit Echtzeit-Flugverfolgung und professionellem Begrüßungsservice",
    FR: "Transferts aéroport porte-à-porte avec suivi de vol en temps réel et service d'accueil professionnel",
    RU: "Бесшовные трансферы от двери до двери с отслеживанием рейса и профессиональной встречей",
    IT: "Trasferimenti aeroportuali porta a porta con monitoraggio volo e servizio di accoglienza professionale",
    ES: "Traslados aeropuerto puerta a puerta con seguimiento de vuelos y servicio de bienvenida profesional",
    AR: "نقل سلس من الباب إلى الباب مع تتبع الرحلات في الوقت الفعلي وخدمة استقبال احترافية",
    UK: "Безперешкодні трансфери від дверей до дверей з відстеженням рейсу та професійною зустріччю",
    JA: "リアルタイムフライト追跡とプロフェッショナルな出迎えサービスによるドアツードア空港送迎",
  },
  privateTransfers: {
    EN: "Private Transfers",
    TR: "Özel Transfer",
    DE: "Privattransfers",
    FR: "Transferts Privés",
    RU: "Частные Трансферы",
    IT: "Trasferimenti Privati",
    ES: "Traslados Privados",
    AR: "النقل الخاص",
    UK: "Приватні Трансфери",
    JA: "プライベート送迎",
  },
  privateTransfersDesc: {
    EN: "Exclusive point-to-point transfers with experienced professional drivers and fixed transparent pricing",
    TR: "Deneyimli profesyonel sürücüler ve sabit şeffaf fiyatlandırma ile özel noktadan noktaya transfer",
    DE: "Exklusive Punkt-zu-Punkt-Transfers mit erfahrenen professionellen Fahrern und festen transparenten Preisen",
    FR: "Transferts exclusifs point à point avec chauffeurs professionnels expérimentés et tarification transparente",
    RU: "Эксклюзивные трансферы от точки до точки с опытными водителями и фиксированными ценами",
    IT: "Trasferimenti esclusivi punto a punto con autisti professionisti esperti e prezzi fissi trasparenti",
    ES: "Traslados exclusivos punto a punto con conductores profesionales y precios fijos transparentes",
    AR: "نقل حصري من نقطة إلى نقطة مع سائقين محترفين ذوي خبرة وأسعار ثابتة وشفافة",
    UK: "Ексклюзивні трансфери від точки до точки з досвідченими водіями та фіксованими цінами",
    JA: "経験豊富なプロドライバーと透明な固定価格による専用ポイントツーポイント送迎",
  },
  hourlyChauffeur: {
    EN: "Hourly Chauffeur",
    TR: "Saatlik Kiralama",
    DE: "Stündlicher Chauffeur",
    FR: "Chauffeur à l'Heure",
    RU: "Почасовой Шофер",
    IT: "Autista a Ore",
    ES: "Chófer por Horas",
    AR: "سائق بالساعة",
    UK: "Погодинний Шофер",
    JA: "時間制ドライバー",
  },
  hourlyChauffeurDesc: {
    EN: "Flexible hourly chauffeur service ideal for business meetings, city tours, or special events",
    TR: "İş toplantıları, şehir turları veya özel etkinlikler için ideal esnek saatlik şoför hizmeti",
    DE: "Flexibler stündlicher Chauffeurservice ideal für Geschäftstermine, Stadttouren oder besondere Anlässe",
    FR: "Service de chauffeur à l'heure flexible, idéal pour réunions d'affaires, visites de ville ou événements spéciaux",
    RU: "Гибкий почасовой сервис шофера для деловых встреч, городских туров или особых мероприятий",
    IT: "Servizio autista a ore flessibile ideale per riunioni di lavoro, tour della città o eventi speciali",
    ES: "Servicio de chófer por horas flexible ideal para reuniones de negocios, tours de ciudad o eventos especiales",
    AR: "خدمة سائق مرنة بالساعة مثالية للاجتماعات التجارية أو جولات المدينة أو المناسبات الخاصة",
    UK: "Гнучкий погодинний сервіс шофера для ділових зустрічей, міських турів або особливих подій",
    JA: "ビジネスミーティング、シティツアー、特別イベントに最適なフレキシブル時間制ドライバーサービス",
  },
  intercityRides: {
    EN: "Intercity Rides",
    TR: "Şehirlerarası Transfer",
    DE: "Überlandfahrten",
    FR: "Trajets Interurbains",
    RU: "Междугородние Поездки",
    IT: "Viaggi Interurbani",
    ES: "Viajes Interurbanos",
    AR: "الرحلات بين المدن",
    UK: "Міжміські Поїздки",
    JA: "都市間移動",
  },
  intercityRidesDesc: {
    EN: "Comfortable long-distance transfers between cities with luxury vehicles and experienced drivers",
    TR: "Lüks araçlar ve deneyimli sürücülerle şehirler arası konforlu uzun mesafe transferleri",
    DE: "Komfortable Langstrecken-Transfers zwischen Städten mit Luxusfahrzeugen und erfahrenen Fahrern",
    FR: "Transferts longue distance confortables entre villes avec véhicules de luxe et chauffeurs expérimentés",
    RU: "Комфортные междугородние трансферы на люксовых автомобилях с опытными водителями",
    IT: "Trasferimenti confortevoli a lunga distanza tra città con veicoli di lusso e autisti esperti",
    ES: "Traslados cómodos de larga distancia entre ciudades con vehículos de lujo y conductores expertos",
    AR: "نقل مريح لمسافات طويلة بين المدن مع سيارات فاخرة وسائقين ذوي خبرة",
    UK: "Комфортні міжміські трансфери на люксових автомобілях з досвідченими водіями",
    JA: "高級車両と経験豊富なドライバーによる都市間快適長距離送迎",
  },
  flightTracking: {
    EN: "Flight tracking",
    TR: "Uçuş takibi",
    DE: "Flugverfolgung",
    FR: "Suivi de vol",
    RU: "Отслеживание рейса",
    IT: "Monitoraggio volo",
    ES: "Seguimiento de vuelo",
    AR: "تتبع الرحلة",
    UK: "Відстеження рейсу",
    JA: "フライト追跡",
  },
  meetGreet: {
    EN: "Meet & greet",
    TR: "Karşılama hizmeti",
    DE: "Begrüßungsservice",
    FR: "Accueil personnalisé",
    RU: "Встреча с табличкой",
    IT: "Servizio di accoglienza",
    ES: "Servicio de bienvenida",
    AR: "خدمة الاستقبال",
    UK: "Зустріч з табличкою",
    JA: "お出迎えサービス",
  },
  freeWaiting: {
    EN: "Free waiting",
    TR: "Ücretsiz bekleme",
    DE: "Kostenlose Wartezeit",
    FR: "Attente gratuite",
    RU: "Бесплатное ожидание",
    IT: "Attesa gratuita",
    ES: "Espera gratuita",
    AR: "انتظار مجاني",
    UK: "Безкоштовне очікування",
    JA: "無料待機",
  },
  professionalDrivers: {
    EN: "Professional drivers",
    TR: "Profesyonel şoförler",
    DE: "Professionelle Fahrer",
    FR: "Chauffeurs professionnels",
    RU: "Профессиональные водители",
    IT: "Autisti professionisti",
    ES: "Conductores profesionales",
    AR: "سائقون محترفون",
    UK: "Професійні водії",
    JA: "プロのドライバー",
  },
  fixedPrices: {
    EN: "Fixed prices",
    TR: "Sabit fiyatlar",
    DE: "Festpreise",
    FR: "Prix fixes",
    RU: "Фиксированные цены",
    IT: "Prezzi fissi",
    ES: "Precios fijos",
    AR: "أسعار ثابتة",
    UK: "Фіксовані ціни",
    JA: "固定価格",
  },
  service247: {
    EN: "24/7 service",
    TR: "7/24 hizmet",
    DE: "24/7 Service",
    FR: "Service 24h/24",
    RU: "Сервис 24/7",
    IT: "Servizio 24/7",
    ES: "Servicio 24/7",
    AR: "خدمة 24/7",
    UK: "Сервіс 24/7",
    JA: "24時間サービス",
  },
  flexibleHours: {
    EN: "Flexible hours",
    TR: "Esnek saatler",
    DE: "Flexible Stunden",
    FR: "Horaires flexibles",
    RU: "Гибкие часы",
    IT: "Orari flessibili",
    ES: "Horarios flexibles",
    AR: "ساعات مرنة",
    UK: "Гнучкі години",
    JA: "フレキシブルな時間",
  },
  dedicatedDriver: {
    EN: "Dedicated driver",
    TR: "Özel şoför",
    DE: "Persönlicher Fahrer",
    FR: "Chauffeur dédié",
    RU: "Персональный водитель",
    IT: "Autista dedicato",
    ES: "Conductor dedicado",
    AR: "سائق مخصص",
    UK: "Персональний водій",
    JA: "専属ドライバー",
  },
  multipleStops: {
    EN: "Multiple stops",
    TR: "Çoklu durak",
    DE: "Mehrere Stopps",
    FR: "Arrêts multiples",
    RU: "Несколько остановок",
    IT: "Fermate multiple",
    ES: "Múltiples paradas",
    AR: "توقفات متعددة",
    UK: "Кілька зупинок",
    JA: "複数の停車地点",
  },
  longDistance: {
    EN: "Long distance",
    TR: "Uzun mesafe",
    DE: "Langstrecke",
    FR: "Longue distance",
    RU: "Дальние расстояния",
    IT: "Lunga distanza",
    ES: "Larga distancia",
    AR: "مسافات طويلة",
    UK: "Далекі відстані",
    JA: "長距離",
  },
  luxuryComfort: {
    EN: "Luxury comfort",
    TR: "Lüks konfor",
    DE: "Luxuriöser Komfort",
    FR: "Confort luxueux",
    RU: "Роскошный комфорт",
    IT: "Comfort di lusso",
    ES: "Confort de lujo",
    AR: "راحة فاخرة",
    UK: "Розкішний комфорт",
    JA: "ラグジュアリーな快適さ",
  },
  doorToDoor: {
    EN: "Door-to-door",
    TR: "Kapıdan kapıya",
    DE: "Tür zu Tür",
    FR: "Porte à porte",
    RU: "От двери до двери",
    IT: "Porta a porta",
    ES: "Puerta a puerta",
    AR: "من الباب إلى الباب",
    UK: "Від дверей до дверей",
    JA: "ドアツードア",
  },
  learnMore: {
    EN: "Learn More",
    TR: "Daha Fazla",
    DE: "Mehr erfahren",
    FR: "En savoir plus",
    RU: "Узнать больше",
    IT: "Scopri di più",
    ES: "Saber más",
    AR: "اعرف المزيد",
    UK: "Дізнатися більше",
    JA: "詳細を見る",
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
  onTimeArrivals: {
    EN: "On-Time Arrivals",
    TR: "Zamanında Varış",
    DE: "Pünktliche Ankünfte",
    FR: "Arrivées à l'heure",
    RU: "Прибытие вовремя",
    IT: "Arrivi Puntuali",
    ES: "Llegadas Puntuales",
    AR: "الوصول في الوقت المحدد",
    UK: "Прибуття вчасно",
    JA: "定時到着",
  },
  averageRating: {
    EN: "Average Rating",
    TR: "Ortalama Puan",
    DE: "Durchschnittsbewertung",
    FR: "Note Moyenne",
    RU: "Средний рейтинг",
    IT: "Valutazione Media",
    ES: "Calificación Promedio",
    AR: "التقييم المتوسط",
    UK: "Середній рейтинг",
    JA: "平均評価",
  },
  insuredVehicles: {
    EN: "Insured Vehicles",
    TR: "Sigortalı Araçlar",
    DE: "Versicherte Fahrzeuge",
    FR: "Véhicules Assurés",
    RU: "Застрахованные Авто",
    IT: "Veicoli Assicurati",
    ES: "Vehículos Asegurados",
    AR: "مركبات مؤمنة",
    UK: "Застраховані Авто",
    JA: "保険付き車両",
  },
  instantConfirmation: {
    EN: "Instant Confirmation",
    TR: "Anında Onay",
    DE: "Sofortige Bestätigung",
    FR: "Confirmation Instantanée",
    RU: "Мгновенное Подтверждение",
    IT: "Conferma Istantanea",
    ES: "Confirmación Instantánea",
    AR: "تأكيد فوري",
    UK: "Миттєве Підтвердження",
    JA: "即時確認",
  },
  fiveStarService: {
    EN: "5-Star Service",
    TR: "5 Yıldızlı Hizmet",
    DE: "5-Sterne-Service",
    FR: "Service 5 Étoiles",
    RU: "5-звездочный Сервис",
    IT: "Servizio 5 Stelle",
    ES: "Servicio 5 Estrellas",
    AR: "خدمة 5 نجوم",
    UK: "5-зірковий Сервіс",
    JA: "5つ星サービス",
  },
};

const CoreServices = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const lang = language || "EN";

  // Helper function for translations
  const ct = (key: string) => coreTranslations[key]?.[lang] || coreTranslations[key]?.["EN"] || key;

  const services = [
    {
      icon: Globe,
      title: ct("airportTransfers"),
      desc: ct("airportTransfersDesc"),
      link: "/destinations",
      features: [
        ct("flightTracking"),
        ct("meetGreet"),
        ct("freeWaiting"),
      ],
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-500",
    },
    {
      icon: Users,
      title: ct("privateTransfers"),
      desc: ct("privateTransfersDesc"),
      link: "/about",
      features: [
        ct("professionalDrivers"),
        ct("fixedPrices"),
        ct("service247"),
      ],
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-500",
    },
    {
      icon: Clock,
      title: ct("hourlyChauffeur"),
      desc: ct("hourlyChauffeurDesc"),
      link: "/services",
      features: [
        ct("flexibleHours"),
        ct("dedicatedDriver"),
        ct("multipleStops"),
      ],
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-500",
    },
    {
      icon: Building2,
      title: ct("intercityRides"),
      desc: ct("intercityRidesDesc"),
      link: "/services",
      features: [
        ct("longDistance"),
        ct("luxuryComfort"),
        ct("doorToDoor"),
      ],
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-500",
    },
  ];

  const stats = [
    { value: "50K+", label: ct("happyCustomers") },
    { value: "99%", label: ct("onTimeArrivals") },
    { value: "4.9", label: ct("averageRating"), icon: Star },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="h-4 w-4" />
            {ct("premiumServices")}
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {ct("coreServices")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {ct("coreServicesDesc")}
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={getLocalizedPath(service.link)}
                className="group block h-full"
              >
                <div className="relative p-6 bg-card rounded-2xl border hover:border-primary/30 hover:shadow-2xl transition-all duration-500 h-full overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <motion.div 
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <service.icon className={`h-7 w-7 ${service.iconColor}`} />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {service.desc}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-2 mb-4">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Learn more link */}
                    <div className="flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                      {ct("learnMore")}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="text-center p-4 rounded-2xl bg-card border"
            >
              <div className="flex items-center justify-center gap-1 text-2xl md:text-3xl font-bold text-primary mb-1">
                {stat.icon && <stat.icon className="h-5 w-5 fill-primary" />}
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          {[
            { icon: Shield, text: ct("insuredVehicles") },
            { icon: Zap, text: ct("instantConfirmation") },
            { icon: Star, text: ct("fiveStarService") },
          ].map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground"
            >
              <badge.icon className="h-4 w-4 text-primary" />
              {badge.text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CoreServices;
