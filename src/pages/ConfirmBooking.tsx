import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

export default function ConfirmBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      confirmBooking(token);
    } else {
      setError("No confirmation token provided");
      setLoading(false);
    }
  }, [searchParams]);

  const confirmBooking = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("confirm-booking", {
        body: { token },
      });

      if (error) throw error;

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("Confirmation error:", err);
      setError(err.message || "Failed to confirm booking");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Confirming your booking...</h2>
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
            <h2 className="text-xl font-semibold mb-2">Confirmation Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Booking Confirmed! ✅</h2>
          <p className="text-muted-foreground mb-6">
            Your transfer has been confirmed. You will receive a WhatsApp message with your
            account link to view reservation details and driver information.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium mb-2">🎁 Special Offer</p>
            <p className="text-sm text-muted-foreground">
              Book a round-trip (return transfer) and receive a <strong>25% discount</strong> on
              your return transfer!
            </p>
          </div>
          <Button onClick={() => navigate("/")} className="w-full">
            Go to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
