import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, DollarSign } from 'lucide-react';

const airports = ['IST', 'SAW', 'AYT', 'BJV', 'DLM', 'ASR', 'NAV', 'ADB'];
const vehicleTypes = ['mercedes-vito', 'mercedes-vclass', 'maybach', 'minibus'];
const paymentTypes = ['cash', 'no-cash', 'invoice'];
const statuses = ['awaiting-price', 'awaiting-customer', 'confirmed', 'assigned', 'active', 'completed', 'cancelled'];

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-orange-500/20 text-orange-700',
  'awaiting-customer': 'bg-purple-500/20 text-purple-700',
  'confirmed': 'bg-blue-500/20 text-blue-700',
  'assigned': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
  'cancelled': 'bg-destructive/20 text-destructive',
};

interface Driver {
  id: string;
  name: string;
}

const AdminEditReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingPrice, setSendingPrice] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    pickup: '',
    dropoff: '',
    pickup_date: '',
    pickup_time: '',
    flight_number: '',
    vehicle_type: '',
    payment_type: '',
    price: '',
    status: '',
    driver_id: '',
    admin_notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const [reservationResult, driversResult, adminNotesResult] = await Promise.all([
        supabase.from('reservations').select('*').eq('id', id).single(),
        supabase.from('drivers').select('id, name').eq('active', true),
        supabase.from('reservation_admin_notes').select('notes').eq('reservation_id', id).maybeSingle(),
      ]);

      if (reservationResult.error) {
        toast.error('Failed to load reservation');
        navigate('/admin/reservations');
        return;
      }

      const r = reservationResult.data;
      setCustomerId(r.customer_id);
      
      const initialData = {
        customer_name: r.customer_name || '',
        customer_phone: r.customer_phone || '',
        pickup: r.pickup || '',
        dropoff: r.dropoff || '',
        pickup_date: r.pickup_date || '',
        pickup_time: r.pickup_time || '',
        flight_number: r.flight_number || '',
        vehicle_type: r.vehicle_type || '',
        payment_type: r.payment_type || '',
        price: r.price?.toString() || '',
        status: r.status || '',
        driver_id: r.driver_id || '',
        admin_notes: adminNotesResult.data?.notes || '',
      };
      
      setOriginalData(initialData);
      setFormData(initialData);

      setDrivers(driversResult.data || []);
      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  const handleSendPrice = async () => {
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price first');
      return;
    }
    
    setSendingPrice(true);

    try {
      // Update reservation with price and change status to awaiting-customer
      const { error } = await supabase
        .from('reservations')
        .update({
          price: parseFloat(formData.price),
          status: 'awaiting-customer',
        })
        .eq('id', id);

      if (error) throw error;

      // Notify customer
      if (customerId) {
        try {
          await supabase.functions.invoke('create-notification', {
            body: {
              user_id: customerId,
              reservation_id: id,
              title: 'Your Transfer Price is Ready',
              message: `Your transfer price has been set: €${formData.price}. Please review and confirm your booking.`,
              type: 'price_ready'
            }
          });
        } catch (e) {
          console.error('Failed to notify customer:', e);
        }
      }

      // Audit log for price sent
      await logAction({
        action: 'SEND_PRICE',
        table_name: 'reservations',
        record_id: id,
        old_data: { price: originalData?.price, status: originalData?.status },
        new_data: { price: formData.price, status: 'awaiting-customer' },
      });

      toast.success('Price sent to customer for approval!');
      setFormData({ ...formData, status: 'awaiting-customer' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send price');
    } finally {
      setSendingPrice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Update reservation (without admin_notes)
    const { error: reservationError } = await supabase
      .from('reservations')
      .update({
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        pickup_date: formData.pickup_date,
        pickup_time: formData.pickup_time,
        flight_number: formData.flight_number || null,
        vehicle_type: formData.vehicle_type,
        payment_type: formData.payment_type,
        price: parseFloat(formData.price) || null,
        status: formData.status,
        driver_id: formData.driver_id || null,
      })
      .eq('id', id);

    if (reservationError) {
      toast.error('Failed to update reservation');
      setSaving(false);
      return;
    }

    // Upsert admin notes in separate table
    if (formData.admin_notes) {
      const { error: notesError } = await supabase
        .from('reservation_admin_notes')
        .upsert({
          reservation_id: id,
          notes: formData.admin_notes,
        }, {
          onConflict: 'reservation_id'
        });

      if (notesError) {
        toast.error('Failed to save admin notes');
        setSaving(false);
        return;
      }
    } else {
      // Delete notes if empty
      await supabase
        .from('reservation_admin_notes')
        .delete()
        .eq('reservation_id', id);
    }

    // Audit log for reservation update
    await logAction({
      action: 'UPDATE',
      table_name: 'reservations',
      record_id: id,
      old_data: originalData || undefined,
      new_data: {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        pickup_date: formData.pickup_date,
        pickup_time: formData.pickup_time,
        vehicle_type: formData.vehicle_type,
        payment_type: formData.payment_type,
        price: formData.price,
        status: formData.status,
        driver_id: formData.driver_id,
      },
    });

    toast.success('Reservation updated');
    navigate('/admin/reservations');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/reservations')} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif">Edit Reservation</h1>
        <Badge className={`ml-auto ${statusColors[formData.status] || 'bg-muted'}`}>
          {formData.status}
        </Badge>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        {/* Price Entry Card for awaiting-price status */}
        {formData.status === 'awaiting-price' && (
          <Card className="mb-6 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <DollarSign className="h-5 w-5" />
                Set Price for Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                This reservation is awaiting pricing. Enter the price and send it to the customer for approval.
              </p>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Price (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="Enter price"
                    className="text-lg"
                  />
                </div>
                <Button 
                  onClick={handleSendPrice} 
                  disabled={sendingPrice || !formData.price}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingPrice ? 'Sending...' : 'Send to Customer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Phone</Label>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pickup</Label>
                  <Select value={formData.pickup} onValueChange={(v) => setFormData({...formData, pickup: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map(a => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Drop-off</Label>
                  <Input
                    value={formData.dropoff}
                    onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.pickup_date}
                    onChange={(e) => setFormData({...formData, pickup_date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.pickup_time}
                    onChange={(e) => setFormData({...formData, pickup_time: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Flight</Label>
                  <Input
                    value={formData.flight_number}
                    onChange={(e) => setFormData({...formData, flight_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({...formData, vehicle_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment</Label>
                  <Select value={formData.payment_type} onValueChange={(v) => setFormData({...formData, payment_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Driver</Label>
                  <Select value={formData.driver_id} onValueChange={(v) => setFormData({...formData, driver_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminEditReservation;
