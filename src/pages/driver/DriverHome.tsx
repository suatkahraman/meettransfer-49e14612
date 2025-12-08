import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, MapPin, Calendar, Clock, User, Plane, CreditCard, Calculator, Car, AlertCircle, CheckCircle2, Loader2, Bell } from 'lucide-react';
import { format } from 'date-fns';
import NotificationBell from '@/components/NotificationBell';
import { PushNotificationToggle } from '@/components/PushNotificationToggle';
import { toast } from 'sonner';

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
  price: number | null;
  price_currency: string | null;
  status: string;
  driver_confirmed: boolean | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  sent_to_driver: { 
    label: 'New Job', 
    color: 'bg-orange-500/20 text-orange-700 border-orange-500',
    icon: <AlertCircle className="h-3 w-3" />
  },
  active: { 
    label: 'In Progress', 
    color: 'bg-blue-500/20 text-blue-700 border-blue-500',
    icon: <Loader2 className="h-3 w-3" />
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-green-500/20 text-green-700 border-green-500',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
};

const currencySymbols: Record<string, string> = {
  TRY: '₺',
  EUR: '€',
  USD: '$',
  GBP: '£',
};

const DriverHome = () => {
  const { signOut } = useAuth();
  const { driverId } = useUserRole();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSound } = useNotificationSound();

  const getCurrencySymbol = (currency: string | null) => {
    return currencySymbols[currency || 'TRY'] || '₺';
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null || price === undefined) return 'N/A';
    return `${getCurrencySymbol(currency)}${price.toLocaleString()}`;
  };

  const fetchReservations = async () => {
    if (!driverId) return;

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('driver_id', driverId)
      .in('status', ['sent_to_driver', 'active', 'completed'])
      .order('pickup_date', { ascending: true });

    if (error) {
      console.error('Error:', error);
    } else {
      setReservations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (driverId) {
      fetchReservations();
    }
  }, [driverId]);

  // Real-time subscription for new job assignments
  useEffect(() => {
    if (!driverId) return;

    const channel = supabase
      .channel('driver-jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newReservation = payload.new as Reservation;
            if (['sent_to_driver', 'active', 'completed'].includes(newReservation.status)) {
              setReservations(prev => [...prev, newReservation]);
              playSound();
              toast.success('New job assigned!', {
                description: `${newReservation.pickup} → ${newReservation.dropoff}`,
                icon: <Bell className="h-4 w-4" />
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedReservation = payload.new as Reservation;
            setReservations(prev => 
              prev.map(r => r.id === updatedReservation.id ? updatedReservation : r)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setReservations(prev => prev.filter(r => r.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  // Separate reservations by status
  const pendingJobs = reservations.filter(r => r.status === 'sent_to_driver');
  const activeJobs = reservations.filter(r => r.status === 'active');
  const completedJobs = reservations.filter(r => r.status === 'completed');

  const renderJobCard = (reservation: Reservation) => {
    const config = statusConfig[reservation.status] || statusConfig.sent_to_driver;
    
    return (
      <Card 
        key={reservation.id} 
        className={`cursor-pointer hover:shadow-lg transition-all border-l-4 ${config.color.split(' ')[2]}`}
        onClick={() => navigate(`/driver/job/${reservation.id}`)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(new Date(reservation.pickup_date), 'EEE, MMM d')}
              </span>
              <Clock className="h-4 w-4 text-muted-foreground ml-2" />
              <span>{reservation.pickup_time}</span>
            </div>
            <Badge className={`${config.color} flex items-center gap-1`}>
              {config.icon}
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{reservation.customer_name}</span>
            <span className="text-muted-foreground text-sm">• {reservation.customer_phone}</span>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{reservation.pickup}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{reservation.dropoff}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            {reservation.flight_number && (
              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                <Plane className="h-3 w-3" />
                <span>{reservation.flight_number}</span>
              </div>
            )}
            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
              <Car className="h-3 w-3" />
              <span>{reservation.vehicle_type}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm capitalize">{reservation.payment_type}</span>
            </div>
            <span className="font-bold text-lg text-primary">
              {formatPrice(reservation.price, reservation.price_currency)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-serif">Driver Panel</h1>
        <div className="flex items-center gap-2">
          <PushNotificationToggle />
          <NotificationBell />
          <Button variant="ghost" size="sm" onClick={() => navigate('/driver/accounting')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <Calculator className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Accounting</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No jobs assigned yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Jobs - Action Required */}
            {pendingJobs.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg font-semibold">New Jobs ({pendingJobs.length})</h2>
                </div>
                <div className="space-y-3">
                  {pendingJobs.map(renderJobCard)}
                </div>
              </section>
            )}

            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">In Progress ({activeJobs.length})</h2>
                </div>
                <div className="space-y-3">
                  {activeJobs.map(renderJobCard)}
                </div>
              </section>
            )}

            {/* Completed Jobs */}
            {completedJobs.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h2 className="text-lg font-semibold">Completed ({completedJobs.length})</h2>
                </div>
                <div className="space-y-3">
                  {completedJobs.map(renderJobCard)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverHome;
