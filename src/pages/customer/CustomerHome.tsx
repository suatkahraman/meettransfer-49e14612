import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { LogOut, Plane, MapPin, Calendar, User, Phone, Car, CreditCard } from 'lucide-react';
import { z } from 'zod';
import NotificationBell from '@/components/NotificationBell';

const reservationSchema = z.object({
  pickup: z.string().trim().min(2, "Pick-up point must be at least 2 characters").max(200, "Pick-up point is too long"),
  dropoff: z.string().trim().min(2, "Drop-off location must be at least 2 characters").max(200, "Drop-off location is too long"),
  date: z.string().min(1, "Please select a pickup date"),
  time: z.string().min(1, "Please select a pickup time"),
  flightNumber: z.string().trim().max(20, "Flight number is too long").optional().or(z.literal('')),
  passengerName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  passengerPhone: z.string().trim().min(7, "Phone number must be at least 7 digits").max(20, "Phone number is too long").regex(/^[+\d\s\-()]+$/, "Invalid phone number format"),
  vehicleType: z.string().min(1, "Please select a vehicle type"),
  paymentType: z.string().min(1, "Please select a payment type"),
});

// Airports list removed - pickup is now free text

// Vehicle types without prices - prices set by admin
const vehicleTypes = [
  { value: 'mercedes-vito', label: 'Mercedes Vito' },
  { value: 'mercedes-vclass', label: 'Mercedes V-Class' },
  { value: 'maybach', label: 'Maybach' },
  { value: 'minibus', label: 'Minibus' },
];

const paymentTypes = [
  { value: 'cash', label: 'Cash to driver' },
  { value: 'no-cash', label: 'No cash (pre-paid)' },
  { value: 'invoice', label: 'Invoice' },
];

const CustomerHome = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    date: '',
    time: '',
    flightNumber: '',
    passengerName: '',
    passengerPhone: '',
    vehicleType: 'mercedes-vito',
    paymentType: 'cash',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
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
      const { data: insertedReservation, error } = await supabase.from('reservations').insert({
        customer_id: user?.id,
        customer_name: result.data.passengerName.trim(),
        customer_phone: result.data.passengerPhone.trim(),
        pickup: result.data.pickup,
        dropoff: result.data.dropoff.trim(),
        pickup_date: result.data.date,
        pickup_time: result.data.time,
        flight_number: result.data.flightNumber?.trim() || null,
        vehicle_type: result.data.vehicleType,
        price: null, // Price will be set by admin
        price_currency: null, // Currency will be set by admin
        payment_type: result.data.paymentType,
        status: 'pending_price', // New status
      }).select().single();

      if (error) throw error;

      // Notify admin about new reservation
      try {
        const notifyResponse = await supabase.functions.invoke('notify-admin-new-reservation', {
          body: {
            reservation_id: insertedReservation.id,
            customer_name: result.data.passengerName.trim(),
            pickup: result.data.pickup,
            dropoff: result.data.dropoff.trim(),
            pickup_date: result.data.date,
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
      navigate('/customer/bookings');
    } catch (error: any) {
      console.error('Reservation error:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-serif">Meet Transfer</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/customer/bookings')} className="text-primary-foreground hover:bg-primary-foreground/10">
            My Bookings
          </Button>
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-serif flex items-center gap-2">
              <Car className="h-6 w-6" />
              Book Your Transfer
            </CardTitle>
            <CardDescription>
              Submit your transfer details and we'll send you a price for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pick-up Point */}
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

              {/* Drop-off Location */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Drop-off Location
                </Label>
                <Input
                  placeholder="Hotel name or address"
                  value={formData.dropoff}
                  onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                  className={errors.dropoff ? 'border-destructive' : ''}
                  maxLength={200}
                />
                {errors.dropoff && <p className="text-sm text-destructive">{errors.dropoff}</p>}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* Flight Number */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Flight Number
                </Label>
                <Input
                  placeholder="e.g., TK1234"
                  value={formData.flightNumber}
                  onChange={(e) => setFormData({...formData, flightNumber: e.target.value})}
                  maxLength={20}
                />
              </div>

              {/* Passenger Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Passenger Name
                  </Label>
                  <Input
                    placeholder="Full name"
                    value={formData.passengerName}
                    onChange={(e) => setFormData({...formData, passengerName: e.target.value})}
                    className={errors.passengerName ? 'border-destructive' : ''}
                    maxLength={100}
                  />
                  {errors.passengerName && <p className="text-sm text-destructive">{errors.passengerName}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    placeholder="+90 5XX XXX XXXX"
                    value={formData.passengerPhone}
                    onChange={(e) => setFormData({...formData, passengerPhone: e.target.value})}
                    className={errors.passengerPhone ? 'border-destructive' : ''}
                    maxLength={20}
                  />
                  {errors.passengerPhone && <p className="text-sm text-destructive">{errors.passengerPhone}</p>}
                </div>
              </div>

              {/* Vehicle Type - No prices shown */}
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

              {/* Payment Type */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Type
                </Label>
                <RadioGroup value={formData.paymentType} onValueChange={(v) => setFormData({...formData, paymentType: v})}>
                  {paymentTypes.map(payment => (
                    <div key={payment.value} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value={payment.value} id={payment.value} />
                      <Label htmlFor={payment.value} className="cursor-pointer">{payment.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Info message instead of price */}
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-muted-foreground">
                  After submitting, our team will review your request and send you a price for approval.
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Booking Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerHome;