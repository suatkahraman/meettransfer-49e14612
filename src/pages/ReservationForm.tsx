import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Plane, MapPin, Calendar, User, Phone, Car, Mail, Lock, CheckCircle, ClipboardList } from 'lucide-react';
import { z } from 'zod';

const reservationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().min(7, "Phone number must be at least 7 digits").max(20).regex(/^[+\d\s\-()]+$/, "Invalid phone format"),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100).optional(),
  pickup: z.string().trim().min(2, "Pick-up point must be at least 2 characters").max(200, "Pick-up point is too long"),
  dropoff: z.string().trim().min(2, "Drop-off location is required").max(200),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
  flightNumber: z.string().trim().max(20).optional().or(z.literal('')),
  vehicleType: z.string().min(1, "Please select a vehicle type"),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

// Airports list removed - pickup is now free text

const vehicleTypes = [
  { value: 'mercedes-vito', label: 'Mercedes Vito' },
  { value: 'mercedes-vclass', label: 'Mercedes V-Class' },
  { value: 'maybach', label: 'Maybach' },
  { value: 'minibus', label: 'Minibus' },
];

const ReservationForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    pickup: '',
    dropoff: '',
    date: '',
    time: '',
    flightNumber: '',
    vehicleType: 'mercedes-vito',
    notes: '',
  });

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        name: user.user_metadata?.full_name || '',
      }));
      
      // Fetch profile for phone
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setFormData(prev => ({
            ...prev,
            name: data.full_name || prev.name,
            phone: data.phone || '',
          }));
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate - password only required if not logged in
    const schemaToUse = isLoggedIn 
      ? reservationSchema.omit({ password: true })
      : reservationSchema.extend({ password: z.string().min(6, "Password must be at least 6 characters") });

    const result = schemaToUse.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Please fix the validation errors');
      return;
    }

    setIsLoading(true);

    try {
      let userId: string;

      if (isLoggedIn && user) {
        // Already logged in, use current user
        userId = user.id;
        
        // Update profile if needed
        await supabase
          .from('profiles')
          .update({ phone: formData.phone.trim(), full_name: formData.name.trim() })
          .eq('id', userId);
      } else {
        // Try to sign up the user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/customer/bookings`,
            data: {
              full_name: formData.name.trim(),
            },
          },
        });

        if (signUpError) {
          // Handle "user already exists" - try to sign in
          if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
            // Try to sign in with provided password
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: formData.email.trim(),
              password: formData.password,
            });

            if (signInError) {
              toast.error('Email already registered. Please use correct password or login separately.');
              setIsLoading(false);
              return;
            }

            if (!signInData.user) {
              toast.error('Failed to sign in. Please try logging in separately.');
              navigate('/auth');
              setIsLoading(false);
              return;
            }

            userId = signInData.user.id;
          } else {
            throw signUpError;
          }
        } else {
          if (!signUpData.user) {
            toast.error('Failed to create account. Please try again.');
            setIsLoading(false);
            return;
          }

          userId = signUpData.user.id;

          // If no session, sign in with the password
          if (!signUpData.session) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: formData.email.trim(),
              password: formData.password,
            });

            if (signInError) {
              if (signInError.message.includes('Email not confirmed')) {
                toast.info('Please check your email to confirm your account, then try again.');
                setIsLoading(false);
                return;
              }
              throw signInError;
            }
          }
        }

        // Update profile with phone
        await supabase
          .from('profiles')
          .update({ phone: formData.phone.trim(), full_name: formData.name.trim() })
          .eq('id', userId);
      }

      // Create reservation with status 'pending_price'
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          customer_id: userId,
          customer_name: formData.name.trim(),
          customer_phone: formData.phone.trim(),
          pickup: formData.pickup,
          dropoff: formData.dropoff.trim(),
          pickup_date: formData.date,
          pickup_time: formData.time,
          flight_number: formData.flightNumber?.trim() || null,
          vehicle_type: formData.vehicleType,
          payment_type: 'cash',
          status: 'pending_price',
          price: null,
          price_currency: null,
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Notify admin about new reservation
      try {
        const notifyResponse = await supabase.functions.invoke('notify-admin-new-reservation', {
          body: {
            reservation_id: reservation.id,
            customer_name: formData.name.trim(),
            pickup: formData.pickup,
            dropoff: formData.dropoff.trim(),
            pickup_date: formData.date,
          }
        });
        
        if (notifyResponse.error) {
          console.error('Admin notification error:', notifyResponse.error);
        }
      } catch (notifyError) {
        console.error('Failed to notify admin:', notifyError);
        // Don't block the user - reservation was created successfully
      }

      toast.success('Reservation submitted! We will contact you with pricing.');
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Reservation error:', error);
      toast.error(error.message || 'Failed to submit reservation');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/80 to-primary/60 py-8 px-4">
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-semibold">Reservation Submitted!</h2>
              <p className="text-muted-foreground">
                Thank you for your request. Our team will review it and send you the price for approval.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg text-left space-y-2">
              <p className="text-sm"><strong>Route:</strong> {formData.pickup} → {formData.dropoff}</p>
              <p className="text-sm"><strong>Date:</strong> {formData.date} at {formData.time}</p>
              <p className="text-sm"><strong>Vehicle:</strong> {vehicleTypes.find(v => v.value === formData.vehicleType)?.label}</p>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                onClick={() => navigate('/customer/reservations')} 
                className="w-full" 
                size="lg"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                My Reservations
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    password: '',
                    pickup: '',
                    dropoff: '',
                    date: '',
                    time: '',
                    flightNumber: '',
                    vehicleType: 'mercedes-vito',
                    notes: '',
                  });
                }} 
                className="w-full"
              >
                Book Another Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/80 to-primary/60 py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-serif">Meet Transfer</CardTitle>
          <CardDescription>Book your airport transfer - we'll send you the price for approval</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Section */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-semibold text-lg">Your Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={errors.name ? 'border-destructive' : ''}
                    maxLength={100}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    placeholder="+90 5XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={errors.phone ? 'border-destructive' : ''}
                    maxLength={20}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={errors.email ? 'border-destructive' : ''}
                  maxLength={255}
                  disabled={isLoggedIn}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {/* Password field - only show if not logged in */}
              {!isLoggedIn && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={errors.password ? 'border-destructive' : ''}
                    maxLength={100}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  <p className="text-xs text-muted-foreground">
                    This will create your account so you can track your reservations
                  </p>
                </div>
              )}

              {isLoggedIn && (
                <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg text-sm text-green-700 dark:text-green-300">
                  Logged in as {formData.email}
                </div>
              )}
            </div>

            {/* Transfer Details Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Transfer Details</h3>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Pick-up Point
                </Label>
                <Input
                  placeholder="Enter Pick-up Point"
                  value={formData.pickup}
                  onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                  className={errors.pickup ? 'border-destructive' : ''}
                  maxLength={200}
                />
                {errors.pickup && <p className="text-sm text-destructive">{errors.pickup}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Drop-off Location
                </Label>
                <Input
                  placeholder="Hotel name or full address"
                  value={formData.dropoff}
                  onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                  className={errors.dropoff ? 'border-destructive' : ''}
                  maxLength={200}
                />
                {errors.dropoff && <p className="text-sm text-destructive">{errors.dropoff}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={errors.date ? 'border-destructive' : ''}
                  />
                  {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className={errors.time ? 'border-destructive' : ''}
                  />
                  {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Flight
                  </Label>
                  <Input
                    placeholder="TK1234"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({...formData, flightNumber: e.target.value})}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicle Type
                </Label>
                <RadioGroup value={formData.vehicleType} onValueChange={(v) => setFormData({...formData, vehicleType: v})}>
                  {vehicleTypes.map(vehicle => (
                    <div key={vehicle.value} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value={vehicle.value} id={vehicle.value} />
                      <Label htmlFor={vehicle.value} className="cursor-pointer flex-1">{vehicle.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Special requests, number of luggage, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                After submitting, our team will review your request and send you the price for approval.
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Reservation Request'}
            </Button>

            {!isLoggedIn && (
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <a href="/auth" className="text-primary hover:underline">Login here</a>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationForm;
