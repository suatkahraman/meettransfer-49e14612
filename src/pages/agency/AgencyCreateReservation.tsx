import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, X, UserPlus } from 'lucide-react';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { LocationDisplay } from '@/components/ui/location-display';
import { PhoneInput } from '@/components/ui/phone-input';

// Use centralized vehicle types
import { VEHICLE_TYPE_OPTIONS as vehicleTypes } from '@/lib/vehicleTypes';

// Payment types will use translations

// Currencies removed - agency no longer sets price

const AgencyCreateReservation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { agencyId } = useUserRole();
  const { emailAdminAgencyRequest } = useEmailNotifications();
  const { t } = useAgencyTranslations();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    pickup: '',
    dropoff: '',
    pickup_date: '',
    pickup_time: '',
    flight_number: '',
    vehicle_type: 'mercedes-vito',
    payment_type: 'agency_pay',
    customer_notes: '',
    // Place details
    pickup_place_name: '',
    pickup_lat: null as number | null,
    pickup_lng: null as number | null,
    dropoff_place_name: '',
    dropoff_lat: null as number | null,
    dropoff_lng: null as number | null,
  });
  
  // Multiple passenger names support (max 15)
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);
  const MAX_PASSENGERS = 15;

  const addPassenger = () => {
    if (passengerNames.length < MAX_PASSENGERS) {
      setPassengerNames([...passengerNames, '']);
    }
  };

  const removePassenger = (index: number) => {
    if (index > 0) {
      setPassengerNames(passengerNames.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index: number, value: string) => {
    const updated = [...passengerNames];
    updated[index] = value;
    setPassengerNames(updated);
  };

  const handlePickupSelect = (place: { name?: string; formatted_address: string; lat?: number; lng?: number; }) => {
    setFormData(prev => ({
      ...prev,
      pickup: place.formatted_address || place.name || '',
      pickup_place_name: place.name || '',
      pickup_lat: place.lat || null,
      pickup_lng: place.lng || null,
    }));
  };

  const handleDropoffSelect = (place: { name?: string; formatted_address: string; lat?: number; lng?: number; }) => {
    setFormData(prev => ({
      ...prev,
      dropoff: place.formatted_address || place.name || '',
      dropoff_place_name: place.name || '',
      dropoff_lat: place.lat || null,
      dropoff_lng: place.lng || null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validPassengerNames = passengerNames.filter(name => name.trim() !== '');
    if (validPassengerNames.length === 0) {
      toast.error(t('atLeastOnePassenger'));
      return;
    }
    
    if (!formData.customer_phone || !formData.pickup || !formData.dropoff || !formData.pickup_date || !formData.pickup_time) {
      toast.error(t('fillAllRequired'));
      return;
    }

    if (!agencyId) {
      toast.error(t('agencyNotFound'));
      return;
    }

    setSaving(true);

    try {
      const primaryPassenger = validPassengerNames[0];
      
      // Create reservation with pending_admin_review status
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          customer_name: primaryPassenger,
          customer_phone: formData.customer_phone,
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          pickup_date: formData.pickup_date,
          pickup_time: formData.pickup_time,
          flight_number: formData.flight_number || null,
          vehicle_type: formData.vehicle_type,
          payment_type: formData.payment_type,
          price: null, // Admin will set the price
          price_currency: 'EUR', // Default, admin will update
          status: 'pending_admin_review', // Admin onayı ve fiyat belirleme bekliyor
          agency_id: agencyId,
          passenger_names: validPassengerNames,
          customer_notes: formData.customer_notes || null,
          // Place details
          pickup_place_name: formData.pickup_place_name || null,
          pickup_lat: formData.pickup_lat,
          pickup_lng: formData.pickup_lng,
          dropoff_place_name: formData.dropoff_place_name || null,
          dropoff_lat: formData.dropoff_lat,
          dropoff_lng: formData.dropoff_lng,
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Create agency reservation details
      if (reservation) {
        await supabase.from('agency_reservation_details').insert({
          reservation_id: reservation.id,
          agency_user_id: user?.id,
          customer_price: 0, // Admin will set
          agency_price_currency: 'EUR',
          agency_notes: formData.customer_notes || null,
        });
      }

      // Notify admins about new agency request (in-app notification)
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
                reservation_id: reservation?.id,
                title: 'Yeni Acenta İsteği',
                message: `Yeni acenta rezervasyon talebi: ${formData.pickup} → ${formData.dropoff} - ${formData.pickup_date}`,
                type: 'agency_request'
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to notify admins:', err);
      }

      // Send email notification to admin
      if (reservation?.id) {
        try {
          await emailAdminAgencyRequest(reservation.id);
          console.log('Agency request email sent to admin');
        } catch (err) {
          console.error('Failed to send agency request email:', err);
        }
      }

      toast.success(t('reservationSent'));
      navigate('/agency');
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error(error.message || t('reservationFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/agency')} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif">{t('newReservationRequest')}</h1>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('createReservationTitle')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('reservationWillBeSent')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t('customerInfo')}</h3>
                
                {/* Passenger Names */}
                <div className="space-y-3">
                  <Label>{t('passengerNames')} * <span className="text-muted-foreground text-sm">({passengerNames.length}/{MAX_PASSENGERS})</span></Label>
                  {passengerNames.map((name, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <div className="relative">
                          <Input
                            value={name}
                            onChange={(e) => updatePassenger(index, e.target.value)}
                            placeholder={index === 0 ? t('mainPassenger') : `${t('passenger')} ${index + 1}`}
                            className="pr-20"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {index === 0 ? 'Ana' : `#${index + 1}`}
                          </span>
                        </div>
                      </div>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removePassenger(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {passengerNames.length < MAX_PASSENGERS && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPassenger}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t('addPassenger')}
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="customer_phone">{t('phone')} *</Label>
                  <PhoneInput
                    value={formData.customer_phone}
                    onChange={(value) => setFormData({ ...formData, customer_phone: value })}
                  />
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t('transferDetails')}</h3>
                
                <div>
                  <Label>{t('pickupPoint')} *</Label>
                  <GooglePlacesAutocomplete
                    initialValue={formData.pickup}
                    onPlaceSelect={handlePickupSelect}
                    placeholder={t('enterPickupPoint')}
                  />
                  {formData.pickup_place_name && formData.pickup_place_name !== formData.pickup && (
                    <LocationDisplay 
                      placeName={formData.pickup_place_name}
                      address={formData.pickup}
                      type="pickup"
                      size="sm"
                      className="mt-1"
                    />
                  )}
                </div>
                
                <div>
                  <Label>{t('dropoffPoint')} *</Label>
                  <GooglePlacesAutocomplete
                    initialValue={formData.dropoff}
                    onPlaceSelect={handleDropoffSelect}
                    placeholder={t('enterDropoffPoint')}
                  />
                  {formData.dropoff_place_name && formData.dropoff_place_name !== formData.dropoff && (
                    <LocationDisplay 
                      placeName={formData.dropoff_place_name}
                      address={formData.dropoff}
                      type="dropoff"
                      size="sm"
                      className="mt-1"
                    />
                  )}
                </div>

                {/* Map info - coordinates available */}
                {formData.pickup_lat && formData.pickup_lng && formData.dropoff_lat && formData.dropoff_lng && (
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                      📍 {t('locationReceived')}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickup_date">{t('date')} *</Label>
                    <Input
                      id="pickup_date"
                      type="date"
                      value={formData.pickup_date}
                      onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickup_time">{t('time')} *</Label>
                    <Input
                      id="pickup_time"
                      type="time"
                      value={formData.pickup_time}
                      onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="flight_number">{t('flightNumber')}</Label>
                  <Input
                    id="flight_number"
                    value={formData.flight_number}
                    onChange={(e) => setFormData({ ...formData, flight_number: e.target.value.toUpperCase() })}
                    placeholder="TK1234"
                  />
                </div>

                <div>
                  <Label htmlFor="vehicle_type">{t('vehicleType')}</Label>
                  <Select
                    value={formData.vehicle_type}
                    onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map(v => (
                        <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Type Only */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t('payment')}</h3>

                <div>
                  <Label htmlFor="payment_type">{t('paymentType')}</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(value) => setFormData({ ...formData, payment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t('cash')}</SelectItem>
                      <SelectItem value="payment_link">{t('onlinePayment')}</SelectItem>
                      <SelectItem value="agency_pay">{t('agencyPayment')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t('notes')}</h3>
                <div>
                  <Label htmlFor="customer_notes">{t('notes')}</Label>
                  <Textarea
                    id="customer_notes"
                    value={formData.customer_notes}
                    onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                    placeholder={t('notesPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>{t('saving')}</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('save')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AgencyCreateReservation;
