import { Clock, Car, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const BlogHourlyRentalPromo = () => {
  const { t, getLocalizedPath } = useLanguage();

  return (
    <section className="py-12 px-4 bg-gradient-to-br from-accent/5 via-primary/5 to-accent/10">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden border-accent/20 shadow-lg">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Content Side */}
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                    <Clock className="h-3 w-3 mr-1" />
                    {t("blogHourlyNewService")}
                  </Badge>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold">
                  {t("blogHourlyPromoTitle")}
                </h3>
                
                <p className="text-muted-foreground">
                  {t("blogHourlyPromoDesc")}
                </p>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{t("blogHourlyUnlimitedStops")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{t("blogHourlyFlexibleHours")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-primary" />
                    <span>{t("blogHourlyPremiumFleet")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                    {t("blogHourlyStartingPrice")}
                  </div>
                </div>
                
                {/* Important Notes */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                    <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
                      📍 {t("hourlyDailyKmLimit")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                      🏙️ {t("hourlySameCityOnly")}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Link to={getLocalizedPath("/book?type=hourly")}>
                    <Button size="lg" className="gap-2 w-full md:w-auto">
                      {t("blogHourlyBookNow")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Visual Side */}
              <div className="relative bg-gradient-to-br from-primary/10 to-accent/20 p-6 md:p-8 flex flex-col justify-center items-center text-center">
                <div className="absolute inset-0 bg-[url('/images/meet-transfer-vip-mercedes-vito.jpg')] bg-cover bg-center opacity-20" />
                <div className="relative z-10 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <Clock className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">4-12h</div>
                    <p className="text-sm text-muted-foreground">{t("blogHourlyFlexibleBooking")}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <Badge variant="outline" className="bg-background/80">{t("blogHourlyCityTours")}</Badge>
                    <Badge variant="outline" className="bg-background/80">{t("blogHourlyBusinessMeetings")}</Badge>
                    <Badge variant="outline" className="bg-background/80">{t("blogHourlyEvents")}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default BlogHourlyRentalPromo;
