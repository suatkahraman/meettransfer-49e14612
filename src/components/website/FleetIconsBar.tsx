import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Briefcase, ArrowRight } from "lucide-react";

const FleetIconsBar = () => {
  const { t, getLocalizedPath } = useLanguage();

  const fleetItems = [
    {
      name: "Economy",
      passengers: "3",
      luggage: "3",
      description: "Skoda Octavia, Toyota Prius or similar",
    },
    {
      name: "Standard",
      passengers: "3",
      luggage: "3",
      description: "Mercedes E Class, BMW 5 Series or similar",
    },
    {
      name: "Business",
      passengers: "3",
      luggage: "3",
      description: "Mercedes S Class, BMW 7 Series or similar",
    },
    {
      name: "Van Standard",
      passengers: "7",
      luggage: "7",
      description: "Mercedes Vito, Ford Custom or similar",
    },
    {
      name: "Van First Class",
      passengers: "6",
      luggage: "6",
      description: "Mercedes V Class, Cadillac Escalade or similar",
    },
    {
      name: "Minibus",
      passengers: "12",
      luggage: "12",
      description: "Mercedes Sprinter, Ford Transit or similar",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("maximumComfort") || "Maximum Comfort and Safety"}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("licensedVehicles") || "Licensed vehicles, professional drivers"}
          </p>
        </motion.div>

        {/* Fleet Grid - Transfeero Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {fleetItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={getLocalizedPath("/fleet")}
                className="group block p-5 bg-card rounded-2xl border hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full"
              >
                {/* Vehicle Icon Placeholder */}
                <div className="h-20 mb-4 flex items-center justify-center">
                  <div className="w-24 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 100 40" className="w-20 h-8 text-muted-foreground">
                      <rect x="10" y="20" width="80" height="15" rx="5" fill="currentColor" opacity="0.3"/>
                      <circle cx="25" cy="35" r="6" fill="currentColor" opacity="0.5"/>
                      <circle cx="75" cy="35" r="6" fill="currentColor" opacity="0.5"/>
                      <rect x="15" y="12" width="30" height="12" rx="3" fill="currentColor" opacity="0.2"/>
                    </svg>
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-bold text-foreground mb-2 text-center group-hover:text-primary transition-colors">
                  {item.name}
                </h3>

                {/* Capacity */}
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{item.passengers}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{item.luggage}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground text-center line-clamp-2">
                  {item.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View Fleet CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link 
            to={getLocalizedPath("/fleet")}
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            {t("viewFullFleet") || "View Full Fleet"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FleetIconsBar;