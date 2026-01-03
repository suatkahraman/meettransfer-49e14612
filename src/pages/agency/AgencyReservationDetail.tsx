import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { useAgencyLanguage } from '@/contexts/AgencyLanguageContext';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, User, Users, Phone, Plane, Car, Loader2, Save, Edit, Copy, MessageCircle, CheckCircle, XCircle, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { AirlineDisplay } from '@/components/ui/airline-display';
import { LocationDisplay } from '@/components/ui/location-display';

interface Driver {
  id: string;
  name: string;
  plate_number: string | null;
  vehicle_model: string | null;
  phone: string;
}

interface Reservation {
  id: string;
  reservation_code: string | null;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  status: string;
  passenger_names: string[] | null;
  driver_id: string | null;
  price: number | null;
  price_currency: string | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  drivers?: Driver | null;
}

interface AgencyReservationDetail {
  id: string;
  reservation_id: string;
  customer_price: number;
  company_amount: number;
  agency_profit: number;
  agency_notes: string | null;
  payment_status: string;
}

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-gray-500/20 text-gray-700',
  'pending_admin_review': 'bg-amber-500/20 text-amber-700',
  'waiting_for_agency_approval': 'bg-purple-500/20 text-purple-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'confirmed': 'bg-green-500/20 text-green-700',
  'sent_to_driver': 'bg-purple-500/20 text-purple-700',
  'assigned': 'bg-purple-500/20 text-purple-700',
  'active': 'bg-blue-500/20 text-blue-700',
  'completed': 'bg-green-500/20 text-green-700',
  'customer_rejected': 'bg-red-500/20 text-red-700',
};

const statusLabels: Record<string, string> = {
  'awaiting-price': 'Awaiting Price',
  'pending_admin_review': 'Pending Admin Review',
  'waiting_for_agency_approval': 'Waiting for Your Approval',
  'customer_approved': 'Meet Transfer Approved',
  'confirmed': 'Confirmed',
  'sent_to_driver': 'Sent to Driver',
  'assigned': 'Assigned',
  'active': 'Active',
  'completed': 'Completed',
  'customer_rejected': 'Rejected',
};

const paymentStatusLabels: Record<string, string> = {
  'not_paid': 'Not Paid',
  'partially_paid': 'Partially Paid',
  'paid': 'Paid',
};

const AgencyReservationDetail = () => {
  const { id } = useParams();
  const { agencyId } = useUserRole();
  const { t } = useAgencyTranslations();
  const { currencySymbol } = useAgencyLanguage();
  const { emailAdminAgencyPriceApproved, emailAdminAgencyPriceRejected, emailAdminReservationCancelled } = useEmailNotifications();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [agencyDetails, setAgencyDetails] = useState<AgencyReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Editable fields
  const [customerPrice, setCustomerPrice] = useState('');
  const [companyAmount, setCompanyAmount] = useState('');
  const [agencyNotes, setAgencyNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('not_paid');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // Fetch reservation with driver info and price
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select(`
          id, reservation_code, customer_name, customer_phone, pickup, dropoff,
          pickup_place_name, dropoff_place_name,
          pickup_date, pickup_time, flight_number, vehicle_type, status,
          passenger_names, driver_id, price, price_currency,
          passenger_cash_amount, passenger_cash_currency,
          drivers:driver_id (id, name, plate_number, vehicle_model, phone)
        `)
        .eq('id', id)
        .single();

      if (resError) {
        console.error('Error:', resError);
        toast.error('Failed to load reservation');
        setLoading(false);
        return;
      }

      setReservation(resData);

      // Fetch agency-specific details
      const { data: detailData } = await supabase
        .from('agency_reservation_details')
        .select('*')
        .eq('reservation_id', id)
        .maybeSingle();

      if (detailData) {
        setAgencyDetails(detailData);
        setCustomerPrice(detailData.customer_price?.toString() || '0');
        setCompanyAmount(detailData.company_amount?.toString() || '0');
        setAgencyNotes(detailData.agency_notes || '');
        setPaymentStatus(detailData.payment_status || 'not_paid');
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (!id || !agencyId) return;
    setSaving(true);

    const detailsData = {
      reservation_id: id,
      customer_price: parseFloat(customerPrice) || 0,
      company_amount: parseFloat(companyAmount) || 0,
      agency_notes: agencyNotes || null,
      payment_status: paymentStatus,
    };

    try {
      if (agencyDetails) {
        // Update existing
        const { error } = await supabase
          .from('agency_reservation_details')
          .update(detailsData)
          .eq('id', agencyDetails.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('agency_reservation_details')
          .insert(detailsData);

        if (error) throw error;
      }

      toast.success('Changes saved successfully');
      setIsEditing(false);

      // Refresh data
      const { data } = await supabase
        .from('agency_reservation_details')
        .select('*')
        .eq('reservation_id', id)
        .maybeSingle();

      if (data) {
        setAgencyDetails(data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Handle agency price approval
  const handleApprovePrice = async () => {
    if (!id) return;
    
    if (!window.confirm(t('confirmApproval'))) return;
    
    setApproving(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'customer_approved' })
        .eq('id', id);

      if (error) throw error;

      // Send email to admin
      try {
        console.log('Sending agency price approved email for reservation:', id);
        const emailResult = await emailAdminAgencyPriceApproved(id);
        if (!emailResult.success) {
          console.error('Agency price approved email failed:', emailResult.error);
        } else {
          console.log('Agency price approved email sent successfully');
        }
      } catch (e) {
        console.error('Failed to send agency price approved email:', e);
      }

      // Notify admins in-app
      try {
        const { data: adminUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        if (adminUsers && adminUsers.length > 0) {
          for (const admin of adminUsers) {
            await supabase.functions.invoke('create-notification', {
              body: {
                user_id: admin.user_id,
                reservation_id: id,
                title: 'Acenta Fiyatı Onayladı',
                message: `Acenta fiyatı onayladı. Rezervasyon onaylandı.`,
                type: 'agency_price_approved'
              }
            });
          }
        }
      } catch (e) {
        console.error('Failed to notify admins:', e);
      }

      toast.success(t('priceApproved'));
      setReservation(prev => prev ? { ...prev, status: 'customer_approved' } : null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  // Handle agency price rejection
  const handleRejectPrice = async () => {
    if (!id) return;
    
    if (!window.confirm(t('confirmRejection'))) return;
    
    setRejecting(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'customer_rejected' })
        .eq('id', id);

      if (error) throw error;

      // Send email to admin
      try {
        console.log('Sending agency price rejected email for reservation:', id);
        const emailResult = await emailAdminAgencyPriceRejected(id);
        if (!emailResult.success) {
          console.error('Agency price rejected email failed:', emailResult.error);
        } else {
          console.log('Agency price rejected email sent successfully');
        }
      } catch (e) {
        console.error('Failed to send agency price rejected email:', e);
      }

      // Notify admins in-app
      try {
        const { data: adminUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        if (adminUsers && adminUsers.length > 0) {
          for (const admin of adminUsers) {
            await supabase.functions.invoke('create-notification', {
              body: {
                user_id: admin.user_id,
                reservation_id: id,
                title: 'Acenta Fiyatı Reddetti',
                message: `Acenta belirlenen fiyatı reddetti.`,
                type: 'agency_price_rejected'
              }
            });
          }
        }
      } catch (e) {
        console.error('Failed to notify admins:', e);
      }

      toast.success(t('priceRejected'));
      setReservation(prev => prev ? { ...prev, status: 'customer_rejected' } : null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject');
    } finally {
      setRejecting(false);
    }
  };

  // Handle cancel reservation
  const handleCancelReservation = async () => {
    if (!id || !reservation) return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled_by_customer' })
        .eq('id', id);

      if (error) throw error;

      // Notify admins (in-app + push)
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'agency_reservation_cancelled',
            title: 'Acenta Rezervasyonu İptal Etti',
            message: `Acenta rezervasyonu iptal etti. Kod: ${reservation.reservation_code}`,
            notify_admins: true,
            reservation_id: id,
            send_push: true,
          }
        });
      } catch (e) {
        console.error('Failed to notify admins:', e);
      }

      // Send email to admin
      try {
        await emailAdminReservationCancelled(id);
      } catch (e) {
        console.error('Failed to send admin email:', e);
      }

      // If driver was assigned, notify them too
      if (reservation.driver_id) {
        try {
          const { data: driver } = await supabase
            .from('drivers')
            .select('user_id')
            .eq('id', reservation.driver_id)
            .single();

          if (driver?.user_id) {
            await supabase.functions.invoke('create-notification', {
              body: {
                user_id: driver.user_id,
                reservation_id: id,
                title: 'Rezervasyon İptal Edildi',
                message: `Rezervasyon ${reservation.reservation_code} acenta tarafından iptal edildi.`,
                type: 'reservation_cancelled',
                send_push: true,
              }
            });
          }
        } catch (e) {
          console.error('Failed to notify driver:', e);
        }
      }

      toast.success(t('reservationCancelled'));
      navigate('/agency');
    } catch (error: any) {
      toast.error(error.message || t('failedToCancelReservation'));
    } finally {
      setCancelling(false);
    }
  };

  // Check if reservation can be edited
  const canEditReservation = () => {
    if (!reservation) return false;
    const editableStatuses = [
      'awaiting-price',
      'pending_admin_review',
      'waiting_for_agency_approval',
      'customer_approved',
      'confirmed',
      'sent_to_driver'
    ];
    return editableStatuses.includes(reservation.status);
  };

  // Check if reservation can be cancelled
  const canCancelReservation = () => {
    if (!reservation) return false;
    const cancellableStatuses = [
      'awaiting-price',
      'pending_admin_review',
      'waiting_for_agency_approval',
      'customer_approved',
      'confirmed',
      'sent_to_driver'
    ];
    return cancellableStatuses.includes(reservation.status);
  };

  const handleCopyDetails = () => {
    if (!reservation) return;

    const passengerList = reservation.passenger_names && reservation.passenger_names.length > 0
      ? reservation.passenger_names.map((name, i) => `${i + 1}. ${name}`).join('\n')
      : reservation.customer_name;

    const pickupFormatted = reservation.pickup_place_name && reservation.pickup_place_name !== reservation.pickup
      ? `${reservation.pickup_place_name}\n${reservation.pickup}`
      : reservation.pickup;
    const dropoffFormatted = reservation.dropoff_place_name && reservation.dropoff_place_name !== reservation.dropoff
      ? `${reservation.dropoff_place_name}\n${reservation.dropoff}`
      : reservation.dropoff;

    const details = [
      `Reservation: ${reservation.reservation_code || 'N/A'}`,
      `Date: ${format(new Date(reservation.pickup_date), 'dd/MM/yyyy')}`,
      `Time: ${reservation.pickup_time}`,
      '',
      'Passengers:',
      passengerList,
      '',
      `Phone: ${reservation.customer_phone}`,
      '',
      `Pickup:`,
      pickupFormatted,
      '',
      `Drop-off:`,
      dropoffFormatted,
      reservation.flight_number ? `Flight: ${reservation.flight_number}` : null,
      `Vehicle: ${reservation.vehicle_type.replace('-', ' ')}`,
      '',
      `Customer Price: ${currencySymbol}${agencyDetails?.customer_price || 0}`,
      `Company Amount: ${currencySymbol}${agencyDetails?.company_amount || 0}`,
      `Agency Profit: ${currencySymbol}${agencyDetails?.agency_profit || 0}`,
      '',
      reservation.drivers ? `Driver: ${reservation.drivers.name}` : null,
      reservation.drivers?.plate_number ? `Plate: ${reservation.drivers.plate_number}` : null,
      reservation.drivers?.vehicle_model ? `Vehicle: ${reservation.drivers.vehicle_model}` : null,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(details);
    toast.success('Reservation details copied');
  };

  const calculatedProfit = (parseFloat(customerPrice) || 0) - (parseFloat(companyAmount) || 0);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/agency')} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-serif">{t('reservationDetails')}</h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={statusColors[reservation.status] || 'bg-muted'}>
            {statusLabels[reservation.status] || reservation.status}
          </Badge>
          {reservation.status === 'customer_approved' && !reservation.driver_id && (
            <Badge variant="outline" className="text-amber-200 border-amber-300/50 bg-amber-500/20 text-xs">
              {t('awaitingDriverInfo')}
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-2xl space-y-6">
        {/* Price Approval Card - Only show when status is waiting_for_agency_approval */}
        {reservation.status === 'waiting_for_agency_approval' && reservation.price && (
          <Card className="border-purple-300 bg-purple-50 dark:bg-purple-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <DollarSign className="h-5 w-5" />
                {t('adminSetPrice')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">{t('proposedPrice')}</p>
                <p className="text-4xl font-bold text-purple-700 dark:text-purple-300">
                  {reservation.price_currency === 'EUR' && '€'}
                  {reservation.price_currency === 'USD' && '$'}
                  {reservation.price_currency === 'GBP' && '£'}
                  {reservation.price_currency === 'TRY' && '₺'}
                  {reservation.price_currency === 'AED' && 'د.إ'}
                  {!['EUR', 'USD', 'GBP', 'TRY', 'AED'].includes(reservation.price_currency || '') && (reservation.price_currency || '₺')}
                  {reservation.price}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleApprovePrice}
                  disabled={approving || rejecting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {approving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {t('approvePrice')}
                </Button>
                <Button
                  onClick={handleRejectPrice}
                  disabled={approving || rejecting}
                  variant="destructive"
                >
                  {rejecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {t('rejectPrice')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Admin Review Info */}
        {reservation.status === 'pending_admin_review' && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">{t('pendingAdminReview')}</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">{t('waitingForPriceFromAdmin')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit and Cancel Actions - Show when reservation is editable */}
        {(canEditReservation() || canCancelReservation()) && (
          <Card>
            <CardContent className="py-4">
              <div className="flex gap-3">
                {canEditReservation() && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/agency/reservation/${id}/edit`)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {t('editReservation')}
                  </Button>
                )}
                {canCancelReservation() && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={cancelling}
                      >
                        {cancelling ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {t('cancelReservation')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('confirmCancellation')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('cancelReservationWarning')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelReservation}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('confirmCancel')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <div className="space-y-2">
              {reservation.reservation_code && (
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                  {reservation.reservation_code}
                </span>
              )}
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(new Date(reservation.pickup_date), 'PPPP')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{reservation.pickup_time}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('customer')}</div>
                  <div className="font-medium">{reservation.customer_name}</div>
                </div>
              </div>

              {reservation.passenger_names && reservation.passenger_names.length > 1 && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('allPassengers')} ({reservation.passenger_names.length})
                    </div>
                    <div className="space-y-1 mt-1">
                      {reservation.passenger_names.map((name, index) => (
                        <div key={index} className="text-sm">{index + 1}. {name}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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

              {reservation.flight_number && (
                <div className="flex items-start gap-3">
                  <Plane className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('flight')}</div>
                    <AirlineDisplay flightNumber={reservation.flight_number} size="md" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('vehicle')}</div>
                  <div className="font-medium capitalize">{reservation.vehicle_type.replace('-', ' ')}</div>
                </div>
              </div>

              {/* Passenger Cash Amount */}
              {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('passengerCash')}</div>
                    <div className="font-medium text-green-600">
                      {reservation.passenger_cash_currency === 'EUR' && '€'}
                      {reservation.passenger_cash_currency === 'USD' && '$'}
                      {reservation.passenger_cash_currency === 'GBP' && '£'}
                      {reservation.passenger_cash_currency === 'TRY' && '₺'}
                      {reservation.passenger_cash_currency === 'AED' && 'د.إ'}
                      {!['EUR', 'USD', 'GBP', 'TRY', 'AED'].includes(reservation.passenger_cash_currency || '') && (reservation.passenger_cash_currency || '')}
                      {reservation.passenger_cash_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Driver Info */}
            {reservation.drivers && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">{t('assignedDriver')}</h3>
                <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                  <p className="font-medium">{reservation.drivers.name}</p>
                  {reservation.drivers.vehicle_model && (
                    <p className="text-sm text-muted-foreground">{reservation.drivers.vehicle_model}</p>
                  )}
                  {reservation.drivers.plate_number && (
                    <p className="text-sm font-mono">{reservation.drivers.plate_number}</p>
                  )}
                </div>
              </div>
            )}

            {/* Copy & Share Buttons */}
            <div className="pt-4 border-t space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleCopyDetails}
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('copyReservationDetails')}
              </Button>
              <Button 
                className="w-full bg-[#25D366] hover:bg-[#22c55e] text-white"
                onClick={() => {
                  if (!reservation) return;
                  const passengerList = reservation.passenger_names && reservation.passenger_names.length > 0
                    ? reservation.passenger_names.map((name, i) => `${i + 1}. ${name}`).join('\n')
                    : reservation.customer_name;
                  const pickupFormatted = reservation.pickup_place_name && reservation.pickup_place_name !== reservation.pickup
                    ? `${reservation.pickup_place_name}\n${reservation.pickup}`
                    : reservation.pickup;
                  const dropoffFormatted = reservation.dropoff_place_name && reservation.dropoff_place_name !== reservation.dropoff
                    ? `${reservation.dropoff_place_name}\n${reservation.dropoff}`
                    : reservation.dropoff;
                  const details = [
                    `Reservation: ${reservation.reservation_code || 'N/A'}`,
                    `Date: ${format(new Date(reservation.pickup_date), 'dd/MM/yyyy')}`,
                    `Time: ${reservation.pickup_time}`,
                    '',
                    'Passengers:',
                    passengerList,
                    '',
                    `Phone: ${reservation.customer_phone}`,
                    '',
                    `Pickup:`,
                    pickupFormatted,
                    '',
                    `Drop-off:`,
                    dropoffFormatted,
                    reservation.flight_number ? `Flight: ${reservation.flight_number}` : null,
                    `Vehicle: ${reservation.vehicle_type.replace('-', ' ')}`,
                    '',
                    `Customer Price: ${currencySymbol}${agencyDetails?.customer_price || 0}`,
                    `Company Amount: ${currencySymbol}${agencyDetails?.company_amount || 0}`,
                    `Agency Profit: ${currencySymbol}${agencyDetails?.agency_profit || 0}`,
                    '',
                    reservation.drivers ? `Driver: ${reservation.drivers.name}` : null,
                    reservation.drivers?.plate_number ? `Plate: ${reservation.drivers.plate_number}` : null,
                    reservation.drivers?.vehicle_model ? `Vehicle: ${reservation.drivers.vehicle_model}` : null,
                  ].filter(Boolean).join('\n');
                  window.open(`https://wa.me/?text=${encodeURIComponent(details)}`, '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('shareViaWhatsApp')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agency Pricing Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('agencyPricingNotes')}</CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('edit')}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('customerPrice')} ({currencySymbol})</Label>
                    <Input
                      type="number"
                      value={customerPrice}
                      onChange={(e) => setCustomerPrice(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('companyAmount')} ({currencySymbol})</Label>
                    <Input
                      type="number"
                      value={companyAmount}
                      onChange={(e) => setCompanyAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('agencyProfit')}:</span>
                    <span className={`font-bold ${calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currencySymbol}{calculatedProfit.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('paymentStatus')}</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_paid">Not Paid</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Agency Notes (Private)</Label>
                  <Textarea
                    value={agencyNotes}
                    onChange={(e) => setAgencyNotes(e.target.value)}
                    placeholder="Internal notes..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Customer Price</div>
                    <div className="text-xl font-bold">{currencySymbol}{agencyDetails?.customer_price || 0}</div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Company Amount</div>
                    <div className="text-xl font-bold">{currencySymbol}{agencyDetails?.company_amount || 0}</div>
                  </div>
                </div>

                <div className="bg-primary/10 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Agency Profit:</span>
                    <span className={`text-xl font-bold ${(agencyDetails?.agency_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currencySymbol}{agencyDetails?.agency_profit || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {paymentStatusLabels[agencyDetails?.payment_status || 'not_paid']}
                  </Badge>
                </div>

                {agencyDetails?.agency_notes && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Notes</div>
                    <p>{agencyDetails.agency_notes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AgencyReservationDetail;
