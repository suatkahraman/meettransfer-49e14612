import { Shield, Clock, Star, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Features = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Shield,
      titleKey: "safeSecure",
      descKey: "safeSecureDesc",
    },
    {
      icon: Clock,
      titleKey: "availability247",
      descKey: "availability247Desc",
    },
    {
      icon: Star,
      titleKey: "premiumFleet",
      descKey: "premiumFleetDesc",
    },
    {
      icon: Headphones,
      titleKey: "support247",
      descKey: "support247Desc",
    },
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            {t("whyChooseUs")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            {t("experienceTheDifference")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center space-y-4 p-6 rounded-xl bg-card hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">
                {t(feature.titleKey)}
              </h3>
              <p className="text-muted-foreground font-sans leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
