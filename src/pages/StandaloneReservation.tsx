/**
 * Standalone Reservation Page for reservations.meettransfer.app
 * 
 * This page is designed for Google Business Profile integration.
 * It provides a complete booking flow without requiring authentication.
 * 
 * Features:
 * - Identical to Quick Booking flow
 * - No login required
 * - Full price generation
 * - Automatic driver assignment
 * - Auto-assigns "Meet Transfer Online" agency
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { Car, Timer, MapPin, Clock, Users, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";

// Custom hooks for form state management
import { useRideForm } from "@/hooks/useRideForm";
import { useHourlyForm } from "@/hooks/useHourlyForm";
import { useHeroFormStorage } from "@/hooks/useHeroFormStorage";

// Critical components
import { HeroHeader } from "@/components/hero/HeroHeader";
import { HeroTrustBadges } from "@/components/hero/HeroTrustBadges";
import { HeroBackground } from "@/components/hero/HeroBackground";
import { SwipeableBookingCard } from "@/components/hero/SwipeableBookingCard";
import { SilentSectionErrorBoundary } from "@/components/hero/SilentSectionErrorBoundary";

// Lazy load form content components
const RideFormContent = lazy(() => 
  import("@/components/hero/RideFormContent").then(m => ({ default: m.RideFormContent }))
);
const HourlyFormContent = lazy(() => 
  import("@/components/hero/HourlyFormContent").then(m => ({ default: m.HourlyFormContent }))
);
const ReturnTripPromoBanner = lazy(() => 
  import("@/components/hero/ReturnTripPromoBanner").then(m => ({ default: m.ReturnTripPromoBanner }))
);
const PaymentComingSoonBanner = lazy(() => 
  import("@/components/hero/PaymentComingSoonBanner").then(m => ({ default: m.PaymentComingSoonBanner }))
);

// Skeleton for form content during hydration
const FormSkeleton = () => (
  <div className="space-y-3 animate-pulse min-h-[300px]">
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

// Minimal header for standalone page
const StandaloneHeader = () => {
  const { language } = useLanguage();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="container flex h-14 items-center justify-between px-4">
        <a href="https://meettransfer.app" className="flex items-center gap-2">
          <img 
            src="/images/meet-transfer-logo.svg" 
            alt="Meet Transfer" 
            className="h-8 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="font-bold text-lg text-primary">Meet Transfer</span>
        </a>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="hidden sm:inline">
            {language === 'TR' ? 'Güvenli Rezervasyon' :
             language === 'DE' ? 'Sichere Buchung' :
             language === 'FR' ? 'Réservation Sécurisée' :
             language === 'RU' ? 'Безопасное бронирование' :
             'Secure Booking'}
          </span>
        </div>
      </div>
    </header>
  );
};

const StandaloneReservation = () => {
  const { t, language } = useLanguage();
  const { loadSavedFormData, saveFormData } = useHeroFormStorage();

  // Safe translation helper
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

  // SEO translations
  const seoTitle = language === 'TR' 
    ? 'Online Rezervasyon | Meet Transfer - VIP Havalimanı Transfer Hizmeti'
    : language === 'DE'
    ? 'Online Reservierung | Meet Transfer - VIP Flughafentransfer'
    : language === 'FR'
    ? 'Réservation en Ligne | Meet Transfer - Transfert VIP Aéroport'
    : language === 'RU'
    ? 'Онлайн бронирование | Meet Transfer - VIP Трансфер из аэропорта'
    : 'Online Reservation | Meet Transfer - VIP Airport Transfer Service';

  const seoDescription = language === 'TR'
    ? 'Meet Transfer ile online rezervasyon yapın. Mercedes araçlarla VIP havalimanı transfer hizmeti. Anında fiyat, güvenli ödeme.'
    : language === 'DE'
    ? 'Buchen Sie online bei Meet Transfer. VIP Flughafentransfer mit Mercedes-Fahrzeugen. Sofortpreise, sichere Zahlung.'
    : language === 'FR'
    ? 'Réservez en ligne avec Meet Transfer. Transfert VIP aéroport avec véhicules Mercedes. Prix instantanés, paiement sécurisé.'
    : language === 'RU'
    ? 'Бронируйте онлайн в Meet Transfer. VIP трансфер из аэропорта на Mercedes. Мгновенные цены, безопасная оплата.'
    : 'Book online with Meet Transfer. VIP airport transfer service with Mercedes vehicles. Instant prices, secure payment.';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords="airport transfer booking, VIP transfer reservation, Mercedes transfer, online booking"
        canonicalPath="/reserve"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', isGlobal: true },
        ]}
      />

      <StandaloneHeader />

      {/* Main Content */}
      <main className="flex-1 pt-14">
        <section id="booking-form" className="relative overflow-hidden bg-background min-h-[calc(100vh-3.5rem)]">
          <HeroBackground 
            videosLoaded={false} 
            cityVideos={[]} 
            currentVideoIndex={0} 
            setCurrentVideoIndex={() => {}} 
            language={language} 
          />

          <div className="container relative z-10 px-3 sm:px-4 md:px-6 py-8 md:py-12">
            <div className="max-w-xl mx-auto">
              {/* Page Title */}
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {language === 'TR' ? 'Hızlı Rezervasyon' :
                   language === 'DE' ? 'Schnellbuchung' :
                   language === 'FR' ? 'Réservation Rapide' :
                   language === 'RU' ? 'Быстрое бронирование' :
                   'Quick Reservation'}
                </h1>
                <p className="text-muted-foreground">
                  {language === 'TR' ? 'Birkaç adımda transfer rezervasyonunuzu tamamlayın' :
                   language === 'DE' ? 'Schließen Sie Ihre Transferbuchung in wenigen Schritten ab' :
                   language === 'FR' ? 'Finalisez votre réservation de transfert en quelques étapes' :
                   language === 'RU' ? 'Завершите бронирование трансфера за несколько шагов' :
                   'Complete your transfer reservation in a few steps'}
                </p>
              </div>

              {/* Promo Banner */}
              <SilentSectionErrorBoundary fallback={null}>
                <Suspense fallback={null}>
                  <ReturnTripPromoBanner language={language} onApplyPromoCode={rideForm.handleApplyPromoCode} />
                </Suspense>
              </SilentSectionErrorBoundary>

              {/* Booking Form Card */}
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
                    <span>{tSafe("pointToPoint", "Transfer")}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("hourly")} 
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 md:gap-1.5 py-3.5 md:py-3 px-4 md:px-4 font-medium transition-all text-sm md:text-sm",
                      activeTab === "hourly" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Timer className="h-4 w-4 md:h-4 md:w-4" />
                    <span>{tSafe("perHour", "Hourly")}</span>
                  </button>
                </div>

                {/* Form Content */}
                <div className="p-4 sm:p-4 md:p-5 lg:p-5">
                  <Suspense fallback={<FormSkeleton />}>
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
                        returnDate={rideForm.returnDate}
                        returnTime={rideForm.returnTime}
                        hasReturnTrip={rideForm.hasReturnTrip}
                        setReturnDate={rideForm.handleSetReturnDate}
                        setReturnTime={rideForm.handleSetReturnTime}
                        setHasReturnTrip={rideForm.handleSetHasReturnTrip}
                        babySeatCount={rideForm.babySeatCount}
                        luggageCount={rideForm.luggageCount}
                        setBabySeatCount={rideForm.handleSetBabySeatCount}
                        setLuggageCount={rideForm.handleSetLuggageCount}
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
                  </Suspense>
                </div>
              </SwipeableBookingCard>

              {/* Trust Badges */}
              <HeroTrustBadges />

              {/* Payment Coming Soon Banner */}
              <Suspense fallback={null}>
                <PaymentComingSoonBanner language={language} compact className="mt-3" />
              </Suspense>

              {/* Additional Info */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3 text-center">
                <div className="p-4 rounded-lg bg-card border">
                  <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium text-sm">
                    {language === 'TR' ? 'Kapıda Karşılama' :
                     language === 'DE' ? 'Meet & Greet' :
                     language === 'FR' ? 'Accueil personnalisé' :
                     'Meet & Greet'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'TR' ? 'İsim tabelasıyla' :
                     language === 'DE' ? 'Mit Namensschild' :
                     language === 'FR' ? 'Avec panneau nominatif' :
                     'With name sign'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-card border">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium text-sm">
                    {language === 'TR' ? '7/24 Hizmet' :
                     language === 'DE' ? '24/7 Service' :
                     language === 'FR' ? 'Service 24h/24' :
                     '24/7 Service'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'TR' ? 'Her zaman hazırız' :
                     language === 'DE' ? 'Immer bereit' :
                     language === 'FR' ? 'Toujours disponible' :
                     'Always ready'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-card border">
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium text-sm">
                    {language === 'TR' ? 'Profesyonel Şoförler' :
                     language === 'DE' ? 'Professionelle Fahrer' :
                     language === 'FR' ? 'Chauffeurs professionnels' :
                     'Professional Drivers'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'TR' ? 'Lisanslı ve deneyimli' :
                     language === 'DE' ? 'Lizenziert & erfahren' :
                     language === 'FR' ? 'Licenciés et expérimentés' :
                     'Licensed & experienced'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StandaloneReservation;
