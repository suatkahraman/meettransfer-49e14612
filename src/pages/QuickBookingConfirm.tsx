import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, XCircle, MapPin, Calendar, Clock, Car, Users, DollarSign, RefreshCw, Tag, CheckCircle2, Briefcase, Sparkles, ThumbsUp, Timer, Hourglass, Building2 } from "lucide-react";
import confetti from "canvas-confetti";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrencySymbol } from "@/lib/currency";
import { VEHICLE_TYPE_MAP } from "@/lib/vehicleTypes";
import { VehicleSelectionCard, VehicleBadgeType } from "@/components/VehicleSelectionCard";
import { CompactRouteMap } from "@/components/ui/compact-route-map";
import { CityImageCard } from "@/components/ui/city-image-card";

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
  // Hourly rental fields
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

// Get recommended vehicle based on passenger and luggage count
const getRecommendedVehicle = (passengers: number, luggage: number): string => {
  const maxNeeded = Math.max(passengers, luggage);
  
  if (maxNeeded >= 7) {
    return 'minibus';
  }
  
  if (maxNeeded >= 5) {
    return 'mercedes-vito';
  }
  
  if (maxNeeded >= 4) {
    return 'vip-mercedes';
  }
  
  return 'vip-mercedes';
};

export default function QuickBookingConfirm() {
  const { t, language } = useLanguage();
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
  
  // Elapsed time state for waiting screen
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const ESTIMATED_WAIT_MINUTES = 3;

  const token = searchParams.get("token");
  const isNewRequest = searchParams.get("new") === "true";

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
      
      // For hourly rentals, fetch prices from hourly_rental_prices table
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
          'mercedes-vito': { label: 'Mercedes Vito', passengers: 6, luggage: 6 },
          'vip-mercedes': { label: 'VIP Mercedes', passengers: 5, luggage: 5 },
          'maybach-minibus': { label: 'Maybach Minibus', passengers: 4, luggage: 4 },
          'minibus': { label: 'Mercedes Sprinter', passengers: 16, luggage: 16 },
        };
        
        const { data: hourlyPrices, error: hourlyError } = await supabase
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
      
      // Fallback to fetching from region_prices for transfers
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

  // Get price for selected vehicle
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

  const handleConfirm = async () => {
    if (!booking) {
      console.error("handleConfirm: No booking available");
      toast.error("Booking data not available. Please try again.");
      return;
    }

    setConfirming(true);
    try {
      const selectedPrice = getSelectedPrice();
      const finalVehicle = selectedVehicle || booking.vehicle_type;
      const finalPrice = selectedPrice?.toString() || booking.price?.toString() || "0";

      console.log("Navigating to customer info page:", {
        bookingId: booking.id,
        vehicle: finalVehicle,
        price: finalPrice,
        currency: booking.price_currency,
      });

      // Navigate to customer info page with booking details
      const params = new URLSearchParams();
      params.set("token", booking.confirmation_token);
      params.set("bookingId", booking.id);
      params.set("selectedVehicle", finalVehicle);
      params.set("selectedPrice", finalPrice);
      params.set("currency", booking.price_currency);
      params.set("isDiscounted", isDiscountedOffer ? "true" : "false");

      navigate(`/quick-booking-info?${params.toString()}`);
    } catch (err: any) {
      console.error("Navigation error:", err);
      toast.error(err.message || "Failed to proceed");
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

      // If this is the first rejection, apply auto discount
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
            
            // Multi-burst confetti celebration
            const celebrateDiscount = () => {
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
            
            // Store previous prices for animation
            setPreviousPrice(oldPrice);
            const oldPricesMap: Record<string, number> = {};
            allVehiclePrices.forEach(v => {
              if (v.price) oldPricesMap[v.vehicleType] = v.price;
            });
            setPreviousVehiclePrices(oldPricesMap);
            setDiscountJustApplied(true);
            
            // Update booking state with new price
            const oldReturnPrice = booking.return_price;
            const newReturnPrice = discountResult.new_return_price || oldReturnPrice;
            
            setBooking({ 
              ...booking, 
              price: newPrice,
              return_price: newReturnPrice,
              status: "price_sent",
            });
            
            // Update allVehiclePrices to reflect the discount
            if (allVehiclePrices.length > 0) {
              const isHourlyRental = booking.service_type === 'hourly';
              const discountPercentage = 0.03;
              const absoluteDiscount = (oldPrice || 0) - newPrice;
              
              setAllVehiclePrices(prevPrices => 
                prevPrices.map(v => {
                  if (v.vehicleType === (selectedVehicle || booking.vehicle_type)) {
                    return { ...v, price: newPrice };
                  }
                  if (v.price) {
                    if (isHourlyRental) {
                      const vehicleDiscount = Math.round(v.price * discountPercentage);
                      return { ...v, price: Math.max(v.price - vehicleDiscount, 1) };
                    } else {
                      return { ...v, price: Math.max(v.price - absoluteDiscount, 1) };
                    }
                  }
                  return v;
                })
              );
            }
            
            setIsDiscountedOffer(true);
            setCanReject(false);
            
            // Clear animation after 5 seconds
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

      // Normal rejection flow
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

  // Get vehicle badge
  const getVehicleBadge = (vehicleType: string): VehicleBadgeType | null => {
    if (vehicleType === 'vip-mercedes') return 'popular';
    if (vehicleType === 'maybach-minibus') return 'luxury';
    if (vehicleType === 'minibus') return 'family-friendly';
    return null;
  };

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
              
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_2s_linear_infinite]">
                {t("preparingBestPrice")}
              </h1>
              
              <p className="text-muted-foreground mb-8 text-sm">
                {t("preparingBestPriceDesc")}
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30 dark:from-amber-950/20 dark:via-background dark:to-orange-950/20 p-4">
        <Card className="max-w-lg w-full overflow-hidden shadow-2xl border-amber-200/50 dark:border-amber-800/30">
          <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] p-6 text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBjeD0iMjAiIGN5PSIyMCIgcj0iMyIvPjwvZz48L3N2Zz4=')] opacity-30" />
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
                {t("qbWaitingForPrice") || "Fiyat Hesaplanıyor"}
              </h1>
              <p className="text-white/90 text-sm max-w-xs mx-auto">
                {t("qbWaitingForPriceDesc") || "Rotanız için en iyi fiyatı hesaplıyoruz..."}
              </p>
            </div>
          </div>

          <CardContent className="pt-6 pb-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">{t("qbRequestReceived") || "İstek Alındı"}</span>
              </div>
              <div className="h-0.5 w-8 bg-gradient-to-r from-green-500 to-amber-500" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white animate-pulse">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">{t("qbCalculatingPrice") || "Fiyat Hesaplanıyor"}</span>
              </div>
              <div className="h-0.5 w-8 bg-muted" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">{t("qbReadyToBook") || "Rezervasyona Hazır"}</span>
              </div>
            </div>

            {/* City Image for Hourly Rental */}
            {booking.service_type === 'hourly' && booking.city && (
              <CityImageCard city={booking.city} className="mb-4" />
            )}
            
            {/* Booking Details Card */}
            <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-4 mb-6 space-y-3 border border-border/50">
              {booking.service_type === 'hourly' && (
                <div className="flex justify-center mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                    <Hourglass className="h-3.5 w-3.5" />
                    {t("qbHourlyRental") || "Saatlik Kiralama"}
                  </span>
                </div>
              )}
              
              {booking.service_type === 'hourly' && booking.city ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t("qbCity") || "Şehir"}</p>
                    <p className="font-semibold text-sm truncate">{booking.city}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t("qbPickup")}</p>
                      <p className="font-semibold text-sm truncate">{booking.pickup}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-gradient-to-b from-primary/50 to-accent/50 rounded-full" />
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t("qbDropoff")}</p>
                      <p className="font-semibold text-sm truncate">{booking.dropoff}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="h-px bg-border/50 my-2" />

              <div className={`grid ${booking.service_type === 'hourly' ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">{t("qbDate")}</p>
                  <p className="font-bold text-xs">
                    {format(parseISO(booking.pickup_date), "dd MMM")}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">{t("qbTime")}</p>
                  <p className="font-bold text-xs">{booking.pickup_time}</p>
                </div>
                {booking.service_type === 'hourly' && booking.duration_hours && (
                  <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                    <Hourglass className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">{t("qbDuration") || "Süre"}</p>
                    <p className="font-bold text-xs text-purple-600 dark:text-purple-400">{booking.duration_hours} {t("qbHours") || "Saat"}</p>
                  </div>
                )}
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">{t("qbPassengers")}</p>
                  <p className="font-bold text-xs">{booking.passengers}</p>
                </div>
              </div>
            </div>

            {/* Estimated Wait Time */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    {t("qbEstimatedWaitTime") || "Tahmini Bekleme Süresi"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    / ~{ESTIMATED_WAIT_MINUTES}:00
                  </span>
                </div>
              </div>
              
              <Progress 
                value={Math.min((elapsedSeconds / (ESTIMATED_WAIT_MINUTES * 60)) * 100, 100)} 
                className="h-2"
              />
              
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t("qbEstimatedWaitDesc") || "Genellikle 1-3 dakika içinde yanıt alırsınız"}
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs">{t("qbFreeCancellation") || "Ücretsiz İptal"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs">{t("qbBestPrice") || "En İyi Fiyat"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
        `}</style>
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
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{t("qbYourPriceQuote")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("qbReviewAndConfirm")}
            </p>
          </div>

          {/* Route Map or City Image */}
          {booking.service_type === 'hourly' && booking.city ? (
            <CityImageCard 
              city={booking.city}
              className="mb-4 sm:mb-6"
            />
          ) : (
            <CompactRouteMap 
              pickup={booking.pickup} 
              dropoff={booking.dropoff}
              className="mb-4 sm:mb-6"
            />
          )}

          {/* Transfer Details */}
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 space-y-2 sm:space-y-3">
            {booking.service_type === 'hourly' && (
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                  <Hourglass className="h-3.5 w-3.5" />
                  {t("qbHourlyRental") || "Saatlik Kiralama"}
                </span>
              </div>
            )}
            
            {booking.service_type === 'hourly' && booking.city ? (
              <div className="flex items-start gap-2 sm:gap-3">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("qbCity") || "Şehir"}</p>
                  <p className="font-medium text-sm sm:text-base">{booking.city}</p>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}

            <div className={`grid ${booking.service_type === 'hourly' ? 'grid-cols-4' : 'grid-cols-3'} gap-2 sm:gap-4 mt-3 sm:mt-4`}>
              <div className="text-center">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t("qbDate")}</p>
                <p className="font-bold text-xs sm:text-sm">
                  {format(parseISO(booking.pickup_date), "dd/MM")}
                </p>
              </div>
              <div className="text-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t("qbTime")}</p>
                <p className="font-bold text-xs sm:text-sm">{booking.pickup_time}</p>
              </div>
              {booking.service_type === 'hourly' && booking.duration_hours && (
                <div className="text-center">
                  <Hourglass className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t("qbDuration") || "Süre"}</p>
                  <p className="font-bold text-xs sm:text-sm text-purple-600 dark:text-purple-400">{booking.duration_hours}h</p>
                </div>
              )}
              <div className="text-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t("qbPassengers")}</p>
                <p className="font-bold text-xs sm:text-sm">{booking.passengers}</p>
              </div>
            </div>

            {(booking.luggage_count || booking.baby_seat_count) && (
              <div className="flex gap-4 mt-3 pt-3 border-t border-border/50">
                {booking.luggage_count && booking.luggage_count > 0 && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{booking.luggage_count} {t("qbLuggage")}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vehicle Selection */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base">{t("qbSelectVehicle")}</h3>
            </div>
            
            {loadingPrices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allVehiclePrices.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {(() => {
                  const recommendedType = getRecommendedVehicle(
                    booking.passengers, 
                    booking.luggage_count || 0
                  );
                  
                  return allVehiclePrices.map((vehicle, index) => {
                    const isSelected = (selectedVehicle || booking.vehicle_type) === vehicle.vehicleType;
                    const isRecommended = vehicle.vehicleType === recommendedType;
                    const badgeAnimationDelay = index * 100;
                    
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
                        badgeAnimationDelay={badgeAnimationDelay}
                      />
                    );
                  });
                })()}
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
              ? 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 dark:from-green-900/40 dark:via-emerald-900/30 dark:to-teal-900/40 ring-2 ring-green-500 shadow-lg shadow-green-500/20' 
              : 'bg-primary/10'
          }`}>
            {discountJustApplied && (
              <div className="absolute -top-1 -right-1 z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-md opacity-75 animate-pulse" />
                  <div 
                    className="relative flex items-center gap-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg"
                    style={{ animation: 'discountBadgePop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards' }}
                  >
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ animation: 'sparkle 1s ease-in-out infinite' }} />
                    <span className="font-bold text-xs sm:text-sm whitespace-nowrap">
                      {t("discounted") || "İndirimli!"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{t("qbYourTransferPrice")}</p>
            {discountJustApplied && previousPrice && (
              <div className="mb-2 sm:mb-3 flex items-center justify-center gap-2 flex-wrap">
                <span 
                  className="text-lg sm:text-xl line-through text-muted-foreground"
                  style={{ animation: 'strikeThrough 0.5s ease-out forwards' }}
                >
                  {currencySymbol}{previousPrice}
                </span>
                <span 
                  className="inline-flex items-center gap-1 text-xs sm:text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 sm:px-3 py-1 rounded-full shadow-md"
                  style={{ animation: 'savingsBadge 0.5s ease-out 0.3s both' }}
                >
                  <Tag className="h-3 w-3" />
                  -{currencySymbol}{previousPrice - (selectedPrice || 0)} {t("savings") || "Tasarruf"}
                </span>
              </div>
            )}
            <p 
              className={`text-3xl sm:text-4xl font-bold transition-all duration-300 ${
                discountJustApplied ? 'text-green-600 dark:text-green-400' : 'text-primary'
              }`}
              style={discountJustApplied ? { animation: 'priceReveal 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards' } : {}}
            >
              {currencySymbol}{selectedPrice}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
              {booking.price_currency}
            </p>
            {discountJustApplied && (
              <div 
                className="mt-3 inline-flex items-center gap-2 bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full"
                style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-medium">
                  {t("specialDiscountApplied") || "Sizin için özel indirim uygulandı!"}
                </span>
              </div>
            )}
          </div>

          {/* Discounted Offer Badge */}
          {isDiscountedOffer && !discountJustApplied && (
            <div className="bg-green-50 dark:bg-green-950/30 p-2.5 sm:p-3 rounded-lg border border-green-200 dark:border-green-800 mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                  {t("specialDiscountApplied") || "İndirimli fiyat uygulandı!"}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canReject ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
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
                    <span className="text-sm sm:text-base font-semibold">{t("qbContinue") || "Devam Et"}</span>
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
                  <span className="text-base sm:text-lg font-semibold">{t("qbContinue") || "Devam Et"}</span>
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
      
      <style>{`
        @keyframes discountBadgePop {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.3) rotate(180deg); opacity: 0.7; }
        }
        @keyframes strikeThrough {
          0% { text-decoration-color: transparent; }
          100% { text-decoration-color: currentColor; }
        }
        @keyframes savingsBadge {
          0% { transform: translateX(-10px) scale(0.8); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes priceReveal {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
