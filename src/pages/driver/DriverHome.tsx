import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, MapPin, Calendar, Clock, User, Plane, CreditCard, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import NotificationBell from '@/components/NotificationBell';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  payment_type: string;
  price: number;
  status: string;
}

const statusColors: Record<string, string> = {
  assigned: 'bg-yellow-500/20 text-yellow-700 border-yellow-500',
  active: 'bg-blue-500/20 text-blue-700 border-blue-500',
  completed: 'bg-green-500/20 text-green-700 border-green-500',
};

const DriverHome = () => {
  const { signOut } = useAuth();
  const { driverId } = useUserRole();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!driverId) return;

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('driver_id', driverId)
        .in('status', ['assigned', 'active', 'completed'])
        .order('pickup_date', { ascending: true });

      if (error) {
        console.error('Error:', error);
      } else {
        setReservations(data || []);
      }
      setLoading(false);
    };

    if (driverId) {
      fetchReservations();
    }
  }, [driverId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-serif">Driver Panel</h1>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <Button variant="ghost" onClick={() => navigate('/driver/accounting')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <Calculator className="h-4 w-4 mr-2" />
            Accounting
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold mb-4">My Jobs</h2>
        
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No jobs assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {reservations.map((reservation) => (
              <Card 
                key={reservation.id} 
                className={`cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${statusColors[reservation.status]?.split(' ')[2] || ''}`}
                onClick={() => navigate(`/driver/job/${reservation.id}`)}
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
                    <Badge className={statusColors[reservation.status]}>
                      {reservation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{reservation.customer_name}</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <span>{reservation.pickup}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{reservation.dropoff}</span>
                  </div>

                  {reservation.flight_number && (
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{reservation.flight_number}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{reservation.payment_type}</span>
                    </div>
                    <span className="font-bold text-primary">€{reservation.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverHome;
