import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

const airports = ['IST', 'SAW', 'AYT', 'BJV', 'DLM', 'ASR', 'NAV', 'ADB'];
const vehicleTypes = ['mercedes-vito', 'mercedes-vclass', 'maybach', 'minibus'];
const paymentTypes = ['cash', 'no-cash', 'invoice'];
const statuses = ['new', 'assigned', 'active', 'completed', 'cancelled'];

interface Driver {
  id: string;
  name: string;
}

const AdminEditReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
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
      setFormData({
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
      });

      setDrivers(driversResult.data || []);
      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

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
        price: parseFloat(formData.price) || 0,
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
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
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
                    required
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
