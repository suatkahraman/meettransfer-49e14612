import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, Wallet, FileText } from 'lucide-react';
import { MonthNavigator } from '@/components/accounting/MonthNavigator';
import { MonthlySummaryCard } from '@/components/accounting/MonthlySummaryCard';
import { MonthlyAccountingTable } from '@/components/accounting/MonthlyAccountingTable';
import { DriverPaymentDialog } from '@/components/accounting/DriverPaymentDialog';
import { DriverPaymentsTable } from '@/components/accounting/DriverPaymentsTable';
import { DriverBalanceCard } from '@/components/accounting/DriverBalanceCard';
import { DriverQuickPaymentDialog } from '@/components/accounting/DriverQuickPaymentDialog';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

interface Driver {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
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
}

interface DriverSummary {
  driver: Driver;
  totalPrice: number;
  totalCash: number;
  balance: number;
  transferCount: number;
  totalPayments: number;
  netBalance: number;
}

interface DriverPayment {
  id: string;
  driver_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
  driver_name?: string;
  payment_type: string;
}

interface DriverBalance {
  driver_id: string;
  balance: number;
}

// Store all-time data for carry-over calculation
interface AllTimeDriverData {
  driverId: string;
  totalEarnings: number;  // All-time earnings (price - cash collected)
  totalPaymentsToDriver: number;  // All payments made to driver
  totalPaymentsFromDriver: number;  // All payments received from driver
}

const AdminMonthlyAccounting = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [driverSummaries, setDriverSummaries] = useState<DriverSummary[]>([]);
  const [driverPayments, setDriverPayments] = useState<DriverPayment[]>([]);
  const [driverBalances, setDriverBalances] = useState<DriverBalance[]>([]);
  const [allTimeDriverData, setAllTimeDriverData] = useState<AllTimeDriverData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reservations');

  useEffect(() => {
    const fetchDrivers = async () => {
      const { data } = await supabase
        .from('drivers')
        .select('id, name')
        .order('name');
      if (data) setDrivers(data);
    };
    fetchDrivers();
  }, []);

  const fetchPaymentsAndBalances = async () => {
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    // Fetch payments for the month
    let paymentsQuery = supabase
      .from('driver_payments')
      .select('*')
      .gte('payment_date', monthStart)
      .lte('payment_date', monthEnd)
      .order('payment_date', { ascending: false });

    if (selectedDriver !== 'all') {
      paymentsQuery = paymentsQuery.eq('driver_id', selectedDriver);
    }

    const { data: paymentsData } = await paymentsQuery;
    
    if (paymentsData) {
      const paymentsWithDriverNames = paymentsData.map(p => ({
        ...p,
        driver_name: drivers.find(d => d.id === p.driver_id)?.name || '-'
      }));
      setDriverPayments(paymentsWithDriverNames);
    }

    // Fetch ALL payments for carry-over calculation
    const { data: allPaymentsData } = await supabase
      .from('driver_payments')
      .select('*');

    // Fetch ALL completed reservations for carry-over calculation
    const { data: allReservationsData } = await supabase
      .from('reservations')
      .select('driver_id, price, driver_cash_amount')
      .not('driver_id', 'is', null)
      .in('status', ['completed', 'active', 'assigned', 'sent_to_driver']);

    // Calculate all-time data per driver
    const allTimeMap = new Map<string, AllTimeDriverData>();

    // Sum up all reservations earnings
    if (allReservationsData) {
      allReservationsData.forEach(res => {
        if (!res.driver_id) return;
        const existing = allTimeMap.get(res.driver_id) || {
          driverId: res.driver_id,
          totalEarnings: 0,
          totalPaymentsToDriver: 0,
          totalPaymentsFromDriver: 0
        };
        existing.totalEarnings += (res.price || 0) - (res.driver_cash_amount || 0);
        allTimeMap.set(res.driver_id, existing);
      });
    }

    // Sum up all payments
    if (allPaymentsData) {
      allPaymentsData.forEach(payment => {
        const existing = allTimeMap.get(payment.driver_id) || {
          driverId: payment.driver_id,
          totalEarnings: 0,
          totalPaymentsToDriver: 0,
          totalPaymentsFromDriver: 0
        };
        if (payment.payment_type === 'to_driver') {
          existing.totalPaymentsToDriver += payment.amount;
        } else {
          existing.totalPaymentsFromDriver += payment.amount;
        }
        allTimeMap.set(payment.driver_id, existing);
      });
    }

    setAllTimeDriverData(Array.from(allTimeMap.values()));

    // Fetch all driver balances (legacy, for reference)
    const { data: balancesData } = await supabase
      .from('driver_balances')
      .select('*');
    
    if (balancesData) {
      setDriverBalances(balancesData);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      let query = supabase
        .from('reservations')
        .select('*')
        .gte('pickup_date', monthStart)
        .lte('pickup_date', monthEnd)
        .not('driver_id', 'is', null)
        .order('pickup_date', { ascending: true });

      if (selectedDriver !== 'all') {
        query = query.eq('driver_id', selectedDriver);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data } = await query;

      if (data) {
        setReservations(data);

        // Calculate driver summaries
        const summaryMap = new Map<string, DriverSummary>();
        
        data.forEach(res => {
          const driverId = res.driver_id;
          if (!driverId) return;
          
          const driver = drivers.find(d => d.id === driverId);
          if (!driver) return;

          const existing = summaryMap.get(driverId) || {
            driver,
            totalPrice: 0,
            totalCash: 0,
            balance: 0,
            transferCount: 0,
            totalPayments: 0,
            netBalance: 0
          };

          existing.totalPrice += res.price || 0;
          existing.totalCash += res.driver_cash_amount || 0;
          existing.transferCount += 1;
          existing.balance = existing.totalPrice - existing.totalCash;

          summaryMap.set(driverId, existing);
        });

        setDriverSummaries(Array.from(summaryMap.values()));
      }
      
      await fetchPaymentsAndBalances();
      setLoading(false);
    };

    if (drivers.length > 0) {
      fetchData();
    }
  }, [currentMonth, selectedDriver, selectedStatus, drivers]);

  const totalPrice = reservations.reduce((sum, r) => sum + (r.price || 0), 0);
  const totalCash = reservations.reduce((sum, r) => sum + (r.driver_cash_amount || 0), 0);
  
  // Separate payments by type
  const totalPaymentsToDriver = driverPayments
    .filter(p => p.payment_type === 'to_driver')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPaymentsFromDriver = driverPayments
    .filter(p => p.payment_type === 'from_driver')
    .reduce((sum, p) => sum + p.amount, 0);
  const netPaymentsBalance = totalPaymentsToDriver - totalPaymentsFromDriver;

  const handleEditReservation = (reservation: Reservation) => {
    navigate(`/admin/reservations/${reservation.id}`);
  };

  const handlePaymentAdded = () => {
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    fetchPaymentsAndBalances();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin')} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Aylık Muhasebe</h1>
        </div>
        <DriverPaymentDialog drivers={drivers} onPaymentAdded={handlePaymentAdded} />
      </header>

      <main className="container mx-auto py-6 px-4 space-y-6">
        {/* Month Navigator */}
        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
          onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="reservations" className="gap-2">
              <FileText className="h-4 w-4" />
              Rezervasyonlar
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <Wallet className="h-4 w-4" />
              Şoför Ödemeleri
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reservations" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Şoför seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şoförler</SelectItem>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="assigned">Atandı</SelectItem>
                  <SelectItem value="sent_to_driver">Şoföre Gönderildi</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12">Yükleniyor...</div>
            ) : (
              <>
                {/* Monthly Summary */}
                <MonthlySummaryCard
                  totalTransfers={reservations.length}
                  totalPrice={totalPrice}
                  totalCashCollected={totalCash}
                  paymentsToDriver={totalPaymentsToDriver}
                  paymentsFromDriver={totalPaymentsFromDriver}
                />

                {/* Driver Breakdown */}
                {selectedDriver === 'all' && driverSummaries.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" />
                        Şoför Dağılımı
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {driverSummaries.map(summary => {
                          // Get all-time data for this driver
                          const allTimeData = allTimeDriverData.find(d => d.driverId === summary.driver.id);
                          const totalAllTimeEarnings = allTimeData?.totalEarnings || 0;
                          const totalPaymentsToDriver = allTimeData?.totalPaymentsToDriver || 0;
                          const totalPaymentsFromDriver = allTimeData?.totalPaymentsFromDriver || 0;
                          
                          // Net balance = earnings - payments to driver + payments from driver
                          const netBalance = totalAllTimeEarnings - totalPaymentsToDriver + totalPaymentsFromDriver;
                          const balanceColor = netBalance > 0 ? 'text-amber-600' : netBalance < 0 ? 'text-blue-600' : 'text-green-600';
                          return (
                            <div 
                              key={summary.driver.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 gap-3"
                            >
                              <div>
                                <div className="font-medium">{summary.driver.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {summary.transferCount} transfer | Ödenen: ₺{totalPaymentsToDriver.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="text-right">
                                  <div className="text-sm">
                                    Bu ay: ₺{summary.totalPrice.toFixed(2)} | Nakit: ₺{summary.totalCash.toFixed(2)}
                                  </div>
                                  <div className={`font-semibold ${balanceColor}`}>
                                    Devir: ₺{Math.abs(netBalance).toFixed(2)}
                                    {netBalance > 0 ? ' (alacak)' : netBalance < 0 ? ' (verecek)' : ' (kapalı)'}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <DriverQuickPaymentDialog
                                    driverId={summary.driver.id}
                                    driverName={summary.driver.name}
                                    paymentType="from_driver"
                                    onPaymentAdded={handlePaymentAdded}
                                  />
                                  <DriverQuickPaymentDialog
                                    driverId={summary.driver.id}
                                    driverName={summary.driver.name}
                                    paymentType="to_driver"
                                    onPaymentAdded={handlePaymentAdded}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reservations Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rezervasyonlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MonthlyAccountingTable
                      reservations={reservations}
                      showActions={true}
                      onEdit={handleEditReservation}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            {/* Driver Filter */}
            <div className="flex flex-wrap gap-4">
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Şoför seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şoförler</SelectItem>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12">Yükleniyor...</div>
            ) : (
              <>
                {/* Payments Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Yapılan Ödeme</div>
                      <div className="text-2xl font-bold text-blue-600">
                        ₺{totalPaymentsToDriver.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Şoföre yapılan</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Alınan Ödeme</div>
                      <div className="text-2xl font-bold text-green-600">
                        ₺{totalPaymentsFromDriver.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Şoförden alınan</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Net Bakiye</div>
                      <div className={`text-2xl font-bold ${netPaymentsBalance > 0 ? 'text-blue-600' : netPaymentsBalance < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        ₺{Math.abs(netPaymentsBalance).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {netPaymentsBalance > 0 ? 'Şirket fazla ödedi' : netPaymentsBalance < 0 ? 'Şoför fazla ödedi' : 'Eşit'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Toplam İşlem</div>
                      <div className="text-2xl font-bold">
                        {driverPayments.length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">ödeme kaydı</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Driver Balances */}
                {selectedDriver === 'all' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" />
                        Şoför Bakiyeleri (Toplam Cari)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {drivers.map(driver => {
                          const balance = driverBalances.find(b => b.driver_id === driver.id)?.balance || 0;
                          if (balance === 0) return null;
                          return (
                            <div 
                              key={driver.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 gap-3"
                            >
                              <div className="font-medium">{driver.name}</div>
                              <div className="flex items-center gap-3">
                                <div className="font-semibold text-green-600">
                                  ₺{balance.toFixed(2)} ödendi
                                </div>
                                <div className="flex gap-2">
                                  <DriverQuickPaymentDialog
                                    driverId={driver.id}
                                    driverName={driver.name}
                                    paymentType="from_driver"
                                    onPaymentAdded={handlePaymentAdded}
                                  />
                                  <DriverQuickPaymentDialog
                                    driverId={driver.id}
                                    driverName={driver.name}
                                    paymentType="to_driver"
                                    onPaymentAdded={handlePaymentAdded}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {driverBalances.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground">
                            Henüz ödeme yapılmamış
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payments Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ödeme Geçmişi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DriverPaymentsTable 
                      payments={driverPayments} 
                      showDriver={selectedDriver === 'all'} 
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminMonthlyAccounting;
