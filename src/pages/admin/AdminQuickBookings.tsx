import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  confirmed: "bg-green-500",
  rejected: "bg-red-500",
  expired: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  pending: "Bekliyor",
  price_sent: "Fiyat Gönderildi",
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
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [sendingPrice, setSendingPrice] = useState(false);

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
      const { error } = await supabase
        .from("quick_booking_requests")
        .update({
          price: parseFloat(price),
          price_currency: currency,
          status: "price_sent",
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

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

  const getConfirmUrl = (token: string) => {
    return `${window.location.origin}/quick-booking-confirm?token=${token}`;
  };

  const copyConfirmLink = (token: string) => {
    navigator.clipboard.writeText(getConfirmUrl(token));
    toast.success("Confirmation link copied!");
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
                            </div>

                            {request.price && (
                              <div className="flex items-center gap-2 text-green-600 font-medium">
                                <DollarSign className="h-4 w-4" />
                                {request.price} {request.price_currency}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {request.status === "pending" && (
                              <Dialog
                                open={priceDialogOpen && selectedRequest?.id === request.id}
                                onOpenChange={(open) => {
                                  setPriceDialogOpen(open);
                                  if (open) setSelectedRequest(request);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm">
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Price
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Send Price</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyConfirmLink(request.confirmation_token)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Copy Link
                              </Button>
                            )}

                            {request.status === "confirmed" && (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirmed
                              </Badge>
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
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
