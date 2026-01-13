import { Clock, Shield, CreditCard, Plane, Baby, Wifi, Car, Award, HeadphonesIcon, XCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoogleReviewStats } from "@/hooks/useGoogleReviewStats";
import { motion } from "framer-motion";

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
    highlight: "Free",
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
  const { rating } = useGoogleReviewStats();

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Two-column layout like Transfeero */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column - Header & Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-24"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-primary">
                {t("whyTrustedService") || "Trusted Since 2001"}
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {t("whyChooseUsTitle") || "Why Choose Meet Transfer?"}
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              {t("whyChooseUsSubtitle") || "Experience the difference with our premium transfer service. Professional drivers, luxury vehicles, and seamless booking."}
            </p>

            {/* Stats Grid - Transfeero Style */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-card rounded-2xl border">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-1">25+</div>
                <div className="text-muted-foreground font-medium">{t("whyYearsExperience") || "Years Experience"}</div>
              </div>
              <div className="p-6 bg-card rounded-2xl border">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-1">50K+</div>
                <div className="text-muted-foreground font-medium">{t("whyHappyCustomers") || "Happy Customers"}</div>
              </div>
              <div className="p-6 bg-card rounded-2xl border">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-1">15+</div>
                <div className="text-muted-foreground font-medium">{t("whyDestinations") || "Destinations"}</div>
              </div>
              <div className="p-6 bg-card rounded-2xl border">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-1">{rating.toFixed(1)}</div>
                <div className="text-muted-foreground font-medium">{t("whyAverageRating") || "Average Rating"}</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Benefits */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group flex items-start gap-4 p-5 bg-card rounded-xl border hover:border-primary/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-foreground">
                        {t(benefit.titleKey) || benefit.titleKey}
                      </h3>
                      {benefit.highlight && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                          {benefit.highlight}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(benefit.descKey) || benefit.descKey}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-primary/50 flex-shrink-0 mt-1" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;