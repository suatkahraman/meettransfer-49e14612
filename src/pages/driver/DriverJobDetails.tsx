import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useCompletionValidation } from '@/hooks/useCompletionValidation';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, User, Users, Phone, Plane, Car, CreditCard, CheckCircle, Save, Loader2, Map, ClipboardCopy, AlertCircle, Banknote, RefreshCw, MessageSquare, Building2, Briefcase, Baby } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import NotificationBell from '@/components/NotificationBell';
import GoogleRouteMap from '@/components/ui/google-route-map';
import { AirlineDisplay } from '@/components/ui/airline-display';
import { FlightStatus } from '@/components/ui/flight-status';
import { LocationDisplay } from '@/components/ui/location-display';
import { getCurrencySymbol } from '@/lib/currency';
import { parseMoneyInput } from '@/lib/money';

const vehicleTypeLabels: Record<string, string> = {
  'mercedes-vito': 'Mercedes-vito',
  'vip-mercedes': 'Vip Mercedes',
  'maybach-minibus': 'Maybach Minibus',
  'minibus': 'Minibus',
  // Legacy support
  'mercedes-vclass': 'Mercedes Vip Vito',
  'maybach': 'Maybach',
};

interface Reservation {
  id: string;
  reservation_code: string | null;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  flight_arrival_time: string | null;
  flight_status: string | null;
  vehicle_type: string;
  payment_type: string;
  price: number;
  price_currency: string | null;
  status: string;
  driver_confirmed: boolean;
  driver_earning: number | null;
  driver_cash_amount: number | null;
  driver_notes: string | null;
  passenger_names: string[] | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  customer_notes: string | null;
  agency_id: string | null;
  luggage_count: number | null;
  baby_seat_count: number | null;
  // Place details
  pickup_place_name: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_place_name: string | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  // Agency details
  agencies?: {
    id: string;
    agency_name: string;
  } | null;
}

const DriverJobDetails = () => {
  const { id } = useParams();
  const { user, signOut } = useAuth();
  const { driverId } = useUserRole();
  const navigate = useNavigate();
  const { emailAdminTripCompleted } = useEmailNotifications();
  const { t, getPaymentTypeLabel } = useDriverTranslations();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState<string | null>(null);
  const [tryAmount, setTryAmount] = useState<number | null>(null);
  
  // Driver editable fields
  const [driverPrice, setDriverPrice] = useState('');
  const [driverCashAmount, setDriverCashAmount] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [savingFinancials, setSavingFinancials] = useState(false);

  // Keep latest translation function without re-triggering data effects
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const reservationRef = useRef<Reservation | null>(null);
  useEffect(() => {
    reservationRef.current = reservation;
  }, [reservation]);

  // Fetch TL equivalent when cash amount is not in TRY
  useEffect(() => {
    const fetchTryAmount = async () => {
      if (
        reservation?.passenger_cash_amount &&
        reservation.passenger_cash_amount > 0 &&
        reservation.passenger_cash_currency &&
        reservation.passenger_cash_currency !== 'TRY'
      ) {
        try {
          const { data, error } = await supabase.functions.invoke('get-exchange-rate', {
            body: {
              from_currency: reservation.passenger_cash_currency,
              to_currency: 'TRY',
              amount: reservation.passenger_cash_amount
            }
          });
          if (!error && data?.converted_amount) {
            setTryAmount(Math.round(data.converted_amount));
          }
        } catch (err) {
          console.error('Failed to fetch TRY amount:', err);
        }
      }
    };
    fetchTryAmount();
  }, [reservation?.passenger_cash_amount, reservation?.passenger_cash_currency]);

  const initializedFinancialsForIdRef = useRef<string | null>(null);

  const statusColors: Record<string, string> = {
    'sent_to_driver': 'bg-yellow-500/20 text-yellow-700',
    'active': 'bg-blue-500/20 text-blue-700',
    'completed': 'bg-green-500/20 text-green-700',
    'cancelled': 'bg-red-500/20 text-red-700',
    'cancelled_by_customer': 'bg-red-500/20 text-red-700',
    'cancelled_by_agency': 'bg-red-500/20 text-red-700',
    'customer_rejected': 'bg-red-500/20 text-red-700',
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'sent_to_driver': t('assigned'),
      'assigned': t('assigned'),
      'active': t('inProgress'),
      'completed': t('completed'),
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // Fetch reservation with agency
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('*, agencies (id, agency_name)')
        .eq('id', id)
        .maybeSingle();

      if (resError) {
        console.error('Error:', resError);
        toast.error(tRef.current('failedToSave'));
        setLoading(false);
        return;
      }

      if (resData) {
        setReservation(resData);

        // Initialize editable financial fields only once per reservation
        if (initializedFinancialsForIdRef.current !== resData.id) {
          initializedFinancialsForIdRef.current = resData.id;
          // Bütçe = driver_earning (job cost/expense), NOT price
          setDriverPrice(resData.driver_earning?.toString() || '');
          setDriverCashAmount(resData.driver_cash_amount?.toString() || '');
          setDriverNotes(resData.driver_notes || '');
        }

        // Fetch admin notes
        const { data: notesData } = await supabase
          .from('reservation_admin_notes')
          .select('notes')
          .eq('reservation_id', resData.id)
          .maybeSingle();

        if (notesData?.notes) {
          setAdminNotes(notesData.notes);
        }
      }
      setLoading(false);
    };

    fetchData();

    // Set up real-time subscription for flight updates
    if (id) {
      const channel = supabase
        .channel(`reservation-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'reservations',
            filter: `id=eq.${id}`,
          },
          (payload) => {
            console.log('[DriverJobDetails] Real-time update received:', payload);
            const newData = payload.new as Reservation;

            const prev = reservationRef.current;
            // Check if flight data changed
            if (
              newData.flight_arrival_time !== prev?.flight_arrival_time ||
              newData.flight_status !== prev?.flight_status
            ) {
              toast.info(tRef.current('flightUpdated'), {
                icon: <Plane className="h-4 w-4" />,
              });
            }

            setReservation(newData);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return '-';
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price}`;
  };

  const confirmJob = async () => {
    if (!id) return;
    setUpdating(true);

    const { error } = await supabase
      .from('reservations')
      .update({ 
        driver_confirmed: true,
        status: 'active'
      })
      .eq('id', id);

    if (error) {
      toast.error(t('failedToAccept'));
    } else {
      toast.success(t('jobAccepted'));
      setReservation(prev => prev ? { ...prev, driver_confirmed: true, status: 'active' } : null);
    }
    setUpdating(false);
  };

  const saveFinancials = async () => {
    if (!id) return;
    setSavingFinancials(true);

    const finalBudget = parseMoneyInput(driverPrice);
    const finalCashAmount = parseMoneyInput(driverCashAmount);

    // Driver can update driver_earning (Bütçe/job cost), cash amount, and notes
    // NOTE: driver_earning is used for job cost/budget, NOT price (which is customer price)
    const { error } = await supabase
      .from('reservations')
      .update({
        driver_earning: finalBudget,
        driver_cash_amount: finalCashAmount,
        driver_notes: driverNotes?.trim() || null
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to save financials:', error);
      toast.error(t('failedToSave') + ': ' + (error.message || 'Unknown error'));
    } else {
      toast.success(t('changesSaved'));
      setReservation(prev => prev ? {
        ...prev,
        driver_earning: finalBudget,
        driver_cash_amount: finalCashAmount,
        driver_notes: driverNotes?.trim() || null
      } : null);
    }
    setSavingFinancials(false);
  };

  // Completion validation hook
  const completionValidation = useCompletionValidation(reservation);

  const updateStatus = async (newStatus: string, driverCash?: boolean) => {
    if (!id || !reservation) return;
    
    // Validate completion if trying to complete
    if (newStatus === 'completed') {
      if (!completionValidation.canComplete) {
        if (completionValidation.isCompleted) {
          toast.error(t('alreadyCompleted'));
        } else {
          toast.error(completionValidation.reason || t('cannotCompleteNow'));
        }
        return;
      }
    }
    
    setUpdating(true);

    const updateData: any = { 
      status: newStatus,
      updated_at: new Date().toISOString() // Store completion timestamp
    };
    if (driverCash !== undefined) {
      updateData.driver_cash = driverCash;
    }

    const { error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast.error(t('failedToComplete'));
    } else {
      toast.success(`${t('statusUpdated')}: ${getStatusLabel(newStatus)}`);
      setReservation(prev => prev ? { ...prev, status: newStatus } : null);
      setShowCashDialog(false);

      // Notify customer when trip is completed
      if (newStatus === 'completed') {
        try {
          // Get driver name
          const { data: driverData } = await supabase
            .from('drivers')
            .select('name')
            .eq('id', driverId)
            .maybeSingle();

          // Create notification for customer
          const { data: resData } = await supabase
            .from('reservations')
            .select('customer_id, agency_id, reservation_code, pickup_date, pickup, dropoff')
            .eq('id', id)
            .single();

          if (resData?.customer_id) {
            await supabase.from('notifications').insert({
              user_id: resData.customer_id,
              reservation_id: id,
              type: 'trip_completed',
              title: '🎉 Trip Completed',
              message: 'Your trip has been completed. Thank you for choosing Meet Transfer!'
            });

            // Try to send push notification
            try {
              await supabase.functions.invoke('send-push-notification', {
                body: {
                  user_id: resData.customer_id,
                  title: '🎉 Trip Completed',
                  body: 'Your trip has been completed. Thank you for choosing Meet Transfer!',
                  data: { reservation_id: id }
                }
              });
            } catch (pushError) {
              console.log('Push notification failed:', pushError);
            }

            // Send review request email to customer
            try {
              // Get customer email from profiles
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', resData.customer_id)
                .maybeSingle();
              
              // Get customer email from auth (need to get from reservation or booking info)
              const { data: authData } = await supabase.auth.admin?.getUserById?.(resData.customer_id) || {};
              
              // Send review request
              await supabase.functions.invoke('send-review-request', {
                body: {
                  reservationId: id,
                  customerEmail: authData?.user?.email || '',
                  customerName: reservation?.customer_name || profileData?.full_name || 'Customer',
                  driverName: driverData?.name || 'Your Driver',
                  reservationCode: resData.reservation_code || id.slice(0, 8),
                  pickupDate: resData.pickup_date,
                  pickup: resData.pickup,
                  dropoff: resData.dropoff
                }
              });
              console.log('Review request email sent');
            } catch (emailError) {
              console.log('Review request email failed:', emailError);
            }
          }

          // If agency reservation, deduct balance
          if (resData?.agency_id) {
            try {
              await supabase.functions.invoke('deduct-agency-balance', {
                body: { reservation_id: id }
              });
              console.log('Agency balance deduction triggered');
            } catch (balanceError) {
              console.error('Balance deduction failed:', balanceError);
            }
          }

          // Driver earnings are calculated from completed reservations (price - cash)
          // No driver_payment inserted here - payments are only for admin-initiated transactions
          console.log(`Job completed. Earning calculated from reservation: price=${reservation?.price}, cash=${reservation?.driver_cash_amount}`);

          // Notify admins (in-app + push)
          await supabase.functions.invoke('create-notification', {
            body: {
              type: 'trip_completed',
              title: '✅ Trip Completed',
              message: `${driverData?.name || 'Driver'} completed trip #${id.slice(0, 8)}.`,
              notify_admins: true,
              reservation_id: id,
              send_push: true
            }
          });

          // Send email to admin about trip completion
          try {
            await emailAdminTripCompleted(id, driverData?.name);
            console.log('Trip completed email sent to admin');
          } catch (emailError) {
            console.error('Failed to send trip completed email:', emailError);
          }
        } catch (notifyError) {
          console.error('Failed to send notifications:', notifyError);
        }
      }
    }
    setUpdating(false);
  };

  const handleComplete = () => {
    if (reservation?.payment_type === 'cash') {
      setShowCashDialog(true);
    } else {
      updateStatus('completed', false);
    }
  };

  const copyReservationDetails = async () => {
    if (!reservation) return;

    const passengerList = reservation.passenger_names && reservation.passenger_names.length > 0
      ? reservation.passenger_names.map((name, index) => `  ${index + 1}. ${name}`).join('\n')
      : `  1. ${reservation.customer_name}`;

    const formattedDate = format(new Date(reservation.pickup_date), 'dd MMM yyyy');

    // Format location with place name + address
    const formatLocation = (placeName: string | null, address: string) => {
      if (placeName && placeName.trim() && !address.toLowerCase().startsWith(placeName.toLowerCase())) {
        return `${placeName}\n${address}`;
      }
      return address;
    };
    
    const pickupFormatted = formatLocation(reservation.pickup_place_name, reservation.pickup);
    const dropoffFormatted = formatLocation(reservation.dropoff_place_name, reservation.dropoff);
    
    const text = `---------------------------------
${t('reservationCode')}: ${reservation.reservation_code || reservation.id.slice(0, 8)}
${t('date')} & ${t('time')}: ${formattedDate} – ${reservation.pickup_time}

${t('passengers')}:
${passengerList}

${t('pickupPoint')}:
${pickupFormatted}

${t('dropoffPoint')}:
${dropoffFormatted}

${reservation.flight_number ? `${t('flightNumber')}: ${reservation.flight_number}\n` : ''}
${t('vehicle')}: ${vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}
${reservation.luggage_count ? `${t('luggageCount')}: ${reservation.luggage_count}\n` : ''}${reservation.baby_seat_count ? `${t('babySeat')}: ${reservation.baby_seat_count}\n` : ''}${reservation.passenger_cash_amount ? `${t('cashToCollect')}: ${getCurrencySymbol(reservation.passenger_cash_currency)}${reservation.passenger_cash_amount}\n` : ''}${t('cashCollectedLabel')}: ${reservation.driver_cash_amount ? `${getCurrencySymbol('TRY')}${reservation.driver_cash_amount}` : '—'}

${t('phone')}: ${reservation.customer_phone}
${adminNotes ? `${t('adminNotes')}: ${adminNotes}\n` : ''}${t('notes')}: ${reservation.driver_notes || '—'}
---------------------------------`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('detailsCopied'));
    } catch (err) {
      toast.error(t('copyFailed'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('reservationNotFound')}</p>
      </div>
    );
  }

  const driverCurrencySymbol = getCurrencySymbol('TRY');

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/driver')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">{t('jobDetails')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Badge className={statusColors[reservation.status] || 'bg-muted'}>
            {getStatusLabel(reservation.status)}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="space-y-2">
              {reservation.reservation_code && (
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">{reservation.reservation_code}</span>
              )}
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(new Date(reservation.pickup_date), 'EEEE, d MMMM yyyy', { locale: tr })}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Agency Badge */}
            {reservation.agencies && (
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg px-4 py-3">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">{t('agencyReservation')}</div>
                  <div className="font-semibold text-purple-700 dark:text-purple-300">{reservation.agencies.agency_name}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{reservation.pickup_time}</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('mainCustomer')}</div>
                  <div className="font-medium">{reservation.customer_name}</div>
                </div>
              </div>

              {reservation.passenger_names && reservation.passenger_names.length > 1 && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('allPassengers')} ({reservation.passenger_names.length})</div>
                    <div className="space-y-1 mt-1">
                      {reservation.passenger_names.map((name, index) => (
                        <div key={index} className="font-medium text-sm">
                          {index + 1}. {name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('phone')}</div>
                  <a href={`tel:${reservation.customer_phone}`} className="font-medium text-primary">
                    {reservation.customer_phone}
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">{t('pickupPoint')}</div>
                  <LocationDisplay
                    placeName={reservation.pickup_place_name}
                    address={reservation.pickup}
                    type="pickup"
                    size="lg"
                    showIcon={false}
                  />
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">{t('dropoffPoint')}</div>
                  <LocationDisplay
                    placeName={reservation.dropoff_place_name}
                    address={reservation.dropoff}
                    type="dropoff"
                    size="lg"
                    showIcon={false}
                  />
                </div>
              </div>

              {reservation.flight_number && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Plane className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">{t('flight')}</div>
                      <AirlineDisplay flightNumber={reservation.flight_number} size="md" />
                      {reservation.flight_arrival_time && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs bg-primary/10">
                            <Clock className="h-3 w-3 mr-1" />
                            {t('arrival')}: {reservation.flight_arrival_time}
                          </Badge>
                          {reservation.flight_status && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {reservation.flight_status}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <FlightStatus 
                    flightNumber={reservation.flight_number} 
                    date={reservation.pickup_date}
                    reservationId={reservation.id}
                    refreshIntervalMs={5 * 60 * 1000}
                    onArrivalTimeChange={(time) => {
                      console.log('[DriverJobDetails] Flight arrival time updated:', time);
                      // Update local state immediately for better UX
                      setReservation(prev => prev ? { ...prev, flight_arrival_time: time } : null);
                    }}
                  />
                </div>
              )}

              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('vehicle')}</div>
                  <div className="font-medium">{vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}</div>
                </div>
              </div>

              {/* Luggage and Baby Seat Info */}
              {((reservation.luggage_count && reservation.luggage_count > 0) || (reservation.baby_seat_count && reservation.baby_seat_count > 0)) && (
                <div className="flex flex-wrap gap-3">
                  {reservation.luggage_count && reservation.luggage_count > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                      <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {reservation.luggage_count} {t('luggage') || 'Bavul'}
                      </span>
                    </div>
                  )}
                  {reservation.baby_seat_count && reservation.baby_seat_count > 0 && (
                    <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 rounded-lg px-3 py-2">
                      <Baby className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                      <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
                        {reservation.baby_seat_count} {t('babySeat') || 'Bebek Koltuğu'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('paymentMethod')}</div>
                  {reservation.payment_type === 'payment_link' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mt-1">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {t('paymentLink')}
                    </Badge>
                  ) : reservation.payment_type === 'agency_pay' ? (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mt-1">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {t('agencyPayment')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-1">
                      <Banknote className="h-3 w-3 mr-1" />
                      {t('cash')}
                    </Badge>
                  )}
                  {reservation.payment_type === 'cash' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('customerWillPayCash')}
                    </p>
                  )}
                  {reservation.payment_type === 'payment_link' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('customerPaidOnline')}
                    </p>
                  )}
                  {reservation.payment_type === 'agency_pay' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('agencyWillPay')}
                    </p>
                  )}
                </div>
              </div>

              {/* Price Display - Hidden from drivers, they only see passenger cash */}

              {/* Yolcudan Alınacak Nakit - Prominent Display */}
              {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 p-5 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-3 rounded-full">
                        <Banknote className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white/90">{t('cashToCollect')}</div>
                        <div className="text-xs text-white/70 mt-0.5">{t('collectAtEnd')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-4xl text-white drop-shadow-lg">
                        {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount.toLocaleString('tr-TR')}
                      </div>
                      {/* TL equivalent */}
                      {tryAmount && reservation.passenger_cash_currency !== 'TRY' && (
                        <div className="text-lg text-white/80 font-semibold mt-1">
                          ≈ ₺{tryAmount.toLocaleString('tr-TR')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Notes - Read Only */}
              {reservation.customer_notes && (
                <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-xl border border-amber-200 dark:border-amber-700">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-500 p-2 rounded-full flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('customerSpecialRequests')}</div>
                      <div className="text-sm text-amber-700 dark:text-amber-300 mt-1 whitespace-pre-wrap">{reservation.customer_notes}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes - Read Only */}
              {adminNotes && (
                <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 p-2 rounded-full flex-shrink-0">
                      <ClipboardCopy className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">{t('adminNotes')}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 whitespace-pre-wrap">{adminNotes}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Driver Editable Fields Card - Bütçe ve Nakit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="h-5 w-5" />
              {t('budgetAndCash') || 'Bütçe & Nakit'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Budget Field - Bütçe Tutarı */}
            <div className="space-y-2">
              <Label htmlFor="driver_budget" className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {t('budgetAmount') || 'Bütçe Tutarı'} (₺)
              </Label>
              <MoneyInput
                id="driver_budget"
                currencySymbol="₺"
                placeholder={t('enterBudget') || 'Bütçe tutarını girin'}
                value={driverPrice}
                onValueChange={setDriverPrice}
                aria-label={t('budgetAmount') || 'Bütçe Tutarı'}
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground">
                {t('budgetInfo') || 'Bu tutar şoför gideri olarak kaydedilecektir.'}
              </p>
            </div>

            {/* Cash Collected Field */}
            <div className="space-y-2">
              <Label htmlFor="driver_cash" className="text-base font-semibold flex items-center gap-2">
                <Banknote className="h-4 w-4 text-green-600" />
                {t('cashCollectedLabel')} ({driverCurrencySymbol})
              </Label>
              <MoneyInput
                id="driver_cash"
                currencySymbol={driverCurrencySymbol}
                placeholder={t('enterCashAmount')}
                value={driverCashAmount}
                onValueChange={setDriverCashAmount}
                aria-label={`${t('cashCollectedLabel')} (${driverCurrencySymbol})`}
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground">
                {t('cashInfo') || 'Yolcudan toplanan nakit tutar. Bu tutar alacağınızdan düşülür.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_notes">{t('notesAdditional')}</Label>
              <Textarea
                id="driver_notes"
                placeholder={t('notesPlaceholder')}
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={saveFinancials} 
              disabled={savingFinancials}
              className="w-full"
              size="lg"
            >
            {savingFinancials ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('saveChanges')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Route Map Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              {t('routeMap')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GoogleRouteMap
              pickup={reservation.pickup}
              dropoff={reservation.dropoff}
              customerPhone={reservation.customer_phone}
            />
          </CardContent>
        </Card>

        {/* Copy Reservation Details Button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={copyReservationDetails}
        >
          <ClipboardCopy className="h-5 w-5 mr-2" />
          {t('copyReservationDetails')}
        </Button>

        {/* Action Buttons Card */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            {reservation.status === 'sent_to_driver' && !reservation.driver_confirmed && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={confirmJob}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                {t('confirmJob')}
              </Button>
            )}

            {(reservation.status === 'sent_to_driver' && reservation.driver_confirmed) && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => updateStatus('active')}
                disabled={updating}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {t('passengerPickedUp')}
              </Button>
            )}
            
            {reservation.status === 'active' && (
              <>
                {/* Show warning if completion not allowed */}
                {!completionValidation.canComplete && completionValidation.reason && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {completionValidation.reason}
                    </AlertDescription>
                  </Alert>
                )}
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleComplete}
                  disabled={updating || !completionValidation.canComplete}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {t('transferCompleted')}
                </Button>
              </>
            )}

            {reservation.status === 'completed' && (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-medium text-green-600">{t('transferCompleted')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Cash Collection Dialog */}
      <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cashCollection')}</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            {t('didYouCollectCash')}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => updateStatus('completed', false)} disabled={updating}>
              {t('noDidNotCollect')}
            </Button>
            <Button onClick={() => updateStatus('completed', true)} disabled={updating}>
              {t('yesCollectedCash')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverJobDetails;