import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Plane, MapPin, Calendar, User, Phone, Car, Mail } from 'lucide-react';
import { z } from 'zod';

const reservationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().min(7, "Phone number must be at least 7 digits").max(20).regex(/^[+\d\s\-()]+$/, "Invalid phone format"),
  email: z.string().trim().email("Invalid email address").max(255),
  pickup: z.string().min(1, "Please select a pickup airport"),
  dropoff: z.string().trim().min(2, "Drop-off location is required").max(200),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
  flightNumber: z.string().trim().max(20).optional().or(z.literal('')),
  vehicleType: z.string().min(1, "Please select a vehicle type"),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

const airports = [
  { code: 'IST', name: 'Istanbul Airport' },
  { code: 'SAW', name: 'Sabiha Gökçen Airport' },
  { code: 'AYT', name: 'Antalya Airport' },
  { code: 'BJV', name: 'Bodrum Milas Airport' },
  { code: 'DLM', name: 'Dalaman Airport' },
  { code: 'ASR', name: 'Kayseri Airport' },
  { code: 'NAV', name: 'Nevşehir Airport' },
  { code: 'ADB', name: 'Izmir Adnan Menderes Airport' },
];

const vehicleTypes = [
  { value: 'mercedes-vito', label: 'Mercedes Vito' },
  { value: 'mercedes-vclass', label: 'Mercedes V-Class' },
  { value: 'maybach', label: 'Maybach' },
  { value: 'minibus', label: 'Minibus' },
];

const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const ReservationForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    pickup: '',
    dropoff: '',
    date: '',
    time: '',
    flightNumber: '',
    vehicleType: 'mercedes-vito',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = reservationSchema.safeParse(formData);
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

      // Step 1: Try to sign up the user (checks if email exists)
      const randomPassword = generateRandomPassword();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: result.data.email,
        password: randomPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/customer/bookings`,
          data: {
            full_name: result.data.name,
          },
        },
      });

      if (signUpError) {
        // User already exists - we need to handle this case
        if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
          // User exists, try to sign in with a magic link or redirect to login
          toast.error('This email is already registered. Please login to make a reservation.');
          navigate('/auth');
          setIsLoading(false);
          return;
        }
        throw signUpError;
      }

      // Check if user was created or if it's a duplicate (signUp returns user even for existing unconfirmed)
      if (!signUpData.user) {
        toast.error('Failed to create account. Please try again.');
        setIsLoading(false);
        return;
      }

      userId = signUpData.user.id;

      // If user was just created, sign them in immediately (auto-confirm is enabled)
      if (signUpData.session) {
        // User is already signed in from signup
      } else {
        // Try to sign in with the generated password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: result.data.email,
          password: randomPassword,
        });

        if (signInError) {
          // If sign in fails, user might need email confirmation or already exists
          if (signInError.message.includes('Email not confirmed')) {
            toast.info('Please check your email to confirm your account, then try again.');
            setIsLoading(false);
            return;
          }
          // User might already exist with different password
          toast.error('This email is already registered. Please login to make a reservation.');
          navigate('/auth');
          setIsLoading(false);
          return;
        }
      }

      // Update profile with phone number
      await supabase
        .from('profiles')
        .update({ phone: result.data.phone, full_name: result.data.name })
        .eq('id', userId);

      // Step 2: Create reservation with status 'awaiting-price'
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          customer_id: userId,
          customer_name: result.data.name.trim(),
          customer_phone: result.data.phone.trim(),
          pickup: result.data.pickup,
          dropoff: result.data.dropoff.trim(),
          pickup_date: result.data.date,
          pickup_time: result.data.time,
          flight_number: result.data.flightNumber?.trim() || null,
          vehicle_type: result.data.vehicleType,
          payment_type: 'cash',
          status: 'awaiting-price',
          price: null,
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Step 3: Notify admin about new reservation
      try {
        await supabase.functions.invoke('notify-admin-new-reservation', {
          body: {
            reservation_id: reservation.id,
            customer_name: result.data.name.trim(),
            pickup: result.data.pickup,
            dropoff: result.data.dropoff.trim(),
            pickup_date: result.data.date,
            needs_pricing: true,
          }
        });
      } catch (notifyError) {
        console.error('Failed to notify admin:', notifyError);
      }

      toast.success('Reservation submitted! We will contact you with pricing.');
      navigate('/customer/bookings');
    } catch (error: any) {
      console.error('Reservation error:', error);
      toast.error(error.message || 'Failed to submit reservation');
    } finally {
      setIsLoading(false);
    }
  };

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
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            </div>

            {/* Transfer Details Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Transfer Details</h3>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Pickup Airport
                </Label>
                <Select value={formData.pickup} onValueChange={(v) => setFormData({...formData, pickup: v})}>
                  <SelectTrigger className={errors.pickup ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select airport" />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map(airport => (
                      <SelectItem key={airport.code} value={airport.code}>
                        {airport.code} - {airport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/auth" className="text-primary hover:underline">Login here</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationForm;
