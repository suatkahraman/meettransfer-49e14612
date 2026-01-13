import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Users, Clock, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const CoreServices = () => {
  const { t, getLocalizedPath } = useLanguage();

  const services = [
    {
      icon: Globe,
      titleKey: "serviceGlobalTitle",
      titleFallback: "Global",
      descKey: "serviceGlobalDesc",
      descFallback: "Wherever your journey leads, we ensure your comfort along the way.",
      link: "/destinations",
    },
    {
      icon: Users,
      titleKey: "serviceProfessionalTitle",
      titleFallback: "Professional drivers",
      descKey: "serviceProfessionalDesc",
      descFallback: "Professional Drivers, Timely Rides, Relaxed Travel",
      link: "/about",
    },
    {
      icon: Clock,
      titleKey: "serviceHourlyTitle",
      titleFallback: "Chauffeur by the hour",
      descKey: "serviceHourlyDesc",
      descFallback: "Hire an hourly chauffeur for your business or leisure needs.",
      link: "/services",
    },
    {
      icon: Building2,
      titleKey: "serviceCityTitle",
      titleFallback: "City rides",
      descKey: "serviceCityDesc",
      descFallback: "Explore the city anytime, anywhere—even long distances.",
      link: "/services",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("coreServices") || "Core Services"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("coreServicesDesc") || "Premium transportation solutions for every need"}
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                className="group block p-8 bg-card rounded-2xl border hover:border-primary/30 hover:shadow-xl transition-all duration-300 h-full text-center"
              >
                {/* Icon */}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <service.icon className="h-8 w-8 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {t(service.titleKey) || service.titleFallback}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                  {t(service.descKey) || service.descFallback}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreServices;