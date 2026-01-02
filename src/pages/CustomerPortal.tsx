import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Plus,
  CheckCircle,
  Loader2,
  Percent,
} from "lucide-react";

interface Reservation {
  id: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  customer_name: string;
  customer_phone: string;
  vehicle_type: string;
  status: string;
  price: number | null;
  price_currency: string | null;
  driver_id: string | null;
  is_return_transfer: boolean;
  original_reservation_id: string | null;
  discount_percentage: number;
  discount_amount: number;
  reservation_code: string | null;
}

interface PortalData {
  user_id: string;
  phone: string;
  reservations: Reservation[];
  conversation_id: string | null;
}

export default function CustomerPortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      authenticateWithToken(token);
    } else {
      setError("No access token provided");
      setLoading(false);
    }
  }, [searchParams]);

  const authenticateWithToken = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal-auth", {
        body: { token },
      });

      if (error) throw error;

      if (data.error) {
        setError(data.error);
      } else {
        setPortalData(data);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default",
      completed: "secondary",
      cancelled: "destructive",
      pending: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace(/_/g, " ").replace(/-/g, " ")}
      </Badge>
    );
  };

  const handleCreateReturnTransfer = (originalReservation: Reservation) => {
    // Navigate to booking form with return transfer data
    const returnData = {
      pickup: originalReservation.dropoff,
      dropoff: originalReservation.pickup,
      original_reservation_id: originalReservation.id,
      is_return_transfer: true,
      discount_percentage: 30,
    };
    
    navigate(`/book?return=true&original=${originalReservation.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Meet Transfer</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {portalData?.phone}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Bookings</h2>
              <p className="text-muted-foreground">
                View and manage your transfer reservations
              </p>
            </div>
            <Button onClick={() => navigate("/book")}>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </div>

          {/* Return Transfer Discount Banner */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">40% Off Return Transfers!</p>
                  <p className="text-sm text-muted-foreground">
                    Book a round-trip and get 40% discount on your return transfer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {portalData?.reservations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first transfer booking
                </p>
                <Button onClick={() => navigate("/book")}>Book a Transfer</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {portalData?.reservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {reservation.reservation_code && (
                            <Badge variant="outline" className="font-mono">
                              {reservation.reservation_code}
                            </Badge>
                          )}
                          {getStatusBadge(reservation.status)}
                          {reservation.is_return_transfer && (
                            <Badge variant="secondary" className="gap-1">
                              <Percent className="h-3 w-3" />
                              Return (-40%)
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">
                          {reservation.pickup} → {reservation.dropoff}
                        </CardTitle>
                      </div>
                      {reservation.price && (
                        <div className="text-right">
                          {reservation.discount_amount > 0 && (
                            <p className="text-sm text-muted-foreground line-through">
                              {reservation.price_currency === "EUR" ? "€" : reservation.price_currency === "USD" ? "$" : reservation.price_currency === "GBP" ? "£" : reservation.price_currency === "AED" ? "د.إ" : reservation.price_currency === "AUD" ? "A$" : "₺"}
                              {(reservation.price + reservation.discount_amount).toFixed(2)}
                            </p>
                          )}
                          <p className="text-xl font-bold text-primary">
                            {reservation.price_currency === "EUR" ? "€" : reservation.price_currency === "USD" ? "$" : reservation.price_currency === "GBP" ? "£" : reservation.price_currency === "AED" ? "د.إ" : reservation.price_currency === "AUD" ? "A$" : "₺"}
                            {reservation.price}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(reservation.pickup_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.pickup_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">
                          {reservation.vehicle_type.replace(/-/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.customer_name}</span>
                      </div>
                    </div>

                    {!reservation.is_return_transfer && 
                     reservation.status !== "cancelled" && 
                     reservation.status !== "completed" && (
                      <>
                        <Separator className="my-4" />
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateReturnTransfer(reservation)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Return Transfer (40% Off)
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
