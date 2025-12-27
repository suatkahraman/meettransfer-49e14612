import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Phone, Mail, MapPin, Calendar, Clock, Car, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { z } from "zod";

// Password format: 1 uppercase, 1 lowercase, at least 4 digits (e.g., Ab2215)
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(100)
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/\d.*\d.*\d.*\d/, 'Password must contain at least 4 digits');

const customerInfoSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().min(7, "Phone number must be at least 7 digits").max(20).regex(/^[+\d\s\-()]+$/, "Invalid phone format"),
  email: z.string().trim().email("Invalid email address").max(255),
  password: passwordSchema,
});

const vehicleLabels: Record<string, string> = {
  "mercedes-vito": "Mercedes Vito",
  "mercedes-vclass": "VIP Vito",
  maybach: "Maybach Minivan",
  minibus: "Minibus",
};

export default function QuickBookingCustomerInfo() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reservationId = searchParams.get("reservationId") || "";
  const reservationCode = searchParams.get("reservationCode") || "";
  const returnReservationCode = searchParams.get("returnReservationCode") || "";

  const [reservationData, setReservationData] = useState<{
    pickup: string;
    dropoff: string;
    pickup_date: string;
    pickup_time: string;
    vehicle_type: string;
    price: number | null;
    price_currency: string;
    prefilled_email?: string | null;
    prefilled_phone?: string | null;
    prefilled_name?: string | null;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (reservationId) {
      fetchReservation();
    } else {
      setLoading(false);
    }
  }, [reservationId]);

  // Auto-redirect after successful submission
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        navigate("/customer/bookings");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted, navigate]);

  const fetchReservation = async () => {
    try {
      // Use edge function to bypass RLS (reservation has null customer_id at this point)
      const { data: result, error } = await supabase.functions.invoke(
        "get-quick-booking-reservation",
        {
          body: { reservationId },
        }
      );

      if (error) throw error;
      if (!result.success) {
        if (result.error === "Reservation not found") {
          toast.error("Reservation not found");
          navigate("/");
          return;
        }
        throw new Error(result.error || "Failed to load reservation");
      }

      const data = result.reservation;

      // Check if already filled
      if (data.status !== "pending_customer_info") {
        toast.info("This reservation has already been completed");
        navigate("/customer/bookings");
        return;
      }

      setReservationData(data);
      
      // Pre-fill form with customer info from quick booking
      if (data.prefilled_email || data.prefilled_phone || data.prefilled_name) {
        setFormData(prev => ({
          ...prev,
          name: data.prefilled_name || "",
          email: data.prefilled_email || "",
          phone: data.prefilled_phone || "",
        }));
      }
    } catch (err: any) {
      console.error("Fetch reservation error:", err);
      toast.error("Failed to load reservation");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = customerInfoSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    setSubmitting(true);

    try {
      // Call edge function to update reservation with customer info and create account
      const { data, error } = await supabase.functions.invoke(
        "update-quick-booking-customer",
        {
          body: {
            reservationId,
            customerName: formData.name.trim(),
            customerPhone: formData.phone.trim(),
            customerEmail: formData.email.trim(),
            customerPassword: formData.password,
            returnReservationCode: returnReservationCode || null,
          },
        }
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to update reservation");

      // Sign in the user with their new credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (signInError) {
        console.error("Auto sign-in error:", signInError);
        // Still show success, user can login manually
      }

      setSubmitted(true);
      toast.success("Account created and booking confirmed!");
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || "Failed to save your information");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-4">
              Thank you, {formData.name}! Your transfer has been confirmed.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Reservation Code: <span className="font-mono font-bold text-foreground">{reservationCode}</span>
            </p>

            {reservationData && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup</p>
                    <p className="font-medium">{reservationData.pickup}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dropoff</p>
                    <p className="font-medium">{reservationData.dropoff}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{format(parseISO(reservationData.pickup_date), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{reservationData.pickup_time}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-6">
              A confirmation email has been sent to <span className="font-medium">{formData.email}</span>
            </p>

            <Button 
              onClick={() => navigate("/customer/bookings")} 
              className="w-full"
              size="lg"
            >
              View My Reservations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Booking</CardTitle>
          <CardDescription>
            Please provide your contact information to finalize your transfer reservation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Reservation Summary */}
          {reservationData && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="font-medium truncate">{reservationData.pickup}</p>
                  <p className="text-sm text-muted-foreground">→ {reservationData.dropoff}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(parseISO(reservationData.pickup_date), "dd/MM")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{reservationData.pickup_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span>{vehicleLabels[reservationData.vehicle_type] || reservationData.vehicle_type}</span>
                </div>
              </div>
              {reservationData.price && (
                <div className="pt-2 border-t border-border">
                  <p className="text-lg font-bold text-primary">
                    {reservationData.price} {reservationData.price_currency}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Customer Info Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+90 555 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Create Password *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              <p className="text-xs text-muted-foreground">
                1 uppercase, 1 lowercase, 4+ digits (e.g., Ab2215)
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account & Confirming...
                </>
              ) : (
                "Create Account & Confirm Booking"
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Your driver will contact you before pickup. You will receive a confirmation email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
