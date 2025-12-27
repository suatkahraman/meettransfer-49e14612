import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useCompletionValidation } from '@/hooks/useCompletionValidation';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, User, Users, Phone, Plane, Car, CreditCard, CheckCircle, Save, Loader2, DollarSign, Map, ClipboardCopy, AlertCircle, Banknote, RefreshCw, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import NotificationBell from '@/components/NotificationBell';
import GoogleRouteMap from '@/components/ui/google-route-map';
import { AirlineDisplay } from '@/components/ui/airline-display';
import { FlightStatus } from '@/components/ui/flight-status';
import { LocationDisplay } from '@/components/ui/location-display';

const vehicleTypeLabels: Record<string, string> = {
  'mercedes-vito': 'Mercedes Vito',
  'mercedes-vclass': 'Mercedes Vip Vito',
  'maybach': 'Maybach',
  'minibus': 'Minibus',
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
  // Place details
  pickup_place_name: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_place_name: string | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
}

const statusColors: Record<string, string> = {
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-blue-500/20 text-blue-700',
  'completed': 'bg-green-500/20 text-green-700',
};

const statusLabels: Record<string, string> = {
  'sent_to_driver': 'Atandı',
  'assigned': 'Atandı',
  'active': 'Devam Ediyor',
  'completed': 'Tamamlandı',
};

const currencySymbols: Record<string, string> = {
  'TRY': '₺',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
};

const DriverJobDetails = () => {
  const { id } = useParams();
  const { user, signOut } = useAuth();
  const { driverId } = useUserRole();
  const navigate = useNavigate();
  const { emailAdminTripCompleted } = useEmailNotifications();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState<string | null>(null);
  
  // Driver editable fields
  const [driverPrice, setDriverPrice] = useState('');
  const [driverCashAmount, setDriverCashAmount] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [savingFinancials, setSavingFinancials] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // Fetch reservation
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (resError) {
        console.error('Error:', resError);
        toast.error('Failed to load job details');
        setLoading(false);
        return;
      }
      
      if (resData) {
        setReservation(resData);
        setDriverPrice(resData.price?.toString() || '');
        setDriverCashAmount(resData.driver_cash_amount?.toString() || '');
        setDriverNotes(resData.driver_notes || '');
        
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
            
            // Check if flight data changed
            if (newData.flight_arrival_time !== reservation?.flight_arrival_time ||
                newData.flight_status !== reservation?.flight_status) {
              toast.info('Uçuş bilgisi güncellendi!', {
                icon: <Plane className="h-4 w-4" />,
              });
            }
            
            setReservation(newData);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id, driverId]);

  const getCurrencySymbol = (currency: string | null) => {
    return currencySymbols[currency || 'TRY'] || currency || '₺';
  };

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
      toast.error('Failed to confirm job');
    } else {
      toast.success('Job confirmed successfully!');
      setReservation(prev => prev ? { ...prev, driver_confirmed: true, status: 'active' } : null);
    }
    setUpdating(false);
  };

  const saveFinancials = async () => {
    if (!id) return;
    setSavingFinancials(true);

    // Driver can update price, cash amount, and notes
    const { error } = await supabase
      .from('reservations')
      .update({
        price: driverPrice ? parseFloat(driverPrice) : null,
        driver_cash_amount: driverCashAmount ? parseFloat(driverCashAmount) : null,
        driver_notes: driverNotes || null
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to save changes');
    } else {
      toast.success('Changes saved successfully!');
      setReservation(prev => prev ? {
        ...prev,
        price: driverPrice ? parseFloat(driverPrice) : null,
        driver_cash_amount: driverCashAmount ? parseFloat(driverCashAmount) : null,
        driver_notes: driverNotes || null
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
          toast.error('Bu transfer zaten tamamlanmış');
        } else {
          toast.error(completionValidation.reason || 'Bu transfer şu anda tamamlanamaz');
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
      toast.error('Failed to update status');
    } else {
      toast.success(`Status updated to ${statusLabels[newStatus] || newStatus}`);
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

          // Notify admins (in-app)
          await supabase.functions.invoke('create-notification', {
            body: {
              type: 'trip_completed',
              title: '✅ Trip Completed',
              message: `${driverData?.name || 'Driver'} completed trip #${id.slice(0, 8)}.`,
              notify_admins: true,
              reservation_id: id,
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
    const currencySymbol = getCurrencySymbol(reservation.price_currency);
    
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
Rezervasyon Kodu: ${reservation.reservation_code || reservation.id.slice(0, 8)}
Tarih & Saat: ${formattedDate} – ${reservation.pickup_time}

Yolcular:
${passengerList}

Alış Noktası:
${pickupFormatted}

Bırakış Noktası:
${dropoffFormatted}

${reservation.flight_number ? `Uçuş No: ${reservation.flight_number}\n` : ''}
Araç: ${vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}
Ücret: ${reservation.price ? `${currencySymbol}${reservation.price}` : '—'}
Toplanan Nakit: ${reservation.driver_cash_amount ? `${currencySymbol}${reservation.driver_cash_amount}` : '—'}

Müşteri Telefon: ${reservation.customer_phone}
${adminNotes ? `Admin Notları: ${adminNotes}\n` : ''}Notlar: ${reservation.driver_notes || '—'}
---------------------------------`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Rezervasyon detayları kopyalandı.');
    } catch (err) {
      toast.error('Kopyalama başarısız oldu.');
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
        <p>Job not found</p>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(reservation.price_currency);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/driver')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">İş Detayı</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Badge className={statusColors[reservation.status] || 'bg-muted'}>
            {statusLabels[reservation.status] || reservation.status}
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
                {format(new Date(reservation.pickup_date), 'PPPP')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{reservation.pickup_time}</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Ana Müşteri</div>
                  <div className="font-medium">{reservation.customer_name}</div>
                </div>
              </div>

              {reservation.passenger_names && reservation.passenger_names.length > 1 && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Tüm Yolcular ({reservation.passenger_names.length})</div>
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
                  <div className="text-sm text-muted-foreground">Telefon</div>
                  <a href={`tel:${reservation.customer_phone}`} className="font-medium text-primary">
                    {reservation.customer_phone}
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Alış Noktası</div>
                  <LocationDisplay
                    placeName={reservation.pickup_place_name}
                    address={reservation.pickup}
                    type="pickup"
                    size="lg"
                    showIcon={false}
                  />
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Bırakış Noktası</div>
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
                      <div className="text-sm text-muted-foreground">Uçuş</div>
                      <AirlineDisplay flightNumber={reservation.flight_number} size="md" />
                      {reservation.flight_arrival_time && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs bg-primary/10">
                            <Clock className="h-3 w-3 mr-1" />
                            Varış: {reservation.flight_arrival_time}
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
                  <div className="text-sm text-muted-foreground">Araç</div>
                  <div className="font-medium">{vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Ödeme Yöntemi</div>
                  {reservation.payment_type === 'payment_link' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mt-1">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Payment Link
                    </Badge>
                  ) : reservation.payment_type === 'agency_pay' ? (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mt-1">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Acente Ödemesi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-1">
                      <Banknote className="h-3 w-3 mr-1" />
                      Nakit Ödeme
                    </Badge>
                  )}
                  {reservation.payment_type === 'cash' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Müşteri transferin sonunda size nakit ödeme yapacak
                    </p>
                  )}
                  {reservation.payment_type === 'payment_link' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Müşteri online ödeme yaptı - nakit almayın
                    </p>
                  )}
                  {reservation.payment_type === 'agency_pay' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ödeme acente tarafından yapılacak - nakit almayın
                    </p>
                  )}
                </div>
              </div>

              {/* Price Display */}
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Bütçe</div>
                  <div className="font-bold text-lg">{formatPrice(reservation.price, reservation.price_currency)}</div>
                </div>
              </div>

              {/* Yolcudan Alınacak Nakit - Display only if set */}
              {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
                <div className="bg-amber-100 dark:bg-amber-950/50 p-4 rounded-xl border-2 border-amber-300 dark:border-amber-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-500 p-2 rounded-full">
                        <Banknote className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-amber-800 dark:text-amber-200">Yolcudan Alınacak Nakit</div>
                        <div className="text-xs text-amber-600 dark:text-amber-400">Transfer sonunda tahsil edilecek</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-2xl text-amber-800 dark:text-amber-200">
                        {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount}
                      </div>
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
                      <div className="text-sm font-medium text-amber-800 dark:text-amber-200">Müşteri Özel İstekleri</div>
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
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Admin Notları</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 whitespace-pre-wrap">{adminNotes}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Currency Display - READ ONLY */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Para Birimi</span>
                <span className="font-medium">{reservation.price_currency || 'TRY'} ({currencySymbol})</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Para birimi admin tarafından belirlenir - düzenlenemez
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Driver Editable Fields Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Transfer Ücreti & Nakit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driver_price">Transfer Ücreti ({currencySymbol})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input
                  id="driver_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Son transfer ücretini girin"
                  value={driverPrice}
                  onChange={(e) => setDriverPrice(e.target.value)}
                  className="pl-8 text-lg font-semibold"
                />
              </div>
              <p className="text-xs text-muted-foreground">Bu transfer için son ücreti güncelleyebilirsiniz</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_cash">Toplanan Nakit ({currencySymbol})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input
                  id="driver_cash"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Toplanan nakit tutarını girin"
                  value={driverCashAmount}
                  onChange={(e) => setDriverCashAmount(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_notes">Notlar / Ek Bilgi</Label>
              <Textarea
                id="driver_notes"
                placeholder="Gecikmeler, ekstra duraklar, özel durumlar..."
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
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Değişiklikleri Kaydet
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
              Güzergah Haritası
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
          Rezervasyon Detaylarını Kopyala
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
                İşi Onayla
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
                Yolcu Alındı
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
                  Transfer Tamamlandı
                </Button>
              </>
            )}

            {reservation.status === 'completed' && (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-medium text-green-600">Transfer Tamamlandı</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Cash Collection Dialog */}
      <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nakit Tahsilat</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Müşteriden {formatPrice(reservation.price, reservation.price_currency)} nakit ödeme aldınız mı?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => updateStatus('completed', false)} disabled={updating}>
              Hayır, Almadım
            </Button>
            <Button onClick={() => updateStatus('completed', true)} disabled={updating}>
              Evet, Aldım
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverJobDetails;