import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// This page now redirects to QuickBookingConfirm which handles everything
export default function QuickBookingCustomerInfo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const bookingId = searchParams.get("bookingId");
    
    // Redirect to the combined confirm page
    if (token) {
      navigate(`/quick-booking-confirm?token=${token}`, { replace: true });
    } else if (bookingId) {
      // Try to get token from booking
      navigate(`/`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
