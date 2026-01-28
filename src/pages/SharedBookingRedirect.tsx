import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface BookingData {
  type: string;
  pickup: string;
  dropoff: string;
  city?: string;
  date: string;
  time: string;
  passengers: number;
  vehicleType: string;
  duration?: string;
  luggageCount?: number;
  babySeatCount?: number;
  hasReturn?: boolean;
  returnDate?: string;
  returnTime?: string;
  promoCode?: string;
  language?: string;
}

const SharedBookingRedirect = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!shortCode) {
        navigate("/");
        return;
      }

      try {
        // Fetch shared link from database
        const { data, error: fetchError } = await supabase
          .from("shared_booking_links")
          .select("booking_data, view_count")
          .eq("short_code", shortCode)
          .single();

        if (fetchError || !data) {
          console.error("Shared link not found:", fetchError);
          setError("Link not found or expired");
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        // Increment view count (fire and forget)
        supabase
          .from("shared_booking_links")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("short_code", shortCode)
          .then(() => {});

        // Parse booking data - cast through unknown first
        const bookingData = data.booking_data as unknown as BookingData;
        
        // Build URL params
        const params = new URLSearchParams();
        params.set("type", bookingData.type || "transfer");
        
        if (bookingData.pickup) params.set("pickup", bookingData.pickup);
        if (bookingData.dropoff) params.set("dropoff", bookingData.dropoff);
        if (bookingData.city) params.set("city", bookingData.city);
        if (bookingData.date) params.set("date", bookingData.date);
        if (bookingData.time) params.set("time", bookingData.time);
        if (bookingData.passengers) params.set("passengers", bookingData.passengers.toString());
        if (bookingData.vehicleType) params.set("vehicleType", bookingData.vehicleType);
        if (bookingData.duration) params.set("duration", bookingData.duration);
        if (bookingData.luggageCount) params.set("luggageCount", bookingData.luggageCount.toString());
        if (bookingData.babySeatCount) params.set("babySeatCount", bookingData.babySeatCount.toString());
        if (bookingData.hasReturn) {
          params.set("hasReturn", "true");
          if (bookingData.returnDate) params.set("returnDate", bookingData.returnDate);
          if (bookingData.returnTime) params.set("returnTime", bookingData.returnTime);
        }
        if (bookingData.promoCode) params.set("promoCode", bookingData.promoCode);

        // Redirect to booking page with language prefix if available
        const langPrefix = bookingData.language && bookingData.language !== "EN" 
          ? `/${bookingData.language.toLowerCase()}` 
          : "";
        
        navigate(`${langPrefix}/book?${params.toString()}`, { replace: true });
      } catch (err) {
        console.error("Error fetching shared link:", err);
        setError("Something went wrong");
        setTimeout(() => navigate("/"), 2000);
      }
    };

    fetchAndRedirect();
  }, [shortCode, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive text-lg mb-2">{error}</p>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading booking...</p>
      </div>
    </div>
  );
};

export default SharedBookingRedirect;
