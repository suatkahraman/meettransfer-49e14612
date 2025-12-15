import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, Car, Phone, User, Users, Check, X, Plane, Edit, XCircle, AlertTriangle, CreditCard, Banknote, CheckCircle2, Clock3, Map } from 'lucide-react';
import GoogleRouteMap from '@/components/ui/google-route-map';
import { AirlineDisplay } from '@/components/ui/airline-display';
import { FlightStatus } from '@/components/ui/flight-status';
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

interface Reservation {
  id: string;
  reservation_code: string | null;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
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
  drivers?: {
    name: string;
    phone: string;
    plate_number: string | null;
    vehicle_model: string | null;
  } | null;
}

const statusColors: Record<string, string> = {
  'pending_price': 'bg-orange-500/20 text-orange-700',
  'waiting_for_customer_approval': 'bg-purple-500/20 text-purple-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'customer_rejected': 'bg-destructive/20 text-destructive',
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
  'pending_admin_review': 'bg-amber-500/20 text-amber-700',
  'cancelled_by_customer': 'bg-destructive/20 text-destructive',
};

const currencySymbols: Record<string, string> = {
  'TRY': '₺',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
};

const CustomerReservationDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { emailAdminPriceAccepted } = useEmailNotifications();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending_price': t('statusPendingPrice'),
      'waiting_for_customer_approval': t('statusActionRequired'),
      'customer_approved': t('statusConfirmed'),
      'customer_rejected': t('statusCancelled'),
      'sent_to_driver': t('statusDriverAssigned'),
      'active': t('statusInProgress'),
      'completed': t('statusCompleted'),
      'pending_admin_review': t('statusUnderReview'),
      'cancelled_by_customer': t('statusCancelled'),
    };
    return labels[status] || status;
  };

  useEffect(() => {
    const fetchReservation = async () => {
      if (!id || !user) return;

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          drivers (name, phone, plate_number, vehicle_model)
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

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return null;
    const symbol = currencySymbols[currency || 'TRY'] || currency || '';
    return `${symbol}${price}`;
  };

  const canEdit = reservation && ['customer_approved', 'confirmed', 'sent_to_driver'].includes(reservation.status);
  const canCancel = reservation && ['customer_approved', 'confirmed', 'sent_to_driver'].includes(reservation.status);

  const handleAcceptPrice = async () => {
    if (!reservation) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'customer_approved' })
        .eq('id', reservation.id);

      if (error) throw error;

      // Notify admin (in-app)
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'price_accepted',
            title: 'Customer Accepted Price',
            message: `Reservation #${reservation.id.slice(0, 8)} is confirmed. Price: ${formatPrice(reservation.price, reservation.price_currency)}`,
            notify_admins: true,
            reservation_id: reservation.id,
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

      // Notify admin
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'reservation_cancelled',
            title: 'Customer Cancelled Reservation',
            message: `A customer cancelled reservation #${reservation.id.slice(0, 8)}.`,
            notify_admins: true,
            reservation_id: reservation.id,
          }
        });
      } catch (e) {
        console.error('Failed to notify admin:', e);
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
                type: 'reservation_cancelled'
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
              <div className="space-y-1">
                {reservation.reservation_code && (
                  <div className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
                    {reservation.reservation_code}
                  </div>
                )}
                <CardTitle className="text-xl">Transfer Details</CardTitle>
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

            {/* Route Map */}
            <div className="py-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Map className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Route Map</span>
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
                  <span className="text-sm font-medium">Passengers ({reservation.passenger_names.length})</span>
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
                    <span className="text-sm text-muted-foreground">No flight info</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{reservation.vehicle_type}</span>
              </div>
            </div>

            {/* Flight Status */}
            {reservation.flight_number && (
              <FlightStatus 
                flightNumber={reservation.flight_number} 
                date={reservation.pickup_date}
                refreshIntervalMs={0}
              />
            )}

            {/* Price Section - only show if price is set */}
            {priceDisplay && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Price</span>
                  <span className="font-bold text-primary text-2xl">{priceDisplay}</span>
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
                        <a 
                          href={reservation.payment_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                          </Button>
                        </a>
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
                        <span className="text-sm">Payment Method</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Banknote className="h-3 w-3 mr-1" />
                        Cash to Driver
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Yolcudan Alınacak Nakit - bağımsız section */}
            {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && !['pending_price', 'waiting_for_customer_approval'].includes(reservation.status) && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border-2 border-amber-300 dark:border-amber-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💵</span>
                    <span className="font-medium text-amber-700 dark:text-amber-300">Cash Payment to Driver</span>
                  </div>
                  <span className="font-bold text-amber-700 dark:text-amber-300 text-2xl">
                    {currencySymbols[reservation.passenger_cash_currency || 'TRY'] || '₺'}{reservation.passenger_cash_amount}
                  </span>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  Please pay this amount in cash to your driver at the end of the transfer.
                </p>
              </div>
            )}

            {/* Pending Price Message */}
            {reservation.status === 'pending_price' && (
              <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg text-center">
                <p className="text-orange-700 dark:text-orange-300">
                  Our team is reviewing your request. You will receive a notification when the price is ready.
                </p>
              </div>
            )}

            {/* Customer Approval Section */}
            {reservation.status === 'waiting_for_customer_approval' && (
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg text-center">
                  <p className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">
                    Your Transfer Price is Ready
                  </p>
                  <p className="text-purple-600 dark:text-purple-400">
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
                    Reject
                  </Button>
                  <Button 
                    onClick={handleAcceptPrice}
                    disabled={actionLoading}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                </div>
              </div>
            )}

            {/* Driver Info */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm font-medium mb-3">Driver Information</div>
              {reservation.drivers ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{reservation.drivers.name}</span>
                  </div>
                  {(reservation.drivers.vehicle_model || reservation.drivers.plate_number) && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {reservation.drivers.vehicle_model || ''}
                        {reservation.drivers.vehicle_model && reservation.drivers.plate_number ? ' - ' : ''}
                        {reservation.drivers.plate_number || ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${reservation.drivers.phone}`} className="text-primary">
                      {reservation.drivers.phone}
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Driver will be assigned soon.</p>
              )}
            </div>

            {/* Confirmed Message */}
            {reservation.status === 'customer_approved' && !reservation.drivers && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-center">
                <p className="text-blue-700 dark:text-blue-300">
                  Your booking is confirmed! A driver will be assigned shortly.
                </p>
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
            {(reservation.status === 'customer_rejected' || reservation.status === 'cancelled_by_customer') && (
              <div className="bg-destructive/10 p-4 rounded-lg text-center">
                <p className="text-destructive">
                  This reservation has been cancelled.
                </p>
              </div>
            )}

            {/* Pending Admin Review Message */}
            {reservation.status === 'pending_admin_review' && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg text-center">
                <AlertTriangle className="h-5 w-5 mx-auto text-amber-600 mb-2" />
                <p className="text-amber-700 dark:text-amber-300">
                  Your changes are being reviewed by our team. We'll notify you once they're confirmed.
                </p>
              </div>
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