import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Save, Plus, BookmarkPlus, FileText, X, UserPlus } from 'lucide-react';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import GoogleRouteMap from '@/components/ui/google-route-map';
import { AirlineDisplay } from '@/components/ui/airline-display';

// Airports list removed - pickup is now free text
const vehicleTypes = ['mercedes-vito', 'mercedes-vclass', 'maybach', 'minibus'];
const paymentTypes = [
  { value: 'cash', label: 'Şoföre Nakit' },
  { value: 'payment_link', label: 'Online Ödeme Linki' },
];

// Statuses for manual admin reservations
const statuses = [
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'sent_to_driver', label: 'Şoföre Gönderildi' },
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Tamamlandı' },
];

// Currency options
const currencies = [
  { value: 'TRY', label: '₺ TRY', symbol: '₺' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'GBP', label: '£ GBP', symbol: '£' },
];

interface Driver {
  id: string;
  name: string;
  user_id: string;
}

interface Template {
  id: string;
  name: string;
  pickup: string;
  dropoff: string;
  vehicle_type: string;
  payment_type: string;
  price: number | null;
  price_currency: string | null;
}

interface Agency {
  id: string;
  agency_name: string;
}

const AdminCreateReservation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  // Pre-fill from URL params (for duplicate functionality)
  const [formData, setFormData] = useState({
    customer_name: searchParams.get('customer_name') || '',
    customer_phone: searchParams.get('customer_phone') || '',
    pickup: searchParams.get('pickup') || '',
    dropoff: searchParams.get('dropoff') || '',
    pickup_date: '',
    pickup_time: '',
    flight_number: searchParams.get('flight_number') || '',
    vehicle_type: searchParams.get('vehicle_type') || 'mercedes-vito',
    payment_type: searchParams.get('payment_type') || 'cash',
    price: searchParams.get('price') || '',
    price_currency: searchParams.get('price_currency') || 'TRY',
    driver_cash_amount: '',
    status: 'confirmed',
    driver_id: '',
    agency_id: '',
    admin_notes: '',
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
    if (index > 0) { // Never remove the primary passenger
      setPassengerNames(passengerNames.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index: number, value: string) => {
    const updated = [...passengerNames];
    updated[index] = value;
    setPassengerNames(updated);
  };

  const getCurrencySymbol = (currency: string) => {
    return currencies.find(c => c.value === currency)?.symbol || currency;
  };

  useEffect(() => {
    const fetchData = async () => {
      const [driversRes, templatesRes, agenciesRes] = await Promise.all([
        supabase.from('drivers').select('id, name, user_id').eq('active', true),
        supabase.from('reservation_templates').select('*').order('name'),
        supabase.from('agencies').select('id, agency_name').order('agency_name'),
      ]);
      setDrivers(driversRes.data || []);
      setTemplates(templatesRes.data || []);
      setAgencies(agenciesRes.data || []);
    };
    fetchData();
  }, []);

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        pickup: template.pickup,
        dropoff: template.dropoff,
        vehicle_type: template.vehicle_type,
        payment_type: template.payment_type,
        price: template.price?.toString() || '',
        price_currency: template.price_currency || 'TRY',
      }));
      toast.success(`Template "${template.name}" applied`);
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!formData.pickup || !formData.dropoff) {
      toast.error('Pickup and dropoff locations are required');
      return;
    }

    setSavingTemplate(true);
    try {
      const { error } = await supabase.from('reservation_templates').insert({
        name: templateName.trim(),
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        vehicle_type: formData.vehicle_type,
        payment_type: formData.payment_type,
        price: formData.price ? parseFloat(formData.price) : null,
        price_currency: formData.price_currency,
      });

      if (error) throw error;

      // Refresh templates
      const { data } = await supabase.from('reservation_templates').select('*').order('name');
      setTemplates(data || []);
      
      setTemplateDialog(false);
      setTemplateName('');
      toast.success('Template saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passenger names - at least primary passenger required
    const validPassengerNames = passengerNames.filter(name => name.trim() !== '');
    if (validPassengerNames.length === 0) {
      toast.error('At least one passenger name is required');
      return;
    }
    
    if (!formData.customer_phone || !formData.pickup || !formData.dropoff || !formData.pickup_date || !formData.pickup_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Use first passenger as customer_name for backwards compatibility
      const primaryPassenger = validPassengerNames[0];
      
      // Create reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          customer_id: user?.id, // Admin creates on behalf
          customer_name: primaryPassenger,
          customer_phone: formData.customer_phone,
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          pickup_date: formData.pickup_date,
          pickup_time: formData.pickup_time,
          flight_number: formData.flight_number || null,
          vehicle_type: formData.vehicle_type,
          payment_type: formData.payment_type,
          price: formData.price ? parseFloat(formData.price) : null,
          price_currency: formData.price_currency,
          driver_cash_amount: formData.driver_cash_amount ? parseFloat(formData.driver_cash_amount) : null,
          status: formData.status,
          driver_id: formData.driver_id || null,
          agency_id: formData.agency_id || null,
          passenger_names: validPassengerNames,
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Save admin notes if provided
      if (formData.admin_notes && reservation) {
        await supabase
          .from('reservation_admin_notes')
          .insert({
            reservation_id: reservation.id,
            notes: formData.admin_notes,
          });
      }

      // Audit log
      await logAction({
        action: 'CREATE',
        table_name: 'reservations',
        record_id: reservation?.id,
        new_data: {
          customer_name: primaryPassenger,
          passenger_names: validPassengerNames,
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          pickup_date: formData.pickup_date,
          price: formData.price,
          price_currency: formData.price_currency,
          status: formData.status,
        },
      });

      // Notify driver if assigned
      if (formData.driver_id && reservation) {
        try {
          const selectedDriver = drivers.find(d => d.id === formData.driver_id);
          if (selectedDriver?.user_id) {
            const symbol = getCurrencySymbol(formData.price_currency);
            await supabase.functions.invoke('create-notification', {
              body: {
                user_id: selectedDriver.user_id,
                reservation_id: reservation.id,
                title: 'New Job Assigned',
                message: `New transfer: ${formData.pickup} → ${formData.dropoff} on ${formData.pickup_date} at ${formData.pickup_time}. Price: ${symbol}${formData.price}`,
                type: 'driver_assigned'
              }
            });
          }
        } catch (err) {
          console.error('Failed to notify driver:', err);
        }
      }

      toast.success('Reservation created successfully');
      navigate('/admin/reservations');
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error(error.message || 'Failed to create reservation');
    } finally {
      setSaving(false);
    }
  };

  const currencySymbol = getCurrencySymbol(formData.price_currency);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/reservations')} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif">Rezervasyon Oluştur</h1>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap justify-between items-start gap-4">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Yeni Rezervasyon
              </CardTitle>
              <div className="flex gap-2">
                {templates.length > 0 && (
                  <Select onValueChange={applyTemplate}>
                    <SelectTrigger className="w-[180px]">
                      <FileText className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Şablon Kullan" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTemplateDialog(true)}
                  disabled={!formData.pickup || !formData.dropoff}
                >
                  <BookmarkPlus className="h-4 w-4 mr-1" />
                  Şablon Kaydet
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Müşteri Bilgileri</h3>
                
                {/* Passenger Names */}
                <div className="space-y-3">
                  <Label>Yolcu İsimleri * <span className="text-muted-foreground text-sm">({passengerNames.length}/{MAX_PASSENGERS})</span></Label>
                  {passengerNames.map((name, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <div className="relative">
                          <Input
                            value={name}
                            onChange={(e) => updatePassenger(index, e.target.value)}
                            placeholder={index === 0 ? "Ana Yolcu Adı *" : `Yolcu ${index + 1}`}
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
                      className="w-full sm:w-auto"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Müşteri Ekle
                    </Button>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label>Müşteri Telefonu *</Label>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    placeholder="+90 5XX XXX XXXX"
                    required
                  />
                </div>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Transfer Detayları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alış Noktası *</Label>
                    <GooglePlacesAutocomplete
                      onPlaceSelected={(value) => setFormData((prev) => ({ ...prev, pickup: value }))}
                      placeholder="Alış noktasını girin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bırakış Noktası *</Label>
                    <GooglePlacesAutocomplete
                      onPlaceSelected={(value) => setFormData((prev) => ({ ...prev, dropoff: value }))}
                      placeholder="Otel veya adres"
                    />
                  </div>
                </div>

                {/* Route Map Preview */}
                {formData.pickup && formData.dropoff && (
                  <div className="pt-2">
                    <GoogleRouteMap
                      pickup={formData.pickup}
                      dropoff={formData.dropoff}
                      showNavigationButtons={false}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tarih *</Label>
                    <Input
                      type="date"
                      value={formData.pickup_date}
                      onChange={(e) => setFormData({...formData, pickup_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Saat *</Label>
                    <Input
                      type="time"
                      value={formData.pickup_time}
                      onChange={(e) => setFormData({...formData, pickup_time: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Uçuş Numarası</Label>
                    <Input
                      value={formData.flight_number}
                      onChange={(e) => setFormData({...formData, flight_number: e.target.value})}
                      placeholder="TK1234"
                    />
                    {formData.flight_number && formData.flight_number.length >= 2 && (
                      <AirlineDisplay flightNumber={formData.flight_number} size="sm" className="mt-2" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Araç Tipi</Label>
                  <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({...formData, vehicle_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map(v => (
                        <SelectItem key={v} value={v}>{v.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment & Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Ödeme ve Fiyat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ödeme Tipi</Label>
                    <Select value={formData.payment_type} onValueChange={(v) => setFormData({...formData, payment_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Para Birimi</Label>
                    <Select value={formData.price_currency} onValueChange={(v) => setFormData({...formData, price_currency: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fiyat</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="pl-8"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Şoför Nakit Tutarı</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.driver_cash_amount}
                        onChange={(e) => setFormData({...formData, driver_cash_amount: e.target.value})}
                        className="pl-8"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Assignment */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Durum ve Atama</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durum</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Şoför Ata</Label>
                    <Select value={formData.driver_id} onValueChange={(v) => setFormData({...formData, driver_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Şoför seçin (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Agency Selection */}
                <div className="space-y-2">
                  <Label>Acenta</Label>
                  <Select value={formData.agency_id} onValueChange={(v) => setFormData({...formData, agency_id: v === 'none' ? '' : v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Acenta Yok (Direkt Müşteri)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Acenta Yok (Direkt Müşteri)</SelectItem>
                      {agencies.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.agency_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Admin Notları (Dahili)</h3>
                <Textarea
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                  placeholder="Dahili notlar - müşteri veya şoför tarafından görülemez"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Oluşturuluyor...' : 'Rezervasyon Oluştur'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Save Template Dialog */}
        <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Şablon Olarak Kaydet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Mevcut rotayı ({formData.pickup} → {formData.dropoff}) yeniden kullanılabilir şablon olarak kaydedin.
              </p>
              <div className="space-y-2">
                <Label>Şablon Adı *</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="örn: IST - Taksim Standart"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateDialog(false)}>
                İptal
              </Button>
              <Button onClick={saveAsTemplate} disabled={savingTemplate}>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                {savingTemplate ? 'Kaydediliyor...' : 'Şablonu Kaydet'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminCreateReservation;