import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, Car, Phone, User, Users, Check, X, Plane, Edit, XCircle, AlertTriangle, CreditCard, Banknote, CheckCircle2, Clock3, Map, Home, Bell, BellOff, MessageCircle, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol, CURRENCY_SYMBOLS } from '@/lib/currency';
import GoogleRouteMap from '@/components/ui/google-route-map';
import { AirlineDisplay } from '@/components/ui/airline-display';
import { FlightStatus } from '@/components/ui/flight-status';
import { LocationDisplay } from '@/components/ui/location-display';
import MissingInfoAlerts from '@/components/customer/MissingInfoAlerts';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const vehicleTypeLabels: Record<string, string> = {
  'mercedes-vito': 'Mercedes Vito',
  'mercedes-vclass': 'Mercedes Vip Vito',
  'maybach': 'Maybach',
  'minibus': 'Minibus',
};

interface Reservation {
  id: string;
  reservation_code: string | null;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  flight_arrival_time: string | null;
  flight_status: string | null;
  vehicle_type: string;
  payment_type: string;
  payment_status: string | null;
  payment_link: string | null;
  price: number | null;
  price_currency: string | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  status: string;
  driver_id: string | null;
  passenger_names: string[] | null;
  promo_code: string | null;
  // Place details
  pickup_place_name: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_place_name: string | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  drivers?: {
    name: string;
    plate_number: string | null;
    vehicle_model: string | null;
    vehicle_color: string | null;
  } | null;
}

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-orange-500/20 text-orange-700',
  'waiting_for_customer_approval': 'bg-purple-500/20 text-purple-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'customer_rejected': 'bg-destructive/20 text-destructive',
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
  'pending_admin_review': 'bg-amber-500/20 text-amber-700',
  'cancelled_by_customer': 'bg-destructive/20 text-destructive',
  'cancelled_by_agency': 'bg-destructive/20 text-destructive',
  'cancelled': 'bg-destructive/20 text-destructive',
};


const CustomerReservationDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { emailAdminPriceAccepted, emailAdminPriceRejected, emailAdminReservationCancelled } = useEmailNotifications();
  const { isSubscribed, subscribe, unsubscribe, isLoading: pushLoading
 } = usePushNotifications();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [flightDelay, setFlightDelay] = useState<number | null>(null);
  const [flightStatus, setFlightStatus] = useState<string | null>(null);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'awaiting-price': t('statusPendingPrice'),
      'waiting_for_customer_approval': t('statusActionRequired'),
      'customer_approved': t('statusConfirmed'),
      'customer_rejected': t('statusCancelled'),
      'sent_to_driver': t('statusDriverAssigned'),
      'active': t('statusInProgress'),
      'completed': t('statusCompleted'),
      'pending_admin_review': t('statusUnderReview'),
      'cancelled_by_customer': t('statusCancelledByCustomer'),
      'cancelled_by_agency': t('statusCancelledByAgency'),
      'cancelled': t('statusCancelled'),
    };
    return labels[status] || status;
  };

  const fetchReservation = async () => {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        drivers (name, plate_number, vehicle_model, vehicle_color)
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

  useEffect(() => {
    fetchReservation();
  }, [id, user, navigate]);

  // Real-time subscription for reservation updates (including flight changes)
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`customer-reservation-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Reservation updated:', payload);
          const newData = payload.new as any;
          
          // Check if flight info changed
          if (reservation && newData.flight_arrival_time !== reservation.flight_arrival_time) {
            toast.info('Flight arrival time has been updated');
          }
          
          // Refetch to get updated drivers relation
          fetchReservation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, reservation?.flight_arrival_time]);

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return null;
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price}`;
  };

  // Check if pickup date is in the past (not today, only past)
  const isPickupDatePast = () => {
    if (!reservation) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickupDate = new Date(reservation.pickup_date);
    pickupDate.setHours(0, 0, 0, 0);
    return pickupDate.getTime() < today.getTime(); // Only past, not today
  };

  const canEdit = reservation && 
    !isPickupDatePast() && 
    ['customer_approved', 'confirmed', 'sent_to_driver'].includes(reservation.status);
  const canCancel = reservation && 
    !isPickupDatePast() && 
    ['customer_approved', 'confirmed', 'sent_to_driver'].includes(reservation.status);

  const handleAcceptPrice = async () => {
    if (!reservation) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'customer_approved' })
        .eq('id', reservation.id);

      if (error) throw error;

      // Record in price history
      if (reservation.price) {
        try {
          await supabase.from('price_history').insert({
            reservation_id: reservation.id,
            price: reservation.price,
            price_currency: reservation.price_currency || 'TRY',
            action: 'accepted',
          });
        } catch (e) {
          console.error('Failed to record price history:', e);
        }
      }

      // Notify admin (in-app)
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'price_accepted',
            title: 'Customer Accepted Price',
            message: `Reservation #${reservation.id.slice(0, 8)} is confirmed. Price: ${formatPrice(reservation.price, reservation.price_currency)}`,
            notify_admins: true,
            reservation_id: reservation.id,
            send_push: true,
          }
        });
      } catch (e) {
        console.error('Failed to notify admin:', e);
      }

      // Send email to admin about price acceptance
      try {
        await emailAdminPriceAccepted(reservation.id);
      } catch (e) {
        console.error('Failed to send admin email:', e);
      }

      toast.success('Price accepted! Your transfer is confirmed.');
      setReservation({ ...reservation, status: 'customer_approved' });
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
        .update({ status: 'customer_rejected' })
        .eq('id', reservation.id);

      if (error) throw error;

      // Record in price history
      if (reservation.price) {
        try {
          await supabase.from('price_history').insert({
            reservation_id: reservation.id,
            price: reservation.price,
            price_currency: reservation.price_currency || 'TRY',
            action: 'rejected',
          });
        } catch (e) {
          console.error('Failed to record price history:', e);
        }
      }

      // Notify admin (in-app)
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'price_rejected',
            title: 'Customer Declined Price',
            message: `Reservation #${reservation.id.slice(0, 8)} was declined by customer.`,
            notify_admins: true,
            reservation_id: reservation.id,
            send_push: true,
          }
        });
      } catch (e) {
        console.error('Failed to notify admin:', e);
      }

      // Send email to admin about price rejection
      try {
        await emailAdminPriceRejected(reservation.id);
      } catch (e) {
        console.error('Failed to send admin email:', e);
      }

      toast.success('Reservation cancelled.');
      setReservation({ ...reservation, status: 'customer_rejected' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel reservation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;
    setCancelLoading(true);

    try {
      const driverId = reservation.driver_id;

      // Update reservation status and remove driver
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled_by_customer',
          driver_id: null,
        })
        .eq('id', reservation.id);

      if (error) throw error;

      // Notify admin (in-app)
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'reservation_cancelled',
            title: 'Customer Cancelled Reservation',
            message: `A customer cancelled reservation #${reservation.id.slice(0, 8)}.`,
            notify_admins: true,
            reservation_id: reservation.id,
            send_push: true,
          }
        });
      } catch (e) {
        console.error('Failed to notify admin:', e);
      }

      // Send email to admin about cancellation
      try {
        await emailAdminReservationCancelled(reservation.id);
      } catch (e) {
        console.error('Failed to send admin email:', e);
      }

      // Notify driver if one was assigned
      if (driverId) {
        try {
          const { data: driver } = await supabase
            .from('drivers')
            .select('user_id')
            .eq('id', driverId)
            .single();

          if (driver?.user_id) {
            await supabase.functions.invoke('create-notification', {
              body: {
                user_id: driver.user_id,
                reservation_id: reservation.id,
                title: 'Reservation Cancelled',
                message: `Reservation #${reservation.id.slice(0, 8)} has been cancelled by the customer.`,
                type: 'reservation_cancelled',
                send_push: true
              }
            });
          }
        } catch (e) {
          console.error('Failed to notify driver:', e);
        }
      }

      toast.success('Reservation cancelled successfully.');
      setReservation({ ...reservation, status: 'cancelled_by_customer', driver_id: null });
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel reservation');
    } finally {
      setCancelLoading(false);
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

  const priceDisplay = formatPrice(reservation.price, reservation.price_currency);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customer/bookings')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">{t('reservationDetails')}</h1>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                {reservation.reservation_code && (
                  <div className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
                    {reservation.reservation_code}
                  </div>
                )}
                <CardTitle className="text-xl">{t('transferDetailsTitle')}</CardTitle>
              </div>
              <Badge className={statusColors[reservation.status] || 'bg-muted'}>
                {getStatusLabel(reservation.status)}
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
              <LocationDisplay
                placeName={reservation.pickup_place_name}
                address={reservation.pickup}
                type="pickup"
                size="md"
              />
              <LocationDisplay
                placeName={reservation.dropoff_place_name}
                address={reservation.dropoff}
                type="dropoff"
                size="md"
              />
            </div>

            {/* Route Map */}
            <div className="py-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Map className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('routeMap')}</span>
              </div>
              <GoogleRouteMap
                pickup={reservation.pickup}
                dropoff={reservation.dropoff}
                showNavigationButtons={false}
              />
            </div>

            {/* Passengers */}
            {reservation.passenger_names && reservation.passenger_names.length > 0 && (
              <div className="space-y-2 py-4 border-t">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('passengers')} ({reservation.passenger_names.length})</span>
                </div>
                <div className="pl-6 space-y-1">
                  {reservation.passenger_names.map((name, index) => (
                    <div key={index} className="text-sm">
                      {index + 1}. {name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flight & Vehicle */}
            <div className="flex items-center justify-between py-4 border-t border-b">
              <div className="flex items-center gap-2">
                {reservation.flight_number ? (
                  <AirlineDisplay flightNumber={reservation.flight_number} size="sm" />
                ) : (
                  <>
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('noFlightInfo')}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}</span>
              </div>
            </div>

            {/* Flight Status with Delay Alert */}
            {reservation.flight_number && (
              <div className="space-y-3">
                {/* Stored Flight Info - Always show if available */}
                {(reservation.flight_arrival_time || reservation.flight_status) && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Plane className="h-4 w-4" />
                      Flight Information
                    </div>
                    <div className="flex items-center justify-between">
                      {reservation.flight_arrival_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          <div>
                            <div className="text-xs text-muted-foreground">Estimated Arrival</div>
                            <div className="text-xl font-bold text-primary">{reservation.flight_arrival_time}</div>
                          </div>
                        </div>
                      )}
                      {reservation.flight_status && (
                        <Badge 
                          className={cn(
                            "capitalize",
                            reservation.flight_status === 'delayed' && "bg-amber-500/20 text-amber-700 border-amber-300",
                            reservation.flight_status === 'landed' && "bg-green-500/20 text-green-700 border-green-300",
                            reservation.flight_status === 'cancelled' && "bg-destructive/20 text-destructive",
                            reservation.flight_status === 'active' && "bg-blue-500/20 text-blue-700",
                            reservation.flight_status === 'scheduled' && "bg-muted text-muted-foreground"
                          )}
                        >
                          {reservation.flight_status === 'delayed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {reservation.flight_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Delay Alert Banner */}
                {(flightDelay && flightDelay > 0) || reservation.flight_status === 'delayed' ? (
                  <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-700">Flight Delayed</div>
                      <div className="text-sm text-amber-600">
                        Your flight {reservation.flight_number} is delayed{flightDelay ? ` by ${flightDelay} minutes` : ''}. 
                        Your driver will be notified automatically.
                      </div>
                    </div>
                  </div>
                ) : null}
                {(flightStatus === 'cancelled' || reservation.flight_status === 'cancelled') && (
                  <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-destructive">Flight Cancelled</div>
                      <div className="text-sm text-destructive/80">
                        Your flight {reservation.flight_number} has been cancelled. 
                        Please contact us to reschedule your transfer.
                      </div>
                    </div>
                  </div>
                )}
                <FlightStatus 
                  flightNumber={reservation.flight_number} 
                  date={reservation.pickup_date}
                  refreshIntervalMs={5 * 60 * 1000}
                  reservationId={reservation.id}
                  onStatusChange={(status) => {
                    const delay = status.arrival?.delay || status.departure?.delay || 0;
                    setFlightDelay(delay);
                    setFlightStatus(status.status?.toLowerCase() || null);
                  }}
                  onArrivalTimeChange={(newTime) => {
                    if (newTime && reservation.flight_arrival_time !== newTime) {
                      setReservation(prev => prev ? { ...prev, flight_arrival_time: newTime } : prev);
                    }
                  }}
                />
              </div>
            )}

            {/* Price Section - only show if price is set */}
            {priceDisplay && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('price')}</span>
                  <div className="text-right">
                    {reservation.promo_code && reservation.price ? (
                      <>
                        {/* Original price with strikethrough */}
                        <span className="text-muted-foreground line-through text-lg mr-2">
                          {priceDisplay}
                        </span>
                        {/* Discounted price */}
                        <span className="font-bold text-green-600 dark:text-green-400 text-2xl">
                          {formatPrice(Math.round(reservation.price * 0.6), reservation.price_currency)}
                        </span>
                        {/* Discount badge */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <Tag className="h-3 w-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            40% {t('discount') || 'discount'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="font-bold text-primary text-2xl">{priceDisplay}</span>
                    )}
                  </div>
                </div>
                
                {/* Payment Status Indicator */}
                {reservation.payment_type === 'payment_link' && (
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Payment Status</span>
                      </div>
                      {reservation.payment_status === 'paid' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Payment Received
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          <Clock3 className="h-3 w-3 mr-1" />
                          Payment Pending
                        </Badge>
                      )}
                    </div>
                    
                    {/* Show Pay Now button if payment is pending and link exists */}
                    {reservation.payment_status !== 'paid' && reservation.payment_link && (
                      <div className="mt-3">
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            const link = reservation.payment_link;
                            if (link) {
                              // Ensure proper URL format
                              const url = link.startsWith('http://') || link.startsWith('https://') 
                                ? link 
                                : `https://${link}`;
                              // Use window.location for maximum compatibility on mobile browsers
                              window.location.href = url;
                            }
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {t('payNow')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Cash payment indicator */}
                {reservation.payment_type === 'cash' && (
                  <div className="pt-3 border-t space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('paymentMethod')}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Banknote className="h-3 w-3 mr-1" />
                        {t('cashToDriver')}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Yolcudan Alınacak Nakit - bağımsız section */}
            {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && !['awaiting-price', 'waiting_for_customer_approval'].includes(reservation.status) && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border-2 border-amber-300 dark:border-amber-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💵</span>
                    <span className="font-medium text-amber-700 dark:text-amber-300">Cash Payment to Driver</span>
                  </div>
                  <span className="font-bold text-amber-700 dark:text-amber-300 text-2xl">
                    {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount}
                  </span>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  Please pay this amount in cash to your driver at the end of the transfer.
                </p>
              </div>
            )}

            {/* Pending Price Message */}
            {reservation.status === 'awaiting-price' && (
              <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg text-center">
                <p className="text-orange-700 dark:text-orange-300">
                  {t('ourTeamReviewing')}
                </p>
              </div>
            )}

            {/* Customer Approval Section */}
            {reservation.status === 'waiting_for_customer_approval' && (
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg text-center">
                  <p className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">
                    {t('priceReady')}
                  </p>
                  <p className="text-purple-600 dark:text-purple-400">
                    {t('reviewPriceMessage')}
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
                    {t('reject')}
                  </Button>
                  <Button 
                    onClick={handleAcceptPrice}
                    disabled={actionLoading}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {t('accept')}
                  </Button>
                </div>
              </div>
            )}

            {/* Driver Info - Enhanced Card */}
            {reservation.drivers ? (
              <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
                {/* Header */}
                <div className="bg-primary/10 px-4 py-3 border-b border-primary/20">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-primary">{t('driverInformation')}</span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Driver Name */}
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Driver</div>
                      <div className="text-lg font-bold">{reservation.drivers.name}</div>
                    </div>
                  </div>
                  
                  {/* Vehicle Details */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Plate Number */}
                    {reservation.drivers.plate_number && (
                      <div className="bg-background/80 rounded-lg p-3 border border-primary/10">
                        <div className="text-xs text-muted-foreground mb-1">Plate</div>
                        <div className="font-mono font-bold text-sm">{reservation.drivers.plate_number}</div>
                      </div>
                    )}
                    
                    {/* Color */}
                    {reservation.drivers.vehicle_color && (
                      <div className="bg-background/80 rounded-lg p-3 border border-primary/10">
                        <div className="text-xs text-muted-foreground mb-1">Color</div>
                        <div className="font-medium text-sm">{reservation.drivers.vehicle_color}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Vehicle Model */}
                  {reservation.drivers.vehicle_model && (
                    <div className="bg-background/80 rounded-lg p-3 border border-primary/10">
                      <div className="text-xs text-muted-foreground mb-1">Vehicle</div>
                      <div className="font-medium">{reservation.drivers.vehicle_model}</div>
                    </div>
                  )}
                  
                  {/* WhatsApp Support Button */}
                  <Button
                    onClick={() => window.open('https://wa.me/905321748390', '_blank')}
                    className="w-full bg-[#25D366] hover:bg-[#22c55e] text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp Support
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 border border-dashed border-muted-foreground/30 p-4 rounded-lg text-center">
                <Car className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">{t('driverAssignedSoonMessage')}</p>
              </div>
            )}

            {/* Confirmed Message */}
            {reservation.status === 'customer_approved' && !reservation.drivers && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-center">
                <p className="text-blue-700 dark:text-blue-300">
                  {t('bookingConfirmed')}
                </p>
              </div>
            )}

            {/* Completed Message */}
            {reservation.status === 'completed' && (
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg text-center">
                <p className="text-green-700 dark:text-green-300">
                  {t('thankYouMessage')}
                </p>
              </div>
            )}

            {/* Cancelled Message */}
            {(reservation.status === 'customer_rejected' || reservation.status === 'cancelled_by_customer') && (
              <div className="bg-destructive/10 p-4 rounded-lg text-center">
                <p className="text-destructive">
                  {t('reservationCancelledMessage')}
                </p>
              </div>
            )}

            {/* Pending Admin Review Message */}
            {reservation.status === 'pending_admin_review' && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg text-center">
                <AlertTriangle className="h-5 w-5 mx-auto text-amber-600 mb-2" />
                <p className="text-amber-700 dark:text-amber-300">
                  {t('changesUnderReview')}
                </p>
              </div>
            )}

            {/* Missing Information Alerts */}
            {['customer_approved', 'confirmed', 'sent_to_driver', 'pending_admin_review'].includes(reservation.status) && (
              <MissingInfoAlerts reservation={reservation} onEdit={() => navigate(`/customer/reservation/${reservation.id}/edit`)} />
            )}

            {/* Action Buttons for confirmed reservations */}
            {(canEdit || canCancel) && (
              <div className="space-y-3 pt-4 border-t">
                {canEdit && (
                  <Button 
                    onClick={() => navigate(`/customer/reservation/${reservation.id}/edit`)}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Reservation
                  </Button>
                )}
                
                {canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="w-full border-destructive text-destructive hover:bg-destructive/10"
                        disabled={cancelLoading}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Reservation
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this reservation? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleCancelReservation}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Cancel It
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerReservationDetail;