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
import { AddressMapSection } from '@/components/reservation/AddressMapSection';
import { PhoneInput } from '@/components/ui/phone-input';

// Use centralized vehicle types
import { VEHICLE_TYPE_OPTIONS as vehicleTypes } from '@/lib/vehicleTypes';
import { CURRENCY_OPTIONS } from '@/lib/currency';

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
    luggage_count: '',
    baby_seat_count: '',
    currency: 'EUR', // Agency selects currency for this reservation
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

  // Sadece acenta dashboard için: Query string ile yönlendirme, supabase işlemi yok
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      pickup: formData.pickup,
      dropoff: formData.dropoff,
      date: formData.pickup_date,
      time: formData.pickup_time,
      passengers: String(passengerNames.length),
      lang: 'TR',
    });
    window.open(`https://meettransfer.com/book?${params.toString()}`, '_self');
  };

  // ...existing code...
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
                <AddressMapSection
                  pickup={{
                    address: formData.pickup,
                    placeName: formData.pickup_place_name,
                    lat: formData.pickup_lat,
                    lng: formData.pickup_lng,
                  }}
                  dropoff={{
                    address: formData.dropoff,
                    placeName: formData.dropoff_place_name,
                    lat: formData.dropoff_lat,
                    lng: formData.dropoff_lng,
                  }}
                  onPickupChange={(location) => setFormData((prev) => ({
                    ...prev,
                    pickup: location.address,
                    pickup_place_name: location.placeName,
                    pickup_lat: location.lat,
                    pickup_lng: location.lng,
                  }))}
                  onDropoffChange={(location) => setFormData((prev) => ({
                    ...prev,
                    dropoff: location.address,
                    dropoff_place_name: location.placeName,
                    dropoff_lat: location.lat,
                    dropoff_lng: location.lng,
                  }))}
                  labels={{
                    pickup: t('pickupPoint'),
                    dropoff: t('dropoffPoint'),
                    sectionTitle: t('transferDetails'),
                  }}
                  // ...supabase ve async/await ile ilgili kodlar kaldırıldı...
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('luggageCount') || 'Valiz Sayısı'}</Label>
                    <Select value={formData.luggage_count} onValueChange={(v) => setFormData({...formData, luggage_count: v === 'none' ? '' : v})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectLuggage') || 'Valiz seçin'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('none') || 'Yok'}</SelectItem>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} {t('luggage') || 'Valiz'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('babySeatCount') || 'Bebek Koltuğu'}</Label>
                    <Select value={formData.baby_seat_count} onValueChange={(v) => setFormData({...formData, baby_seat_count: v === 'none' ? '' : v})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectBabySeat') || 'Bebek koltuğu seçin'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('none') || 'Yok'}</SelectItem>
                        <SelectItem value="1">1 {t('babySeat') || 'Bebek Koltuğu'}</SelectItem>
                        <SelectItem value="2">2 {t('babySeat') || 'Bebek Koltuğu'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Payment Type */}
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
