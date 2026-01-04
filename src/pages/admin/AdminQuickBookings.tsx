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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PriceHistoryCard from "@/components/admin/PriceHistoryCard";
import { cn } from "@/lib/utils";

interface QuickBookingRequest {
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
}

const vehicleLabels: Record<string, string> = {
  "mercedes-vito": "Vito",
  "mercedes-vclass": "VIP Vito",
  maybach: "Maybach",
  minibus: "Minibus",
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
  const [requests, setRequests] = useState<QuickBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<QuickBookingRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [paymentLink, setPaymentLink] = useState("");
  const [sendingPrice, setSendingPrice] = useState(false);
  const [sendingPaymentLink, setSendingPaymentLink] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; request: QuickBookingRequest | null }>({
    open: false,
    request: null,
  });
  const [deleting, setDeleting] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel("quick-booking-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quick_booking_requests" },
        () => {
          fetchRequests();
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
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to fetch booking requests");
    } finally {
      setLoading(false);
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

  const sendPrice = async () => {
    if (!selectedRequest || !price) {
      toast.error("Please enter a price");
      return;
    }

    setSendingPrice(true);
    try {
      const priceValue = parseFloat(price);
      
      const { error: updateError } = await supabase
        .from("quick_booking_requests")
        .update({
          price: priceValue,
          price_currency: currency,
          status: "price_sent",
        })
        .eq("id", selectedRequest.id);

      if (updateError) throw updateError;

      try {
        await supabase.from("price_history").insert({
          quick_booking_id: selectedRequest.id,
          price: priceValue,
          price_currency: currency,
          action: "sent",
        });
      } catch (e) {
        console.error("Failed to record price history:", e);
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "send-quick-booking-price",
          {
            body: {
              quick_booking_id: selectedRequest.id,
              price: priceValue,
              currency,
              customer_email: selectedRequest.customer_email ?? undefined,
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
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
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
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Car className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{vehicleLabels[request.vehicle_type] || request.vehicle_type}</span>
                              <span className="text-xs text-muted-foreground">({request.passengers})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {request.price ? (
                              <span className="font-semibold text-green-600">
                                {request.price} {request.price_currency}
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
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {vehicleLabels[request.vehicle_type] || request.vehicle_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {request.passengers}
                          </span>
                        </div>
                        {request.price && (
                          <span className="font-semibold text-green-600">
                            {request.price} {request.price_currency}
                          </span>
                        )}
                      </div>

                      {(request.customer_name || request.agency) && (
                        <div className="flex items-center gap-2 text-xs">
                          {request.customer_name && (
                            <span className="text-muted-foreground">{request.customer_name}</span>
                          )}
                          {request.agency && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              {request.agency.agency_name}
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
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{vehicleLabels[selectedRequest.vehicle_type] || selectedRequest.vehicle_type}</p>
                          <p className="text-xs text-muted-foreground">{selectedRequest.passengers} yolcu</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Price Info */}
                {selectedRequest.price && (
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Fiyat</span>
                        <span className="text-lg font-bold text-green-600">
                          {selectedRequest.price} {selectedRequest.price_currency}
                        </span>
                      </div>
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

      {/* Send Price Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fiyat Gönder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fiyat</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
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
            </div>

            <Button
              onClick={sendPrice}
              disabled={sendingPrice || !price}
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
