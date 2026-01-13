import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Plane, Star, Check, Wifi, Baby, Briefcase } from "lucide-react";
import { CityVideo } from "./types";
import heroMercedes from "@/assets/hero-mercedes-vito.jpg";

interface HeroVisualSectionProps {
  videosLoaded: boolean;
  cityVideos: CityVideo[];
  currentVideoIndex: number;
  language: string;
  t: (key: string) => string;
}

export const HeroVisualSection = memo(({
  videosLoaded,
  cityVideos,
  currentVideoIndex,
  language,
  t
}: HeroVisualSectionProps) => {
  return (
    <>
      {/* Mobile Visual Section - No animation delay for LCP */}
      <div
        className="order-2 md:hidden"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <div className="relative h-40">
            {videosLoaded && cityVideos.length > 0 ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.video
                    key={`mobile-${currentVideoIndex}`}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <source src={cityVideos[currentVideoIndex].src} type="video/mp4" />
                  </motion.video>
                </AnimatePresence>
                
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                  <Globe className="h-2.5 w-2.5 text-white" />
                  <span className="text-[10px] text-white font-medium">
                    {language === 'TR' ? cityVideos[currentVideoIndex].labelTR : cityVideos[currentVideoIndex].label}
                  </span>
                </div>
              </>
            ) : (
              <img
                src={heroMercedes}
                alt="VIP Transfer"
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="text-white">
                <h3 className="text-sm font-bold mb-1">{t("premiumFleet") || "Premium Mercedes Fleet"}</h3>
                <div className="flex flex-wrap gap-1.5">
                  <div className="flex items-center gap-1 text-[10px] bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <Wifi className="h-2.5 w-2.5" />
                    <span>WiFi</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <Baby className="h-2.5 w-2.5" />
                    <span>{language === 'TR' ? 'Bebek Koltuğu' : 'Baby Seat'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <Briefcase className="h-2.5 w-2.5" />
                    <span>Meet & Greet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Stats Row */}
          <div className="flex items-center justify-around bg-card p-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">100+</div>
                <div className="text-[9px] text-muted-foreground">{t("cities") || "Cities"}</div>
              </div>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                <Plane className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">670+</div>
                <div className="text-[9px] text-muted-foreground">{t("airports") || "Airports"}</div>
              </div>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">4.9</div>
                <div className="text-[9px] text-muted-foreground">Google</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Visual Section - CLS fix: Remove x offset animation */}
      <div 
        className="order-3 hidden md:block md:col-span-2 lg:col-span-1 animate-fade-in"
        style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
      >
        <div className="relative">
          {/* Main Video/Image */}
          <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
            {videosLoaded && cityVideos.length > 0 ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.video
                    key={`desktop-${currentVideoIndex}`}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-48 md:h-56 lg:h-80 object-cover"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <source src={cityVideos[currentVideoIndex].src} type="video/mp4" />
                  </motion.video>
                </AnimatePresence>
                
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Globe className="h-3 w-3 text-white" />
                  <span className="text-xs text-white font-medium">
                    {language === 'TR' ? cityVideos[currentVideoIndex].labelTR : cityVideos[currentVideoIndex].label}
                  </span>
                </div>
              </>
            ) : (
              <img
                src={heroMercedes}
                alt="VIP Transfer"
                className="w-full h-48 md:h-56 lg:h-80 object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-6">
              <div className="text-white">
                <h3 className="text-sm lg:text-lg font-bold mb-1 lg:mb-2">{t("premiumFleet") || "Premium Mercedes Fleet"}</h3>
                <div className="flex flex-wrap gap-1.5 lg:gap-3">
                  <div className="flex items-center gap-1 text-xs lg:text-sm bg-white/20 backdrop-blur-sm rounded-full px-2 lg:px-3 py-0.5 lg:py-1">
                    <Wifi className="h-3 lg:h-3.5 w-3 lg:w-3.5" />
                    <span className="hidden lg:inline">Free WiFi</span>
                    <span className="lg:hidden">WiFi</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs lg:text-sm bg-white/20 backdrop-blur-sm rounded-full px-2 lg:px-3 py-0.5 lg:py-1">
                    <Baby className="h-3 lg:h-3.5 w-3 lg:w-3.5" />
                    <span className="hidden lg:inline">{language === 'TR' ? 'Bebek Koltuğu' : 'Baby Seat'}</span>
                    <span className="lg:hidden">{language === 'TR' ? 'Koltuk' : 'Seat'}</span>
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5 text-sm bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Meet & Greet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Stats Cards - CLS fix: Remove y/x offset animations */}
          <div 
            className="absolute -top-2 lg:-top-4 -right-2 lg:-right-4 bg-card rounded-lg lg:rounded-xl shadow-xl p-2 lg:p-4 border border-border/50 animate-fade-in"
            style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
          >
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-7 h-7 lg:w-10 lg:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-3.5 lg:h-5 w-3.5 lg:w-5 text-primary" />
              </div>
              <div>
                <div className="text-base lg:text-xl font-bold text-foreground">100+</div>
                <div className="text-[10px] lg:text-xs text-muted-foreground">{t("cities") || "Cities"}</div>
              </div>
            </div>
          </div>

          <div 
            className="absolute -bottom-2 lg:-bottom-4 -left-2 lg:-left-4 bg-card rounded-lg lg:rounded-xl shadow-xl p-2 lg:p-4 border border-border/50 animate-fade-in"
            style={{ animationDelay: '0.7s', animationFillMode: 'backwards' }}
          >
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-7 h-7 lg:w-10 lg:h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Plane className="h-3.5 lg:h-5 w-3.5 lg:w-5 text-accent" />
              </div>
              <div>
                <div className="text-base lg:text-xl font-bold text-foreground">670+</div>
                <div className="text-[10px] lg:text-xs text-muted-foreground">{t("airports") || "Airports"}</div>
              </div>
            </div>
          </div>

          <div 
            className="absolute top-1/2 -right-6 bg-card rounded-xl shadow-xl p-4 border border-border/50 hidden lg:block animate-fade-in"
            style={{ animationDelay: '0.9s', animationFillMode: 'backwards' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">4.9</div>
                <div className="text-xs text-muted-foreground">Google</div>
              </div>
            </div>
          </div>

          {/* Destination Cities Row */}
          <div className="mt-4 lg:mt-6 hidden lg:block">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-medium">{t("serviceLocations") || "We Serve"}:</span>
              <span>Istanbul • Antalya • Bodrum • Dalaman • İzmir • Dubai • Cyprus</span>
            </div>
          </div>

          {/* Feature List */}
          <div className="mt-4 lg:mt-6 grid grid-cols-2 gap-2 lg:gap-3">
            <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
              <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-sm text-foreground truncate">{t("freeCancellation") || "Free Cancel"}</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
              <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-sm text-foreground truncate">{t("flightTracking") || "Flight Track"}</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
              <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-sm text-foreground truncate">{t("noHiddenFees") || "No Hidden Fees"}</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
              <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-sm text-foreground truncate">24/7 {t("support") || "Support"}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

HeroVisualSection.displayName = "HeroVisualSection";
