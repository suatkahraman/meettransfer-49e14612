import { Clock, Calendar, Car, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

interface RentalOption {
  duration: string;
  titleKey: string;
  descKey: string;
  priceFrom: string;
  icon: React.ElementType;
  popular?: boolean;
}

const rentalOptions: RentalOption[] = [
  {
    duration: "4h",
    titleKey: "hourlyHalfDay",
    descKey: "hourlyHalfDayDesc",
    priceFrom: "€120",
    icon: Clock,
  },
  {
    duration: "8h",
    titleKey: "hourlyFullDay",
    descKey: "hourlyFullDayDesc",
    priceFrom: "€200",
    icon: Calendar,
    popular: true,
  },
  {
    duration: "Custom",
    titleKey: "hourlyCustom",
    descKey: "hourlyCustomDesc",
    priceFrom: "€30/h",
    icon: Car,
  },
];

const HourlyRentalSection = () => {
  const { t, getLocalizedPath } = useLanguage();

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
            <Clock className="h-4 w-4 text-accent" />
            <span className="font-semibold text-sm text-accent">
              {t("hourlyNewService") || "New Service"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            {t("hourlyRentalTitle") || "Hourly & Daily Chauffeur Service"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("hourlyRentalSubtitle") ||
              "Need a chauffeur for business meetings, city tours, or special events? Book by the hour or day."}
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {rentalOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <Card
                key={index}
                className={`relative overflow-hidden hover:shadow-lg transition-all ${
                  option.popular ? "border-primary ring-2 ring-primary/20" : ""
                }`}
              >
                {option.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    {t("hourlyPopular") || "Most Popular"}
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {option.duration}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">
                    {t(option.titleKey) || option.titleKey}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t(option.descKey) || option.descKey}
                  </p>
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {t("hourlyStartingFrom") || "Starting from"}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {option.priceFrom}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Row */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {[
            { icon: MapPin, text: t("hourlyUnlimitedStops") || "Unlimited Stops" },
            { icon: Clock, text: t("hourlyFlexibleSchedule") || "Flexible Schedule" },
            { icon: Car, text: t("hourlyPremiumVehicles") || "Premium Vehicles" },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            );
          })}
        </div>

        {/* Important Notes */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              📍 {t("hourlyDailyKmLimit") || "Daily Limit: 100 KM"}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              🏙️ {t("hourlySameCityOnly") || "Hourly Rental Valid Within Same City Only"}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to={getLocalizedPath("/whatsapp-booking")}>
            <Button size="lg" className="px-8">
              {t("hourlyBookNow") || "Book Hourly Service"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HourlyRentalSection;
