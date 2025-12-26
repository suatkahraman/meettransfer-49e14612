import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DialogFooter } from "@/components/ui/dialog";
import PriceHistoryCard from "@/components/admin/PriceHistoryCard";

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
}

const vehicleLabels: Record<string, string> = {
  "mercedes-vito": "Mercedes Vito",
  "mercedes-vclass": "VIP Vito",
  maybach: "Maybach Minivan",
  minibus: "Minibus",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  price_sent: "bg-blue-500",
  price_rejected: "bg-orange-500",
  confirmed: "bg-green-500",
  rejected: "bg-red-500",
  expired: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  pending: "Bekliyor",
  price_sent: "Fiyat Gönderildi",
  price_rejected: "Fiyat Reddedildi",
  confirmed: "Onaylandı",
  rejected: "Reddedildi",
  expired: "Süresi Doldu",
};

export default function AdminQuickBookings() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<QuickBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<QuickBookingRequest | null>(null);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [paymentLink, setPaymentLink] = useState("");
  // Email input removed - customer provides email after confirming price
  const [sendingPrice, setSendingPrice] = useState(false);
  const [sendingPaymentLink, setSendingPaymentLink] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; request: QuickBookingRequest | null }>({
    open: false,
    request: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRequests();

    // Subscribe to realtime updates
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
        .select("*")
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

  const sendPrice = async () => {
    if (!selectedRequest || !price) {
      toast.error("Please enter a price");
      return;
    }

    setSendingPrice(true);
    try {
      const priceValue = parseFloat(price);
      
      // Update the quick booking request with price
      const { error: updateError } = await supabase
        .from("quick_booking_requests")
        .update({
          price: priceValue,
          price_currency: currency,
          status: "price_sent",
        })
        .eq("id", selectedRequest.id);

      if (updateError) throw updateError;

      // Record price in history
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

      toast.success("Price sent successfully");

      setPriceDialogOpen(false);
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
      toast.error("Customer email is not available. Customer needs to complete the reservation form first.");
      return;
    }

    setSendingPaymentLink(true);
    try {
      // First, find the reservation created from this quick booking
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

      toast.success("Payment link sent to customer!");
      setPaymentLinkDialogOpen(false);
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

      toast.success("Booking request deleted");
      setDeleteDialog({ open: false, request: null });
      fetchRequests();
    } catch (error: any) {
      console.error("Error deleting request:", error);
      toast.error(error.message || "Failed to delete request");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Quick Booking Requests</h1>
              <p className="text-muted-foreground">
                Manage price requests from website form
              </p>
            </div>
          </div>
          <Button onClick={fetchRequests} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(statusLabels).map(([key, label]) => {
            const count = requests.filter((r) => r.status === key).length;
            return (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <Badge className={statusColors[key]}>{count}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="min-w-[800px]">
                <div className="space-y-4">
                {requests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No booking requests yet
                  </div>
                ) : (
                  requests.map((request) => (
                    <Card
                      key={request.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={statusColors[request.status]}>
                                {statusLabels[request.status]}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(parseISO(request.created_at), "dd/MM/yyyy HH:mm")}
                              </span>
                            </div>

                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="truncate">{request.pickup}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-accent" />
                                <span className="truncate">{request.dropoff}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(parseISO(request.pickup_date), "dd/MM/yyyy")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {request.pickup_time}
                              </div>
                              <div className="flex items-center gap-1">
                                <Car className="h-4 w-4" />
                                {vehicleLabels[request.vehicle_type] || request.vehicle_type}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {request.passengers} passengers
                              </div>
                              {!request.price && request.price_currency && (
                                <div className="flex items-center gap-1 text-primary font-medium">
                                  <DollarSign className="h-4 w-4" />
                                  Preferred: {request.price_currency}
                                </div>
                              )}
                            </div>

                            {request.price && (
                              <div className="flex items-center gap-2 text-green-600 font-medium">
                                <DollarSign className="h-4 w-4" />
                                {request.price} {request.price_currency}
                              </div>
                            )}
                            
                            {request.payment_method && (
                              <Badge variant="outline" className={request.payment_method === "payment_link" ? "text-blue-600 border-blue-600" : "text-green-600 border-green-600"}>
                                {request.payment_method === "payment_link" ? (
                                  <><CreditCard className="h-3 w-3 mr-1" /> Online</>
                                ) : (
                                  <>💵 Cash</>
                                )}
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {/* Delete Button - always visible */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteDialog({ open: true, request })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {(request.status === "pending" || request.status === "price_rejected") && (
                              <Dialog
                                open={priceDialogOpen && selectedRequest?.id === request.id}
                                onOpenChange={(open) => {
                                  setPriceDialogOpen(open);
                                  if (open) {
                                    setSelectedRequest(request);
                                    // Pre-fill with previous price if rejected, otherwise use customer's preferred currency
                                    if (request.status === "price_rejected" && request.price) {
                                      setPrice(request.price.toString());
                                      setCurrency(request.price_currency || "EUR");
                                    } else {
                                      setPrice("");
                                      setCurrency(request.price_currency || "EUR");
                                    }
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" variant={request.status === "price_rejected" ? "default" : "default"} className={request.status === "price_rejected" ? "bg-orange-600 hover:bg-orange-700" : ""}>
                                    <Send className="h-4 w-4 mr-2" />
                                    {request.status === "price_rejected" ? "Yeni Fiyat Gönder" : "Send Price"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Send Price</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    {/* Price History */}
                                    <PriceHistoryCard quickBookingId={request.id} />
                                    
                                    <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                                      <p>
                                        <strong>From:</strong> {request.pickup}
                                      </p>
                                      <p>
                                        <strong>To:</strong> {request.dropoff}
                                      </p>
                                      <p>
                                        <strong>Date:</strong>{" "}
                                        {format(parseISO(request.pickup_date), "dd/MM/yyyy")}{" "}
                                        {request.pickup_time}
                                      </p>
                                      <p>
                                        <strong>Vehicle:</strong>{" "}
                                        {vehicleLabels[request.vehicle_type]}
                                      </p>
                                      <p>
                                        <strong>Passengers:</strong> {request.passengers}
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Price</Label>
                                        <Input
                                          type="number"
                                          value={price}
                                          onChange={(e) => setPrice(e.target.value)}
                                          placeholder="Enter price"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Currency</Label>
                                        <Select value={currency} onValueChange={setCurrency}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="TRY">TRY</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
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
                                      Send Price
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            {request.status === "price_sent" && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                <Clock className="h-4 w-4 mr-1" />
                                Müşteri Onayı Bekleniyor
                              </Badge>
                            )}

                            {request.status === "confirmed" && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Edit Reservation Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    // Find the reservation created from this quick booking
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
                                      toast.error("Reservation not found");
                                      return;
                                    }

                                    navigate(`/admin/reservations/${reservations[0].id}`);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Reservation
                                </Button>

                                {request.payment_method === "payment_link" && !request.payment_link && request.customer_email && (
                                  <Dialog
                                    open={paymentLinkDialogOpen && selectedRequest?.id === request.id}
                                    onOpenChange={(open) => {
                                      setPaymentLinkDialogOpen(open);
                                      if (open) setSelectedRequest(request);
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="default">
                                        <LinkIcon className="h-4 w-4 mr-2" />
                                        Add Payment Link
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Send Payment Link</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                                          <p>
                                            <strong>Customer:</strong> {request.customer_name || "N/A"}
                                          </p>
                                          <p>
                                            <strong>Email:</strong> {request.customer_email}
                                          </p>
                                          <p>
                                            <strong>Transfer:</strong> {request.pickup} → {request.dropoff}
                                          </p>
                                          <p>
                                            <strong>Price:</strong> {request.price} {request.price_currency}
                                          </p>
                                        </div>

                                        <div className="space-y-2">
                                          <Label>Payment Link URL</Label>
                                          <Input
                                            type="url"
                                            value={paymentLink}
                                            onChange={(e) => setPaymentLink(e.target.value)}
                                            placeholder="https://..."
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            Enter your Stripe, PayPal, or bank payment link
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
                                          Send Payment Link
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                
                                {request.payment_method === "payment_link" && request.payment_link && (
                                  <Badge className="bg-blue-500">
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    Link Sent
                                  </Badge>
                                )}
                                
                                {request.payment_method === "payment_link" && !request.customer_email && (
                                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Awaiting Form
                                  </Badge>
                                )}
                                
                                {request.payment_method !== "payment_link" && (
                                  <Badge className="bg-green-500">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Cash
                                  </Badge>
                                )}
                              </div>
                            )}

                            {request.status === "rejected" && (
                              <Badge className="bg-red-500">
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

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
