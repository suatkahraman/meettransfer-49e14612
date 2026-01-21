import { ThumbsUp, Clock, DollarSign, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TrustBar = () => {
  const { t } = useLanguage();

  const trustItems = [
    {
      icon: ThumbsUp,
      title: t("wePriceMatch") || "We Price Match",
      description: t("wePriceMatchDesc") || "We return the difference in price",
      color: "text-green-500",
    },
    {
      icon: Clock,
      title: t("freeWaitingTime") || "Free Waiting Time",
      description: t("freeWaitingTimeDesc") || "60 min at airports, 15 min elsewhere",
      color: "text-blue-500",
    },
    {
      icon: DollarSign,
      title: t("noHiddenCosts") || "No Hidden Costs",
      description: t("noHiddenCostsDesc") || "Taxes, tolls and gratuity included",
      color: "text-amber-500",
    },
    {
      icon: Shield,
      title: t("safeRides") || "Safe Rides",
      description: t("safeRidesDesc") || "All drivers thoroughly verified",
      color: "text-primary",
    },
  ];

  return (
    <section className="bg-card border-y border-border py-4 md:py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {trustItems.map((item, index) => (
            // Remove animation delay for faster perceived load
            <div
              key={index}
              className="flex items-start gap-3 group cursor-default"
            >
              <div className={`p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
