import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, DollarSign, UserCheck, X, UserPlus, Building2, CheckCircle, Loader2, Link, CreditCard, Banknote, Mail, Car, User, Copy, ChevronDown, MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GooglePlacesAutocomplete, PlaceDetails } from '@/components/ui/google-places-autocomplete';
import GoogleRouteMap from '@/components/ui/google-route-map';
import { AirlineDisplay } from '@/components/ui/airline-display';
import { FlightStatus } from '@/components/ui/flight-status';
import { LocationDisplay } from '@/components/ui/location-display';
import PriceHistoryCard from '@/components/admin/PriceHistoryCard';

// Airports list removed - pickup is now free text
const vehicleTypes = [
  { value: 'mercedes-vito', label: 'Mercedes Vito' },
  { value: 'mercedes-vclass', label: 'Mercedes Vip Vito' },
  { value: 'maybach', label: 'Maybach' },
  { value: 'minibus', label: 'Minibus' },
];
const paymentTypes = [
  { value: 'cash', label: 'Şoföre Nakit' },
  { value: 'payment_link', label: 'Online Ödeme Linki' },
  { value: 'agency_pay', label: 'Acente Ödemesi' },
];

// Status workflow
const statuses = [
  'awaiting-price',
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
  'awaiting-price': 'bg-orange-500/20 text-orange-700',
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
  'awaiting-price': 'Fiyat Bekleniyor',
  'waiting_for_customer_approval': 'Müşteri Onayı Bekleniyor',
  'customer_approved': 'Müşteri Onayladı',
  'customer_rejected': 'Müşteri Reddetti',
  'confirmed': 'Onaylandı',
  'sent_to_driver': 'Şoföre Gönderildi',
  'active': 'Aktif',
  'completed': 'Tamamlandı',
  'pending_admin_review': 'İnceleme Gerekli',
  'cancelled_by_customer': 'Müşteri İptal Etti',
};

// Currency options
const currencies = [
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'GBP', label: '£ GBP', symbol: '£' },
  { value: 'TRY', label: '₺ TRY', symbol: '₺' },
  { value: 'AED', label: 'د.إ AED', symbol: 'د.إ' },
  { value: 'AUD', label: '$ AUD', symbol: '$' },
];

interface Driver {
  id: string;
  name: string;
  user_id: string;
  plate_number: string | null;
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
  const { emailCustomerPriceSet, emailDriverAssigned, emailCustomerDriverAssigned, emailPaymentRequest, emailPaymentConfirmed, emailAgencyApproved, emailAgencyRejected, emailAgencyPriceSet } = useEmailNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingPrice, setSendingPrice] = useState(false);
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [collectingPayment, setCollectingPayment] = useState(false);
  const [sendingPaymentLink, setSendingPaymentLink] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [isEditingAgencyPrice, setIsEditingAgencyPrice] = useState(false);
  const [agencyPriceSaved, setAgencyPriceSaved] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [reservationCode, setReservationCode] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [driverEmail, setDriverEmail] = useState<string | null>(null);
  const [loadingDriverEmail, setLoadingDriverEmail] = useState(false);
  const [agencyDetails, setAgencyDetails] = useState<{
    customer_price: string;
    agency_price_currency: string;
    agency_notes: string;
    payment_status: string;
  }>({ customer_price: '', agency_price_currency: 'USD', agency_notes: '', payment_status: 'not_paid' });
  const [originalData, setOriginalData] = useState<Record<string, unknown> | null>(null);
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);
  const [customerNotes, setCustomerNotes] = useState<string | null>(null);
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
    passenger_cash_amount: '',
    passenger_cash_currency: 'TRY',
    status: '',
    driver_id: '',
    agency_id: '',
    admin_notes: '',
    payment_link: '',
    payment_status: 'pending',
    // Place details
    pickup_place_name: '',
    pickup_lat: null as number | null,
    pickup_lng: null as number | null,
    dropoff_place_name: '',
    dropoff_lat: null as number | null,
    dropoff_lng: null as number | null,
  });

  const getCurrencySymbol = (currency: string) => {
    return currencies.find(c => c.value === currency)?.symbol || currency;
  };

  // Safe number parsing that handles empty strings and NaN
  const safeParseFloat = (value: string | undefined | null): number | null => {
    if (!value || value.trim() === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
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
        supabase.from('drivers').select('id, name, user_id, plate_number').eq('active', true),
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
      setCustomerNotes((r as any).customer_notes || null);
      
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
        passenger_cash_amount: (r as any).passenger_cash_amount?.toString() || '',
        passenger_cash_currency: (r as any).passenger_cash_currency || 'TRY',
        status: r.status || '',
        driver_id: r.driver_id || '',
        agency_id: r.agency_id || '',
        admin_notes: adminNotesResult.data?.notes || '',
        payment_link: r.payment_link || '',
        payment_status: r.payment_status || 'pending',
        // Place details
        pickup_place_name: (r as any).pickup_place_name || '',
        pickup_lat: (r as any).pickup_lat || null,
        pickup_lng: (r as any).pickup_lng || null,
        dropoff_place_name: (r as any).dropoff_place_name || '',
        dropoff_lat: (r as any).dropoff_lat || null,
        dropoff_lng: (r as any).dropoff_lng || null,
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
      
      // Set agency name if agency_id exists
      if (r.agency_id && agenciesResult.data) {
        const agency = agenciesResult.data.find((a: Agency) => a.id === r.agency_id);
        if (agency) {
          setAgencyName(agency.agency_name);
        }
      }
      
      setLoading(false);

      // Fetch driver email if driver is assigned
      if (r.driver_id) {
        fetchDriverEmail(r.driver_id);
      }
    };

    const fetchDriverEmail = async (driverId: string) => {
      setLoadingDriverEmail(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-driver-email', {
          body: { driver_id: driverId }
        });
        if (error) {
          console.error('Failed to fetch driver email:', error);
          setDriverEmail(null);
        } else if (data?.email) {
          setDriverEmail(data.email);
        } else {
          console.warn('No email found for driver:', driverId);
          setDriverEmail(null);
        }
      } catch (e) {
        console.error('Exception fetching driver email:', e);
        setDriverEmail(null);
      } finally {
        setLoadingDriverEmail(false);
      }
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

      // Record price in history
      try {
        await supabase.from('price_history').insert({
          reservation_id: id,
          price: priceValue,
          price_currency: formData.price_currency,
          action: 'sent',
        });
      } catch (e) {
        console.error('Failed to record price history:', e);
      }

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

        // Send email to customer with accept/reject link
        try {
          await emailCustomerPriceSet(id!, priceValue, formData.price_currency);
        } catch (e) {
          console.error('Failed to send customer email:', e);
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

      // Notify customer with driver name and plate only (no phone, no vehicle model)
      if (customerId && selectedDriver) {
        try {
          await supabase.functions.invoke('create-notification', {
            body: {
              user_id: customerId,
              reservation_id: id,
              title: 'Driver Assigned',
              message: `Your driver: ${selectedDriver.name}${selectedDriver.plate_number ? ` (${selectedDriver.plate_number})` : ''}`,
              type: 'driver_assigned'
            }
          });
        } catch (e) {
          console.error('Failed to notify customer:', e);
        }

        // Send confirmation email to customer
        try {
          await supabase.functions.invoke('send-confirmation-email', {
            body: { reservation_id: id }
          });
        } catch (e) {
          console.error('Failed to send confirmation email:', e);
        }

        // Send email to customer with driver name, plate, and WhatsApp support button
        try {
          await emailCustomerDriverAssigned(
            id!,
            selectedDriver.name,
            selectedDriver.plate_number || undefined
          );
          console.log('Customer driver assignment email sent');
        } catch (e) {
          console.error('Failed to send customer driver email:', e);
        }
      }

      // Send email notification to driver
      try {
        console.log('Calling emailDriverAssigned for reservation:', id);

        // Resolve the exact email address that will be used for sending
        let resolvedDriverEmail: string | undefined = undefined;

        if (formData.driver_id) {
          const { data: emailData, error: emailError } = await supabase.functions.invoke('get-driver-email', {
            body: { driver_id: formData.driver_id },
          });

          if (emailError) {
            console.error('Failed to fetch driver email (for email send):', emailError);
          } else if ((emailData as any)?.email) {
            resolvedDriverEmail = (emailData as any).email as string;
            setDriverEmail(resolvedDriverEmail);
          } else {
            console.warn('No driver email found (for email send).', emailData);
          }
        }

        const emailResult = await emailDriverAssigned(id!, resolvedDriverEmail, selectedDriver?.name);
        console.log('Driver email result:', JSON.stringify(emailResult));
        if (!emailResult.success) {
          console.error('Driver email failed:', emailResult.error);
          const errMsg = typeof emailResult.error === 'string'
            ? emailResult.error
            : String((emailResult.error as any)?.message || emailResult.error || 'Bilinmeyen hata');
          toast.error(`Şoför mail gönderilemedi: ${errMsg}`);
        }
      } catch (e) {
        console.error('Failed to send driver email - exception:', e);
        toast.error('Şoför mail hatası');
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

      // Check if record exists first
      const { data: existingDetail } = await supabase
        .from('agency_reservation_details')
        .select('id')
        .eq('reservation_id', id!)
        .maybeSingle();

      let detailsError;
      if (existingDetail) {
        // Update existing record
        const { error } = await supabase
          .from('agency_reservation_details')
          .update({
            customer_price: agencyPrice,
            agency_price_currency: agencyDetails.agency_price_currency,
            company_amount: driverFee,
            agency_notes: agencyDetails.agency_notes || null,
            payment_status: 'paid',
          })
          .eq('reservation_id', id!);
        detailsError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('agency_reservation_details')
          .insert({
            reservation_id: id,
            customer_price: agencyPrice,
            agency_price_currency: agencyDetails.agency_price_currency,
            company_amount: driverFee,
            agency_notes: agencyDetails.agency_notes || null,
            payment_status: 'paid',
          });
        detailsError = error;
      }

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
        price: safeParseFloat(formData.price),
        price_currency: formData.price_currency,
        driver_cash_amount: safeParseFloat(formData.driver_cash_amount),
        passenger_cash_amount: safeParseFloat(formData.passenger_cash_amount),
        passenger_cash_currency: formData.passenger_cash_currency || 'TRY',
        status: formData.status,
        driver_id: formData.driver_id || null,
        agency_id: formData.agency_id && formData.agency_id !== 'none' ? formData.agency_id : null,
        passenger_names: validPassengerNames,
        payment_link: formData.payment_link || null,
        payment_status: formData.payment_status,
        // Place details
        pickup_place_name: formData.pickup_place_name || null,
        pickup_lat: formData.pickup_lat,
        pickup_lng: formData.pickup_lng,
        dropoff_place_name: formData.dropoff_place_name || null,
        dropoff_lat: formData.dropoff_lat,
        dropoff_lng: formData.dropoff_lng,
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

      // Check if record exists first
      const { data: existingAgencyDetail } = await supabase
        .from('agency_reservation_details')
        .select('id')
        .eq('reservation_id', id!)
        .maybeSingle();

      let agencyError;
      if (existingAgencyDetail) {
        // Update existing record
        const { error } = await supabase
          .from('agency_reservation_details')
          .update({
            customer_price: agencyPrice,
            agency_price_currency: agencyDetails.agency_price_currency,
            company_amount: driverFee,
            agency_notes: agencyDetails.agency_notes || null,
            payment_status: agencyDetails.payment_status,
          })
          .eq('reservation_id', id!);
        agencyError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('agency_reservation_details')
          .insert({
            reservation_id: id,
            customer_price: agencyPrice,
            agency_price_currency: agencyDetails.agency_price_currency,
            company_amount: driverFee,
            agency_notes: agencyDetails.agency_notes || null,
            payment_status: agencyDetails.payment_status,
          });
        agencyError = error;
      }

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

    // If this save action effectively sends the job to the driver, also send driver email reliably.
    try {
      const prevStatus = (originalData?.status as string | undefined) || '';
      const prevDriverId = (originalData?.driver_id as string | undefined) || '';
      const newStatus = formData.status;
      const newDriverId = formData.driver_id || '';

      const shouldSendDriverEmail =
        Boolean(id) &&
        newStatus === 'sent_to_driver' &&
        Boolean(newDriverId) &&
        (prevStatus !== 'sent_to_driver' || prevDriverId !== newDriverId);

      if (shouldSendDriverEmail) {
        const selectedDriver = drivers.find(d => d.id === newDriverId);

        // Resolve the exact email address that will be used for sending
        let resolvedDriverEmail: string | undefined = driverEmail || undefined;

        const { data: emailData, error: emailError } = await supabase.functions.invoke('get-driver-email', {
          body: { driver_id: newDriverId },
        });

        if (emailError) {
          console.error('Failed to fetch driver email (for email send):', emailError);
        } else if ((emailData as any)?.email) {
          resolvedDriverEmail = (emailData as any).email as string;
          setDriverEmail(resolvedDriverEmail);
        } else {
          console.warn('No driver email found (for email send).', emailData);
        }

        const emailResult = await emailDriverAssigned(id!, resolvedDriverEmail, selectedDriver?.name);
        if (!emailResult.success) {
          const errMsg = typeof emailResult.error === 'string'
            ? emailResult.error
            : String((emailResult.error as any)?.message || emailResult.error || 'Bilinmeyen hata');
          toast.error(`Şoför mail gönderilemedi: ${errMsg}`);
        }
      }
    } catch (e) {
      console.error('Failed to send driver email (save flow):', e);
      toast.error('Şoför mail hatası');
    }

    // Send agency approval/rejection email if status changed from pending_admin_review
    try {
      const prevStatus = (originalData?.status as string | undefined) || '';
      const prevAgencyId = (originalData?.agency_id as string | undefined) || '';
      const newStatus = formData.status;

      // Check if this is an agency reservation that was pending and status changed
      if (prevStatus === 'pending_admin_review' && prevAgencyId && prevAgencyId !== 'none') {
        // Approved: status changed to confirmed, sent_to_driver, or customer_approved
        const approvedStatuses = ['confirmed', 'sent_to_driver', 'customer_approved'];
        if (approvedStatuses.includes(newStatus)) {
          console.log('Sending agency approval email for reservation:', id);
          await emailAgencyApproved(id!);
        }
        // Rejected: status changed to customer_rejected or cancelled_by_customer
        const rejectedStatuses = ['customer_rejected', 'cancelled_by_customer'];
        if (rejectedStatuses.includes(newStatus)) {
          console.log('Sending agency rejection email for reservation:', id);
          await emailAgencyRejected(id!);
        }
      }
    } catch (e) {
      console.error('Failed to send agency email:', e);
    }

    toast.success('Reservation updated');
    navigate('/admin/reservations');
    setSaving(false);
  };

  const copyReservationDetails = async (lang: string = 'TR') => {
    const validPassengers = passengerNames.filter(n => n.trim());
    const passengerList = validPassengers.length > 0
      ? validPassengers.map((name, index) => `  ${index + 1}. ${name}`).join('\n')
      : '  —';

    const symbol = getCurrencySymbol(formData.price_currency);
    const driverInfo = drivers.find(d => d.id === formData.driver_id);
    const vehicleLabel = vehicleTypes.find(v => v.value === formData.vehicle_type)?.label || formData.vehicle_type;
    
    const labels: Record<string, Record<string, string>> = {
      TR: { reservationCode: 'Rezervasyon Kodu', status: 'Durum', dateTime: 'Tarih & Saat', passengers: 'Yolcular', pickup: 'Alış Noktası', dropoff: 'Bırakış Noktası', flight: 'Uçuş No', vehicle: 'Araç', price: 'Ücret', passengerCash: 'Yolcu Nakit', paymentType: 'Ödeme Tipi', customerPhone: 'Müşteri Telefon', driver: 'Şoför', notes: 'Notlar', copied: 'Rezervasyon detayları kopyalandı.' },
      EN: { reservationCode: 'Reservation Code', status: 'Status', dateTime: 'Date & Time', passengers: 'Passengers', pickup: 'Pick-up Point', dropoff: 'Drop-off Point', flight: 'Flight No', vehicle: 'Vehicle', price: 'Price', passengerCash: 'Passenger Cash', paymentType: 'Payment Type', customerPhone: 'Customer Phone', driver: 'Driver', notes: 'Notes', copied: 'Reservation details copied.' },
      DE: { reservationCode: 'Buchungscode', status: 'Status', dateTime: 'Datum & Uhrzeit', passengers: 'Passagiere', pickup: 'Abholort', dropoff: 'Zielort', flight: 'Flug Nr', vehicle: 'Fahrzeug', price: 'Preis', passengerCash: 'Bargeld Fahrgast', paymentType: 'Zahlungsart', customerPhone: 'Kundentelefon', driver: 'Fahrer', notes: 'Anmerkungen', copied: 'Buchungsdetails kopiert.' },
      FR: { reservationCode: 'Code de réservation', status: 'Statut', dateTime: 'Date & Heure', passengers: 'Passagers', pickup: 'Point de prise en charge', dropoff: 'Point de dépose', flight: 'N° de vol', vehicle: 'Véhicule', price: 'Prix', passengerCash: 'Espèces passager', paymentType: 'Type de paiement', customerPhone: 'Téléphone client', driver: 'Chauffeur', notes: 'Notes', copied: 'Détails de réservation copiés.' },
      RU: { reservationCode: 'Код бронирования', status: 'Статус', dateTime: 'Дата и время', passengers: 'Пассажиры', pickup: 'Место посадки', dropoff: 'Место высадки', flight: 'Номер рейса', vehicle: 'Транспорт', price: 'Цена', passengerCash: 'Наличные пассажира', paymentType: 'Способ оплаты', customerPhone: 'Телефон клиента', driver: 'Водитель', notes: 'Примечания', copied: 'Детали бронирования скопированы.' },
      IT: { reservationCode: 'Codice prenotazione', status: 'Stato', dateTime: 'Data e Ora', passengers: 'Passeggeri', pickup: 'Punto di ritiro', dropoff: 'Punto di consegna', flight: 'N° volo', vehicle: 'Veicolo', price: 'Prezzo', passengerCash: 'Contanti passeggero', paymentType: 'Tipo di pagamento', customerPhone: 'Telefono cliente', driver: 'Autista', notes: 'Note', copied: 'Dettagli prenotazione copiati.' },
      ES: { reservationCode: 'Código de reserva', status: 'Estado', dateTime: 'Fecha y Hora', passengers: 'Pasajeros', pickup: 'Punto de recogida', dropoff: 'Punto de destino', flight: 'N° de vuelo', vehicle: 'Vehículo', price: 'Precio', passengerCash: 'Efectivo pasajero', paymentType: 'Tipo de pago', customerPhone: 'Teléfono cliente', driver: 'Conductor', notes: 'Notas', copied: 'Detalles de reserva copiados.' },
    };
    const l = labels[lang] || labels.TR;
    
    const statusTranslations: Record<string, Record<string, string>> = {
      TR: statusLabels,
      EN: { 'awaiting-price': 'Pending Price', 'waiting_for_customer_approval': 'Waiting Customer Approval', 'customer_approved': 'Customer Approved', 'customer_rejected': 'Customer Rejected', 'confirmed': 'Confirmed', 'sent_to_driver': 'Sent to Driver', 'active': 'Active', 'completed': 'Completed', 'pending_admin_review': 'Pending Review', 'cancelled_by_customer': 'Cancelled by Customer' },
      DE: { 'awaiting-price': 'Preis ausstehend', 'waiting_for_customer_approval': 'Wartet auf Genehmigung', 'customer_approved': 'Kunde genehmigt', 'customer_rejected': 'Kunde abgelehnt', 'confirmed': 'Bestätigt', 'sent_to_driver': 'An Fahrer gesendet', 'active': 'Aktiv', 'completed': 'Abgeschlossen', 'pending_admin_review': 'Überprüfung erforderlich', 'cancelled_by_customer': 'Vom Kunden storniert' },
      FR: { 'awaiting-price': 'Prix en attente', 'waiting_for_customer_approval': 'En attente d\'approbation', 'customer_approved': 'Client approuvé', 'customer_rejected': 'Client refusé', 'confirmed': 'Confirmé', 'sent_to_driver': 'Envoyé au chauffeur', 'active': 'Actif', 'completed': 'Terminé', 'pending_admin_review': 'En attente de révision', 'cancelled_by_customer': 'Annulé par le client' },
      RU: { 'awaiting-price': 'Ожидание цены', 'waiting_for_customer_approval': 'Ожидание одобрения', 'customer_approved': 'Одобрено клиентом', 'customer_rejected': 'Отклонено', 'confirmed': 'Подтверждено', 'sent_to_driver': 'Отправлено водителю', 'active': 'Активно', 'completed': 'Завершено', 'pending_admin_review': 'На рассмотрении', 'cancelled_by_customer': 'Отменено клиентом' },
      IT: { 'awaiting-price': 'Prezzo in attesa', 'waiting_for_customer_approval': 'In attesa di approvazione', 'customer_approved': 'Cliente approvato', 'customer_rejected': 'Cliente rifiutato', 'confirmed': 'Confermato', 'sent_to_driver': 'Inviato all\'autista', 'active': 'Attivo', 'completed': 'Completato', 'pending_admin_review': 'In revisione', 'cancelled_by_customer': 'Annullato dal cliente' },
      ES: { 'awaiting-price': 'Precio pendiente', 'waiting_for_customer_approval': 'Esperando aprobación', 'customer_approved': 'Cliente aprobado', 'customer_rejected': 'Cliente rechazado', 'confirmed': 'Confirmado', 'sent_to_driver': 'Enviado al conductor', 'active': 'Activo', 'completed': 'Completado', 'pending_admin_review': 'En revisión', 'cancelled_by_customer': 'Cancelado por cliente' },
    };
    const statusLabel = (statusTranslations[lang] || statusTranslations.TR)[formData.status] || formData.status;

    const paymentTranslations: Record<string, Record<string, string>> = {
      TR: { cash: 'Şoföre Nakit', payment_link: 'Online Ödeme Linki', agency_pay: 'Acente Ödemesi' },
      EN: { cash: 'Cash to Driver', payment_link: 'Online Payment Link', agency_pay: 'Agency Payment' },
      DE: { cash: 'Bargeld an Fahrer', payment_link: 'Online-Zahlungslink', agency_pay: 'Agenturzahlung' },
      FR: { cash: 'Espèces au chauffeur', payment_link: 'Lien de paiement', agency_pay: 'Paiement agence' },
      RU: { cash: 'Наличные водителю', payment_link: 'Онлайн-оплата', agency_pay: 'Оплата агентства' },
      IT: { cash: 'Contanti all\'autista', payment_link: 'Link di pagamento', agency_pay: 'Pagamento agenzia' },
      ES: { cash: 'Efectivo al conductor', payment_link: 'Enlace de pago', agency_pay: 'Pago de agencia' },
    };
    const paymentLabel = (paymentTranslations[lang] || paymentTranslations.TR)[formData.payment_type] || formData.payment_type;

    // Format pickup location with place name + address
    const pickupFormatted = formData.pickup_place_name && formData.pickup_place_name !== formData.pickup
      ? `${formData.pickup_place_name}\n${formData.pickup}`
      : formData.pickup || '—';
    
    // Format dropoff location with place name + address
    const dropoffFormatted = formData.dropoff_place_name && formData.dropoff_place_name !== formData.dropoff
      ? `${formData.dropoff_place_name}\n${formData.dropoff}`
      : formData.dropoff || '—';

    const text = `---------------------------------
${l.reservationCode}: ${reservationCode || id?.slice(0, 8) || '—'}
${l.status}: ${statusLabel}
${l.dateTime}: ${formData.pickup_date} – ${formData.pickup_time}

${l.passengers}:
${passengerList}

${l.pickup}:
${pickupFormatted}

${l.dropoff}:
${dropoffFormatted}

${formData.flight_number ? `${l.flight}: ${formData.flight_number}\n` : ''}${l.vehicle}: ${vehicleLabel}
${l.price}: ${formData.price ? `${symbol}${formData.price}` : '—'}
${formData.passenger_cash_amount ? `${l.passengerCash}: ${getCurrencySymbol(formData.passenger_cash_currency)}${formData.passenger_cash_amount}\n` : ''}${l.paymentType}: ${paymentLabel}

${l.customerPhone}: ${formData.customer_phone || '—'}
${driverInfo ? `${l.driver}: ${driverInfo.name} (${driverInfo.plate_number || '—'})\n` : ''}${l.notes}: ${formData.admin_notes || '—'}
---------------------------------`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success(l.copied);
    } catch (err) {
      toast.error('Kopyalama başarısız oldu.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Yükleniyor...</p>
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
          <h1 className="text-2xl font-serif">Rezervasyon Düzenle</h1>
        </div>
        <Badge className={`ml-auto ${statusColors[formData.status] || 'bg-muted'}`}>
          {statusLabels[formData.status] || formData.status}
        </Badge>
      </header>

      {/* Agency Request Banner */}
      {agencyName && (
        <div className="bg-amber-500/20 border-l-4 border-amber-500 px-6 py-3 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-amber-700" />
          <div>
            <span className="font-semibold text-amber-800">Acenta İsteği</span>
            <span className="text-amber-700 ml-2">({agencyName})</span>
          </div>
        </div>
      )}

      <main className="container mx-auto py-8 px-4 max-w-2xl space-y-6">
        {/* Price Entry Card for awaiting-price status */}
        {formData.status === 'awaiting-price' && (
          <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <DollarSign className="h-5 w-5" />
                Müşteri İçin Fiyat Belirle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Bu rezervasyon fiyat bekliyor. Fiyatı girin, para birimini seçin ve onay için müşteriye gönderin.
              </p>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Bütçe</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="Fiyat girin"
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
                {sendingPrice ? 'Gönderiliyor...' : 'Fiyatı Müşteriye Gönder'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Agency Request Review Card - Set Price and Send for Agency Approval */}
        {formData.status === 'pending_admin_review' && formData.agency_id && formData.agency_id !== 'none' && (
          <Card className="border-purple-300 bg-purple-50 dark:bg-purple-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Building2 className="h-5 w-5" />
                Acenta Rezervasyon Talebi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {agencyName || 'Acenta'} tarafından bir rezervasyon talebi gönderildi. Fiyat belirleyip acentanın onayına gönderin veya talebi reddedin.
              </p>
              
              {/* Price Input for Agency */}
              <div className="grid grid-cols-2 gap-4 bg-white dark:bg-background p-4 rounded-lg border">
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
                      placeholder="Fiyat girin"
                      className="text-lg pl-8"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={async () => {
                    if (!formData.price || parseFloat(formData.price) <= 0) {
                      toast.error('Lütfen geçerli bir fiyat girin');
                      return;
                    }
                    
                    setSaving(true);
                    try {
                      const priceValue = parseFloat(formData.price);
                      
                      // Set price and change status to waiting_for_agency_approval
                      const { error } = await supabase
                        .from('reservations')
                        .update({ 
                          price: priceValue,
                          price_currency: formData.price_currency,
                          admin_set_price: priceValue,
                          status: 'waiting_for_agency_approval' 
                        })
                        .eq('id', id);
                      if (error) throw error;

                      // Record price in history
                      try {
                        await supabase.from('price_history').insert({
                          reservation_id: id,
                          price: priceValue,
                          price_currency: formData.price_currency,
                          action: 'sent_to_agency',
                        });
                      } catch (e) {
                        console.error('Failed to record price history:', e);
                      }

                      // Send email to agency
                      try {
                        console.log('Sending agency price set email for reservation:', id);
                        const emailResult = await emailAgencyPriceSet(id!, priceValue, formData.price_currency);
                        if (!emailResult.success) {
                          console.error('Agency price email failed:', emailResult.error);
                        } else {
                          console.log('Agency price email sent successfully');
                        }
                      } catch (e) {
                        console.error('Failed to send agency price email:', e);
                      }

                      // Notify agency user in-app
                      const { data: agencyData } = await supabase
                        .from('agencies')
                        .select('user_id')
                        .eq('id', formData.agency_id)
                        .maybeSingle();
                      
                      if (agencyData?.user_id) {
                        try {
                          await supabase.functions.invoke('create-notification', {
                            body: {
                              user_id: agencyData.user_id,
                              reservation_id: id,
                              title: 'Fiyat Belirlendi',
                              message: `Rezervasyon için fiyat belirlendi: ${currencySymbol}${priceValue}. Lütfen onaylayın veya reddedin.`,
                              type: 'price_ready'
                            }
                          });
                        } catch (e) {
                          console.error('Failed to notify agency:', e);
                        }
                      }

                      toast.success('Fiyat acentaya gönderildi!');
                      setFormData({ ...formData, status: 'waiting_for_agency_approval' });
                    } catch (error: any) {
                      toast.error(error.message || 'Fiyat gönderilemedi');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || !formData.price}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Fiyatı Acentaya Gönder
                </Button>
                <Button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      // Reject agency request
                      const { error } = await supabase
                        .from('reservations')
                        .update({ status: 'customer_rejected' })
                        .eq('id', id);
                      if (error) throw error;

                      // Send rejection email to agency
                      try {
                        console.log('Sending agency rejection email for reservation:', id);
                        const emailResult = await emailAgencyRejected(id!);
                        if (!emailResult.success) {
                          console.error('Agency rejection email failed:', emailResult.error);
                          toast.error('Red emaili gönderilemedi');
                        } else {
                          console.log('Agency rejection email sent successfully');
                        }
                      } catch (e) {
                        console.error('Failed to send agency rejection email:', e);
                      }

                      toast.success('Acenta talebi reddedildi');
                      navigate('/admin/reservations');
                    } catch (error: any) {
                      toast.error(error.message || 'Talep reddedilemedi');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reddet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Edit Review Card - Only show for non-agency reservations */}
        {formData.status === 'pending_admin_review' && (!formData.agency_id || formData.agency_id === 'none') && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <UserCheck className="h-5 w-5" />
                Müşteri Bu Rezervasyonu Güncelledi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Müşteri bu rezervasyonu değiştirdi. Lütfen aşağıdaki değişiklikleri inceleyin ve onaylayın veya reddedin.
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

                      toast.success('Değişiklikler onaylandı!');
                      setFormData({ ...formData, status: newStatus });
                    } catch (error: any) {
                      toast.error(error.message || 'Değişiklikler onaylanamadı');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Değişiklikleri Onayla
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

                        toast.success('Değişiklikler reddedildi, orijinal detaylar geri yüklendi');
                        navigate('/admin/reservations');
                      }
                    } catch (error: any) {
                      toast.error(error.message || 'Değişiklikler reddedilemedi');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                >
                  Değişiklikleri Reddet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price History Card */}
        <PriceHistoryCard reservationId={id} />

        {/* Customer Rejected Price Card - Admin can send new price */}
        {formData.status === 'customer_rejected' && (
          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <X className="h-5 w-5" />
                Müşteri Fiyatı Reddetti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-destructive/80">
                Müşteri önceki fiyat teklifini kabul etmedi. Yeni bir fiyat belirleyip tekrar gönderebilirsiniz.
              </p>
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Label>Yeni Fiyat</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="Yeni fiyat girin"
                        className="text-lg pl-8"
                      />
                    </div>
                  </div>
                  <div className="w-24">
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
              </div>
              <Button 
                onClick={handleSendPriceToCustomer} 
                disabled={sendingPrice || !formData.price}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingPrice ? 'Gönderiliyor...' : 'Yeni Fiyatı Müşteriye Gönder'}
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
                Şoför Ata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {formData.status === 'confirmed' 
                  ? 'Bu rezervasyon onaylandı. Bu işi atamak için bir şoför seçin.'
                  : `Müşteri fiyatı onayladı (${currencySymbol}${formData.price}). Bu işi atamak için bir şoför seçin.`
                }
              </p>
              <div className="space-y-2">
                <Label>Şoför Seçin</Label>
                <Select value={formData.driver_id} onValueChange={(v) => setFormData({...formData, driver_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Şoför seçin" />
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
                {assigningDriver ? 'Atanıyor...' : 'Şoföre Ata'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Assigned Driver Info Card - Show when driver is assigned */}
        {formData.driver_id && (formData.status === 'sent_to_driver' || formData.status === 'active' || formData.status === 'completed') && (
          <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <UserCheck className="h-5 w-5" />
                Atanan Şoför Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const assignedDriver = drivers.find(d => d.id === formData.driver_id);
                return (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Şoför Adı</p>
                        <p className="font-semibold">{assignedDriver?.name || 'Bilinmiyor'}</p>
                      </div>
                    </div>
                    
                    {assignedDriver?.plate_number && (
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <Car className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Plaka</p>
                          <p className="font-semibold">{assignedDriver.plate_number}</p>
                        </div>
                      </div>
                    )}

                    {formData.price && (
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Bütçe</p>
                          <p className="font-semibold text-green-600">{getCurrencySymbol(formData.price_currency)}{formData.price}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">E-posta (mail gönderiminde kullanılan)</p>
                        {loadingDriverEmail ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Yükleniyor...</span>
                          </div>
                        ) : driverEmail ? (
                          <p className="font-semibold text-green-600">{driverEmail}</p>
                        ) : (
                          <p className="text-destructive font-semibold">E-posta bulunamadı!</p>
                        )}
                      </div>
                      {!loadingDriverEmail && !driverEmail && (
                        <Badge variant="destructive" className="text-xs">
                          Mail gönderilemez
                        </Badge>
                      )}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Payment Management Card - Show for online payment type */}
        {formData.payment_type === 'payment_link' && formData.price && parseFloat(formData.price) > 0 && (
          <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <CreditCard className="h-5 w-5" />
                Online Ödeme Yönetimi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Ödeme Durumu:</span>
                {formData.payment_status === 'paid' ? (
                  <Badge className="bg-green-500/20 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ödendi
                  </Badge>
                ) : (
                  <Badge className="bg-orange-500/20 text-orange-700">
                    Bekliyor
                  </Badge>
                )}
              </div>

              {/* Payment Link Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Ödeme Linki (URL)
                </Label>
                <Input
                  type="url"
                  value={formData.payment_link}
                  onChange={(e) => setFormData({...formData, payment_link: e.target.value})}
                  placeholder="https://pay.stripe.com/... veya başka bir ödeme linki"
                  disabled={formData.payment_status === 'paid'}
                />
                <p className="text-xs text-muted-foreground">
                  Stripe, Wise, banka linki veya başka bir ödeme sağlayıcısından URL girin
                </p>
              </div>

              {/* Send Payment Request Button */}
              {formData.payment_status !== 'paid' && (
                <Button
                  type="button"
                  onClick={async () => {
                    if (!formData.payment_link) {
                      toast.error('Lütfen önce bir ödeme linki girin');
                      return;
                    }
                    if (!formData.price || parseFloat(formData.price) <= 0) {
                      toast.error('Lütfen önce fiyatı belirleyin');
                      return;
                    }

                    setSendingPaymentLink(true);
                    try {
                      // First save the payment link to reservation
                      const { error: saveError } = await supabase
                        .from('reservations')
                        .update({
                          payment_link: formData.payment_link,
                          status: 'waiting_for_customer_approval',
                        })
                        .eq('id', id);

                      if (saveError) throw saveError;

                      // Send payment request email to customer
                      await emailPaymentRequest(id!, formData.payment_link);

                      // Notify customer in-app
                      if (customerId) {
                        await supabase.functions.invoke('create-notification', {
                          body: {
                            user_id: customerId,
                            reservation_id: id,
                            title: 'Payment Required',
                            message: `Please complete your payment of ${currencySymbol}${formData.price} using the provided link.`,
                            type: 'payment_request'
                          }
                        });
                      }

                      toast.success('Ödeme linki müşteriye e-posta ile gönderildi!');
                      setFormData({ ...formData, status: 'waiting_for_customer_approval' });
                    } catch (error: any) {
                      toast.error(error.message || 'Ödeme linki gönderilemedi');
                    } finally {
                      setSendingPaymentLink(false);
                    }
                  }}
                  disabled={sendingPaymentLink || !formData.payment_link}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingPaymentLink ? 'Gönderiliyor...' : 'Fiyat ve Ödeme Linkini Müşteriye Gönder'}
                </Button>
              )}

              {/* Mark as Paid Button */}
              {formData.payment_status !== 'paid' && (
                <Button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Ödemenin alındığını onaylıyor musunuz?')) return;

                    setConfirmingPayment(true);
                    try {
                      // Update payment status
                      const { error: updateError } = await supabase
                        .from('reservations')
                        .update({
                          payment_status: 'paid',
                          status: 'customer_approved',
                        })
                        .eq('id', id);

                      if (updateError) throw updateError;

                      // Send payment confirmation email to customer
                      await emailPaymentConfirmed(id!);

                      // Notify customer in-app
                      if (customerId) {
                        await supabase.functions.invoke('create-notification', {
                          body: {
                            user_id: customerId,
                            reservation_id: id,
                            title: '✅ Payment Confirmed',
                            message: `Your payment of ${currencySymbol}${formData.price} has been received. Your booking is confirmed!`,
                            type: 'payment_confirmed'
                          }
                        });
                      }

                      toast.success('Ödeme onaylandı ve müşteriye bilgi e-postası gönderildi!');
                      setFormData({ ...formData, payment_status: 'paid', status: 'customer_approved' });
                    } catch (error: any) {
                      toast.error(error.message || 'Ödeme onaylanamadı');
                    } finally {
                      setConfirmingPayment(false);
                    }
                  }}
                  disabled={confirmingPayment}
                  variant="outline"
                  className="w-full border-green-500 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {confirmingPayment ? 'Onaylanıyor...' : 'Ödeme Alındı Olarak İşaretle'}
                </Button>
              )}

              {/* Payment Confirmed Message */}
              {formData.payment_status === 'paid' && (
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-700 dark:text-green-300">Ödeme Alındı!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {currencySymbol}{formData.price} tutarındaki ödeme onaylandı
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cash Payment Info Card */}
        {formData.payment_type === 'cash' && formData.price && parseFloat(formData.price) > 0 && (
          <Card className="border-green-300 bg-green-50 dark:bg-green-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Banknote className="h-5 w-5" />
                Nakit Ödeme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Banknote className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Müşteri şoföre nakit ödeyecek
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Tutar: {currencySymbol}{formData.price}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Passenger Names Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Yolcular ({passengerNames.length}/{MAX_PASSENGERS})</Label>
                  {passengerNames.length < MAX_PASSENGERS && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPassenger}
                      className="gap-1"
                    >
                      <UserPlus className="h-4 w-4" />
                      Yolcu Ekle
                    </Button>
                  )}
                </div>
                
                {passengerNames.map((name, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {index === 0 ? 'Ana Yolcu' : `Yolcu ${index + 1}`}
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => updatePassenger(index, e.target.value)}
                        placeholder={index === 0 ? 'Ana yolcu adı' : `Yolcu ${index + 1} adı`}
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
                <Label>Müşteri Telefonu</Label>
                <Input
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alış Noktası</Label>
                  {formData.pickup_place_name && (
                    <div className="mb-2 p-2 bg-muted/50 rounded-lg">
                      <LocationDisplay
                        placeName={formData.pickup_place_name}
                        address={formData.pickup}
                        type="pickup"
                        size="sm"
                        showAddress={true}
                      />
                    </div>
                  )}
                  <GooglePlacesAutocomplete
                    initialValue={formData.pickup}
                    onPlaceSelected={(value, details) => setFormData((prev) => ({ 
                      ...prev, 
                      pickup: value,
                      pickup_place_name: details?.placeName || '',
                      pickup_lat: details?.lat || null,
                      pickup_lng: details?.lng || null,
                    }))}
                    placeholder="Alış noktasını girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bırakış Noktası</Label>
                  {formData.dropoff_place_name && (
                    <div className="mb-2 p-2 bg-muted/50 rounded-lg">
                      <LocationDisplay
                        placeName={formData.dropoff_place_name}
                        address={formData.dropoff}
                        type="dropoff"
                        size="sm"
                        showAddress={true}
                      />
                    </div>
                  )}
                  <GooglePlacesAutocomplete
                    initialValue={formData.dropoff}
                    onPlaceSelected={(value, details) => setFormData((prev) => ({ 
                      ...prev, 
                      dropoff: value,
                      dropoff_place_name: details?.placeName || '',
                      dropoff_lat: details?.lat || null,
                      dropoff_lng: details?.lng || null,
                    }))}
                    placeholder="Bırakış noktasını girin"
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    value={formData.pickup_date}
                    onChange={(e) => setFormData({...formData, pickup_date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saat {formData.flight_number && formData.flight_number.length >= 3 && <span className="text-xs text-amber-600 font-normal">(Uçuş varış saatinden otomatik)</span>}</Label>
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
                  <Label>Uçuş</Label>
                  <Input
                    value={formData.flight_number}
                    onChange={(e) => setFormData({...formData, flight_number: e.target.value})}
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
                  reservationId={id}
                  onArrivalTimeChange={(time) => setFormData(prev => ({ ...prev, pickup_time: time }))}
                  refreshIntervalMs={5 * 60 * 1000}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Araç</Label>
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
                <div className="space-y-2">
                  <Label>Ödeme</Label>
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
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                <div className="space-y-2">
                  <Label>Bütçe</Label>
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
                  <Label>Şoför Nakiti</Label>
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

              {/* Yolcudan Alınacak Nakit - New dedicated field */}
              <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <Label className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Yolcudan Alınacak Nakit Tutar
                </Label>
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
                <p className="text-xs text-amber-600 dark:text-amber-400">Bu tutar sadece bilgi amaçlıdır, hesaplamalara dahil edilmez.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durum</Label>
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
                  <Label>Şoför</Label>
                  <Select value={formData.driver_id} onValueChange={(v) => setFormData({...formData, driver_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Şoför seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Agency Selection - Always visible */}
              <div className="space-y-2">
                <Label>Acenta</Label>
                <Select value={formData.agency_id || 'none'} onValueChange={(v) => setFormData({...formData, agency_id: v === 'none' ? '' : v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Acenta seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Acenta Yok</SelectItem>
                    {agencies.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.agency_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agency Pricing Section - Show when agency is selected */}
              {formData.agency_id && formData.agency_id !== 'none' && (
                <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-base">
                      <Building2 className="h-4 w-4" />
                      Acenta Fiyatı
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Acentadan Alınacak Tutar</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getCurrencySymbol(agencyDetails.agency_price_currency || formData.price_currency)}</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={agencyDetails.customer_price}
                            onChange={(e) => setAgencyDetails({...agencyDetails, customer_price: e.target.value})}
                            placeholder="0.00"
                            className="pl-8"
                          />
                        </div>
                        <Select 
                          value={agencyDetails.agency_price_currency || formData.price_currency} 
                          onValueChange={(v) => setAgencyDetails({...agencyDetails, agency_price_currency: v})}
                        >
                          <SelectTrigger className="w-28">
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

                    <Button
                      type="button"
                      onClick={async () => {
                        const agencyPriceValue = (agencyDetails.customer_price || '').toString().trim();
                        const agencyPrice = parseFloat(agencyPriceValue) || 0;
                        if (agencyPrice <= 0) {
                          toast.error('Lütfen geçerli bir acenta fiyatı girin');
                          return;
                        }
                        const driverFee = parseFloat(formData.price) || 0;
                        const profit = agencyPrice - driverFee;

                        try {
                          const { data: existingRecord } = await supabase
                            .from('agency_reservation_details')
                            .select('id')
                            .eq('reservation_id', id)
                            .maybeSingle();

                          let error;
                          if (existingRecord) {
                          const result = await supabase
                              .from('agency_reservation_details')
                              .update({
                                customer_price: agencyPrice,
                                agency_price_currency: agencyDetails.agency_price_currency || formData.price_currency,
                                company_amount: driverFee,
                                agency_profit: profit,
                              })
                              .eq('reservation_id', id);
                            error = result.error;
                          } else {
                            const result = await supabase
                              .from('agency_reservation_details')
                              .insert({
                                reservation_id: id,
                                customer_price: agencyPrice,
                                agency_price_currency: agencyDetails.agency_price_currency || formData.price_currency,
                                company_amount: driverFee,
                                agency_profit: profit,
                              });
                            error = result.error;
                          }

                          if (error) {
                            console.error('Agency price save error:', error);
                            toast.error(error.message || 'Acenta fiyatı kaydedilemedi');
                          } else {
                            setAgencyDetails({
                              ...agencyDetails,
                              customer_price: agencyPrice.toString(),
                              agency_price_currency: agencyDetails.agency_price_currency || formData.price_currency
                            });
                            setAgencyPriceSaved(true);
                            toast.success('Acenta fiyatı kaydedildi');
                          }
                        } catch (err: any) {
                          console.error('Agency price save exception:', err);
                          toast.error(err.message || 'Acenta fiyatı kaydedilemedi');
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Acenta Fiyatını Kaydet
                    </Button>
                    
                    {agencyDetails.customer_price && agencyPriceSaved && (
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="flex justify-between items-center font-bold">
                          <span>Kaydedilen Tutar:</span>
                          <span className="text-blue-600">
                            {getCurrencySymbol(agencyDetails.agency_price_currency || formData.price_currency)}{parseFloat(agencyDetails.customer_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Customer Notes - Read Only */}
              {customerNotes && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Müşteri Notları
                  </Label>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                    {customerNotes}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Admin Notları</Label>
                <Textarea
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                  placeholder="Dahili notlar (müşteri veya şoför tarafından görülemez)"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="flex-shrink-0">
                      <Copy className="h-4 w-4 mr-2" />
                      Kopyala
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-background">
                    <DropdownMenuItem onClick={() => copyReservationDetails('TR')}>🇹🇷 Türkçe</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyReservationDetails('EN')}>🇬🇧 English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyReservationDetails('DE')}>🇩🇪 Deutsch</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyReservationDetails('FR')}>🇫🇷 Français</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyReservationDetails('RU')}>🇷🇺 Русский</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyReservationDetails('IT')}>🇮🇹 Italiano</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyReservationDetails('ES')}>🇪🇸 Español</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button type="submit" className="flex-1" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminEditReservation;