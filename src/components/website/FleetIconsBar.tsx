import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Car, Truck, Crown, Bus, Users } from "lucide-react";
import { motion } from "framer-motion";

const FleetIconsBar = () => {
  const { t, getLocalizedPath } = useLanguage();

  const fleetItems = [
    {
      icon: Car,
      label: t("economy") || "Economy",
      type: "mercedes-vito",
      color: "from-gray-500 to-gray-600",
    },
    {
      icon: Car,
      label: t("comfort") || "Comfort", 
      type: "mercedes-vito",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Crown,
      label: t("business") || "Business",
      type: "vip-mercedes",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      icon: Crown,
      label: t("premium") || "Premium",
      type: "vip-mercedes",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Crown,
      label: "VIP",
      type: "maybach-minibus",
      color: "from-amber-500 to-amber-600",
    },
    {
      icon: Truck,
      label: "SUV",
      type: "vip-mercedes",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: Users,
      label: t("van") || "Van",
      type: "mercedes-vito",
      color: "from-cyan-500 to-cyan-600",
    },
    {
      icon: Bus,
      label: t("minibus") || "Minibus",
      type: "minibus",
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <section className="bg-muted/30 py-6 md:py-8 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-lg font-semibold text-foreground mb-6">
          {t("ourFleet") || "Our Fleet"}
        </h2>
        
        <div className="flex justify-center gap-3 md:gap-6 flex-wrap">
          {fleetItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={getLocalizedPath("/fleet")}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FleetIconsBar;
