import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parse } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePromo, getLocalizedDiscountText } from "@/contexts/PromoContext";
import { validatePromoCode } from "@/hooks/useActivePromoCode";
import { useAuth } from "@/contexts/AuthContext";
import { PendingBookingStorage } from "@/hooks/usePendingBookingStorage";
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
  Phone, MessageSquare, Car, Coins, CreditCard, Banknote, User, Shield, Timer, ChevronLeft, ChevronRight, Percent, Sparkles, Eye, EyeOff, Lock, Plane, UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPE_MAP, getAvailableVehicles, isMinibusRequired, VehicleTypeInfo } from "@/lib/vehicleTypes";
import { DUBAI_VEHICLE_TYPES, DUBAI_VEHICLE_TYPE_MAP } from "@/lib/dubaiVehicleTypes";
import { isDubaiLocation, isTurkeyLocation } from "@/lib/locationDetection";
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
import { z } from "zod";

// Session storage key for caching booking form state during Google OAuth
const GOOGLE_AUTH_CACHE_KEY = 'google_auth_booking_cache';

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

// Password validation schema
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(100)
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/\d.*\d.*\d.*\d/, 'Password must contain at least 4 digits');

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

  // Token for existing quick booking (from AI assistant)
  const urlToken = searchParams.get("token") || "";
  
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
  
  // Token booking data state
  const [tokenBookingData, setTokenBookingData] = useState<{
    id: string;
    pickup: string;
    dropoff: string;
    pickup_date: string;
    pickup_time: string;
    passengers: number;
    vehicle_type: string;
    price: number | null;
    price_currency: string | null;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    customer_notes: string | null;
    has_return_trip: boolean | null;
    return_date: string | null;
    return_time: string | null;
    return_price: number | null;
    baby_seat_count: number | null;
    luggage_count: number | null;
    service_type: string;
    city: string | null;
    duration_hours: number | null;
    promo_code: string | null;
  } | null>(null);
  const [tokenLoading, setTokenLoading] = useState(!!urlToken);

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
  const [detectedRegion, setDetectedRegion] = useState<string | null>(null);
  
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

  // Guest user form state (new - for account creation)
  const [guestPassword, setGuestPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Flight and passenger details
  const [flightNumber, setFlightNumber] = useState("");
  const [passengerNames, setPassengerNames] = useState("");
  
  // Booking success state
  const [bookingCompleted, setBookingCompleted] = useState(false);
  const [completedReservationId, setCompletedReservationId] = useState<string | null>(null);

  // Effective values - use token data if available, otherwise URL params
  const effectivePickup = tokenBookingData?.pickup || urlPickup;
  const effectiveDropoff = tokenBookingData?.dropoff || urlDropoff;
  const effectiveDate = tokenBookingData?.pickup_date || urlDate;
  const effectiveTime = tokenBookingData?.pickup_time || urlTime;
  const effectiveCity = tokenBookingData?.city || urlCity;
  const effectiveIsHourly = tokenBookingData?.service_type === 'hourly' || isHourlyBooking;

  // Check if location is in Dubai or Turkey - use edge function's region if available
  const isDubai = detectedRegion === 'dubai' || (!detectedRegion && (isDubaiLocation(effectivePickup) || isDubaiLocation(effectiveDropoff)));
  const isTurkey = detectedRegion === 'turkey' || (!detectedRegion && (isTurkeyLocation(effectivePickup) || isTurkeyLocation(effectiveDropoff)));

  // Computed values - use Dubai vehicles if location is in Dubai
  const availableVehicles = isDubai 
    ? DUBAI_VEHICLE_TYPES.map(v => ({ value: v.value, label: v.label }))
    : getAvailableVehicles(passengers, luggageCount);
  const minibusRequired = isDubai ? false : isMinibusRequired(passengers, luggageCount);
  
  // Get the correct vehicle map based on location
  const vehicleTypeMap = isDubai ? DUBAI_VEHICLE_TYPE_MAP : VEHICLE_TYPE_MAP;

  // Auto-select appropriate vehicle based on location
  useEffect(() => {
    if (isDubai) {
      // For Dubai, auto-select first Dubai vehicle if current vehicle is not a Dubai type
      const isDubaiVehicle = vehicleType.startsWith('dubai-');
      if (!isDubaiVehicle && DUBAI_VEHICLE_TYPES.length > 0) {
        setVehicleType(DUBAI_VEHICLE_TYPES[0].value);
      }
    } else if (minibusRequired && vehicleType !== 'minibus') {
      setVehicleType('minibus');
    }
  }, [minibusRequired, vehicleType, isDubai]);

  // Load booking data from token (AI assistant flow)
  useEffect(() => {
    if (!urlToken) {
      setTokenLoading(false);
      return;
    }
    
    const loadTokenBooking = async () => {
      try {
        // Use edge function to fetch booking securely (RLS prevents direct access)
        const { data: result, error } = await supabase.functions.invoke('get-quick-booking-by-token', {
          body: { token: urlToken }
        });
        
        if (error || !result?.success || !result?.data) {
          console.error("Failed to load booking:", error || result?.error);
          toast.error(t("bookingNotFound") || "Booking not found");
          navigate(getLocalizedPath("/"));
          return;
        }
        
        const data = result.data;
        setTokenBookingData(data);
        
        // Pre-fill form with booking data
        setVehicleType(data.vehicle_type || "mercedes-vito");
        setPassengers(data.passengers || 1);
        setLuggageCount(data.luggage_count || 1);
        setBabySeatCount(data.baby_seat_count || 0);
        setPreferredCurrency(data.price_currency || "EUR");
        setCustomerPhone(data.customer_phone || "");
        setCustomerEmail(data.customer_email || "");
        setCustomerName(data.customer_name || "");
        setCustomerNotes(data.customer_notes || "");
        setHasReturnTrip(!!data.has_return_trip);
        setReturnDate(data.return_date || "");
        setReturnTime(data.return_time || "");
        if (data.promo_code) setPromoCode(data.promo_code);
        if (data.duration_hours) setSelectedDuration(`${data.duration_hours}h`);
        
      } catch (err) {
        console.error("Error loading token booking:", err);
        navigate(getLocalizedPath("/"));
      } finally {
        setTokenLoading(false);
      }
    };
    
    loadTokenBooking();
  }, [urlToken, navigate, getLocalizedPath, t]);

  // Redirect if no URL params AND no token
  useEffect(() => {
    // Skip redirect if we have a token (will be loaded separately)
    if (urlToken || tokenLoading) return;
    
    // Skip redirect if token booking data is loaded
    if (tokenBookingData) return;
    
    if (isHourlyBooking) {
      if (!urlCity || !urlDate || !urlTime) {
        navigate(getLocalizedPath("/"));
      }
    } else {
      if (!urlPickup || !urlDropoff || !urlDate || !urlTime) {
        navigate(getLocalizedPath("/"));
      }
    }
  }, [urlPickup, urlDropoff, urlDate, urlTime, urlCity, isHourlyBooking, navigate, getLocalizedPath, urlToken, tokenLoading, tokenBookingData]);

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

  // Auto-validate promo code from URL when page loads with return trip
  useEffect(() => {
    // Skip if token loading (will be handled by token flow)
    if (tokenLoading || urlToken) return;
    
    // Auto-validate promo code if coming from hero with return trip selected
    if (urlHasReturnTrip && urlPromoCode && isTurkey) {
      handlePromoCodeChange(urlPromoCode);
    }
    // If return trip is selected but no promo code, auto-apply active promo
    else if (urlHasReturnTrip && !urlPromoCode && isTurkey && activePromo.code) {
      handlePromoCodeChange(activePromo.code);
    }
  }, [urlHasReturnTrip, urlPromoCode, isTurkey, activePromo.code, tokenLoading, urlToken]);

  // Check for Google OAuth return - save booking data and redirect to customer home
  useEffect(() => {
    const checkGoogleAuth = async () => {
      const googleAuth = searchParams.get("googleAuth");
      
      if (googleAuth === "true") {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('[GoogleAuth] User authenticated, preparing redirect to customer home');
          
          // Step 1: Restore cached form data from sessionStorage (saved before OAuth)
          let cachedVehicleType = vehicleType;
          let cachedHasReturnTrip = hasReturnTrip;
          let cachedReturnDate = returnDate;
          let cachedReturnTime = returnTime;
          let cachedBabySeatCount = babySeatCount;
          let cachedLuggageCount = luggageCount;
          let cachedPromoCode = promoCode;
          let cachedPassengers = urlPassengers ? parseInt(urlPassengers) : 1;
          let cachedPrice: number | undefined;
          let cachedPriceCurrency: string | undefined;
          let cachedReturnPrice: number | undefined;
          
          try {
            const cachedData = sessionStorage.getItem(GOOGLE_AUTH_CACHE_KEY);
            if (cachedData) {
              const parsed = JSON.parse(cachedData);
              console.log('[GoogleAuth] Found cached booking data:', parsed);
              
              // Use cached values
              if (parsed.vehicleType) cachedVehicleType = parsed.vehicleType;
              if (parsed.passengers) cachedPassengers = parsed.passengers;
              if (parsed.hasReturnTrip !== undefined) cachedHasReturnTrip = parsed.hasReturnTrip;
              if (parsed.returnDate) cachedReturnDate = parsed.returnDate;
              if (parsed.returnTime) cachedReturnTime = parsed.returnTime;
              if (parsed.babySeatCount !== undefined) cachedBabySeatCount = parsed.babySeatCount;
              if (parsed.luggageCount !== undefined) cachedLuggageCount = parsed.luggageCount;
              if (parsed.promoCode) cachedPromoCode = parsed.promoCode;
              
              // Get price from cached vehicle prices
              if (parsed.vehiclePrices?.length > 0) {
                const selectedVehiclePrice = parsed.vehiclePrices.find(
                  (p: { vehicleType: string; price: number | null; currency: string }) => 
                    p.vehicleType === cachedVehicleType
                );
                if (selectedVehiclePrice?.price) {
                  cachedPrice = selectedVehiclePrice.price;
                  cachedPriceCurrency = selectedVehiclePrice.currency || parsed.preferredCurrency || 'EUR';
                  // Return trip price (with potential discount)
                  if (cachedHasReturnTrip && parsed.promoDiscountPercent) {
                    cachedReturnPrice = Math.round(cachedPrice * (100 - parsed.promoDiscountPercent) / 100);
                  } else if (cachedHasReturnTrip) {
                    cachedReturnPrice = cachedPrice;
                  }
                }
              }
              
              // Clear the cache
              sessionStorage.removeItem(GOOGLE_AUTH_CACHE_KEY);
            }
          } catch (e) {
            console.error('[GoogleAuth] Error reading cached data:', e);
          }
          
          // Step 2: Save complete booking data to PendingBookingStorage for customer home
          PendingBookingStorage.save({
            pickup: urlPickup,
            dropoff: urlDropoff,
            date: urlDate,
            time: urlTime,
            passengers: cachedPassengers,
            vehicleType: cachedVehicleType,
            estimatedPrice: cachedPrice,
            currency: cachedPriceCurrency,
            hasReturnTrip: cachedHasReturnTrip,
            returnDate: cachedReturnDate,
            returnTime: cachedReturnTime,
            returnPrice: cachedReturnPrice,
            babySeatCount: cachedBabySeatCount,
            luggageCount: cachedLuggageCount,
            promoCode: cachedPromoCode,
            serviceType: isHourlyBooking ? 'hourly' : 'transfer',
            language,
            // Customer info from Google
            customerName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            customerEmail: session.user.email || '',
          });
          
          console.log('[GoogleAuth] Saved booking data to PendingBookingStorage, redirecting to customer home');
          
          // Step 3: Redirect to customer home where form will be auto-filled
          navigate('/customer/home', { replace: true });
        }
      }
    };
    
    checkGoogleAuth();
  }, [searchParams, navigate, urlPickup, urlDropoff, urlDate, urlTime, urlPassengers, vehicleType, hasReturnTrip, returnDate, returnTime, babySeatCount, luggageCount, promoCode, isHourlyBooking, language]);

  // Fetch vehicle prices for transfer bookings with minimum 8 second loading animation
  useEffect(() => {
    const fetchPrices = async () => {
      if (isHourlyBooking || !urlPickup || !urlDropoff) return;
      
      // Skip price fetching entirely if returning from Google OAuth (we're redirecting anyway)
      const googleAuth = searchParams.get("googleAuth");
      if (googleAuth === "true") {
        console.log('[Prices] Skipping fetch - Google OAuth return, will redirect to customer home');
        return;
      }
      
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
        
        // Use region from edge function - this is the authoritative source
        if (data?.region) {
          setDetectedRegion(data.region);
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
  }, [urlPickup, urlDropoff, preferredCurrency, isHourlyBooking, searchParams, vehiclePrices.length]);

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

  // Validate guest form
  const validateGuestForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!customerName.trim()) {
      errors.name = t("nameRequired") || "Name is required";
    }
    
    if (!customerPhone.trim() || customerPhone.length < 7) {
      errors.phone = t("phoneRequired") || "Valid phone number is required";
    }
    
    if (!customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      errors.email = t("emailRequired") || "Valid email address is required";
    }
    
    // Only validate password for non-Google users
    if (!isGoogleUser && !user) {
      const passwordResult = passwordSchema.safeParse(guestPassword);
      if (!passwordResult.success) {
        errors.password = passwordResult.error.errors[0]?.message || t("invalidPassword") || "Invalid password";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Save current form state to sessionStorage BEFORE OAuth redirect
      // This ensures all form data (prices, return trip, etc.) is preserved
      const cacheData = {
        vehiclePrices,
        hourlyPrices,
        vehicleType,
        passengers,
        hasReturnTrip,
        returnDate,
        returnTime,
        babySeatCount,
        luggageCount,
        promoCode,
        isPromoCodeValid,
        promoDiscountPercent,
        detectedRegion,
        selectedDuration,
        customerNotes,
        flightNumber,
        passengerNames,
        paymentType,
        preferredCurrency,
      };
      sessionStorage.setItem(GOOGLE_AUTH_CACHE_KEY, JSON.stringify(cacheData));
      console.log('[GoogleAuth] Saved form cache before OAuth redirect:', cacheData);
      
      // Build current URL with all params for redirect
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('googleAuth', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: currentUrl.toString(),
        },
      });
      
      if (error) throw error;
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      toast.error(t("googleSignInError") || "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  // Handle form submission for guests (create account + reservation)
  const handleGuestSubmit = async () => {
    // Validate form
    if (!validateGuestForm()) {
      toast.error(t("pleaseFixErrors") || "Please fix the form errors");
      return;
    }

    setSubmitting(true);
    
    try {
      const currentPrice = isHourlyBooking 
        ? getHourlyPrice(vehicleType, selectedDuration) 
        : selectedPrice;
      
      // Calculate return price with discount if applicable
      const discountMultiplier = promoDiscountPercent ? (100 - promoDiscountPercent) / 100 : 1;
      const returnPrice = hasReturnTrip && currentPrice
        ? (isPromoCodeValid && promoDiscountPercent ? Math.round(currentPrice * discountMultiplier) : currentPrice)
        : null;
      
      // Calculate discount amount for return trip
      const returnDiscountAmount = hasReturnTrip && currentPrice && isPromoCodeValid && promoDiscountPercent
        ? Math.round(currentPrice * (promoDiscountPercent / 100) * 100) / 100
        : null;

      // Call edge function to create account and reservation
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "create-quick-booking-reservation",
        {
          body: {
            // Booking details
            pickup: isHourlyBooking ? urlCity : urlPickup,
            dropoff: isHourlyBooking ? `${selectedDuration} ${t("hourlyRental") || "Hourly Rental"} - ${urlCity}` : urlDropoff,
            pickupDate: urlDate,
            pickupTime: urlTime,
            vehicleType,
            passengers,
            price: currentPrice,
            priceCurrency: preferredCurrency,
            paymentMethod: paymentType,
            hasReturnTrip: hasReturnTrip && returnDate && returnTime ? true : false,
            returnDate: hasReturnTrip && returnDate ? returnDate : null,
            returnTime: hasReturnTrip && returnTime ? returnTime : null,
            returnPrice: returnPrice,
            returnDiscountPercentage: hasReturnTrip && isPromoCodeValid && promoDiscountPercent ? promoDiscountPercent : null,
            returnDiscountAmount: returnDiscountAmount,
            promoCode: hasReturnTrip && isPromoCodeValid && promoCode ? promoCode : null,
            babySeatCount,
            luggageCount,
            customerNotes: customerNotes.trim() || null,
            flightNumber: flightNumber.trim() || null,
            passengerNames: passengerNames.trim() ? passengerNames.trim().split('\n').filter(n => n.trim()) : null,
            // Customer info
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim(),
            customerPassword: isGoogleUser ? null : guestPassword,
            isGoogleUser,
          },
        }
      );

      if (fnError) throw fnError;
      if (!result?.success) throw new Error(result?.error || "Failed to create reservation");

      // Sign in the user (for non-Google users)
      if (!isGoogleUser && guestPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: customerEmail.trim(),
          password: guestPassword,
        });

        if (signInError) {
          console.error("Auto sign-in error:", signInError);
        }
      }

      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setBookingCompleted(true);
      setCompletedReservationId(result.reservationId);
      toast.success(t("bookingConfirmed") || "Booking confirmed!");
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
            passenger_names: passengerNames.trim() ? passengerNames.trim().split('\n').filter(n => n.trim()) : null,
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
            flight_number: flightNumber.trim() || null,
            passenger_names: passengerNames.trim() ? passengerNames.trim().split('\n').filter(n => n.trim()) : null,
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
        // Use actual promo discount percentage instead of hardcoded 25%
        const discountPercent = isTurkey && isPromoCodeValid && promoDiscountPercent ? promoDiscountPercent : 0;
        const returnPrice = selectedPrice && discountPercent > 0
          ? Math.round(selectedPrice * (100 - discountPercent) / 100)
          : selectedPrice;
        const discountAmount = selectedPrice && discountPercent > 0
          ? Math.round(selectedPrice * (discountPercent / 100) * 100) / 100
          : 0;

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
            passenger_names: passengerNames.trim() ? passengerNames.trim().split('\n').filter(n => n.trim()) : null,
            status: "pending",
            is_return_transfer: true,
            original_reservation_id: reservation.id,
            promo_code: isPromoCodeValid && promoCode ? promoCode : null,
            discount_percentage: discountPercent > 0 ? discountPercent : null,
            discount_amount: discountAmount > 0 ? discountAmount : null,
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

      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setBookingCompleted(true);
      setCompletedReservationId(reservation.id);
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
  const displayDate = effectiveDate ? format(parse(effectiveDate, "yyyy-MM-dd", new Date()), "dd MMM yyyy") : "";
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

    setWasLoading(true);

    setProgressWidth(100);
    const progressInterval = setInterval(() => {
      setProgressWidth(prev => Math.max(0, prev - 1.25));
    }, 100);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 1;
        return prev - 1;
      });
    }, 1000);

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

  // Token Loading Screen
  if (tokenLoading) {
    return (
      <WebsiteLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {language === "TR" ? "Rezervasyon bilgileri yükleniyor..." : "Loading booking details..."}
            </p>
          </div>
        </div>
      </WebsiteLayout>
    );
  }

  // Booking Success Screen
  // Auto-redirect to customer home after booking is completed
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  
  useEffect(() => {
    if (bookingCompleted && user) {
      const timer = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/customer/home', { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [bookingCompleted, user, navigate]);

  if (bookingCompleted) {
    return (
      <WebsiteLayout>
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
              
              {/* Auto-redirect countdown for logged-in users */}
              {user && (
                <p className="text-sm text-primary mb-4 animate-pulse">
                  {language === 'TR' 
                    ? `${redirectCountdown} saniye içinde panele yönlendiriliyorsunuz...`
                    : `Redirecting to your panel in ${redirectCountdown} seconds...`
                  }
                </p>
              )}
              
              <Button onClick={() => navigate("/customer/home")} className="w-full" size="lg">
                {t("viewMyReservations") || "View My Reservations"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </WebsiteLayout>
    );
  }

  // Professional Loading Animation Component
  if (isPricesLoading) {
    return (
      <WebsiteLayout>
        <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 safe-area-inset">
          <div className="text-center w-full max-w-sm sm:max-w-md">
            <div className="relative mb-6 sm:mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto relative">
                <div className="absolute inset-0 rounded-full border-2 sm:border-4 border-primary/20 animate-[ping_2s_ease-in-out_infinite]" />
                <div className="absolute inset-1.5 sm:inset-2 rounded-full border-2 sm:border-4 border-primary/30 animate-[ping_2s_ease-in-out_infinite_0.5s]" />
                <div className="absolute inset-3 sm:inset-4 rounded-full border-2 sm:border-4 border-primary/40 animate-[ping_2s_ease-in-out_infinite_1s]" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl animate-pulse">
                    <Car className="h-7 w-7 sm:h-10 sm:w-10 text-primary-foreground animate-bounce" />
                  </div>
                </div>
              </div>
              
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
            
            <div className="mb-4 sm:mb-6">
              <div 
                className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 shadow-sm min-h-[60px] sm:min-h-[72px] flex items-center justify-center animate-tip-fade-in"
                key={tipIndex}
              >
                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                  {(language === 'TR' ? loadingTips.TR : loadingTips.EN)[tipIndex]}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.2s]" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.4s]" />
            </div>
          </div>
        </div>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-28 lg:pb-8">
          {/* Compact Hero with Route Info */}
          <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-white mb-4 sm:mb-8 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {isHourlyBooking ? (
                <>
                  <div className="flex items-start gap-2 sm:gap-3 col-span-2">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-accent shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white/70 text-xs sm:text-sm">{t("city") || "City"}</p>
                      <p className="font-medium text-sm sm:text-base line-clamp-2">{urlCity}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 col-span-2">
                    <Timer className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-accent shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white/70 text-xs sm:text-sm">{t("duration") || "Duration"}</p>
                      <p className="font-medium text-sm sm:text-base">{t("hourlyRental") || "Hourly Rental"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 sm:gap-3 col-span-2 sm:col-span-1">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-accent shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white/70 text-xs sm:text-sm">{t("pickupPoint")}</p>
                      <p className="font-medium text-sm sm:text-base line-clamp-2">{effectivePickup}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 col-span-2 sm:col-span-1">
                    <Navigation className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-accent shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white/70 text-xs sm:text-sm">{t("dropoffLocation")}</p>
                      <p className="font-medium text-sm sm:text-base line-clamp-2">{effectiveDropoff}</p>
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
                  <p className="font-medium text-sm sm:text-base">{effectiveTime}</p>
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
                      const v = vehicleTypeMap[vehicleOption.value];
                      if (!v) return null;
                      
                      const price = isHourlyBooking 
                        ? getHourlyPrice(vehicleOption.value, selectedDuration)
                        : getPriceForVehicle(vehicleOption.value);
                      const isSelected = vehicleType === vehicleOption.value;
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
                            justSelectedVehicle === vehicleOption.value && "animate-vehicle-shake"
                          )}
                          onAnimationEnd={() => setJustSelectedVehicle(null)}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-primary text-primary-foreground rounded-full p-1 sm:p-1.5 shadow-lg animate-[pulse_1.5s_ease-in-out_infinite]">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                          )}
                          
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
                            {v.images.length > 1 && (
                              <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-black/60 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 rounded">
                                {Math.min(v.images.length, 6)}
                              </div>
                            )}
                          </div>
                          
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
                            
                            {price ? (
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

              {/* Currency Selection - Below Vehicle List */}
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    {t("preferredCurrency") || "Preferred Currency"}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {t("currencyHint") || "Select your preferred currency for the price quote"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {CURRENCY_OPTIONS.map((currency) => (
                      <button
                        key={currency.value}
                        type="button"
                        onClick={() => {
                          setPreferredCurrency(currency.value);
                          // Refetch prices with new currency
                          if (isHourlyBooking) {
                            // For hourly, prices are in DB currency, just update display
                          } else if (urlPickup && urlDropoff) {
                            setIsPricesLoading(true);
                            supabase.functions.invoke("get-all-vehicle-prices", {
                              body: {
                                pickup: urlPickup,
                                dropoff: urlDropoff,
                                customerCurrency: currency.value,
                              },
                            }).then(({ data }) => {
                              if (data?.prices) {
                                setVehiclePrices(data.prices);
                              }
                              setIsPricesLoading(false);
                            }).catch(() => {
                              setIsPricesLoading(false);
                            });
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium transition-all duration-200 text-sm border",
                          preferredCurrency === currency.value
                            ? "bg-primary text-primary-foreground shadow-md scale-105 border-primary"
                            : "bg-background text-foreground hover:bg-muted border-border"
                        )}
                      >
                        <span>{currency.flag}</span>
                        <span>{currency.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Return Trip Option - Show discount promo ONLY for Turkey locations */}
              {!isHourlyBooking && (
                <Card className={isTurkey 
                  ? "border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20"
                  : "border-muted"
                }>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div 
                      className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                        isTurkey 
                          ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border border-green-200 dark:border-green-700"
                          : "bg-muted/50 border border-muted-foreground/20"
                      }`}
                      onClick={() => {
                        const newValue = !hasReturnTrip;
                        setHasReturnTrip(newValue);
                        // Only auto-apply promo for Turkey locations
                        if (isTurkey && newValue && activePromo.code && !promoCode) {
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
                          // Only auto-apply promo for Turkey locations
                          if (isTurkey && newValue && activePromo.code && !promoCode) {
                            handlePromoCodeChange(activePromo.code);
                          }
                        }}
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="returnTrip" className="cursor-pointer font-semibold text-base flex items-center gap-2">
                          {t("addReturnTrip") || "Add return trip"}
                          {/* Only show discount badge for Turkey locations */}
                          {isTurkey && activePromo.code && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-bold animate-pulse">
                              <Sparkles className="h-3 w-3" />
                              {activePromo.discountPercentage}% {t("discount") || "OFF"}
                            </span>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isTurkey 
                            ? (language === 'TR' 
                                ? `Dönüş yolculuğunuzda %${activePromo.discountPercentage} indirim otomatik uygulanır!`
                                : `${activePromo.discountPercentage}% discount automatically applied on your return!`)
                            : (language === 'TR' 
                                ? 'Dönüş yolculuğu ekleyin'
                                : 'Add a return trip to your booking')
                          }
                        </p>
                      </div>
                    </div>

                    {/* Only show discount applied message for Turkey locations */}
                    {isTurkey && hasReturnTrip && isPromoCodeValid && promoDiscountPercent && (
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
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Customer Information - For both guests and logged-in users */}
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    {t("customerInformation") || "Your Information"}
                  </CardTitle>
                  {user && (
                    <CardDescription className="flex items-center gap-2 text-green-600 text-xs sm:text-sm">
                      <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="truncate">{t("loggedInAs") || "Logged in as"} {user.email}</span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                  {/* Name field */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      {t("fullName") || "Full Name"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={t("enterFullName") || "Enter your full name"}
                      className={formErrors.name ? "border-destructive" : ""}
                    />
                    {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
                  </div>

                  {/* Phone field */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      {t("phoneNumber") || "Phone"} <span className="text-red-500">*</span>
                    </Label>
                    <PhoneInput
                      value={customerPhone}
                      onChange={setCustomerPhone}
                      placeholder="555 123 4567"
                      className={formErrors.phone ? "border-destructive" : ""}
                    />
                    {formErrors.phone && <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>}
                  </div>

                  {/* Email field */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t("email") || "Email"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="email@example.com"
                      disabled={!!user || isGoogleUser}
                      className={formErrors.email ? "border-destructive" : ""}
                    />
                    {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
                  </div>

                  {/* Password field - Only for guests (non-logged-in, non-Google users) */}
                  {!user && !isGoogleUser && (
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {t("password") || "Create Password"} <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={guestPassword}
                          onChange={(e) => setGuestPassword(e.target.value)}
                          placeholder={t("createPassword") || "Create a password"}
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
                      {formErrors.password && <p className="text-xs text-destructive mt-1">{formErrors.password}</p>}
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("passwordHint") || "Min 6 chars, 1 uppercase, 1 lowercase, 4 digits"}
                      </p>
                    </div>
                  )}

                  {/* Google Sign In - Only for guests */}
                  {!user && !isGoogleUser && (
                    <div className="pt-4 border-t border-border">
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

                  {/* Flight Number - Only for airport transfers */}
                  {!isHourlyBooking && (urlPickup.toLowerCase().includes('airport') || urlPickup.toLowerCase().includes('havalimanı') || urlPickup.toLowerCase().includes('havaalanı')) && (
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        {t("flightNumber") || "Flight Number"}
                      </Label>
                      <Input
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                        placeholder="TK 1234"
                        maxLength={20}
                        className="uppercase"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === 'TR' 
                          ? "Uçuş numaranızı girerek gecikmeler durumunda sizi bekleyebiliriz"
                          : "Enter your flight number so we can track delays"}
                      </p>
                    </div>
                  )}

                  {/* Passenger Names */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      {t("passengerNames") || "Passenger Names"} 
                      <span className="text-xs text-muted-foreground">({t("optional") || "optional"})</span>
                    </Label>
                    <Textarea
                      value={passengerNames}
                      onChange={(e) => setPassengerNames(e.target.value)}
                      placeholder={language === 'TR' 
                        ? "Her satıra bir yolcu ismi yazın\nÖrn: John Smith\nJane Doe"
                        : "Enter one passenger name per line\nE.g: John Smith\nJane Doe"
                      }
                      className="resize-none min-h-[80px]"
                      maxLength={500}
                    />
                  </div>

                  {/* Notes field */}
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
                        : (t("specialRequestsPlaceholder") || "Special requirements, child seats, etc...")
                      }
                      className="resize-none min-h-[80px]"
                      maxLength={500}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Options */}
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    {t("paymentMethod") || "Payment Method"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
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
            </div>

            {/* Sidebar - Price Summary - Hidden on mobile */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-24">
                <Card className="shadow-xl border-primary/20">
                  <CardHeader className="bg-primary text-white rounded-t-xl p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">{t("priceSummary") || "Price Summary"}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
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
                        {selectedPrice ? (
                          <div className="space-y-3">
                            {/* Outbound Trip Price */}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                {isHourlyBooking ? (t("rentalPrice") || "Rental") : (t("outboundTrip") || "Outbound Trip")}
                              </span>
                              <span className="font-medium">{selectedPrice} {preferredCurrency}</span>
                            </div>
                            
                            {/* Return Trip Price with Discount */}
                            {hasReturnTrip && !isHourlyBooking && (
                              <>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    {t("returnTrip") || "Return Trip"}
                                    {isPromoCodeValid && promoDiscountPercent && (
                                      <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                                        -{promoDiscountPercent}%
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-medium flex items-center gap-2">
                                    {isPromoCodeValid && promoDiscountPercent ? (
                                      <>
                                        <span className="line-through text-muted-foreground text-xs">{selectedPrice}</span>
                                        <span className="text-green-600 dark:text-green-400">
                                          {Math.round(selectedPrice * (100 - promoDiscountPercent) / 100)} {preferredCurrency}
                                        </span>
                                      </>
                                    ) : (
                                      <span>{selectedPrice} {preferredCurrency}</span>
                                    )}
                                  </span>
                                </div>
                                
                                {/* Savings */}
                                {isPromoCodeValid && promoDiscountPercent && (
                                  <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1.5 rounded-lg">
                                    <span className="flex items-center gap-1">
                                      <Sparkles className="h-3.5 w-3.5" />
                                      {t("savings") || "Savings"}
                                    </span>
                                    <span className="font-semibold">
                                      -{Math.round(selectedPrice * promoDiscountPercent / 100)} {preferredCurrency}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Total */}
                            <div className="border-t pt-3 mt-2">
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">
                                  {t("grandTotal") || "Grand Total"}
                                </p>
                                {hasReturnTrip && !isHourlyBooking ? (
                                  <div className="space-y-1">
                                    {isPromoCodeValid && promoDiscountPercent && (
                                      <p className="text-lg text-muted-foreground line-through">
                                        {selectedPrice * 2} {preferredCurrency}
                                      </p>
                                    )}
                                    <p className="text-3xl font-bold text-primary">
                                      {isPromoCodeValid && promoDiscountPercent
                                        ? selectedPrice + Math.round(selectedPrice * (100 - promoDiscountPercent) / 100)
                                        : selectedPrice * 2} {preferredCurrency}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-3xl font-bold text-primary">
                                    {selectedPrice} {preferredCurrency}
                                  </p>
                                )}
                                <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                                  ✓ {t("freeCancellation24h") || "Free cancellation 24 hours before"}
                                </p>
                              </div>
                            </div>
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
                      {!selectedPrice && !isPricesLoading && !isHourlyBooking ? (
                        <div className="space-y-3">
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
                            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                              {t("priceNotAvailable") || "Bu güzergah için otomatik fiyat bulunamadı"}
                            </p>
                            <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
                              {t("adminWillContact") || "Admin sizinle en kısa sürede iletişime geçecek"}
                            </p>
                          </div>
                          <Button
                            onClick={handleSubmit}
                            size="lg"
                            variant="outline"
                            className="w-full h-14 text-lg font-semibold group border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            disabled={submitting}
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {t("sending") || "Processing..."}
                              </>
                            ) : (
                              <>
                                {t("requestPrice") || "Fiyat Talebi Gönder"}
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
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
                              {t("sending") || "Processing..."}
                            </>
                          ) : (
                            <>
                              {t("confirmBooking") || "Confirm Booking"}
                              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </Button>
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
      
      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t-2 border-primary/20 p-3 sm:p-4 shadow-2xl z-[100]" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            {selectedPrice ? (
              <>
                <p className="text-xs text-muted-foreground">{t("grandTotal") || "Total"}</p>
                {hasReturnTrip && !isHourlyBooking ? (
                  <div className="flex items-center gap-2">
                    {isPromoCodeValid && promoDiscountPercent && (
                      <span className="text-sm text-muted-foreground line-through">
                        {selectedPrice * 2}
                      </span>
                    )}
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {isPromoCodeValid && promoDiscountPercent
                        ? selectedPrice + Math.round(selectedPrice * (100 - promoDiscountPercent) / 100)
                        : selectedPrice * 2} {preferredCurrency}
                    </p>
                    {isPromoCodeValid && promoDiscountPercent && (
                      <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-medium">
                        -{promoDiscountPercent}%
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xl sm:text-2xl font-bold text-primary">
                    {selectedPrice} {preferredCurrency}
                  </p>
                )}
              </>
            ) : (
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{t("priceNotAvailableShort") || "Fiyat Bulunamadı"}</p>
                <p className="text-xs text-muted-foreground">{t("requestFromAdmin") || "Admin'den talep edin"}</p>
              </div>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            size="lg"
            variant={selectedPrice ? "accent" : "outline"}
            className={`h-14 px-6 sm:px-8 text-base sm:text-lg font-bold shrink-0 shadow-xl min-w-[140px] ${selectedPrice ? 'animate-pulse hover:animate-none' : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'}`}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : selectedPrice ? (
              <>
                {t("confirmNow") || "Confirm"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                {t("requestPriceShort") || "Fiyat İste"}
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
