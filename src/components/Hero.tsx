import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Car, Timer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { SilentSectionErrorBoundary } from "@/components/hero/SilentSectionErrorBoundary";

// Custom hooks for form state management
import { useRideForm } from "@/hooks/useRideForm";
import { useHourlyForm } from "@/hooks/useHourlyForm";
import { useHeroFormStorage } from "@/hooks/useHeroFormStorage";

// Critical components for LCP - import directly (NOT lazy loaded)
import { HeroHeader } from "@/components/hero/HeroHeader";
import { HeroTrustBadges } from "@/components/hero/HeroTrustBadges";
import { HeroBackground } from "@/components/hero/HeroBackground";
import { SwipeableBookingCard } from "@/components/hero/SwipeableBookingCard";

// Form content components - eagerly import for faster LCP
import { RideFormContent } from "@/components/hero/RideFormContent";
import { HourlyFormContent } from "@/components/hero/HourlyFormContent";

// Lazy load non-critical visual components - loads after LCP
const HeroVisualSection = lazy(() => import("@/components/hero/HeroVisualSection").then(m => ({ default: m.HeroVisualSection })));
const PaymentComingSoonBanner = lazy(() => import("@/components/hero/PaymentComingSoonBanner").then(m => ({ default: m.PaymentComingSoonBanner })));

export const Hero = () => {
  const { t, language } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);
  const { loadSavedFormData, saveFormData } = useHeroFormStorage();

  // Never block first render on i18n readiness; always provide a stable fallback string.
  const tSafe = (key: string, fallback: string) => {
    try {
      const value = t?.(key);
      if (!value || value === key) return fallback;
      return value;
    } catch {
      return fallback;
    }
  };
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"ride" | "hourly">(() => 
    loadSavedFormData()?.activeTab || "ride"
  );
  
  // Use custom hooks for form management
  const rideForm = useRideForm(t);
  const hourlyForm = useHourlyForm(t, rideForm.appliedPromoCode);
  
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
      {/* HeroBackground is NOT lazy loaded - critical for LCP */}
      <HeroBackground 
        videosLoaded={false} 
        cityVideos={[]} 
        currentVideoIndex={0} 
        setCurrentVideoIndex={() => {}} 
        language={language} 
      />

      {/* Mobile: Full viewport height form, Desktop: normal grid layout */}
      <div className="container relative z-10 px-0 sm:px-3 md:px-4 pt-0 sm:pt-4 md:pt-8 pb-0 sm:pb-4 md:pb-8 lg:pb-16">
        <div className="grid md:grid-cols-5 lg:grid-cols-2 gap-0 sm:gap-4 md:gap-6 lg:gap-12 items-start lg:items-center min-h-[100svh] sm:min-h-[calc(100svh-8rem)] md:min-h-[calc(100svh-6rem)]">
          {/* Left Side - Form */}
          <div className="order-1 md:col-span-3 lg:col-span-1 h-full sm:h-auto">
            {/* Unified container for header and booking form - Full screen on mobile */}
            <div className="bg-card sm:rounded-2xl shadow-lg overflow-hidden min-h-[100svh] sm:min-h-0 flex flex-col">
              {/* Header inside the card */}
              <div className="p-4 sm:p-5 md:p-6 pb-2 sm:pb-3 pt-6 sm:pt-4">
                <HeroHeader language={language} />
              </div>

              {/* Booking Form Card - Critical for LCP, no Suspense wrapper */}
              <SwipeableBookingCard 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                language={language}
                t={t}
                className="shadow-none rounded-none flex-1 flex flex-col"
              >
                {/* Tabs */}
                <div className="flex bg-muted/50 relative border-b border-amber-200">
                  <div 
                    className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300"
                    style={{ left: activeTab === "ride" ? "0%" : "50%", width: "50%" }}
                  />
                  <button 
                    onClick={() => setActiveTab("ride")} 
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 md:gap-1.5 py-3.5 md:py-3 px-4 md:px-4 font-medium transition-all text-sm md:text-sm relative border-r border-amber-200",
                      activeTab === "ride" ? "text-primary bg-amber-200 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-amber-100"
                    )}
                  >
                    <Car className="h-4 w-4 md:h-4 md:w-4" />
                    <span>{tSafe("pointToPoint", "Transfer")}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("hourly")} 
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 md:gap-1.5 py-3.5 md:py-3 px-4 md:px-4 font-medium transition-all text-sm md:text-sm",
                      activeTab === "hourly" ? "text-primary bg-amber-200 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-amber-100"
                    )}
                  >
                    <Timer className="h-4 w-4 md:h-4 md:w-4" />
                    <span>{tSafe("perHour", "Hourly")}</span>
                  </button>
                </div>

                {/* Form Content - Lazy loaded, flex-1 for mobile full height */}
                <div className="p-4 sm:p-4 md:p-5 lg:p-5 flex-1 flex flex-col">
                  {/* Form Content - No Suspense for faster LCP */}
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
                        // Route region detection
                        routeRegion={rideForm.routeRegion}
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
            </div>
          </SwipeableBookingCard>
            </div>

            {/* Trust badges and banner - hidden on mobile for cleaner look */}
            <div className="hidden sm:block">
              <HeroTrustBadges />
              
              {/* Payment Coming Soon Banner */}
              <Suspense fallback={null}>
                <PaymentComingSoonBanner language={language} compact className="mt-3" />
              </Suspense>
            </div>
          </div>

          {/* Visual Sections */}
          <SilentSectionErrorBoundary fallback={<div className="hidden md:block" />}>
            <Suspense fallback={<div className="hidden md:block" />}>
              <HeroVisualSection 
                videosLoaded={false} 
                cityVideos={[]} 
                currentVideoIndex={0} 
                language={language} 
                t={t} 
              />
            </Suspense>
          </SilentSectionErrorBoundary>
        </div>
      </div>
    </section>
  );
};
