import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { PhoneInput } from "@/components/ui/phone-input";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, XCircle, MapPin, Calendar, Clock, Car, Users, DollarSign, RefreshCw, Tag, CheckCircle2, Briefcase, Sparkles, ThumbsUp, Timer, Hourglass, Building2, Baby, RotateCcw, User, Phone, Mail, Lock, Eye, EyeOff, CreditCard, Banknote, ArrowLeftRight } from "lucide-react";
import confetti from "canvas-confetti";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePromo } from "@/contexts/PromoContext";
import { validatePromoCode } from "@/hooks/useActivePromoCode";
import { getCurrencySymbol } from "@/lib/currency";
import { VEHICLE_TYPE_MAP } from "@/lib/vehicleTypes";
import { VehicleSelectionCard, VehicleBadgeType } from "@/components/VehicleSelectionCard";
import { CompactRouteMap } from "@/components/ui/compact-route-map";
import { CityImageCard } from "@/components/ui/city-image-card";
import { z } from "zod";

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
  has_return_trip?: boolean;
  return_date?: string;
  return_time?: string;
  return_price?: number | null;
  promo_code?: string;
  luggage_count?: number;
  baby_seat_count?: number;
  all_vehicle_prices?: Record<string, number> | null;
  created_at?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  service_type?: string;
  duration_hours?: number;
  city?: string;
}

interface VehiclePriceInfo {
  vehicleType: string;
  vehicleLabel: string;
  price: number | null;
  currency: string;
  passengers: number;
  luggage: number;
  available: boolean;
}

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

const googleUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().min(7, "Phone number is required").max(20).regex(/^[+\d\s\-()]*$/, "Invalid phone format"),
  email: z.string().trim().email("Invalid email address").max(255),
});

const getRecommendedVehicle = (passengers: number, luggage: number): string => {
  const maxNeeded = Math.max(passengers, luggage);
  if (maxNeeded >= 7) return 'minibus';
  if (maxNeeded >= 5) return 'mercedes-vito';
  if (maxNeeded >= 4) return 'vip-mercedes';
  return 'vip-mercedes';
};

export default function QuickBookingConfirm() {
  const { t, language } = useLanguage();
  const { promoCode: activePromo } = usePromo();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [waitingForPrice, setWaitingForPrice] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Customer form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "payment_link">("cash");
  
  // Return trip state (for adding on this page)
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  const [returnTripData, setReturnTripData] = useState({ date: "", time: "" });
  const [promoCode, setPromoCode] = useState("");
  const [isPromoCodeValid, setIsPromoCodeValid] = useState<boolean | null>(null);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  
  // Auto discount state
  const [canReject, setCanReject] = useState(true);
  const [isDiscountedOffer, setIsDiscountedOffer] = useState(false);
  const [discountJustApplied, setDiscountJustApplied] = useState(false);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [previousVehiclePrices, setPreviousVehiclePrices] = useState<Record<string, number>>({});
  
  // Best price preparing animation state
  const [showPriceAnimation, setShowPriceAnimation] = useState(false);
  
  // All vehicle prices
  const [allVehiclePrices, setAllVehiclePrices] = useState<VehiclePriceInfo[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [loadingPrices, setLoadingPrices] = useState(false);
  
  // Elapsed time state for waiting screen
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const ESTIMATED_WAIT_MINUTES = 3;

  const token = searchParams.get("token");
  const isNewRequest = searchParams.get("new") === "true";

  // Check for Google OAuth return
  useEffect(() => {
    const checkGoogleAuth = async () => {
      const googleAuth = searchParams.get("googleAuth");
      const storedBookingId = sessionStorage.getItem('quickBookingId');
      const storedToken = sessionStorage.getItem('quickBookingToken');
      const storedVehicle = sessionStorage.getItem('quickBookingVehicle');
      const storedHasReturnTrip = sessionStorage.getItem('quickBookingHasReturnTrip');
      const storedReturnDate = sessionStorage.getItem('quickBookingReturnDate');
      const storedReturnTime = sessionStorage.getItem('quickBookingReturnTime');
      const storedPaymentMethod = sessionStorage.getItem('quickBookingPaymentMethod');
      const storedPromoCode = sessionStorage.getItem('quickBookingPromoCode');
      
      if (googleAuth === "true" && storedBookingId) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsGoogleUser(true);
          if (storedVehicle) setSelectedVehicle(storedVehicle);
          if (storedHasReturnTrip === 'true') {
            setHasReturnTrip(true);
            if (storedReturnDate || storedReturnTime) {
              setReturnTripData({
                date: storedReturnDate || "",
                time: storedReturnTime || "",
              });
            }
          }
          if (storedPaymentMethod === 'payment_link' || storedPaymentMethod === 'cash') {
            setPaymentMethod(storedPaymentMethod);
          }
          if (storedPromoCode) {
            setPromoCode(storedPromoCode);
            setIsPromoCodeValid(true);
          }
          
          setFormData(prev => ({
            ...prev,
            email: session.user.email || "",
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
          }));
          
          // Clear session storage
          sessionStorage.removeItem('quickBookingId');
          sessionStorage.removeItem('quickBookingToken');
          sessionStorage.removeItem('quickBookingVehicle');
          sessionStorage.removeItem('quickBookingPrice');
          sessionStorage.removeItem('quickBookingCurrency');
          sessionStorage.removeItem('quickBookingHasReturnTrip');
          sessionStorage.removeItem('quickBookingReturnDate');
          sessionStorage.removeItem('quickBookingReturnTime');
          sessionStorage.removeItem('quickBookingPaymentMethod');
          sessionStorage.removeItem('quickBookingPromoCode');
        }
      }
    };
    
    checkGoogleAuth();
  }, [searchParams]);

  // Show preparing animation on initial load for new requests
  useEffect(() => {
    if (isNewRequest && token) {
      setShowPriceAnimation(true);
      const timer = setTimeout(() => {
        setShowPriceAnimation(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isNewRequest, token]);

  useEffect(() => {
    if (token) {
      if (isNewRequest) {
        const timer = setTimeout(() => {
          fetchBooking(token);
        }, 5000);
        return () => clearTimeout(timer);
      } else {
        fetchBooking(token);
      }
    } else {
      setError("No confirmation token provided");
      setLoading(false);
    }
  }, [token, isNewRequest]);

  // Fetch all vehicle prices when booking is loaded
  useEffect(() => {
    if (booking && booking.status === "price_sent") {
      fetchAllVehiclePrices();
    }
  }, [booking?.id, booking?.status]);

  // Elapsed time counter for waiting screen
  useEffect(() => {
    if (!waitingForPrice || !booking?.created_at) return;
    
    const createdAt = new Date(booking.created_at).getTime();
    const now = Date.now();
    const initialElapsed = Math.floor((now - createdAt) / 1000);
    setElapsedSeconds(Math.max(0, initialElapsed));
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - createdAt) / 1000);
      setElapsedSeconds(Math.max(0, elapsed));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [waitingForPrice, booking?.created_at]);

  // Realtime subscription for price updates
  useEffect(() => {
    if (!token || !waitingForPrice) return;

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
          const newData = payload.new as BookingRequest;
          
          if (newData.status === "price_sent" && newData.price) {
            setShowPriceAnimation(true);
            setTimeout(() => {
              setShowPriceAnimation(false);
              toast.success(t("qbNewPriceReceived") || "New price received! You can now review and confirm.");
              setBooking(newData);
              setWaitingForPrice(false);
              setError(null);
            }, 3000);
          } else if (newData.status === "rejected") {
            setError("This booking has been rejected");
            setWaitingForPrice(false);
          } else if (newData.status === "expired") {
            setError("This price offer has expired");
            setWaitingForPrice(false);
          }
        }
      )
      .subscribe();

    return () => {
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

      if (data.status === "pending" || data.status === "price_rejected") {
        setBooking(data as BookingRequest);
        setWaitingForPrice(true);
        
        // Pre-fill form with existing customer data even for pending status
        if (data.customer_name || data.customer_email || data.customer_phone) {
          setFormData(prev => ({
            ...prev,
            name: data.customer_name || "",
            email: data.customer_email || "",
            phone: data.customer_phone || "",
          }));
        }
        return;
      }

      if (data.status !== "price_sent") {
        setError("Unable to process this booking request.");
        return;
      }

      setBooking(data as BookingRequest);
      
      // Pre-fill form with existing customer data
      if (data.customer_name || data.customer_email || data.customer_phone) {
        setFormData(prev => ({
          ...prev,
          name: data.customer_name || "",
          email: data.customer_email || "",
          phone: data.customer_phone || "",
        }));
      }
      
      // Pre-fill return trip state if already set
      if (data.has_return_trip) {
        setHasReturnTrip(true);
        if (data.return_date || data.return_time) {
          setReturnTripData({
            date: data.return_date || "",
            time: data.return_time || "",
          });
        }
      }
      
      // Pre-fill promo code if already applied
      if (data.promo_code) {
        setPromoCode(data.promo_code);
        setIsPromoCodeValid(true);
      }
      
      // Check price history to determine if this is a discounted offer
      const { data: priceHistory } = await supabase
        .from("price_history")
        .select("*")
        .eq("quick_booking_id", data.id)
        .in("action", ["rejected", "auto_discount"])
        .order("created_at", { ascending: false });
      
      if (priceHistory) {
        const hasAutoDiscount = priceHistory.some(h => h.action === "auto_discount");
        setIsDiscountedOffer(hasAutoDiscount);
        setCanReject(!hasAutoDiscount);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVehiclePrices = async () => {
    if (!booking) return;
    
    setLoadingPrices(true);
    try {
      if (booking.all_vehicle_prices && Object.keys(booking.all_vehicle_prices).length > 0) {
        const VEHICLE_CONFIG: Record<string, { label: string; passengers: number; luggage: number }> = {
          'sedan': { label: 'Sedan', passengers: 3, luggage: 2 },
          'mercedes-vito': { label: 'Mercedes Vito', passengers: 6, luggage: 6 },
          'vip-mercedes': { label: 'VIP Mercedes', passengers: 5, luggage: 5 },
          'maybach-minibus': { label: 'Maybach Minibus', passengers: 4, luggage: 4 },
          'minibus': { label: 'Mercedes Sprinter', passengers: 16, luggage: 16 },
        };
        
        const manualPrices: VehiclePriceInfo[] = Object.entries(VEHICLE_CONFIG).map(([vehicleType, config]) => ({
          vehicleType,
          vehicleLabel: config.label,
          price: booking.all_vehicle_prices?.[vehicleType] || null,
          currency: booking.price_currency,
          passengers: config.passengers,
          luggage: config.luggage,
          available: !!booking.all_vehicle_prices?.[vehicleType],
        }));
        
        setAllVehiclePrices(manualPrices);
        setLoadingPrices(false);
        return;
      }
      
      if (booking.service_type === 'hourly' && booking.city && booking.duration_hours) {
        const getDurationType = (hours: number): string => {
          if (hours <= 4) return '4h';
          if (hours <= 6) return '6h';
          if (hours <= 8) return '8h';
          if (hours <= 10) return '10h';
          return 'daily';
        };
        
        const durationType = getDurationType(booking.duration_hours);
        
        const HOURLY_VEHICLE_MAP: Record<string, string> = {
          'vito': 'mercedes-vito',
          'vito_vip': 'vip-mercedes',
          'sprinter': 'minibus',
          'maybach': 'maybach-minibus',
        };
        
        const VEHICLE_CONFIG: Record<string, { label: string; passengers: number; luggage: number }> = {
          'sedan': { label: 'Sedan', passengers: 3, luggage: 2 },
          'mercedes-vito': { label: 'Mercedes Vito', passengers: 6, luggage: 6 },
          'vip-mercedes': { label: 'VIP Mercedes', passengers: 5, luggage: 5 },
          'maybach-minibus': { label: 'Maybach Minibus', passengers: 4, luggage: 4 },
          'minibus': { label: 'Mercedes Sprinter', passengers: 16, luggage: 16 },
        };
        
        const { data: hourlyPrices } = await supabase
          .from("hourly_rental_prices")
          .select("*")
          .eq("city", booking.city)
          .eq("duration_type", durationType)
          .eq("is_active", true);
        
        if (hourlyPrices && hourlyPrices.length > 0) {
          const prices: VehiclePriceInfo[] = Object.entries(VEHICLE_CONFIG).map(([vehicleType, config]) => {
            const dbVehicleType = Object.entries(HOURLY_VEHICLE_MAP).find(([_, v]) => v === vehicleType)?.[0] || vehicleType;
            const priceData = hourlyPrices.find(p => p.vehicle_type === dbVehicleType);
            
            return {
              vehicleType,
              vehicleLabel: config.label,
              price: priceData?.price || null,
              currency: priceData?.price_currency || booking.price_currency,
              passengers: config.passengers,
              luggage: config.luggage,
              available: !!priceData?.price,
            };
          });
          
          setAllVehiclePrices(prices);
          setLoadingPrices(false);
          return;
        }
      }
      
      const { data, error } = await supabase.functions.invoke("get-all-vehicle-prices", {
        body: {
          pickup: booking.pickup,
          dropoff: booking.dropoff,
          customerCurrency: booking.price_currency,
        },
      });

      if (error) throw error;

      if (data?.prices) {
        setAllVehiclePrices(data.prices as VehiclePriceInfo[]);
      }
    } catch (err) {
      console.error("Failed to fetch vehicle prices:", err);
    } finally {
      setLoadingPrices(false);
    }
  };

  const getSelectedPrice = (): number | null => {
    if (!booking?.price) return null;
    
    if (allVehiclePrices.length > 0 && selectedVehicle) {
      const selectedPriceInfo = allVehiclePrices.find(v => v.vehicleType === selectedVehicle);
      if (selectedPriceInfo?.price) {
        return selectedPriceInfo.price;
      }
    }
    
    return booking.price;
  };

  const getReturnPrice = () => {
    if (booking?.has_return_trip && booking?.return_price) {
      return booking.return_price;
    }
    
    if (!hasReturnTrip) return null;
    const price = getSelectedPrice();
    if (!price) return null;
    
    if (isPromoCodeValid) {
      const discountPercent = activePromo?.discountPercentage || 25;
      return Math.round(price * (100 - discountPercent) / 100);
    }
    return price;
  };

  const getTotalPrice = () => {
    const price = getSelectedPrice();
    const returnPrice = getReturnPrice();
    return (price || 0) + (returnPrice || 0);
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

  // Submit reservation
  const handleConfirm = async () => {
    if (!booking) {
      toast.error("Booking data not available. Please try again.");
      return;
    }

    setFormErrors({});

    // Validate form
    const schema = isGoogleUser ? googleUserSchema : customerInfoSchema;
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      toast.error(t("pleaseFixValidationErrors") || "Please fix the validation errors");
      return;
    }

    // Validate return trip date/time if selected
    if (hasReturnTrip && !booking.has_return_trip) {
      const returnErrors: Record<string, string> = {};
      
      if (!returnTripData.date) {
        returnErrors.returnDate = t("returnDateRequired") || "Return date is required";
      } else if (booking.pickup_date && returnTripData.date < booking.pickup_date) {
        returnErrors.returnDate = t("returnDateMustBeAfterPickup") || "Return date must be on or after pickup date";
      }
      
      if (!returnTripData.time) {
        returnErrors.returnTime = t("returnTimeRequired") || "Return time is required";
      }
      
      if (Object.keys(returnErrors).length > 0) {
        setFormErrors(prev => ({ ...prev, ...returnErrors }));
        toast.error(t("pleaseEnterReturnDateTime") || "Please enter valid return date and time");
        return;
      }
    }

    setConfirming(true);
    
    try {
      const selectedPrice = getSelectedPrice();
      const returnPrice = getReturnPrice();
      const finalVehicle = selectedVehicle || booking.vehicle_type;
      const finalHasReturnTrip = hasReturnTrip || booking.has_return_trip;
      const finalReturnDate = returnTripData.date || booking.return_date;
      const finalReturnTime = returnTripData.time || booking.return_time;
      const finalReturnPrice = returnPrice || booking.return_price;

      // Create reservation via edge function
      const { data: reservationResult, error: reservationError } = await supabase.functions.invoke(
        "create-quick-booking-reservation",
        {
          body: {
            bookingId: booking.id,
            pickup: booking.pickup,
            dropoff: booking.dropoff,
            pickupDate: booking.pickup_date,
            pickupTime: booking.pickup_time,
            vehicleType: finalVehicle,
            passengers: booking.passengers,
            price: selectedPrice,
            priceCurrency: booking.price_currency,
            paymentMethod,
            hasReturnTrip: finalHasReturnTrip,
            returnDate: finalReturnDate || null,
            returnTime: finalReturnTime || null,
            returnPrice: finalReturnPrice || null,
            promoCode: isPromoCodeValid ? promoCode : (booking.promo_code || null),
            customerName: formData.name.trim(),
            customerPhone: formData.phone.trim(),
            customerEmail: formData.email.trim(),
            customerPassword: isGoogleUser ? null : formData.password,
            isGoogleUser,
            babySeatCount: booking.baby_seat_count,
            luggageCount: booking.luggage_count,
          },
        }
      );

      if (reservationError) throw reservationError;
      if (!reservationResult?.success) throw new Error(reservationResult?.error || "Failed to create reservation");

      // Sign in the user (for non-Google users)
      if (!isGoogleUser && formData.password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (signInError) {
          console.error("Auto sign-in error:", signInError);
        }
      }

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSubmitted(true);
      toast.success(t("bookingConfirmed") || "Booking confirmed!");
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || t("failedToCompleteBooking") || "Failed to complete booking");
    } finally {
      setConfirming(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!booking) return;
    
    setGoogleLoading(true);
    try {
      sessionStorage.setItem('quickBookingId', booking.id);
      sessionStorage.setItem('quickBookingToken', booking.confirmation_token);
      sessionStorage.setItem('quickBookingVehicle', selectedVehicle || booking.vehicle_type);
      sessionStorage.setItem('quickBookingPrice', (getSelectedPrice() || 0).toString());
      sessionStorage.setItem('quickBookingCurrency', booking.price_currency);
      sessionStorage.setItem('quickBookingHasReturnTrip', hasReturnTrip.toString());
      sessionStorage.setItem('quickBookingReturnDate', returnTripData.date);
      sessionStorage.setItem('quickBookingReturnTime', returnTripData.time);
      sessionStorage.setItem('quickBookingPaymentMethod', paymentMethod);
      sessionStorage.setItem('quickBookingPromoCode', promoCode);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/quick-booking-confirm?token=${booking.confirmation_token}&googleAuth=true`,
        },
      });
      
      if (error) throw error;
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      toast.error("Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const handleReject = async () => {
    if (!booking) return;

    setRejecting(true);
    try {
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

      if (canReject && !isDiscountedOffer) {
        try {
          const { data: discountResult, error: discountError } = await supabase.functions.invoke("apply-auto-discount", {
            body: { quick_booking_id: booking.id }
          });

          if (discountError) throw discountError;

          if (discountResult?.success) {
            const currencySymbol = getCurrencySymbol(discountResult.currency);
            const oldPrice = booking.price;
            const newPrice = discountResult.new_price;
            
            confetti({
              particleCount: 80,
              spread: 100,
              origin: { y: 0.5, x: 0.5 },
              colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b']
            });
            
            toast.success(
              t("autoDiscountApplied") || `🎉 Price reduced! New price: ${currencySymbol}${newPrice}`,
              { duration: 5000 }
            );
            
            setPreviousPrice(oldPrice);
            const oldPricesMap: Record<string, number> = {};
            allVehiclePrices.forEach(v => {
              if (v.price) oldPricesMap[v.vehicleType] = v.price;
            });
            setPreviousVehiclePrices(oldPricesMap);
            setDiscountJustApplied(true);
            
            const newReturnPrice = discountResult.new_return_price || booking.return_price;
            
            setBooking({ 
              ...booking, 
              price: newPrice,
              return_price: newReturnPrice,
              status: "price_sent",
            });
            
            if (allVehiclePrices.length > 0) {
              const absoluteDiscount = (oldPrice || 0) - newPrice;
              
              setAllVehiclePrices(prevPrices => 
                prevPrices.map(v => {
                  if (v.vehicleType === (selectedVehicle || booking.vehicle_type)) {
                    return { ...v, price: newPrice };
                  }
                  if (v.price) {
                    return { ...v, price: Math.max(v.price - absoluteDiscount, 1) };
                  }
                  return v;
                })
              );
            }
            
            setIsDiscountedOffer(true);
            setCanReject(false);
            
            setTimeout(() => {
              setDiscountJustApplied(false);
              setPreviousPrice(null);
              setPreviousVehiclePrices({});
            }, 5000);
            
            return;
          }
        } catch (e) {
          console.error("Failed to apply auto discount:", e);
        }
      }

      const { error } = await supabase
        .from("quick_booking_requests")
        .update({ status: "price_rejected" })
        .eq("id", booking.id);

      if (error) throw error;

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
            priceRejected: true,
          },
        });
      } catch (notifyError) {
        console.error("Failed to notify admin about rejection:", notifyError);
      }

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

  const getVehicleBadge = (vehicleType: string): VehicleBadgeType | null => {
    if (vehicleType === 'vip-mercedes') return 'popular';
    if (vehicleType === 'maybach-minibus') return 'luxury';
    if (vehicleType === 'minibus') return 'family-friendly';
    return null;
  };

  // Submitted success state
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
            <p className="text-sm text-muted-foreground mb-6">
              {t("whatsappConfirmation") || "You will receive a WhatsApp message with your reservation details."}
            </p>
            <Button onClick={() => navigate("/customer/bookings")} className="w-full" size="lg">
              {t("viewMyReservations") || "View My Reservations"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preparing Best Price Animation
  if (showPriceAnimation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 p-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-green-400/30 animate-ping"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s',
              }}
            />
          ))}
        </div>
        
        <Card className="max-w-md w-full overflow-hidden relative border-0 shadow-2xl">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl opacity-75 blur-sm animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl opacity-20" />
          
          <CardContent className="pt-10 pb-10 relative bg-background/95 backdrop-blur-sm rounded-xl m-0.5">
            <div className="text-center">
              <div className="relative mx-auto mb-8 w-28 h-28">
                <div className="absolute -inset-4 bg-green-400/20 rounded-full blur-xl animate-pulse" />
                <div 
                  className="absolute inset-0 rounded-full border-4 border-dashed border-green-300 dark:border-green-700"
                  style={{ animation: 'spin 8s linear infinite' }}
                />
                <div 
                  className="absolute inset-2 rounded-full border-2 border-emerald-400 dark:border-emerald-600"
                  style={{ animation: 'spin 4s linear infinite reverse' }}
                />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 animate-pulse shadow-lg" />
                <div className="absolute inset-6 rounded-full bg-background flex items-center justify-center shadow-inner">
                  <Sparkles className="h-10 w-10 text-emerald-500" style={{ animation: 'bounce 1s ease-in-out infinite' }} />
                </div>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                {t("preparingBestPrice") || "Preparing Best Price..."}
              </h1>
              
              <p className="text-muted-foreground mb-8 text-sm">
                {t("preparingBestPriceDesc") || "Finding the best rate for your transfer"}
              </p>
              
              <div className="w-full max-w-xs mx-auto mb-6">
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full"
                    style={{ animation: 'progressSlide 5s ease-out forwards' }}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-medium shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("bestPriceGuarantee") || "Best Price Guarantee"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium shadow-sm">
                  <ThumbsUp className="h-4 w-4" />
                  {t("noHiddenFees") || "No Hidden Fees"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <style>{`
          @keyframes progressSlide {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">{t("qbLoadingPriceQuote") || "Loading..."}</h2>
            <p className="text-muted-foreground">{t("qbPleaseWait") || "Please wait"}</p>
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
            <h2 className="text-xl font-semibold mb-2">{t("qbUnableToLoad") || "Unable to load"}</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")}>{t("qbGoToHomepage") || "Go to Homepage"}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) return null;

  // Waiting for price state
  if (waitingForPrice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30 dark:from-amber-950/20 dark:via-background dark:to-orange-950/20 p-4">
        <Card className="max-w-lg w-full overflow-hidden shadow-2xl border-amber-200/50 dark:border-amber-800/30">
          <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 p-6 text-white">
            <div className="relative text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div 
                  className="absolute inset-1 rounded-full border-4 border-white/30 border-t-white animate-spin"
                  style={{ animationDuration: '2s' }}
                />
                <div className="absolute inset-3 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2 drop-shadow-md">
                {t("qbWaitingForPrice") || "Calculating Price"}
              </h1>
              <p className="text-white/90 text-sm max-w-xs mx-auto">
                {t("qbWaitingForPriceDesc") || "Finding the best rate for your route..."}
              </p>
            </div>
          </div>

          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">{t("qbRequestReceived") || "Request Received"}</span>
              </div>
              <div className="h-0.5 w-8 bg-gradient-to-r from-green-500 to-amber-500" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white animate-pulse">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">{t("qbCalculatingPrice") || "Calculating"}</span>
              </div>
              <div className="h-0.5 w-8 bg-muted" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">{t("qbReadyToBook") || "Ready"}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-4 mb-6 space-y-3 border border-border/50">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("qbPickup") || "Pickup"}</p>
                  <p className="font-semibold text-sm">{booking.pickup}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("qbDropoff") || "Dropoff"}</p>
                  <p className="font-semibold text-sm">{booking.dropoff}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="font-bold text-xs">{format(parseISO(booking.pickup_date), "dd MMM")}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="font-bold text-xs">{booking.pickup_time}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="font-bold text-xs">{booking.passengers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    {t("qbEstimatedWaitTime") || "Estimated Wait"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">/ ~{ESTIMATED_WAIT_MINUTES}:00</span>
                </div>
              </div>
              <Progress value={Math.min((elapsedSeconds / (ESTIMATED_WAIT_MINUTES * 60)) * 100, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t("qbEstimatedWaitDesc") || "Usually responds within 1-3 minutes"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(booking.price_currency);
  const selectedPrice = getSelectedPrice();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-3 sm:p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{t("qbYourPriceQuote") || "Your Price Quote"}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("qbReviewAndConfirm") || "Review and complete your booking"}
            </p>
          </div>

          {/* Route Map */}
          {booking.service_type === 'hourly' && booking.city ? (
            <CityImageCard city={booking.city} className="mb-4 sm:mb-6" />
          ) : (
            <CompactRouteMap pickup={booking.pickup} dropoff={booking.dropoff} className="mb-4 sm:mb-6" />
          )}

          {/* Transfer Details */}
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("qbPickup") || "Pickup"}</p>
                <p className="font-medium text-sm sm:text-base truncate">{booking.pickup}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:gap-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("qbDropoff") || "Dropoff"}</p>
                <p className="font-medium text-sm sm:text-base truncate">{booking.dropoff}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 sm:mt-4">
              <div className="text-center">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t("qbDate") || "Date"}</p>
                <p className="font-bold text-xs sm:text-sm">{format(parseISO(booking.pickup_date), "dd/MM")}</p>
              </div>
              <div className="text-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t("qbTime") || "Time"}</p>
                <p className="font-bold text-xs sm:text-sm">{booking.pickup_time}</p>
              </div>
              <div className="text-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t("qbPassengers") || "Passengers"}</p>
                <p className="font-bold text-xs sm:text-sm">{booking.passengers}</p>
              </div>
            </div>

            {/* Extras */}
            {(booking.luggage_count || booking.baby_seat_count || booking.has_return_trip) && (
              <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
                <div className="flex flex-wrap gap-3">
                  {booking.luggage_count && booking.luggage_count > 0 && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      <Briefcase className="h-4 w-4" />
                      <span>{booking.luggage_count} {t("qbLuggage") || "Luggage"}</span>
                    </div>
                  )}
                  {booking.baby_seat_count && booking.baby_seat_count > 0 && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      <Baby className="h-4 w-4" />
                      <span>{booking.baby_seat_count} {t("qbBabySeat") || "Baby Seat"}</span>
                    </div>
                  )}
                </div>
                
                {/* Pre-selected Return Trip from first page */}
                {booking.has_return_trip && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-700">
                    <RotateCcw className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                        {t("qbReturnTrip") || "Return Trip"}: {booking.return_date && format(parseISO(booking.return_date), "dd/MM")} {booking.return_time && `- ${booking.return_time}`}
                      </p>
                    </div>
                    {booking.return_price && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {booking.promo_code && booking.price && (
                          <span className="text-xs line-through text-muted-foreground">
                            {currencySymbol}{booking.price}
                          </span>
                        )}
                        <span className="text-sm font-bold text-green-600 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                          {currencySymbol}{booking.return_price}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vehicle Selection */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base">{t("qbSelectVehicle") || "Select Vehicle"}</h3>
            </div>
            
            {loadingPrices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allVehiclePrices.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {allVehiclePrices.map((vehicle, index) => {
                  const isSelected = (selectedVehicle || booking.vehicle_type) === vehicle.vehicleType;
                  const recommendedType = getRecommendedVehicle(booking.passengers, booking.luggage_count || 0);
                  const isRecommended = vehicle.vehicleType === recommendedType;
                  
                  return (
                    <VehicleSelectionCard
                      key={vehicle.vehicleType}
                      vehicleType={vehicle.vehicleType}
                      isSelected={isSelected}
                      onSelect={(v) => setSelectedVehicle(v)}
                      price={vehicle.price}
                      currency={vehicle.currency}
                      showPrice={true}
                      isRecommended={isRecommended}
                      available={vehicle.available}
                      previousPrice={previousVehiclePrices[vehicle.vehicleType] || null}
                      showDiscountAnimation={discountJustApplied && !!previousVehiclePrices[vehicle.vehicleType]}
                      badge={getVehicleBadge(vehicle.vehicleType)}
                      badgeAnimationDelay={index * 100}
                    />
                  );
                })}
              </div>
            ) : (
              <VehicleSelectionCard
                vehicleType={selectedVehicle || booking.vehicle_type}
                isSelected={true}
                onSelect={() => {}}
                price={selectedPrice}
                currency={booking.price_currency}
                showPrice={true}
                available={true}
              />
            )}
          </div>

          {/* Price Display */}
          <div className={`relative rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-center transition-all duration-500 overflow-hidden ${
            discountJustApplied 
              ? 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 dark:from-green-900/40 ring-2 ring-green-500' 
              : 'bg-primary/10'
          }`}>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{t("qbYourTransferPrice") || "Your Transfer Price"}</p>
            {discountJustApplied && previousPrice && (
              <div className="mb-2 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-lg line-through text-muted-foreground">{currencySymbol}{previousPrice}</span>
                <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full">
                  <Tag className="h-3 w-3" />
                  -{currencySymbol}{previousPrice - (selectedPrice || 0)}
                </span>
              </div>
            )}
            <p className={`text-3xl sm:text-4xl font-bold ${discountJustApplied ? 'text-green-600' : 'text-primary'}`}>
              {currencySymbol}{selectedPrice}
            </p>
            
            {/* Return price if applicable */}
            {(hasReturnTrip || booking.has_return_trip) && (() => {
              const returnPrice = getReturnPrice();
              const basePrice = getSelectedPrice();
              
              // Check if promo discount was applied - either on this page or from first page
              const hasPromoOnThisPage = isPromoCodeValid && hasReturnTrip && !booking.has_return_trip;
              const hasPromoFromFirstPage = booking.has_return_trip && booking.promo_code && booking.return_price && basePrice;
              const hasPromoDiscount = hasPromoOnThisPage || hasPromoFromFirstPage;
              
              // Calculate original price (before discount)
              let originalReturnPrice: number | null = null;
              if (hasPromoOnThisPage && basePrice) {
                originalReturnPrice = basePrice;
              } else if (hasPromoFromFirstPage && booking.return_price && basePrice) {
                // If return_price is less than base price, there was a discount
                if (booking.return_price < basePrice) {
                  originalReturnPrice = basePrice;
                }
              }
              
              // Determine discount percentage
              const discountPercent = hasPromoOnThisPage 
                ? (activePromo?.discountPercentage || 25)
                : 25; // Default for pre-applied promos
              
              return (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <RotateCcw className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">{t("returnTransfer") || "Return Trip"}:</span>
                    {hasPromoDiscount && originalReturnPrice && (
                      <>
                        <span className="text-sm line-through text-muted-foreground">
                          {currencySymbol}{originalReturnPrice}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded-full">
                          <Tag className="h-3 w-3" />
                          -{discountPercent}%
                        </span>
                      </>
                    )}
                    <span className="text-xl font-bold text-green-600">{currencySymbol}{returnPrice}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3 p-2 bg-primary/10 rounded-lg">
                    <span className="text-muted-foreground text-sm">{t("total") || "Total"}:</span>
                    <span className="text-2xl font-bold text-primary">{currencySymbol}{getTotalPrice()}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Return Trip Option (if not already set) */}
          {!booking.has_return_trip && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <Checkbox
                  id="returnTrip"
                  checked={hasReturnTrip}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setHasReturnTrip(isChecked);
                    if (isChecked && !promoCode) {
                      const autoPromoCode = activePromo?.code || 'MEET25RETURN';
                      handlePromoCodeChange(autoPromoCode);
                    }
                  }}
                />
                <Label htmlFor="returnTrip" className="flex items-center gap-2 cursor-pointer font-medium">
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                  {t("qbAddReturnTransfer") || "Add Return Transfer"}
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {activePromo?.discountPercentage || 25}% OFF
                  </span>
                </Label>
              </div>

              {hasReturnTrip && (
                <div className="space-y-4 pl-6 border-l-2 border-primary/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="returnDate">{t("qbReturnDate") || "Return Date"} *</Label>
                      <Input
                        id="returnDate"
                        type="date"
                        value={returnTripData.date}
                        onChange={(e) => setReturnTripData(prev => ({ ...prev, date: e.target.value }))}
                        min={booking.pickup_date}
                        className={formErrors.returnDate ? "border-destructive" : ""}
                      />
                      {formErrors.returnDate && <p className="text-xs text-destructive">{formErrors.returnDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="returnTime">{t("qbReturnTime") || "Return Time"} *</Label>
                      <Input
                        id="returnTime"
                        type="time"
                        value={returnTripData.time}
                        onChange={(e) => setReturnTripData(prev => ({ ...prev, time: e.target.value }))}
                        className={formErrors.returnTime ? "border-destructive" : ""}
                      />
                      {formErrors.returnTime && <p className="text-xs text-destructive">{formErrors.returnTime}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promoCode" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      {t("qbPromoCodeLabel") || "Promo Code"}
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
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customer Information Form */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4 sm:mb-6">
            <h3 className="font-semibold text-sm sm:text-base mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              {t("completeYourBooking") || "Your Information"}
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name") || "Name"} *</Label>
                <Input
                  id="name"
                  placeholder={t("enterYourName") || "Enter your full name"}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone") || "Phone"} *</Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  placeholder={t("enterPhone") || "+90 555 123 4567"}
                  className={formErrors.phone ? "border-destructive" : ""}
                />
                {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("email") || "Email"} *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("enterEmail") || "your@email.com"}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isGoogleUser}
                  className={formErrors.email ? "border-destructive" : ""}
                />
                {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
              </div>

              {!isGoogleUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t("password") || "Password"} *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("createPassword") || "Create a password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`pr-10 ${formErrors.password ? "border-destructive" : ""}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                  <p className="text-xs text-muted-foreground">
                    {t("passwordHint") || "Min 6 chars, 1 uppercase, 1 lowercase, 4 digits"}
                  </p>
                </div>
              )}
            </div>

            {/* Google Sign In */}
            {!isGoogleUser && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-center text-sm text-muted-foreground mb-3">{t("orContinueWith") || "Or continue with"}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {t("continueWithGoogle") || "Continue with Google"}
                </Button>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4 sm:mb-6">
            <h3 className="font-semibold text-sm sm:text-base mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              {t("paymentMethod") || "Payment Method"}
            </h3>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cash" | "payment_link")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                  <Banknote className="h-4 w-4" />
                  {t("payInCash") || "Pay in Cash to Driver"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="payment_link" id="payment_link" />
                <Label htmlFor="payment_link" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  {t("payOnline") || "Pay Online (Card)"}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          {canReject ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={rejecting || confirming}
                  className="h-auto min-h-[52px] flex-col py-2 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                >
                  <div className="flex items-center text-orange-600">
                    {rejecting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Tag className="h-4 w-4 mr-1.5" />}
                    <span className="text-sm font-semibold">{t("qbRejectForBetterPrice") || "Better Price?"}</span>
                  </div>
                </Button>

                <Button
                  onClick={handleConfirm}
                  disabled={confirming || rejecting}
                  className="h-auto min-h-[52px] flex-col py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <div className="flex items-center">
                    {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                    <span className="text-sm font-semibold">{t("confirmBooking") || "Confirm Booking"}</span>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full h-auto min-h-[56px] flex-col py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              size="lg"
            >
              <div className="flex items-center">
                {confirming ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                <span className="text-base font-semibold">{t("confirmBooking") || "Confirm Booking"}</span>
              </div>
              <span className="text-xs text-white/80 mt-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {t("confirmFinalOffer") || "Exclusive discounted price"}
              </span>
            </Button>
          )}

          <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-3 sm:mt-4">
            {t("qbByConfirming") || "By confirming, you agree to our terms and conditions."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
