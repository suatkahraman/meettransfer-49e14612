import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Building2, Calendar, MapPin, Car, User, DollarSign, Clock, Plane, Users, Plus, CreditCard, TrendingUp, Banknote, Receipt, History, Pencil, Trash2 } from 'lucide-react';
import { MonthNavigator } from '@/components/accounting/MonthNavigator';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { getCurrencySymbol, CURRENCY_OPTIONS } from '@/lib/currency';
interface Agency {
  id: string;
  agency_name: string;
  comments: string | null;
  balance: number | null;
  currency: string;
}

interface Driver {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  reservation_code: string | null;
  pickup_date: string;
  pickup_time: string;
  pickup: string;
  dropoff: string;
  price: number | null;
  price_currency: string | null;
  driver_cash_amount: number | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  status: string;
  customer_name: string;
  driver_id: string | null;
  vehicle_type: string;
  passenger_names: string[] | null;
  flight_number: string | null;
  driver_notes: string | null;
}

interface AgencyPayment {
  id: string;
  agency_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
  currency?: string;
}

interface AgencyReservationDetail {
  reservation_id: string;
  customer_price: number | null;
  company_amount: number | null;
  agency_price_currency: string | null;
}

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-orange-500/20 text-orange-700',
  'waiting_for_customer_approval': 'bg-purple-500/20 text-purple-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'customer_rejected': 'bg-destructive/20 text-destructive',
  'confirmed': 'bg-emerald-500/20 text-emerald-700',
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
  'cancelled': 'bg-destructive/20 text-destructive',
  'cancelled_by_customer': 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, string> = {
  'awaiting-price': 'Fiyat Bekliyor',
  'waiting_for_customer_approval': 'Onay Bekliyor',
  'customer_approved': 'Onaylandı',
  'customer_rejected': 'Reddedildi',
  'confirmed': 'Onaylandı',
  'sent_to_driver': 'Şoföre Gönderildi',
  'active': 'Aktif',
  'completed': 'Tamamlandı',
  'cancelled': 'İptal',
  'cancelled_by_customer': 'Müşteri İptal Etti',
};

// Using centralized currency utilities from @/lib/currency

const AdminAgencyAccounting = () => {
  const navigate = useNavigate();
  const { agencyId } = useParams();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agencyDetails, setAgencyDetails] = useState<AgencyReservationDetail[]>([]);
  const [payments, setPayments] = useState<AgencyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('TRY');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  
  // Payment history dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  // Edit payment state
  const [editingPayment, setEditingPayment] = useState<AgencyPayment | null>(null);
  
  // Delete confirmation state
  const [deletingPayment, setDeletingPayment] = useState<AgencyPayment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all agencies and drivers
  useEffect(() => {
    const fetchBaseData = async () => {
      const [agenciesRes, driversRes] = await Promise.all([
        supabase.from('agencies').select('id, agency_name, comments, balance, currency').order('agency_name'),
        supabase.from('drivers').select('id, name'),
      ]);
      setAllAgencies(agenciesRes.data || []);
      setDrivers(driversRes.data || []);
    };
    fetchBaseData();
  }, []);

  // Fetch current agency
  useEffect(() => {
    if (agencyId && allAgencies.length > 0) {
      const found = allAgencies.find(a => a.id === agencyId);
      setAgency(found || null);
    }
  }, [agencyId, allAgencies]);

  // State for carryover balance from previous months - now currency-based
  const [carryoverBalances, setCarryoverBalances] = useState<Record<string, number>>({});
  const [carryoverPayments, setCarryoverPayments] = useState<Record<string, number>>({});
  
  // TRY conversion states
  const [tryConvertedBalances, setTryConvertedBalances] = useState<Record<string, { amount: number; rate: number }>>({});
  const [loadingConversion, setLoadingConversion] = useState(false);

  // Get agency's default currency
  const agencyCurrency = agency?.currency || 'EUR';

  // Fetch reservations, agency details, and payments
  const fetchData = async () => {
    if (!agencyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    let query = supabase
      .from('reservations')
      .select('*')
      .eq('agency_id', agencyId)
      .gte('pickup_date', monthStart)
      .lte('pickup_date', monthEnd)
      .order('pickup_date', { ascending: true })
      .order('pickup_time', { ascending: true });

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus);
    }

    // Fetch current month data + all payments + previous months completed reservations for carryover
    const [reservationsRes, allPaymentsRes, prevMonthsReservationsRes] = await Promise.all([
      query,
      supabase
        .from('agency_payments')
        .select('*')
        .eq('agency_id', agencyId)
        .order('payment_date', { ascending: false }),
      // Fetch all completed reservations before this month for carryover calculation
      supabase
        .from('reservations')
        .select('id, price, price_currency, passenger_cash_amount, passenger_cash_currency, status, pickup_date')
        .eq('agency_id', agencyId)
        .eq('status', 'completed')
        .lt('pickup_date', monthStart),
    ]);

    const reservationsData = reservationsRes.data || [];
    const allPayments = allPaymentsRes.data || [];
    const prevMonthsReservations = prevMonthsReservationsRes.data || [];

    setReservations(reservationsData);
    setPayments(allPayments);

    // Fetch agency reservation details for current month
    let currentMonthDetails: AgencyReservationDetail[] = [];
    if (reservationsData.length > 0) {
      const reservationIds = reservationsData.map(r => r.id);
      const { data: detailsData } = await supabase
        .from('agency_reservation_details')
        .select('reservation_id, customer_price, company_amount, agency_price_currency')
        .in('reservation_id', reservationIds);
      currentMonthDetails = detailsData || [];
      setAgencyDetails(currentMonthDetails);
    } else {
      setAgencyDetails([]);
    }

    // Fetch agency reservation details for previous months completed reservations
    // PARA BİRİMİ BAZLI hesaplama
    const prevMonthsCarryoverDebts: Record<string, number> = {};
    if (prevMonthsReservations.length > 0) {
      const prevReservationIds = prevMonthsReservations.map(r => r.id);
      const { data: prevDetailsData } = await supabase
        .from('agency_reservation_details')
        .select('reservation_id, customer_price, company_amount, agency_price_currency')
        .in('reservation_id', prevReservationIds);
      
      const prevDetails = prevDetailsData || [];
      
      // Calculate debt by currency from previous months completed reservations
      prevMonthsReservations.forEach(r => {
        const detail = prevDetails.find(d => d.reservation_id === r.id);
        const currency = detail?.agency_price_currency || 'TRY';
        const agencyPrice = detail?.customer_price || r.price || 0;
        
        if (!prevMonthsCarryoverDebts[currency]) {
          prevMonthsCarryoverDebts[currency] = 0;
        }
        prevMonthsCarryoverDebts[currency] += agencyPrice;
      });
      
      // Subtract passenger cash by their currency
      prevMonthsReservations.forEach(r => {
        const passengerCash = r.passenger_cash_amount || 0;
        const cashCurrency = r.passenger_cash_currency || 'TRY';
        if (passengerCash > 0) {
          if (!prevMonthsCarryoverDebts[cashCurrency]) {
            prevMonthsCarryoverDebts[cashCurrency] = 0;
          }
          prevMonthsCarryoverDebts[cashCurrency] -= passengerCash;
        }
      });
    }

    // Calculate payments by currency made in months before the current selected month
    const prevMonthsPaymentsByCurrency: Record<string, number> = {};
    allPayments
      .filter(p => p.payment_date < monthStart)
      .forEach(p => {
        const currency = p.currency || 'TRY';
        if (!prevMonthsPaymentsByCurrency[currency]) {
          prevMonthsPaymentsByCurrency[currency] = 0;
        }
        prevMonthsPaymentsByCurrency[currency] += p.amount;
      });

    // Calculate carryover balance by currency = debt - payments
    const carryoverByCurrency: Record<string, number> = {};
    const allCurrencies = new Set([...Object.keys(prevMonthsCarryoverDebts), ...Object.keys(prevMonthsPaymentsByCurrency)]);
    allCurrencies.forEach(currency => {
      const debt = prevMonthsCarryoverDebts[currency] || 0;
      const payments = prevMonthsPaymentsByCurrency[currency] || 0;
      const balance = debt - payments;
      if (balance !== 0) {
        carryoverByCurrency[currency] = balance;
      }
    });

    setCarryoverBalances(carryoverByCurrency);
    setCarryoverPayments(prevMonthsPaymentsByCurrency);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Real-time subscriptions
    const reservationsChannel = supabase
      .channel('agency-reservations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchData();
      })
      .subscribe();

    const paymentsChannel = supabase
      .channel('agency-payments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agency_payments' }, () => {
        fetchData();
      })
      .subscribe();

    const detailsChannel = supabase
      .channel('agency-details-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agency_reservation_details' }, () => {
        fetchData();
      })
      .subscribe();

    const agenciesChannel = supabase
      .channel('agencies-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agencies' }, async () => {
        const { data } = await supabase.from('agencies').select('*').order('agency_name');
        setAllAgencies(data || []);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(detailsChannel);
      supabase.removeChannel(agenciesChannel);
    };
  }, [agencyId, currentMonth, selectedStatus]);

  // Fetch exchange rates and convert foreign currency balances to TRY
  useEffect(() => {
    const convertToTRY = async () => {
      const foreignCurrencies = Object.entries(carryoverBalances)
        .filter(([currency, _]) => currency !== 'TRY')
        .concat(
          currencyBalances
            .filter(cb => cb.currency !== 'TRY' && cb.netDebt !== 0)
            .map(cb => [cb.currency, cb.netDebt] as [string, number])
        );

      if (foreignCurrencies.length === 0) {
        setTryConvertedBalances({});
        return;
      }

      setLoadingConversion(true);
      const conversions: Record<string, { amount: number; rate: number }> = {};

      for (const [currency, amount] of foreignCurrencies) {
        if (amount === 0) continue;
        try {
          const response = await fetch(
            `https://api.frankfurter.app/latest?from=${currency}&to=TRY`,
            { signal: AbortSignal.timeout(3000) }
          );
          if (response.ok) {
            const data = await response.json();
            const rate = data.rates?.TRY;
            if (rate) {
              conversions[currency] = { amount: Math.round(amount * rate), rate };
            }
          }
        } catch (e) {
          // Use fallback rates
          const fallbackRates: Record<string, number> = {
            'EUR': 37.5, 'USD': 34.5, 'GBP': 44.1, 'AED': 9.4, 'AUD': 22.5
          };
          const rate = fallbackRates[currency] || 1;
          conversions[currency] = { amount: Math.round(amount * rate), rate };
        }
      }

      setTryConvertedBalances(conversions);
      setLoadingConversion(false);
    };

    convertToTRY();
  }, [carryoverBalances, reservations.length]);

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return 'Atanmadı';
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || 'Bilinmiyor';
  };

  // Use centralized getCurrencySymbol - no local redefinition needed

  const getAgencyPrice = (reservationId: string) => {
    const detail = agencyDetails.find(d => d.reservation_id === reservationId);
    return detail?.customer_price || 0;
  };

  const getAgencyPriceCurrency = (reservationId: string) => {
    const detail = agencyDetails.find(d => d.reservation_id === reservationId);
    return detail?.agency_price_currency || agencyCurrency;
  };

  // HESAPLAMA: Tüm hesaplamalar SADECE agency_price (customer_price) üzerinden yapılmalı
  // Hiçbir eski hesaplama mantığı veya eski alan kullanılmamalı
  const totalReservations = reservations.length;
  
  // Calculate currency-wise totals - grouped by agency's default currency and other currencies
  const currencyTotals: Record<string, { agencyPrice: number; passengerCash: number }> = {};
  reservations.forEach(r => {
    const currency = getAgencyPriceCurrency(r.id);
    if (!currencyTotals[currency]) {
      currencyTotals[currency] = { agencyPrice: 0, passengerCash: 0 };
    }
    currencyTotals[currency].agencyPrice += getAgencyPrice(r.id);
  });
  
  // Add passenger cash by currency
  reservations.forEach(r => {
    const currency = r.passenger_cash_currency || 'TRY';
    if (!currencyTotals[currency]) {
      currencyTotals[currency] = { agencyPrice: 0, passengerCash: 0 };
    }
    currencyTotals[currency].passengerCash += r.passenger_cash_amount || 0;
  });
  
  // Calculate currency balances array
  const currencyBalances = Object.entries(currencyTotals).map(([currency, totals]) => ({
    currency,
    agencyPrice: totals.agencyPrice,
    passengerCash: totals.passengerCash,
    netDebt: totals.agencyPrice - totals.passengerCash,
  }));

  // Get balance for agency's default currency
  const agencyCurrencyBalance = currencyBalances.find(cb => cb.currency === agencyCurrency);
  const agencyCurrencyNetDebt = agencyCurrencyBalance?.netDebt || 0;
  
  // Legacy totals for backward compatibility
  // Toplam Acenta Fiyatı = Tüm rezervasyonların customer_price toplamı (TEK KAYNAK)
  const totalAgencyPrice = reservations.reduce((sum, r) => sum + getAgencyPrice(r.id), 0);
  // Toplam Yolcu Nakit = Yolcudan alınacak nakit tutarı (acenta borcundan düşülür)
  const totalPassengerCash = reservations.reduce((sum, r) => sum + (r.passenger_cash_amount || 0), 0);
  
  // Current month payments only - grouped by currency
  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
  
  // Payments for agency's currency
  const agencyCurrencyPayments = payments
    .filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd && (p.currency || 'TRY') === agencyCurrency)
    .reduce((sum, p) => sum + p.amount, 0);
  
  // All payments this month
  const currentMonthPayments = payments
    .filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd)
    .reduce((sum, p) => sum + p.amount, 0);
  
  // Alınan Ödemeler = Sadece bu ayki ödemeler
  const totalPaymentsReceived = currentMonthPayments;
  
  // Net Acenta Borcu bu ay = Toplam Acenta Fiyatı - Yolcu Nakit
  const currentMonthDebt = totalAgencyPrice - totalPassengerCash;
  
  // Acente para birimi bakiyesi
  const agencyCurrencyCarryover = carryoverBalances[agencyCurrency] || 0;
  const agencyCurrencyTotalBalance = agencyCurrencyCarryover + agencyCurrencyNetDebt - agencyCurrencyPayments;
  
  // Calculate total TRY equivalent (for summary)
  const calculateTRYEquivalent = () => {
    let totalTRY = 0;
    
    // Add TRY balances directly
    const tryCarryover = carryoverBalances['TRY'] || 0;
    const tryCurrentMonth = currencyBalances.find(cb => cb.currency === 'TRY')?.netDebt || 0;
    const tryPayments = payments
      .filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd && (p.currency || 'TRY') === 'TRY')
      .reduce((sum, p) => sum + p.amount, 0);
    totalTRY += tryCarryover + tryCurrentMonth - tryPayments;
    
    // Add converted foreign currency balances
    Object.entries(tryConvertedBalances).forEach(([currency, data]) => {
      if (currency !== 'TRY') {
        const currencyCarryover = carryoverBalances[currency] || 0;
        const currencyCurrentMonth = currencyBalances.find(cb => cb.currency === currency)?.netDebt || 0;
        const currencyPayments = payments
          .filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd && (p.currency || 'TRY') === currency)
          .reduce((sum, p) => sum + p.amount, 0);
        const currencyBalance = currencyCarryover + currencyCurrentMonth - currencyPayments;
        if (data.rate) {
          totalTRY += currencyBalance * data.rate;
        }
      }
    });
    
    return Math.round(totalTRY);
  };
  
  const totalTRYEquivalent = calculateTRYEquivalent();

  const handleAgencyChange = (newAgencyId: string) => {
    navigate(`/admin/agency-accounting/${newAgencyId}`);
  };

  const handleRecordPayment = async () => {
    if (!agencyId || !paymentAmount) {
      toast.error('Please enter a payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setSavingPayment(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert payment record
      const { error: paymentError } = await supabase
        .from('agency_payments')
        .insert({
          agency_id: agencyId,
          amount,
          currency: paymentCurrency,
          payment_date: paymentDate,
          notes: paymentNotes || null,
          created_by: user?.id,
        });

      if (paymentError) throw paymentError;

      // Update agency balance
      const currentBalance = agency?.balance || 0;
      const newBalance = currentBalance - amount;
      
      const { error: balanceError } = await supabase
        .from('agencies')
        .update({ balance: newBalance })
        .eq('id', agencyId);

      if (balanceError) throw balanceError;

      toast.success('Payment recorded successfully');
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      setPaymentCurrency('TRY');
      setPaymentNotes('');
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
      fetchData();
    } catch (error: any) {
      toast.error('Failed to record payment: ' + error.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleEditPayment = async () => {
    if (!editingPayment || !paymentAmount) {
      toast.error('Please enter a payment amount');
      return;
    }

    const newAmount = parseFloat(paymentAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setSavingPayment(true);

    try {
      const amountDifference = newAmount - editingPayment.amount;

      // Update payment record
      const { error: paymentError } = await supabase
        .from('agency_payments')
        .update({
          amount: newAmount,
          currency: paymentCurrency,
          payment_date: paymentDate,
          notes: paymentNotes || null,
        })
        .eq('id', editingPayment.id);

      if (paymentError) throw paymentError;

      // Update agency balance (subtract difference)
      if (amountDifference !== 0) {
        const currentBalance = agency?.balance || 0;
        const newBalance = currentBalance - amountDifference;
        
        const { error: balanceError } = await supabase
          .from('agencies')
          .update({ balance: newBalance })
          .eq('id', agencyId);

        if (balanceError) throw balanceError;
      }

      toast.success('Payment updated successfully');
      setEditingPayment(null);
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      setPaymentCurrency('TRY');
      setPaymentNotes('');
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update payment: ' + error.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    setDeleting(true);

    try {
      // Delete payment record
      const { error: paymentError } = await supabase
        .from('agency_payments')
        .delete()
        .eq('id', deletingPayment.id);

      if (paymentError) throw paymentError;

      // Restore agency balance (add back the deleted amount)
      const currentBalance = agency?.balance || 0;
      const newBalance = currentBalance + deletingPayment.amount;
      
      const { error: balanceError } = await supabase
        .from('agencies')
        .update({ balance: newBalance })
        .eq('id', agencyId);

      if (balanceError) throw balanceError;

      toast.success('Payment deleted successfully');
      setDeletingPayment(null);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete payment: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const openEditPaymentDialog = (payment: AgencyPayment) => {
    setEditingPayment(payment);
    setPaymentAmount(payment.amount.toString());
    setPaymentCurrency(payment.currency || 'TRY');
    setPaymentDate(payment.payment_date);
    setPaymentNotes(payment.notes || '');
    setPaymentDialogOpen(true);
  };

  const openNewPaymentDialog = () => {
    setEditingPayment(null);
    setPaymentAmount('');
    setPaymentCurrency('TRY');
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentNotes('');
    setPaymentDialogOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4 flex-shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/admin/agencies')} 
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Building2 className="h-6 w-6" />
        <h1 className="text-2xl font-serif">Acenta Muhasebe</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 px-4 space-y-6">
          {/* Agency Selector */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <Select value={agencyId || ''} onValueChange={handleAgencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Acenta Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {allAgencies.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.agency_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {agency?.comments && (
              <p className="text-sm text-muted-foreground italic">{agency.comments}</p>
            )}
          </div>

          {!agencyId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Muhasebe görüntülemek için acenta seçin</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Month Navigator */}
              <MonthNavigator
                currentMonth={currentMonth}
                onPreviousMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
                onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
              />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={openNewPaymentDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ödeme Kaydet
                </Button>
                {/* Ödeme geçmişi butonu sadece bu ayda ödeme varsa göster */}
                {payments.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd).length > 0 && (
                  <Button variant="outline" onClick={() => setHistoryDialogOpen(true)} className="gap-2">
                    <History className="h-4 w-4" />
                    Bu Ay Ödemeler ({payments.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd).length})
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex gap-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Duruma göre filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="confirmed">Onaylandı</SelectItem>
                    <SelectItem value="sent_to_driver">Şoföre Gönderildi</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="text-center py-12">Yükleniyor...</div>
              ) : (
                <>
                  {/* Summary Cards - Enhanced Visual Design */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Devir Bakiye Cards - Para birimi bazlı */}
                    {Object.entries(carryoverBalances).filter(([_, balance]) => balance !== 0).map(([currency, balance]) => (
                      <Card key={`carryover-${currency}`} className={`relative overflow-hidden ${balance > 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-300 dark:border-blue-700' : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-300 dark:border-green-700'}`}>
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <History className="h-16 w-16" />
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <div className={`p-2 rounded-full ${balance > 0 ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                              <History className={`h-4 w-4 ${balance > 0 ? 'text-blue-600' : 'text-green-600'}`} />
                            </div>
                            Devir Bakiye ({currency})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold ${balance > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-green-700 dark:text-green-400'}`}>
                            {getCurrencySymbol(currency)}{Math.abs(balance).toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${balance > 0 ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                            {balance > 0 ? 'Önceki aylardan borç' : 'Önceki aylardan alacak'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}

                    {/* This Month Reservations Card */}
                    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Receipt className="h-16 w-16" />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <div className="p-2 rounded-full bg-slate-500/20">
                            <Receipt className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          Bu Ay Rezervasyon
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">{totalReservations}</div>
                        {/* Show debt for each currency */}
                        {currencyBalances.length > 0 ? (
                          <div className="space-y-1 mt-2">
                            {currencyBalances.filter(cb => cb.netDebt !== 0).map(cb => (
                              <p key={cb.currency} className="text-xs text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Bu ay borç: {getCurrencySymbol(cb.currency)}{cb.netDebt.toFixed(2)}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">Aktif borç yok</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* This Month Payments Card - Only show if payments exist, grouped by currency */}
                    {(() => {
                      const currentMonthPaymentsByCurrency: Record<string, number> = {};
                      payments
                        .filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd)
                        .forEach(p => {
                          const currency = p.currency || 'TRY';
                          if (!currentMonthPaymentsByCurrency[currency]) {
                            currentMonthPaymentsByCurrency[currency] = 0;
                          }
                          currentMonthPaymentsByCurrency[currency] += p.amount;
                        });
                      
                      const paymentEntries = Object.entries(currentMonthPaymentsByCurrency).filter(([_, amount]) => amount > 0);
                      
                      if (paymentEntries.length === 0) return null;
                      
                      return (
                        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-300 dark:border-emerald-700">
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                            <CreditCard className="h-16 w-16" />
                          </div>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <div className="p-2 rounded-full bg-emerald-500/20">
                                <CreditCard className="h-4 w-4 text-emerald-600" />
                              </div>
                              Bu Ay Ödemeler
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1">
                              {paymentEntries.map(([currency, amount]) => (
                                <div key={currency} className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                                  {getCurrencySymbol(currency)}{amount.toFixed(2)}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                              Alınan ödeme
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })()}

                    {/* Current Balance Cards - Para birimi bazlı */}
                    {(() => {
                      // Calculate balances for all currencies
                      const allCurrencies = new Set([
                        ...Object.keys(carryoverBalances),
                        ...currencyBalances.map(cb => cb.currency),
                      ]);
                      
                      // Calculate current month payments by currency
                      const currentMonthPaymentsByCurrency: Record<string, number> = {};
                      payments
                        .filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd)
                        .forEach(p => {
                          const currency = p.currency || 'TRY';
                          if (!currentMonthPaymentsByCurrency[currency]) {
                            currentMonthPaymentsByCurrency[currency] = 0;
                          }
                          currentMonthPaymentsByCurrency[currency] += p.amount;
                        });
                      
                      // Build total balance per currency
                      const totalBalancesByCurrency: Array<{ currency: string; balance: number }> = [];
                      allCurrencies.forEach(currency => {
                        const carryover = carryoverBalances[currency] || 0;
                        const currentMonthDebt = currencyBalances.find(cb => cb.currency === currency)?.netDebt || 0;
                        const currentMonthPaid = currentMonthPaymentsByCurrency[currency] || 0;
                        const totalBalance = carryover + currentMonthDebt - currentMonthPaid;
                        
                        if (totalBalance !== 0 || currency === agencyCurrency) {
                          totalBalancesByCurrency.push({ currency, balance: totalBalance });
                        }
                      });
                      
                      // Sort: agency currency first
                      totalBalancesByCurrency.sort((a, b) => {
                        if (a.currency === agencyCurrency) return -1;
                        if (b.currency === agencyCurrency) return 1;
                        return 0;
                      });
                      
                      return totalBalancesByCurrency.map(({ currency, balance }) => (
                        <Card key={`balance-${currency}`} className={`relative overflow-hidden ${
                          balance > 0 
                            ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-400 dark:border-amber-600 border-2' 
                            : balance < 0 
                              ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-400 dark:border-green-600 border-2' 
                              : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'
                        }`}>
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Banknote className="h-16 w-16" />
                          </div>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <div className={`p-2 rounded-full ${balance > 0 ? 'bg-amber-500/20' : balance < 0 ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                                <Banknote className={`h-4 w-4 ${balance > 0 ? 'text-amber-600' : balance < 0 ? 'text-green-600' : 'text-gray-600'}`} />
                              </div>
                              Güncel Bakiye ({currency})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className={`text-3xl font-bold ${balance > 0 ? 'text-amber-700 dark:text-amber-400' : balance < 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400'}`}>
                              {getCurrencySymbol(currency)}{Math.abs(balance).toFixed(2)}
                            </div>
                            <p className="text-xs mt-2 flex items-center gap-1">
                              <span className={`inline-block w-2 h-2 rounded-full ${balance > 0 ? 'bg-amber-500 animate-pulse' : balance < 0 ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                              <span className={`font-medium ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600'}`}>
                                {balance > 0 ? 'Acenta borçlu' : balance < 0 ? 'Fazla ödendi' : 'Hesaplaşıldı'}
                              </span>
                            </p>
                          </CardContent>
                        </Card>
                      ));
                    })()}

                    {/* TRY Equivalent Summary Card - Show when there are non-TRY balances */}
                    {(() => {
                      // Check if there are any non-TRY balances
                      const hasNonTRYBalances = Object.keys(carryoverBalances).some(c => c !== 'TRY') ||
                        currencyBalances.some(cb => cb.currency !== 'TRY' && cb.netDebt !== 0);
                      
                      if (!hasNonTRYBalances) return null;
                      
                      return (
                        <Card className={`relative overflow-hidden ${
                          totalTRYEquivalent > 0 
                            ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-300 dark:border-blue-700' 
                            : totalTRYEquivalent < 0 
                              ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-300 dark:border-green-700' 
                              : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'
                        }`}>
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                            <TrendingUp className="h-16 w-16" />
                          </div>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <div className={`p-2 rounded-full ${totalTRYEquivalent > 0 ? 'bg-blue-500/20' : totalTRYEquivalent < 0 ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                                <TrendingUp className={`h-4 w-4 ${totalTRYEquivalent > 0 ? 'text-blue-600' : totalTRYEquivalent < 0 ? 'text-green-600' : 'text-gray-600'}`} />
                              </div>
                              Toplam TRY Karşılığı
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className={`text-3xl font-bold ${totalTRYEquivalent > 0 ? 'text-blue-700 dark:text-blue-400' : totalTRYEquivalent < 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400'}`}>
                              {loadingConversion ? '...' : `₺${Math.abs(totalTRYEquivalent).toLocaleString('tr-TR')}`}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <span className={`inline-block w-2 h-2 rounded-full ${totalTRYEquivalent > 0 ? 'bg-blue-500' : totalTRYEquivalent < 0 ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                              {totalTRYEquivalent > 0 ? 'Toplam borç (TRY)' : totalTRYEquivalent < 0 ? 'Toplam alacak (TRY)' : 'Hesap sıfır'}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </div>
                  
                  {/* Multi-Currency Balances */}
                  {currencyBalances.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currencyBalances.map((cb) => {
                        const symbol = getCurrencySymbol(cb.currency);
                        return (
                          <Card key={cb.currency} className="border-primary/20">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">{cb.currency}</Badge>
                                Para Birimi Bakiyesi
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Acenta Fiyatı</span>
                                <span className="font-medium">{symbol}{cb.agencyPrice.toFixed(2)}</span>
                              </div>
                              {cb.passengerCash > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Yolcu Nakit</span>
                                  <span className="font-medium text-orange-600">-{symbol}{cb.passengerCash.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t pt-2">
                                <span className="font-medium">Net Borç</span>
                                <span className={`font-bold ${cb.netDebt > 0 ? 'text-primary' : cb.netDebt < 0 ? 'text-green-600' : ''}`}>
                                  {symbol}{cb.netDebt.toFixed(2)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Reservations List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Rezervasyonlar ({reservations.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reservations.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                          Bu dönem için rezervasyon bulunamadı
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {reservations.map((res) => {
                            const symbol = getCurrencySymbol(res.price_currency);
                            const passengerCount = res.passenger_names?.length || 1;
                            const agencyPrice = getAgencyPrice(res.id);

                            return (
                              <Card 
                                key={res.id} 
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/admin/reservations/${res.id}`)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex flex-wrap justify-between items-start gap-4">
                                    {/* Left - Details */}
                                    <div className="space-y-2 flex-1 min-w-[200px]">
                                      <div className="flex items-center gap-2">
                                        {res.reservation_code && (
                                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                            {res.reservation_code}
                                          </span>
                                        )}
                                        <Badge className={statusColors[res.status] || 'bg-muted'}>
                                          {statusLabels[res.status] || res.status}
                                        </Badge>
                                      </div>

                                      <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{format(new Date(res.pickup_date), 'dd MMM yyyy')}</span>
                                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                                        <span>{res.pickup_time}</span>
                                      </div>

                                      <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">
                                          {res.pickup} → {res.dropoff}
                                        </span>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Car className="h-4 w-4" />
                                          {res.vehicle_type.replace('-', ' ')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Users className="h-4 w-4" />
                                          {passengerCount} pax
                                        </span>
                                        {res.flight_number && (
                                          <span className="flex items-center gap-1">
                                            <Plane className="h-4 w-4" />
                                            {res.flight_number}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>Şoför: {getDriverName(res.driver_id)}</span>
                                      </div>
                                    </div>

                                    {/* Right - Prices */}
                                    <div className="text-right space-y-2">
                                      <div>
                                        <div className="text-xs text-muted-foreground">Acenta Fiyatı</div>
                                        <div className="text-lg font-semibold text-primary">
                                          {getCurrencySymbol(getAgencyPriceCurrency(res.id))}{agencyPrice.toFixed(2)}
                                        </div>
                                      </div>
                                      {res.passenger_cash_amount && res.passenger_cash_amount > 0 && (
                                        <div>
                                          <div className="text-xs text-muted-foreground">Yolcu Nakit</div>
                                          <div className="text-sm font-medium text-orange-600">
                                            {getCurrencySymbol(res.passenger_cash_currency)}
                                            {res.passenger_cash_amount.toFixed(2)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {res.driver_notes && (
                                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                                      Notlar: {res.driver_notes}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Record/Edit Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
        setPaymentDialogOpen(open);
        if (!open) setEditingPayment(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? 'Ödeme Düzenle' : 'Ödeme Kaydet'} - {agency?.agency_name}
            </DialogTitle>
            <DialogDescription>
              {editingPayment 
                ? 'Ödeme bilgilerini güncelleyin.' 
                : 'Acentadan alınan ödeme bilgilerini girin.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Ödeme Tutarı</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Tutar girin"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Para Birimi</Label>
                <Select value={paymentCurrency} onValueChange={setPaymentCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Para birimi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.symbol} {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Ödeme Tarihi</Label>
              <Input
                id="date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
              <Textarea
                id="notes"
                placeholder="Bu ödeme hakkında not ekleyin..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPaymentDialogOpen(false);
              setEditingPayment(null);
            }}>
              İptal
            </Button>
            <Button 
              onClick={editingPayment ? handleEditPayment : handleRecordPayment} 
              disabled={savingPayment}
            >
              {savingPayment 
                ? (editingPayment ? 'Güncelleniyor...' : 'Kaydediliyor...') 
                : (editingPayment ? 'Ödeme Güncelle' : 'Ödeme Kaydet')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bu Ay Ödemeler - {agency?.agency_name}</DialogTitle>
            <DialogDescription>
              {format(currentMonth, 'MMMM yyyy')} ayında alınan ödemeler.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {(() => {
              const currentMonthPaymentsList = payments.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd);
              if (currentMonthPaymentsList.length === 0) {
                return (
                  <p className="text-center py-8 text-muted-foreground">
                    Bu ayda ödeme kaydedilmedi
                  </p>
                );
              }
              return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead>Notlar</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentMonthPaymentsList.map((payment) => {
                      const paymentSymbol = getCurrencySymbol(payment.currency);
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="text-right font-medium">{paymentSymbol}{payment.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">{payment.notes || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setHistoryDialogOpen(false);
                                  openEditPaymentDialog(payment);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingPayment(payment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPayment} onOpenChange={(open) => !open && setDeletingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ödeme Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {getCurrencySymbol(deletingPayment?.currency)}{deletingPayment?.amount.toFixed(2)} tutarındaki bu ödemeyi silmek istediğinizden emin misiniz? 
              Bu tutar acenta bakiyesine geri eklenecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePayment}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAgencyAccounting;
