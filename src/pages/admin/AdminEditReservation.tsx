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
import { ArrowLeft, Save, Send, DollarSign, UserCheck, X, UserPlus } from 'lucide-react';

// Airports list removed - pickup is now free text
const vehicleTypes = ['mercedes-vito', 'mercedes-vclass', 'maybach', 'minibus'];
const paymentTypes = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
  { value: 'none', label: 'None' },
];

// Status workflow
const statuses = [
  'pending_price',
  'waiting_for_customer_approval',
  'customer_approved',
  'customer_rejected',
  'confirmed',
  'sent_to_driver',
  'active',
  'completed',
];

const statusColors: Record<string, string> = {
  'pending_price': 'bg-orange-500/20 text-orange-700',
  'waiting_for_customer_approval': 'bg-purple-500/20 text-purple-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'customer_rejected': 'bg-destructive/20 text-destructive',
  'confirmed': 'bg-emerald-500/20 text-emerald-700',
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
};

const statusLabels: Record<string, string> = {
  'pending_price': 'Pending Price',
  'waiting_for_customer_approval': 'Waiting Customer Approval',
  'customer_approved': 'Customer Approved',
  'customer_rejected': 'Customer Rejected',
  'confirmed': 'Confirmed',
  'sent_to_driver': 'Sent to Driver',
  'active': 'Active',
  'completed': 'Completed',
};

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

const MAX_PASSENGERS = 15;

const AdminEditReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingPrice, setSendingPrice] = useState(false);
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<Record<string, unknown> | null>(null);
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);
  const [formData, setFormData] = useState({
    customer_phone: '',
    pickup: '',
    dropoff: '',
    pickup_date: '',
    pickup_time: '',
    flight_number: '',
    vehicle_type: '',
    payment_type: '',
    price: '',
    price_currency: 'TRY',
    driver_cash_amount: '',
    status: '',
    driver_id: '',
    admin_notes: '',
  });

  const getCurrencySymbol = (currency: string) => {
    return currencies.find(c => c.value === currency)?.symbol || currency;
  };

  const addPassenger = () => {
    if (passengerNames.length < MAX_PASSENGERS) {
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

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const [reservationResult, driversResult, adminNotesResult] = await Promise.all([
        supabase.from('reservations').select('*').eq('id', id).single(),
        supabase.from('drivers').select('id, name, user_id').eq('active', true),
        supabase.from('reservation_admin_notes').select('notes').eq('reservation_id', id).maybeSingle(),
      ]);

      if (reservationResult.error) {
        toast.error('Failed to load reservation');
        navigate('/admin/reservations');
        return;
      }

      const r = reservationResult.data;
      setCustomerId(r.customer_id);
      
      // Load passenger names - use array or fallback to customer_name
      const loadedPassengerNames = r.passenger_names && r.passenger_names.length > 0 
        ? r.passenger_names 
        : [r.customer_name || ''];
      setPassengerNames(loadedPassengerNames);
      
      const initialData = {
        customer_phone: r.customer_phone || '',
        pickup: r.pickup || '',
        dropoff: r.dropoff || '',
        pickup_date: r.pickup_date || '',
        pickup_time: r.pickup_time || '',
        flight_number: r.flight_number || '',
        vehicle_type: r.vehicle_type || '',
        payment_type: r.payment_type || '',
        price: r.price?.toString() || '',
        price_currency: r.price_currency || 'TRY',
        driver_cash_amount: r.driver_cash_amount?.toString() || '',
        status: r.status || '',
        driver_id: r.driver_id || '',
        admin_notes: adminNotesResult.data?.notes || '',
        passenger_names: loadedPassengerNames,
      };
      
      setOriginalData(initialData);
      setFormData(initialData);

      setDrivers(driversResult.data || []);
      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  const handleSendPriceToCustomer = async () => {
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price first');
      return;
    }
    
    setSendingPrice(true);

    try {
      const priceValue = parseFloat(formData.price);
      
      // Update reservation with price, currency, admin_set_price and change status
      const { error } = await supabase
        .from('reservations')
        .update({
          price: priceValue,
          price_currency: formData.price_currency,
          admin_set_price: priceValue, // Store original admin price
          status: 'waiting_for_customer_approval',
        })
        .eq('id', id);

      if (error) throw error;

      // Notify customer
      if (customerId) {
        const symbol = getCurrencySymbol(formData.price_currency);
        try {
          await supabase.functions.invoke('create-notification', {
            body: {
              user_id: customerId,
              reservation_id: id,
              title: 'Your Transfer Price is Ready',
              message: `Your transfer price has been set: ${symbol}${formData.price}. Please review and confirm your booking.`,
              type: 'price_ready'
            }
          });
        } catch (e) {
          console.error('Failed to notify customer:', e);
        }
      }

      // Audit log for price sent
      await logAction({
        action: 'SEND_PRICE_TO_CUSTOMER',
        table_name: 'reservations',
        record_id: id,
        old_data: { price: originalData?.price, price_currency: originalData?.price_currency, status: originalData?.status },
        new_data: { price: formData.price, price_currency: formData.price_currency, status: 'waiting_for_customer_approval' },
      });

      toast.success('Price sent to customer for approval!');
      setFormData({ ...formData, status: 'waiting_for_customer_approval' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send price');
    } finally {
      setSendingPrice(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!formData.driver_id) {
      toast.error('Please select a driver first');
      return;
    }

    setAssigningDriver(true);

    try {
      // Update reservation with driver and status
      const { error } = await supabase
        .from('reservations')
        .update({
          driver_id: formData.driver_id,
          status: 'sent_to_driver',
        })
        .eq('id', id);

      if (error) throw error;

      // Get driver info for notification
      const selectedDriver = drivers.find(d => d.id === formData.driver_id);
      
      // Notify driver with the same price
      if (selectedDriver?.user_id) {
        const symbol = getCurrencySymbol(formData.price_currency);
        try {
          await supabase.functions.invoke('create-notification', {
            body: {
              user_id: selectedDriver.user_id,
              reservation_id: id,
              title: 'New Job Assigned',
              message: `New transfer: ${formData.pickup} → ${formData.dropoff} on ${formData.pickup_date} at ${formData.pickup_time}. Price: ${symbol}${formData.price}`,
              type: 'driver_assigned'
            }
          });
        } catch (e) {
          console.error('Failed to notify driver:', e);
        }
      }

      // Audit log
      await logAction({
        action: 'ASSIGN_DRIVER',
        table_name: 'reservations',
        record_id: id,
        old_data: { driver_id: originalData?.driver_id, status: originalData?.status },
        new_data: { driver_id: formData.driver_id, driver_name: selectedDriver?.name, status: 'sent_to_driver' },
      });

      toast.success('Driver assigned and notified with price!');
      setFormData({ ...formData, status: 'sent_to_driver' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign driver');
    } finally {
      setAssigningDriver(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one passenger name
    const validPassengerNames = passengerNames.filter(name => name.trim() !== '');
    if (validPassengerNames.length === 0) {
      toast.error('At least one passenger name is required');
      return;
    }
    
    setSaving(true);

    // Update reservation (without admin_notes)
    const { error: reservationError } = await supabase
      .from('reservations')
      .update({
        customer_name: validPassengerNames[0], // Primary passenger for backward compatibility
        customer_phone: formData.customer_phone,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        pickup_date: formData.pickup_date,
        pickup_time: formData.pickup_time,
        flight_number: formData.flight_number || null,
        vehicle_type: formData.vehicle_type,
        payment_type: formData.payment_type,
        price: parseFloat(formData.price) || null,
        price_currency: formData.price_currency,
        driver_cash_amount: formData.driver_cash_amount ? parseFloat(formData.driver_cash_amount) : null,
        status: formData.status,
        driver_id: formData.driver_id || null,
        passenger_names: validPassengerNames,
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
        customer_name: validPassengerNames[0],
        customer_phone: formData.customer_phone,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        pickup_date: formData.pickup_date,
        pickup_time: formData.pickup_time,
        vehicle_type: formData.vehicle_type,
        payment_type: formData.payment_type,
        price: formData.price,
        price_currency: formData.price_currency,
        status: formData.status,
        driver_id: formData.driver_id,
        passenger_names: validPassengerNames,
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

  const currencySymbol = getCurrencySymbol(formData.price_currency);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/reservations')} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif">Edit Reservation</h1>
        <Badge className={`ml-auto ${statusColors[formData.status] || 'bg-muted'}`}>
          {statusLabels[formData.status] || formData.status}
        </Badge>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl space-y-6">
        {/* Price Entry Card for pending_price status */}
        {formData.status === 'pending_price' && (
          <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <DollarSign className="h-5 w-5" />
                Set Price for Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                This reservation is awaiting pricing. Enter the price, select currency, and send to the customer for approval.
              </p>
              <div className="grid grid-cols-2 gap-4">
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
                      placeholder="Enter price"
                      className="text-lg pl-8"
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSendPriceToCustomer} 
                disabled={sendingPrice || !formData.price}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingPrice ? 'Sending...' : 'Send Price to Customer'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Assign Driver Card - after customer approval OR for confirmed manual reservations */}
        {(formData.status === 'customer_approved' || formData.status === 'confirmed') && !formData.driver_id && (
          <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <UserCheck className="h-5 w-5" />
                Assign Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {formData.status === 'confirmed' 
                  ? 'This reservation is confirmed. Select a driver to assign this job.'
                  : `Customer has approved the price (${currencySymbol}${formData.price}). Select a driver to assign this job.`
                }
              </p>
              <div className="space-y-2">
                <Label>Select Driver</Label>
                <Select value={formData.driver_id} onValueChange={(v) => setFormData({...formData, driver_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAssignDriver} 
                disabled={assigningDriver || !formData.driver_id}
                className="w-full"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {assigningDriver ? 'Assigning...' : 'Assign to Driver'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Passenger Names Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Passengers ({passengerNames.length}/{MAX_PASSENGERS})</Label>
                  {passengerNames.length < MAX_PASSENGERS && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPassenger}
                      className="gap-1"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Passenger
                    </Button>
                  )}
                </div>
                
                {passengerNames.map((name, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {index === 0 ? 'Primary Passenger' : `Passenger ${index + 1}`}
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => updatePassenger(index, e.target.value)}
                        placeholder={index === 0 ? 'Primary passenger name' : `Passenger ${index + 1} name`}
                        required={index === 0}
                      />
                    </div>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePassenger(index)}
                        className="mt-5 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Customer Phone</Label>
                <Input
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pick-up Point</Label>
                  <Input
                    value={formData.pickup}
                    onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                    placeholder="Enter Pick-up Point"
                  />
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

              <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Driver Cash</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.driver_cash_amount}
                      onChange={(e) => setFormData({...formData, driver_cash_amount: e.target.value})}
                      className="pl-8"
                    />
                  </div>
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
                        <SelectItem key={s} value={s}>{statusLabels[s] || s}</SelectItem>
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
                  placeholder="Internal notes (not visible to customer or driver)"
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