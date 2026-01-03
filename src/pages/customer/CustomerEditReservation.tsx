import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import GoogleRouteMap from '@/components/ui/google-route-map';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';

const vehicleTypes = [
  { value: 'mercedes-vito', label: 'Mercedes Vito' },
  { value: 'mercedes-vclass', label: 'Mercedes Vip Vito' },
  { value: 'maybach', label: 'Maybach' },
  { value: 'minibus', label: 'Minibus' },
];

interface Reservation {
  id: string;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  customer_name: string;
  customer_phone: string;
  passenger_names: string[] | null;
  driver_notes: string | null;
  status: string;
  driver_id: string | null;
}

const CustomerEditReservation = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { emailAdminReservationEdited } = useEmailNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    pickup_place_name: '',
    dropoff_place_name: '',
    pickup_lat: null as number | null,
    pickup_lng: null as number | null,
    dropoff_lat: null as number | null,
    dropoff_lng: null as number | null,
    pickup_date: '',
    pickup_time: '',
    flight_number: '',
    vehicle_type: '',
    customer_name: '',
    customer_phone: '',
    driver_notes: '',
  });
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);

  useEffect(() => {
    const fetchReservation = async () => {
      if (!id || !user) return;

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .eq('customer_id', user.id)
        .single();

      if (error) {
        toast.error(t('reservationNotFound'));
        navigate('/customer/bookings');
        return;
      }

      // Only allow editing confirmed reservations
      const editableStatuses = ['customer_approved', 'confirmed', 'sent_to_driver'];
      if (!editableStatuses.includes(data.status)) {
        toast.error(t('reservationCannotBeEdited'));
        navigate(`/customer/reservation/${id}`);
        return;
      }

      setOriginalData(data);
      setFormData({
        pickup: data.pickup || '',
        dropoff: data.dropoff || '',
        pickup_place_name: data.pickup_place_name || '',
        dropoff_place_name: data.dropoff_place_name || '',
        pickup_lat: data.pickup_lat || null,
        pickup_lng: data.pickup_lng || null,
        dropoff_lat: data.dropoff_lat || null,
        dropoff_lng: data.dropoff_lng || null,
        pickup_date: data.pickup_date || '',
        pickup_time: data.pickup_time || '',
        flight_number: data.flight_number || '',
        vehicle_type: data.vehicle_type || '',
        customer_name: data.customer_name || '',
        customer_phone: data.customer_phone || '',
        driver_notes: data.driver_notes || '',
      });
      
      const names = data.passenger_names && data.passenger_names.length > 0 
        ? data.passenger_names 
        : [data.customer_name || ''];
      setPassengerNames(names);
      
      setLoading(false);
    };

    fetchReservation();
  }, [id, user, navigate]);

  const addPassenger = () => {
    if (passengerNames.length < 15) {
      setPassengerNames([...passengerNames, '']);
    }
  };

  const removePassenger = (index: number) => {
    if (passengerNames.length > 1) {
      setPassengerNames(passengerNames.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index: number, value: string) => {
    const updated = [...passengerNames];
    updated[index] = value;
    setPassengerNames(updated);
  };

  // Check if price-affecting fields have changed
  const hasPriceAffectingChanges = (): boolean => {
    if (!originalData) return false;
    
    return (
      formData.pickup !== originalData.pickup ||
      formData.dropoff !== originalData.dropoff ||
      formData.pickup_date !== originalData.pickup_date ||
      formData.pickup_time !== originalData.pickup_time ||
      formData.vehicle_type !== originalData.vehicle_type ||
      passengerNames.length !== (originalData.passenger_names?.length || 1)
    );
  };

  // Check which specific fields changed for highlighting
  const getChangedFields = () => {
    if (!originalData) return {};
    return {
      pickup: formData.pickup !== originalData.pickup,
      dropoff: formData.dropoff !== originalData.dropoff,
      pickup_date: formData.pickup_date !== originalData.pickup_date,
      pickup_time: formData.pickup_time !== originalData.pickup_time,
      vehicle_type: formData.vehicle_type !== originalData.vehicle_type,
      passenger_count: passengerNames.length !== (originalData.passenger_names?.length || 1),
    };
  };

  const changedFields = getChangedFields();
  const showPriceWarning = hasPriceAffectingChanges();

  // Critical field label component
  const CriticalFieldLabel = ({ children, isChanged }: { children: React.ReactNode; isChanged?: boolean }) => (
    <div className="flex items-center gap-2 flex-wrap">
      {children}
      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
        {t('priceAffecting')}
      </Badge>
      {isChanged && (
        <Badge variant="destructive" className="text-xs animate-pulse">
          {t('changed')}
        </Badge>
      )}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validPassengerNames = passengerNames.filter(name => name.trim() !== '');
    if (validPassengerNames.length === 0) {
      toast.error(t('passengerRequired'));
      return;
    }

    setSaving(true);

    try {
      const priceChangeRequired = hasPriceAffectingChanges();
      
      // Determine new status based on whether price-affecting fields changed
      // If price-affecting fields changed -> awaiting-price (admin needs to set new price)
      // If only non-price fields changed -> keep current status
      const newStatus = priceChangeRequired ? 'awaiting-price' : originalData?.status;

      // Update reservation
      const { error } = await supabase
        .from('reservations')
        .update({
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          pickup_place_name: formData.pickup_place_name || null,
          dropoff_place_name: formData.dropoff_place_name || null,
          pickup_lat: formData.pickup_lat,
          pickup_lng: formData.pickup_lng,
          dropoff_lat: formData.dropoff_lat,
          dropoff_lng: formData.dropoff_lng,
          pickup_date: formData.pickup_date,
          pickup_time: formData.pickup_time,
          flight_number: formData.flight_number || null,
          vehicle_type: formData.vehicle_type,
          customer_name: validPassengerNames[0],
          customer_phone: formData.customer_phone,
          passenger_names: validPassengerNames,
          driver_notes: formData.driver_notes || null,
          status: newStatus,
          // Clear price if price-affecting changes were made
          ...(priceChangeRequired ? { price: null, admin_set_price: null } : {}),
        })
        .eq('id', id);

      if (error) throw error;

      // Notify admins if price-affecting changes were made
      if (priceChangeRequired) {
        try {
          await supabase.functions.invoke('create-notification', {
            body: {
              type: 'reservation_edited',
              title: 'Müşteri Rezervasyonu Güncelledi - Fiyat Gerekli',
              message: `Müşteri rezervasyonu güncelledi. Kritik alanlar değişti, yeni fiyat belirlenmesi gerekiyor.`,
              notify_admins: true,
              reservation_id: id,
              send_push: true,
            }
          });
        } catch (e) {
          console.error('Failed to notify admin:', e);
        }

        // Send email to admin about the edit
        try {
          await emailAdminReservationEdited(id!);
        } catch (e) {
          console.error('Failed to send admin email:', e);
        }

        // If driver was assigned, notify them too
        if (originalData?.driver_id) {
          try {
            const { data: driver } = await supabase
              .from('drivers')
              .select('user_id')
              .eq('id', originalData.driver_id)
              .single();

            if (driver?.user_id) {
              await supabase.functions.invoke('create-notification', {
                body: {
                  user_id: driver.user_id,
                  reservation_id: id,
                  title: 'Reservation Updated by Customer',
                  message: `Reservation has been modified by the customer. New price is being set.`,
                  type: 'reservation_updated',
                  send_push: true,
                }
              });
            }
          } catch (e) {
            console.error('Failed to notify driver:', e);
          }
        }

        toast.success(t('reservationUpdatedPriceRequired'));
      } else {
        toast.success(t('reservationUpdatedSuccess'));
      }
      
      navigate('/customer/bookings');
    } catch (error: any) {
      toast.error(error.message || t('failedToUpdateReservation'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(`/customer/reservation/${id}`)} 
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif">{t('editReservation')}</h1>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('updateYourReservation')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('changesWillBeSentToAdmin')}
            </p>
          </CardHeader>
          <CardContent>
            {/* Price Update Warning */}
            {showPriceWarning && (
              <Alert variant="destructive" className="mb-6 border-amber-500 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-600">
                  {t('priceUpdateWarning')}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pick-up Point */}
              <div className={`space-y-2 p-3 rounded-lg transition-colors ${changedFields.pickup ? 'bg-amber-500/10 border border-amber-500/30' : ''}`}>
                <CriticalFieldLabel isChanged={changedFields.pickup}>
                  <Label>{t('pickupPoint')} *</Label>
                </CriticalFieldLabel>
                <GooglePlacesAutocomplete
                  placeholder={t('enterPickupPoint')}
                  initialValue={formData.pickup_place_name || formData.pickup}
                  onPlaceSelect={(place) => {
                    setFormData({
                      ...formData,
                      pickup: place.formatted_address,
                      pickup_place_name: place.name || '',
                      pickup_lat: place.lat || null,
                      pickup_lng: place.lng || null,
                    });
                  }}
                />
              </div>

              {/* Drop-off */}
              <div className={`space-y-2 p-3 rounded-lg transition-colors ${changedFields.dropoff ? 'bg-amber-500/10 border border-amber-500/30' : ''}`}>
                <CriticalFieldLabel isChanged={changedFields.dropoff}>
                  <Label>{t('dropoffLocation')} *</Label>
                </CriticalFieldLabel>
                <GooglePlacesAutocomplete
                  placeholder={t('enterDestination')}
                  initialValue={formData.dropoff_place_name || formData.dropoff}
                  onPlaceSelect={(place) => {
                    setFormData({
                      ...formData,
                      dropoff: place.formatted_address,
                      dropoff_place_name: place.name || '',
                      dropoff_lat: place.lat || null,
                      dropoff_lng: place.lng || null,
                    });
                  }}
                />
              </div>

              {/* Route Map Preview */}
              {formData.pickup && formData.dropoff && (
                <GoogleRouteMap
                  pickup={formData.pickup}
                  dropoff={formData.dropoff}
                  showNavigationButtons={false}
                />
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`space-y-2 p-3 rounded-lg transition-colors ${changedFields.pickup_date ? 'bg-amber-500/10 border border-amber-500/30' : ''}`}>
                  <CriticalFieldLabel isChanged={changedFields.pickup_date}>
                    <Label htmlFor="date">{t('date')} *</Label>
                  </CriticalFieldLabel>
                  <Input
                    id="date"
                    type="date"
                    value={formData.pickup_date}
                    onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className={`space-y-2 p-3 rounded-lg transition-colors ${changedFields.pickup_time ? 'bg-amber-500/10 border border-amber-500/30' : ''}`}>
                  <CriticalFieldLabel isChanged={changedFields.pickup_time}>
                    <Label htmlFor="time">{t('time')} *</Label>
                  </CriticalFieldLabel>
                  <Input
                    id="time"
                    type="time"
                    value={formData.pickup_time}
                    onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div className={`space-y-2 p-3 rounded-lg transition-colors ${changedFields.vehicle_type ? 'bg-amber-500/10 border border-amber-500/30' : ''}`}>
                <CriticalFieldLabel isChanged={changedFields.vehicle_type}>
                  <Label>{t('vehicleType')} *</Label>
                </CriticalFieldLabel>
                <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectVehicle')} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((v) => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flight Number */}
              <div className="space-y-2">
                <Label htmlFor="flight">{t('flightNumberOptional')}</Label>
                <Input
                  id="flight"
                  value={formData.flight_number}
                  onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                  placeholder={t('flightExample')}
                />
              </div>

              {/* Passenger Names */}
              <div className={`space-y-4 p-3 rounded-lg transition-colors ${changedFields.passenger_count ? 'bg-amber-500/10 border border-amber-500/30' : ''}`}>
                <CriticalFieldLabel isChanged={changedFields.passenger_count}>
                  <Label>{t('passengers')} * ({passengerNames.length} {t('person')})</Label>
                </CriticalFieldLabel>
                {passengerNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => updatePassenger(index, e.target.value)}
                      placeholder={index === 0 ? t('primaryPassenger') : `${t('passenger')} ${index + 1}`}
                    />
                    {passengerNames.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removePassenger(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                {passengerNames.length < 15 && (
                  <Button type="button" variant="outline" size="sm" onClick={addPassenger}>
                    + {t('addPassenger')}
                  </Button>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t('notesForDriver')}</Label>
                <Textarea
                  id="notes"
                  value={formData.driver_notes}
                  onChange={(e) => setFormData({ ...formData, driver_notes: e.target.value })}
                  placeholder={t('anySpecialRequests')}
                  rows={3}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/customer/reservation/${id}`)}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('savingChanges')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('saveChanges')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerEditReservation;
