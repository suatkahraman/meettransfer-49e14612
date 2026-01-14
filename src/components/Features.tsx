import { Shield, Clock, Star, Headphones, Sparkles, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

// Complete translations for Features section
const featureTranslations: Record<string, Record<string, string>> = {
  badge: {
    EN: "Why Choose Us",
    TR: "Neden Bizi Seçmelisiniz",
    DE: "Warum Uns Wählen",
    FR: "Pourquoi Nous Choisir",
    RU: "Почему Мы",
    IT: "Perché Sceglierci",
    ES: "Por Qué Elegirnos",
    AR: "لماذا تختارنا",
    UK: "Чому Ми",
    JA: "私たちを選ぶ理由",
  },
  title: {
    EN: "Premium Transfer",
    TR: "Premium Transfer",
    DE: "Premium Transfer",
    FR: "Transfert Premium",
    RU: "Премиум Трансфер",
    IT: "Trasferimento Premium",
    ES: "Traslado Premium",
    AR: "نقل فاخر",
    UK: "Преміум Трансфер",
    JA: "プレミアム送迎",
  },
  titleHighlight: {
    EN: "Experience",
    TR: "Deneyimi",
    DE: "Erlebnis",
    FR: "Expérience",
    RU: "Опыт",
    IT: "Esperienza",
    ES: "Experiencia",
    AR: "تجربة",
    UK: "Досвід",
    JA: "体験",
  },
  subtitle: {
    EN: "Discover why thousands of travelers trust us for their airport transfers and private transportation needs",
    TR: "Binlerce yolcunun havalimanı transferleri ve özel ulaşım ihtiyaçları için neden bize güvendiğini keşfedin",
    DE: "Entdecken Sie, warum Tausende von Reisenden uns für ihre Flughafentransfers und privaten Transportbedürfnisse vertrauen",
    FR: "Découvrez pourquoi des milliers de voyageurs nous font confiance pour leurs transferts aéroport et leurs besoins de transport privé",
    RU: "Узнайте, почему тысячи путешественников доверяют нам трансферы из аэропорта и частные перевозки",
    IT: "Scopri perché migliaia di viaggiatori ci affidano i loro trasferimenti aeroportuali e le esigenze di trasporto privato",
    ES: "Descubra por qué miles de viajeros confían en nosotros para sus traslados al aeropuerto y necesidades de transporte privado",
    AR: "اكتشف لماذا يثق بنا آلاف المسافرين في نقلهم من المطار واحتياجات النقل الخاص",
    UK: "Дізнайтеся, чому тисячі мандрівників довіряють нам трансфери з аеропорту та приватні перевезення",
    JA: "何千人もの旅行者が空港送迎とプライベート交通のニーズに私たちを信頼する理由をご覧ください",
  },
  safeSecure: {
    EN: "Safe & Secure",
    TR: "Güvenli & Emniyetli",
    DE: "Sicher & Geschützt",
    FR: "Sûr & Sécurisé",
    RU: "Безопасно & Надежно",
    IT: "Sicuro & Protetto",
    ES: "Seguro & Protegido",
    AR: "آمن ومضمون",
    UK: "Безпечно & Надійно",
    JA: "安全 & セキュア",
  },
  safeSecureDesc: {
    EN: "Fully licensed, insured vehicles with professional, vetted drivers for your peace of mind",
    TR: "Tam lisanslı, sigortalı araçlar ve huzurunuz için profesyonel, kontrol edilmiş sürücüler",
    DE: "Vollständig lizenzierte, versicherte Fahrzeuge mit professionellen, geprüften Fahrern für Ihre Sicherheit",
    FR: "Véhicules entièrement agréés et assurés avec des chauffeurs professionnels vérifiés pour votre tranquillité",
    RU: "Полностью лицензированные, застрахованные автомобили с профессиональными проверенными водителями",
    IT: "Veicoli completamente autorizzati e assicurati con autisti professionisti verificati per la vostra tranquillità",
    ES: "Vehículos totalmente autorizados y asegurados con conductores profesionales verificados para su tranquilidad",
    AR: "مركبات مرخصة بالكامل ومؤمنة مع سائقين محترفين موثوقين لراحة بالك",
    UK: "Повністю ліцензовані, застраховані автомобілі з професійними перевіреними водіями для вашого спокою",
    JA: "完全認可・保険付き車両と、安心のためのプロの審査済みドライバー",
  },
  availability247: {
    EN: "24/7 Availability",
    TR: "7/24 Hizmet",
    DE: "24/7 Verfügbarkeit",
    FR: "Disponibilité 24h/24",
    RU: "Доступность 24/7",
    IT: "Disponibilità 24/7",
    ES: "Disponibilidad 24/7",
    AR: "متاح على مدار الساعة",
    UK: "Доступність 24/7",
    JA: "24時間年中無休",
  },
  availability247Desc: {
    EN: "Round-the-clock service for arrivals and departures at any time, day or night",
    TR: "Gece gündüz, her saatte varışlar ve kalkışlar için kesintisiz hizmet",
    DE: "Rund-um-die-Uhr-Service für Ankünfte und Abflüge zu jeder Tages- und Nachtzeit",
    FR: "Service 24h/24 pour les arrivées et les départs à toute heure du jour ou de la nuit",
    RU: "Круглосуточный сервис для прилетов и вылетов в любое время дня и ночи",
    IT: "Servizio 24 ore su 24 per arrivi e partenze a qualsiasi ora del giorno o della notte",
    ES: "Servicio las 24 horas para llegadas y salidas a cualquier hora del día o de la noche",
    AR: "خدمة على مدار الساعة للوصول والمغادرة في أي وقت ليلاً أو نهاراً",
    UK: "Цілодобовий сервіс для прильотів та вильотів у будь-який час дня і ночі",
    JA: "昼夜を問わずいつでも到着・出発に対応する24時間サービス",
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
    EN: "Modern, comfortable vehicles maintained to the highest standards for your journey",
    TR: "Yolculuğunuz için en yüksek standartlarda bakımlı modern, konforlu araçlar",
    DE: "Moderne, komfortable Fahrzeuge, die nach höchsten Standards für Ihre Reise gewartet werden",
    FR: "Véhicules modernes et confortables entretenus selon les normes les plus élevées pour votre voyage",
    RU: "Современные комфортабельные автомобили, обслуживаемые по высшим стандартам для вашей поездки",
    IT: "Veicoli moderni e confortevoli mantenuti ai massimi standard per il vostro viaggio",
    ES: "Vehículos modernos y cómodos mantenidos con los más altos estándares para su viaje",
    AR: "مركبات حديثة ومريحة يتم صيانتها وفقًا لأعلى المعايير لرحلتك",
    UK: "Сучасні, комфортні автомобілі, що обслуговуються за найвищими стандартами для вашої подорожі",
    JA: "最高水準で維持管理されたモダンで快適な車両",
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
    EN: "Dedicated customer service team available whenever you need us, via phone, chat, or WhatsApp",
    TR: "İhtiyaç duyduğunuzda telefon, chat veya WhatsApp ile ulaşabileceğiniz özel müşteri hizmetleri ekibi",
    DE: "Engagiertes Kundenservice-Team, das Ihnen per Telefon, Chat oder WhatsApp zur Verfügung steht",
    FR: "Équipe de service client dédiée disponible quand vous en avez besoin par téléphone, chat ou WhatsApp",
    RU: "Специализированная служба поддержки доступна по телефону, в чате или WhatsApp когда вам нужно",
    IT: "Team di assistenza clienti dedicato disponibile via telefono, chat o WhatsApp quando ne hai bisogno",
    ES: "Equipo de atención al cliente dedicado disponible por teléfono, chat o WhatsApp cuando lo necesite",
    AR: "فريق خدمة عملاء متخصص متاح عبر الهاتف أو الدردشة أو واتساب عندما تحتاجنا",
    UK: "Спеціалізована служба підтримки доступна по телефону, в чаті або WhatsApp коли вам потрібно",
    JA: "電話、チャット、WhatsAppでいつでも対応可能な専任カスタマーサービスチーム",
  },
};

const featureIcons = [
  { icon: Shield, gradient: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-500" },
  { icon: Clock, gradient: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-500" },
  { icon: Star, gradient: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-500" },
  { icon: Headphones, gradient: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-500" },
];

export const Features = () => {
  const { language } = useLanguage();
  const lang = language || "EN";

  const ft = (key: string) => featureTranslations[key]?.[lang] || featureTranslations[key]?.["EN"] || key;

  const features = [
    { titleKey: "safeSecure", descKey: "safeSecureDesc" },
    { titleKey: "availability247", descKey: "availability247Desc" },
    { titleKey: "premiumFleet", descKey: "premiumFleetDesc" },
    { titleKey: "support247", descKey: "support247Desc" },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-muted/30 via-background to-muted/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6"
          >
            <Sparkles className="h-4 w-4" />
            {ft("badge")}
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {ft("title")}{" "}
            <span className="text-primary">{ft("titleHighlight")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {ft("subtitle")}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconData = featureIcons[index];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative p-6 bg-card rounded-2xl border hover:border-primary/30 hover:shadow-2xl transition-all duration-500 h-full text-center overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${IconData.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <motion.div 
                      className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${IconData.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <IconData.icon className={`h-8 w-8 ${IconData.iconColor}`} />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {ft(feature.titleKey)}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {ft(feature.descKey)}
                    </p>

                    {/* Check icon */}
                    <div className="flex justify-center">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
