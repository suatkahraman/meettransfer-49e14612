import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, XCircle, MapPin, Calendar, Clock, Car, Users, DollarSign, RefreshCw, ArrowLeftRight, Tag, CheckCircle2, CreditCard, Banknote } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface BookingRequest {
  id: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  vehicle_type: string;
  passengers: number;
  status: string;
  price: number | null;
  price_currency: string;
  confirmation_token: string;
  payment_method?: string;
  payment_link?: string;
}

const vehicleLabels: Record<string, string> = {
  "mercedes-vito": "Mercedes Vito",
  "mercedes-vclass": "VIP Vito",
  maybach: "Maybach Minivan",
  minibus: "Minibus",
};

const VALID_PROMO_CODE = "Meet40Return";

export default function QuickBookingConfirm() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [waitingForPrice, setWaitingForPrice] = useState(false);
  
  // Return trip state
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  const [returnTripData, setReturnTripData] = useState({
    date: "",
    time: "",
  });
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [isPromoCodeValid, setIsPromoCodeValid] = useState<boolean | null>(null);
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "payment_link">("cash");

  const token = searchParams.get("token");
  const urlHasReturn = searchParams.get("hasReturn") === "true";
  const urlReturnDate = searchParams.get("returnDate") || "";
  const urlReturnTime = searchParams.get("returnTime") || "";
  const urlPromoCode = searchParams.get("promoCode") || "";

  // Pre-fill return trip and promo code from URL params
  useEffect(() => {
    if (urlHasReturn) {
      setHasReturnTrip(true);
      setReturnTripData({
        date: urlReturnDate,
        time: urlReturnTime,
      });
    }
    if (urlPromoCode) {
      setPromoCode(urlPromoCode);
      if (urlPromoCode.toLowerCase() === VALID_PROMO_CODE.toLowerCase()) {
        setIsPromoCodeValid(true);
      }
    }
  }, [urlHasReturn, urlReturnDate, urlReturnTime, urlPromoCode]);

  useEffect(() => {
    if (token) {
      fetchBooking(token);
    } else {
      setError("No confirmation token provided");
      setLoading(false);
    }
  }, [token]);

  // Realtime subscription for price updates
  useEffect(() => {
    if (!token || !waitingForPrice) return;

    console.log("Setting up realtime subscription for token:", token);
    
    const channel = supabase
      .channel(`quick-booking-${token}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "quick_booking_requests",
          filter: `confirmation_token=eq.${token}`,
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          const newData = payload.new as BookingRequest;
          
          if (newData.status === "price_sent" && newData.price) {
            toast.success("New price received! You can now review and confirm.");
            setBooking(newData);
            setWaitingForPrice(false);
            setError(null);
          } else if (newData.status === "rejected") {
            setError("This booking has been rejected");
            setWaitingForPrice(false);
          } else if (newData.status === "expired") {
            setError("This price offer has expired");
            setWaitingForPrice(false);
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      console.log("Removing realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [token, waitingForPrice]);

  const fetchBooking = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from("quick_booking_requests")
        .select("*")
        .eq("confirmation_token", token)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError("Booking request not found");
        return;
      }

      if (data.status === "confirmed") {
        setError("This booking has already been confirmed");
        return;
      }

      if (data.status === "rejected") {
        setError("This booking has been rejected");
        return;
      }

      if (data.status === "expired" || new Date(data.expires_at) < new Date()) {
        setError("This price offer has expired");
        return;
      }

      // If price not set yet OR price was rejected, show waiting state with realtime updates
      if (data.status === "pending" || data.status === "price_rejected") {
        setBooking(data as BookingRequest);
        setWaitingForPrice(true);
        return;
      }

      if (data.status !== "price_sent") {
        setError("Unable to process this booking request.");
        return;
      }

      setBooking(data as BookingRequest);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoCodeChange = (value: string) => {
    setPromoCode(value);
    if (value.trim() === "") {
      setIsPromoCodeValid(null);
    } else if (value.trim().toLowerCase() === VALID_PROMO_CODE.toLowerCase()) {
      setIsPromoCodeValid(true);
    } else {
      setIsPromoCodeValid(false);
    }
  };

  // Calculate return price with discount
  const getReturnPrice = () => {
    if (!booking?.price) return null;
    if (hasReturnTrip && isPromoCodeValid) {
      return booking.price * 0.7; // 30% discount
    }
    return hasReturnTrip ? booking.price : null;
  };

  const getTotalPrice = () => {
    if (!booking?.price) return null;
    const returnPrice = getReturnPrice();
    return booking.price + (returnPrice || 0);
  };

  const handleConfirm = async () => {
    if (!booking) return;

    // Validate return trip if enabled
    if (hasReturnTrip) {
      if (!returnTripData.date) {
        toast.error("Please select a return date");
        return;
      }
      if (!returnTripData.time) {
        toast.error("Please select a return time");
        return;
      }
    }

    setConfirming(true);
    try {
      // Calculate prices
      const returnPrice = getReturnPrice();
      const totalPrice = getTotalPrice();

      // Use edge function to create reservation (bypasses RLS for anonymous users)
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "create-quick-booking-reservation",
        {
          body: {
            bookingId: booking.id,
            pickup: booking.pickup,
            dropoff: booking.dropoff,
            pickupDate: booking.pickup_date,
            pickupTime: booking.pickup_time,
            vehicleType: booking.vehicle_type,
            passengers: booking.passengers,
            price: booking.price,
            priceCurrency: booking.price_currency,
            paymentMethod,
            hasReturnTrip,
            returnDate: returnTripData.date || null,
            returnTime: returnTripData.time || null,
            returnPrice: returnPrice || null,
            promoCode: isPromoCodeValid ? promoCode : null,
          },
        }
      );

      if (fnError) throw fnError;
      if (!result.success) throw new Error(result.error || "Failed to create reservation");

      const reservation = result.reservation;
      const returnReservationCode = result.returnReservation?.reservationCode || null;

      // Record price acceptance in history
      if (booking.price) {
        try {
          await supabase.from("price_history").insert({
            quick_booking_id: booking.id,
            price: booking.price,
            price_currency: booking.price_currency,
            action: "accepted",
          });
        } catch (e) {
          console.error("Failed to record price history:", e);
        }
      }

      // Admin notification is sent server-side from create-quick-booking-reservation
      // (avoids missed emails due to client network / navigation issues)

      // Navigate to customer info page to collect details
      const params = new URLSearchParams();
      params.set("reservationId", reservation.id);
      params.set("reservationCode", reservation.reservationCode || "");
      
      if (hasReturnTrip && returnReservationCode) {
        params.set("returnReservationCode", returnReservationCode);
      }

      navigate(`/quick-booking-info?${params.toString()}`);
    } catch (err: any) {
      console.error("Confirm error:", err);
      toast.error(err.message || "Failed to confirm booking");
      setError(err.message || "Failed to confirm booking");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!booking) return;

    setRejecting(true);
    try {
      // Update status to price_rejected instead of rejected - allows admin to send new price
      const { error } = await supabase
        .from("quick_booking_requests")
        .update({
          status: "price_rejected",
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Record price rejection in history
      if (booking.price) {
        try {
          await supabase.from("price_history").insert({
            quick_booking_id: booking.id,
            price: booking.price,
            price_currency: booking.price_currency,
            action: "rejected",
          });
        } catch (e) {
          console.error("Failed to record price history:", e);
        }
      }

      // Notify admin about the rejection so they can send a new price
      try {
        await supabase.functions.invoke("notify-admin-quick-booking-rejected", {
          body: {
            bookingId: booking.id,
            pickup: booking.pickup,
            dropoff: booking.dropoff,
            pickupDate: booking.pickup_date,
            pickupTime: booking.pickup_time,
            vehicleType: booking.vehicle_type,
            passengers: booking.passengers,
            price: booking.price,
            priceCurrency: booking.price_currency,
            priceRejected: true, // Flag to indicate price was rejected, not booking
          },
        });
      } catch (notifyError) {
        console.error("Failed to notify admin about rejection:", notifyError);
        // Don't block the flow if notification fails
      }

      // Show waiting state - customer waits for new price
      setBooking({ ...booking, status: "price_rejected", price: null });
      setWaitingForPrice(true);
      toast.info("Price rejected. Admin will send you a new offer soon.");
    } catch (err: any) {
      console.error("Reject error:", err);
      setError(err.message || "Failed to reject price");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">{t("qbLoadingPriceQuote")}</h2>
            <p className="text-muted-foreground">{t("qbPleaseWait")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("qbUnableToLoad")}</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")}>{t("qbGoToHomepage")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) return null;

  // Waiting for price state
  if (waitingForPrice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{t("qbWaitingForPrice")}</h1>
              <p className="text-muted-foreground">
                {t("qbWaitingForPriceDesc")}
              </p>
            </div>

            {/* Transfer Details */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("qbPickup")}</p>
                  <p className="font-medium">{booking.pickup}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("qbDropoff")}</p>
                  <p className="font-medium">{booking.dropoff}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("qbDate")}</p>
                    <p className="font-medium">
                      {format(parseISO(booking.pickup_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("qbTime")}</p>
                    <p className="font-medium">{booking.pickup_time}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("qbVehicle")}</p>
                    <p className="font-medium">{vehicleLabels[booking.vehicle_type]}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("qbPassengers")}</p>
                    <p className="font-medium">{booking.passengers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Waiting indicator */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-spin" />
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  {t("qbWaitingForPriceQuote")}
                </p>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t("qbPageAutoUpdate")}
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              {t("qbKeepPageOpen")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("qbYourPriceQuote")}</h1>
            <p className="text-muted-foreground">
              {t("qbReviewAndConfirm")}
            </p>
          </div>

          {/* Transfer Details */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t("qbPickup")}</p>
                <p className="font-medium">{booking.pickup}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t("qbDropoff")}</p>
                <p className="font-medium">{booking.dropoff}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("qbDate")}</p>
                  <p className="font-medium">
                    {format(parseISO(booking.pickup_date), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("qbTime")}</p>
                  <p className="font-medium">{booking.pickup_time}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("qbVehicle")}</p>
                  <p className="font-medium">{vehicleLabels[booking.vehicle_type]}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("qbPassengers")}</p>
                  <p className="font-medium">{booking.passengers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Return Trip Option */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3 mb-4">
              <Checkbox
                id="returnTrip"
                checked={hasReturnTrip}
                onCheckedChange={(checked) => setHasReturnTrip(checked === true)}
              />
              <Label htmlFor="returnTrip" className="flex items-center gap-2 cursor-pointer font-medium">
                <ArrowLeftRight className="h-4 w-4 text-primary" />
                {t("qbAddReturnTransfer")}
              </Label>
            </div>

            {hasReturnTrip && (
              <div className="space-y-4 mt-4 pl-6 border-l-2 border-primary/30">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="returnDate">{t("qbReturnDate")}</Label>
                    <Input
                      id="returnDate"
                      type="date"
                      value={returnTripData.date}
                      onChange={(e) => setReturnTripData(prev => ({ ...prev, date: e.target.value }))}
                      min={booking.pickup_date}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="returnTime">{t("qbReturnTime")}</Label>
                    <Input
                      id="returnTime"
                      type="time"
                      value={returnTripData.time}
                      onChange={(e) => setReturnTripData(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Promo Code Section */}
                <div className="space-y-2">
                  <Label htmlFor="promoCode" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {t("qbPromoCodeLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="promoCode"
                      placeholder={t("qbEnterPromoCode")}
                      value={promoCode}
                      onChange={(e) => handlePromoCodeChange(e.target.value)}
                      className={`pr-10 ${
                        isPromoCodeValid === true ? "border-green-500 focus:ring-green-500" :
                        isPromoCodeValid === false ? "border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                    {isPromoCodeValid === true && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                    {isPromoCodeValid === false && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                    )}
                  </div>
                  {isPromoCodeValid === true && (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("qbDiscountApplied")}
                    </p>
                  )}
                  {isPromoCodeValid === false && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {t("qbInvalidPromoCode")}
                    </p>
                  )}
                </div>

                <div className="bg-primary/5 rounded p-3 text-sm">
                  <p className="text-muted-foreground">
                    <strong>{t("qbReturnRoute")}:</strong> {booking.dropoff} → {booking.pickup}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Price Display */}
          <div className="bg-primary/10 rounded-lg p-6 mb-6 text-center">
            {!hasReturnTrip ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">{t("qbYourTransferPrice")}</p>
                <p className="text-4xl font-bold text-primary">
                  {booking.price_currency === "EUR" && "€"}
                  {booking.price_currency === "USD" && "$"}
                  {booking.price_currency === "GBP" && "£"}
                  {booking.price_currency === "TRY" && "₺"}
                  {booking.price_currency === "AED" && "د.إ"}
                  {booking.price_currency === "AUD" && "A$"}
                  {booking.price}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {booking.price_currency}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span>{t("qbOutboundTransfer")}</span>
                  <span className="font-medium">
                    {booking.price_currency === "EUR" && "€"}
                    {booking.price_currency === "USD" && "$"}
                    {booking.price_currency === "GBP" && "£"}
                    {booking.price_currency === "TRY" && "₺"}
                    {booking.price_currency === "AED" && "د.إ"}
                    {booking.price_currency === "AUD" && "A$"}
                    {booking.price}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2">
                    {t("qbReturnTransfer")}
                    {isPromoCodeValid && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                        30% OFF
                      </span>
                    )}
                  </span>
                  <span className="font-medium">
                    {isPromoCodeValid && booking.price && (
                      <span className="line-through text-muted-foreground mr-2">
                        {booking.price_currency === "EUR" && "€"}
                        {booking.price_currency === "USD" && "$"}
                        {booking.price_currency === "GBP" && "£"}
                        {booking.price_currency === "TRY" && "₺"}
                        {booking.price_currency === "AED" && "د.إ"}
                        {booking.price_currency === "AUD" && "A$"}
                        {booking.price}
                      </span>
                    )}
                    {booking.price_currency === "EUR" && "€"}
                    {booking.price_currency === "USD" && "$"}
                    {booking.price_currency === "GBP" && "£"}
                    {booking.price_currency === "TRY" && "₺"}
                    {booking.price_currency === "AED" && "د.إ"}
                    {booking.price_currency === "AUD" && "A$"}
                    {getReturnPrice()?.toFixed(0)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t("qbTotal")}</span>
                    <span className="text-2xl font-bold text-primary">
                      {booking.price_currency === "EUR" && "€"}
                      {booking.price_currency === "USD" && "$"}
                      {booking.price_currency === "GBP" && "£"}
                      {booking.price_currency === "TRY" && "₺"}
                      {booking.price_currency === "AED" && "د.إ"}
                      {booking.price_currency === "AUD" && "A$"}
                      {getTotalPrice()?.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <Label className="text-base font-medium mb-4 block">{t("qbPaymentMethod")}</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as "cash" | "payment_link")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{t("qbPayCashToDriver")}</p>
                    <p className="text-sm text-muted-foreground">{t("qbPayCashDesc")}</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="payment_link" id="payment_link" />
                <Label htmlFor="payment_link" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{t("qbPayOnline")}</p>
                    <p className="text-sm text-muted-foreground">{t("qbPayOnlineDesc")}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={rejecting || confirming}
              className="h-12"
            >
              {rejecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {t("qbReject")}
            </Button>

            <Button
              onClick={handleConfirm}
              disabled={confirming || rejecting}
              className="h-12"
            >
              {confirming ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {t("qbConfirmBooking")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {t("qbByConfirming")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
