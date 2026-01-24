import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  CreditCard, 
  Loader2, 
  Home, 
  LogOut, 
  CheckCircle,
  Clock,
  Banknote,
  History,
  ShoppingCart,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import meetTransferLogo from '@/assets/meet-transfer-logo.webp';
import { AgencyBulkPaymentPanel, type AgencyPayableReservation } from '@/components/agency/AgencyBulkPaymentPanel';
import { formatCurrency } from '@/lib/currency';
import { AgencyBottomNav } from '@/components/agency/AgencyBottomNav';

interface PaymentHistoryItem extends AgencyPayableReservation {
  payment_provider: string | null;
  payment_completed_at: string | null;
}

const translations = {
  TR: {
    title: 'Ödemeler',
    subtitle: 'Rezervasyon ödemelerinizi yönetin',
    payNow: 'Şimdi Öde',
    paymentHistory: 'Ödeme Geçmişi',
    noPayments: 'Henüz ödeme geçmişi yok',
    paid: 'Ödendi',
    pending: 'Bekliyor',
    cashToDriver: 'Şoföre Nakit',
    paymentSuccess: 'Ödeme başarılı!',
    paymentCancelled: 'Ödeme iptal edildi',
    loading: 'Yükleniyor...',
    refresh: 'Yenile',
    companyAmount: 'Şirket Tutarı',
    customer: 'Müşteri',
  },
  EN: {
    title: 'Payments',
    subtitle: 'Manage your reservation payments',
    payNow: 'Pay Now',
    paymentHistory: 'Payment History',
    noPayments: 'No payment history yet',
    paid: 'Paid',
    pending: 'Pending',
    cashToDriver: 'Cash to Driver',
    paymentSuccess: 'Payment successful!',
    paymentCancelled: 'Payment was cancelled',
    loading: 'Loading...',
    refresh: 'Refresh',
    companyAmount: 'Company Amount',
    customer: 'Customer',
  },
};

const AgencyPayments = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { agencyId } = useUserRole();
  const { language: agencyLang } = useAgencyTranslations();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reservations, setReservations] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pay');

  const language = agencyLang === 'TR' ? 'TR' : 'EN';
  const t = useMemo(() => translations[language], [language]);

  // Check for payment result from redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');

    if (success === 'true') {
      toast.success(t.paymentSuccess);
      navigate('/agency/payments', { replace: true });
    } else if (cancelled === 'true') {
      toast.info(t.paymentCancelled);
      navigate('/agency/payments', { replace: true });
    }
  }, [searchParams, navigate, t]);

  const fetchReservations = useCallback(async () => {
    if (!agencyId) return;

    try {
      // Fetch agency reservations with agency_reservation_details
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_code,
          pickup,
          dropoff,
          pickup_place_name,
          dropoff_place_name,
          pickup_date,
          pickup_time,
          customer_name,
          price,
          price_currency,
          payment_status,
          payment_provider,
          payment_completed_at,
          status,
          agency_reservation_details (
            customer_price,
            company_amount,
            agency_price_currency,
            payment_status
          )
        `)
        .eq('agency_id', agencyId)
        .not('status', 'in', '("cancelled","cancelled_by_customer")')
        .order('pickup_date', { ascending: false });

      if (error) {
        console.error('Failed to fetch agency reservations:', error);
        toast.error('Failed to load reservations');
        return;
      }

      if (data) {
        setReservations(data as PaymentHistoryItem[]);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agencyId]);

  useEffect(() => {
    if (!authLoading && agencyId) {
      fetchReservations();
    } else if (!authLoading && !agencyId) {
      setLoading(false);
    }
  }, [authLoading, agencyId, fetchReservations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  // Split reservations into unpaid and paid
  const { unpaidReservations, paidReservations } = useMemo(() => {
    const unpaid: AgencyPayableReservation[] = [];
    const paid: PaymentHistoryItem[] = [];

    reservations.forEach(r => {
      const agencyPaymentStatus = r.agency_reservation_details?.payment_status;
      const companyAmount = r.agency_reservation_details?.company_amount;

      if (agencyPaymentStatus === 'paid' || r.payment_status === 'paid' || r.payment_status === 'pay_on_transfer') {
        paid.push(r);
      } else if (
        companyAmount && 
        companyAmount > 0 && 
        !['cancelled', 'cancelled_by_customer', 'customer_rejected', 'completed'].includes(r.status)
      ) {
        unpaid.push(r);
      }
    });

    // Sort paid by payment date (most recent first)
    paid.sort((a, b) => {
      if (a.payment_completed_at && b.payment_completed_at) {
        return new Date(b.payment_completed_at).getTime() - new Date(a.payment_completed_at).getTime();
      }
      return new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime();
    });

    return { unpaidReservations: unpaid, paidReservations: paid };
  }, [reservations]);

  const getPaymentStatusBadge = (reservation: PaymentHistoryItem) => {
    const status = reservation.agency_reservation_details?.payment_status || reservation.payment_status;
    const provider = reservation.payment_provider;

    if (status === 'paid') {
      return (
        <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.paid} {provider && `(${provider})`}
        </Badge>
      );
    }
    if (status === 'pay_on_transfer') {
      return (
        <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
          <Banknote className="h-3 w-3 mr-1" />
          {t.cashToDriver}
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
        <Clock className="h-3 w-3 mr-1" />
        {t.pending}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img 
              src={meetTransferLogo} 
              alt="Meet Transfer" 
              className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
            />
            <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
          </div>
          <p className="text-muted-foreground text-sm">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5 pb-20 sm:pb-0">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-primary text-primary-foreground py-3 px-4 flex justify-between items-center shadow-lg sticky top-0 z-50"
      >
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/agency')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={meetTransferLogo} alt="Meet Transfer" className="h-7 w-auto" />
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/agency')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <Home className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-4 px-3 max-w-2xl">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pay" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t.payNow}
              {unpaidReservations.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unpaidReservations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t.paymentHistory}
            </TabsTrigger>
          </TabsList>

          {/* Pay Now Tab */}
          <TabsContent value="pay" className="space-y-4">
            {agencyId && (
              <AgencyBulkPaymentPanel
                reservations={unpaidReservations}
                agencyId={agencyId}
                onPaymentComplete={fetchReservations}
                language={language}
              />
            )}
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="history" className="space-y-3">
            <AnimatePresence>
              {paidReservations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="border-dashed">
                    <CardContent className="pt-6 text-center">
                      <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">{t.noPayments}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                paidReservations.map((reservation, index) => (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => navigate(`/agency/reservation/${reservation.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {reservation.reservation_code && (
                                <Badge variant="outline" className="text-xs">
                                  #{reservation.reservation_code}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(reservation.pickup_date), 'dd MMM yyyy')}
                              </span>
                            </div>
                            <p className="text-sm font-medium truncate">
                              {reservation.pickup_place_name || reservation.pickup} → {reservation.dropoff_place_name || reservation.dropoff}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {t.customer}: {reservation.customer_name}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-primary">
                                {formatCurrency(
                                  reservation.agency_reservation_details?.company_amount || reservation.price,
                                  reservation.agency_reservation_details?.agency_price_currency || reservation.price_currency
                                )}
                              </span>
                              {getPaymentStatusBadge(reservation)}
                            </div>
                            {reservation.payment_completed_at && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(reservation.payment_completed_at), 'dd MMM yyyy HH:mm')}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <AgencyBottomNav />
    </div>
  );
};

export default AgencyPayments;
