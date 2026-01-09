import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencySymbol } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, RefreshCw, Calendar, MapPin, User, Wallet, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LocationDisplay } from '@/components/ui/location-display';

interface AgencyReservationDetail {
  company_amount: number | null;
  customer_price: number | null;
  agency_profit: number | null;
  agency_price_currency: string | null;
  payment_status: string | null;
}

interface CompletedReservation {
  id: string;
  reservation_code: string | null;
  customer_name: string;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  vehicle_type: string;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  agency_reservation_details: AgencyReservationDetail | null;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  currency: string | null;
}

interface CurrencySummary {
  totalCompanyAmount: number;
  totalPassengerCash: number;
  totalPaid: number;
  netBalance: number;
  reservationCount: number;
}

const AgencyCurrencyDetail = () => {
  const { currency } = useParams<{ currency: string }>();
  const { agencyId } = useUserRole();
  const { t, locale } = useAgencyTranslations();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<CompletedReservation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<CurrencySummary>({
    totalCompanyAmount: 0,
    totalPassengerCash: 0,
    totalPaid: 0,
    netBalance: 0,
    reservationCount: 0
  });

  const fetchData = useCallback(async (showRefresh = false) => {
    if (!agencyId || !currency) return;
    
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    // Fetch completed reservations with this currency
    const { data: resData, error: resError } = await supabase
      .from('reservations')
      .select(`
        id, reservation_code, customer_name, pickup, dropoff,
        pickup_place_name, dropoff_place_name,
        pickup_date, pickup_time, vehicle_type,
        passenger_cash_amount, passenger_cash_currency,
        agency_reservation_details!inner(company_amount, customer_price, agency_profit, agency_price_currency, payment_status)
      `)
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .order('pickup_date', { ascending: false });

    if (resError) {
      console.error('Error fetching reservations:', resError);
    }

    // Filter by currency
    const filteredRes = (resData || []).filter((r: any) => {
      const detail = r.agency_reservation_details;
      const resCurrency = detail?.agency_price_currency || 'TRY';
      return resCurrency === currency;
    }) as CompletedReservation[];

    setReservations(filteredRes);

    // Fetch payments with this currency
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('agency_payments')
      .select('id, amount, payment_date, notes, currency')
      .eq('agency_id', agencyId)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }

    // Filter payments by currency
    const filteredPayments = (paymentsData || []).filter(p => {
      const paymentCurrency = p.currency || 'TRY';
      return paymentCurrency === currency;
    });

    setPayments(filteredPayments);

    // Calculate summary
    let totalCompanyAmount = 0;
    let totalPassengerCash = 0;

    filteredRes.forEach(r => {
      const detail = r.agency_reservation_details;
      totalCompanyAmount += detail?.company_amount || 0;
      
      // Only count passenger cash if same currency
      const cashCurrency = r.passenger_cash_currency || 'TRY';
      if (cashCurrency === currency) {
        totalPassengerCash += r.passenger_cash_amount || 0;
      }
    });

    const totalPaid = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

    setSummary({
      totalCompanyAmount,
      totalPassengerCash,
      totalPaid,
      netBalance: totalCompanyAmount - totalPassengerCash - totalPaid,
      reservationCount: filteredRes.length
    });

    setLoading(false);
    setRefreshing(false);
  }, [agencyId, currency]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currencySymbol = getCurrencySymbol(currency);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/agency')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-serif font-bold flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-lg">
                {currency}
              </Badge>
              {t('currencyDetail') || 'Para Birimi Detayı'}
            </h1>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-2xl space-y-6">
        {/* Summary Card */}
        <Card className={cn(
          summary.netBalance > 0 
            ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800" 
            : summary.netBalance < 0 
              ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800"
              : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "p-3 rounded-full",
                summary.netBalance > 0 ? "bg-red-200 dark:bg-red-800/50" : "bg-green-200 dark:bg-green-800/50"
              )}>
                <Wallet className={cn(
                  "h-6 w-6",
                  summary.netBalance > 0 ? "text-red-600" : "text-green-600"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('netBalance') || 'Net Bakiye'}</p>
                <p className={cn(
                  "text-3xl font-bold",
                  summary.netBalance > 0 ? "text-destructive" : summary.netBalance < 0 ? "text-green-600" : ""
                )}>
                  {currencySymbol}{Math.abs(summary.netBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
                {summary.netBalance > 0 && (
                  <p className="text-xs text-destructive">{t('amountOwed') || 'Borç'}</p>
                )}
                {summary.netBalance < 0 && (
                  <p className="text-xs text-green-600">{t('creditBalance') || 'Alacak'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">{t('agencyExpense') || 'Acenta Tutarı'}</p>
                <p className="text-lg font-semibold">{currencySymbol}{summary.totalCompanyAmount.toLocaleString('tr-TR')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('passengerCash') || 'Yolcu Nakit'}</p>
                <p className="text-lg font-semibold text-green-600">-{currencySymbol}{summary.totalPassengerCash.toLocaleString('tr-TR')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('paid') || 'Ödenen'}</p>
                <p className="text-lg font-semibold text-blue-600">-{currencySymbol}{summary.totalPaid.toLocaleString('tr-TR')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('completedTransfers') || 'Transfer Sayısı'}</p>
                <p className="text-lg font-semibold">{summary.reservationCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Section */}
        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-blue-600" />
                {t('payments') || 'Ödemeler'} ({currency})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.map(payment => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-200 dark:bg-blue-800">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-300">
                        {currencySymbol}{payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale })}
                      </p>
                    </div>
                  </div>
                  {payment.notes && (
                    <p className="text-xs text-muted-foreground max-w-[120px] truncate">{payment.notes}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Reservations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('completedReservations') || 'Tamamlanan Rezervasyonlar'} ({reservations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('noCompletedReservations') || 'Bu para biriminde tamamlanmış rezervasyon yok'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map(reservation => {
                  const detail = reservation.agency_reservation_details;
                  return (
                    <div 
                      key={reservation.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/agency/reservation/${reservation.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          {reservation.reservation_code && (
                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                              {reservation.reservation_code}
                            </span>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{reservation.customer_name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {currencySymbol}{(detail?.company_amount || 0).toLocaleString('tr-TR')}
                          </p>
                          {detail?.payment_status && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                detail.payment_status === 'paid' 
                                  ? "bg-green-100 text-green-700 border-green-300"
                                  : "bg-amber-100 text-amber-700 border-amber-300"
                              )}
                            >
                              {detail.payment_status === 'paid' ? (t('paid') || 'Ödendi') : (t('pending') || 'Bekliyor')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(reservation.pickup_date), 'dd MMM yyyy', { locale })}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{reservation.pickup_time}</span>
                        </div>

                        <LocationDisplay
                          placeName={reservation.pickup_place_name}
                          address={reservation.pickup}
                          type="pickup"
                          size="sm"
                        />
                        <LocationDisplay
                          placeName={reservation.dropoff_place_name}
                          address={reservation.dropoff}
                          type="dropoff"
                          size="sm"
                        />

                        {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
                          <div className="pt-2 border-t flex items-center gap-2">
                            <span className="text-lg">💵</span>
                            <span className="font-semibold text-green-700">
                              {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount.toLocaleString('tr-TR')}
                            </span>
                            <span className="text-xs text-muted-foreground">({t('passengerCash') || 'Yolcu Nakit'})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AgencyCurrencyDetail;
