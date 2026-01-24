import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  CreditCard, 
  Loader2, 
  Home, 
  LogOut, 
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  History,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import meetTransferLogo from '@/assets/meet-transfer-logo.webp';
import { BulkPaymentPanel, type PayableReservation } from '@/components/customer/BulkPaymentPanel';
import { getCurrencySymbol, formatCurrency } from '@/lib/currency';

interface PaymentHistoryItem {
  id: string;
  reservation_code: string | null;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  price: number | null;
  price_currency: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  payment_completed_at: string | null;
  status: string;
}

const translations = {
  EN: {
    title: 'Payments',
    subtitle: 'Manage your transfer payments',
    payNow: 'Pay Now',
    paymentHistory: 'Payment History',
    unpaidReservations: 'Unpaid Reservations',
    noPayments: 'No payment history yet',
    noUnpaid: 'All reservations are paid',
    paid: 'Paid',
    pending: 'Pending',
    cashToDriver: 'Cash to Driver',
    paymentSuccess: 'Payment successful!',
    paymentCancelled: 'Payment was cancelled',
    via: 'via',
    loading: 'Loading...',
    route: 'Route',
    date: 'Date',
    amount: 'Amount',
  },
  TR: {
    title: 'Ödemeler',
    subtitle: 'Transfer ödemelerinizi yönetin',
    payNow: 'Şimdi Öde',
    paymentHistory: 'Ödeme Geçmişi',
    unpaidReservations: 'Ödenmemiş Rezervasyonlar',
    noPayments: 'Henüz ödeme geçmişi yok',
    noUnpaid: 'Tüm rezervasyonlar ödendi',
    paid: 'Ödendi',
    pending: 'Bekliyor',
    cashToDriver: 'Şoföre Nakit',
    paymentSuccess: 'Ödeme başarılı!',
    paymentCancelled: 'Ödeme iptal edildi',
    via: 'ile',
    loading: 'Yükleniyor...',
    route: 'Güzergah',
    date: 'Tarih',
    amount: 'Tutar',
  },
};

const CustomerPayments = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reservations, setReservations] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pay');

  const t = useMemo(() => 
    language === 'TR' ? translations.TR : translations.EN,
    [language]
  );

  // Check for payment result from redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');

    if (success === 'true') {
      toast.success(t.paymentSuccess);
      // Clear the URL params
      navigate('/customer/payments', { replace: true });
    } else if (cancelled === 'true') {
      toast.info(t.paymentCancelled);
      navigate('/customer/payments', { replace: true });
    }
  }, [searchParams, navigate, t]);

  const fetchReservations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-customer-reservations');

      if (error) {
        console.error('Failed to fetch reservations:', error);
        toast.error('Failed to load reservations');
        return;
      }

      if (data?.reservations) {
        setReservations(data.reservations);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchReservations();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchReservations]);

  // Split reservations into unpaid and paid
  const { unpaidReservations, paidReservations } = useMemo(() => {
    const unpaid: PayableReservation[] = [];
    const paid: PaymentHistoryItem[] = [];

    reservations.forEach(r => {
      if (r.payment_status === 'paid' || r.payment_status === 'pay_on_transfer') {
        paid.push(r);
      } else if (
        r.price && 
        r.price > 0 && 
        !['cancelled', 'cancelled_by_customer', 'customer_rejected', 'completed'].includes(r.status)
      ) {
        unpaid.push(r as PayableReservation);
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

  const getPaymentStatusBadge = (status: string | null, provider: string | null) => {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
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
            onClick={() => navigate('/customer')} 
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
            onClick={() => navigate('/')} 
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
            <BulkPaymentPanel
              reservations={unpaidReservations}
              onPaymentComplete={fetchReservations}
              language={language === 'TR' ? 'TR' : 'EN'}
            />
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
                      onClick={() => navigate(`/customer/reservation/${reservation.id}`)}
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-primary">
                                {formatCurrency(reservation.price, reservation.price_currency)}
                              </span>
                              {getPaymentStatusBadge(reservation.payment_status, reservation.payment_provider)}
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
    </div>
  );
};

export default CustomerPayments;
