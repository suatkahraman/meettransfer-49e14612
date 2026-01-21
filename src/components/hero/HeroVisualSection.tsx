import { memo } from "react";
import { Globe, Plane, Star, Wifi, Baby, Briefcase, Shield, Clock, Check } from "lucide-react";
import { CityVideo } from "./types";
import { useGoogleReviewStats } from "@/hooks/useGoogleReviewStats";
import { PaymentComingSoonBanner } from "./PaymentComingSoonBanner";

interface HeroVisualSectionProps {
  videosLoaded: boolean;
  cityVideos: CityVideo[];
  currentVideoIndex: number;
  language: string;
  t: (key: string) => string;
}

export const HeroVisualSection = memo(({
  language,
  t
}: HeroVisualSectionProps) => {
  // Get live rating from Google Reviews
  const { rating } = useGoogleReviewStats();

  return (
    <>
      {/* Mobile Visual Section - Stats & Features Only (No Images) */}
      <div className="order-2 md:hidden">
        <div className="rounded-xl overflow-hidden shadow-lg bg-card border border-border/50">
          {/* Feature highlights - gradient background instead of image */}
          <div className="relative h-32 bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0">
              <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-primary/10 blur-2xl" />
              <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-accent/10 blur-xl" />
            </div>
            
            {/* Content overlay */}
            <div className="relative z-10 h-full flex flex-col justify-center p-4">
              <h3 className="text-base font-bold text-foreground mb-2">
                {t("premiumFleet")}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-1">
                  <Wifi className="h-3 w-3" />
                  <span>{t("freeWifi")}</span>
                </div>
                <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-1">
                  <Baby className="h-3 w-3" />
                  <span>{t("babySeatLabel")}</span>
                </div>
                <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-1">
                  <Briefcase className="h-3 w-3" />
                  <span>{t("meetGreet")}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Stats Row */}
          <div className="flex items-center justify-around p-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">32</div>
                <div className="text-[10px] text-muted-foreground">{t("cities")}</div>
              </div>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Plane className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">12</div>
                <div className="text-[10px] text-muted-foreground">{t("airports")}</div>
              </div>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">{rating.toFixed(1)}</div>
                <div className="text-[10px] text-muted-foreground">{t("googleReviews")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Visual Section - Stats & Features (No Images) */}
      <div className="order-3 hidden md:block md:col-span-2 lg:col-span-1">
        <div className="relative">
          {/* Main feature card with gradient */}
          <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-card">
            {/* Gradient visual area */}
            <div className="relative w-full h-48 md:h-56 lg:h-72 overflow-hidden bg-gradient-to-br from-primary/15 via-accent/10 to-background">
              {/* Decorative circles */}
              <div className="absolute inset-0">
                <div className="absolute top-8 left-8 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute bottom-8 right-8 w-24 h-24 rounded-full bg-accent/20 blur-2xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
              </div>
              
              {/* Feature badges grid */}
              <div className="relative z-10 h-full flex flex-col justify-center items-center p-6">
                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-xl p-3 border border-border/50">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{t("safetyFirst")}</div>
                      <div className="text-[10px] text-muted-foreground">{t("licensedDrivers")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-xl p-3 border border-border/50">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{t("onTime")}</div>
                      <div className="text-[10px] text-muted-foreground">{t("guaranteed")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-xl p-3 border border-border/50">
                    <Wifi className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{t("freeWifi")}</div>
                      <div className="text-[10px] text-muted-foreground">{t("inAllCars")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-xl p-3 border border-border/50">
                    <Baby className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{t("babySeatLabel")}</div>
                      <div className="text-[10px] text-muted-foreground">{t("available")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats row */}
            <div className="flex items-center justify-around p-4 bg-muted/50 border-t border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">32</div>
                  <div className="text-xs text-muted-foreground">{t("cities")}</div>
                </div>
              </div>
              <div className="w-px h-10 bg-border/50" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Plane className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">12</div>
                  <div className="text-xs text-muted-foreground">{t("airports")}</div>
                </div>
              </div>
              <div className="w-px h-10 bg-border/50" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{rating.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">{t("googleReviews")}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature list */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>{t("freeCancellation")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>{t("noHiddenFees")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>{t("flightTracking")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>{t("support24_7")}</span>
            </div>
          </div>
          
          {/* Payment Coming Soon Banner - Full version on desktop */}
          <PaymentComingSoonBanner language={language} className="mt-6" />
        </div>
      </div>
    </>
  );
});

HeroVisualSection.displayName = "HeroVisualSection";

export default HeroVisualSection;
