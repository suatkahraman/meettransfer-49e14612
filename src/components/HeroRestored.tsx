import { useState, useEffect, useRef } from "react";
import { Car, Timer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { HeroBackground } from "@/components/hero/HeroBackground";
import { HeroHeader } from "@/components/hero/HeroHeader";

// Custom hooks for form state management
import { useRideForm } from "@/hooks/useRideForm";
import { useHourlyForm } from "@/hooks/useHourlyForm";
import { useHeroFormStorage } from "@/hooks/useHeroFormStorage";

// Form content components - eagerly import for faster LCP
import { RideFormContent } from "@/components/hero/RideFormContent";
import { HourlyFormContent } from "@/components/hero/HourlyFormContent";
import { SwipeableBookingCard } from "@/components/hero/SwipeableBookingCard";

// Lazy load non-critical info banner - loads after LCP
const InstantBookingInfo = lazy(() => import("@/components/hero/InstantBookingInfo").then(m => ({ default: m.InstantBookingInfo })));

import { lazy, Suspense } from "react";

export const HeroRestored = () => {
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
  
  // Tab state with error handling
  const [activeTab, setActiveTab] = useState<"ride" | "hourly">(() => {
    try {
      return loadSavedFormData()?.activeTab || "ride";
    } catch {
      return "ride";
    }
  });
  
  // Use custom hooks for form management with error handling
  let rideForm: any = {};
  let hourlyForm: any = {};
  
  try {
    rideForm = useRideForm(t);
    hourlyForm = useHourlyForm(t, rideForm.appliedPromoCode);
  } catch (error) {
    console.error("[HeroRestored] Form hooks error:", error);
    // Provide minimal fallback form data
    rideForm = {
      pickup: "", dropoff: "", date: new Date(), time: "12:00",
      passengers: "2", vehicleType: "mercedes-vito",
      handlePickupSelected: () => {}, handleDropoffSelected: () => {},
      handleSwapLocations: () => {}, handleSetDate: () => {},
      handleSetTime: () => {}, handleSetPassengers: () => {},
      handleSetVehicleType: () => {}, handleRideContinue: () => {},
      getFormData: () => ({})
    };
    hourlyForm = {
      hourlyCity: "", hourlyDate: new Date(), hourlyTime: "12:00",
      hourlyDuration: "4", hourlyPassengers: "2", hourlyVehicleType: "mercedes-vito",
      handleSetHourlyCity: () => {}, handleSetHourlyDate: () => {},
      handleSetHourlyTime: () => {}, handleSetHourlyDuration: () => {},
      handleSetHourlyPassengers: () => {}, handleSetHourlyVehicleType: () => {},
      handleHourlyContinue: () => {}, fetchCitiesIfNeeded: () => {},
      getFormData: () => ({})
    };
  }
  
  // Save form data to localStorage when it changes - with error handling
  useEffect(() => {
    try {
      const formData = {
        activeTab,
        ...rideForm.getFormData(),
        ...hourlyForm.getFormData()
      };
      saveFormData(formData);
    } catch (error) {
      console.error("[HeroRestored] Save form data error:", error);
    }
  }, [
    activeTab,
    rideForm.getFormData,
    hourlyForm.getFormData,
    saveFormData
  ]);
  
  // Fetch cities when hourly tab becomes active - with error handling
  useEffect(() => {
    if (activeTab === 'hourly') {
      const timer = setTimeout(() => {
        try {
          hourlyForm.fetchCitiesIfNeeded();
        } catch (error) {
          console.error("[HeroRestored] Fetch cities error:", error);
        }
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

      {/* Mobile-first layout: Full viewport on mobile, grid on desktop */}
      <div className="container relative z-10 px-0 pt-0 pb-0 sm:px-3 sm:pt-4 sm:pb-4 md:px-4 md:pt-8 md:pb-8 lg:pb-16">
        <div className="grid min-h-[100svh] items-start gap-0 sm:min-h-[calc(100svh-8rem)] sm:gap-4 md:min-h-[calc(100svh-6rem)] md:grid-cols-5 md:gap-6 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left Side - Form (order-1 is default) */}
          <div className="h-full md:col-span-3 md:h-auto lg:col-span-1">
            {/* Unified container - Full screen mobile, card on desktop */}
            <div className="flex min-h-[100svh] flex-col overflow-hidden bg-card shadow-lg sm:min-h-0 sm:rounded-2xl">
              {/* Header inside the card - mobile-first padding */}
              <div className="p-4 pb-2 pt-6 sm:p-5 sm:pb-3 sm:pt-4 md:p-6">
                <HeroHeader language={language} />
                <p className="mt-2 text-sm font-semibold text-primary/90 text-center sm:text-left">
                  {tSafe("heroAITagline", "Meet AI: Plan Your Journey, Book with One Click!")}
                </p>
                <Suspense fallback={<div className="mt-3 h-[72px]" />}>
                  <InstantBookingInfo language={language} className="mt-3" />
                </Suspense>
              </div>

              {/* Booking Form Card - Critical for LCP, no Suspense wrapper */}
              <SwipeableBookingCard 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                language={language}
                t={t}
                className="shadow-none rounded-none flex-1 flex flex-col"
              >
                {/* Tabs - mobile-first with minimal desktop overrides */}
                <div className="relative flex border-b border-amber-200 bg-muted/50">
                  <div 
                    className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300"
                    style={{ left: activeTab === "ride" ? "0%" : "50%", width: "50%" }}
                  />
                  <button 
                    onClick={() => setActiveTab("ride")} 
                    className={cn(
                      "relative flex flex-1 items-center justify-center gap-2 border-r border-amber-200 px-4 py-4 text-xl font-bold transition-all",
                      activeTab === "ride" ? "bg-amber-200 text-primary shadow-sm" : "text-muted-foreground hover:bg-amber-100 hover:text-foreground"
                    )}
                  >
                    <Car className="h-6 w-6" />
                    <span>{tSafe("pointToPoint", "Transfer")}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("hourly")} 
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 px-4 py-4 text-xl font-bold transition-all",
                      activeTab === "hourly" ? "bg-amber-200 text-primary shadow-sm" : "text-muted-foreground hover:bg-amber-100 hover:text-foreground"
                    )}
                  >
                    <Timer className="h-6 w-6" />
                    <span>{tSafe("perHour", "Hourly")}</span>
                  </button>
                </div>

                {/* Form Content - flex-1 for mobile full height, mobile-first padding */}
                <div className="flex flex-1 flex-col p-4 md:p-5">
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
                      // Baby seat & luggage
                      babySeatCount={rideForm.babySeatCount}
                      luggageCount={rideForm.luggageCount}
                      setBabySeatCount={rideForm.handleSetBabySeatCount}
                      setLuggageCount={rideForm.handleSetLuggageCount}
                      // Promo code
                      appliedPromoCode={rideForm.appliedPromoCode}
                      handleApplyPromoCode={rideForm.handleApplyPromoCode}
                      // Price info
                      transferPrice={rideForm.transferPrice}
                      returnTransferPrice={rideForm.returnTransferPrice}
                      totalPrice={rideForm.totalPrice}
                      priceBreakdown={rideForm.priceBreakdown}
                      // Error handling
                      errors={rideForm.errors}
                      setErrors={rideForm.setErrors}
                    />
                  ) : (
                    <HourlyFormContent
                      hourlyCity={hourlyForm.hourlyCity}
                      hourlyDate={hourlyForm.hourlyDate}
                      hourlyTime={hourlyForm.hourlyTime}
                      hourlyDuration={hourlyForm.hourlyDuration}
                      hourlyPassengers={hourlyForm.hourlyPassengers}
                      hourlyVehicleType={hourlyForm.hourlyVehicleType}
                      customHours={hourlyForm.customHours}
                      availableCities={hourlyForm.availableCities}
                      availableDurations={hourlyForm.availableDurations}
                      allHourlyPrices={hourlyForm.allHourlyPrices}
                      loadingPrice={hourlyForm.loadingPrice}
                      loadingCities={hourlyForm.loadingCities}
                      submitting={hourlyForm.submitting}
                      language={language}
                      t={t}
                      onSetHourlyCity={hourlyForm.handleSetHourlyCity}
                      onSetHourlyDate={hourlyForm.handleSetHourlyDate}
                      onSetHourlyTime={hourlyForm.handleSetHourlyTime}
                      onSetHourlyDuration={hourlyForm.handleSetHourlyDuration}
                      onSetCustomHours={hourlyForm.handleSetCustomHours}
                      onSetHourlyPassengers={hourlyForm.handleSetHourlyPassengers}
                      onSetHourlyVehicleType={hourlyForm.handleSetHourlyVehicleType}
                      onHourlyContinue={hourlyForm.handleHourlyContinue}
                      // Promo code
                      appliedPromoCode={hourlyForm.appliedPromoCode}
                      onApplyPromoCode={hourlyForm.handleApplyPromoCode}
                      // Price info
                      hourlyPrice={hourlyForm.hourlyPrice}
                      totalHourlyPrice={hourlyForm.totalHourlyPrice}
                      priceBreakdown={hourlyForm.priceBreakdown}
                      // Error handling
                      errors={hourlyForm.errors}
                      setErrors={hourlyForm.setErrors}
                    />
                  )}
                </div>
              </SwipeableBookingCard>
            </div>
          </div>

          {/* Right Side - Visual (order-2 on desktop) */}
          <div className="hidden md:block md:col-span-2 lg:col-span-1">
            <div className="h-full flex items-center justify-center p-8">
              {/* Lazy load visual section after LCP */}
              <Suspense fallback={<div className="h-96 w-full bg-muted rounded-2xl animate-pulse" />}>
                <div className="h-96 w-full bg-muted rounded-2xl flex items-center justify-center">
                  <p className="text-muted-foreground">Visual content loading...</p>
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroRestored;