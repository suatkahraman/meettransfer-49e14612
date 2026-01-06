import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { LogOut, Plane, MapPin, Calendar, User, Phone, Car, CreditCard, Users, Trash2, UserPlus } from 'lucide-react';
import { z } from 'zod';
import NotificationBell from '@/components/NotificationBell';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { PhoneInput } from '@/components/ui/phone-input';
const reservationSchema = z.object({
  pickup: z.string().trim().min(2, "Pick-up point must be at least 2 characters").max(200, "Pick-up point is too long"),
  dropoff: z.string().trim().min(2, "Drop-off location must be at least 2 characters").max(200, "Drop-off location is too long"),
  date: z.string().min(1, "Please select a pickup date"),
  time: z.string().min(1, "Please select a pickup time"),
  flightNumber: z.string().trim().max(20, "Flight number is too long").optional().or(z.literal('')),
  passengerPhone: z.string().trim().min(7, "Phone number must be at least 7 digits").max(20, "Phone number is too long").regex(/^[+\d\s\-()]+$/, "Invalid phone number format"),
  vehicleType: z.string().min(1, "Please select a vehicle type"),
  paymentType: z.string().min(1, "Please select a payment type"),
});

// Vehicle types without prices - prices set by admin
const vehicleTypes = [
  { value: 'mercedes-vito', label: 'Mercedes-vito' },
  { value: 'vip-mercedes', label: 'Vip Mercedes' },
  { value: 'maybach-minibus', label: 'Maybach Minibus' },
  { value: 'minibus', label: 'Minibus' },
];

const paymentTypes = [
  { value: 'cash', label: 'Cash to Driver' },
  { value: 'online', label: 'Online Payment Link' },
];

const MAX_PASSENGERS = 15;

const CustomerHome = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    date: '',
    time: '',
    flightNumber: '',
    passengerPhone: '',
    vehicleType: 'mercedes-vito',
    paymentType: 'cash',
  });

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
      setErrors({ passengerNames: t('passengerRequired') });
      toast.error(t('passengerRequired'));
      return;
    }

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
      toast.error(t('fixValidationErrors'));
      return;
    }

    setIsLoading(true);

    try {
      const { data: insertedReservation, error } = await supabase.from('reservations').insert({
        customer_id: user?.id,
        customer_name: validPassengerNames[0].trim(),
        customer_phone: result.data.passengerPhone.trim(),
        passenger_names: validPassengerNames.map(n => n.trim()),
        pickup: result.data.pickup,
        dropoff: result.data.dropoff.trim(),
        pickup_date: result.data.date,
        pickup_time: result.data.time,
        flight_number: result.data.flightNumber?.trim() || null,
        vehicle_type: result.data.vehicleType,
        price: null,
        price_currency: null,
        payment_type: result.data.paymentType,
        status: 'awaiting-price',
      }).select().single();

      if (error) throw error;

      // Notify admin about new reservation
      try {
        const notifyResponse = await supabase.functions.invoke('notify-admin-new-reservation', {
          body: {
            reservation_id: insertedReservation.id,
            customer_name: validPassengerNames[0].trim(),
            pickup: result.data.pickup,
            dropoff: result.data.dropoff.trim(),
            pickup_date: result.data.date,
          }
        });

        if (notifyResponse.error) {
          console.error('Admin notification error:', notifyResponse.error);
          // Don't show error to customer, just log it
        }
      } catch (notifyError) {
        console.error('Failed to notify admin:', notifyError);
        // Don't block the user - reservation was created successfully
      }

      toast.success(t('reservationSubmitted'));
      navigate('/customer/bookings');
    } catch (error: any) {
      console.error('Reservation error:', error);
      toast.error(error.message || t('bookingFailed'));
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
            {t('myBookings')}
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
              {t('bookYourTransfer')}
            </CardTitle>
            <CardDescription>
              {t('submitTransferDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pick-up Point */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('pickupPoint')}
                </Label>
                <GooglePlacesAutocomplete
                  onPlaceSelected={(value) => setFormData((prev) => ({ ...prev, pickup: value }))}
                  placeholder={t('enterPickupPoint')}
                  className={errors.pickup ? 'border-destructive' : ''}
                  maxLength={200}
                />
                {errors.pickup && <p className="text-sm text-destructive">{errors.pickup}</p>}
              </div>

              {/* Drop-off Location */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('dropoffLocation')}
                </Label>
                <GooglePlacesAutocomplete
                  onPlaceSelected={(value) => setFormData((prev) => ({ ...prev, dropoff: value }))}
                  placeholder={t('hotelNameOrAddress')}
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
                    {t('date')}
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.date ? 'border-destructive' : ''}
                  />
                  {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('time')}</Label>
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
                  {t('flightNumberOptional')}
                </Label>
                <Input
                  placeholder={t('flightExample')}
                  value={formData.flightNumber}
                  onChange={(e) => setFormData({...formData, flightNumber: e.target.value})}
                  maxLength={20}
                />
              </div>

              {/* Passenger Names - Multiple */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('passengers')} ({passengerNames.length})
                </Label>
                {passengerNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder={index === 0 ? t('primaryPassenger') : `${t('passenger')} ${index + 1}`}
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
                    {t('addPassenger')}
                  </Button>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('contactPhone')}
                </Label>
                <PhoneInput
                  value={formData.passengerPhone}
                  onChange={(value) => setFormData({...formData, passengerPhone: value})}
                  className={errors.passengerPhone ? 'border-destructive' : ''}
                />
                {errors.passengerPhone && <p className="text-sm text-destructive">{errors.passengerPhone}</p>}
              </div>

              {/* Vehicle Type - No prices shown */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  {t('vehicleType')}
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
                  {t('paymentType')}
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
                  {t('priceApprovalMessage')}
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? t('submitting') : t('submitBookingRequest')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerHome;