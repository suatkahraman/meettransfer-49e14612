import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PhoneInput } from "@/components/ui/phone-input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Phone, Mail, MapPin, Calendar, Clock, Car, CheckCircle, Lock, Eye, EyeOff, ArrowLeftRight, Tag, CreditCard, Banknote, CheckCircle2, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePromo } from "@/contexts/PromoContext";
import { validatePromoCode } from "@/hooks/useActivePromoCode";
import { z } from "zod";
import { VehicleSelectionCard } from "@/components/VehicleSelectionCard";
import { VEHICLE_TYPES } from "@/lib/vehicleTypes";
import { CompactRouteMap } from "@/components/ui/compact-route-map";
import { getCurrencySymbol } from "@/lib/currency";

const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(100)
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/\d.*\d.*\d.*\d/, 'Password must contain at least 4 digits');

const customerInfoSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().min(7, "Phone number is required").max(20).regex(/^[+\d\s\-()]*$/, "Invalid phone format"),
  email: z.string().trim().email("Invalid email address").max(255),
  password: passwordSchema,
});

const vehicleLabels: Record<string, string> = {
  "mercedes-vito": "Mercedes Vito",
  "vip-mercedes": "VIP Mercedes",
  "maybach-minibus": "Maybach Minibus",
  minibus: "Mercedes Sprinter",
};

const VALID_PROMO_CODES = ['Meet30Return', 'MEET30RETURN', 'GIDISDONUS', 'RETURN30', 'MEET30'];

export default function QuickBookingCustomerInfo() {
  const { t, language } = useLanguage();
  const { promoCode: activePromo } = usePromo();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const token = searchParams.get("token") || "";
  const bookingId = searchParams.get("bookingId") || "";
  const selectedVehicleParam = searchParams.get("selectedVehicle") || "";
  const selectedPriceParam = searchParams.get("selectedPrice") || "";
  const currencyParam = searchParams.get("currency") || "EUR";
  const isDiscounted = searchParams.get("isDiscounted") === "true";

  const [bookingData, setBookingData] = useState<{
    pickup: string;
    dropoff: string;
    pickup_date: string;
    pickup_time: string;
    vehicle_type: string;
    price: number | null;
    price_currency: string;
    passengers: number;
    all_vehicle_prices?: Record<string, number> | null;
    customer_email?: string | null;
    customer_phone?: string | null;
    customer_name?: string | null;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [selectedVehicle, setSelectedVehicle] = useState<string>(selectedVehicleParam);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Return trip state
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  const [returnTripData, setReturnTripData] = useState({ date: "", time: "" });

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [isPromoCodeValid, setIsPromoCodeValid] = useState<boolean | null>(null);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "payment_link">("cash");

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        navigate("/customer/bookings");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted, navigate]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from("quick_booking_requests")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Booking not found");
        navigate("/");
        return;
      }

      // Cast all_vehicle_prices from Json to Record<string, number>
      const allVehiclePrices = data.all_vehicle_prices as Record<string, number> | null;

      setBookingData({
        pickup: data.pickup,
        dropoff: data.dropoff,
        pickup_date: data.pickup_date,
        pickup_time: data.pickup_time,
        vehicle_type: data.vehicle_type,
        price: data.price,
        price_currency: data.price_currency || "EUR",
        passengers: data.passengers,
        all_vehicle_prices: allVehiclePrices,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        customer_name: data.customer_name,
      });
      setSelectedVehicle(selectedVehicleParam || data.vehicle_type);

      if (data.customer_name || data.customer_email || data.customer_phone) {
        setFormData(prev => ({
          ...prev,
          name: data.customer_name || "",
          email: data.customer_email || "",
          phone: data.customer_phone || "",
        }));
      }
    } catch (err: any) {
      console.error("Fetch booking error:", err);
      toast.error("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoCodeChange = async (value: string) => {
    setPromoCode(value);
    setPromoCodeError(null);
    
    if (value.trim() === "") {
      setIsPromoCodeValid(null);
      return;
    }
    
    setIsValidatingPromo(true);
    try {
      const result = await validatePromoCode(value, language);
      if (result.valid) {
        setIsPromoCodeValid(true);
      } else {
        setIsPromoCodeValid(false);
        setPromoCodeError('errorMessage' in result ? result.errorMessage : null);
      }
    } catch {
      setIsPromoCodeValid(false);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const getSelectedPrice = (): number => {
    if (selectedPriceParam) return parseFloat(selectedPriceParam);
    if (bookingData?.all_vehicle_prices?.[selectedVehicle]) {
      return bookingData.all_vehicle_prices[selectedVehicle];
    }
    return bookingData?.price || 0;
  };

  const getReturnPrice = () => {
    if (!hasReturnTrip) return null;
    const price = getSelectedPrice();
    if (isPromoCodeValid) {
      return Math.round(price * 0.7); // 30% discount
    }
    return price;
  };

  const getTotalPrice = () => {
    const price = getSelectedPrice();
    const returnPrice = getReturnPrice();
    return price + (returnPrice || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    console.log("Form submit started with data:", {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      hasPassword: !!formData.password,
      bookingId,
      selectedVehicle,
      hasReturnTrip,
      returnTripData,
    });

    const result = customerInfoSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      console.error("Validation errors:", fieldErrors);
      toast.error(t("pleaseFixValidationErrors") || "Please fix the validation errors");
      return;
    }

    if (hasReturnTrip && (!returnTripData.date || !returnTripData.time)) {
      console.error("Return trip missing date/time:", returnTripData);
      toast.error(t("pleaseEnterReturnDateTime") || "Please enter return date and time");
      return;
    }

    if (!bookingId) {
      console.error("No booking ID available");
      toast.error(t("bookingDataMissing") || "Booking data is missing. Please go back and try again.");
      return;
    }

    setSubmitting(true);

    try {
      const selectedPrice = getSelectedPrice();
      const returnPrice = getReturnPrice();

      console.log("Calling edge function with:", {
        bookingId,
        vehicleType: selectedVehicle,
        price: selectedPrice,
        hasReturnTrip,
        returnPrice,
        paymentMethod,
      });

      // Create reservation via edge function
      const { data: reservationResult, error: reservationError } = await supabase.functions.invoke(
        "create-quick-booking-reservation",
        {
          body: {
            bookingId,
            pickup: bookingData?.pickup,
            dropoff: bookingData?.dropoff,
            pickupDate: bookingData?.pickup_date,
            pickupTime: bookingData?.pickup_time,
            vehicleType: selectedVehicle,
            passengers: bookingData?.passengers,
            price: selectedPrice,
            priceCurrency: bookingData?.price_currency || currencyParam,
            paymentMethod,
            hasReturnTrip,
            returnDate: returnTripData.date || null,
            returnTime: returnTripData.time || null,
            returnPrice: returnPrice || null,
            promoCode: isPromoCodeValid ? promoCode : null,
            customerName: formData.name.trim(),
            customerPhone: formData.phone.trim(),
            customerEmail: formData.email.trim(),
            customerPassword: formData.password,
          },
        }
      );

      console.log("Edge function response:", reservationResult, "Error:", reservationError);

      if (reservationError) throw reservationError;
      if (!reservationResult?.success) throw new Error(reservationResult?.error || "Failed to create reservation");

      // Sign in the user
      console.log("Attempting auto sign-in for:", formData.email.trim());
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (signInError) {
        console.error("Auto sign-in error:", signInError);
        // Don't fail - user can sign in manually later
      } else {
        console.log("Auto sign-in successful");
      }

      setSubmitted(true);
      toast.success(t("accountCreatedAndBookingConfirmed") || "Account created and booking confirmed!");
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || t("failedToCompleteBooking") || "Failed to complete booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!bookingId) return;
    
    setGoogleLoading(true);
    try {
      sessionStorage.setItem('quickBookingId', bookingId);
      sessionStorage.setItem('quickBookingToken', token);
      sessionStorage.setItem('quickBookingVehicle', selectedVehicle);
      sessionStorage.setItem('quickBookingPrice', getSelectedPrice().toString());
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/quick-booking-info?bookingId=${bookingId}&googleAuth=true`,
        },
      });
      
      if (error) throw error;
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      toast.error("Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("bookingConfirmed") || "Booking Confirmed!"}</h1>
            <p className="text-muted-foreground mb-4">
              {t("thankYouBooking") || "Thank you! Your transfer has been confirmed."}
            </p>
            <Button onClick={() => navigate("/customer/bookings")} className="w-full" size="lg">
              {t("viewMyReservations") || "View My Reservations"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(bookingData?.price_currency || currencyParam);
  const currentPrice = getSelectedPrice();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("completeYourBooking") || "Complete Your Booking"}</CardTitle>
          <CardDescription>
            {t("provideContactInfo") || "Please provide your contact information to finalize your reservation."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Route Map */}
          {bookingData && (
            <CompactRouteMap pickup={bookingData.pickup} dropoff={bookingData.dropoff} className="mb-4" />
          )}

          {/* Reservation Summary */}
          {bookingData && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{t("route") || "Route"}</p>
                  <p className="font-medium truncate">{bookingData.pickup}</p>
                  <p className="text-sm text-muted-foreground">→ {bookingData.dropoff}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(parseISO(bookingData.pickup_date), "dd/MM")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{bookingData.pickup_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-primary">{vehicleLabels[selectedVehicle] || selectedVehicle}</span>
                </div>
              </div>
              
              {/* Price Display */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("outboundTransfer") || "Outbound Transfer"}</p>
                  <p className="text-xl font-bold text-primary">{currencySymbol}{currentPrice}</p>
                </div>
              </div>
            </div>
          )}

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
                {t("qbAddReturnTransfer") || "Add Return Transfer"}
              </Label>
            </div>

            {hasReturnTrip && (
              <div className="space-y-4 pl-6 border-l-2 border-primary/30">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="returnDate">{t("qbReturnDate") || "Return Date"}</Label>
                    <Input
                      id="returnDate"
                      type="date"
                      value={returnTripData.date}
                      onChange={(e) => setReturnTripData(prev => ({ ...prev, date: e.target.value }))}
                      min={bookingData?.pickup_date}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="returnTime">{t("qbReturnTime") || "Return Time"}</Label>
                    <Input
                      id="returnTime"
                      type="time"
                      value={returnTripData.time}
                      onChange={(e) => setReturnTripData(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Promo Code */}
                <div className="space-y-2">
                  <Label htmlFor="promoCode" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {t("qbPromoCodeLabel") || "Promo Code (30% off return)"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="promoCode"
                      placeholder={activePromo?.code || "Enter promo code"}
                      value={promoCode}
                      onChange={(e) => handlePromoCodeChange(e.target.value)}
                      className={`pr-10 ${isPromoCodeValid === true ? "border-green-500" : isPromoCodeValid === false ? "border-red-500" : ""}`}
                    />
                    {isValidatingPromo && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />}
                    {!isValidatingPromo && isPromoCodeValid === true && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />}
                    {!isValidatingPromo && isPromoCodeValid === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />}
                  </div>
                  {isPromoCodeValid && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> 30% {t("qbDiscountApplied") || "discount applied to return!"}
                    </p>
                  )}
                </div>

                {/* Return Price Summary */}
                <div className="bg-primary/5 rounded p-3 text-sm space-y-2">
                  <p className="text-muted-foreground"><strong>{t("qbReturnRoute") || "Return Route"}:</strong> {bookingData?.dropoff} → {bookingData?.pickup}</p>
                  <div className="flex justify-between items-center">
                    <span>{t("returnTransfer") || "Return Transfer"}</span>
                    <span className="font-medium">
                      {isPromoCodeValid && (
                        <span className="line-through text-muted-foreground mr-2">{currencySymbol}{currentPrice}</span>
                      )}
                      {currencySymbol}{getReturnPrice()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-bold border-t pt-2">
                    <span>{t("total") || "Total"}</span>
                    <span className="text-primary text-lg">{currencySymbol}{getTotalPrice()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <Label className="font-medium mb-4 block">{t("qbPaymentMethod") || "Payment Method"}</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cash" | "payment_link")} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{t("qbPayCashToDriver") || "Pay Cash to Driver"}</p>
                    <p className="text-sm text-muted-foreground">{t("qbPayCashDesc") || "Pay when you meet your driver"}</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="payment_link" id="payment_link" />
                <Label htmlFor="payment_link" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{t("qbPayOnline") || "Pay Online"}</p>
                    <p className="text-sm text-muted-foreground">{t("qbPayOnlineDesc") || "Secure payment via link"}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium border-2 hover:bg-muted/50 mb-4"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || submitting}
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {t("continueWithGoogle") || "Continue with Google"}
          </Button>

          <div className="relative mb-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              {t("orFillManually") || "or fill in manually"}
            </span>
          </div>

          {/* Customer Info Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2"><User className="h-4 w-4" /> {t("fullName") || "Full Name"} *</Label>
              <Input id="name" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-4 w-4" /> {t("phoneNumber") || "Phone Number"} *</Label>
              <PhoneInput value={formData.phone} onChange={(value) => setFormData({ ...formData, phone: value })} defaultCountry="TR" className={errors.phone ? "border-destructive" : ""} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4" /> {t("emailAddress") || "Email Address"} *</Label>
              <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2"><Lock className="h-4 w-4" /> {t("createPassword") || "Create Password"} *</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={errors.password ? "border-destructive pr-10" : "pr-10"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              <p className="text-xs text-muted-foreground">1 uppercase, 1 lowercase, 4+ digits (e.g., Ab2215)</p>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" size="lg" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("creating") || "Creating..."}</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> {t("confirmBooking") || "Confirm Booking"}</>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {t("driverWillContact") || "Your driver will contact you before pickup. You will receive a confirmation email."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
