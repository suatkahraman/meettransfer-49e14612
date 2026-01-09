import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, TrendingUp, DollarSign, CreditCard, Wallet, CheckCircle, Clock, Calendar, History } from 'lucide-react';
import { MonthNavigator } from '@/components/accounting/MonthNavigator';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { calculateCurrencyBalances, CurrencyBalance, getCurrencySymbol } from '@/lib/currency';

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [agency, setAgency] = useState<{ agency_name: string; balance: number; currency: string } | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agencyDetails, setAgencyDetails] = useState<AgencyReservationDetail[]>([]);
  const [transactions, setTransactions] = useState<AgencyTransaction[]>([]);
  const [carryoverBalances, setCarryoverBalances] = useState<CurrencyBalance[]>([]);
  const [currentMonthBalances, setCurrentMonthBalances] = useState<CurrencyBalance[]>([]);

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

    // Fetch agency details for current month completed reservations
    const currentMonthCompleted = resData.filter(r => r.status === 'completed');
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

    // Current month payments
    const currentMonthPayments = allPayments.filter(p => 
      p.payment_date >= monthStart && p.payment_date <= monthEnd
    );

    // Calculate current month balances using shared helper
    const currentMonthReservationsWithDetails = currentMonthCompleted.map(r => {
      const detail = currentMonthDetails.find(d => d.reservation_id === r.id);
      return {
        passenger_cash_amount: r.passenger_cash_amount,
        passenger_cash_currency: r.passenger_cash_currency,
        agency_reservation_details: detail ? {
          company_amount: detail.company_amount,
          agency_price_currency: detail.agency_price_currency
        } : null
      };
    });

    const currentBalances = calculateCurrencyBalances(
      currentMonthReservationsWithDetails,
      currentMonthPayments.map(p => ({ amount: p.amount, currency: p.currency }))
    );
    setCurrentMonthBalances(currentBalances);

    // Calculate carryover balances (previous months)
    if (prevMonthsReservations.length > 0) {
      const prevReservationIds = prevMonthsReservations.map(r => r.id);
      const { data: prevDetailsData } = await supabase
        .from('agency_reservation_details')
        .select('reservation_id, company_amount, agency_price_currency')
        .in('reservation_id', prevReservationIds);
      
      const prevDetails = prevDetailsData || [];
      
      // Build data for calculateCurrencyBalances
      const prevReservationsWithDetails = prevMonthsReservations.map(r => {
        const detail = prevDetails.find(d => d.reservation_id === r.id);
        return {
          passenger_cash_amount: r.passenger_cash_amount,
          passenger_cash_currency: r.passenger_cash_currency,
          agency_reservation_details: detail ? {
            company_amount: detail.company_amount,
            agency_price_currency: detail.agency_price_currency
          } : null
        };
      });

      // Previous months payments
      const prevMonthsPayments = allPayments.filter(p => p.payment_date < monthStart);

      const carryover = calculateCurrencyBalances(
        prevReservationsWithDetails,
        prevMonthsPayments.map(p => ({ amount: p.amount, currency: p.currency }))
      );
      setCarryoverBalances(carryover);
    } else {
      // Still check for payments before this month without reservations
      const prevMonthsPayments = allPayments.filter(p => p.payment_date < monthStart);
      if (prevMonthsPayments.length > 0) {
        const carryover = calculateCurrencyBalances(
          [],
          prevMonthsPayments.map(p => ({ amount: p.amount, currency: p.currency }))
        );
        setCarryoverBalances(carryover);
      } else {
        setCarryoverBalances([]);
      }
    }

    setLoading(false);
  }, [agencyId, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals
  const totalReservations = reservations.length;
  const completedReservations = reservations.filter(r => r.status === 'completed').length;
  const paidCount = agencyDetails.filter(d => d.payment_status === 'paid').length;
  const pendingPayments = agencyDetails.filter(d => d.payment_status !== 'paid').length;
  
  // Combine carryover + current month for total balance per currency
  const combinedBalances: CurrencyBalance[] = [];
  const allCurrencies = new Set([
    ...carryoverBalances.map(cb => cb.currency),
    ...currentMonthBalances.map(cb => cb.currency)
  ]);
  
  allCurrencies.forEach(currency => {
    const carryover = carryoverBalances.find(cb => cb.currency === currency);
    const current = currentMonthBalances.find(cb => cb.currency === currency);
    
    const totalCompanyAmount = (carryover?.totalCompanyAmount || 0) + (current?.totalCompanyAmount || 0);
    const totalPassengerCash = (carryover?.totalPassengerCash || 0) + (current?.totalPassengerCash || 0);
    const totalPaid = (carryover?.totalPaid || 0) + (current?.totalPaid || 0);
    const netBalance = totalCompanyAmount - totalPassengerCash - totalPaid;
    
    if (netBalance !== 0 || totalCompanyAmount > 0) {
      combinedBalances.push({
        currency,
        totalCompanyAmount,
        totalPassengerCash,
        totalPaid,
        netBalance
      });
    }
  });
  
  combinedBalances.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));

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
        {/* Para Birimi Bazlı Güncel Bakiye Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {combinedBalances.length > 0 ? (
            combinedBalances.map(cb => {
              const symbol = getCurrencySymbol(cb.currency);
              return (
                <Card key={`current-${cb.currency}`} className={cb.netBalance > 0 ? 'border-orange-500/50 border-2' : 'border-green-500/50 border-2'}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cb.netBalance > 0 ? 'bg-orange-100' : 'bg-green-100'}`}>
                        <Wallet className={`h-5 w-5 ${cb.netBalance > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                      </div>
                      <Badge variant="outline" className="font-mono">{cb.currency}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{t('currentBalance') || 'Güncel Bakiye'}</p>
                    <p className={`text-2xl font-bold ${cb.netBalance > 0 ? 'text-orange-600' : cb.netBalance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {symbol}{Math.abs(cb.netBalance).toFixed(2)}
                    </p>
                    {cb.netBalance > 0 && (
                      <p className="text-xs text-orange-600 mt-1">{t('amountOwed') || 'Borç'}</p>
                    )}
                    {cb.netBalance < 0 && (
                      <p className="text-xs text-green-600 mt-1">{t('creditBalance') || 'Alacak'}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center">
                <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-lg font-medium text-gray-500">{t('noBalance') || 'Bakiye Yok'}</p>
                <p className="text-sm text-muted-foreground">{t('noCompletedReservations') || 'Tamamlanmış rezervasyon yok'}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Month Navigator */}
        <MonthNavigator 
          currentMonth={currentMonth}
          onPreviousMonth={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          onNextMonth={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Carryover Balance Cards - Para birimi bazlı ayrı kartlar */}
          {carryoverBalances
            .filter(cb => cb.netBalance !== 0)
            .sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance))
            .map(cb => {
              const symbol = getCurrencySymbol(cb.currency);
              return (
                <Card key={`carryover-${cb.currency}`} className={cb.netBalance > 0 ? 'border-blue-500/50 border-2' : 'border-green-500/50 border-2'}>
                  <CardContent className="pt-6 text-center">
                    <History className={`h-8 w-8 mx-auto mb-2 ${cb.netBalance > 0 ? 'text-blue-500' : 'text-green-500'}`} />
                    <p className={`text-2xl font-bold ${cb.netBalance > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                      {symbol}{Math.abs(cb.netBalance).toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('carryoverBalance') || 'Devir'} ({cb.currency})
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cb.netBalance > 0 ? (t('debt') || 'Borç') : (t('credit') || 'Alacak')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}

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

          {/* Para birimi bazlı bu ay bakiye kartları */}
          {currentMonthBalances.length > 0 ? (
            currentMonthBalances.map(cb => {
              const symbol = getCurrencySymbol(cb.currency);
              return (
                <Card key={`month-${cb.currency}`} className={cb.netBalance > 0 ? 'border-orange-500 border-2' : ''}>
                  <CardContent className="pt-6 text-center">
                    <DollarSign className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                    <p className={`text-2xl font-bold ${cb.netBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {symbol}{Math.abs(cb.netBalance).toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {cb.netBalance > 0 ? (t('totalDebt') || 'Borç') : (t('credit') || 'Alacak')} ({cb.currency})
                    </p>
                    {cb.totalPassengerCash > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        -{symbol}{cb.totalPassengerCash.toFixed(0)} {t('passengerCash')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-2xl font-bold text-gray-500">{t('settled') || 'Hesaplaşıldı'}</p>
                <p className="text-sm text-muted-foreground">{t('noDebt') || 'Bakiye yok'}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Financial Summary - Para birimi bazlı */}
        <Card>
          <CardHeader>
            <CardTitle>{t('financialSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Para birimi bazlı devir bakiye */}
            {carryoverBalances
              .filter(cb => cb.netBalance !== 0)
              .map(cb => {
                const symbol = getCurrencySymbol(cb.currency);
                return (
                  <div key={`carryover-detail-${cb.currency}`} className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t('carryoverBalance') || 'Devir Bakiye'} ({cb.currency})</span>
                    <span className={`font-semibold ${cb.netBalance > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                      {symbol}{cb.netBalance.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            
            {/* Para birimi bazlı bu ay detayları */}
            {currentMonthBalances.map(cb => {
              const symbol = getCurrencySymbol(cb.currency);
              return (
                <div key={`month-detail-${cb.currency}`} className="space-y-2 py-2 border-b">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('agencyExpense')} ({cb.currency})</span>
                    <span className="font-semibold">{symbol}{cb.totalCompanyAmount.toFixed(2)}</span>
                  </div>
                  {cb.totalPassengerCash > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('passengerCashDeducted')} ({cb.currency})</span>
                      <span className="font-semibold text-green-600">-{symbol}{cb.totalPassengerCash.toFixed(2)}</span>
                    </div>
                  )}
                  {cb.totalPaid > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('paid')} ({cb.currency})</span>
                      <span className="font-semibold text-green-600">-{symbol}{cb.totalPaid.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">{t('netDebt') || 'Net Borç'} ({cb.currency})</span>
                    <span className={`font-bold ${cb.netBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {symbol}{cb.netBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {currentMonthBalances.length === 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">{t('thisMonthDebt') || 'Bu Ay Borç'}</span>
                <span className="font-semibold text-gray-500">0.00</span>
              </div>
            )}
            
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
                        {tx.type === 'top_up' ? '+' : '-'}{tx.currency === 'TRY' ? '₺' : tx.currency === 'EUR' ? '€' : tx.currency === 'USD' ? '$' : tx.currency}{Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('balance')}: {tx.currency === 'TRY' ? '₺' : tx.currency === 'EUR' ? '€' : tx.currency === 'USD' ? '$' : tx.currency}{tx.balance_after.toFixed(2)}
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
