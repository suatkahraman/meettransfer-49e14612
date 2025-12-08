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
import { ArrowLeft, Save, Plus, BookmarkPlus, FileText } from 'lucide-react';

const airports = ['IST', 'SAW', 'AYT', 'BJV', 'DLM', 'ASR', 'NAV', 'ADB'];
const vehicleTypes = ['mercedes-vito', 'mercedes-vclass', 'maybach', 'minibus'];
const paymentTypes = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
  { value: 'none', label: 'None' },
];

// Statuses for manual admin reservations
const statuses = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'sent_to_driver', label: 'Sent to Driver' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
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

const AdminCreateReservation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
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
    admin_notes: '',
  });

  const getCurrencySymbol = (currency: string) => {
    return currencies.find(c => c.value === currency)?.symbol || currency;
  };

  useEffect(() => {
    const fetchData = async () => {
      const [driversRes, templatesRes] = await Promise.all([
        supabase.from('drivers').select('id, name, user_id').eq('active', true),
        supabase.from('reservation_templates').select('*').order('name'),
      ]);
      setDrivers(driversRes.data || []);
      setTemplates(templatesRes.data || []);
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
    
    if (!formData.customer_name || !formData.customer_phone || !formData.pickup || !formData.dropoff || !formData.pickup_date || !formData.pickup_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Create reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          customer_id: user?.id, // Admin creates on behalf
          customer_name: formData.customer_name,
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
          customer_name: formData.customer_name,
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
        <h1 className="text-2xl font-serif">Create Reservation</h1>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap justify-between items-start gap-4">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Reservation
              </CardTitle>
              <div className="flex gap-2">
                {templates.length > 0 && (
                  <Select onValueChange={applyTemplate}>
                    <SelectTrigger className="w-[180px]">
                      <FileText className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Use Template" />
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
                  Save Template
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Phone *</Label>
                    <Input
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                      placeholder="+90 5XX XXX XXXX"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Transfer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pickup Location *</Label>
                    <Select value={formData.pickup} onValueChange={(v) => setFormData({...formData, pickup: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select airport" />
                      </SelectTrigger>
                      <SelectContent>
                        {airports.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Drop-off Location *</Label>
                    <Input
                      value={formData.dropoff}
                      onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                      placeholder="Hotel or address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={formData.pickup_date}
                      onChange={(e) => setFormData({...formData, pickup_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time *</Label>
                    <Input
                      type="time"
                      value={formData.pickup_time}
                      onChange={(e) => setFormData({...formData, pickup_time: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Flight Number</Label>
                    <Input
                      value={formData.flight_number}
                      onChange={(e) => setFormData({...formData, flight_number: e.target.value})}
                      placeholder="TK1234"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
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
                <h3 className="font-semibold text-lg border-b pb-2">Payment & Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Type</Label>
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
                    <Label>Currency</Label>
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
                    <Label>Price</Label>
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
                    <Label>Driver Cash Amount</Label>
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
                <h3 className="font-semibold text-lg border-b pb-2">Status & Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
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
                    <Label>Assign Driver</Label>
                    <Select value={formData.driver_id} onValueChange={(v) => setFormData({...formData, driver_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Admin Notes (Internal)</h3>
                <Textarea
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                  placeholder="Internal notes - not visible to customer or driver"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Creating...' : 'Create Reservation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Save Template Dialog */}
        <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Save the current route ({formData.pickup} → {formData.dropoff}) as a reusable template.
              </p>
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., IST to Taksim Standard"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveAsTemplate} disabled={savingTemplate}>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                {savingTemplate ? 'Saving...' : 'Save Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminCreateReservation;