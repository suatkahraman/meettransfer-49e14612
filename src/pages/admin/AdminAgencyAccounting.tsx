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

    const [reservationsRes, paymentsRes] = await Promise.all([
      query,
      supabase
        .from('agency_payments')
        .select('*')
        .eq('agency_id', agencyId)
        .order('payment_date', { ascending: false }),
    ]);

    const reservationsData = reservationsRes.data || [];
    setReservations(reservationsData);
    setPayments(paymentsRes.data || []);

    // Fetch agency reservation details for price info
    if (reservationsData.length > 0) {
      const reservationIds = reservationsData.map(r => r.id);
      const { data: detailsData } = await supabase
        .from('agency_reservation_details')
        .select('reservation_id, customer_price, company_amount, agency_price_currency')
        .in('reservation_id', reservationIds);
      setAgencyDetails(detailsData || []);
    } else {
      setAgencyDetails([]);
    }

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
  // Toplam Acenta Fiyatı = Tüm rezervasyonların customer_price toplamı (TEK KAYNAK)
  const totalAgencyPrice = reservations.reduce((sum, r) => sum + getAgencyPrice(r.id), 0);
  // Alınan Ödemeler = agency_payments tablosundaki ödemelerin toplamı
  const totalPaymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  // Acenta Bakiyesi = Toplam Acenta Fiyatı - Toplam Ödenen Tutar
  const remainingBalance = totalAgencyPrice - totalPaymentsReceived;

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
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          Toplam Rezervasyon
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalReservations}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Toplam Acenta Fiyatı
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary">₺{totalAgencyPrice.toFixed(2)}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Alınan Ödemeler
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">₺{totalPaymentsReceived.toFixed(2)}</div>
                      </CardContent>
                    </Card>

                    <Card className={remainingBalance > 0 ? 'border-amber-500' : remainingBalance < 0 ? 'border-green-500' : ''}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          Bakiye
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${remainingBalance > 0 ? 'text-amber-600' : remainingBalance < 0 ? 'text-green-600' : ''}`}>
                          ₺{remainingBalance.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {remainingBalance > 0 ? 'Acenta borçlu' : remainingBalance < 0 ? 'Fazla ödendi' : 'Hesaplaşıldı'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

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

                                    {/* Right - Agency Price */}
                                    <div className="text-right space-y-1">
                                      <div className="text-xs text-muted-foreground">Acenta Fiyatı</div>
                                      <div className="text-lg font-semibold text-primary">
                                        {getCurrencySymbol(getAgencyPriceCurrency(res.id))}{agencyPrice.toFixed(2)}
                                      </div>
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
