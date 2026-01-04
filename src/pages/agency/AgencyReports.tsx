import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { useAgencyLanguage, AGENCY_CURRENCIES } from '@/contexts/AgencyLanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, TrendingUp, DollarSign, CreditCard, Wallet, CheckCircle, Clock, Calendar, History } from 'lucide-react';
import { MonthNavigator } from '@/components/accounting/MonthNavigator';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface AgencyReservationDetail {
  id: string;
  reservation_id: string;
  customer_price: number;
  company_amount: number;
  agency_profit: number;
  payment_status: string;
  agency_price_currency: string | null;
}

interface Reservation {
  id: string;
  reservation_code: string | null;
  status: string;
  pickup_date: string;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
}

interface AgencyTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  balance_after: number;
  created_at: string;
  currency: string;
}

const AgencyReports = () => {
  const { agencyId } = useUserRole();
  const { t, locale } = useAgencyTranslations();
  const { currencySymbol, currency: agencyCurrency } = useAgencyLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [agency, setAgency] = useState<{ agency_name: string; balance: number; currency: string } | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agencyDetails, setAgencyDetails] = useState<AgencyReservationDetail[]>([]);
  const [transactions, setTransactions] = useState<AgencyTransaction[]>([]);
  const [carryoverBalance, setCarryoverBalance] = useState(0);

  const fetchData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);

    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    // Fetch agency info
    const { data: agencyData } = await supabase
      .from('agencies')
      .select('agency_name, balance, currency')
      .eq('id', agencyId)
      .single();

    if (agencyData) {
      setAgency(agencyData);
    }

    // Fetch current month reservations + previous months completed reservations for carryover
    const [resDataRes, prevMonthsReservationsRes, allPaymentsRes, transDataRes] = await Promise.all([
      supabase
        .from('reservations')
        .select('id, reservation_code, status, pickup_date, passenger_cash_amount, passenger_cash_currency')
        .eq('agency_id', agencyId)
        .gte('pickup_date', monthStart)
        .lte('pickup_date', monthEnd),
      // Fetch all completed reservations before this month for carryover calculation
      supabase
        .from('reservations')
        .select('id, status, pickup_date, passenger_cash_amount, passenger_cash_currency')
        .eq('agency_id', agencyId)
        .eq('status', 'completed')
        .lt('pickup_date', monthStart),
      // Fetch all agency payments
      supabase
        .from('agency_payments')
        .select('*')
        .eq('agency_id', agencyId),
      // Fetch recent transactions
      supabase
        .from('agency_transactions')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const resData = resDataRes.data || [];
    const prevMonthsReservations = prevMonthsReservationsRes.data || [];
    const allPayments = allPaymentsRes.data || [];

    setReservations(resData);
    setTransactions(transDataRes.data || []);

    // Fetch agency details for current month
    let currentMonthDetails: AgencyReservationDetail[] = [];
    if (resData.length > 0) {
      const resIds = resData.map(r => r.id);
      const { data: detailsData } = await supabase
        .from('agency_reservation_details')
        .select('*')
        .in('reservation_id', resIds);

      currentMonthDetails = detailsData || [];
      setAgencyDetails(currentMonthDetails);
    } else {
      setAgencyDetails([]);
    }

    // Calculate carryover balance from previous months
    let prevMonthsCarryoverDebt = 0;
    if (prevMonthsReservations.length > 0) {
      const prevReservationIds = prevMonthsReservations.map(r => r.id);
      const { data: prevDetailsData } = await supabase
        .from('agency_reservation_details')
        .select('reservation_id, company_amount')
        .in('reservation_id', prevReservationIds);
      
      const prevDetails = prevDetailsData || [];
      
      // Calculate total debt from previous months completed reservations
      // Debt = company_amount (admin price) - passenger_cash_amount
      prevMonthsReservations.forEach(r => {
        const detail = prevDetails.find(d => d.reservation_id === r.id);
        const companyAmount = detail?.company_amount || 0;
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

    setLoading(false);
  }, [agencyId, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals - only count reservations where agency_price_currency matches agency's currency
  const agencyCurrencyCode = agency?.currency || agencyCurrency || 'EUR';
  
  const totalReservations = reservations.length;
  const completedReservations = reservations.filter(r => r.status === 'completed').length;
  
  // Filter to only include details in agency's currency
  const matchingDetails = agencyDetails.filter(d => 
    !d.agency_price_currency || d.agency_price_currency === agencyCurrencyCode
  );
  
  const totalCompanyAmount = matchingDetails.reduce((sum, d) => sum + (d.company_amount || 0), 0);
  const paidCount = agencyDetails.filter(d => d.payment_status === 'paid').length;
  const pendingPayments = agencyDetails.filter(d => d.payment_status !== 'paid').length;
  
  // Calculate passenger cash amounts (reduces agency debt)
  const totalPassengerCash = reservations
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.passenger_cash_amount || 0), 0);
  
  // Current month debt = company amount - passenger cash
  const currentMonthDebt = totalCompanyAmount - totalPassengerCash;
  
  // Total balance = carryover + current month debt
  const totalBalance = carryoverBalance + currentMonthDebt;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/agency')} 
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-serif">{t('agencyReports')}</h1>
          {agency && <p className="text-sm opacity-80">{agency.agency_name}</p>}
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-4xl space-y-6">
        {/* Current Balance */}
        <Card className={agency && agency.balance < 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('currentBalance')}</p>
                  <p className={`text-3xl font-bold ${agency && agency.balance < 0 ? 'text-destructive' : 'text-primary'}`}>
                    {currencySymbol}{agency?.balance?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
              {agency && agency.balance < 0 && (
                <Badge variant="destructive">{t('insufficientBalance')}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Month Navigator */}
        <MonthNavigator 
          currentMonth={currentMonth}
          onPreviousMonth={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          onNextMonth={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Carryover Balance Card */}
          {carryoverBalance !== 0 && (
            <Card className={carryoverBalance > 0 ? 'border-blue-500/50' : 'border-green-500/50'}>
              <CardContent className="pt-6 text-center">
                <History className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className={`text-2xl font-bold ${carryoverBalance > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                  {currencySymbol}{carryoverBalance.toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">{t('carryoverBalance') || 'Devir Bakiye'}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{totalReservations}</p>
              <p className="text-sm text-muted-foreground">{t('totalReservations')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{completedReservations}</p>
              <p className="text-sm text-muted-foreground">{t('completed')}</p>
            </CardContent>
          </Card>

          <Card className={totalBalance > 0 ? 'border-orange-500 border-2' : ''}>
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold text-orange-600">{currencySymbol}{totalBalance.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">{t('totalDebt') || 'Güncel Bakiye'}</p>
              {totalPassengerCash > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  -{currencySymbol}{totalPassengerCash.toFixed(0)} {t('passengerCash')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('financialSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {carryoverBalance !== 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">{t('carryoverBalance') || 'Devir Bakiye'}</span>
                <span className={`font-semibold ${carryoverBalance > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                  {currencySymbol}{carryoverBalance.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('agencyExpense')} ({t('thisMonth') || 'Bu Ay'})</span>
              <span className="font-semibold">{currencySymbol}{totalCompanyAmount.toFixed(2)}</span>
            </div>
            {totalPassengerCash > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">{t('passengerCashDeducted')}</span>
                <span className="font-semibold text-green-600">-{currencySymbol}{totalPassengerCash.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('thisMonthDebt') || 'Bu Ay Borç'}</span>
              <span className="font-semibold text-orange-600">{currencySymbol}{currentMonthDebt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b bg-muted/30 px-2 -mx-2 rounded">
              <span className="font-medium">{t('totalDebt') || 'Güncel Bakiye'}</span>
              <span className={`font-bold text-lg ${totalBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {currencySymbol}{totalBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">{t('pendingPayments')}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{pendingPayments}</span>
                <span className="text-muted-foreground">/ {agencyDetails.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('recentBalanceTransactions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('noTransactionsYet')}</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'top_up' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.type === 'top_up' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {tx.type === 'top_up' ? t('balanceTopUp') : t('deduction')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tx.description || format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'top_up' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'top_up' ? '+' : '-'}{currencySymbol}{Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('balance')}: {currencySymbol}{tx.balance_after.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AgencyReports;
