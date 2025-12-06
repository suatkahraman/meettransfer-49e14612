import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { LogOut, Plane, MapPin, Calendar, User, Phone, Car, CreditCard } from 'lucide-react';

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
  { value: 'mercedes-vito', label: 'Mercedes Vito', price: 80 },
  { value: 'mercedes-vclass', label: 'Mercedes V-Class', price: 120 },
  { value: 'maybach', label: 'Maybach', price: 250 },
  { value: 'minibus', label: 'Minibus', price: 150 },
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

  const selectedVehicle = vehicleTypes.find(v => v.value === formData.vehicleType);
  const price = selectedVehicle?.price || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from('reservations').insert({
        customer_id: user?.id,
        customer_name: formData.passengerName,
        customer_phone: formData.passengerPhone,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        pickup_date: formData.date,
        pickup_time: formData.time,
        flight_number: formData.flightNumber,
        vehicle_type: formData.vehicleType,
        price: price,
        payment_type: formData.paymentType,
        status: 'new',
      });

      if (error) throw error;

      toast.success('Booking created successfully!');
      navigate('/customer/bookings');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-serif">Meet Transfer</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/customer/bookings')} className="text-primary-foreground hover:bg-primary-foreground/10">
            My Bookings
          </Button>
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
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pickup Airport */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Pickup Airport
                </Label>
                <Select value={formData.pickup} onValueChange={(v) => setFormData({...formData, pickup: v})}>
                  <SelectTrigger>
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
                  required
                />
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
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
                    required
                  />
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
                    required
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicle Type
                </Label>
                <RadioGroup value={formData.vehicleType} onValueChange={(v) => setFormData({...formData, vehicleType: v})}>
                  {vehicleTypes.map(vehicle => (
                    <div key={vehicle.value} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={vehicle.value} id={vehicle.value} />
                        <Label htmlFor={vehicle.value} className="cursor-pointer">{vehicle.label}</Label>
                      </div>
                      <span className="font-semibold text-primary">€{vehicle.price}</span>
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

              {/* Price Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Total Price:</span>
                  <span className="font-bold text-primary text-2xl">€{price}</span>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Booking...' : 'Book Transfer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerHome;
