import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Plane, MapPin, Calendar, User, Phone, Car, Mail, Lock, CheckCircle, ClipboardList, Users, Trash2, UserPlus, CreditCard, Banknote } from 'lucide-react';
import { z } from 'zod';

const reservationSchema = z.object({
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
  paymentMethod: z.enum(['payment_link', 'cash'], { required_error: "Please select a payment option" }),
});

const MAX_PASSENGERS = 15;

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
  const { emailAdminNewReservation } = useEmailNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);
  const [formData, setFormData] = useState({
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
    paymentMethod: '' as 'payment_link' | 'cash' | '',
  });

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
      }));
      
      // Set primary passenger name from user metadata
      if (user.user_metadata?.full_name) {
        setPassengerNames([user.user_metadata.full_name]);
      }
      
      // Fetch profile for phone
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();
        
        if (data) {
          if (data.full_name) {
            setPassengerNames([data.full_name]);
          }
          setFormData(prev => ({
            ...prev,
            phone: data.phone || '',
          }));
        }
      };
      fetchProfile();
    }
  }, [user]);

  const addPassenger = () => {
    if (passengerNames.length < MAX_PASSENGERS) {
      setPassengerNames([...passengerNames, '']);
    }
  };

  const removePassenger = (index: number) => {
    if (passengerNames.length > 1) {
      setPassengerNames(passengerNames.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index: number, value: string) => {
    const updated = [...passengerNames];
    updated[index] = value;
    setPassengerNames(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate passenger names
    const validPassengerNames = passengerNames.filter(name => name.trim() !== '');
    if (validPassengerNames.length === 0) {
      setErrors({ passengerNames: 'At least one passenger name is required' });
      toast.error('Please enter at least one passenger name');
      return;
    }

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
      const primaryPassengerName = validPassengerNames[0].trim();

      if (isLoggedIn && user) {
        // Already logged in, use current user
        userId = user.id;
        
        // Update profile if needed
        await supabase
          .from('profiles')
          .update({ phone: formData.phone.trim(), full_name: primaryPassengerName })
          .eq('id', userId);
      } else {
        // Try to sign up the user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/customer/bookings`,
            data: {
              full_name: primaryPassengerName,
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
          .update({ phone: formData.phone.trim(), full_name: primaryPassengerName })
          .eq('id', userId);
      }

      // Create reservation with status 'pending_price'
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          customer_id: userId,
          customer_name: primaryPassengerName,
          customer_phone: formData.phone.trim(),
          passenger_names: validPassengerNames.map(n => n.trim()),
          pickup: formData.pickup,
          dropoff: formData.dropoff.trim(),
          pickup_date: formData.date,
          pickup_time: formData.time,
          flight_number: formData.flightNumber?.trim() || null,
          vehicle_type: formData.vehicleType,
          payment_type: formData.paymentMethod,
          status: 'pending_price',
          price: null,
          price_currency: null,
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Notify admin about new reservation (in-app notification)
      try {
        const notifyResponse = await supabase.functions.invoke('notify-admin-new-reservation', {
          body: {
            reservation_id: reservation.id,
            customer_name: primaryPassengerName,
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
      }

      // Send email notification to admin
      try {
        await emailAdminNewReservation(reservation.id);
      } catch (emailError) {
        console.error('Failed to send admin email:', emailError);
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
                  setPassengerNames(['']);
                  setFormData({
                    phone: formData.phone,
                    email: formData.email,
                    password: '',
                    pickup: '',
                    dropoff: '',
                    date: '',
                    paymentMethod: '',
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
              <h3 className="font-semibold text-lg">Passengers</h3>
              
              {/* Passenger Names - Multiple */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Passenger Names ({passengerNames.length})
                </Label>
                {passengerNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder={index === 0 ? 'Primary Passenger (Name & Surname)' : `Passenger ${index + 1}`}
                        value={name}
                        onChange={(e) => updatePassenger(index, e.target.value)}
                        className={index === 0 && errors.passengerNames ? 'border-destructive' : ''}
                        maxLength={100}
                      />
                    </div>
                    {passengerNames.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removePassenger(index)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {errors.passengerNames && <p className="text-sm text-destructive">{errors.passengerNames}</p>}
                {passengerNames.length < MAX_PASSENGERS && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addPassenger}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Passenger
                  </Button>
                )}
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-semibold text-lg">Contact Information</h3>

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

              {/* Password field and Google login - only show if not logged in */}
              {!isLoggedIn && (
                <>
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

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: `${window.location.origin}/book`,
                        },
                      });
                      if (error) {
                        toast.error('Google sign-in failed');
                      }
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </>
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

              {/* Payment Option Section */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <CreditCard className="h-4 w-4" />
                  Payment Option
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select how you would like to pay for your transfer
                </p>
                <RadioGroup 
                  value={formData.paymentMethod} 
                  onValueChange={(v) => setFormData({...formData, paymentMethod: v as 'payment_link' | 'cash'})}
                >
                  <div className={`flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer ${errors.paymentMethod ? 'border-destructive' : ''}`}>
                    <RadioGroupItem value="payment_link" id="payment_link" />
                    <div className="flex-1">
                      <Label htmlFor="payment_link" className="cursor-pointer font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Payment Link
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        We'll send you a secure payment link via email after confirming the price
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer ${errors.paymentMethod ? 'border-destructive' : ''}`}>
                    <RadioGroupItem value="cash" id="cash" />
                    <div className="flex-1">
                      <Label htmlFor="cash" className="cursor-pointer font-medium flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-600" />
                        Cash to Driver
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pay in cash directly to your driver at the end of your transfer
                      </p>
                    </div>
                  </div>
                </RadioGroup>
                {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod}</p>}
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
