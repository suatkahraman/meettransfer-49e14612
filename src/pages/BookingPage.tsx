import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parse } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePromo, getLocalizedDiscountText } from "@/contexts/PromoContext";
import { validatePromoCode } from "@/hooks/useActivePromoCode";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { 
  MapPin, Navigation, Calendar, Clock, Users, Briefcase, Baby, 
  ArrowRight, Loader2, CheckCircle, ArrowLeftRight, Tag, Mail, 
  Phone, MessageSquare, Car, Coins, CreditCard, Banknote, User, Shield, Timer, ChevronLeft, ChevronRight, Percent, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPE_MAP, getAvailableVehicles, isMinibusRequired } from "@/lib/vehicleTypes";
import { CURRENCY_OPTIONS } from "@/lib/currency";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import { CompactRouteMap } from "@/components/ui/compact-route-map";

interface VehiclePrice {
  vehicleType: string;
  price: number | null;
  currency: string;
}

interface HourlyPrice {
  id: string;
  city: string;
  vehicle_type: string;
  duration_type: string;
  price: number;
  hourly_rate: number | null;
  price_currency: string;
}

const getSessionId = () => {
  let sessionId = localStorage.getItem('quick_booking_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('quick_booking_session_id', sessionId);
  }
  return sessionId;
};

const DURATION_OPTIONS = [
  { value: "4h", label: "4 Hours" },
  { value: "6h", label: "6 Hours" },
  { value: "8h", label: "8 Hours" },
  { value: "10h", label: "10 Hours" },
  { value: "12h", label: "12 Hours" },
];

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language, getLocalizedPath } = useLanguage();
  const { promoCode: activePromo } = usePromo();
  const { user } = useAuth();

  // Determine booking type
  const bookingType = searchParams.get("type") || "transfer";
  const isHourlyBooking = bookingType === "hourly";

  // Get URL params from Hero
  const urlPickup = searchParams.get("pickup") || "";
  const urlDropoff = searchParams.get("dropoff") || "";
  const urlDate = searchParams.get("date") || "";
  const urlTime = searchParams.get("time") || "";
  const urlPassengers = searchParams.get("passengers");
  const urlVehicleType = searchParams.get("vehicleType");
  
  // Hourly-specific params
  const urlCity = searchParams.get("city") || "";
  const urlDuration = searchParams.get("duration") || "4h";
  
  // Return trip & extras params from URL
  const urlHasReturnTrip = searchParams.get("hasReturnTrip") === "true";
  const urlReturnDate = searchParams.get("returnDate") || "";
  const urlReturnTime = searchParams.get("returnTime") || "";
  const urlBabySeatCount = searchParams.get("babySeatCount");
  const urlLuggageCount = searchParams.get("luggageCount");
  const urlPromoCode = searchParams.get("promoCode") || "";

  // Form state - initialize from URL params if available
  const [vehicleType, setVehicleType] = useState(urlVehicleType || "mercedes-vito");
  const [passengers, setPassengers] = useState(urlPassengers ? parseInt(urlPassengers) : 1);
  const [luggageCount, setLuggageCount] = useState(urlLuggageCount ? parseInt(urlLuggageCount) : 1);
  const [babySeatCount, setBabySeatCount] = useState(urlBabySeatCount ? parseInt(urlBabySeatCount) : 0);
  const [preferredCurrency, setPreferredCurrency] = useState("EUR");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [hasReturnTrip, setHasReturnTrip] = useState(urlHasReturnTrip);
  const [returnDate, setReturnDate] = useState(urlReturnDate);
  const [returnTime, setReturnTime] = useState(urlReturnTime);
  const [promoCode, setPromoCode] = useState(urlPromoCode);
  const [isPromoCodeValid, setIsPromoCodeValid] = useState<boolean | null>(null);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  
  // Hourly rental state
  const [selectedDuration, setSelectedDuration] = useState(urlDuration);

  // Price state
  const [vehiclePrices, setVehiclePrices] = useState<VehiclePrice[]>([]);
  const [hourlyPrices, setHourlyPrices] = useState<HourlyPrice[]>([]);
  const [isPricesLoading, setIsPricesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Discount state
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);
  const [rejectingPrice, setRejectingPrice] = useState(false);
  const [justSelectedVehicle, setJustSelectedVehicle] = useState<string | null>(null);

  // Logged-in user state
  const [customerName, setCustomerName] = useState("");
  const [paymentType, setPaymentType] = useState<"cash" | "credit_card" | "online">("cash");
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; phone: string | null } | null>(null);

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
    if (isHourlyBooking) {
      if (!urlCity || !urlDate || !urlTime) {
        navigate(getLocalizedPath("/"));
      }
    } else {
      if (!urlPickup || !urlDropoff || !urlDate || !urlTime) {
        navigate(getLocalizedPath("/"));
      }
    }
  }, [urlPickup, urlDropoff, urlDate, urlTime, urlCity, isHourlyBooking, navigate, getLocalizedPath]);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setCustomerEmail(user.email || "");
      
      // Fetch profile data for logged-in users
      const fetchProfile = async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
          setCustomerName(profile.full_name || "");
          if (profile.phone) setCustomerPhone(profile.phone);
        }
      };
      
      fetchProfile();
    }
  }, [user]);

  // Fetch vehicle prices for transfer bookings with minimum 8 second loading animation
  useEffect(() => {
    const fetchPrices = async () => {
      if (isHourlyBooking || !urlPickup || !urlDropoff) return;
      
      setIsPricesLoading(true);
      const startTime = Date.now();
      const minLoadingTime = 8000; // 8 seconds minimum
      
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
        
        // Wait for remaining time to complete 8 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
      } finally {
        setIsPricesLoading(false);
      }
    };

    fetchPrices();
  }, [urlPickup, urlDropoff, preferredCurrency, isHourlyBooking]);

  // Fetch hourly rental prices with minimum 8 second loading animation
  useEffect(() => {
    const fetchHourlyPrices = async () => {
      if (!isHourlyBooking || !urlCity) return;
      
      setIsPricesLoading(true);
      const startTime = Date.now();
      const minLoadingTime = 8000; // 8 seconds minimum
      
      try {
        const { data, error } = await supabase
          .from("hourly_rental_prices")
          .select("*")
          .eq("city", urlCity)
          .eq("is_active", true);

        if (error) throw error;
        setHourlyPrices(data || []);
        
        // Wait for remaining time to complete 8 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } catch (error) {
        console.error("Error fetching hourly prices:", error);
      } finally {
        setIsPricesLoading(false);
      }
    };

    fetchHourlyPrices();
  }, [isHourlyBooking, urlCity]);

  // Get price for a specific vehicle (transfer)
  const getPriceForVehicle = (vType: string) => {
    const priceData = vehiclePrices.find(p => p.vehicleType === vType);
    return priceData?.price || null;
  };

  // Get hourly price for selected vehicle and duration
  const getHourlyPrice = (vType: string, duration: string) => {
    // Map vehicle types
    const vehicleMap: Record<string, string> = {
      "mercedes-vito": "vito",
      "vito-vip": "vito_vip",
      "minibus": "sprinter",
      "maybach": "maybach",
    };
    
    const mappedType = vehicleMap[vType] || vType;
    
    // First try to find exact duration price
    const exactPrice = hourlyPrices.find(
      p => p.vehicle_type === mappedType && p.duration_type === duration
    );
    
    if (exactPrice) {
      return exactPrice.price;
    }
    
    // If custom duration, calculate from hourly rate
    const customRate = hourlyPrices.find(
      p => p.vehicle_type === mappedType && p.duration_type === "custom"
    );
    
    if (customRate?.hourly_rate) {
      const hours = parseInt(duration.replace("h", ""));
      return customRate.hourly_rate * hours;
    }
    
    return null;
  };

  // Handle promo code - check against database
  const handlePromoCodeChange = async (value: string) => {
    setPromoCode(value);
    setPromoCodeError(null);
    setPromoDiscountPercent(null);
    
    if (value.trim() === "") {
      setIsPromoCodeValid(null);
      return;
    }
    
    setIsValidatingPromo(true);
    try {
      const result = await validatePromoCode(value, language);
      
      if (result.valid) {
        setIsPromoCodeValid(true);
        setPromoDiscountPercent(result.discount);
        setPromoCodeError(null);
      } else {
        setIsPromoCodeValid(false);
        setPromoDiscountPercent(null);
        setPromoCodeError('errorMessage' in result ? result.errorMessage : null);
      }
    } catch (err) {
      setIsPromoCodeValid(false);
      setPromoDiscountPercent(null);
      setPromoCodeError(t("errorValidatingPromoCode") || "Error validating promo code");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Handle form submission for guests (quick booking flow)
  const handleGuestSubmit = async () => {
    // Validation - phone is optional but if provided, validate format
    if (customerPhone && customerPhone.length > 0 && customerPhone.length < 8) {
      toast.error(t("invalidPhone") || "Please enter a valid phone number");
      return;
    }

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      toast.error(t("invalidEmail") || "Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    
    try {
      const sessionId = getSessionId();
      const currentPrice = isHourlyBooking 
        ? getHourlyPrice(vehicleType, selectedDuration) 
        : selectedPrice;
      
      // Calculate return price with discount if applicable (use dynamic discount percentage)
      const discountMultiplier = promoDiscountPercent ? (100 - promoDiscountPercent) / 100 : 1;
      const returnPrice = hasReturnTrip && currentPrice
        ? (isPromoCodeValid && promoDiscountPercent ? Math.round(currentPrice * discountMultiplier) : currentPrice)
        : null;
      
      const bookingData = isHourlyBooking 
        ? {
            pickup: urlCity,
            dropoff: `${selectedDuration} ${t("hourlyRental") || "Hourly Rental"} - ${urlCity}`,
            pickup_date: urlDate,
            pickup_time: urlTime,
            vehicle_type: vehicleType,
            passengers,
            luggage_count: luggageCount,
            baby_seat_count: babySeatCount,
            customer_session_id: sessionId,
            price: currentPrice,
            price_currency: preferredCurrency,
            customer_notes: `[${selectedDuration} Hourly Rental] ${customerNotes.trim()}`.trim(),
            customer_phone: customerPhone.trim() || null,
            customer_email: customerEmail.trim() || null,
            language: language.toLowerCase(),
          }
        : {
            pickup: urlPickup,
            dropoff: urlDropoff,
            pickup_date: urlDate,
            pickup_time: urlTime,
            vehicle_type: vehicleType,
            passengers,
            luggage_count: luggageCount,
            baby_seat_count: babySeatCount,
            customer_session_id: sessionId,
            price: currentPrice,
            price_currency: preferredCurrency,
            customer_notes: customerNotes.trim() || null,
            customer_phone: customerPhone.trim() || null,
            customer_email: customerEmail.trim() || null,
            language: language.toLowerCase(),
            has_return_trip: hasReturnTrip && returnDate && returnTime ? true : false,
            return_date: hasReturnTrip && returnDate ? returnDate : null,
            return_time: hasReturnTrip && returnTime ? returnTime : null,
            return_price: returnPrice,
            promo_code: hasReturnTrip && isPromoCodeValid && promoCode ? promoCode : null,
          };

      // Create quick booking request first
      const { data, error } = await supabase
        .from("quick_booking_requests")
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      // If we have a price, directly create the reservation and go to customer info page
      if (currentPrice) {
        // Send vehicle prices email if customer provided email
        if (customerEmail && customerEmail.trim()) {
          try {
            await supabase.functions.invoke("send-vehicle-prices-email", {
              body: {
                customerEmail: customerEmail.trim(),
                pickup: isHourlyBooking ? urlCity : urlPickup,
                dropoff: isHourlyBooking ? `${selectedDuration} ${t("hourlyRental") || "Hourly Rental"} - ${urlCity}` : urlDropoff,
                pickupDate: urlDate,
                pickupTime: urlTime,
                passengers,
                vehiclePrices: isHourlyBooking 
                  ? hourlyPrices.map(hp => ({
                      vehicleType: hp.vehicle_type === "vito" ? "mercedes-vito" : 
                                   hp.vehicle_type === "vito_vip" ? "vip-mercedes" :
                                   hp.vehicle_type === "sprinter" ? "minibus" : hp.vehicle_type,
                      price: hp.price,
                      currency: preferredCurrency
                    }))
                  : vehiclePrices,
                selectedVehicle: vehicleType,
                selectedPrice: currentPrice,
                language: language.toLowerCase(),
              },
            });
            console.log("Vehicle prices email sent to:", customerEmail);
          } catch (emailError) {
            console.error("Failed to send vehicle prices email:", emailError);
            // Don't fail the booking if email fails
          }
        }

        // Trigger confetti for successful booking
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Create reservation directly
        const { data: reservationData, error: reservationError } = await supabase.functions.invoke("create-quick-booking-reservation", {
          body: {
            bookingId: data.id,
            pickup: isHourlyBooking ? urlCity : urlPickup,
            dropoff: isHourlyBooking ? `${selectedDuration} ${t("hourlyRental") || "Hourly Rental"} - ${urlCity}` : urlDropoff,
            pickupDate: urlDate,
            pickupTime: urlTime,
            vehicleType,
            passengers,
            price: currentPrice,
            priceCurrency: preferredCurrency,
            paymentMethod: "cash",
            hasReturnTrip: hasReturnTrip && returnDate && returnTime ? true : false,
            returnDate: hasReturnTrip && returnDate ? returnDate : null,
            returnTime: hasReturnTrip && returnTime ? returnTime : null,
            returnPrice: returnPrice,
            promoCode: hasReturnTrip && isPromoCodeValid && promoCode ? promoCode : null,
          },
        });

        if (reservationError) {
          console.error("Reservation creation error:", reservationError);
          throw new Error("Failed to create reservation");
        }

        // Navigate to customer info page with reservation code and pre-filled data
        const customerInfoParams = new URLSearchParams({
          reservationCode: reservationData.reservation.reservationCode,
          reservationId: reservationData.reservation.id,
        });
        if (customerPhone) customerInfoParams.set("phone", customerPhone.trim());
        if (customerEmail) customerInfoParams.set("email", customerEmail.trim());
        if (customerName) customerInfoParams.set("name", customerName.trim());
        
        // Add return reservation code if exists
        if (reservationData.returnReservation?.reservationCode) {
          customerInfoParams.set("returnReservationCode", reservationData.returnReservation.reservationCode);
        }
        
        navigate(`/quick-booking-info?${customerInfoParams.toString()}`);
        toast.success(t("bookingConfirmed") || "Booking confirmed! Please complete your details.");
      } else {
        // No price available - use old flow (waiting for admin to set price)
        // For hourly, we already have the price
        if (isHourlyBooking) {
          try {
            await supabase.functions.invoke("notify-admin-quick-booking-new", {
              body: {
                bookingId: data.id,
                pickup: urlCity,
                dropoff: `${selectedDuration} Hourly Rental`,
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
        } else {
          // Try auto-pricing for transfers
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
        }

        let url = `/quick-booking-confirm?token=${data.confirmation_token}&new=true`;
        if (!isHourlyBooking && hasReturnTrip && returnDate && returnTime) {
          url += `&hasReturn=true&returnDate=${returnDate}&returnTime=${returnTime}`;
          if (isPromoCodeValid && promoCode) {
            url += `&promoCode=${encodeURIComponent(promoCode)}`;
          }
        }
        navigate(url);
        toast.success(t("priceRequestSent") || "Your request has been sent!");
      }
    } catch (error: unknown) {
      console.error("Error submitting:", error);
      toast.error((error as Error).message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission for logged-in users (direct reservation)
  const handleLoggedInSubmit = async () => {
    // Validation
    if (!customerName.trim()) {
      toast.error(t("nameRequired") || "Name is required");
      return;
    }

    if (customerPhone && customerPhone.length > 0 && customerPhone.length < 8) {
      toast.error(t("invalidPhone") || "Please enter a valid phone number");
      return;
    }

    setSubmitting(true);
    
    try {
      const reservationData = isHourlyBooking
        ? {
            pickup: urlCity,
            dropoff: `${selectedDuration} ${t("hourlyRental") || "Hourly Rental"} - ${urlCity}`,
            pickup_date: urlDate,
            pickup_time: urlTime,
            vehicle_type: vehicleType,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            customer_notes: `[${selectedDuration} Hourly Rental] ${customerNotes.trim()}`.trim(),
            customer_id: user!.id,
            payment_type: paymentType,
            price: getHourlyPrice(vehicleType, selectedDuration),
            price_currency: preferredCurrency,
            luggage_count: luggageCount,
            baby_seat_count: babySeatCount,
            status: getHourlyPrice(vehicleType, selectedDuration) ? "confirmed" : "awaiting-price",
          }
        : {
            pickup: urlPickup,
            dropoff: urlDropoff,
            pickup_date: urlDate,
            pickup_time: urlTime,
            vehicle_type: vehicleType,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            customer_notes: customerNotes.trim() || null,
            customer_id: user!.id,
            payment_type: paymentType,
            price: selectedPrice || null,
            price_currency: preferredCurrency,
            luggage_count: luggageCount,
            baby_seat_count: babySeatCount,
            status: selectedPrice ? "confirmed" : "awaiting-price",
          };

      const { data: reservation, error } = await supabase
        .from("reservations")
        .insert(reservationData)
        .select()
        .single();

      if (error) throw error;

      // If return trip (only for transfers), create return reservation
      if (!isHourlyBooking && hasReturnTrip && returnDate && returnTime) {
        const returnPrice = isPromoCodeValid && selectedPrice 
          ? Math.round(selectedPrice * 0.75) // 25% discount
          : selectedPrice;

        await supabase
          .from("reservations")
          .insert({
            pickup: urlDropoff, // Swap pickup and dropoff
            dropoff: urlPickup,
            pickup_date: returnDate,
            pickup_time: returnTime,
            vehicle_type: vehicleType,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            customer_notes: customerNotes.trim() || null,
            customer_id: user!.id,
            payment_type: paymentType,
            price: returnPrice || null,
            price_currency: preferredCurrency,
            luggage_count: luggageCount,
            baby_seat_count: babySeatCount,
            status: "pending",
            is_return_transfer: true,
            original_reservation_id: reservation.id,
            promo_code: isPromoCodeValid && promoCode ? promoCode : null,
          });
      }

      // Notify admin about new reservation
      try {
        await supabase.functions.invoke("notify-admin-new-reservation", {
          body: {
            reservationId: reservation.id,
            pickup: isHourlyBooking ? urlCity : urlPickup,
            dropoff: isHourlyBooking ? `${selectedDuration} Hourly` : urlDropoff,
            pickupDate: urlDate,
            pickupTime: urlTime,
            vehicleType,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
          },
        });
      } catch (notifyError) {
        console.error("Failed to notify admin:", notifyError);
      }

      // Navigate to customer portal with success message
      navigate(`/customer/reservations/${reservation.id}?success=true`);
      toast.success(t("reservationCreated") || "Reservation created successfully!");
    } catch (error: unknown) {
      console.error("Error creating reservation:", error);
      toast.error((error as Error).message || "Failed to create reservation");
    } finally {
      setSubmitting(false);
    }
  };

  // Main submit handler
  const handleSubmit = () => {
    if (user) {
      handleLoggedInSubmit();
    } else {
      handleGuestSubmit();
    }
  };

  // Parse date for display
  const displayDate = urlDate ? format(parse(urlDate, "yyyy-MM-dd", new Date()), "dd MMM yyyy") : "";
  const selectedPrice = isHourlyBooking 
    ? getHourlyPrice(vehicleType, selectedDuration) 
    : getPriceForVehicle(vehicleType);

  // Time options
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      timeOptions.push(`${h}:${m}`);
    }
  }

  // Get vehicles with hourly prices
  const getHourlyVehicleOptions = () => {
    const vehicleMap: Record<string, string> = {
      "vito": "mercedes-vito",
      "vito_vip": "vito-vip",
      "sprinter": "minibus",
      "maybach": "maybach",
    };
    
    // Get unique vehicles that have prices for this city
    const uniqueVehicles = [...new Set(hourlyPrices.map(p => p.vehicle_type))];
    
    return uniqueVehicles.map(vType => ({
      value: vehicleMap[vType] || vType,
      dbType: vType,
    })).filter(v => VEHICLE_TYPE_MAP[v.value]);
  };

  // Countdown state for loading animation
  const [countdown, setCountdown] = useState(8);
  const [progressWidth, setProgressWidth] = useState(100);
  const [tipIndex, setTipIndex] = useState(0);

  // Loading tips
  const loadingTips = {
    TR: [
      "💡 VIP araçlarımız profesyonel şoförler tarafından kullanılmaktadır",
      "✈️ Uçuş gecikmelerini otomatik olarak takip ediyoruz",
      "🎒 Tüm araçlarımızda ücretsiz bagaj taşıma hizmeti",
      "📱 7/24 WhatsApp destek hattımız aktif",
      "⭐ Google üzerinde 5.0 puan ortalamamız var",
      "🚗 Mercedes Vito ve Sprinter araç filomuz sizin için hazır",
      "💳 Nakit veya kredi kartı ile ödeme yapabilirsiniz",
      "👶 Ücretsiz bebek koltuğu hizmeti sunuyoruz",
    ],
    EN: [
      "💡 Our VIP vehicles are operated by professional drivers",
      "✈️ We automatically track flight delays",
      "🎒 Free luggage service in all our vehicles",
      "📱 24/7 WhatsApp support line is active",
      "⭐ We have a 5.0 rating average on Google",
      "🚗 Our Mercedes Vito and Sprinter fleet is ready for you",
      "💳 You can pay by cash or credit card",
      "👶 We offer free baby seat service",
    ]
  };

  // Track previous loading state for confetti
  const [wasLoading, setWasLoading] = useState(false);

  // Confetti celebration when loading completes
  useEffect(() => {
    if (wasLoading && !isPricesLoading && vehiclePrices.length > 0) {
      // Fire confetti celebration
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isPricesLoading, wasLoading, vehiclePrices.length]);

  // Countdown timer effect
  useEffect(() => {
    if (!isPricesLoading) {
      setCountdown(8);
      setProgressWidth(100);
      setTipIndex(0);
      return;
    }

    // Track that loading has started
    setWasLoading(true);

    // Start progress animation
    setProgressWidth(100);
    const progressInterval = setInterval(() => {
      setProgressWidth(prev => Math.max(0, prev - 1.25)); // Decrease by 1.25% every 100ms (8 seconds total)
    }, 100);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 1;
        return prev - 1;
      });
    }, 1000);

    // Tip rotation
    const tips = language === 'TR' ? loadingTips.TR : loadingTips.EN;
    setTipIndex(Math.floor(Math.random() * tips.length));
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(countdownInterval);
      clearInterval(tipInterval);
    };
  }, [isPricesLoading, language]);

  // Professional Loading Animation Component - Mobile Optimized
  if (isPricesLoading) {
    return (
      <WebsiteLayout>
        <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 safe-area-inset">
          <div className="text-center w-full max-w-sm sm:max-w-md">
            {/* Animated Car Icon - Responsive sizing */}
            <div className="relative mb-6 sm:mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto relative">
                {/* Outer ring animation - optimized for mobile */}
                <div className="absolute inset-0 rounded-full border-2 sm:border-4 border-primary/20 animate-[ping_2s_ease-in-out_infinite]" />
                <div className="absolute inset-1.5 sm:inset-2 rounded-full border-2 sm:border-4 border-primary/30 animate-[ping_2s_ease-in-out_infinite_0.5s]" />
                <div className="absolute inset-3 sm:inset-4 rounded-full border-2 sm:border-4 border-primary/40 animate-[ping_2s_ease-in-out_infinite_1s]" />
                
                {/* Center icon - responsive */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl animate-pulse">
                    <Car className="h-7 w-7 sm:h-10 sm:w-10 text-primary-foreground animate-bounce" />
                  </div>
                </div>
              </div>
              
              {/* Sparkle decorations - optimized positions */}
              <div className="absolute top-0 left-[20%] sm:left-1/4 animate-[pulse_1.5s_ease-in-out_infinite]">
                <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-accent" />
              </div>
              <div className="absolute top-[20%] right-[20%] sm:top-1/4 sm:right-1/4 animate-[pulse_1.5s_ease-in-out_infinite_0.3s]">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="absolute bottom-[20%] left-[30%] sm:bottom-1/4 sm:left-1/3 animate-[pulse_1.5s_ease-in-out_infinite_0.6s]">
                <Sparkles className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-amber-500" />
              </div>
            </div>
            
            {/* Text content - responsive typography */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-4 animate-fade-in px-2">
              {language === 'TR' 
                ? "En İyi Fiyatlarımız Hazırlanıyor"
                : "Best Prices Being Prepared"
              }
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 animate-fade-in px-2">
              {language === 'TR'
                ? "Sizin için en uygun fiyatları buluyoruz..."
                : "Finding the best rates for you..."
              }
            </p>
            
            {/* Progress Bar with Countdown - touch optimized */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {language === 'TR' ? 'Fiyatlar yükleniyor...' : 'Loading prices...'}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-primary flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {countdown}s
                </span>
              </div>
              <div className="h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-primary/80 to-accent rounded-full transition-all duration-100 ease-linear relative will-change-[width]"
                  style={{ width: `${progressWidth}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
            
            {/* Random Tips - mobile optimized */}
            <div className="mb-4 sm:mb-6">
              <div 
                className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 shadow-sm min-h-[60px] sm:min-h-[72px] flex items-center justify-center"
                key={tipIndex}
                style={{ animation: 'tipFadeIn 0.5s ease-out' }}
              >
                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                  {(language === 'TR' ? loadingTips.TR : loadingTips.EN)[tipIndex]}
                </p>
              </div>
            </div>
            
            {/* Progress dots - smaller on mobile */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.2s]" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.4s]" />
            </div>
            
            {/* Trip summary card - compact for mobile */}
            <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg border border-border/50 animate-fade-in">
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                  <span className="truncate text-left">{urlPickup}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
                  <span className="truncate text-left">{urlDropoff}</span>
                </div>
                <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2 border-t border-border/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">{displayDate}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">{urlTime}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Shimmer animation keyframe */}
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes tipFadeIn {
            0% { 
              opacity: 0; 
              transform: translateY(10px) scale(0.98);
            }
            100% { 
              opacity: 1; 
              transform: translateY(0) scale(1);
            }
          }
          .safe-area-inset {
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
        `}</style>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <div className="min-h-[100dvh] bg-gradient-to-b from-muted/30 to-background py-4 sm:py-8 md:py-12">
        <div className="container max-w-4xl px-3 sm:px-4">
          {/* Header with Trip Info - Mobile optimized */}
          <div className="bg-primary text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 shadow-xl">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              {isHourlyBooking ? (
                <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
              ) : (
                <Car className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
              )}
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold leading-tight">
                {isHourlyBooking 
                  ? (t("hourlyRentalBooking") || "Hourly Rental Booking")
                  : (t("completeBooking") || "Complete Your Booking")
                }
              </h1>
            </div>
            
            {/* Route Map for Transfer bookings */}
            {!isHourlyBooking && urlPickup && urlDropoff && (
              <CompactRouteMap 
                pickup={urlPickup} 
                dropoff={urlDropoff}
                className="mb-4"
              />
            )}
            
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {isHourlyBooking ? (
                <>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white/70 text-xs sm:text-sm">{t("city") || "City"}</p>
                      <p className="font-medium text-sm sm:text-base truncate">{urlCity}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Timer className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white/70 text-xs sm:text-sm">{t("duration") || "Duration"}</p>
                      <p className="font-medium text-sm sm:text-base">{selectedDuration}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 sm:gap-3 col-span-2 sm:col-span-1">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-accent shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white/70 text-xs sm:text-sm">{t("pickupPoint")}</p>
                      <p className="font-medium text-sm sm:text-base line-clamp-2">{urlPickup}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 col-span-2 sm:col-span-1">
                    <Navigation className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-accent shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white/70 text-xs sm:text-sm">{t("dropoffLocation")}</p>
                      <p className="font-medium text-sm sm:text-base line-clamp-2">{urlDropoff}</p>
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-start gap-2 sm:gap-3">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-accent shrink-0" />
                <div className="min-w-0">
                  <p className="text-white/70 text-xs sm:text-sm">{t("pickupDate")}</p>
                  <p className="font-medium text-sm sm:text-base">{displayDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-accent shrink-0" />
                <div className="min-w-0">
                  <p className="text-white/70 text-xs sm:text-sm">{t("pickupTime")}</p>
                  <p className="font-medium text-sm sm:text-base">{urlTime}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Duration Selection - Only for hourly */}
              {isHourlyBooking && (
                <Card>
                  <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      {t("selectDuration") || "Select Duration"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {DURATION_OPTIONS.map((duration) => {
                        const isSelected = selectedDuration === duration.value;
                        return (
                          <button
                            key={duration.value}
                            type="button"
                            onClick={() => setSelectedDuration(duration.value)}
                            className={cn(
                              "px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all border-2 text-sm sm:text-base",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50 bg-background"
                            )}
                          >
                            {duration.label}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vehicle Selection */}
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    {t("selectVehicle") || "Select Vehicle"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {/* Warning for 7+ passengers */}
                  {passengers >= 7 && !isHourlyBooking && (
                    <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        {t("minibusRequiredForPassengers") || "Sprinter minibus is required for 7+ passengers"}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {(isHourlyBooking ? getHourlyVehicleOptions() : availableVehicles.map(v => ({ value: v.value, dbType: v.value }))).map((vehicleOption) => {
                      const v = VEHICLE_TYPE_MAP[vehicleOption.value];
                      if (!v) return null;
                      
                      const price = isHourlyBooking 
                        ? getHourlyPrice(vehicleOption.value, selectedDuration)
                        : getPriceForVehicle(vehicleOption.value);
                      const isSelected = vehicleType === vehicleOption.value;
                      
                      // Disable vehicles that can't accommodate the passenger count
                      const vehicleCapacity = v.passengers;
                      const isCapacityInsufficient = passengers > vehicleCapacity;
                      const isDisabled = isCapacityInsufficient;
                      
                      return (
                        <div
                          key={vehicleOption.value}
                          onClick={() => {
                            if (!isDisabled && vehicleType !== vehicleOption.value) {
                              setVehicleType(vehicleOption.value);
                              setJustSelectedVehicle(vehicleOption.value);
                              // Mini celebration confetti
                              confetti({
                                particleCount: 30,
                                spread: 60,
                                origin: { x: 0.5, y: 0.6 },
                                colors: ['#FFD700', '#4ECDC4', '#45B7D1'],
                                ticks: 50,
                                gravity: 1.2,
                                scalar: 0.8,
                                zIndex: 9999,
                              });
                            }
                          }}
                          className={cn(
                            "relative overflow-hidden rounded-lg sm:rounded-xl transition-all duration-300 border-2 cursor-pointer",
                            "hover:shadow-lg active:scale-[0.99]",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/50 sm:scale-[1.02]"
                              : "border-border hover:border-primary/50 hover:bg-muted/50",
                            isDisabled && "opacity-50 cursor-not-allowed",
                            justSelectedVehicle === vehicleOption.value && "animate-[vehicleShake_0.4s_ease-in-out]"
                          )}
                          onAnimationEnd={() => setJustSelectedVehicle(null)}
                        >
                          <style>{`
                            @keyframes vehicleShake {
                              0%, 100% { transform: translateX(0) scale(1.02); }
                              10% { transform: translateX(-3px) scale(1.04); }
                              20% { transform: translateX(3px) scale(1.04); }
                              30% { transform: translateX(-3px) scale(1.03); }
                              40% { transform: translateX(3px) scale(1.03); }
                              50% { transform: translateX(-2px) scale(1.03); }
                              60% { transform: translateX(2px) scale(1.02); }
                              70% { transform: translateX(-1px) scale(1.02); }
                              80% { transform: translateX(1px) scale(1.02); }
                            }
                          `}</style>
                          {isSelected && (
                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-primary text-primary-foreground rounded-full p-1 sm:p-1.5 shadow-lg animate-[pulse_1.5s_ease-in-out_infinite]">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                          )}
                          
                          {/* Selected Banner */}
                          {isSelected && (
                            <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-br-lg z-10">
                              {language === 'TR' ? 'SEÇİLDİ' : 'SELECTED'}
                            </div>
                          )}
                          
                          {isDisabled && (
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-red-500/90 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                              Max {vehicleCapacity}
                            </div>
                          )}
                          
                          {/* Vehicle Image Carousel with Autoplay */}
                          <div className="relative">
                            <Carousel 
                              className="w-full" 
                              opts={{ loop: true }}
                              plugins={[
                                Fade(),
                                Autoplay({
                                  delay: 2500,
                                  stopOnInteraction: false,
                                  stopOnMouseEnter: false,
                                })
                              ]}
                            >
                              <CarouselContent>
                                {v.images.slice(0, 6).map((image, index) => (
                                  <CarouselItem key={index}>
                                    <div className="aspect-video bg-muted">
                                      <img
                                        src={image.src}
                                        alt={image.alt || v.label}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                      />
                                    </div>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              {v.images.length > 1 && (
                                <>
                                  <CarouselPrevious className="left-1 h-6 w-6 sm:h-7 sm:w-7 bg-white/80 hover:bg-white" />
                                  <CarouselNext className="right-1 h-6 w-6 sm:h-7 sm:w-7 bg-white/80 hover:bg-white" />
                                </>
                              )}
                            </Carousel>
                            {/* Image counter */}
                            {v.images.length > 1 && (
                              <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-black/60 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 rounded">
                                {Math.min(v.images.length, 6)}
                              </div>
                            )}
                          </div>
                          
                          {/* Content area */}
                          <div className="w-full p-3 sm:p-4 text-left">
                            <h3 className="font-semibold text-foreground mb-1.5 sm:mb-2 text-sm sm:text-base">{v.label}</h3>
                            
                            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                              <span className={cn(
                                "flex items-center gap-1",
                                isDisabled && "text-red-500"
                              )}>
                                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {v.passengers}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {v.luggage}
                              </span>
                            </div>
                            
                            {isPricesLoading ? (
                              <div className="h-5 sm:h-6 w-16 sm:w-20 bg-muted animate-pulse rounded" />
                            ) : price ? (
                              <p className="text-base sm:text-lg font-bold text-primary">
                                {price} {preferredCurrency}
                                {isHourlyBooking && <span className="text-xs sm:text-sm font-normal text-muted-foreground"> / {selectedDuration}</span>}
                              </p>
                            ) : (
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {t("priceOnRequest") || "Price on request"}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Vehicle & Price Card */}
              {selectedPrice && (
                <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
                  <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      {language === 'TR' ? 'Seçtiğiniz Araç ve Fiyatı' : 'Selected Vehicle & Price'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Vehicle Image */}
                      {VEHICLE_TYPE_MAP[vehicleType]?.images?.[0] && (
                        <div className="w-16 h-12 sm:w-24 sm:h-16 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={VEHICLE_TYPE_MAP[vehicleType].images[0].src}
                            alt={VEHICLE_TYPE_MAP[vehicleType].label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm sm:text-base">
                          {VEHICLE_TYPE_MAP[vehicleType]?.label || vehicleType}
                        </h4>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            {VEHICLE_TYPE_MAP[vehicleType]?.passengers}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            {VEHICLE_TYPE_MAP[vehicleType]?.luggage}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        {discountApplied && originalPrice && (
                          <p className="text-xs sm:text-sm line-through text-muted-foreground">
                            {originalPrice} {preferredCurrency}
                          </p>
                        )}
                        <p className="text-lg sm:text-2xl font-bold text-primary">
                          {selectedPrice} {preferredCurrency}
                        </p>
                      </div>
                    </div>
                    
                    {/* Reject for Better Price Button */}
                    {!discountApplied && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400"
                        disabled={rejectingPrice}
                        onClick={async () => {
                          if (!selectedPrice) return;
                          
                          setRejectingPrice(true);
                          
                          try {
                            let discountInCurrency = 3;
                            
                            if (preferredCurrency !== 'EUR') {
                              try {
                                const response = await fetch(
                                  `https://api.frankfurter.app/latest?from=EUR&to=${preferredCurrency}`,
                                  { signal: AbortSignal.timeout(3000) }
                                );
                                if (response.ok) {
                                  const data = await response.json();
                                  const rate = data.rates[preferredCurrency];
                                  if (rate) {
                                    discountInCurrency = Math.round(3 * rate);
                                  }
                                }
                              } catch (e) {
                                const fallbackRates: Record<string, number> = {
                                  'USD': 1.08, 'TRY': 37.5, 'GBP': 0.85, 'AED': 3.97, 'AUD': 1.65
                                };
                                discountInCurrency = Math.round(3 * (fallbackRates[preferredCurrency] || 1));
                              }
                            }
                            
                            setOriginalPrice(selectedPrice);
                            setDiscountAmount(discountInCurrency);
                            
                            setVehiclePrices(prev => 
                              prev.map(v => ({
                                ...v,
                                price: v.price ? Math.max(v.price - discountInCurrency, 1) : v.price
                              }))
                            );
                            
                            if (isHourlyBooking) {
                              setHourlyPrices(prev => 
                                prev.map(h => ({
                                  ...h,
                                  price: Math.max(h.price - discountInCurrency, 1)
                                }))
                              );
                            }
                            
                            setDiscountApplied(true);
                            
                            confetti({
                              particleCount: 80,
                              spread: 100,
                              origin: { y: 0.5, x: 0.5 },
                              colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b']
                            });
                            
                            const currencySymbol = preferredCurrency === 'EUR' ? '€' : preferredCurrency === 'USD' ? '$' : preferredCurrency === 'GBP' ? '£' : preferredCurrency === 'TRY' ? '₺' : preferredCurrency;
                            
                            toast.success(
                              `🎉 ${t("discountApplied") || "Discount applied!"} -${currencySymbol}${discountInCurrency}`,
                              { duration: 5000 }
                            );
                          } catch (err) {
                            console.error("Failed to apply discount:", err);
                            toast.error(t("discountError") || "Failed to apply discount");
                          } finally {
                            setRejectingPrice(false);
                          }
                        }}
                      >
                        {rejectingPrice ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Percent className="mr-2 h-4 w-4" />
                            {t("rejectForBetterPrice") || "Get Better Price"}
                          </>
                        )}
                      </Button>
                    )}
                    
                    {/* Discount Applied Badge */}
                    {discountApplied && (
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg py-2 mt-4">
                        <Tag className="h-4 w-4" />
                        <span className="font-medium">
                          {language === 'TR' ? 'İndirim Uygulandı!' : 'Discount Applied!'}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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

              {/* Return Trip - Only for transfers */}
              {!isHourlyBooking && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowLeftRight className="h-5 w-5 text-primary" />
                      {t("returnTrip") || "Return Trip"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Return trip checkbox with enhanced promo highlight */}
                    <div 
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                        hasReturnTrip 
                          ? "bg-green-50 dark:bg-green-950/30 border-green-500" 
                          : "bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 hover:border-green-400"
                      )}
                      onClick={() => {
                        const newValue = !hasReturnTrip;
                        setHasReturnTrip(newValue);
                        // Auto-apply promo code when return trip is selected
                        if (newValue && activePromo.code && !promoCode) {
                          handlePromoCodeChange(activePromo.code);
                        }
                      }}
                    >
                      <Checkbox
                        id="returnTrip"
                        checked={hasReturnTrip}
                        onCheckedChange={(checked) => {
                          const newValue = checked === true;
                          setHasReturnTrip(newValue);
                          // Auto-apply promo code when return trip is selected
                          if (newValue && activePromo.code && !promoCode) {
                            handlePromoCodeChange(activePromo.code);
                          }
                        }}
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="returnTrip" className="cursor-pointer font-semibold text-base flex items-center gap-2">
                          {t("addReturnTrip") || "Add return trip"}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-bold animate-pulse">
                            <Sparkles className="h-3 w-3" />
                            {activePromo.discountPercentage}% {t("discount") || "OFF"}
                          </span>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {language === 'TR' 
                            ? `Dönüş yolculuğunuzda %${activePromo.discountPercentage} indirim otomatik uygulanır!`
                            : `${activePromo.discountPercentage}% discount automatically applied on your return!`}
                        </p>
                      </div>
                    </div>

                    {/* Show discount applied confirmation when return trip is selected */}
                    {hasReturnTrip && isPromoCodeValid && promoDiscountPercent && (
                      <div className="flex items-center gap-2 text-sm bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg border border-green-300 dark:border-green-700">
                        <CheckCircle className="h-5 w-5 shrink-0" />
                        <span className="font-medium">
                          {language === 'TR'
                            ? `✨ %${promoDiscountPercent} indirim uygulandı! Dönüş fiyatınız otomatik düşürüldü.`
                            : `✨ ${promoDiscountPercent}% discount applied! Your return price is automatically reduced.`}
                        </span>
                      </div>
                    )}

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
                        
                        {/* Hidden promo code - auto-applied, show only if different code entered */}
                        {promoCode !== activePromo.code && (
                          <div className="sm:col-span-2">
                            <Label className="text-sm text-muted-foreground mb-2 block">{t("promoCode") || "Promo Code"}</Label>
                            <div className="relative">
                              <Input
                                placeholder={activePromo.code}
                                value={promoCode}
                                onChange={(e) => handlePromoCodeChange(e.target.value)}
                                className={cn(
                                  isPromoCodeValid === true && "border-green-500 ring-1 ring-green-500",
                                  isPromoCodeValid === false && "border-red-500 ring-1 ring-red-500"
                                )}
                              />
                              {isValidatingPromo && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
                              )}
                              {!isValidatingPromo && isPromoCodeValid === true && (
                                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                              )}
                            </div>
                            {isPromoCodeValid === true && promoDiscountPercent && (
                              <p className="text-green-600 text-sm mt-1">✓ {promoDiscountPercent}% {t("discountWillBeApplied") || "discount will be applied!"}</p>
                            )}
                            {isPromoCodeValid === false && promoCodeError && (
                              <p className="text-red-500 text-sm mt-1">✗ {promoCodeError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contact Information */}
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    {user ? <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> : <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                    {user ? (t("passengerInfo") || "Passenger Information") : (t("contactInfo") || "Contact Information")}
                  </CardTitle>
                  {user && (
                    <CardDescription className="flex items-center gap-2 text-green-600 text-xs sm:text-sm">
                      <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="truncate">{t("loggedInAs") || "Logged in as"} {user.email}</span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                  {/* Name field for logged-in users */}
                  {user && (
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        {t("fullName") || "Full Name"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder={t("enterFullName") || "Enter your full name"}
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      {t("phoneNumber") || "Phone"} <span className="text-muted-foreground text-xs">({t("optional")})</span>
                    </Label>
                    <PhoneInput
                      value={customerPhone}
                      onChange={setCustomerPhone}
                      placeholder="555 123 4567"
                    />
                  </div>

                  {!user && (
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
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {t("emailInfoDescription") || "Your reservation details will be sent to your email address. You can complete your reservation later using the link provided."}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t("specialRequests") || "Notes"}
                    </Label>
                    <Textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder={isHourlyBooking 
                        ? (t("hourlyNotesPlaceholder") || "Pickup location address, places to visit...")
                        : (t("specialRequestsPlaceholder") || "Flight number, special requirements...")
                      }
                      className="resize-none min-h-[80px]"
                      maxLength={500}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Options - Only for logged-in users */}
              {user && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      {t("paymentMethod") || "Payment Method"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={paymentType}
                      onValueChange={(value) => setPaymentType(value as "cash" | "credit_card" | "online")}
                      className="space-y-3"
                    >
                      <div className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer",
                        paymentType === "cash" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}>
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Banknote className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">{t("payWithCash") || "Pay with Cash"}</p>
                            <p className="text-sm text-muted-foreground">{t("payDriverDirectly") || "Pay the driver directly"}</p>
                          </div>
                        </Label>
                      </div>


                      <div className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer",
                        paymentType === "online" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}>
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Shield className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium">{t("payOnline") || "Pay Online"}</p>
                            <p className="text-sm text-muted-foreground">{t("secureOnlinePayment") || "Secure online payment (link will be sent)"}</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Price Summary - Hidden on mobile, visible on desktop */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-24">
                <Card className="shadow-xl border-primary/20">
                  <CardHeader className="bg-primary text-white rounded-t-xl p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">{t("priceSummary") || "Price Summary"}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Vehicle Image Carousel */}
                    {VEHICLE_TYPE_MAP[vehicleType]?.images && VEHICLE_TYPE_MAP[vehicleType].images.length > 0 && (
                      <div className="relative">
                        <Carousel className="w-full" opts={{ loop: true }}>
                          <CarouselContent>
                            {VEHICLE_TYPE_MAP[vehicleType].images.map((image, index) => (
                              <CarouselItem key={index}>
                                <div className="aspect-video">
                                  <img
                                    src={image.src}
                                    alt={image.alt || VEHICLE_TYPE_MAP[vehicleType].label}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="left-2 h-7 w-7 sm:h-8 sm:w-8 bg-white/80 hover:bg-white" />
                          <CarouselNext className="right-2 h-7 w-7 sm:h-8 sm:w-8 bg-white/80 hover:bg-white" />
                        </Carousel>
                        {/* Image counter */}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {VEHICLE_TYPE_MAP[vehicleType].images.length} {t("photos") || "photos"}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground text-xs sm:text-sm">{t("vehicle") || "Vehicle"}</span>
                        <span className="font-semibold text-right text-sm sm:text-base">{VEHICLE_TYPE_MAP[vehicleType]?.label || vehicleType}</span>
                      </div>
                      
                      {/* Vehicle features */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {VEHICLE_TYPE_MAP[vehicleType]?.passengers || 0} {t("passengers") || "passengers"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {VEHICLE_TYPE_MAP[vehicleType]?.luggage || 0} {t("luggage") || "luggage"}
                        </span>
                      </div>
                      
                      {isHourlyBooking && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{t("duration") || "Duration"}</span>
                          <span className="font-medium">{selectedDuration}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{t("selectedPassengers") || "Selected Passengers"}</span>
                        <span className="font-medium">{passengers}</span>
                      </div>
                      
                      <div className="border-t pt-4">
                        {isPricesLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : selectedPrice ? (
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">
                              {isHourlyBooking ? (t("totalForDuration") || "Total for") + ` ${selectedDuration}` : (t("totalPrice") || "Total")}
                            </p>
                            <p className="text-3xl font-bold text-primary">
                              {selectedPrice} {preferredCurrency}
                            </p>
                            <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                              ✓ {t("freeCancellation24h") || "Free cancellation 24 hours before"}
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
                    </div>

                    <div className="p-6 pt-0">
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
                            {user ? (t("createReservation") || "Create Reservation") : (t("confirmBooking") || "Confirm Booking")}
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>

                      {user && (
                        <div className="flex items-center justify-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg py-2 mt-3">
                          <CheckCircle className="h-3 w-3" />
                          {t("directReservation") || "Direct reservation - no confirmation needed"}
                        </div>
                      )}

                      <p className="text-xs text-center text-muted-foreground mt-3">
                        {t("freeCancel") || "Free cancellation up to 24h before"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Sticky Footer - Always visible on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t-2 border-primary/20 p-3 sm:p-4 shadow-2xl z-[100]" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            {isPricesLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t("loadingPrices") || "Loading..."}</p>
              </div>
            ) : selectedPrice ? (
              <>
                <p className="text-xs text-muted-foreground">{t("totalPrice") || "Total"}</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {selectedPrice} {preferredCurrency}
                </p>
              </>
            ) : (
              <div>
                <p className="text-sm font-medium text-foreground">{t("priceOnRequest") || "Price on request"}</p>
                <p className="text-xs text-muted-foreground">{t("weWillContactYou") || "We'll send you the price"}</p>
              </div>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            size="lg"
            variant="accent"
            className="h-14 px-6 sm:px-8 text-base sm:text-lg font-bold shrink-0 shadow-xl animate-pulse hover:animate-none min-w-[140px]"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {user ? (t("confirmNow") || "Confirm") : (t("continue") || "Continue")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Spacer for mobile sticky footer */}
      <div className="lg:hidden h-24" />
    </WebsiteLayout>
  );
};

export default BookingPage;
