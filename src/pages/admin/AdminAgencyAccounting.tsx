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

interface Agency {
  id: string;
  agency_name: string;
  comments: string | null;
  balance: number | null;
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

const currencies: Record<string, string> = {
  'TRY': '₺',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'AED': 'د.إ',
  'AUD': 'A$',
};

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
        supabase.from('agencies').select('*').order('agency_name'),
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

  // State for carryover balance from previous months
  const [carryoverBalance, setCarryoverBalance] = useState(0);
  const [carryoverPayments, setCarryoverPayments] = useState(0);

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
    let prevMonthsCarryoverDebt = 0;
    if (prevMonthsReservations.length > 0) {
      const prevReservationIds = prevMonthsReservations.map(r => r.id);
      const { data: prevDetailsData } = await supabase
        .from('agency_reservation_details')
        .select('reservation_id, customer_price, company_amount, agency_price_currency')
        .in('reservation_id', prevReservationIds);
      
      const prevDetails = prevDetailsData || [];
      
      // Calculate total debt from previous months completed reservations
      // Debt = company_amount (admin price) - passenger_cash_amount
      prevMonthsReservations.forEach(r => {
        const detail = prevDetails.find(d => d.reservation_id === r.id);
        const companyAmount = detail?.company_amount || r.price || 0;
        const passengerCash = r.passenger_cash_amount || 0;
        prevMonthsCarryoverDebt += (companyAmount - passengerCash);
      });
    }

    // Calculate payments before this month
    const prevMonthsPayments = allPayments
      .filter(p => p.payment_date < monthStart)
      .reduce((sum, p) => sum + p.amount, 0);

    // Carryover = Previous months debt - Previous months payments
    setCarryoverBalance(prevMonthsCarryoverDebt - prevMonthsPayments);
    setCarryoverPayments(prevMonthsPayments);

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

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return 'Atanmadı';
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || 'Bilinmiyor';
  };

  const getCurrencySymbol = (currency: string | null) => currencies[currency || 'TRY'] || currency;

  const getAgencyPrice = (reservationId: string) => {
    const detail = agencyDetails.find(d => d.reservation_id === reservationId);
    return detail?.customer_price || 0;
  };

  const getAgencyPriceCurrency = (reservationId: string) => {
    const detail = agencyDetails.find(d => d.reservation_id === reservationId);
    return detail?.agency_price_currency || 'TRY';
  };

  // HESAPLAMA: Tüm hesaplamalar SADECE agency_price (customer_price) üzerinden yapılmalı
  // Hiçbir eski hesaplama mantığı veya eski alan kullanılmamalı
  const totalReservations = reservations.length;
  
  // Calculate currency-wise totals
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
  
  // Legacy totals for backward compatibility
  // Toplam Acenta Fiyatı = Tüm rezervasyonların customer_price toplamı (TEK KAYNAK)
  const totalAgencyPrice = reservations.reduce((sum, r) => sum + getAgencyPrice(r.id), 0);
  // Toplam Yolcu Nakit = Yolcudan alınacak nakit tutarı (acenta borcundan düşülür)
  const totalPassengerCash = reservations.reduce((sum, r) => sum + (r.passenger_cash_amount || 0), 0);
  
  // Current month payments only
  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
  const currentMonthPayments = payments
    .filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd)
    .reduce((sum, p) => sum + p.amount, 0);
  
  // Alınan Ödemeler = Sadece bu ayki ödemeler
  const totalPaymentsReceived = currentMonthPayments;
  
  // Net Acenta Borcu bu ay = Toplam Acenta Fiyatı - Yolcu Nakit
  const currentMonthDebt = totalAgencyPrice - totalPassengerCash;
  
  // Devir Bakiye dahil güncel bakiye = Önceki aylardan devir + Bu ayki borç - Bu ayki ödemeler
  const totalBalance = carryoverBalance + currentMonthDebt - currentMonthPayments;

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
    setPaymentDate(payment.payment_date);
    setPaymentNotes(payment.notes || '');
    setPaymentDialogOpen(true);
  };

  const openNewPaymentDialog = () => {
    setEditingPayment(null);
    setPaymentAmount('');
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
                <Button variant="outline" onClick={() => setHistoryDialogOpen(true)} className="gap-2">
                  <History className="h-4 w-4" />
                  Ödeme Geçmişi ({payments.length})
                </Button>
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
                    {/* Devir Bakiye Card - Only show if not zero */}
                    {carryoverBalance !== 0 && (
                      <Card className={`relative overflow-hidden ${carryoverBalance > 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-300 dark:border-blue-700' : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-300 dark:border-green-700'}`}>
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <History className="h-16 w-16" />
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <div className={`p-2 rounded-full ${carryoverBalance > 0 ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                              <History className={`h-4 w-4 ${carryoverBalance > 0 ? 'text-blue-600' : 'text-green-600'}`} />
                            </div>
                            Devir Bakiye
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold ${carryoverBalance > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-green-700 dark:text-green-400'}`}>
                            ₺{Math.abs(carryoverBalance).toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${carryoverBalance > 0 ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                            {carryoverBalance > 0 ? 'Önceki aylardan borç' : 'Önceki aylardan alacak'}
                          </p>
                        </CardContent>
                      </Card>
                    )}

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
                        {currentMonthDebt > 0 && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Bu ay borç: ₺{currentMonthDebt.toFixed(2)}
                          </p>
                        )}
                        {currentMonthDebt === 0 && (
                          <p className="text-xs text-muted-foreground mt-2">Aktif borç yok</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* This Month Payments Card - Only show if payments exist */}
                    {totalPaymentsReceived > 0 && (
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
                          <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">₺{totalPaymentsReceived.toFixed(2)}</div>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                            Alınan ödeme
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Current Balance Card */}
                    <Card className={`relative overflow-hidden ${
                      totalBalance > 0 
                        ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-400 dark:border-amber-600 border-2' 
                        : totalBalance < 0 
                          ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-400 dark:border-green-600 border-2' 
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'
                    }`}>
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Banknote className="h-16 w-16" />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <div className={`p-2 rounded-full ${totalBalance > 0 ? 'bg-amber-500/20' : totalBalance < 0 ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                            <Banknote className={`h-4 w-4 ${totalBalance > 0 ? 'text-amber-600' : totalBalance < 0 ? 'text-green-600' : 'text-gray-600'}`} />
                          </div>
                          Güncel Bakiye
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-3xl font-bold ${totalBalance > 0 ? 'text-amber-700 dark:text-amber-400' : totalBalance < 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400'}`}>
                          ₺{Math.abs(totalBalance).toFixed(2)}
                        </div>
                        <p className="text-xs mt-2 flex items-center gap-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${totalBalance > 0 ? 'bg-amber-500 animate-pulse' : totalBalance < 0 ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          <span className={`font-medium ${totalBalance > 0 ? 'text-amber-600 dark:text-amber-400' : totalBalance < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600'}`}>
                            {totalBalance > 0 ? 'Acenta borçlu' : totalBalance < 0 ? 'Fazla ödendi' : 'Hesaplaşıldı'}
                          </span>
                        </p>
                      </CardContent>
                    </Card>
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
                                            {res.passenger_cash_currency === 'EUR' ? '€' : res.passenger_cash_currency === 'USD' ? '$' : '₺'}
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
            <div className="space-y-2">
              <Label htmlFor="amount">Ödeme Tutarı (₺)</Label>
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
            <DialogTitle>Ödeme Geçmişi - {agency?.agency_name}</DialogTitle>
            <DialogDescription>
              Bu acentadan alınan tüm ödemeler.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {payments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Henüz ödeme kaydedilmedi
              </p>
            ) : (
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
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right font-medium">₺{payment.amount.toFixed(2)}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            )}
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
              ₺{deletingPayment?.amount.toFixed(2)} tutarındaki bu ödemeyi silmek istediğinizden emin misiniz? 
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
