import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadGoogleMapsScript, getDirections, geocodeAddress } from "@/utils/googleMapsLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import GooglePlacesAutocomplete, { PlaceDetails } from "@/components/ui/google-places-autocomplete";
import { MapPin, Users, Briefcase, ArrowRight, Loader2, Car, Sparkles, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface VehiclePriceInfo {
  vehicleType: string;
  vehicleLabel: string;
  price: number | null;
  currency: string;
  passengers: number;
  luggage: number;
  available: boolean;
}

interface PriceResult {
  prices: VehiclePriceInfo[];
  matched: boolean;
  matchedCity?: string;
  matchedAirport?: string;
  transferType?: string | null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  TRY: "₺",
  AED: "د.إ",
};

const LivePriceCalculator = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const getCurrencyByLanguage = (): string => {
    switch (language) {
      case "TR": return "TRY";
      case "RU": return "EUR";
      case "DE": return "EUR";
      case "FR": return "EUR";
      case "AR": return "AED";
      case "UK": return "EUR";
      default: return "EUR";
    }
  };

  const fetchPrices = useCallback(async () => {
    if (!pickup || !dropoff) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      let distanceKm: number | undefined;
      if (pickupCoords && dropoffCoords) {
        console.error('[LivePriceCalculator] Step 0 – Using coords:', { pickupCoords, dropoffCoords });
        try {
          const directions = await getDirections(pickupCoords, dropoffCoords);
          console.error('[LivePriceCalculator] Step 2 – getDirections result:', {
            hasDirections: !!directions,
            distanceKm: directions?.distanceKm,
            distanceMeters: directions?.distanceMeters,
            isValid: directions?.distanceKm != null && Number.isFinite(directions.distanceKm),
          });
          if (directions?.distanceKm != null && Number.isFinite(directions.distanceKm)) {
            distanceKm = directions.distanceKm;
          } else {
            console.error('[LivePriceCalculator] Step 2 – distance_km INVALID or missing, backend may use fallback');
          }
        } catch (err) {
          console.error('[LivePriceCalculator] Step 2 – getDirections threw:', err);
        }
      } else {
        console.error('[LivePriceCalculator] Step 0 – No coords, geocoding:', { pickup, dropoff });
        await loadGoogleMapsScript(["places"]);
        const [pickupGeo, dropoffGeo] = await Promise.all([
          geocodeAddress(pickup),
          geocodeAddress(dropoff),
        ]);
        console.error('[LivePriceCalculator] Step 0b – Geocode result:', {
          pickupGeo,
          dropoffGeo,
          hasBoth: !!(pickupGeo && dropoffGeo),
        });
        if (pickupGeo && dropoffGeo) {
          const directions = await getDirections(pickupGeo, dropoffGeo);
          console.error('[LivePriceCalculator] Step 2 – getDirections (geocode) result:', {
            hasDirections: !!directions,
            distanceKm: directions?.distanceKm,
            isValid: directions?.distanceKm != null && Number.isFinite(directions.distanceKm),
          });
          if (directions?.distanceKm != null && Number.isFinite(directions.distanceKm)) {
            distanceKm = directions.distanceKm;
          } else {
            console.error('[LivePriceCalculator] Step 2 – distance_km INVALID after geocode');
          }
        } else {
          console.error('[LivePriceCalculator] Step 0b – No coords after geocode, distance_km NOT sent – city pricing may fail');
        }
      }

      const body = { pickup, dropoff, customerCurrency: getCurrencyByLanguage(), distance_km: distanceKm };
      console.error('[LivePriceCalculator] Step 3 – Body to backend:', body);

      const { data, error } = await supabase.functions.invoke("get-all-vehicle-prices", { body });

      console.error('[LivePriceCalculator] Step 4 – Backend response:', {
        hasError: !!error,
        error: error?.message,
        hasData: !!data,
        message: data?.message,
        debug_reason: data?.debug_reason,
      });
      if (error) throw error;
      setPriceResult(data);
    } catch (error) {
      console.error("Price fetch error:", error);
      setPriceResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [pickup, dropoff, pickupCoords, dropoffCoords, language]);

  const handlePickupSelect = (value: string, details?: PlaceDetails) => {
    setPickup(details?.formattedAddress || value);
    setPickupCoords(details?.lat != null && details?.lng != null ? { lat: details.lat, lng: details.lng } : null);
    setPriceResult(null);
    setHasSearched(false);
  };

  const handleDropoffSelect = (value: string, details?: PlaceDetails) => {
    setDropoff(details?.formattedAddress || value);
    setDropoffCoords(details?.lat != null && details?.lng != null ? { lat: details.lat, lng: details.lng } : null);
    setPriceResult(null);
    setHasSearched(false);
  };

  const handleBookNow = (vehicleType: string) => {
    const params = new URLSearchParams({
      pickup,
      dropoff,
      vehicle: vehicleType,
    });
    navigate(`/quick-booking?${params.toString()}`);
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${symbol}${price.toLocaleString()}`;
  };

  const availablePrices = priceResult?.prices.filter(v => v.available) || [];

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Calculator className="w-4 h-4" />
            {t("instantPriceCalculator") || "Instant Price Calculator"}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t("calculateYourPrice") || "Calculate Your Transfer Price"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("selectLocationsForPrice") || "Select your pickup and dropoff locations to see instant prices for all vehicle options"}
          </p>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 shadow-lg border-primary/10">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {t("pickupLocation") || "Pickup Location"}
                </label>
                <GooglePlacesAutocomplete
                  placeholder={t("enterPickupLocation") || "Enter pickup address..."}
                  onPlaceSelected={handlePickupSelect}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-destructive" />
                  {t("dropoffLocation") || "Dropoff Location"}
                </label>
                <GooglePlacesAutocomplete
                  placeholder={t("enterDropoffLocation") || "Enter dropoff address..."}
                  onPlaceSelected={handleDropoffSelect}
                  className="w-full"
                />
              </div>
            </div>

            <Button
              onClick={fetchPrices}
              disabled={!pickup || !dropoff || isLoading}
              className="w-full md:w-auto"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("calculating") || "Calculating..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("getInstantPrices") || "Get Instant Prices"}
                </>
              )}
            </Button>
          </Card>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 flex flex-col items-center justify-center py-12"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
                <Car className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
              </div>
              <p className="mt-4 text-muted-foreground animate-pulse">
                {t("findingBestPrices") || "Finding the best prices for you..."}
              </p>
            </motion.div>
          )}

          {!isLoading && hasSearched && priceResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              {availablePrices.length > 0 ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {t("pricesFound") || "Prices found for your route"}
                    {priceResult.transferType === "Airport Transfer" && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {t("airportTransfer") || "Airport Transfer"}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {availablePrices.map((vehicle, index) => (
                      <motion.div
                        key={vehicle.vehicleType}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="p-5 hover:shadow-lg transition-all duration-300 hover:border-primary/30 group h-full flex flex-col">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                              {vehicle.vehicleLabel}
                            </h3>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {vehicle.passengers}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {vehicle.luggage}
                              </span>
                            </div>

                            <div className="text-2xl font-bold text-primary mb-4">
                              {formatPrice(vehicle.price!, vehicle.currency)}
                            </div>
                          </div>

                          <Button
                            onClick={() => handleBookNow(vehicle.vehicleType)}
                            variant="outline"
                            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                            size="sm"
                          >
                            {t("bookNow") || "Book Now"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <Card className="p-8 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {t("noPricesAvailable") || "Price on Request"}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {t("contactForCustomPrice") || "Contact us for a custom price quote for this route"}
                  </p>
                  <Button
                    onClick={() => navigate("/quick-booking")}
                    variant="default"
                  >
                    {t("requestPrice") || "Request Price"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default LivePriceCalculator;
