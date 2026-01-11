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

  // Form state - initialize from URL params if available
  const [vehicleType, setVehicleType] = useState(urlVehicleType || "mercedes-vito");
  const [passengers, setPassengers] = useState(urlPassengers ? parseInt(urlPassengers) : 1);
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

  // Fetch vehicle prices for transfer bookings
  useEffect(() => {
    const fetchPrices = async () => {
      if (isHourlyBooking || !urlPickup || !urlDropoff) return;
      
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
  }, [urlPickup, urlDropoff, preferredCurrency, isHourlyBooking]);

  // Fetch hourly rental prices
  useEffect(() => {
    const fetchHourlyPrices = async () => {
      if (!isHourlyBooking || !urlCity) return;
      
      setIsPricesLoading(true);
      try {
        const { data, error } = await supabase
          .from("hourly_rental_prices")
          .select("*")
          .eq("city", urlCity)
          .eq("is_active", true);

        if (error) throw error;
        setHourlyPrices(data || []);
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

  // Handle form submission for guests (quick booking flow)
  const handleGuestSubmit = async () => {
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
      const currentPrice = isHourlyBooking 
        ? getHourlyPrice(vehicleType, selectedDuration) 
        : selectedPrice;
      
      // Calculate return price with discount if applicable
      const returnPrice = hasReturnTrip && currentPrice
        ? (isPromoCodeValid ? Math.round(currentPrice * 0.7) : currentPrice)
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
        
        navigate(`/quick-booking-customer-info?${customerInfoParams.toString()}`);
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

    if (!customerPhone || customerPhone.length < 8) {
      toast.error(t("phoneRequired") || "Phone number is required");
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
            status: "pending",
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
            status: "pending",
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
          ? Math.round(selectedPrice * 0.7) // 30% discount
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
  const [countdown, setCountdown] = useState(5);
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

  // Countdown timer effect
  useEffect(() => {
    if (!isPricesLoading) {
      setCountdown(5);
      setProgressWidth(100);
      setTipIndex(0);
      return;
    }

    // Start progress animation
    setProgressWidth(100);
    const progressInterval = setInterval(() => {
      setProgressWidth(prev => Math.max(0, prev - 2)); // Decrease by 2% every 100ms (5 seconds total)
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

  // Professional Loading Animation Component
  if (isPricesLoading) {
    return (
      <WebsiteLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="text-center px-4 max-w-md">
            {/* Animated Car Icon */}
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto relative">
                {/* Outer ring animation */}
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-[ping_2s_ease-in-out_infinite]" />
                <div className="absolute inset-2 rounded-full border-4 border-primary/30 animate-[ping_2s_ease-in-out_infinite_0.5s]" />
                <div className="absolute inset-4 rounded-full border-4 border-primary/40 animate-[ping_2s_ease-in-out_infinite_1s]" />
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl animate-pulse">
                    <Car className="h-10 w-10 text-primary-foreground animate-bounce" />
                  </div>
                </div>
              </div>
              
              {/* Sparkle decorations */}
              <div className="absolute top-0 left-1/4 animate-[pulse_1.5s_ease-in-out_infinite]">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div className="absolute top-1/4 right-1/4 animate-[pulse_1.5s_ease-in-out_infinite_0.3s]">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="absolute bottom-1/4 left-1/3 animate-[pulse_1.5s_ease-in-out_infinite_0.6s]">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            
            {/* Text content */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 animate-fade-in">
              {language === 'TR' 
                ? "En İyi Fiyatlarımız Sizin İçin Hazırlanıyor"
                : "Best Prices Being Prepared for You"
              }
            </h2>
            <p className="text-muted-foreground mb-6 animate-fade-in">
              {language === 'TR'
                ? "Lütfen bekleyin, sizin için en uygun fiyatları buluyoruz..."
                : "Please wait, we are finding the best rates for you..."
              }
            </p>
            
            {/* Progress Bar with Countdown */}
            <div className="mb-6 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {language === 'TR' ? 'Fiyatlar yükleniyor...' : 'Loading prices...'}
                </span>
                <span className="text-sm font-semibold text-primary flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {countdown}s
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-primary/80 to-accent rounded-full transition-all duration-100 ease-linear relative"
                  style={{ width: `${progressWidth}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
            
            {/* Random Tips */}
            <div className="mb-6 px-4">
              <div 
                className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-4 border border-primary/20 shadow-sm"
                key={tipIndex}
                style={{ animation: 'tipFadeIn 0.5s ease-out' }}
              >
                <p className="text-sm font-medium text-foreground">
                  {(language === 'TR' ? loadingTips.TR : loadingTips.EN)[tipIndex]}
                </p>
              </div>
            </div>
            
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" />
              <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.2s]" />
              <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.4s]" />
            </div>
            
            {/* Trip summary card */}
            <div className="bg-card rounded-xl p-4 shadow-lg border border-border/50 animate-fade-in">
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="truncate">{urlPickup}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-accent" />
                  <span className="truncate">{urlDropoff}</span>
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {displayDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {urlTime}
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
        `}</style>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background py-8 md:py-12">
        <div className="container max-w-4xl px-4">
          {/* Header with Trip Info */}
          <div className="bg-primary text-white rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              {isHourlyBooking ? (
                <Timer className="h-6 w-6 text-accent" />
              ) : (
                <Car className="h-6 w-6 text-accent" />
              )}
              <h1 className="text-2xl md:text-3xl font-bold">
                {isHourlyBooking 
                  ? (t("hourlyRentalBooking") || "Hourly Rental Booking")
                  : (t("completeBooking") || "Complete Your Booking")
                }
              </h1>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {isHourlyBooking ? (
                <>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-1 text-accent shrink-0" />
                    <div>
                      <p className="text-white/70 text-sm">{t("city") || "City"}</p>
                      <p className="font-medium">{urlCity}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Timer className="h-5 w-5 mt-1 text-accent shrink-0" />
                    <div>
                      <p className="text-white/70 text-sm">{t("duration") || "Duration"}</p>
                      <p className="font-medium">{selectedDuration}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
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
              {/* Duration Selection - Only for hourly */}
              {isHourlyBooking && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-primary" />
                      {t("selectDuration") || "Select Duration"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {DURATION_OPTIONS.map((duration) => {
                        const isSelected = selectedDuration === duration.value;
                        return (
                          <button
                            key={duration.value}
                            type="button"
                            onClick={() => setSelectedDuration(duration.value)}
                            className={cn(
                              "px-6 py-3 rounded-xl font-semibold transition-all border-2",
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    {t("selectVehicle") || "Select Vehicle"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Warning for 7+ passengers */}
                  {passengers >= 7 && !isHourlyBooking && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t("minibusRequiredForPassengers") || "Sprinter minibus is required for 7+ passengers"}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid sm:grid-cols-2 gap-4">
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
                          className={cn(
                            "relative overflow-hidden rounded-xl transition-all duration-300 border-2",
                            "hover:shadow-lg",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50",
                            isDisabled && "opacity-50"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 z-10">
                              <CheckCircle className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          
                          {isDisabled && (
                            <div className="absolute top-3 left-3 z-10 bg-red-500/90 text-white text-xs px-2 py-1 rounded">
                              Max {vehicleCapacity}
                            </div>
                          )}
                          
                          {/* Vehicle Image Carousel with Autoplay */}
                          <div className="relative">
                            <Carousel 
                              className="w-full" 
                              opts={{ loop: true }}
                              plugins={[
                                Autoplay({
                                  delay: 3000,
                                  stopOnInteraction: true,
                                  stopOnMouseEnter: true,
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
                                  <CarouselPrevious className="left-1 h-7 w-7 bg-white/80 hover:bg-white" />
                                  <CarouselNext className="right-1 h-7 w-7 bg-white/80 hover:bg-white" />
                                </>
                              )}
                            </Carousel>
                            {/* Image counter */}
                            {v.images.length > 1 && (
                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                {Math.min(v.images.length, 6)}
                              </div>
                            )}
                          </div>
                          
                          {/* Clickable content area */}
                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setVehicleType(vehicleOption.value)}
                            className={cn(
                              "w-full p-4 text-left",
                              isDisabled && "cursor-not-allowed"
                            )}
                          >
                            <h3 className="font-semibold text-foreground mb-2">{v.label}</h3>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className={cn(
                                "flex items-center gap-1",
                                isDisabled && "text-red-500"
                              )}>
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
                                {isHourlyBooking && <span className="text-sm font-normal text-muted-foreground"> / {selectedDuration}</span>}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {t("priceOnRequest") || "Price on request"}
                              </p>
                            )}
                          </button>
                        </div>
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
              )}

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {user ? <User className="h-5 w-5 text-primary" /> : <Phone className="h-5 w-5 text-primary" />}
                    {user ? (t("passengerInfo") || "Passenger Information") : (t("contactInfo") || "Contact Information")}
                  </CardTitle>
                  {user && (
                    <CardDescription className="flex items-center gap-2 text-green-600">
                      <Shield className="h-4 w-4" />
                      {t("loggedInAs") || "Logged in as"} {user.email}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
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
                        paymentType === "credit_card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}>
                        <RadioGroupItem value="credit_card" id="credit_card" />
                        <Label htmlFor="credit_card" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{t("payWithCard") || "Credit Card in Vehicle"}</p>
                            <p className="text-sm text-muted-foreground">{t("payCardInVehicle") || "Pay by card in the vehicle"}</p>
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

            {/* Sidebar - Price Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="shadow-xl border-primary/20">
                  <CardHeader className="bg-primary text-white rounded-t-xl">
                    <CardTitle>{t("priceSummary") || "Price Summary"}</CardTitle>
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
                          <CarouselPrevious className="left-2 h-8 w-8 bg-white/80 hover:bg-white" />
                          <CarouselNext className="right-2 h-8 w-8 bg-white/80 hover:bg-white" />
                        </Carousel>
                        {/* Image counter */}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {VEHICLE_TYPE_MAP[vehicleType].images.length} {t("photos") || "photos"}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground text-sm">{t("vehicle") || "Vehicle"}</span>
                        <span className="font-semibold text-right">{VEHICLE_TYPE_MAP[vehicleType]?.label || vehicleType}</span>
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

                      {/* Reject for Better Price Button - Only show if discount not yet applied and there's a price */}
                      {selectedPrice && !discountApplied && (
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full h-12 text-base font-medium mt-3 border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400"
                          disabled={rejectingPrice}
                          onClick={async () => {
                            if (!selectedPrice) return;
                            
                            setRejectingPrice(true);
                            
                            try {
                              // Calculate €3 discount equivalent in selected currency
                              let discountInCurrency = 3; // €3 default
                              
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
                                  // Fallback rates
                                  const fallbackRates: Record<string, number> = {
                                    'USD': 1.08, 'TRY': 37.5, 'GBP': 0.85, 'AED': 3.97, 'AUD': 1.65
                                  };
                                  discountInCurrency = Math.round(3 * (fallbackRates[preferredCurrency] || 1));
                                }
                              }
                              
                              const newPrice = Math.max(selectedPrice - discountInCurrency, 1);
                              
                              // Store original price for display
                              setOriginalPrice(selectedPrice);
                              setDiscountAmount(discountInCurrency);
                              
                              // Update vehicle prices with discount
                              setVehiclePrices(prev => 
                                prev.map(v => ({
                                  ...v,
                                  price: v.price ? Math.max(v.price - discountInCurrency, 1) : v.price
                                }))
                              );
                              
                              // Also update hourly prices if applicable
                              if (isHourlyBooking) {
                                setHourlyPrices(prev => 
                                  prev.map(h => ({
                                    ...h,
                                    price: Math.max(h.price - discountInCurrency, 1)
                                  }))
                                );
                              }
                              
                              setDiscountApplied(true);
                              
                              // Celebrate with confetti!
                              confetti({
                                particleCount: 80,
                                spread: 100,
                                origin: { y: 0.5, x: 0.5 },
                                colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b']
                              });
                              
                              setTimeout(() => {
                                confetti({
                                  particleCount: 50,
                                  angle: 60,
                                  spread: 55,
                                  origin: { x: 0, y: 0.6 },
                                  colors: ['#22c55e', '#16a34a', '#fbbf24']
                                });
                              }, 150);
                              
                              setTimeout(() => {
                                confetti({
                                  particleCount: 50,
                                  angle: 120,
                                  spread: 55,
                                  origin: { x: 1, y: 0.6 },
                                  colors: ['#22c55e', '#16a34a', '#fbbf24']
                                });
                              }, 300);
                              
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
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Percent className="mr-2 h-5 w-5" />
                              {t("rejectForBetterPrice") || "Get Better Price"}
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Show discount applied badge */}
                      {discountApplied && originalPrice && (
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg py-2 mt-3 animate-pulse">
                          <Tag className="h-4 w-4" />
                          <span>
                            {t("discountAppliedLabel") || "Discount Applied:"} 
                            <span className="line-through ml-1 text-muted-foreground">
                              {preferredCurrency === 'EUR' ? '€' : preferredCurrency === 'USD' ? '$' : preferredCurrency === 'GBP' ? '£' : preferredCurrency === 'TRY' ? '₺' : preferredCurrency}{originalPrice}
                            </span>
                            <span className="font-bold ml-1">
                              → {preferredCurrency === 'EUR' ? '€' : preferredCurrency === 'USD' ? '$' : preferredCurrency === 'GBP' ? '£' : preferredCurrency === 'TRY' ? '₺' : preferredCurrency}{selectedPrice}
                            </span>
                          </span>
                        </div>
                      )}

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
    </WebsiteLayout>
  );
};

export default BookingPage;
