import { Clock, Shield, CreditCard, Plane, Baby, Wifi, Car, Award, HeadphonesIcon, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Benefit {
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  highlight?: string;
}

const benefits: Benefit[] = [
  {
    icon: Clock,
    titleKey: "whyFreeWaiting",
    descKey: "whyFreeWaitingDesc",
    highlight: "60 min",
  },
  {
    icon: XCircle,
    titleKey: "whyFreeCancellation",
    descKey: "whyFreeCancellationDesc",
    highlight: "90 min",
  },
  {
    icon: Plane,
    titleKey: "whyFlightTracking",
    descKey: "whyFlightTrackingDesc",
  },
  {
    icon: CreditCard,
    titleKey: "whyNoHiddenFees",
    descKey: "whyNoHiddenFeesDesc",
  },
  {
    icon: Baby,
    titleKey: "whyFreeChildSeat",
    descKey: "whyFreeChildSeatDesc",
  },
  {
    icon: Wifi,
    titleKey: "whyFreeWifi",
    descKey: "whyFreeWifiDesc",
  },
  {
    icon: Car,
    titleKey: "whyPremiumFleet",
    descKey: "whyPremiumFleetDesc",
  },
  {
    icon: HeadphonesIcon,
    titleKey: "why247Support",
    descKey: "why247SupportDesc",
  },
];

const WhyChooseUs = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Award className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-primary">
              {t("whyTrustedService") || "Trusted Since 2001"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            {t("whyChooseUsTitle") || "Why Choose Meet Transfer?"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("whyChooseUsSubtitle") || "Experience the difference with our premium transfer service"}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group relative p-6 bg-card rounded-2xl border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                {benefit.highlight && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    {benefit.highlight}
                  </div>
                )}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {t(benefit.titleKey) || benefit.titleKey}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(benefit.descKey) || benefit.descKey}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl md:text-4xl font-bold text-primary">25+</div>
            <div className="text-sm text-muted-foreground">{t("whyYearsExperience") || "Years Experience"}</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl md:text-4xl font-bold text-primary">50K+</div>
            <div className="text-sm text-muted-foreground">{t("whyHappyCustomers") || "Happy Customers"}</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl md:text-4xl font-bold text-primary">15+</div>
            <div className="text-sm text-muted-foreground">{t("whyDestinations") || "Destinations"}</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl md:text-4xl font-bold text-primary">4.8</div>
            <div className="text-sm text-muted-foreground">{t("whyAverageRating") || "Average Rating"}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
