import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, ArrowLeft, MapPin, Calendar, Clock, Car, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import NotificationBell from '@/components/NotificationBell';

interface Reservation {
  id: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  vehicle_type: string;
  price: number | null;
  status: string;
  driver_id: string | null;
}

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-orange-500/20 text-orange-700',
  'awaiting-customer': 'bg-purple-500/20 text-purple-700',
  'confirmed': 'bg-blue-500/20 text-blue-700',
  'assigned': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
  'cancelled': 'bg-destructive/20 text-destructive',
  'new': 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  'awaiting-price': 'Awaiting Price',
  'awaiting-customer': 'Your Approval Needed',
  'confirmed': 'Confirmed',
  'assigned': 'Driver Assigned',
  'active': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'new': 'New',
};

const CustomerBookings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('customer_id', user.id)
        .order('pickup_date', { ascending: false });

      if (error) {
        console.error('Error fetching reservations:', error);
      } else {
        setReservations(data || []);
      }
      setLoading(false);
    };

    fetchReservations();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customer')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">My Reservations</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No reservations yet</p>
            <Button onClick={() => navigate('/book')}>Book a Transfer</Button>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {reservations.map((reservation) => (
              <Card 
                key={reservation.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/customer/reservation/${reservation.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(reservation.pickup_date), 'PPP')}
                      </span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span>{reservation.pickup_time}</span>
                    </div>
                    <Badge className={statusColors[reservation.status] || 'bg-muted'}>
                      {statusLabels[reservation.status] || reservation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <div className="text-sm text-muted-foreground">Pickup</div>
                      <div className="font-medium">{reservation.pickup}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-destructive mt-1" />
                    <div>
                      <div className="text-sm text-muted-foreground">Drop-off</div>
                      <div className="font-medium">{reservation.dropoff}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{reservation.vehicle_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {reservation.price !== null ? (
                        <span className="font-bold text-primary">₺{reservation.price}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Price pending</span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {reservation.status === 'awaiting-customer' && (
                    <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-center text-sm text-purple-700 dark:text-purple-300">
                      Tap to review and approve price
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerBookings;
