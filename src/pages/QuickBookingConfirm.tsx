import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, XCircle, MapPin, Calendar, Clock, Car, Users, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";

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
}

const vehicleLabels: Record<string, string> = {
  "mercedes-vito": "Mercedes Vito",
  "mercedes-vclass": "VIP Vito",
  maybach: "Maybach Minivan",
  minibus: "Minibus",
};

export default function QuickBookingConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      fetchBooking(token);
    } else {
      setError("No confirmation token provided");
      setLoading(false);
    }
  }, [searchParams]);

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

      if (data.status !== "price_sent") {
        setError("Price has not been set yet. Please wait for our team to send you a price.");
        return;
      }

      setBooking(data as BookingRequest);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!booking) return;

    setConfirming(true);
    try {
      // Update booking status
      const { error: updateError } = await supabase
        .from("quick_booking_requests")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (updateError) throw updateError;

      // Notify admin about the confirmation
      try {
        await supabase.functions.invoke("notify-admin-quick-booking-confirmed", {
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
          },
        });
      } catch (notifyError) {
        console.error("Failed to notify admin:", notifyError);
        // Don't block the flow if notification fails
      }

      // Navigate to reservation form with pre-filled data
      const params = new URLSearchParams();
      params.set("pickup", booking.pickup);
      params.set("dropoff", booking.dropoff);
      params.set("date", booking.pickup_date);
      params.set("time", booking.pickup_time);
      params.set("vehicleType", booking.vehicle_type);
      params.set("passengers", booking.passengers.toString());
      params.set("price", booking.price?.toString() || "");
      params.set("currency", booking.price_currency);
      params.set("quickBookingId", booking.id);

      navigate(`/book?${params.toString()}`);
    } catch (err: any) {
      console.error("Confirm error:", err);
      setError(err.message || "Failed to confirm booking");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!booking) return;

    setRejecting(true);
    try {
      const { error } = await supabase
        .from("quick_booking_requests")
        .update({
          status: "rejected",
        })
        .eq("id", booking.id);

      if (error) throw error;

      setError("You have rejected this price offer. Feel free to request a new quote anytime.");
    } catch (err: any) {
      console.error("Reject error:", err);
      setError(err.message || "Failed to reject booking");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Loading your price quote...</h2>
            <p className="text-muted-foreground">Please wait</p>
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
            <h2 className="text-xl font-semibold mb-2">Unable to Load</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Your Price Quote</h1>
            <p className="text-muted-foreground">
              Review your transfer details and confirm booking
            </p>
          </div>

          {/* Transfer Details */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Pick-up</p>
                <p className="font-medium">{booking.pickup}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Drop-off</p>
                <p className="font-medium">{booking.dropoff}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(parseISO(booking.pickup_date), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{booking.pickup_time}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{vehicleLabels[booking.vehicle_type]}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Passengers</p>
                  <p className="font-medium">{booking.passengers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Display */}
          <div className="bg-primary/10 rounded-lg p-6 mb-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Your Transfer Price</p>
            <p className="text-4xl font-bold text-primary">
              {booking.price_currency === "EUR" && "€"}
              {booking.price_currency === "USD" && "$"}
              {booking.price_currency === "GBP" && "£"}
              {booking.price_currency === "TRY" && "₺"}
              {booking.price}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {booking.price_currency}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={rejecting || confirming}
              className="h-12"
            >
              {rejecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>

            <Button
              onClick={handleConfirm}
              disabled={confirming || rejecting}
              className="h-12"
            >
              {confirming ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Booking
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By confirming, you'll proceed to complete your booking details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
