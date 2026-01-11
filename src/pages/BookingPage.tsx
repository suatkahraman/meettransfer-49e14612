import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parse } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";
import { 
  MapPin, Navigation, Calendar, Clock, Users, Briefcase, Baby, 
  ArrowRight, Loader2, CheckCircle, ArrowLeftRight, Tag, Mail, 
  Phone, MessageSquare, Car, Coins
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPE_MAP, getAvailableVehicles, isMinibusRequired } from "@/lib/vehicleTypes";
import { CURRENCY_OPTIONS } from "@/lib/currency";
import WebsiteLayout from "@/components/website/WebsiteLayout";

interface VehiclePrice {
  vehicleType: string;
  price: number | null;
  currency: string;
}

const getSessionId = () => {
  let sessionId = localStorage.getItem('quick_booking_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('quick_booking_session_id', sessionId);
  }
  return sessionId;
};

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language, getLocalizedPath } = useLanguage();
  const { user } = useAuth();

  // Get URL params from Hero
  const urlPickup = searchParams.get("pickup") || "";
  const urlDropoff = searchParams.get("dropoff") || "";
  const urlDate = searchParams.get("date") || "";
  const urlTime = searchParams.get("time") || "";

  // Form state
  const [vehicleType, setVehicleType] = useState("mercedes-vito");
  const [passengers, setPassengers] = useState(1);
  const [luggageCount, setLuggageCount] = useState(1);
  const [babySeatCount, setBabySeatCount] = useState(0);
  const [preferredCurrency, setPreferredCurrency] = useState("EUR");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isPromoCodeValid, setIsPromoCodeValid] = useState<boolean | null>(null);

  // Price state
  const [vehiclePrices, setVehiclePrices] = useState<VehiclePrice[]>([]);
  const [isPricesLoading, setIsPricesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Computed values
  const availableVehicles = getAvailableVehicles(passengers, luggageCount);
  const minibusRequired = isMinibusRequired(passengers, luggageCount);

  // Auto-select minibus if required
  useEffect(() => {
    if (minibusRequired && vehicleType !== 'minibus') {
      setVehicleType('minibus');
    }
  }, [minibusRequired, vehicleType]);

  // Redirect if no URL params
  useEffect(() => {
    if (!urlPickup || !urlDropoff || !urlDate || !urlTime) {
      navigate(getLocalizedPath("/"));
    }
  }, [urlPickup, urlDropoff, urlDate, urlTime, navigate, getLocalizedPath]);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setCustomerEmail(user.email || "");
    }
  }, [user]);

  // Fetch vehicle prices
  useEffect(() => {
    const fetchPrices = async () => {
      if (!urlPickup || !urlDropoff) return;
      
      setIsPricesLoading(true);
      try {
        const { data } = await supabase.functions.invoke("get-all-vehicle-prices", {
          body: {
            pickup: urlPickup,
            dropoff: urlDropoff,
            customerCurrency: preferredCurrency,
          },
        });

        if (data?.prices) {
          setVehiclePrices(data.prices);
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
      } finally {
        setIsPricesLoading(false);
      }
    };

    fetchPrices();
  }, [urlPickup, urlDropoff, preferredCurrency]);

  // Get price for a specific vehicle
  const getPriceForVehicle = (vType: string) => {
    const priceData = vehiclePrices.find(p => p.vehicleType === vType);
    return priceData?.price || null;
  };

  // Handle promo code
  const handlePromoCodeChange = (value: string) => {
    setPromoCode(value);
    if (value.trim() === "") {
      setIsPromoCodeValid(null);
    } else if (value.trim().toLowerCase() === "meet40return") {
      setIsPromoCodeValid(true);
    } else {
      setIsPromoCodeValid(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!customerPhone || customerPhone.length < 8) {
      toast.error(t("phoneRequired") || "Phone number is required");
      return;
    }

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      toast.error(t("invalidEmail") || "Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    
    try {
      const sessionId = getSessionId();

      const { data, error } = await supabase
        .from("quick_booking_requests")
        .insert({
          pickup: urlPickup,
          dropoff: urlDropoff,
          pickup_date: urlDate,
          pickup_time: urlTime,
          vehicle_type: vehicleType,
          passengers,
          luggage_count: luggageCount,
          baby_seat_count: babySeatCount,
          customer_session_id: sessionId,
          price_currency: preferredCurrency,
          customer_notes: customerNotes.trim() || null,
          customer_phone: customerPhone.trim() || null,
          customer_email: customerEmail.trim() || null,
          language: language.toLowerCase(),
          has_return_trip: hasReturnTrip && returnDate && returnTime ? true : false,
          return_date: hasReturnTrip && returnDate ? returnDate : null,
          return_time: hasReturnTrip && returnTime ? returnTime : null,
          promo_code: hasReturnTrip && isPromoCodeValid && promoCode ? promoCode : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Try auto-pricing
      let autoPriceResult: { matched?: boolean } | null = null;
      try {
        const { data: autoPriceData } = await supabase.functions.invoke("auto-price-quick-booking", {
          body: { quick_booking_id: data.id },
        });
        autoPriceResult = autoPriceData;
      } catch (autoPriceError) {
        console.error("Auto-pricing failed:", autoPriceError);
      }

      // Notify admin if auto-pricing didn't work
      if (!autoPriceResult?.matched) {
        try {
          await supabase.functions.invoke("notify-admin-quick-booking-new", {
            body: {
              bookingId: data.id,
              pickup: urlPickup,
              dropoff: urlDropoff,
              pickupDate: urlDate,
              pickupTime: urlTime,
              vehicleType,
              passengers,
              priceCurrency: preferredCurrency,
              customerEmail: customerEmail.trim() || null,
              customerPhone: customerPhone.trim() || null,
              customerNotes: customerNotes.trim() || null,
            },
          });
        } catch (notifyError) {
          console.error("Failed to notify admin:", notifyError);
        }
      }

      let url = `/quick-booking-confirm?token=${data.confirmation_token}&new=true`;
      if (hasReturnTrip && returnDate && returnTime) {
        url += `&hasReturn=true&returnDate=${returnDate}&returnTime=${returnTime}`;
        if (isPromoCodeValid && promoCode) {
          url += `&promoCode=${encodeURIComponent(promoCode)}`;
        }
      }
      navigate(url);

      if (autoPriceResult?.matched) {
        toast.success(t("priceCalculated") || "Price has been calculated!");
      } else {
        toast.success(t("priceRequestSent") || "Your request has been sent!");
      }
    } catch (error: unknown) {
      console.error("Error submitting:", error);
      toast.error((error as Error).message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  // Parse date for display
  const displayDate = urlDate ? format(parse(urlDate, "yyyy-MM-dd", new Date()), "dd MMM yyyy") : "";
  const selectedPrice = getPriceForVehicle(vehicleType);

  // Time options
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      timeOptions.push(`${h}:${m}`);
    }
  }

  return (
    <WebsiteLayout>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background py-8 md:py-12">
        <div className="container max-w-4xl px-4">
          {/* Header with Trip Info */}
          <div className="bg-primary text-white rounded-2xl p-6 mb-8 shadow-xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{t("completeBooking") || "Complete Your Booking"}</h1>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-1 text-accent shrink-0" />
                <div>
                  <p className="text-white/70 text-sm">{t("pickupPoint")}</p>
                  <p className="font-medium">{urlPickup}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Navigation className="h-5 w-5 mt-1 text-accent shrink-0" />
                <div>
                  <p className="text-white/70 text-sm">{t("dropoffLocation")}</p>
                  <p className="font-medium">{urlDropoff}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 mt-1 text-accent shrink-0" />
                <div>
                  <p className="text-white/70 text-sm">{t("pickupDate")}</p>
                  <p className="font-medium">{displayDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-1 text-accent shrink-0" />
                <div>
                  <p className="text-white/70 text-sm">{t("pickupTime")}</p>
                  <p className="font-medium">{urlTime}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vehicle Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    {t("selectVehicle") || "Select Vehicle"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {availableVehicles.map((v) => {
                      const price = getPriceForVehicle(v.value);
                      const isSelected = vehicleType === v.value;
                      const isDisabled = minibusRequired && v.value !== 'minibus';
                      
                      return (
                        <button
                          key={v.value}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setVehicleType(v.value)}
                          className={cn(
                            "relative overflow-hidden rounded-xl p-4 transition-all duration-300 text-left border-2",
                            "hover:shadow-lg",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          
                          <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
                            <img
                              src={v.images[0]?.src}
                              alt={v.label}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          
                          <h3 className="font-semibold text-foreground mb-2">{v.label}</h3>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {v.passengers}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {v.luggage}
                            </span>
                          </div>
                          
                          {isPricesLoading ? (
                            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                          ) : price ? (
                            <p className="text-lg font-bold text-primary">
                              {price} {preferredCurrency}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {t("priceOnRequest") || "Price on request"}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Passengers & Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {t("tripDetails") || "Trip Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">{t("passengers")}</Label>
                      <Select value={passengers.toString()} onValueChange={(v) => setPassengers(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 19 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">{t("luggageCount") || "Luggage"}</Label>
                      <Select value={luggageCount.toString()} onValueChange={(v) => setLuggageCount(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 20 }, (_, i) => i).map((num) => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">{t("babySeat") || "Baby Seat"}</Label>
                      <Select value={babySeatCount.toString()} onValueChange={(v) => setBabySeatCount(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2].map((num) => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Currency Selection */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      {t("preferredCurrency") || "Currency"}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {CURRENCY_OPTIONS.map((currency) => (
                        <button
                          key={currency.value}
                          type="button"
                          onClick={() => setPreferredCurrency(currency.value)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm border",
                            preferredCurrency === currency.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted hover:bg-muted/80 border-transparent"
                          )}
                        >
                          <span>{currency.flag}</span>
                          <span>{currency.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Return Trip */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowLeftRight className="h-5 w-5 text-primary" />
                    {t("returnTrip") || "Return Trip"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="returnTrip"
                      checked={hasReturnTrip}
                      onCheckedChange={(checked) => setHasReturnTrip(checked === true)}
                    />
                    <Label htmlFor="returnTrip" className="cursor-pointer font-medium">
                      {t("addReturnTrip") || "Add return trip"}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-accent bg-accent/10 px-4 py-3 rounded-lg">
                    <Tag className="h-4 w-4 shrink-0" />
                    <span>{t("returnTripDiscount") || "Book round-trip & get 30% OFF on return! Use code: Meet40Return"}</span>
                  </div>

                  {hasReturnTrip && (
                    <div className="grid sm:grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">{t("returnDate")}</Label>
                        <Input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          min={urlDate}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">{t("returnTime")}</Label>
                        <Select value={returnTime} onValueChange={setReturnTime}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectTime")} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {timeOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-sm text-muted-foreground mb-2 block">{t("promoCode") || "Promo Code"}</Label>
                        <div className="relative">
                          <Input
                            placeholder="Meet40Return"
                            value={promoCode}
                            onChange={(e) => handlePromoCodeChange(e.target.value)}
                            className={cn(
                              isPromoCodeValid === true && "border-green-500 ring-1 ring-green-500",
                              isPromoCodeValid === false && "border-red-500 ring-1 ring-red-500"
                            )}
                          />
                          {isPromoCodeValid === true && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                          )}
                        </div>
                        {isPromoCodeValid === true && (
                          <p className="text-green-600 text-sm mt-1">✓ {t("promoCodeAccepted") || "30% discount will be applied!"}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    {t("contactInfo") || "Contact Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      {t("phoneNumber") || "Phone"} <span className="text-red-500">*</span>
                    </Label>
                    <PhoneInput
                      value={customerPhone}
                      onChange={setCustomerPhone}
                      placeholder="555 123 4567"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t("email") || "Email"} <span className="text-muted-foreground text-xs">({t("optional")})</span>
                    </Label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t("specialRequests") || "Notes"}
                    </Label>
                    <Textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder={t("specialRequestsPlaceholder") || "Flight number, special requirements..."}
                      className="resize-none min-h-[80px]"
                      maxLength={500}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Price Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="shadow-xl border-primary/20">
                  <CardHeader className="bg-primary text-white rounded-t-xl">
                    <CardTitle>{t("priceSummary") || "Price Summary"}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{t("vehicle") || "Vehicle"}</span>
                      <span className="font-medium">{VEHICLE_TYPE_MAP[vehicleType]?.label || vehicleType}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{t("passengers")}</span>
                      <span className="font-medium">{passengers}</span>
                    </div>
                    
                    <div className="border-t pt-4">
                      {isPricesLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : selectedPrice ? (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">{t("totalPrice") || "Total"}</p>
                          <p className="text-3xl font-bold text-primary">
                            {selectedPrice} {preferredCurrency}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-muted-foreground text-sm">
                            {t("priceOnRequestDesc") || "Price will be sent to you shortly"}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleSubmit}
                      size="lg"
                      variant="accent"
                      className="w-full h-14 text-lg font-semibold group"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t("sending") || "Sending..."}
                        </>
                      ) : (
                        <>
                          {t("confirmBooking") || "Confirm Booking"}
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      {t("freeCancel") || "Free cancellation up to 24h before"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default BookingPage;
