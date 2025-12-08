import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, Car, Phone, User, Check, X, Plane } from 'lucide-react';
import { format } from 'date-fns';

interface Reservation {
  id: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  price: number | null;
  status: string;
  driver_id: string | null;
  drivers?: {
    name: string;
    phone: string;
  } | null;
}

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-orange-500/20 text-orange-700',
  'awaiting-customer': 'bg-purple-500/20 text-purple-700',
  'confirmed': 'bg-blue-500/20 text-blue-700',
  'assigned': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
  'cancelled': 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, string> = {
  'awaiting-price': 'Awaiting Price',
  'awaiting-customer': 'Price Ready - Your Approval Needed',
  'confirmed': 'Confirmed',
  'assigned': 'Driver Assigned',
  'active': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
};

const CustomerReservationDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchReservation = async () => {
      if (!id || !user) return;

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          drivers (name, phone)
        `)
        .eq('id', id)
        .eq('customer_id', user.id)
        .single();

      if (error) {
        toast.error('Reservation not found');
        navigate('/customer/bookings');
        return;
      }

      setReservation(data);
      setLoading(false);
    };

    fetchReservation();
  }, [id, user, navigate]);

  const handleAcceptPrice = async () => {
    if (!reservation) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', reservation.id);

      if (error) throw error;

      // Notify admin
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'price_accepted',
            title: 'Customer Accepted Price',
            message: `Reservation #${reservation.id.slice(0, 8)} is confirmed. Price: ₺${reservation.price}`,
            notify_admins: true,
            reservation_id: reservation.id,
          }
        });
      } catch (e) {
        console.error('Failed to notify admin:', e);
      }

      toast.success('Price accepted! Your transfer is confirmed.');
      setReservation({ ...reservation, status: 'confirmed' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept price');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPrice = async () => {
    if (!reservation) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservation.id);

      if (error) throw error;

      // Notify admin
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'price_rejected',
            title: 'Customer Declined Price',
            message: `Reservation #${reservation.id.slice(0, 8)} was declined by customer.`,
            notify_admins: true,
            reservation_id: reservation.id,
          }
        });
      } catch (e) {
        console.error('Failed to notify admin:', e);
      }

      toast.success('Reservation cancelled.');
      setReservation({ ...reservation, status: 'cancelled' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel reservation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!reservation) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/customer/bookings')} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif">Reservation Details</h1>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">Transfer Details</CardTitle>
              <Badge className={statusColors[reservation.status] || 'bg-muted'}>
                {statusLabels[reservation.status] || reservation.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date & Time */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {format(new Date(reservation.pickup_date), 'PPP')}
              </span>
              <Clock className="h-5 w-5 text-muted-foreground ml-4" />
              <span>{reservation.pickup_time}</span>
            </div>

            {/* Route */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">Pickup</div>
                  <div className="font-medium">{reservation.pickup}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-destructive mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">Drop-off</div>
                  <div className="font-medium">{reservation.dropoff}</div>
                </div>
              </div>
            </div>

            {/* Flight & Vehicle */}
            <div className="flex items-center justify-between py-4 border-t border-b">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{reservation.flight_number || 'No flight info'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{reservation.vehicle_type}</span>
              </div>
            </div>

            {/* Price Section */}
            {reservation.price !== null && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Price</span>
                  <span className="font-bold text-primary text-2xl">₺{reservation.price}</span>
                </div>
              </div>
            )}

            {/* Awaiting Price Message */}
            {reservation.status === 'awaiting-price' && (
              <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg text-center">
                <p className="text-orange-700 dark:text-orange-300">
                  Our team is reviewing your request. You will receive a notification when the price is ready.
                </p>
              </div>
            )}

            {/* Customer Approval Section */}
            {reservation.status === 'awaiting-customer' && (
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg text-center">
                  <p className="text-purple-700 dark:text-purple-300 mb-2">
                    Please review the price and confirm your booking
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={handleRejectPrice} 
                    variant="outline" 
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    disabled={actionLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                  <Button 
                    onClick={handleAcceptPrice}
                    disabled={actionLoading}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept Price
                  </Button>
                </div>
              </div>
            )}

            {/* Driver Info */}
            {reservation.drivers && (reservation.status === 'assigned' || reservation.status === 'active') && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm font-medium mb-3">Your Driver</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{reservation.drivers.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${reservation.drivers.phone}`} className="text-primary">
                      {reservation.drivers.phone}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Completed Message */}
            {reservation.status === 'completed' && (
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg text-center">
                <p className="text-green-700 dark:text-green-300">
                  Thank you for choosing Meet Transfer! We hope you had a great experience.
                </p>
              </div>
            )}

            {/* Cancelled Message */}
            {reservation.status === 'cancelled' && (
              <div className="bg-destructive/10 p-4 rounded-lg text-center">
                <p className="text-destructive">
                  This reservation has been cancelled.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerReservationDetail;