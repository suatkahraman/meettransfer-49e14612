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
import { ArrowLeft, Save, Send, DollarSign, UserCheck, X, UserPlus, Building2, CheckCircle, Loader2 } from 'lucide-react';

// Airports list removed - pickup is now free text
const vehicleTypes = ['mercedes-vito', 'mercedes-vclass', 'maybach', 'minibus'];
const paymentTypes = [
  { value: 'cash', label: 'Cash to Driver' },
  { value: 'online', label: 'Online Payment Link' },
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
  'pending_admin_review',
  'cancelled_by_customer',
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
  'pending_admin_review': 'bg-amber-500/20 text-amber-700',
  'cancelled_by_customer': 'bg-destructive/20 text-destructive',
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
  'pending_admin_review': 'Needs Review',
  'cancelled_by_customer': 'Cancelled by Customer',
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

interface Agency {
  id: string;
  agency_name: string;
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
  const [collectingPayment, setCollectingPayment] = useState(false);
  const [isEditingAgencyPrice, setIsEditingAgencyPrice] = useState(false);
  const [agencyPriceSaved, setAgencyPriceSaved] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [reservationCode, setReservationCode] = useState<string | null>(null);
  const [agencyDetails, setAgencyDetails] = useState<{
    customer_price: string;
    agency_price_currency: string;
    agency_notes: string;
    payment_status: string;
  }>({ customer_price: '', agency_price_currency: 'USD', agency_notes: '', payment_status: 'not_paid' });
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
    agency_id: '',
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

      const [reservationResult, driversResult, adminNotesResult, agenciesResult, agencyDetailsResult] = await Promise.all([
        supabase.from('reservations').select('*').eq('id', id).single(),
        supabase.from('drivers').select('id, name, user_id').eq('active', true),
        supabase.from('reservation_admin_notes').select('notes').eq('reservation_id', id).maybeSingle(),
        supabase.from('agencies').select('id, agency_name').order('agency_name'),
        supabase.from('agency_reservation_details').select('*').eq('reservation_id', id).maybeSingle(),
      ]);

      if (reservationResult.error) {
        toast.error('Failed to load reservation');
        navigate('/admin/reservations');
        return;
      }

      const r = reservationResult.data;
      setCustomerId(r.customer_id);
      setReservationCode(r.reservation_code);
      
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
        agency_id: r.agency_id || '',
        admin_notes: adminNotesResult.data?.notes || '',
      };
      
      setOriginalData(initialData);
      setFormData(initialData);

      // Load agency details if exists
      if (agencyDetailsResult.data) {
        const savedCustomerPrice = agencyDetailsResult.data.customer_price?.toString() || '';
        setAgencyDetails({
          customer_price: savedCustomerPrice,
          agency_price_currency: (agencyDetailsResult.data as any).agency_price_currency || 'USD',
          agency_notes: agencyDetailsResult.data.agency_notes || '',
          payment_status: agencyDetailsResult.data.payment_status || 'not_paid',
        });
        // Mark as saved if there's an existing price
        if (savedCustomerPrice && parseFloat(savedCustomerPrice) > 0) {
          setAgencyPriceSaved(true);
        }
      }

      setDrivers(driversResult.data || []);
      setAgencies(agenciesResult.data || []);
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

      // Notify customer that driver has been assigned
      if (customerId) {
        try {
          await supabase.functions.invoke('create-notification', {
            body: {
              user_id: customerId,
              reservation_id: id,
              title: 'Driver Assigned',
              message: `Your driver has been assigned: ${selectedDriver?.name}. They will contact you before pickup.`,
              type: 'driver_assigned'
            }
          });
        } catch (e) {
          console.error('Failed to notify customer:', e);
        }

        // Send confirmation email
        try {
          await supabase.functions.invoke('send-confirmation-email', {
            body: { reservation_id: id }
          });
        } catch (e) {
          console.error('Failed to send confirmation email:', e);
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

  const handleCollectPayment = async () => {
    if (!formData.agency_id || formData.agency_id === 'none' || !agencyDetails.customer_price) {
      toast.error('Please enter agency price first');
      return;
    }

    setCollectingPayment(true);

    try {
      const agencyPrice = parseFloat(agencyDetails.customer_price);
      
      // Get current agency balance
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .select('balance, agency_name')
        .eq('id', formData.agency_id)
        .single();

      if (agencyError) throw agencyError;

      const currentBalance = agency.balance || 0;
      const newBalance = currentBalance + agencyPrice;

      // Update agency balance
      const { error: updateError } = await supabase
        .from('agencies')
        .update({ balance: newBalance })
        .eq('id', formData.agency_id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('agency_transactions')
        .insert({
          agency_id: formData.agency_id,
          reservation_id: id,
          amount: agencyPrice,
          balance_after: newBalance,
          type: 'payment',
          description: `Payment collected for reservation ${reservationCode || id}`,
        });

      if (transactionError) throw transactionError;

      // Update agency_reservation_details payment status
      const driverFee = parseFloat(formData.price) || 0;
      const profit = agencyPrice - driverFee;

      const { error: detailsError } = await supabase
        .from('agency_reservation_details')
        .upsert({
          reservation_id: id,
          customer_price: agencyPrice,
          agency_price_currency: agencyDetails.agency_price_currency,
          company_amount: driverFee, // Amount company charges for the transfer
          agency_profit: profit,
          agency_notes: agencyDetails.agency_notes || null,
          payment_status: 'paid',
        } as any, {
          onConflict: 'reservation_id'
        });

      if (detailsError) throw detailsError;

      // Update local state
      setAgencyDetails({ ...agencyDetails, payment_status: 'paid' });

      // Audit log
      await logAction({
        action: 'COLLECT_AGENCY_PAYMENT',
        table_name: 'agency_transactions',
        record_id: id,
        new_data: { 
          agency_name: agency.agency_name, 
          amount: agencyPrice, 
          reservation_code: reservationCode 
        },
      });

      toast.success(`Payment of ${getCurrencySymbol(formData.price_currency)}${agencyPrice.toFixed(2)} collected from ${agency.agency_name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to collect payment');
    } finally {
      setCollectingPayment(false);
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
        agency_id: formData.agency_id && formData.agency_id !== 'none' ? formData.agency_id : null,
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

    // Save agency details if agency is selected
    if (formData.agency_id && formData.agency_id !== 'none') {
      const driverFee = parseFloat(formData.price) || 0;
      const agencyPrice = parseFloat(agencyDetails.customer_price) || 0;
      const profit = agencyPrice - driverFee;

      const { error: agencyError } = await supabase
        .from('agency_reservation_details')
        .upsert({
          reservation_id: id,
          customer_price: agencyPrice,
          agency_price_currency: agencyDetails.agency_price_currency,
          company_amount: driverFee, // Amount company charges for the transfer
          agency_profit: profit,
          agency_notes: agencyDetails.agency_notes || null,
          payment_status: agencyDetails.payment_status,
        } as any, {
          onConflict: 'reservation_id'
        });

      if (agencyError) {
        console.error('Failed to save agency details:', agencyError);
      } else if (agencyPrice > 0) {
        // Mark agency price as saved and lock it
        setAgencyPriceSaved(true);
        setIsEditingAgencyPrice(false);
      }
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
        <div className="flex flex-col">
          {reservationCode && (
            <span className="text-xs font-mono opacity-80">{reservationCode}</span>
          )}
          <h1 className="text-2xl font-serif">Edit Reservation</h1>
        </div>
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

        {/* Customer Edit Review Card */}
        {formData.status === 'pending_admin_review' && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <UserCheck className="h-5 w-5" />
                Customer Updated This Reservation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                The customer has modified this reservation. Please review the changes below and either approve or reject them.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      // Restore to previous status (sent_to_driver if driver was assigned, customer_approved otherwise)
                      const newStatus = formData.driver_id ? 'sent_to_driver' : 'customer_approved';
                      const { error } = await supabase
                        .from('reservations')
                        .update({ status: newStatus })
                        .eq('id', id);
                      if (error) throw error;

                      // Notify customer
                      if (customerId) {
                        try {
                          await supabase.functions.invoke('create-notification', {
                            body: {
                              user_id: customerId,
                              reservation_id: id,
                              title: 'Changes Approved',
                              message: 'Your reservation changes have been approved.',
                              type: 'changes_approved'
                            }
                          });
                        } catch (e) {
                          console.error('Failed to notify customer:', e);
                        }
                      }

                      toast.success('Changes approved!');
                      setFormData({ ...formData, status: newStatus });
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to approve changes');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Approve Changes
                </Button>
                <Button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      // Revert to original data
                      if (originalData) {
                        const { error } = await supabase
                          .from('reservations')
                          .update({
                            pickup: originalData.pickup as string,
                            dropoff: originalData.dropoff as string,
                            pickup_date: originalData.pickup_date as string,
                            pickup_time: originalData.pickup_time as string,
                            flight_number: originalData.flight_number as string | null,
                            vehicle_type: originalData.vehicle_type as string,
                            passenger_names: originalData.passenger_names as string[],
                            status: formData.driver_id ? 'sent_to_driver' : 'customer_approved',
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
                                title: 'Changes Rejected',
                                message: 'Your reservation changes have been rejected. The original details have been restored.',
                                type: 'changes_rejected'
                              }
                            });
                          } catch (e) {
                            console.error('Failed to notify customer:', e);
                          }
                        }

                        toast.success('Changes rejected, original details restored');
                        navigate('/admin/reservations');
                      }
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to reject changes');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                >
                  Reject Changes
                </Button>
              </div>
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
                <Label>Agency</Label>
                <Select value={formData.agency_id} onValueChange={(v) => setFormData({...formData, agency_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="No Agency (Direct Customer)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Agency (Direct Customer)</SelectItem>
                    {agencies.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.agency_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agency Pricing Section - Only show when agency is selected */}
              {formData.agency_id && formData.agency_id !== 'none' && (
                <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-base">
                      <Building2 className="h-4 w-4" />
                      Agency Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Enter the amount to receive from the agency. Profit = Agency Price - Driver Transfer Fee
                    </p>
                    
                    {/* Agency Price Fields - Locked when saved, editable when not */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label className="text-sm">Agency Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={agencyDetails.customer_price}
                          onChange={(e) => setAgencyDetails({...agencyDetails, customer_price: e.target.value})}
                          placeholder="Amount from agency"
                          disabled={agencyPriceSaved && !isEditingAgencyPrice}
                          className={agencyPriceSaved && !isEditingAgencyPrice ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Currency</Label>
                        <Select 
                          value={agencyDetails.agency_price_currency} 
                          onValueChange={(v) => setAgencyDetails({...agencyDetails, agency_price_currency: v})}
                          disabled={agencyPriceSaved && !isEditingAgencyPrice}
                        >
                          <SelectTrigger className={agencyPriceSaved && !isEditingAgencyPrice ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">$ USD</SelectItem>
                            <SelectItem value="EUR">€ EUR</SelectItem>
                            <SelectItem value="TRY">₺ TRY</SelectItem>
                            <SelectItem value="GBP">£ GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Edit/Save Price Button */}
                    {agencyPriceSaved && !isEditingAgencyPrice ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingAgencyPrice(true)}
                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Edit Agency Price
                      </Button>
                    ) : isEditingAgencyPrice ? (
                      <Button
                        type="button"
                        onClick={async () => {
                          const agencyPrice = parseFloat(agencyDetails.customer_price) || 0;
                          if (agencyPrice <= 0) {
                            toast.error('Please enter a valid agency price');
                            return;
                          }
                          const driverFee = parseFloat(formData.price) || 0;
                          const profit = agencyPrice - driverFee;

                          const { error } = await supabase
                            .from('agency_reservation_details')
                            .upsert({
                              reservation_id: id,
                              customer_price: agencyPrice,
                              agency_price_currency: agencyDetails.agency_price_currency,
                              company_amount: driverFee,
                              agency_profit: profit,
                              agency_notes: agencyDetails.agency_notes || null,
                              payment_status: agencyDetails.payment_status,
                            } as any, {
                              onConflict: 'reservation_id'
                            });

                          if (error) {
                            toast.error('Failed to save agency price');
                          } else {
                            setAgencyPriceSaved(true);
                            setIsEditingAgencyPrice(false);
                            toast.success('Agency price saved');
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Price
                      </Button>
                    ) : null}
                    
                    {/* Show receivable amount after saving */}
                    {agencyDetails.customer_price && agencyPriceSaved && (
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="flex justify-between items-center font-bold">
                          <span>Receivable Amount:</span>
                          <span className="text-blue-600">
                            {getCurrencySymbol(agencyDetails.agency_price_currency)}{parseFloat(agencyDetails.customer_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Payment Status</Label>
                      <Select 
                        value={agencyDetails.payment_status} 
                        onValueChange={(v) => setAgencyDetails({...agencyDetails, payment_status: v})}
                      >
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
                      <Label className="text-sm">Agency Notes</Label>
                      <Textarea
                        value={agencyDetails.agency_notes}
                        onChange={(e) => setAgencyDetails({...agencyDetails, agency_notes: e.target.value})}
                        placeholder="Notes about this agency reservation..."
                        rows={2}
                      />
                    </div>

                    {/* Collect Payment Button */}
                    {agencyDetails.customer_price && agencyDetails.payment_status !== 'paid' && (
                      <Button
                        type="button"
                        onClick={handleCollectPayment}
                        disabled={collectingPayment}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {collectingPayment ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Collecting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Collect Payment ({getCurrencySymbol(agencyDetails.agency_price_currency)}{parseFloat(agencyDetails.customer_price).toFixed(2)})
                          </>
                        )}
                      </Button>
                    )}

                    {agencyDetails.payment_status === 'paid' && (
                      <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-300">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Payment Collected</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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