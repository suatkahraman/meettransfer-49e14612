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
  specialRequests: z.string().max(1000).optional()
});
export const BookingForm = () => {
  const [passengers, setPassengers] = useState(2);
  const [bookingType, setBookingType] = useState("airport");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    user
  } = useAuth();
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
        specialRequests: formData.get('requests') as string
      };
      const validation = bookingSchema.parse(bookingData);
      const {
        error
      } = await supabase.from('bookings').insert({
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
        special_requests: validation.specialRequests || null
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
  return <section className="py-16 px-4 -mt-20 relative z-20">
      
    </section>;
};