import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Car, Timer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// Custom hooks for form state management
import { useRideForm } from "@/hooks/useRideForm";
import { useHourlyForm } from "@/hooks/useHourlyForm";
import { useHeroVideos } from "@/hooks/useHeroVideos";
import { useHeroFormStorage } from "@/hooks/useHeroFormStorage";

// Critical lightweight components - import directly (no barrel export)
import { HeroHeader } from "@/components/hero/HeroHeader";
import { HeroTrustBadges } from "@/components/hero/HeroTrustBadges";

// Lazy load AnimatePresence - framer-motion is heavy
const AnimatePresence = lazy(() => 
  import("framer-motion").then(m => ({ default: m.AnimatePresence }))
);

// Lazy load heavier form components - they render after initial paint
const RideFormContent = lazy(() => import("@/components/hero/RideFormContent").then(m => ({ default: m.RideFormContent })));
const HourlyFormContent = lazy(() => import("@/components/hero/HourlyFormContent").then(m => ({ default: m.HourlyFormContent })));
const HeroBackground = lazy(() => import("@/components/hero/HeroBackground").then(m => ({ default: m.HeroBackground })));
const HeroVisualSection = lazy(() => import("@/components/hero/HeroVisualSection").then(m => ({ default: m.HeroVisualSection })));
// HeroAIAssistant temporarily disabled
const ReturnTripPromoBanner = lazy(() => import("@/components/hero/ReturnTripPromoBanner").then(m => ({ default: m.ReturnTripPromoBanner })));
const SwipeableBookingCard = lazy(() => import("@/components/hero/SwipeableBookingCard").then(m => ({ default: m.SwipeableBookingCard })));

// Minimal skeleton for form content
const FormSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-14 bg-muted rounded-xl" />
    <div className="h-14 bg-muted rounded-xl" />
    <div className="grid grid-cols-3 gap-2">
      <div className="h-14 bg-muted rounded-xl" />
      <div className="h-14 bg-muted rounded-xl" />
      <div className="h-14 bg-muted rounded-xl" />
    </div>
    <div className="h-16 bg-primary/20 rounded-xl" />
  </div>
);

export const Hero = () => {
  const { t, language } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);
  const { loadSavedFormData, saveFormData } = useHeroFormStorage();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"ride" | "hourly">(() => 
    loadSavedFormData()?.activeTab || "ride"
  );
  
  // Use custom hooks for form management
  const rideForm = useRideForm(t);
  const hourlyForm = useHourlyForm(t, rideForm.appliedPromoCode);
  const videoState = useHeroVideos();
  
  // Save form data to localStorage when it changes
  useEffect(() => {
    const formData = {
      activeTab,
      ...rideForm.getFormData(),
      ...hourlyForm.getFormData()
    };
    saveFormData(formData);
  }, [
    activeTab,
    rideForm.getFormData,
    hourlyForm.getFormData,
    saveFormData
  ]);
  
  // Fetch cities when hourly tab becomes active
  useEffect(() => {
    if (activeTab === 'hourly') {
      const timer = setTimeout(() => {
        hourlyForm.fetchCitiesIfNeeded();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, hourlyForm.fetchCitiesIfNeeded]);

  return (
    <section ref={heroRef} id="booking-form" className="relative overflow-hidden bg-background">
      <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-br from-background to-muted" />}>
        <HeroBackground 
          videosLoaded={videoState.videosLoaded} 
          cityVideos={videoState.cityVideos} 
          currentVideoIndex={videoState.currentVideoIndex} 
          setCurrentVideoIndex={videoState.setCurrentVideoIndex} 
          language={language} 
        />
      </Suspense>

      {/* Mobile: pb-20 for bottom nav, desktop: normal padding. pt handled by WebsiteLayout */}
      <div className="container relative z-10 px-2 sm:px-3 md:px-4 pt-4 md:pt-8 pb-4 md:pb-8 lg:pb-16">
        <div className="grid md:grid-cols-5 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-12 items-start lg:items-center min-h-[calc(100svh-8rem)] md:min-h-[calc(100svh-6rem)]">
          {/* Left Side - Form */}
          <div className="order-1 md:col-span-3 lg:col-span-1">
            <HeroHeader language={language} />
            {/* AI Assistant temporarily disabled */}
            <Suspense fallback={null}>
              <ReturnTripPromoBanner language={language} onApplyPromoCode={rideForm.handleApplyPromoCode} />
            </Suspense>

            {/* Booking Form Card - Enhanced visibility */}
            <Suspense fallback={<div className="bg-card rounded-2xl shadow-lg p-4"><FormSkeleton /></div>}>
              <SwipeableBookingCard 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                language={language}
                t={t}
              >
                {/* Tabs */}
                <div className="flex bg-muted/50 relative">
                  <div 
                    className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300"
                    style={{ left: activeTab === "ride" ? "0%" : "50%", width: "50%" }}
                  />
                  <button 
                    onClick={() => setActiveTab("ride")} 
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 md:gap-1.5 py-3.5 md:py-3 px-4 md:px-4 font-medium transition-all text-sm md:text-sm relative",
                      activeTab === "ride" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Car className="h-4 w-4 md:h-4 md:w-4" />
                    <span>{t("pointToPoint") || "Transfer"}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("hourly")} 
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 md:gap-1.5 py-3.5 md:py-3 px-4 md:px-4 font-medium transition-all text-sm md:text-sm",
                      activeTab === "hourly" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Timer className="h-4 w-4 md:h-4 md:w-4" />
                    <span>{t("perHour") || "Hourly"}</span>
                  </button>
                </div>

                {/* Form Content */}
                <div className="p-4 sm:p-4 md:p-5 lg:p-5">
                  <Suspense fallback={<FormSkeleton />}>
                    <AnimatePresence mode="wait">
                      {activeTab === "ride" ? (
                        <RideFormContent
                          pickup={rideForm.pickup}
                          dropoff={rideForm.dropoff}
                          date={rideForm.date}
                          time={rideForm.time}
                          passengers={rideForm.passengers}
                          vehicleType={rideForm.vehicleType}
                          allVehiclePrices={rideForm.allVehiclePrices}
                          loadingTransferPrice={rideForm.loadingTransferPrice}
                          transferPriceCurrency={rideForm.transferPriceCurrency}
                          submitting={rideForm.submitting}
                          language={language}
                          t={t}
                          onPickupSelected={rideForm.handlePickupSelected}
                          onDropoffSelected={rideForm.handleDropoffSelected}
                          onSwapLocations={rideForm.handleSwapLocations}
                          setDate={rideForm.handleSetDate}
                          setTime={rideForm.handleSetTime}
                          setPassengers={rideForm.handleSetPassengers}
                          setVehicleType={rideForm.handleSetVehicleType}
                          handleRideContinue={rideForm.handleRideContinue}
                          // Return trip
                          returnDate={rideForm.returnDate}
                          returnTime={rideForm.returnTime}
                          hasReturnTrip={rideForm.hasReturnTrip}
                          setReturnDate={rideForm.handleSetReturnDate}
                          setReturnTime={rideForm.handleSetReturnTime}
                          setHasReturnTrip={rideForm.handleSetHasReturnTrip}
                          // Extras
                          babySeatCount={rideForm.babySeatCount}
                          luggageCount={rideForm.luggageCount}
                          setBabySeatCount={rideForm.handleSetBabySeatCount}
                          setLuggageCount={rideForm.handleSetLuggageCount}
                          // Dubai route detection
                          isDubaiRoute={rideForm.isDubaiRoute}
                        />
                      ) : (
                        <HourlyFormContent
                          hourlyCity={hourlyForm.hourlyCity}
                          hourlyDuration={hourlyForm.hourlyDuration}
                          customHours={hourlyForm.customHours}
                          hourlyDate={hourlyForm.hourlyDate}
                          hourlyTime={hourlyForm.hourlyTime}
                          hourlyPassengers={hourlyForm.hourlyPassengers}
                          hourlyVehicleType={hourlyForm.hourlyVehicleType}
                          allHourlyPrices={hourlyForm.allHourlyPrices}
                          loadingPrice={hourlyForm.loadingPrice}
                          submitting={hourlyForm.submitting}
                          availableCities={hourlyForm.availableCities}
                          availableDurations={hourlyForm.availableDurations}
                          language={language}
                          t={t}
                          setHourlyCity={hourlyForm.handleSetHourlyCity}
                          setHourlyDuration={hourlyForm.handleSetHourlyDuration}
                          setCustomHours={hourlyForm.handleSetCustomHours}
                          setHourlyDate={hourlyForm.handleSetHourlyDate}
                          setHourlyTime={hourlyForm.handleSetHourlyTime}
                          setHourlyPassengers={hourlyForm.handleSetHourlyPassengers}
                          setHourlyVehicleType={hourlyForm.handleSetHourlyVehicleType}
                          handleHourlyContinue={hourlyForm.handleHourlyContinue}
                        />
                      )}
                    </AnimatePresence>
                  </Suspense>
                </div>
              </SwipeableBookingCard>
            </Suspense>

            <HeroTrustBadges />
          </div>

          {/* Visual Sections */}
          <Suspense fallback={<div className="hidden md:block" />}>
            <HeroVisualSection 
              videosLoaded={videoState.videosLoaded} 
              cityVideos={videoState.cityVideos} 
              currentVideoIndex={videoState.currentVideoIndex} 
              language={language} 
              t={t} 
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
};
