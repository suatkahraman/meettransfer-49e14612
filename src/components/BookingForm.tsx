import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, Car, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const bookingSchema = z.object({
  pickupLocation: z.string().min(2).max(200),
  dropoffLocation: z.string().max(200).optional(),
  passengers: z.number().min(1).max(50),
  vehicleType: z.string().min(1),
  passengerName: z.string().min(2).max(100),
  passengerEmail: z.string().email().max(255),
  passengerPhone: z.string().min(10).max(20),
  flightNumber: z.string().max(20).optional(),
  specialRequests: z.string().max(1000).optional(),
});

export const BookingForm = () => {
  const [passengers, setPassengers] = useState(2);
  const [bookingType, setBookingType] = useState("airport");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to make a booking");
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const bookingData = {
        pickupLocation: formData.get('from') as string,
        dropoffLocation: formData.get('to') as string,
        passengers: parseInt(formData.get('passengers') as string),
        vehicleType: formData.get('vehicle') as string,
        passengerName: formData.get('name') as string,
        passengerEmail: formData.get('email') as string,
        passengerPhone: formData.get('phone') as string,
        flightNumber: formData.get('flight') as string,
        specialRequests: formData.get('requests') as string,
      };

      const validation = bookingSchema.parse(bookingData);

      const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        booking_type: bookingType,
        pickup_location: validation.pickupLocation,
        dropoff_location: validation.dropoffLocation || null,
        pickup_date: formData.get('date') as string,
        pickup_time: formData.get('time') as string,
        passengers: validation.passengers,
        vehicle_type: validation.vehicleType,
        passenger_name: validation.passengerName,
        passenger_email: validation.passengerEmail,
        passenger_phone: validation.passengerPhone,
        flight_number: validation.flightNumber || null,
        duration_hours: bookingType === 'hourly' ? parseInt(formData.get('hours') as string) : null,
        special_requests: validation.specialRequests || null,
      });

      if (error) throw error;

      toast.success("Booking created successfully!");
      navigate('/bookings');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error("Please check all required fields");
      } else {
        console.error('Booking error:', error);
        toast.error("Failed to create booking. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 px-4 -mt-20 relative z-20">
      <div className="container max-w-5xl mx-auto">
        <Card className="p-6 md:p-8 shadow-2xl border-0 bg-card backdrop-blur-sm">
          <Tabs value={bookingType} onValueChange={setBookingType} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12 bg-muted/50">
              <TabsTrigger value="airport" className="text-base font-semibold">
                Airport Transfer
              </TabsTrigger>
              <TabsTrigger value="hourly" className="text-base font-semibold">
                Hourly Booking
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="airport" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="from" className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      From
                    </Label>
                    <Input
                      id="from"
                      name="from"
                      placeholder="Airport or Address"
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="to" className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      To
                    </Label>
                    <Input
                      id="to"
                      name="to"
                      placeholder="Hotel or Destination"
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flight" className="text-sm font-semibold">
                      Flight Code
                    </Label>
                    <Input
                      id="flight"
                      name="flight"
                      placeholder="e.g. TK1234"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Pickup Date
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Pickup Time
                    </Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle" className="text-sm font-semibold flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      Vehicle
                    </Label>
                    <Select name="vehicle" defaultValue="standard" required>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Van - 7 passengers</SelectItem>
                        <SelectItem value="firstclass">First Class Van - 7 passengers</SelectItem>
                        <SelectItem value="minibus12">Minibus - 12 passengers</SelectItem>
                        <SelectItem value="minibus16">Minibus - 16 passengers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passengers" className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Passengers
                    </Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                      >
                        -
                      </Button>
                      <Input
                        id="passengers"
                        name="passengers"
                        type="number"
                        value={passengers}
                        onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                        className="h-11 text-center"
                        min="1"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => setPassengers(passengers + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">
                      Passenger Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Full Name"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+90 555 123 4567"
                      className="h-11"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold" variant="premium" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Request Booking"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="hourly" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="hourly-date" className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Date
                    </Label>
                    <Input
                      id="hourly-date"
                      name="date"
                      type="date"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Start Time
                    </Label>
                    <Input
                      id="start-time"
                      name="time"
                      type="time"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from-hourly" className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Pickup Location
                    </Label>
                    <Input
                      id="from-hourly"
                      name="from"
                      placeholder="Starting point"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourly-vehicle" className="text-sm font-semibold flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      Vehicle
                    </Label>
                    <Select name="vehicle" defaultValue="standard" required>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Van</SelectItem>
                        <SelectItem value="firstclass">First Class Van</SelectItem>
                        <SelectItem value="minibus12">Minibus 12-Seater</SelectItem>
                        <SelectItem value="minibus16">Minibus 16-Seater</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours" className="text-sm font-semibold">Hours</Label>
                    <Select name="hours" defaultValue="2" required>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="8">8 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourly-name" className="text-sm font-semibold">
                      Passenger Name
                    </Label>
                    <Input
                      id="hourly-name"
                      name="name"
                      placeholder="Full Name"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourly-email" className="text-sm font-semibold">
                      Email
                    </Label>
                    <Input
                      id="hourly-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourly-phone" className="text-sm font-semibold">
                      Phone
                    </Label>
                    <Input
                      id="hourly-phone"
                      name="phone"
                      type="tel"
                      placeholder="+90 555 123 4567"
                      className="h-11"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold" variant="premium" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Request Booking"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </TabsContent>
            </form>
          </Tabs>
        </Card>
      </div>
    </section>
  );
};