import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Users, Clock, Building2, ArrowRight, Sparkles, Shield, Star, Zap, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const CoreServices = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const isTR = language?.toLowerCase() === "tr";

  const services = [
    {
      icon: Globe,
      titleKey: "serviceGlobalTitle",
      titleFallback: "Airport Transfers",
      titleFallbackTR: "Havalimanı Transferi",
      descKey: "serviceGlobalDesc",
      descFallback: "Door-to-door airport transfers with flight tracking, meet & greet service.",
      descFallbackTR: "Uçuş takipli kapıdan kapıya havalimanı transferleri.",
      link: "/destinations",
      features: [
        { en: "Flight tracking", tr: "Uçuş takibi" },
        { en: "Meet & greet", tr: "Karşılama hizmeti" },
        { en: "Free waiting", tr: "Ücretsiz bekleme" },
      ],
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-500",
    },
    {
      icon: Users,
      titleKey: "serviceProfessionalTitle",
      titleFallback: "Private Transfers",
      titleFallbackTR: "Özel Transfer",
      descKey: "serviceProfessionalDesc",
      descFallback: "Point-to-point private transfers with professional drivers.",
      descFallbackTR: "Profesyonel şoförlerle noktadan noktaya özel transfer.",
      link: "/about",
      features: [
        { en: "Professional drivers", tr: "Profesyonel şoförler" },
        { en: "Fixed prices", tr: "Sabit fiyatlar" },
        { en: "24/7 service", tr: "7/24 hizmet" },
      ],
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-500",
    },
    {
      icon: Clock,
      titleKey: "serviceHourlyTitle",
      titleFallback: "Hourly Chauffeur",
      titleFallbackTR: "Saatlik Kiralama",
      descKey: "serviceHourlyDesc",
      descFallback: "Hire a chauffeur by the hour for business meetings or city tours.",
      descFallbackTR: "İş toplantıları veya şehir turları için saatlik şoför kiralayın.",
      link: "/services",
      features: [
        { en: "Flexible hours", tr: "Esnek saatler" },
        { en: "Dedicated driver", tr: "Özel şoför" },
        { en: "Multiple stops", tr: "Çoklu durak" },
      ],
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-500",
    },
    {
      icon: Building2,
      titleKey: "serviceCityTitle",
      titleFallback: "Intercity Rides",
      titleFallbackTR: "Şehirlerarası",
      descKey: "serviceCityDesc",
      descFallback: "Comfortable long-distance transfers between cities.",
      descFallbackTR: "Şehirler arası konforlu uzun mesafe transferleri.",
      link: "/services",
      features: [
        { en: "Long distance", tr: "Uzun mesafe" },
        { en: "Luxury comfort", tr: "Lüks konfor" },
        { en: "Door-to-door", tr: "Kapıdan kapıya" },
      ],
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-500",
    },
  ];

  const stats = [
    { value: "50K+", label: isTR ? "Mutlu Müşteri" : "Happy Customers" },
    { value: "99%", label: isTR ? "Zamanında Varış" : "On-Time Arrivals" },
    { value: "4.9", label: isTR ? "Ortalama Puan" : "Average Rating", icon: Star },
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
            {isTR ? "Premium Hizmetler" : "Premium Services"}
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("coreServices") || (isTR ? "Tüm Transfer İhtiyaçlarınız" : "All Your Transfer Needs")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("coreServicesDesc") || (isTR 
              ? "Seyahatinizi kusursuz hale getiren premium ulaşım çözümleri" 
              : "Premium transportation solutions that make your journey seamless")}
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
                      {t(service.titleKey) || (isTR ? service.titleFallbackTR : service.titleFallback)}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {t(service.descKey) || (isTR ? service.descFallbackTR : service.descFallback)}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-2 mb-4">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span>{isTR ? feature.tr : feature.en}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Learn more link */}
                    <div className="flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                      {isTR ? "Daha Fazla" : "Learn More"}
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
            { icon: Shield, text: isTR ? "Sigortalı Araçlar" : "Insured Vehicles" },
            { icon: Zap, text: isTR ? "Anında Onay" : "Instant Confirmation" },
            { icon: Star, text: isTR ? "5 Yıldızlı Hizmet" : "5-Star Service" },
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
