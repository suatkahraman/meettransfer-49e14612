import { Check, Clock, Plane, Car, Shield, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FeatureList = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Clock, label: t("support247") },
    { icon: Plane, label: t("flightTracking") },
    { icon: Car, label: t("doorToDoor") },
    { icon: Shield, label: t("professionalDrivers") },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {features.map((feature, index) => (
        <div
          key={index}
          className="flex flex-col items-center text-center p-4 bg-card rounded-xl shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
            <feature.icon className="h-6 w-6 text-accent" />
          </div>
          <span className="text-sm font-medium">{feature.label}</span>
        </div>
      ))}
    </div>
  );
};

export default FeatureList;
