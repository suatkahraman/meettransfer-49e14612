import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Phone, Mail, MapPin, Calendar, Clock, Car, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
  "mercedes-vito": "Mercedes-vito",
  "vip-mercedes": "Vip Mercedes",
  "maybach-minibus": "Maybach Minibus",
  minibus: "Minibus",
  // Legacy support
  "mercedes-vclass": "Vip Mercedes",
  maybach: "Maybach Minibus",
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
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleSignIn = async () => {
    if (!reservationId) return;
    
    setGoogleLoading(true);
    try {
      // Store reservation info in sessionStorage for after OAuth callback
      sessionStorage.setItem('quickBookingReservationId', reservationId);
      sessionStorage.setItem('quickBookingReservationCode', reservationCode);
      if (returnReservationCode) {
        sessionStorage.setItem('quickBookingReturnReservationCode', returnReservationCode);
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/quick-booking/customer-info?reservationId=${reservationId}&reservationCode=${reservationCode}${returnReservationCode ? `&returnReservationCode=${returnReservationCode}` : ''}&googleAuth=true`,
        },
      });
      
      if (error) throw error;
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      toast.error("Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  // Handle Google OAuth callback
  useEffect(() => {
    const isGoogleAuth = searchParams.get("googleAuth") === "true";
    if (!isGoogleAuth || !reservationId) return;
    
    const handleGoogleAuthComplete = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Authentication failed. Please try again.");
          return;
        }
        
        // Get user metadata from Google
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        const userEmail = user.email || "";
        const userPhone = user.user_metadata?.phone || user.phone || "";
        
        // If phone is missing, pre-fill form and let user enter phone
        if (!userPhone) {
          setFormData(prev => ({
            ...prev,
            name: userName,
            email: userEmail,
            phone: "",
          }));
          setNeedsPhoneFromGoogle(true);
          setGoogleUserId(user.id);
          toast.info("Please enter your phone number to complete booking");
          return;
        }
        
        // Phone exists, proceed with booking
        setSubmitting(true);
        const { data, error } = await supabase.functions.invoke(
          "update-quick-booking-customer",
          {
            body: {
              reservationId,
              customerName: userName,
              customerPhone: userPhone,
              customerEmail: userEmail,
              customerId: user.id,
              returnReservationCode: returnReservationCode || null,
              isGoogleAuth: true,
            },
          }
        );
        
        if (error) throw error;
        if (!data.success) throw new Error(data.error || "Failed to update reservation");
        
        setFormData(prev => ({
          ...prev,
          name: userName,
          email: userEmail,
          phone: userPhone,
        }));
        
        setSubmitted(true);
        toast.success("Booking confirmed with your Google account!");
        
        // Clean up session storage
        sessionStorage.removeItem('quickBookingReservationId');
        sessionStorage.removeItem('quickBookingReservationCode');
        sessionStorage.removeItem('quickBookingReturnReservationCode');
      } catch (err: any) {
        console.error("Google auth complete error:", err);
        toast.error(err.message || "Failed to complete booking with Google account");
      } finally {
        setSubmitting(false);
      }
    };
    
    handleGoogleAuthComplete();
  }, [searchParams, reservationId]);

  // State for Google auth phone requirement
  const [needsPhoneFromGoogle, setNeedsPhoneFromGoogle] = useState(false);
  const [googleUserId, setGoogleUserId] = useState<string | null>(null);

  // Handle phone submission for Google users without phone
  const handleGooglePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || formData.phone.length < 7) {
      setErrors({ phone: "Phone number is required" });
      return;
    }
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "update-quick-booking-customer",
        {
          body: {
            reservationId,
            customerName: formData.name,
            customerPhone: formData.phone.trim(),
            customerEmail: formData.email,
            customerId: googleUserId,
            returnReservationCode: returnReservationCode || null,
            isGoogleAuth: true,
          },
        }
      );
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to update reservation");
      
      setSubmitted(true);
      toast.success("Booking confirmed!");
      
      sessionStorage.removeItem('quickBookingReservationId');
      sessionStorage.removeItem('quickBookingReservationCode');
      sessionStorage.removeItem('quickBookingReturnReservationCode');
    } catch (err: any) {
      console.error("Phone submit error:", err);
      toast.error(err.message || "Failed to complete booking");
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

  // Phone number required for Google auth users
  if (needsPhoneFromGoogle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Phone Number Required</CardTitle>
            <CardDescription>
              Welcome {formData.name}! Please enter your phone number to complete your booking.
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
              </div>
            )}

            <form onSubmit={handleGooglePhoneSubmit} className="space-y-4">
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

              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{formData.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Mail className="h-4 w-4" />
                  <span>{formData.email}</span>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </form>
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

          {/* Google Sign In Option */}
          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-medium border-2 hover:bg-muted/50"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || submitting}
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or fill in manually
            </span>
          </div>

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
