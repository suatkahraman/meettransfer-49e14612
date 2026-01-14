import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, isToday, isTomorrow, isThisWeek } from "date-fns";
import { tr } from "date-fns/locale";
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  Users,
  DollarSign,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  CreditCard,
  Link as LinkIcon,
  Edit,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Phone,
  Mail,
  MailCheck,
  Search,
  Filter,
  Building2,
  ChevronRight,
  Eye,
  Briefcase,
  Baby,
  UserCheck,
  UserX,
  Sparkles,
  Wand2,
  Bot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PriceHistoryCard from "@/components/admin/PriceHistoryCard";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";
import { validateAllVehiclePrices, validatePrice, hasAnyLowPrice, getLowPriceWarnings } from "@/lib/priceValidation";
import { usePriceThresholds } from "@/hooks/usePriceThresholds";

interface QuickBookingRequest {
  id: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  vehicle_type: string;
  passengers: number;
  luggage_count: number | null;
  baby_seat_count: number | null;
  status: string;
  price: number | null;
  price_currency: string;
  admin_message: string | null;
  customer_session_id: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  confirmation_token: string;
  created_at: string;
  confirmed_at: string | null;
  expires_at: string;
  payment_method: string | null;
  payment_link: string | null;
  customer_notes: string | null;
  agency_id: string | null;
  agency_user_id: string | null;
  agency?: { agency_name: string } | null;
  // Return trip fields
  has_return_trip: boolean | null;
  return_date: string | null;
  return_time: string | null;
  return_price: number | null;
  promo_code: string | null;
  // AI assistant tracking
  created_via_ai: boolean | null;
}

// Interface for linked reservation customer status
interface LinkedReservationInfo {
  reservation_id: string;
  reservation_code: string;
  customer_id: string | null;
  customer_name: string;
  status: string;
}

const vehicleLabels: Record<string, string> = {
  "mercedes-vito": "Mercedes-vito",
  "vip-mercedes": "Vip Mercedes",
  "maybach-minibus": "Maybach Minibus",
  minibus: "Minibus",
  // Legacy support
  "mercedes-vclass": "VIP Vito",
  maybach: "Maybach",
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: any }> = {
  pending: { color: "text-yellow-700", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", label: "Bekliyor", icon: Clock },
  price_sent: { color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900/30", label: "Fiyat Gönderildi", icon: Send },
  price_rejected: { color: "text-orange-700", bgColor: "bg-orange-100 dark:bg-orange-900/30", label: "Fiyat Reddedildi", icon: XCircle },
  confirmed: { color: "text-green-700", bgColor: "bg-green-100 dark:bg-green-900/30", label: "Onaylandı", icon: CheckCircle },
  rejected: { color: "text-red-700", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Reddedildi", icon: XCircle },
  expired: { color: "text-gray-700", bgColor: "bg-gray-100 dark:bg-gray-900/30", label: "Süresi Doldu", icon: Clock },
};

type TabValue = "all" | "pending" | "price_sent" | "confirmed" | "other";

export default function AdminQuickBookings() {
  const navigate = useNavigate();
  const { thresholdsMap } = usePriceThresholds();
  const [requests, setRequests] = useState<QuickBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<QuickBookingRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [returnPrice, setReturnPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [paymentLink, setPaymentLink] = useState("");
  const [sendingPrice, setSendingPrice] = useState(false);
  const [sendingPaymentLink, setSendingPaymentLink] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; request: QuickBookingRequest | null }>({
    open: false,
    request: null,
  });
  const [deleting, setDeleting] = useState(false);
  
  // Return trip discount percentage (fetched from promo_codes)
  const [returnDiscountPercent, setReturnDiscountPercent] = useState(30);
  
  // AI Price Suggestion state
  const [suggestingPrice, setSuggestingPrice] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    prices: Record<string, number>;
    reasoning: string;
  } | null>(null);
  
  // Multi-vehicle pricing state
  const [allVehiclePrices, setAllVehiclePrices] = useState<Record<string, string>>({
    "mercedes-vito": "",
    "vip-mercedes": "",
    "maybach-minibus": "",
    "minibus": "",
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  
  // Linked reservation info (customer account status)
  const [linkedReservations, setLinkedReservations] = useState<Record<string, LinkedReservationInfo>>({});

  useEffect(() => {
    fetchRequests();
    // Fetch active return trip discount percentage
    const fetchDiscount = async () => {
      const { data } = await supabase
        .from('promo_codes')
        .select('discount_percentage')
        .eq('is_active', true)
        .eq('applies_to', 'return_transfer')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.discount_percentage) {
        setReturnDiscountPercent(data.discount_percentage);
      }
    };
    fetchDiscount();

    const channel = supabase
      .channel("quick-booking-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quick_booking_requests" },
        () => {
          fetchRequests();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reservations" },
        (payload) => {
          // When a reservation is updated (e.g., customer_id is set), refresh linked reservations
          if (payload.new && (payload.new as any).customer_id !== (payload.old as any)?.customer_id) {
            fetchRequests();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("quick_booking_requests")
        .select(`
          *,
          agency:agency_id (agency_name)
        `)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data as QuickBookingRequest[]) || []);
      
      // For confirmed requests, fetch linked reservation customer status
      const confirmedRequests = (data as QuickBookingRequest[])?.filter(r => r.status === "confirmed") || [];
      if (confirmedRequests.length > 0) {
        fetchLinkedReservations(confirmedRequests);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to fetch booking requests");
    } finally {
      setLoading(false);
    }
  };

  // Fetch linked reservations to check customer account status
  const fetchLinkedReservations = async (confirmedRequests: QuickBookingRequest[]) => {
    try {
      // Build conditions for each confirmed request
      const orConditions = confirmedRequests.map(r => 
        `and(pickup.eq.${encodeURIComponent(r.pickup)},dropoff.eq.${encodeURIComponent(r.dropoff)},pickup_date.eq.${r.pickup_date},pickup_time.eq.${r.pickup_time})`
      ).join(',');
      
      // Query reservations that match the confirmed quick bookings
      const linkedMap: Record<string, LinkedReservationInfo> = {};
      
      for (const req of confirmedRequests) {
        const { data: reservations } = await supabase
          .from("reservations")
          .select("id, reservation_code, customer_id, customer_name, status")
          .eq("pickup", req.pickup)
          .eq("dropoff", req.dropoff)
          .eq("pickup_date", req.pickup_date)
          .eq("pickup_time", req.pickup_time)
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (reservations && reservations.length > 0) {
          linkedMap[req.id] = {
            reservation_id: reservations[0].id,
            reservation_code: reservations[0].reservation_code || '',
            customer_id: reservations[0].customer_id,
            customer_name: reservations[0].customer_name,
            status: reservations[0].status,
          };
        }
      }
      
      setLinkedReservations(linkedMap);
    } catch (error) {
      console.error("Error fetching linked reservations:", error);
    }
  };

  // Filtered requests based on search and tab
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.pickup.toLowerCase().includes(query) ||
        r.dropoff.toLowerCase().includes(query) ||
        r.customer_name?.toLowerCase().includes(query) ||
        r.customer_phone?.includes(query) ||
        r.customer_email?.toLowerCase().includes(query)
      );
    }

    // Tab filter
    if (activeTab !== "all") {
      if (activeTab === "other") {
        filtered = filtered.filter(r => ["price_rejected", "rejected", "expired"].includes(r.status));
      } else {
        filtered = filtered.filter(r => r.status === activeTab);
      }
    }

    return filtered;
  }, [requests, searchQuery, activeTab]);

  // Stats for tabs
  const stats = useMemo(() => ({
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    price_sent: requests.filter(r => r.status === "price_sent").length,
    confirmed: requests.filter(r => r.status === "confirmed").length,
    other: requests.filter(r => ["price_rejected", "rejected", "expired"].includes(r.status)).length,
  }), [requests]);

  // AI Price Suggestion function
  const suggestPriceWithAI = async () => {
    if (!selectedRequest) return;
    
    setSuggestingPrice(true);
    setAiSuggestion(null);
    
    try {
      // Fetch similar routes from region_prices
      const { data: regionPrices } = await supabase
        .from('region_prices')
        .select('city, district, airport, price, price_currency, vehicle_type')
        .eq('is_active', true)
        .limit(100);
      
      // Find matching or similar routes
      const pickupLower = selectedRequest.pickup.toLowerCase();
      const dropoffLower = selectedRequest.dropoff.toLowerCase();
      
      // Try to find exact match
      let matchedPrices: Record<string, number> = {};
      let reasoning = '';
      
      if (regionPrices) {
        // Check for airport-related keywords
        const isAirportPickup = pickupLower.includes('airport') || pickupLower.includes('havalimanı') || 
                               pickupLower.includes('havalanı') || pickupLower.match(/(ist|saw|ayt|bjv|dlm|adb|dxb|lca|ecn)/i);
        const isAirportDropoff = dropoffLower.includes('airport') || dropoffLower.includes('havalimanı') || 
                                dropoffLower.includes('havalanı') || dropoffLower.match(/(ist|saw|ayt|bjv|dlm|adb|dxb|lca|ecn)/i);
        
        // Find relevant prices
        const relevantPrices = regionPrices.filter(p => {
          const cityMatch = pickupLower.includes(p.city.toLowerCase()) || dropoffLower.includes(p.city.toLowerCase());
          const districtMatch = pickupLower.includes(p.district.toLowerCase()) || dropoffLower.includes(p.district.toLowerCase());
          const airportMatch = p.airport && (pickupLower.includes(p.airport.toLowerCase()) || dropoffLower.includes(p.airport.toLowerCase()));
          return cityMatch || districtMatch || airportMatch;
        });
        
        if (relevantPrices.length > 0) {
          // Group by vehicle type and calculate average
          const pricesByVehicle: Record<string, number[]> = {};
          relevantPrices.forEach(p => {
            if (!pricesByVehicle[p.vehicle_type]) {
              pricesByVehicle[p.vehicle_type] = [];
            }
            pricesByVehicle[p.vehicle_type].push(p.price);
          });
          
          // Calculate suggested prices
          Object.entries(pricesByVehicle).forEach(([vehicle, prices]) => {
            const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            matchedPrices[vehicle] = avg;
          });
          
          reasoning = `Benzer ${relevantPrices.length} güzergah bulundu. Ortalama fiyatlar hesaplandı.`;
        } else {
          // No exact match, estimate based on distance/complexity
          // Default estimates for unknown routes
          matchedPrices = {
            "mercedes-vito": currency === "EUR" ? 85 : currency === "USD" ? 95 : currency === "TRY" ? 4500 : 85,
            "vip-mercedes": currency === "EUR" ? 120 : currency === "USD" ? 135 : currency === "TRY" ? 6500 : 120,
            "maybach-minibus": currency === "EUR" ? 180 : currency === "USD" ? 200 : currency === "TRY" ? 9500 : 180,
            "minibus": currency === "EUR" ? 150 : currency === "USD" ? 165 : currency === "TRY" ? 8000 : 150,
          };
          reasoning = "Benzer güzergah bulunamadı. Tahmini fiyatlar önerildi - lütfen manuel olarak ayarlayın.";
        }
      }
      
      setAiSuggestion({
        prices: matchedPrices,
        reasoning: reasoning
      });
      
      toast.success("AI fiyat önerisi hazır!");
    } catch (error) {
      console.error("AI price suggestion error:", error);
      toast.error("AI fiyat önerisi alınamadı");
    } finally {
      setSuggestingPrice(false);
    }
  };
  
  // Apply AI suggestion to form
  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    
    const newPrices: Record<string, string> = {};
    Object.entries(aiSuggestion.prices).forEach(([vehicle, price]) => {
      newPrices[vehicle] = price.toString();
    });
    
    setAllVehiclePrices(prev => ({
      ...prev,
      ...newPrices
    }));
    
    toast.success("AI önerisi uygulandı!");
  };

  const sendPrice = async () => {
    if (!selectedRequest) return;

    // Check if any vehicle price is entered
    const hasAnyVehiclePrice = Object.values(allVehiclePrices).some(p => p && parseFloat(p) > 0);
    const hasSinglePrice = price && parseFloat(price) > 0;

    if (!hasAnyVehiclePrice && !hasSinglePrice) {
      toast.error("En az bir araç için fiyat giriniz");
      return;
    }

    // Check if return trip exists and return price is required (only for single price mode)
    if (selectedRequest.has_return_trip && hasSinglePrice && !hasAnyVehiclePrice && !returnPrice) {
      toast.error("Dönüş transferi için fiyat giriniz");
      return;
    }

    setSendingPrice(true);
    try {
      // Build all vehicle prices object (only non-empty values)
      const vehiclePricesJson: Record<string, number> = {};
      Object.entries(allVehiclePrices).forEach(([vehicle, priceStr]) => {
        if (priceStr && parseFloat(priceStr) > 0) {
          vehiclePricesJson[vehicle] = parseFloat(priceStr);
        }
      });

      // Determine primary price (for selected vehicle or first entered price)
      let priceValue: number;
      if (hasSinglePrice && !hasAnyVehiclePrice) {
        // Single price mode
        priceValue = parseFloat(price);
      } else {
        // Multi-vehicle mode - use price for requested vehicle, or first available
        priceValue = vehiclePricesJson[selectedRequest.vehicle_type] || Object.values(vehiclePricesJson)[0] || 0;
      }

      const returnPriceValue = returnPrice ? parseFloat(returnPrice) : null;
      
      // Calculate discounted return price if promo code exists
      // The admin enters the NORMAL price, and we calculate the discounted price
      let discountedReturnPrice = returnPriceValue;
      if (returnPriceValue && selectedRequest.promo_code) {
        const discountMultiplier = (100 - returnDiscountPercent) / 100;
        discountedReturnPrice = Math.round(returnPriceValue * discountMultiplier);
      }
      
      // Store the DISCOUNTED return price in database
      // This is the actual price the customer will pay
      const updateData: any = {
        price: priceValue,
        price_currency: currency,
        status: "price_sent",
        return_price: discountedReturnPrice, // Store discounted price
      };

      // Add all vehicle prices if multi-vehicle mode is used
      if (Object.keys(vehiclePricesJson).length > 0) {
        updateData.all_vehicle_prices = vehiclePricesJson;
      }

      const { error: updateError } = await supabase
        .from("quick_booking_requests")
        .update(updateData)
        .eq("id", selectedRequest.id);

      if (updateError) throw updateError;

      try {
        await supabase.from("price_history").insert({
          quick_booking_id: selectedRequest.id,
          price: priceValue,
          price_currency: currency,
          action: "sent",
          customer_note: Object.keys(vehiclePricesJson).length > 0 
            ? `Manuel fiyat (${Object.keys(vehiclePricesJson).length} araç): ${Object.entries(vehiclePricesJson).map(([v, p]) => `${vehicleLabels[v] || v}: ${p}${getCurrencySymbol(currency)}`).join(', ')}`
            : undefined,
        });
      } catch (e) {
        console.error("Failed to record price history:", e);
      }

      // Save manual prices to region_prices/intercity_prices for ALL vehicle types
      try {
        // If we have all vehicle prices, save each one
        const pricesToSave = Object.keys(vehiclePricesJson).length > 0 
          ? vehiclePricesJson 
          : { [selectedRequest.vehicle_type]: priceValue };
        
        const savePromises = Object.entries(pricesToSave).map(async ([vehicleType, vehiclePrice]) => {
          if (vehiclePrice && Number(vehiclePrice) > 0) {
            const { data: saveResult } = await supabase.functions.invoke('save-manual-price-to-region', {
              body: {
                pickup: selectedRequest.pickup,
                dropoff: selectedRequest.dropoff,
                vehicle_type: vehicleType,
                price: Number(vehiclePrice),
                price_currency: currency,
                quick_booking_id: selectedRequest.id,
              }
            });
            if (saveResult?.success) {
              console.log(`Manual price saved for ${vehicleType}:`, saveResult.saved_location);
            }
            return saveResult;
          }
          return null;
        });
        
        await Promise.all(savePromises);
        console.log(`Saved ${Object.keys(pricesToSave).length} vehicle prices to prices table`);
      } catch (e) {
        console.error('Failed to save manual prices to region:', e);
      }

      try {
        // discountedReturnPrice is already calculated above with 30% discount if promo code exists
        // returnPriceValue is the original price admin entered
        
        const { data, error: fnError } = await supabase.functions.invoke(
          "send-quick-booking-price",
          {
            body: {
              quick_booking_id: selectedRequest.id,
              price: priceValue,
              currency,
              customer_email: selectedRequest.customer_email ?? undefined,
              // Return trip info for email - send both original and discounted for email
              return_price: discountedReturnPrice ?? undefined,
              original_return_price: returnPriceValue ?? undefined, // Original price for strikethrough display
              return_date: selectedRequest.return_date ?? undefined,
              return_time: selectedRequest.return_time ?? undefined,
              promo_code: selectedRequest.promo_code ?? undefined,
              // All vehicle prices for customer display
              all_vehicle_prices: Object.keys(vehiclePricesJson).length > 0 ? vehiclePricesJson : undefined,
            },
          }
        );

        if (fnError) throw fnError;

        if ((data as any)?.emailSent) {
          toast.success("Fiyat gönderildi ve müşteriye email atıldı!");
        } else {
          toast.success("Fiyat başarıyla gönderildi");
        }
      } catch (emailError) {
        console.error("Failed to send price email:", emailError);
        toast.success("Fiyat gönderildi (email gönderilemedi)");
      }

      setPriceDialogOpen(false);
      setDetailDialogOpen(false);
      setPrice("");
      setReturnPrice("");
      setAllVehiclePrices({
        "mercedes-vito": "",
        "vip-mercedes": "",
        "maybach-minibus": "",
        "minibus": "",
      });
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      console.error("Error sending price:", error);
      toast.error(error.message || "Failed to send price");
    } finally {
      setSendingPrice(false);
    }
  };

  const sendPaymentLink = async () => {
    if (!selectedRequest || !paymentLink) {
      toast.error("Please enter a payment link");
      return;
    }

    if (!selectedRequest.customer_email) {
      toast.error("Müşteri email adresi mevcut değil.");
      return;
    }

    setSendingPaymentLink(true);
    try {
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("id")
        .eq("pickup", selectedRequest.pickup)
        .eq("dropoff", selectedRequest.dropoff)
        .eq("pickup_date", selectedRequest.pickup_date)
        .eq("pickup_time", selectedRequest.pickup_time)
        .order("created_at", { ascending: false })
        .limit(1);

      const reservationId = reservations && reservations.length > 0 ? reservations[0].id : null;

      const { error } = await supabase.functions.invoke("send-payment-link", {
        body: {
          quickBookingId: selectedRequest.id,
          reservationId,
          paymentLink,
          customerEmail: selectedRequest.customer_email,
          customerName: selectedRequest.customer_name,
          pickup: selectedRequest.pickup,
          dropoff: selectedRequest.dropoff,
          pickupDate: selectedRequest.pickup_date,
          pickupTime: selectedRequest.pickup_time,
          price: selectedRequest.price,
          priceCurrency: selectedRequest.price_currency,
        },
      });

      if (error) throw error;

      toast.success("Ödeme linki müşteriye gönderildi!");
      setPaymentLinkDialogOpen(false);
      setDetailDialogOpen(false);
      setPaymentLink("");
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      console.error("Error sending payment link:", error);
      toast.error(error.message || "Failed to send payment link");
    } finally {
      setSendingPaymentLink(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!deleteDialog.request) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("quick_booking_requests")
        .delete()
        .eq("id", deleteDialog.request.id);

      if (error) throw error;

      toast.success("İstek silindi");
      setDeleteDialog({ open: false, request: null });
      setDetailDialogOpen(false);
      fetchRequests();
    } catch (error: any) {
      console.error("Error deleting request:", error);
      toast.error(error.message || "Failed to delete request");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    const parsed = parseISO(date);
    if (isToday(parsed)) return "Bugün";
    if (isTomorrow(parsed)) return "Yarın";
    return format(parsed, "dd MMM", { locale: tr });
  };

  const openDetailDialog = (request: QuickBookingRequest) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  const navigateToReservation = async (request: QuickBookingRequest) => {
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("id")
      .eq("pickup", request.pickup)
      .eq("dropoff", request.dropoff)
      .eq("pickup_date", request.pickup_date)
      .eq("pickup_time", request.pickup_time)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !reservations || reservations.length === 0) {
      toast.error("Rezervasyon bulunamadı");
      return;
    }

    navigate(`/admin/reservations/${reservations[0].id}`);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={cn("gap-1 font-medium", config.bgColor, config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Hızlı Rezervasyon İstekleri</h1>
              <p className="text-sm text-muted-foreground">
                {requests.length} istek · {stats.pending} bekliyor
              </p>
            </div>
          </div>
          <Button onClick={fetchRequests} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ara: müşteri, telefon, güzergah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="w-full md:w-auto grid grid-cols-5 md:flex">
            <TabsTrigger value="all" className="gap-1 text-xs md:text-sm">
              Tümü
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{stats.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1 text-xs md:text-sm">
              Bekliyor
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-yellow-100 text-yellow-700">{stats.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="price_sent" className="gap-1 text-xs md:text-sm">
              Fiyat Gönderildi
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-blue-100 text-blue-700">{stats.price_sent}</Badge>
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="gap-1 text-xs md:text-sm">
              Onaylandı
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-green-100 text-green-700">{stats.confirmed}</Badge>
            </TabsTrigger>
            <TabsTrigger value="other" className="gap-1 text-xs md:text-sm">
              Diğer
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{stats.other}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Durum</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Güzergah</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Araç</TableHead>
                      <TableHead className="text-right">Fiyat</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? "Sonuç bulunamadı" : "Henüz istek yok"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow 
                          key={request.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openDetailDialog(request)}
                        >
                          <TableCell>
                            <StatusBadge status={request.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{formatDate(request.pickup_date)}</span>
                              <span className="text-xs text-muted-foreground">{request.pickup_time}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col max-w-[200px]">
                              <span className="truncate text-sm">{request.pickup}</span>
                              <span className="truncate text-xs text-muted-foreground">→ {request.dropoff}</span>
                              {request.has_return_trip && (
                                <Badge variant="secondary" className="w-fit mt-1 text-xs bg-green-100 text-green-700 border-green-200">
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Dönüş
                                  {request.promo_code && " %30"}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {request.customer_name && (
                                <span className="font-medium text-sm">{request.customer_name}</span>
                              )}
                              {request.customer_phone && (
                                <span className="text-xs text-muted-foreground">{request.customer_phone}</span>
                              )}
                              {request.agency && (
                                <Badge variant="outline" className="w-fit mt-1 text-xs bg-purple-50 text-purple-700 border-purple-200">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {request.agency.agency_name}
                                </Badge>
                              )}
                              {request.created_via_ai && (
                                <Badge variant="outline" className="w-fit mt-1 text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                  <Bot className="h-3 w-3 mr-1" />
                                  AI Asistan
                                </Badge>
                              )}
                              {/* Customer Account Status for Confirmed Bookings */}
                              {request.status === "confirmed" && linkedReservations[request.id] && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "w-fit mt-1 text-xs",
                                    linkedReservations[request.id].customer_id 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                      : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                                  )}
                                >
                                  {linkedReservations[request.id].customer_id ? (
                                    <>
                                      <UserCheck className="h-3 w-3 mr-1" />
                                      Hesap Oluşturdu
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="h-3 w-3 mr-1" />
                                      Hesap Bekleniyor
                                    </>
                                  )}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1.5 text-sm">
                              <div className="flex items-center gap-1.5">
                                <Car className="h-3.5 w-3.5 text-primary" />
                                <span className="font-medium">{vehicleLabels[request.vehicle_type] || request.vehicle_type}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {request.passengers}
                                </span>
                                {request.luggage_count !== null && request.luggage_count > 0 && (
                                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                    <Briefcase className="h-3 w-3" />
                                    {request.luggage_count}
                                  </span>
                                )}
                                {request.baby_seat_count !== null && request.baby_seat_count > 0 && (
                                  <span className="flex items-center gap-1 text-pink-600 bg-pink-50 dark:bg-pink-900/30 px-1.5 py-0.5 rounded">
                                    <Baby className="h-3 w-3" />
                                    {request.baby_seat_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {request.price ? (
                              <span className="font-semibold text-green-600">
                                {getCurrencySymbol(request.price_currency)}{request.price}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetailDialog(request); }}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {searchQuery ? "Sonuç bulunamadı" : "Henüz istek yok"}
                  </CardContent>
                </Card>
              ) : (
                filteredRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className="cursor-pointer active:bg-muted/50"
                    onClick={() => openDetailDialog(request)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <StatusBadge status={request.status} />
                        <div className="text-right text-sm">
                          <div className="font-medium">{formatDate(request.pickup_date)}</div>
                          <div className="text-muted-foreground text-xs">{request.pickup_time}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                          <span className="truncate">{request.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-accent flex-shrink-0" />
                          <span className="truncate">{request.dropoff}</span>
                        </div>
                        {request.has_return_trip && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 mt-1">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Dönüş Transfer
                            {request.promo_code && " (%30 İndirim)"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex flex-col gap-1.5 text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Car className="h-3.5 w-3.5 text-primary" />
                            <span className="font-medium">{vehicleLabels[request.vehicle_type] || request.vehicle_type}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {request.passengers}
                            </span>
                            {request.luggage_count !== null && request.luggage_count > 0 && (
                              <span className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                <Briefcase className="h-3 w-3" />
                                {request.luggage_count}
                              </span>
                            )}
                            {request.baby_seat_count !== null && request.baby_seat_count > 0 && (
                              <span className="flex items-center gap-1 text-pink-600 bg-pink-50 dark:bg-pink-900/30 px-1.5 py-0.5 rounded">
                                <Baby className="h-3 w-3" />
                                {request.baby_seat_count}
                              </span>
                            )}
                          </div>
                        </div>
                        {request.price && (
                          <span className="font-semibold text-green-600">
                            {getCurrencySymbol(request.price_currency)}{request.price}
                          </span>
                        )}
                      </div>

                      {(request.customer_name || request.agency || (request.status === "confirmed" && linkedReservations[request.id])) && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {request.customer_name && (
                            <span className="text-muted-foreground">{request.customer_name}</span>
                          )}
                          {request.created_via_ai && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                              <Bot className="h-3 w-3 mr-1" />
                              AI Asistan
                            </Badge>
                          )}
                          {request.agency && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              {request.agency.agency_name}
                            </Badge>
                          )}
                          {/* Customer Account Status for Confirmed Bookings - Mobile */}
                          {request.status === "confirmed" && linkedReservations[request.id] && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                linkedReservations[request.id].customer_id 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                  : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                              )}
                            >
                              {linkedReservations[request.id].customer_id ? (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Hesap Oluşturdu
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3 w-3 mr-1" />
                                  Hesap Bekleniyor
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <DialogTitle className="flex items-center gap-2">
                    Rezervasyon Detayı
                  </DialogTitle>
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Route Info */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <div className="w-0.5 h-8 bg-border" />
                        <div className="w-3 h-3 rounded-full bg-accent" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Nereden</p>
                          <p className="font-medium">{selectedRequest.pickup}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Nereye</p>
                          <p className="font-medium">{selectedRequest.dropoff}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Date & Vehicle */}
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{format(parseISO(selectedRequest.pickup_date), "dd MMMM yyyy", { locale: tr })}</p>
                          <p className="text-xs text-muted-foreground">{selectedRequest.pickup_time}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">{vehicleLabels[selectedRequest.vehicle_type] || selectedRequest.vehicle_type}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {selectedRequest.passengers} yolcu
                            </span>
                            {selectedRequest.luggage_count !== null && selectedRequest.luggage_count > 0 && (
                              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                <Briefcase className="h-3 w-3" />
                                {selectedRequest.luggage_count} valiz
                              </span>
                            )}
                            {selectedRequest.baby_seat_count !== null && selectedRequest.baby_seat_count > 0 && (
                              <span className="flex items-center gap-1 text-xs text-pink-600 bg-pink-50 dark:bg-pink-900/30 px-1.5 py-0.5 rounded">
                                <Baby className="h-3 w-3" />
                                {selectedRequest.baby_seat_count} bebek koltuğu
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Return Trip Info */}
                {selectedRequest.has_return_trip && (
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">Dönüş Transferi</span>
                        {selectedRequest.promo_code && (
                          <Badge variant="secondary" className="bg-green-200 text-green-800 text-xs">
                            {selectedRequest.promo_code} - %30 İndirim
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Tarih</p>
                          <p className="font-medium">
                            {selectedRequest.return_date 
                              ? format(parseISO(selectedRequest.return_date), "dd MMM yyyy", { locale: tr })
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Saat</p>
                          <p className="font-medium">{selectedRequest.return_time || "-"}</p>
                        </div>
                      </div>
                      {selectedRequest.return_price && (
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Dönüş Fiyatı</span>
                            <span className="font-bold text-green-600">
                              {getCurrencySymbol(selectedRequest.price_currency)}{selectedRequest.return_price}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Price Info */}
                {selectedRequest.price && (
                  <Card className={cn(
                    "border-blue-200",
                    validatePrice(selectedRequest.price, selectedRequest.price_currency, selectedRequest.vehicle_type, thresholdsMap).isLow 
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300" 
                      : "bg-blue-50 dark:bg-blue-900/20"
                  )}>
                    <CardContent className="p-3">
                      {/* Low price warning */}
                      {validatePrice(selectedRequest.price, selectedRequest.price_currency, selectedRequest.vehicle_type, thresholdsMap).isLow && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-200">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            Otomatik fiyat düşük! Manuel fiyat girin.
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {selectedRequest.has_return_trip ? "Gidiş Fiyatı" : "Fiyat"}
                        </span>
                        <span className={cn(
                          "text-lg font-bold",
                          validatePrice(selectedRequest.price, selectedRequest.price_currency, selectedRequest.vehicle_type, thresholdsMap).isLow
                            ? "text-amber-600 line-through"
                            : "text-green-600"
                        )}>
                          {getCurrencySymbol(selectedRequest.price_currency)}{selectedRequest.price}
                        </span>
                      </div>
                      {selectedRequest.has_return_trip && selectedRequest.return_price && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Toplam</span>
                            <span className="text-lg font-bold text-primary">
                              {getCurrencySymbol(selectedRequest.price_currency)}{selectedRequest.price + selectedRequest.return_price}
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedRequest.payment_method && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={selectedRequest.payment_method === "payment_link" ? "text-blue-600 border-blue-600" : "text-green-600 border-green-600"}>
                            {selectedRequest.payment_method === "payment_link" ? (
                              <><CreditCard className="h-3 w-3 mr-1" /> Online Ödeme</>
                            ) : (
                              <>💵 Nakit</>
                            )}
                          </Badge>
                          {selectedRequest.payment_link && (
                            <Badge className="bg-blue-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Link Gönderildi
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Müşteri Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedRequest.customer_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedRequest.customer_name}</span>
                      </div>
                    )}
                    {selectedRequest.customer_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${selectedRequest.customer_phone}`} className="text-primary hover:underline">
                          {selectedRequest.customer_phone}
                        </a>
                      </div>
                    )}
                    {selectedRequest.customer_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${selectedRequest.customer_email}`} className="text-primary hover:underline">
                          {selectedRequest.customer_email}
                        </a>
                      </div>
                    )}
                    {selectedRequest.agency && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {selectedRequest.agency.agency_name}
                        </Badge>
                      </div>
                    )}
                    {selectedRequest.created_via_ai && (
                      <div className="flex items-center gap-2 text-sm">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700">
                          <Bot className="h-3 w-3 mr-1" />
                          AI Asistan ile Oluşturuldu
                        </Badge>
                      </div>
                    )}
                    
                    {/* Customer Account Status */}
                    {selectedRequest.status === "confirmed" && linkedReservations[selectedRequest.id] && (
                      <div className={cn(
                        "mt-3 p-3 rounded-lg border",
                        linkedReservations[selectedRequest.id].customer_id 
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" 
                          : "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                      )}>
                        <div className="flex items-center gap-2">
                          {linkedReservations[selectedRequest.id].customer_id ? (
                            <>
                              <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              <div>
                                <p className="font-medium text-emerald-700 dark:text-emerald-300">Müşteri Hesabı Oluşturuldu</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                  Müşteri bilgilerini doldurdu ve sisteme kayıt oldu
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <UserX className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              <div>
                                <p className="font-medium text-orange-700 dark:text-orange-300">Hesap Bekleniyor</p>
                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                  Müşteri henüz bilgilerini doldurmadı
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        {linkedReservations[selectedRequest.id].reservation_code && (
                          <div className="mt-2 pt-2 border-t border-current/10">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs w-full justify-start"
                              onClick={() => navigate(`/admin/reservations/${linkedReservations[selectedRequest.id].reservation_id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Rezervasyonu Görüntüle ({linkedReservations[selectedRequest.id].reservation_code})
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Notes */}
                {selectedRequest.customer_notes && (
                  <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                          {selectedRequest.customer_notes}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Price History */}
                <PriceHistoryCard quickBookingId={selectedRequest.id} />

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  {(selectedRequest.status === "pending" || selectedRequest.status === "price_rejected") && (
                    <Button 
                      className="w-full"
                      onClick={() => {
                        if (selectedRequest.status === "price_rejected" && selectedRequest.price) {
                          setPrice(selectedRequest.price.toString());
                          setCurrency(selectedRequest.price_currency || "EUR");
                        } else {
                          setPrice("");
                          setCurrency(selectedRequest.price_currency || "EUR");
                        }
                        // Reset all vehicle prices
                        setAllVehiclePrices({
                          "mercedes-vito": "",
                          "vip-mercedes": "",
                          "maybach-minibus": "",
                          "minibus": "",
                        });
                        setReturnPrice("");
                        setPriceDialogOpen(true);
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {selectedRequest.status === "price_rejected" ? "Yeni Fiyat Gönder" : "Fiyat Gönder"}
                    </Button>
                  )}

                  {selectedRequest.status === "confirmed" && (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigateToReservation(selectedRequest)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rezervasyonu Düzenle
                      </Button>
                      
                      {selectedRequest.payment_method === "payment_link" && !selectedRequest.payment_link && selectedRequest.customer_email && (
                        <Button 
                          className="w-full"
                          onClick={() => setPaymentLinkDialogOpen(true)}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Ödeme Linki Gönder
                        </Button>
                      )}
                    </>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => setDeleteDialog({ open: true, request: selectedRequest })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    İsteği Sil
                  </Button>
                </div>

                {/* Meta info */}
                <p className="text-xs text-muted-foreground text-center">
                  Oluşturulma: {format(parseISO(selectedRequest.created_at), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Price Dialog - Enhanced with Customer & Route Details */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Fiyat Gönder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <>
                {/* Customer Info Card - Prominent */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="font-bold text-lg text-blue-900 dark:text-blue-100">
                            {selectedRequest.customer_name || "Anonim Müşteri"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {selectedRequest.customer_phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <a href={`tel:${selectedRequest.customer_phone}`} className="hover:text-primary hover:underline font-medium">
                                {selectedRequest.customer_phone}
                              </a>
                            </div>
                          )}
                          {selectedRequest.customer_email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <a href={`mailto:${selectedRequest.customer_email}`} className="hover:text-primary hover:underline text-xs truncate max-w-[180px]">
                                {selectedRequest.customer_email}
                              </a>
                            </div>
                          )}
                        </div>
                        {selectedRequest.agency && (
                          <Badge variant="outline" className="mt-2 bg-purple-50 text-purple-700 border-purple-200">
                            <Building2 className="h-3 w-3 mr-1" />
                            {selectedRequest.agency.agency_name}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(selectedRequest.pickup_date), "dd MMM", { locale: tr })}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {selectedRequest.pickup_time}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Route Card - Prominent */}
                <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-teal-500" />
                          <div className="w-3 h-3 rounded-full bg-teal-500" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Kalkış</p>
                            <p className="font-bold text-emerald-900 dark:text-emerald-100">{selectedRequest.pickup}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Varış</p>
                            <p className="font-bold text-teal-900 dark:text-teal-100">{selectedRequest.dropoff}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Vehicle & Passenger Details */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <Car className="h-3 w-3 mr-1" />
                          {vehicleLabels[selectedRequest.vehicle_type] || selectedRequest.vehicle_type}
                        </Badge>
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {selectedRequest.passengers} yolcu
                        </Badge>
                        {selectedRequest.luggage_count !== null && selectedRequest.luggage_count > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {selectedRequest.luggage_count} valiz
                          </Badge>
                        )}
                        {selectedRequest.baby_seat_count !== null && selectedRequest.baby_seat_count > 0 && (
                          <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                            <Baby className="h-3 w-3 mr-1" />
                            {selectedRequest.baby_seat_count} bebek koltuğu
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Notes - If exists */}
                {selectedRequest.customer_notes && (
                  <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">Müşteri Notu:</p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">
                            {selectedRequest.customer_notes}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Return trip info badge */}
            {selectedRequest?.has_return_trip && (
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Dönüş Transferi Var</span>
                  {selectedRequest.promo_code && (
                    <Badge variant="secondary" className="bg-green-200 text-green-800">
                      {selectedRequest.promo_code} - %30 İndirim
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Tarih: {selectedRequest.return_date ? format(parseISO(selectedRequest.return_date), "dd MMM yyyy", { locale: tr }) : "-"}</p>
                  <p>Saat: {selectedRequest.return_time || "-"}</p>
                </div>
              </div>
            )}

            {/* Currency selector */}
            <div className="space-y-2">
              <Label className="font-medium">Para Birimi</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="GBP">£ GBP</SelectItem>
                  <SelectItem value="TRY">₺ TRY</SelectItem>
                  <SelectItem value="AED">د.إ AED</SelectItem>
                  <SelectItem value="AUD">$ AUD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI Price Suggestion Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Fiyat Önerisi
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={suggestPriceWithAI}
                  disabled={suggestingPrice}
                  className="gap-2"
                >
                  {suggestingPrice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {suggestingPrice ? "Hesaplanıyor..." : "Öneri Al"}
                </Button>
              </div>
              
              {aiSuggestion && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                      {aiSuggestion.reasoning}
                    </span>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={applyAiSuggestion}
                      className="gap-1.5 h-7 text-xs bg-purple-600 hover:bg-purple-700"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Uygula
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(aiSuggestion.prices).map(([vehicle, priceVal]) => (
                      <div key={vehicle} className="flex justify-between bg-white/50 dark:bg-black/20 rounded px-2 py-1">
                        <span className="text-muted-foreground">{vehicleLabels[vehicle] || vehicle}:</span>
                        <span className="font-medium">{getCurrencySymbol(currency)}{priceVal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* All vehicle prices - 4 vehicles at once */}
            <div className="space-y-3">
              <Label className="font-medium flex items-center gap-2">
                🚗 Tüm Araçlar İçin Fiyat
                <span className="text-xs font-normal text-muted-foreground">(En az 1 araç için girin)</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(vehicleLabels)
                  .filter(([key]) => ["mercedes-vito", "vip-mercedes", "maybach-minibus", "minibus"].includes(key))
                  .map(([vehicleKey, label]) => (
                    <div key={vehicleKey} className="space-y-1">
                      <Label className={cn(
                        "text-xs font-medium",
                        selectedRequest?.vehicle_type === vehicleKey && "text-primary"
                      )}>
                        {label}
                        {selectedRequest?.vehicle_type === vehicleKey && (
                          <span className="ml-1 text-primary">✓</span>
                        )}
                      </Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={allVehiclePrices[vehicleKey] || ""}
                          onChange={(e) => setAllVehiclePrices(prev => ({
                            ...prev,
                            [vehicleKey]: e.target.value
                          }))}
                          placeholder="0"
                          className={cn(
                            "text-sm",
                            selectedRequest?.vehicle_type === vehicleKey && "border-primary"
                          )}
                        />
                        <span className="text-xs text-muted-foreground w-8">{getCurrencySymbol(currency)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">veya</span>
              </div>
            </div>

            {/* Single price input (legacy/simple mode) */}
            <div className="space-y-2">
              <Label className="font-medium text-sm text-muted-foreground">
                Sadece Seçilen Araç İçin Fiyat ({vehicleLabels[selectedRequest?.vehicle_type || ""] || selectedRequest?.vehicle_type})
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="text-sm"
              />
            </div>

            {/* Return price - only shown if has return trip */}
            {selectedRequest?.has_return_trip && (
              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-2">
                  🔄 Dönüş Fiyatı
                  {selectedRequest.promo_code && (
                    <span className="text-xs text-green-600 font-normal">(%{returnDiscountPercent} indirim otomatik uygulanacak)</span>
                  )}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={returnPrice}
                    onChange={(e) => setReturnPrice(e.target.value)}
                    placeholder="Normal fiyatı girin"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">{currency}</span>
                </div>
                {returnPrice && selectedRequest.promo_code && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground line-through">Normal: {returnPrice} {currency}</span>
                      <span className="text-green-600 font-medium">
                        İndirimli: {Math.round(parseFloat(returnPrice) * (100 - returnDiscountPercent) / 100)} {currency}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Low Price Warning */}
            {(() => {
              const hasMultiVehiclePrices = Object.values(allVehiclePrices).some(p => p && parseFloat(p) > 0);
              const singlePrice = parseFloat(price);
              
              if (hasMultiVehiclePrices) {
                const warnings = getLowPriceWarnings(allVehiclePrices, currency, vehicleLabels, thresholdsMap);
                if (warnings.length > 0) {
                  return (
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            Düşük Fiyat Uyarısı!
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            Aşağıdaki fiyatlar minimum eşiğin altında:
                          </p>
                          <ul className="text-sm text-amber-600 dark:text-amber-400 mt-1 list-disc list-inside">
                            {warnings.map((warning, i) => (
                              <li key={i}>{warning}</li>
                            ))}
                          </ul>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                            Fiyatı onaylarsanız, sistem bu rotayı öğrenecek ve gelecekte doğru fiyatı verecektir.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              } else if (singlePrice > 0 && selectedRequest) {
                const validation = validatePrice(singlePrice, currency, selectedRequest.vehicle_type, thresholdsMap);
                if (validation.isLow) {
                  return (
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            Düşük Fiyat Uyarısı!
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            {validation.warningMessage}
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                            Fiyatı onaylarsanız, sistem bu rotayı öğrenecek ve gelecekte doğru fiyatı verecektir.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })()}

            <Button
              onClick={sendPrice}
              disabled={sendingPrice || (!price && !Object.values(allVehiclePrices).some(p => p && parseFloat(p) > 0))}
              className="w-full"
            >
              {sendingPrice ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Fiyat Gönder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Link Dialog */}
      <Dialog open={paymentLinkDialogOpen} onOpenChange={setPaymentLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme Linki Gönder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
                <p><strong>Müşteri:</strong> {selectedRequest.customer_name || "-"}</p>
                <p><strong>Email:</strong> {selectedRequest.customer_email}</p>
                <p><strong>Fiyat:</strong> {selectedRequest.price} {selectedRequest.price_currency}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Ödeme Link URL</Label>
              <Input
                type="url"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Stripe, PayPal veya banka ödeme linkinizi girin
              </p>
            </div>

            <Button
              onClick={sendPaymentLink}
              disabled={sendingPaymentLink || !paymentLink}
              className="w-full"
            >
              {sendingPaymentLink ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Ödeme Linki Gönder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              İsteği Sil
            </DialogTitle>
          </DialogHeader>
          {deleteDialog.request && (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Bu fiyat isteğini silmek istediğinizden emin misiniz?
              </p>
              <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                <p><strong>Güzergah:</strong> {deleteDialog.request.pickup} → {deleteDialog.request.dropoff}</p>
                <p><strong>Tarih:</strong> {format(parseISO(deleteDialog.request.pickup_date), "dd/MM/yyyy")} {deleteDialog.request.pickup_time}</p>
                {deleteDialog.request.customer_name && (
                  <p><strong>Müşteri:</strong> {deleteDialog.request.customer_name}</p>
                )}
              </div>
              <p className="text-destructive text-xs">Bu işlem geri alınamaz.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, request: null })}>
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRequest} 
              disabled={deleting}
            >
              {deleting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Siliniyor...</>
              ) : (
                "Evet, Sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
