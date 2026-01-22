import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useCustomerNotification } from '@/hooks/useCustomerNotification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Save, Plus, BookmarkPlus, FileText, X, UserPlus, Users, MapPin, Calendar, Banknote, ClipboardCheck, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';
import { GooglePlacesAutocomplete, PlaceDetails } from '@/components/ui/google-places-autocomplete';
import GoogleRouteMap from '@/components/ui/google-route-map';
import { AirlineDisplay } from '@/components/ui/airline-display';
import { FlightStatus } from '@/components/ui/flight-status';
import { LocationDisplay } from '@/components/ui/location-display';
import { AddressMapSection, LocationData } from '@/components/reservation/AddressMapSection';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { AdminPaymentLinkGenerator } from '@/components/admin/AdminPaymentLinkGenerator';

// Airports list removed - pickup is now free text
// Use centralized vehicle types
import { VEHICLE_TYPE_OPTIONS as vehicleTypes } from '@/lib/vehicleTypes';
import { getCurrencySymbol, CURRENCY_OPTIONS as currencies } from '@/lib/currency';

const paymentTypes = [
  { value: 'cash', label: 'Şoföre Nakit', icon: '💵' },
  { value: 'payment_link', label: 'Online Ödeme Linki', icon: '💳' },
  { value: 'agency_pay', label: 'Acente Ödemesi', icon: '🏢' },
];

// Statuses for manual admin reservations
const statuses = [
  { value: 'confirmed', label: 'Onaylandı', color: 'bg-green-500' },
  { value: 'sent_to_driver', label: 'Şoföre Gönderildi', color: 'bg-blue-500' },
  { value: 'active', label: 'Aktif', color: 'bg-purple-500' },
  { value: 'completed', label: 'Tamamlandı', color: 'bg-gray-500' },
];

// Validation schema
const reservationSchema = z.object({
  customer_name: z.string().trim().min(1, 'İsim gerekli').max(100, 'İsim 100 karakteri geçemez'),
  customer_phone: z.string().trim().min(10, 'Geçerli bir telefon numarası girin').max(20, 'Telefon numarası çok uzun'),
  pickup: z.string().trim().min(3, 'Alış noktası gerekli'),
  dropoff: z.string().trim().min(3, 'Bırakış noktası gerekli'),
  pickup_date: z.string().min(1, 'Tarih seçin'),
  pickup_time: z.string().min(1, 'Saat seçin'),
});

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

interface FormErrors {
  [key: string]: string;
}

const AdminCreateReservation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const { emailDriverAssigned } = useEmailNotifications();
  const { notifyStatusChange } = useCustomerNotification();
  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Payment link dialog state
  const [paymentLinkDialog, setPaymentLinkDialog] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<{
    id: string;
    reservation_code: string;
  } | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  
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
    passenger_cash_amount: '',
    passenger_cash_currency: 'TRY',
    status: 'confirmed',
    driver_id: '',
    agency_id: '',
    admin_notes: '',
    luggage_count: '',
    baby_seat_count: '',
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
  
  // Agency pricing details
  const [agencyDetails, setAgencyDetails] = useState({
    customer_price: '',
    agency_price_currency: 'USD',
  });

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

  // Using centralized getCurrencySymbol from @/lib/currency

  // Safe number parsing that handles empty strings and NaN
  const safeParseFloat = (value: string | undefined | null): number | null => {
    if (!value || value.trim() === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
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

  // Validate form field
  const validateField = (field: string, value: string) => {
    const testData = { ...formData, [field]: value };
    try {
      if (field === 'customer_name') {
        reservationSchema.shape.customer_name.parse(value);
      } else if (field === 'customer_phone') {
        reservationSchema.shape.customer_phone.parse(value);
      } else if (field === 'pickup') {
        reservationSchema.shape.pickup.parse(value);
      } else if (field === 'dropoff') {
        reservationSchema.shape.dropoff.parse(value);
      } else if (field === 'pickup_date') {
        reservationSchema.shape.pickup_date.parse(value);
      } else if (field === 'pickup_time') {
        reservationSchema.shape.pickup_time.parse(value);
      }
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        setFormErrors(prev => ({ ...prev, [field]: err.errors[0]?.message || 'Geçersiz değer' }));
      }
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, (formData as any)[field] || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const validationData = {
      customer_name: passengerNames[0] || '',
      customer_phone: formData.customer_phone,
      pickup: formData.pickup,
      dropoff: formData.dropoff,
      pickup_date: formData.pickup_date,
      pickup_time: formData.pickup_time,
    };

    const result = reservationSchema.safeParse(validationData);
    if (!result.success) {
      const errors: FormErrors = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      // Mark all as touched to show errors
      setTouched({
        customer_name: true,
        customer_phone: true,
        pickup: true,
        dropoff: true,
        pickup_date: true,
        pickup_time: true,
      });
      toast.error('Lütfen tüm zorunlu alanları doğru şekilde doldurun');
      return;
    }

    // Validate passenger names - at least primary passenger required
    const validPassengerNames = passengerNames.filter(name => name.trim() !== '');
    if (validPassengerNames.length === 0) {
      setFormErrors(prev => ({ ...prev, customer_name: 'En az bir yolcu ismi gerekli' }));
      toast.error('En az bir yolcu ismi gerekli');
      return;
    }

    // If admin marks as "sent_to_driver", a driver must be selected so notifications/emails are reliable
    if (formData.status === 'sent_to_driver' && !formData.driver_id) {
      toast.error('"Şoföre Gönderildi" seçildi: Lütfen şoför seçin');
      return;
    }

    setSaving(true);
    setFormErrors({});

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
          price: safeParseFloat(formData.price),
          price_currency: formData.price_currency,
          driver_cash_amount: safeParseFloat(formData.driver_cash_amount),
          passenger_cash_amount: safeParseFloat(formData.passenger_cash_amount),
          passenger_cash_currency: formData.passenger_cash_currency || 'TRY',
          status: formData.status,
          driver_id: formData.driver_id || null,
          agency_id: formData.agency_id || null,
          passenger_names: validPassengerNames,
          luggage_count: formData.luggage_count ? parseInt(formData.luggage_count) : null,
          baby_seat_count: formData.baby_seat_count ? parseInt(formData.baby_seat_count) : null,
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

      // Save admin notes if provided
      if (formData.admin_notes && reservation) {
        await supabase
          .from('reservation_admin_notes')
          .insert({
            reservation_id: reservation.id,
            notes: formData.admin_notes,
          });
      }

      // Save agency pricing details if agency is selected
      if (formData.agency_id && reservation) {
        const customerPrice = parseFloat(agencyDetails.customer_price) || null;
        const driverFee = safeParseFloat(formData.price);
        
        if (customerPrice !== null) {
          await supabase
            .from('agency_reservation_details')
            .insert({
              reservation_id: reservation.id,
              customer_price: customerPrice,
              agency_price_currency: agencyDetails.agency_price_currency,
              company_amount: customerPrice, // company_amount = customer_price (simplified logic)
            });
        }
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
                type: 'driver_assigned',
                send_push: true
              }
            });
          }

          // Notify customer that driver has been assigned
          if (reservation.customer_id && reservation.reservation_code) {
            try {
              await notifyStatusChange({
                customerId: reservation.customer_id,
                reservationCode: reservation.reservation_code,
                oldStatus: 'confirmed',
                newStatus: 'driver_assigned',
              });
            } catch (customerErr) {
              console.error('Failed to notify customer:', customerErr);
            }
          }
        } catch (err) {
          console.error('Failed to notify driver:', err);
        }
      }

      // Send email to driver when reservation is created already as "sent_to_driver"
      if (formData.status === 'sent_to_driver' && formData.driver_id && reservation) {
        try {
          const selectedDriver = drivers.find(d => d.id === formData.driver_id);

          // Resolve the exact email address that will be used for sending
          let resolvedDriverEmail: string | undefined = undefined;
          const { data: emailData, error: emailError } = await supabase.functions.invoke('get-driver-email', {
            body: { driver_id: formData.driver_id },
          });

          if (emailError) {
            console.error('Failed to fetch driver email (for email send):', emailError);
          } else if ((emailData as any)?.email) {
            resolvedDriverEmail = (emailData as any).email as string;
          } else {
            console.warn('No driver email found (for email send).', emailData);
          }

          const emailResult = await emailDriverAssigned(reservation.id, resolvedDriverEmail, selectedDriver?.name);
          if (!emailResult.success) {
            const errMsg = typeof emailResult.error === 'string'
              ? emailResult.error
              : String((emailResult.error as any)?.message || emailResult.error || 'Bilinmeyen hata');
            toast.error(`Şoför mail gönderilemedi: ${errMsg}`);
          }
        } catch (err) {
          console.error('Failed to send driver email:', err);
          toast.error('Şoför mail hatası');
        }
      }

      // If payment_link is selected, show payment link dialog
      if (formData.payment_type === 'payment_link' && reservation) {
        setCreatedReservation({
          id: reservation.id,
          reservation_code: reservation.reservation_code || reservation.id.slice(0, 8),
        });
        setPaymentLinkDialog(true);
        toast.success('Rezervasyon oluşturuldu! Şimdi ödeme linki oluşturabilirsiniz.');
      } else {
        toast.success('Reservation created successfully');
        navigate('/admin/reservations');
      }
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
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Müşteri Bilgileri</h3>
                </div>
                
                {/* Passenger Names */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      Yolcu İsimleri <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {passengerNames.filter(n => n.trim()).length}/{MAX_PASSENGERS}
                    </span>
                  </div>
                  
                  <AnimatePresence>
                    {passengerNames.map((name, index) => (
                      <motion.div 
                        key={index} 
                        className="flex gap-2 items-center"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex-1">
                          <div className="relative">
                            <Input
                              value={name}
                              onChange={(e) => updatePassenger(index, e.target.value)}
                              placeholder={index === 0 ? "Ana Yolcu Adı *" : `Yolcu ${index + 1}`}
                              className={`pr-20 ${index === 0 && touched.customer_name && formErrors.customer_name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                              onBlur={() => index === 0 && handleBlur('customer_name')}
                            />
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${index === 0 ? 'bg-primary/10 text-primary px-2 py-0.5 rounded' : 'text-muted-foreground'}`}>
                              {index === 0 ? '👤 Ana' : `#${index + 1}`}
                            </span>
                          </div>
                          {index === 0 && touched.customer_name && formErrors.customer_name && (
                            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {formErrors.customer_name}
                            </p>
                          )}
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
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
                  <Label className="flex items-center gap-1">
                    Müşteri Telefonu <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    onBlur={() => handleBlur('customer_phone')}
                    placeholder="+90 5XX XXX XXXX"
                    className={touched.customer_phone && formErrors.customer_phone ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {touched.customer_phone && formErrors.customer_phone && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.customer_phone}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Transfer Details */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
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
                  // Admin panelde yazarken kilitlenmeyi önlemek için haritayı,
                  // sadece iki lokasyon da Autocomplete üzerinden seçilip koordinatları geldiğinde göster.
                  showMap={
                    formData.pickup_lat != null &&
                    formData.pickup_lng != null &&
                    formData.dropoff_lat != null &&
                    formData.dropoff_lng != null
                  }
                  showNavigationButtons={false}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tarih *</Label>
                    <Input
                      type="date"
                      value={formData.pickup_date}
                      onChange={(e) => setFormData({...formData, pickup_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Saat * {formData.flight_number && formData.flight_number.length >= 3 && <span className="text-xs text-amber-600 font-normal">(Uçuş varış saatinden otomatik)</span>}</Label>
                    <Input
                      type="time"
                      value={formData.pickup_time}
                      onChange={(e) => setFormData({...formData, pickup_time: e.target.value})}
                      required
                      disabled={!!formData.flight_number && formData.flight_number.length >= 3}
                      className={formData.flight_number && formData.flight_number.length >= 3 ? 'bg-muted' : ''}
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
                
                {/* Flight Status Display */}
                {formData.flight_number && formData.flight_number.length >= 3 && formData.pickup_date && (
                  <FlightStatus 
                    flightNumber={formData.flight_number}
                    date={formData.pickup_date}
                    onArrivalTimeChange={(time) => setFormData(prev => ({ ...prev, pickup_time: time }))}
                    refreshIntervalMs={0}
                  />
                )}

                <div className="space-y-2">
                  <Label>Araç Tipi</Label>
                  <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({...formData, vehicle_type: v})}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valiz Sayısı</Label>
                    <Select value={formData.luggage_count || "none"} onValueChange={(v) => setFormData({...formData, luggage_count: v === "none" ? "" : v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Valiz seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Yok</SelectItem>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} Valiz</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bebek Koltuğu</Label>
                    <Select value={formData.baby_seat_count || "none"} onValueChange={(v) => setFormData({...formData, baby_seat_count: v === "none" ? "" : v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Bebek koltuğu seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Yok</SelectItem>
                        <SelectItem value="1">1 Bebek Koltuğu</SelectItem>
                        <SelectItem value="2">2 Bebek Koltuğu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>

              {/* Payment & Pricing */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Banknote className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Ödeme ve Fiyat</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Ödeme Tipi</Label>
                    <Select value={formData.payment_type} onValueChange={(v) => setFormData({...formData, payment_type: v, agency_id: v === 'agency_pay' ? formData.agency_id : ''})}>
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
                  {/* Yolcudan Alınacak Nakit - New dedicated field */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-amber-700 dark:text-amber-400 font-semibold">Yolcudan Alınacak Nakit Tutar</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.passenger_cash_amount}
                          onChange={(e) => setFormData({...formData, passenger_cash_amount: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      <Select value={formData.passenger_cash_currency} onValueChange={(v) => setFormData({...formData, passenger_cash_currency: v})}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">Bu tutar sadece bilgi amaçlıdır, hesaplamalara dahil edilmez.</p>
                  </div>
                </div>
              </motion.div>

              {/* Status & Assignment */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Durum ve Atama</h3>
                </div>
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

                {/* Agency Selection - Only show when payment type is agency_pay */}
                {formData.payment_type === 'agency_pay' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Acenta *</Label>
                      <Select value={formData.agency_id} onValueChange={(v) => setFormData({...formData, agency_id: v === 'none' ? '' : v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Acenta seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.agency_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Agency Pricing - Müşteri Fiyatı */}
                    {formData.agency_id && (
                      <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-base">
                            <Banknote className="h-4 w-4" />
                            Acenta Fiyatlandırması
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-blue-700 dark:text-blue-300">Müşteri Fiyatı</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={agencyDetails.customer_price}
                                onChange={(e) => setAgencyDetails({ ...agencyDetails, customer_price: e.target.value })}
                                className="flex-1"
                              />
                              <Select
                                value={agencyDetails.agency_price_currency}
                                onValueChange={(v) => setAgencyDetails({ ...agencyDetails, agency_price_currency: v })}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Bu tutar acenta borç bakiyesine eklenir ve aylık kâr hesabında kullanılır.
                              {agencyDetails.agency_price_currency !== 'TRY' && (
                                <span className="block text-amber-600 dark:text-amber-400 mt-1">
                                  Döviz tutarı otomatik kur ile TRY'ye çevrilecektir.
                                </span>
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Admin Notes */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Admin Notları (Dahili)</h3>
                </div>
                <Textarea
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                  placeholder="Dahili notlar - müşteri veya şoför tarafından görülemez"
                  rows={3}
                  className="resize-none"
                />
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Rezervasyon Oluştur
                    </>
                  )}
                </Button>
              </motion.div>
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

        {/* Payment Link Dialog */}
        <Dialog open={paymentLinkDialog} onOpenChange={(open) => {
          if (!open) {
            navigate('/admin/reservations');
          }
          setPaymentLinkDialog(open);
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Ödeme Linki Oluştur
              </DialogTitle>
              <DialogDescription>
                Rezervasyon #{createdReservation?.reservation_code} için ödeme linki oluşturun ve müşteriye gönderin.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Customer email input if not available */}
              <div className="space-y-2">
                <Label>Müşteri E-posta Adresi</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="musteri@email.com"
                />
                <p className="text-xs text-muted-foreground">
                  Ödeme linki bu adrese gönderilecek
                </p>
              </div>

              {createdReservation && (
                <AdminPaymentLinkGenerator
                  reservationId={createdReservation.id}
                  amount={safeParseFloat(formData.price) || 0}
                  currency={formData.price_currency}
                  customerEmail={customerEmail}
                  customerName={passengerNames[0] || ''}
                  pickup={formData.pickup}
                  dropoff={formData.dropoff}
                  pickupDate={formData.pickup_date}
                  pickupTime={formData.pickup_time}
                  onLinkGenerated={(link) => {
                    console.log('Payment link generated:', link);
                  }}
                  onLinkSent={() => {
                    toast.success('Ödeme linki müşteriye gönderildi!');
                  }}
                />
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => navigate('/admin/reservations')}>
                Kapat ve Bitir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminCreateReservation;