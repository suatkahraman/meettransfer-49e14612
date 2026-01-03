import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { useAgencyLanguage, AGENCY_CURRENCIES } from '@/contexts/AgencyLanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, TrendingUp, DollarSign, CreditCard, Wallet, CheckCircle, Clock, Calendar } from 'lucide-react';
import { MonthNavigator } from '@/components/accounting/MonthNavigator';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface AgencyReservationDetail {
  id: string;
  reservation_id: string;
  customer_price: number;
  company_amount: number;
  agency_profit: number;
  payment_status: string;
}

interface Reservation {
  id: string;
  reservation_code: string | null;
  status: string;
  pickup_date: string;
}

interface AgencyTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  balance_after: number;
  created_at: string;
}

const AgencyReports = () => {
  const { agencyId } = useUserRole();
  const { t } = useAgencyTranslations();
  const { currencySymbol } = useAgencyLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [agency, setAgency] = useState<{ agency_name: string; balance: number } | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agencyDetails, setAgencyDetails] = useState<AgencyReservationDetail[]>([]);
  const [transactions, setTransactions] = useState<AgencyTransaction[]>([]);

  const fetchData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);

    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    // Fetch agency info
    const { data: agencyData } = await supabase
      .from('agencies')
      .select('agency_name, balance')
      .eq('id', agencyId)
      .single();

    if (agencyData) {
      setAgency(agencyData);
    }

    // Fetch reservations for the month
    const { data: resData } = await supabase
      .from('reservations')
      .select('id, reservation_code, status, pickup_date')
      .eq('agency_id', agencyId)
      .gte('pickup_date', monthStart)
      .lte('pickup_date', monthEnd);

    setReservations(resData || []);

    // Fetch agency details for these reservations
    if (resData && resData.length > 0) {
      const resIds = resData.map(r => r.id);
      const { data: detailsData } = await supabase
        .from('agency_reservation_details')
        .select('*')
        .in('reservation_id', resIds);

      setAgencyDetails(detailsData || []);
    } else {
      setAgencyDetails([]);
    }

    // Fetch recent transactions
    const { data: transData } = await supabase
      .from('agency_transactions')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(10);

    setTransactions(transData || []);

    setLoading(false);
  }, [agencyId, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals
  const totalReservations = reservations.length;
  const completedReservations = reservations.filter(r => r.status === 'completed').length;
  const totalCustomerRevenue = agencyDetails.reduce((sum, d) => sum + (d.customer_price || 0), 0);
  const totalCompanyAmount = agencyDetails.reduce((sum, d) => sum + (d.company_amount || 0), 0);
  const totalProfit = agencyDetails.reduce((sum, d) => sum + (d.agency_profit || 0), 0);
  const paidCount = agencyDetails.filter(d => d.payment_status === 'paid').length;
  const pendingPayments = agencyDetails.filter(d => d.payment_status !== 'paid').length;

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

          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{currencySymbol}{totalCustomerRevenue.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">{t('customerRevenue')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currencySymbol}{totalProfit.toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground">{t('agencyProfit')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('financialSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('customerRevenue')}</span>
              <span className="font-semibold">{currencySymbol}{totalCustomerRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('amountOwedToCompany')}</span>
              <span className="font-semibold text-orange-600">{currencySymbol}{totalCompanyAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('agencyProfit')}</span>
              <span className={`font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currencySymbol}{totalProfit.toFixed(2)}
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
                          {tx.description || format(new Date(tx.created_at), 'dd MMM yyyy HH:mm')}
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
