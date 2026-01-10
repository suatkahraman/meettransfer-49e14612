import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, XCircle, MapPin, Calendar, Clock, Car, Users, DollarSign, RefreshCw, ArrowLeftRight, Tag, CheckCircle2, CreditCard, Banknote, Briefcase, Sparkles, ThumbsUp } from "lucide-react";
import confetti from "canvas-confetti";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrencySymbol } from "@/lib/currency";
import { VEHICLE_TYPE_MAP } from "@/lib/vehicleTypes";
import { VehicleSelectionCard } from "@/components/VehicleSelectionCard";

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
  all_vehicle_prices?: Record<string, number> | null; // Admin's manual prices for all vehicles
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

const VALID_PROMO_CODE = "Meet40Return";


// Get recommended vehicle based on passenger and luggage count
const getRecommendedVehicle = (passengers: number, luggage: number): string => {
  const maxNeeded = Math.max(passengers, luggage);
  
  // For 7+ passengers/luggage, recommend minibus
  if (maxNeeded >= 7) {
    return 'minibus';
  }
  
  // For 5-6 passengers/luggage, recommend Mercedes Vito
  if (maxNeeded >= 5) {
    return 'mercedes-vito';
  }
  
  // For 4 passengers/luggage, recommend VIP Mercedes (best value)
  if (maxNeeded >= 4) {
    return 'vip-mercedes';
  }
  
  // For 1-3 passengers/luggage, recommend VIP Mercedes for comfort
  return 'vip-mercedes';
};

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
  const isNewRequest = searchParams.get("new") === "true"; // Flag for showing animation on initial load
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

  // Pre-fill from database if available
  useEffect(() => {
    if (booking) {
      if (booking.has_return_trip && booking.return_date && booking.return_time) {
        setHasReturnTrip(true);
        setReturnTripData({
          date: booking.return_date,
          time: booking.return_time,
        });
      }
      if (booking.promo_code) {
        setPromoCode(booking.promo_code);
        if (booking.promo_code.toLowerCase() === VALID_PROMO_CODE.toLowerCase()) {
          setIsPromoCodeValid(true);
        }
      }
      // Set initial selected vehicle
      if (!selectedVehicle) {
        setSelectedVehicle(booking.vehicle_type);
      }
    }
  }, [booking, selectedVehicle]);

  // Show preparing animation on initial load for new requests
  useEffect(() => {
    if (isNewRequest && token) {
      setShowPriceAnimation(true);
      const timer = setTimeout(() => {
        setShowPriceAnimation(false);
      }, 5000); // Show for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isNewRequest, token]);

  useEffect(() => {
    if (token) {
      // If it's a new request, delay fetching to show animation first
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
            // Show preparing animation for 3 seconds before revealing price
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
        return;
      }

      if (data.status !== "price_sent") {
        setError("Unable to process this booking request.");
        return;
      }

      setBooking(data as BookingRequest);
      
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
        console.log(`Quick booking - Has auto discount: ${hasAutoDiscount}, Can reject: ${!hasAutoDiscount}`);
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
      // First check if admin set manual prices for all vehicles
      if (booking.all_vehicle_prices && Object.keys(booking.all_vehicle_prices).length > 0) {
        console.log("Using admin's manual vehicle prices:", booking.all_vehicle_prices);
        
        // Convert admin's manual prices to VehiclePriceInfo format
        const VEHICLE_CONFIG: Record<string, { label: string; passengers: number; luggage: number }> = {
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
      
      // Fallback to fetching from region_prices
      const { data, error } = await supabase.functions.invoke("get-all-vehicle-prices", {
        body: {
          pickup: booking.pickup,
          dropoff: booking.dropoff,
          customerCurrency: booking.price_currency,
        },
      });

      if (error) throw error;

      if (data?.prices) {
        // Show all vehicles to the guest - no filtering
        setAllVehiclePrices(data.prices as VehiclePriceInfo[]);
      }
    } catch (err) {
      console.error("Failed to fetch vehicle prices:", err);
      // Don't show error - just use the original price
    } finally {
      setLoadingPrices(false);
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

  // Get price for selected vehicle
  const getSelectedPrice = (): number | null => {
    if (!booking?.price) return null;
    
    // If we have all vehicle prices and a different vehicle is selected
    if (allVehiclePrices.length > 0 && selectedVehicle) {
      const selectedPriceInfo = allVehiclePrices.find(v => v.vehicleType === selectedVehicle);
      if (selectedPriceInfo?.price) {
        return selectedPriceInfo.price;
      }
    }
    
    // Default to booking's original price
    return booking.price;
  };

  // Calculate return price
  const getReturnPrice = () => {
    if (!hasReturnTrip) return null;
    const price = getSelectedPrice();
    if (!price) return null;
    
    // Check if admin set a specific return price
    if (booking?.return_price != null && selectedVehicle === booking.vehicle_type) {
      if (isPromoCodeValid) {
        return Math.round(booking.return_price * 0.7);
      }
      return booking.return_price;
    }
    
    // Calculate based on selected vehicle price
    if (isPromoCodeValid) {
      return Math.round(price * 0.7);
    }
    return price;
  };

  const getOriginalReturnPrice = () => {
    if (!hasReturnTrip) return null;
    const price = getSelectedPrice();
    if (!price) return null;
    
    if (booking?.return_price != null && selectedVehicle === booking.vehicle_type) {
      return booking.return_price;
    }
    
    return price;
  };

  const getTotalPrice = () => {
    const price = getSelectedPrice();
    if (!price) return null;
    const returnPrice = getReturnPrice();
    return price + (returnPrice || 0);
  };

  const getDiscountAmount = () => {
    if (!hasReturnTrip || !isPromoCodeValid) return null;
    const originalReturn = getOriginalReturnPrice();
    const discountedReturn = getReturnPrice();
    if (originalReturn && discountedReturn) {
      return originalReturn - discountedReturn;
    }
    return null;
  };

  // Use centralized getCurrencySymbol from @/lib/currency - imported at top

  const handleConfirm = async () => {
    if (!booking) return;

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
      const selectedPrice = getSelectedPrice();
      const returnPrice = getReturnPrice();

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "create-quick-booking-reservation",
        {
          body: {
            bookingId: booking.id,
            pickup: booking.pickup,
            dropoff: booking.dropoff,
            pickupDate: booking.pickup_date,
            pickupTime: booking.pickup_time,
            vehicleType: selectedVehicle || booking.vehicle_type,
            passengers: booking.passengers,
            price: selectedPrice,
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

      // Record price acceptance
      if (selectedPrice) {
        try {
          await supabase.from("price_history").insert({
            quick_booking_id: booking.id,
            price: selectedPrice,
            price_currency: booking.price_currency,
            action: "accepted",
          });
        } catch (e) {
          console.error("Failed to record price history:", e);
        }
      }

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
      // Record the rejection in price history first
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

      // If this is the first rejection, apply auto discount instead of waiting
      if (canReject && !isDiscountedOffer) {
        try {
          const { data: discountResult, error: discountError } = await supabase.functions.invoke("apply-auto-discount", {
            body: { quick_booking_id: booking.id }
          });

          if (discountError) {
            console.error("Auto discount error:", discountError);
            throw discountError;
          }

          if (discountResult?.success) {
            const currencySymbol = getCurrencySymbol(discountResult.currency);
            const oldPrice = booking.price;
            const newPrice = discountResult.new_price;
            
            // Multi-burst confetti celebration for discount!
            const celebrateDiscount = () => {
              // First burst - center
              confetti({
                particleCount: 80,
                spread: 100,
                origin: { y: 0.5, x: 0.5 },
                colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b']
              });
              
              // Left burst
              setTimeout(() => {
                confetti({
                  particleCount: 50,
                  angle: 60,
                  spread: 55,
                  origin: { x: 0, y: 0.6 },
                  colors: ['#22c55e', '#16a34a', '#fbbf24']
                });
              }, 150);
              
              // Right burst
              setTimeout(() => {
                confetti({
                  particleCount: 50,
                  angle: 120,
                  spread: 55,
                  origin: { x: 1, y: 0.6 },
                  colors: ['#22c55e', '#16a34a', '#fbbf24']
                });
              }, 300);
              
              // Star shower from top
              setTimeout(() => {
                confetti({
                  particleCount: 30,
                  spread: 180,
                  origin: { y: 0, x: 0.5 },
                  gravity: 0.8,
                  shapes: ['star'],
                  colors: ['#fbbf24', '#f59e0b', '#22c55e']
                });
              }, 450);
            };
            
            celebrateDiscount();
            
            toast.success(
              t("autoDiscountApplied") || 
              `🎉 Fiyat indirildi! Yeni fiyat: ${currencySymbol}${newPrice}`,
              {
                duration: 5000,
              }
            );
            
            // Store previous prices for animation (including all vehicles)
            setPreviousPrice(oldPrice);
            const oldPricesMap: Record<string, number> = {};
            allVehiclePrices.forEach(v => {
              if (v.price) oldPricesMap[v.vehicleType] = v.price;
            });
            setPreviousVehiclePrices(oldPricesMap);
            setDiscountJustApplied(true);
            
            // Update booking state with new price
            setBooking({ 
              ...booking, 
              price: newPrice,
              status: "price_sent",
            });
            
            // Update allVehiclePrices to reflect the discount on selected vehicle
            if (allVehiclePrices.length > 0) {
              const discountAmount = (oldPrice || 0) - newPrice;
              setAllVehiclePrices(prevPrices => 
                prevPrices.map(v => {
                  if (v.vehicleType === (selectedVehicle || booking.vehicle_type)) {
                    return { ...v, price: newPrice };
                  }
                  // Apply proportional discount to other vehicles
                  if (v.price) {
                    return { ...v, price: Math.max(v.price - discountAmount, 0) };
                  }
                  return v;
                })
              );
            }
            
            setIsDiscountedOffer(true);
            setCanReject(false);
            
            // Clear animation after 5 seconds (longer for better celebration)
            setTimeout(() => {
              setDiscountJustApplied(false);
              setPreviousPrice(null);
              setPreviousVehiclePrices({});
            }, 5000);
            
            return; // Don't proceed to waiting state
          }
        } catch (e) {
          console.error("Failed to apply auto discount:", e);
          // If auto discount fails, proceed with normal rejection flow
        }
      }

      // Normal rejection flow - set to waiting state
      const { error } = await supabase
        .from("quick_booking_requests")
        .update({
          status: "price_rejected",
        })
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

  // Preparing Best Price Animation - MUST be checked first before loading
  if (showPriceAnimation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 p-4 overflow-hidden">
        {/* Animated background particles */}
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
          {/* Animated gradient border effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl opacity-75 blur-sm animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl opacity-20" />
          
          <CardContent className="pt-10 pb-10 relative bg-background/95 backdrop-blur-sm rounded-xl m-0.5">
            <div className="text-center">
              {/* Premium animated icon */}
              <div className="relative mx-auto mb-8 w-28 h-28">
                {/* Outer glow */}
                <div className="absolute -inset-4 bg-green-400/20 rounded-full blur-xl animate-pulse" />
                {/* Rotating outer ring */}
                <div 
                  className="absolute inset-0 rounded-full border-4 border-dashed border-green-300 dark:border-green-700"
                  style={{ animation: 'spin 8s linear infinite' }}
                />
                {/* Counter-rotating middle ring */}
                <div 
                  className="absolute inset-2 rounded-full border-2 border-emerald-400 dark:border-emerald-600"
                  style={{ animation: 'spin 4s linear infinite reverse' }}
                />
                {/* Pulsing gradient fill */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 animate-pulse shadow-lg" />
                {/* Center icon */}
                <div className="absolute inset-6 rounded-full bg-background flex items-center justify-center shadow-inner">
                  <Sparkles className="h-10 w-10 text-emerald-500" style={{ animation: 'bounce 1s ease-in-out infinite' }} />
                </div>
              </div>
              
              {/* Main title with shimmer effect */}
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_2s_linear_infinite]">
                {t("preparingBestPrice")}
              </h1>
              
              {/* Subtitle */}
              <p className="text-muted-foreground mb-8 text-sm">
                {t("preparingBestPriceDesc")}
              </p>
              
              {/* Progress bar animation */}
              <div className="w-full max-w-xs mx-auto mb-6">
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full"
                    style={{
                      animation: 'progressSlide 5s ease-out forwards'
                    }}
                  />
                </div>
              </div>
              
              {/* Feature badges with stagger animation */}
              <div className="flex flex-wrap justify-center gap-2">
                <span 
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-medium shadow-sm"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t("bestPriceGuarantee")}
                </span>
                <span 
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium shadow-sm"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {t("noHiddenFees")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Custom keyframes */}
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes progressSlide {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
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
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{t("qbWaitingForPrice")}</h1>
              <p className="text-muted-foreground">
                {t("qbWaitingForPriceDesc")}
              </p>
            </div>

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
            </div>

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
          </CardContent>
        </Card>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(booking.price_currency);
  const selectedPrice = getSelectedPrice();
  const selectedVehicleInfo = VEHICLE_TYPE_MAP[selectedVehicle || booking.vehicle_type];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-3 sm:p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          {/* Header - Mobile Optimized */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{t("qbYourPriceQuote")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("qbReviewAndConfirm")}
            </p>
          </div>

          {/* Transfer Details - Mobile Optimized */}
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("qbPickup")}</p>
                <p className="font-medium text-sm sm:text-base truncate">{booking.pickup}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("qbDropoff")}</p>
                <p className="font-medium text-sm sm:text-base truncate">{booking.dropoff}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">{t("qbDate")}</p>
                  <p className="font-medium text-xs sm:text-base">
                    {format(parseISO(booking.pickup_date), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">{t("qbTime")}</p>
                  <p className="font-medium text-xs sm:text-base">{booking.pickup_time}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">{t("qbPassengers")}</p>
                <p className="font-medium text-xs sm:text-base">{booking.passengers}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Selection - Mobile Optimized */}
          <div className="mb-4 sm:mb-6">
            <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Car className="h-4 w-4 sm:h-5 sm:w-5" />
              {t("qbSelectVehicle") || "Select Your Vehicle"}
            </h3>
            
            {loadingPrices ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : allVehiclePrices.length > 0 ? (
              <div className="grid gap-2 sm:gap-4">
                {allVehiclePrices.map((vehicle) => {
                  const isSelected = (selectedVehicle || booking.vehicle_type) === vehicle.vehicleType;
                  const recommendedVehicle = getRecommendedVehicle(booking.passengers, booking.luggage_count || 0);
                  const isRecommended = vehicle.vehicleType === recommendedVehicle && vehicle.available;
                  
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
                    />
                  );
                })}
              </div>
            ) : (
              /* Fallback: show only the booked vehicle */
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

          {/* Return Trip Option - Mobile Optimized */}
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <Checkbox
                id="returnTrip"
                checked={hasReturnTrip}
                onCheckedChange={(checked) => setHasReturnTrip(checked === true)}
              />
              <Label htmlFor="returnTrip" className="flex items-center gap-1.5 sm:gap-2 cursor-pointer font-medium text-sm sm:text-base">
                <ArrowLeftRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                {t("qbAddReturnTransfer")}
              </Label>
            </div>

            {hasReturnTrip && (
              <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 pl-3 sm:pl-6 border-l-2 border-primary/30">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="returnDate" className="text-xs sm:text-sm">{t("qbReturnDate")}</Label>
                    <Input
                      id="returnDate"
                      type="date"
                      value={returnTripData.date}
                      onChange={(e) => setReturnTripData(prev => ({ ...prev, date: e.target.value }))}
                      min={booking.pickup_date}
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="returnTime" className="text-xs sm:text-sm">{t("qbReturnTime")}</Label>
                    <Input
                      id="returnTime"
                      type="time"
                      value={returnTripData.time}
                      onChange={(e) => setReturnTripData(prev => ({ ...prev, time: e.target.value }))}
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Promo Code */}
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="promoCode" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {t("qbPromoCodeLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="promoCode"
                      placeholder={t("qbEnterPromoCode")}
                      value={promoCode}
                      onChange={(e) => handlePromoCodeChange(e.target.value)}
                      className={`pr-10 h-9 sm:h-10 text-sm ${
                        isPromoCodeValid === true ? "border-green-500 focus:ring-green-500" :
                        isPromoCodeValid === false ? "border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                    {isPromoCodeValid === true && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    )}
                    {isPromoCodeValid === false && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                    )}
                  </div>
                  {isPromoCodeValid === true && (
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {t("qbDiscountApplied")}
                    </p>
                  )}
                </div>

                <div className="bg-primary/5 rounded p-2 sm:p-3 text-xs sm:text-sm">
                  <p className="text-muted-foreground">
                    <strong>{t("qbReturnRoute")}:</strong> {booking.dropoff} → {booking.pickup}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Price Display - Mobile Optimized */}
          <div className={`rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-center transition-all duration-500 ${
            discountJustApplied 
              ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500 animate-pulse' 
              : 'bg-primary/10'
          }`}>
            {!hasReturnTrip ? (
              <>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{t("qbYourTransferPrice")}</p>
                {discountJustApplied && previousPrice && (
                  <div className="mb-1 sm:mb-2">
                    <span className="text-lg sm:text-xl line-through text-muted-foreground">
                      {currencySymbol}{previousPrice}
                    </span>
                    <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full animate-bounce inline-block">
                      -€3 {t("discount") || "İndirim"}!
                    </span>
                  </div>
                )}
                <p className={`text-3xl sm:text-4xl font-bold transition-all duration-300 ${
                  discountJustApplied ? 'text-green-600 dark:text-green-400 scale-110' : 'text-primary'
                }`}>
                  {currencySymbol}{selectedPrice}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                  {booking.price_currency}
                </p>
                {discountJustApplied && (
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1 sm:mt-2 font-medium">
                    ✨ {t("specialDiscountApplied") || "Sizin için özel indirim uygulandı!"}
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span>{t("qbOutboundTransfer")}</span>
                  <span className="font-medium">
                    {currencySymbol}{selectedPrice}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="flex items-center gap-1 sm:gap-2">
                    {t("qbReturnTransfer")}
                    {isPromoCodeValid && (
                      <span className="text-[10px] sm:text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 sm:px-2 py-0.5 rounded-full">
                        30% OFF
                      </span>
                    )}
                  </span>
                  <span className="font-medium">
                    {isPromoCodeValid && getOriginalReturnPrice() && (
                      <span className="line-through text-muted-foreground mr-1 sm:mr-2 text-xs">
                        {currencySymbol}{getOriginalReturnPrice()}
                      </span>
                    )}
                    {currencySymbol}{getReturnPrice()?.toFixed(0)}
                  </span>
                </div>
                {isPromoCodeValid && getDiscountAmount() && (
                  <div className="flex justify-between items-center text-xs sm:text-sm text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1 sm:gap-2">
                      <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">{t("qbDiscountWithCode")}</span>
                      <span className="xs:hidden">Promo</span>
                    </span>
                    <span className="font-medium">
                      -{currencySymbol}{getDiscountAmount()?.toFixed(0)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 sm:pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm sm:text-base">{t("qbTotal")}</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      {currencySymbol}{getTotalPrice()?.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method - Mobile Optimized */}
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <Label className="text-sm sm:text-base font-medium mb-3 sm:mb-4 block">{t("qbPaymentMethod")}</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as "cash" | "payment_link")}
              className="space-y-2 sm:space-y-3"
            >
              <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-1">
                  <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base">{t("qbPayCashToDriver")}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("qbPayCashDesc")}</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="payment_link" id="payment_link" />
                <Label htmlFor="payment_link" className="flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base">{t("qbPayOnline")}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("qbPayOnlineDesc")}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Discounted Offer Badge - Mobile Optimized */}
          {isDiscountedOffer && (
            <div className="bg-green-50 dark:bg-green-950/30 p-2.5 sm:p-3 rounded-lg border border-green-200 dark:border-green-800 mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                  {t("specialDiscountApplied") || "İndirimli fiyat uygulandı!"}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons - Mobile Optimized */}
          {canReject ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {/* Reject Button - Better Price Request */}
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={rejecting || confirming}
                  className="h-auto min-h-[52px] sm:min-h-[60px] flex-col py-2 sm:py-3 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 dark:border-orange-800 dark:hover:border-orange-600 dark:hover:bg-orange-950/30 transition-all"
                >
                  <div className="flex items-center text-orange-600 dark:text-orange-400">
                    {rejecting ? (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-1.5 sm:mr-2" />
                    ) : (
                      <Tag className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                    )}
                    <span className="text-sm sm:text-base font-semibold">
                      {t("qbRejectForBetterPrice") || "Better Price?"}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight text-center px-1">
                    {t("rejectButtonHint") || "Request a better offer"}
                  </span>
                </Button>

                {/* Confirm Button - Enhanced Green Style */}
                <Button
                  onClick={handleConfirm}
                  disabled={confirming || rejecting}
                  className="h-auto min-h-[52px] sm:min-h-[60px] flex-col py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-2 border-green-400 shadow-lg shadow-green-500/25 transition-all hover:shadow-xl hover:shadow-green-500/30"
                >
                  <div className="flex items-center">
                    {confirming ? (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-1.5 sm:mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                    )}
                    <span className="text-sm sm:text-base font-semibold">{t("qbConfirmBooking")}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-white/80 mt-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {t("confirmButtonHint") || "Secure your ride now"}
                  </span>
                </Button>
              </div>
              <p className="text-center text-[10px] sm:text-xs text-muted-foreground bg-muted/50 rounded-lg py-2 px-3">
                💡 {t("rejectExplanation") || "Not happy with the price? Tap 'Better Price?' to request a special offer!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              <Button
                onClick={handleConfirm}
                disabled={confirming || rejecting}
                className="w-full h-auto min-h-[56px] sm:min-h-[64px] flex-col py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-2 border-green-400 shadow-lg shadow-green-500/25 transition-all hover:shadow-xl hover:shadow-green-500/30"
                size="lg"
              >
                <div className="flex items-center">
                  {confirming ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  )}
                  <span className="text-base sm:text-lg font-semibold">{t("qbConfirmBooking")}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-white/80 mt-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {t("confirmFinalOffer") || "Exclusive discounted price"}
                </span>
              </Button>
              <p className="text-center text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 rounded-lg py-2 px-3 border border-emerald-200 dark:border-emerald-800">
                🎉 {t("finalOfferMessage") || "This is your exclusive discounted final offer!"}
              </p>
            </div>
          )}

          <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-3 sm:mt-4">
            {t("qbByConfirming")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
