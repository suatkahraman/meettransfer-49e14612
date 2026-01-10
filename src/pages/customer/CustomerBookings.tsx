import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, ArrowLeft, MapPin, Calendar, Clock, Car, ChevronRight, Plus, AlertCircle, CheckCircle, Loader2, XCircle, Truck, User, Banknote, Home, Bell, BellOff, Plane, AlertTriangle, Volume2, Settings, Briefcase, Baby, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import NotificationBell from '@/components/NotificationBell';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { FlightStatus } from '@/components/ui/flight-status';
import { LocationDisplay } from '@/components/ui/location-display';
import { getCurrencySymbol } from '@/lib/currency';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';

const vehicleTypeLabels: Record<string, string> = {
  'mercedes-vito': 'Mercedes-vito',
  'vip-mercedes': 'Vip Mercedes',
  'maybach-minibus': 'Maybach Minibus',
  'minibus': 'Minibus',
  // Legacy support
  'mercedes-vclass': 'Vip Mercedes',
  'maybach': 'Maybach Minibus',
};

interface Reservation {
  id: string;
  reservation_code: string | null;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  price: number | null;
  price_currency: string | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  payment_type: string;
  status: string;
  driver_id: string | null;
  luggage_count: number | null;
  baby_seat_count: number | null;
  drivers?: {
    name: string;
    plate_number: string | null;
    vehicle_model: string | null;
    vehicle_color: string | null;
  } | null;
}

// Simple component to show flight delay badge inline
const FlightDelayBadge = ({ flightNumber, date }: { flightNumber: string; date: string }) => {
  const [delay, setDelay] = useState<number | null>(null);
  const [flightStatus, setFlightStatus] = useState<string | null>(null);

  return (
    <>
      <FlightStatus
        flightNumber={flightNumber}
        date={date}
        compact
        refreshIntervalMs={0}
        className="hidden"
        onStatusChange={(status) => {
          const d = status.arrival?.delay || status.departure?.delay || 0;
          setDelay(d);
          setFlightStatus(status.status?.toLowerCase() || null);
        }}
      />
      {delay && delay > 0 && (
        <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          +{delay} min
        </Badge>
      )}
      {flightStatus === 'cancelled' && (
        <Badge className="bg-destructive/20 text-destructive text-xs flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Cancelled
        </Badge>
      )}
    </>
  );
};

// Status colors for badges
const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  'waiting_for_customer_approval': 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  'customer_approved': 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  'customer_rejected': 'bg-destructive/20 text-destructive',
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  'confirmed': 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  'active': 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
  'completed': 'bg-green-500/20 text-green-700 dark:text-green-300',
  'pending_admin_review': 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  'cancelled_by_customer': 'bg-destructive/20 text-destructive',
  'cancelled': 'bg-destructive/20 text-destructive',
};

// Card border colors based on status
const statusCardColors: Record<string, string> = {
  'awaiting-price': 'border-orange-300 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-950/20',
  'waiting_for_customer_approval': 'border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-950/20',
  'customer_approved': 'border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20',
  'customer_rejected': 'border-red-300 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20',
  'sent_to_driver': 'border-yellow-300 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-950/20',
  'confirmed': 'border-emerald-300 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20',
  'active': 'border-cyan-300 dark:border-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/20',
  'completed': 'border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-950/20',
  'pending_admin_review': 'border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20',
  'cancelled_by_customer': 'border-red-300 dark:border-red-600 bg-red-50/30 dark:bg-red-950/10',
  'cancelled': 'border-red-300 dark:border-red-600 bg-red-50/30 dark:bg-red-950/10',
};

const statusIcons: Record<string, React.ReactNode> = {
  'awaiting-price': <Loader2 className="h-3 w-3 animate-spin" />,
  'waiting_for_customer_approval': <AlertCircle className="h-3 w-3" />,
  'customer_approved': <CheckCircle className="h-3 w-3" />,
  'customer_rejected': <XCircle className="h-3 w-3" />,
  'sent_to_driver': <Truck className="h-3 w-3" />,
  'confirmed': <CheckCircle className="h-3 w-3" />,
  'active': <Car className="h-3 w-3" />,
  'completed': <CheckCircle className="h-3 w-3" />,
  'pending_admin_review': <AlertCircle className="h-3 w-3" />,
  'cancelled_by_customer': <XCircle className="h-3 w-3" />,
  'cancelled': <XCircle className="h-3 w-3" />,
};

// Active statuses - reservations that are in progress or upcoming
const activeStatuses = [
  'awaiting-price',
  'waiting_for_customer_approval', 
  'customer_approved',
  'confirmed',
  'sent_to_driver',
  'pending_admin_review',
  'active'
];

// Check if reservation is active
const isActiveReservation = (status: string) => activeStatuses.includes(status);


const CustomerBookings = () => {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const { playSound } = useNotificationSound();
  const { isSubscribed, subscribe, unsubscribe, isLoading: pushLoading } = usePushNotifications();

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'awaiting-price': t('statusPendingPrice'),
      'waiting_for_customer_approval': t('statusActionRequired'),
      'customer_approved': t('statusConfirmed'),
      'customer_rejected': t('statusCancelled'),
      'sent_to_driver': t('statusDriverAssigned'),
      'active': t('statusInProgress'),
      'completed': t('statusCompleted'),
      'pending_admin_review': t('statusUnderReview'),
      'cancelled_by_customer': t('statusCancelled'),
    };
    return statusLabels[status] || status;
  };

  const fetchReservations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        drivers (name, plate_number, vehicle_model, vehicle_color)
      `)
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
            toast.info(t('reservationUpdated'));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playSound, t]);

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return null;
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price}`;
  };

  const getActionRequired = (status: string) => {
    return status === 'waiting_for_customer_approval';
  };

  // Check if reservation can be edited (editable statuses)
  const canEditReservation = (status: string) => {
    const editableStatuses = [
      'awaiting-price',
      'waiting_for_customer_approval',
      'customer_approved',
      'confirmed',
      'sent_to_driver',
      'pending_admin_review'
    ];
    return editableStatuses.includes(status);
  };

  // Check if awaiting price (needs highlighting)
  const isAwaitingPrice = (status: string) => {
    return status === 'awaiting-price';
  };

  // Separate reservations: action required, active, past/inactive
  const actionRequired = reservations.filter(r => getActionRequired(r.status));
  const activeReservations = reservations.filter(r => 
    !getActionRequired(r.status) && isActiveReservation(r.status)
  );
  const pastReservations = reservations.filter(r => 
    !getActionRequired(r.status) && !isActiveReservation(r.status)
  );

  // Sort active reservations by pickup date (soonest first)
  const sortedActiveReservations = [...activeReservations].sort((a, b) => 
    new Date(a.pickup_date + 'T' + a.pickup_time).getTime() - 
    new Date(b.pickup_date + 'T' + b.pickup_time).getTime()
  );

  // Sort past reservations by pickup date (most recent first)
  const sortedPastReservations = [...pastReservations].sort((a, b) => 
    new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime()
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customer')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">{t('myReservationsTitle')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
            title="Bildirim Ayarları"
          >
            <Volume2 className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => isSubscribed ? unsubscribe() : subscribe()}
            disabled={pushLoading}
            className="text-primary-foreground hover:bg-primary-foreground/10"
            title={isSubscribed ? 'Notifications On' : 'Notifications Off'}
          >
            {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5 opacity-60" />}
          </Button>
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-primary-foreground/10" title="Home">
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8 px-4 max-w-2xl">
        {/* Notification Settings Panel */}
        {showNotificationSettings && (
          <div className="mb-6">
            <NotificationSettingsPanel language={language === 'TR' ? 'TR' : 'EN'} />
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t('noReservationsYet')}</p>
            <Button onClick={() => navigate('/book')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('bookATransfer')}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Required Section */}
            {actionRequired.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <AlertCircle className="h-5 w-5" />
                  {t('actionRequired')} ({actionRequired.length})
                </h2>
                {actionRequired.map((reservation) => (
                  <Card 
                    key={reservation.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20"
                    onClick={() => navigate(`/customer/reservation/${reservation.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          {reservation.reservation_code && (
                            <span className="text-xs font-mono text-muted-foreground">{reservation.reservation_code}</span>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(reservation.pickup_date), 'PPP')}
                            </span>
                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                            <span>{reservation.pickup_time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`flex items-center gap-1 ${statusColors[reservation.status]}`}>
                            {statusIcons[reservation.status]}
                            {getStatusLabel(reservation.status)}
                          </Badge>
                          {reservation.flight_number && (
                            <FlightDelayBadge 
                              flightNumber={reservation.flight_number} 
                              date={reservation.pickup_date} 
                            />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <LocationDisplay
                          placeName={reservation.pickup_place_name}
                          address={reservation.pickup}
                          type="pickup"
                          size="sm"
                        />
                        <LocationDisplay
                          placeName={reservation.dropoff_place_name}
                          address={reservation.dropoff}
                          type="dropoff"
                          size="sm"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}</span>
                          {reservation.luggage_count && reservation.luggage_count > 0 && (
                            <Badge variant="outline" className="text-xs gap-1 text-orange-600 border-orange-300">
                              <Briefcase className="h-3 w-3" />
                              {reservation.luggage_count}
                            </Badge>
                          )}
                          {reservation.baby_seat_count && reservation.baby_seat_count > 0 && (
                            <Badge variant="outline" className="text-xs gap-1 text-pink-600 border-pink-300">
                              <Baby className="h-3 w-3" />
                              {reservation.baby_seat_count}
                            </Badge>
                          )}
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
                          {t('tapToReviewPrice')}
                        </p>
                      </div>

                      {/* Edit Button */}
                      {canEditReservation(reservation.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customer/reservation/${reservation.id}/edit`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t('editReservation') || 'Edit Reservation'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Active Reservations Section */}
            {sortedActiveReservations.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                  <Car className="h-5 w-5" />
                  {t('activeReservations') || 'Active Reservations'} ({sortedActiveReservations.length})
                </h2>
                {sortedActiveReservations.map((reservation) => (
                  <Card 
                    key={reservation.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${statusCardColors[reservation.status] || ''}`}
                    onClick={() => navigate(`/customer/reservation/${reservation.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          {reservation.reservation_code && (
                            <span className="text-xs font-mono text-muted-foreground">{reservation.reservation_code}</span>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(reservation.pickup_date), 'PPP')}
                            </span>
                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                            <span>{reservation.pickup_time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`flex items-center gap-1 ${statusColors[reservation.status] || 'bg-muted'}`}>
                            {statusIcons[reservation.status]}
                            {getStatusLabel(reservation.status)}
                          </Badge>
                          {reservation.flight_number && (
                            <FlightDelayBadge 
                              flightNumber={reservation.flight_number} 
                              date={reservation.pickup_date} 
                            />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <LocationDisplay
                          placeName={reservation.pickup_place_name}
                          address={reservation.pickup}
                          type="pickup"
                          size="sm"
                        />
                        <LocationDisplay
                          placeName={reservation.dropoff_place_name}
                          address={reservation.dropoff}
                          type="dropoff"
                          size="sm"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}</span>
                          {reservation.luggage_count && reservation.luggage_count > 0 && (
                            <Badge variant="outline" className="text-xs gap-1 text-orange-600 border-orange-300">
                              <Briefcase className="h-3 w-3" />
                              {reservation.luggage_count}
                            </Badge>
                          )}
                          {reservation.baby_seat_count && reservation.baby_seat_count > 0 && (
                            <Badge variant="outline" className="text-xs gap-1 text-pink-600 border-pink-300">
                              <Baby className="h-3 w-3" />
                              {reservation.baby_seat_count}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {reservation.price !== null ? (
                            <span className="font-bold text-primary">
                              {formatPrice(reservation.price, reservation.price_currency)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">{t('pricePending')}</span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Cash payment amount indicator */}
                      {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && !['awaiting-price', 'waiting_for_customer_approval'].includes(reservation.status) && (
                        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                            <Banknote className="h-4 w-4" />
                            <span className="text-sm font-medium">{t('cashToDriver')}</span>
                          </div>
                          <span className="font-bold text-amber-700 dark:text-amber-300">
                            {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount}
                          </span>
                        </div>
                      )}

                      {reservation.status === 'awaiting-price' && (
                        <div className="bg-orange-100 dark:bg-orange-950/50 p-3 rounded-lg text-center border border-orange-300 dark:border-orange-700">
                          <p className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('waitingForPrice')}
                          </p>
                        </div>
                      )}

                      {/* Edit Button */}
                      {canEditReservation(reservation.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customer/reservation/${reservation.id}/edit`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t('editReservation') || 'Edit Reservation'}
                        </Button>
                      )}

                      {reservation.status === 'sent_to_driver' && reservation.drivers && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded text-sm text-yellow-700 dark:text-yellow-300">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{reservation.drivers.name}</span>
                            </div>
                            <span className="text-xs">{reservation.drivers.plate_number} • {reservation.drivers.vehicle_model}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Past Reservations Section */}
            {sortedPastReservations.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-5 w-5" />
                  {t('pastReservations') || 'Past Reservations'} ({sortedPastReservations.length})
                </h2>
                {sortedPastReservations.map((reservation) => (
                  <Card 
                    key={reservation.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow opacity-75 ${statusCardColors[reservation.status] || ''}`}
                    onClick={() => navigate(`/customer/reservation/${reservation.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          {reservation.reservation_code && (
                            <span className="text-xs font-mono text-muted-foreground">{reservation.reservation_code}</span>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(reservation.pickup_date), 'PPP')}
                            </span>
                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                            <span>{reservation.pickup_time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`flex items-center gap-1 ${statusColors[reservation.status] || 'bg-muted'}`}>
                            {statusIcons[reservation.status]}
                            {getStatusLabel(reservation.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <LocationDisplay
                          placeName={reservation.pickup_place_name}
                          address={reservation.pickup}
                          type="pickup"
                          size="sm"
                        />
                        <LocationDisplay
                          placeName={reservation.dropoff_place_name}
                          address={reservation.dropoff}
                          type="dropoff"
                          size="sm"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {reservation.price !== null && (
                            <span className="font-bold text-muted-foreground">
                              {formatPrice(reservation.price, reservation.price_currency)}
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default CustomerBookings;