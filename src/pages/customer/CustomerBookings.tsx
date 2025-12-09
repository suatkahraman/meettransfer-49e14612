import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, ArrowLeft, MapPin, Calendar, Clock, Car, ChevronRight, Plus, AlertCircle, CheckCircle, Loader2, XCircle, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import NotificationBell from '@/components/NotificationBell';
import { PushNotificationToggle } from '@/components/PushNotificationToggle';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface Reservation {
  id: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  vehicle_type: string;
  price: number | null;
  price_currency: string | null;
  status: string;
  driver_id: string | null;
}

const statusColors: Record<string, string> = {
  'pending_price': 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  'waiting_for_customer_approval': 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  'customer_approved': 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  'customer_rejected': 'bg-destructive/20 text-destructive',
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  'active': 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
  'completed': 'bg-green-500/20 text-green-700 dark:text-green-300',
  'pending_admin_review': 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  'cancelled_by_customer': 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, string> = {
  'pending_price': 'Waiting for Price',
  'waiting_for_customer_approval': 'Action Required',
  'customer_approved': 'Confirmed',
  'customer_rejected': 'Cancelled',
  'sent_to_driver': 'Driver Assigned',
  'active': 'In Progress',
  'completed': 'Completed',
  'pending_admin_review': 'Under Review',
  'cancelled_by_customer': 'Cancelled',
};

const statusIcons: Record<string, React.ReactNode> = {
  'pending_price': <Loader2 className="h-3 w-3 animate-spin" />,
  'waiting_for_customer_approval': <AlertCircle className="h-3 w-3" />,
  'customer_approved': <CheckCircle className="h-3 w-3" />,
  'customer_rejected': <XCircle className="h-3 w-3" />,
  'sent_to_driver': <Truck className="h-3 w-3" />,
  'active': <Car className="h-3 w-3" />,
  'completed': <CheckCircle className="h-3 w-3" />,
  'pending_admin_review': <AlertCircle className="h-3 w-3" />,
  'cancelled_by_customer': <XCircle className="h-3 w-3" />,
};

const currencySymbols: Record<string, string> = {
  'TRY': '₺',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
};

const CustomerBookings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSound } = useNotificationSound();

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

  useEffect(() => {
    fetchReservations();
  }, [user]);

  // Real-time subscription for customer's reservations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('customer-reservations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Reservation update:', payload);
          fetchReservations();
          if (payload.eventType === 'UPDATE') {
            playSound();
            toast.info('Your reservation has been updated');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playSound]);

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return null;
    const symbol = currencySymbols[currency || 'TRY'] || currency || '';
    return `${symbol}${price}`;
  };

  const getActionRequired = (status: string) => {
    return status === 'waiting_for_customer_approval';
  };

  // Separate reservations by action required
  const actionRequired = reservations.filter(r => getActionRequired(r.status));
  const otherReservations = reservations.filter(r => !getActionRequired(r.status));

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
          <PushNotificationToggle />
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No reservations yet</p>
            <Button onClick={() => navigate('/book')}>
              <Plus className="h-4 w-4 mr-2" />
              Book a Transfer
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Required Section */}
            {actionRequired.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <AlertCircle className="h-5 w-5" />
                  Action Required ({actionRequired.length})
                </h2>
                {actionRequired.map((reservation) => (
                  <Card 
                    key={reservation.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20"
                    onClick={() => navigate(`/customer/reservation/${reservation.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(reservation.pickup_date), 'PPP')}
                          </span>
                          <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                          <span>{reservation.pickup_time}</span>
                        </div>
                        <Badge className={`flex items-center gap-1 ${statusColors[reservation.status]}`}>
                          {statusIcons[reservation.status]}
                          {statusLabels[reservation.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{reservation.pickup}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{reservation.dropoff}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm capitalize">{reservation.vehicle_type.replace('-', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {reservation.price !== null && (
                            <span className="font-bold text-primary text-lg">
                              {formatPrice(reservation.price, reservation.price_currency)}
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          Tap to review and approve your price
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* All Other Reservations */}
            {otherReservations.length > 0 && (
              <div className="space-y-3">
                {actionRequired.length > 0 && (
                  <h2 className="text-lg font-semibold">All Reservations</h2>
                )}
                {otherReservations.map((reservation) => (
                  <Card 
                    key={reservation.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/customer/reservation/${reservation.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(reservation.pickup_date), 'PPP')}
                          </span>
                          <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                          <span>{reservation.pickup_time}</span>
                        </div>
                        <Badge className={`flex items-center gap-1 ${statusColors[reservation.status] || 'bg-muted'}`}>
                          {statusIcons[reservation.status]}
                          {statusLabels[reservation.status] || reservation.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{reservation.pickup}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{reservation.dropoff}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm capitalize">{reservation.vehicle_type.replace('-', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {reservation.price !== null ? (
                            <span className="font-bold text-primary">
                              {formatPrice(reservation.price, reservation.price_currency)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Price pending</span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {reservation.status === 'pending_price' && (
                        <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded text-center text-sm text-orange-700 dark:text-orange-300">
                          Waiting for Price
                        </div>
                      )}

                      {reservation.status === 'sent_to_driver' && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded text-center text-sm text-yellow-700 dark:text-yellow-300">
                          Your driver is ready
                        </div>
                      )}

                      {reservation.status === 'active' && (
                        <div className="bg-cyan-50 dark:bg-cyan-950/30 p-2 rounded text-center text-sm text-cyan-700 dark:text-cyan-300">
                          Trip in progress
                        </div>
                      )}

                      {reservation.status === 'completed' && (
                        <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-center text-sm text-green-700 dark:text-green-300">
                          Trip completed
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* New Booking Button */}
            <div className="pt-4">
              <Button onClick={() => navigate('/book')} className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Book New Transfer
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerBookings;