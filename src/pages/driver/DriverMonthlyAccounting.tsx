import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Wallet } from 'lucide-react';
import { MonthNavigator } from '@/components/accounting/MonthNavigator';
import { MonthlySummaryCard } from '@/components/accounting/MonthlySummaryCard';
import { MonthlyAccountingTable } from '@/components/accounting/MonthlyAccountingTable';
import { DriverBalanceCard } from '@/components/accounting/DriverBalanceCard';
import { DriverPaymentsTable } from '@/components/accounting/DriverPaymentsTable';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { getCurrencySymbol } from '@/lib/currency';

interface Reservation {
  id: string;
  pickup_date: string;
  pickup_time: string;
  pickup: string;
  dropoff: string;
  price: number | null;
  price_currency: string | null;
  driver_earning: number | null; // Şoför maliyeti (TRY)
  driver_cash_amount: number | null; // Şoförün aldığı nakit (TRY)
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  status: string;
  customer_name: string;
}

interface DriverPayment {
  id: string;
  driver_id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  notes: string | null;
  created_at: string;
}

const DriverMonthlyAccounting = () => {
  const navigate = useNavigate();
  const { driverId } = useUserRole();
  const { t } = useDriverTranslations();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<DriverPayment[]>([]);
  const [allPayments, setAllPayments] = useState<DriverPayment[]>([]);
  const [previousMonthsEarnings, setPreviousMonthsEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reservations');

  useEffect(() => {
    const fetchData = async () => {
      if (!driverId) return;

      setLoading(true);
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const [
        { data: reservationsData },
        { data: paymentsData },
        { data: allPaymentsData },
        { data: allCompletedReservations }
      ] = await Promise.all([
        supabase
          .from('reservations')
          .select('id, pickup_date, pickup_time, pickup, dropoff, price, price_currency, driver_earning, driver_cash_amount, passenger_cash_amount, passenger_cash_currency, status, customer_name')
          .eq('driver_id', driverId)
          .gte('pickup_date', monthStart)
          .lte('pickup_date', monthEnd)
          .not('status', 'in', '("cancelled","deleted")')
          .order('pickup_date', { ascending: true }),
        supabase
          .from('driver_payments')
          .select('id, driver_id, amount, payment_date, payment_type, notes, created_at')
          .eq('driver_id', driverId)
          .gte('payment_date', monthStart)
          .lte('payment_date', monthEnd)
          .order('payment_date', { ascending: false }),
        supabase
          .from('driver_payments')
          .select('id, driver_id, amount, payment_date, payment_type, notes, created_at')
          .eq('driver_id', driverId)
          .lte('payment_date', monthEnd) // Only payments up to end of selected month
          .order('payment_date', { ascending: false }),
        supabase
          .from('reservations')
          .select('driver_earning, driver_cash_amount, pickup_date, status')
          .eq('driver_id', driverId)
          .lte('pickup_date', monthEnd) // Include all up to end of selected month
          .eq('status', 'completed')
      ]);

      if (reservationsData) {
        setReservations(reservationsData);
      } else {
        setReservations([]);
      }
      if (paymentsData) {
        setPayments(paymentsData);
      } else {
        setPayments([]);
      }
      if (allPaymentsData) {
        setAllPayments(allPaymentsData);
      } else {
        setAllPayments([]);
      }

      // Calculate all-time earnings up to selected month (driver_earning - cash collected) - TL bazlı
      let allTimeEarnings = 0;
      allCompletedReservations?.forEach(r => {
        allTimeEarnings += (r.driver_earning || 0) - (r.driver_cash_amount || 0);
      });
      setPreviousMonthsEarnings(allTimeEarnings);

      setLoading(false);
    };

    if (driverId) {
      fetchData();

      // Set up real-time subscription
      const channel = supabase
        .channel('driver-monthly-accounting')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reservations',
            filter: `driver_id=eq.${driverId}`
          },
          () => {
            fetchData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'driver_payments',
            filter: `driver_id=eq.${driverId}`
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [driverId, currentMonth]);

  // TL bazlı hesaplamalar: driver_earning (şoför maliyeti) ve driver_cash_amount (aldığı nakit)
  const totalPrice = reservations.reduce((sum, r) => sum + (r.driver_earning || 0), 0);
  const totalCash = reservations.reduce((sum, r) => sum + (r.driver_cash_amount || 0), 0);
  
  // Calculate payments by type
  const paymentsToDriver = allPayments
    .filter(p => p.payment_type === 'to_driver')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const paymentsFromDriver = allPayments
    .filter(p => p.payment_type === 'from_driver')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  // This month's payments
  const thisMonthPaymentsToDriver = payments
    .filter(p => p.payment_type === 'to_driver')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const thisMonthPaymentsFromDriver = payments
    .filter(p => p.payment_type === 'from_driver')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Monthly earnings = price - cash (what driver should receive for this month only)
  const monthlyEarnings = totalPrice - totalCash;
  
  // Total all-time earnings up to and including selected month
  // previousMonthsEarnings now includes ALL completed reservations up to selected month
  const totalAllTimeEarnings = previousMonthsEarnings;
  
  // Net balance = Total earnings - payments received + payments given
  // If positive = company owes driver (alacak)
  // If negative = driver owes company (verecek)
  const netBalance = totalAllTimeEarnings - paymentsToDriver + paymentsFromDriver;

  const handleViewDetails = (reservation: Reservation) => {
    navigate(`/driver/job/${reservation.id}`);
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <main className="container mx-auto py-6 px-4 space-y-6 max-w-2xl">
        {/* Month Navigator */}
        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
          onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
        />

        {loading ? (
          <div className="text-center py-12">{t('loading')}</div>
        ) : (
          <>
            {/* Driver Balance Card - now with correct carry-over calculation */}
            <DriverBalanceCard
              balance={netBalance}
              totalPayments={paymentsToDriver}
              totalEarnings={totalAllTimeEarnings}
            />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="reservations" className="gap-2 text-xs sm:text-sm px-2">
                  <FileText className="h-4 w-4" />
                  {t('transfers')}
                </TabsTrigger>
                <TabsTrigger value="payments" className="gap-2 text-xs sm:text-sm px-2">
                  <Wallet className="h-4 w-4" />
                  {t('payments')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reservations" className="space-y-6">
                {/* Monthly Summary */}
                <MonthlySummaryCard
                  totalTransfers={reservations.length}
                  totalPrice={totalPrice}
                  totalCashCollected={totalCash}
                />

                {/* Reservations Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('transfers')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MonthlyAccountingTable
                      reservations={reservations}
                      showActions={true}
                      onEdit={handleViewDetails}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-6">
                {/* Payments Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Wallet className="h-5 w-5" />
                      {t('paymentsThisMonth')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">{t('receivedFromCompany')}</div>
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {getCurrencySymbol('TRY')}{thisMonthPaymentsToDriver.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{t('paidToCompany')}</div>
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {getCurrencySymbol('TRY')}{thisMonthPaymentsFromDriver.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {payments.length} {t('paymentRecords')}
                    </p>
                  </CardContent>
                </Card>

                {/* Carry-over Balance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('carryOverBalance')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${netBalance > 0 ? 'text-amber-600' : netBalance < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                      {getCurrencySymbol('TRY')}{Math.abs(netBalance).toFixed(2)}
                      <span className="text-sm font-normal ml-2">
                        {netBalance > 0 ? '(alacak)' : netBalance < 0 ? '(verecek)' : '(kapalı)'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('allTimeTotal')}
                    </p>
                  </CardContent>
                </Card>

                {/* Payments Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('paymentHistory')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DriverPaymentsTable payments={payments} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default DriverMonthlyAccounting;