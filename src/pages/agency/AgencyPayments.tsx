import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgencyLanguage } from '@/contexts/AgencyLanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  CreditCard, 
  Loader2, 
  Home, 
  LogOut, 
  History,
  ShoppingCart,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import meetTransferLogo from '@/assets/meet-transfer-logo.webp';
import { AgencyBulkPaymentPanel } from '@/components/agency/AgencyBulkPaymentPanel';
import { AgencyBottomNav } from '@/components/agency/AgencyBottomNav';
import { useAgencyPayments } from '@/hooks/useAgencyPayments';
import { AgencyPaymentStatsCard } from '@/components/agency/payments/AgencyPaymentStatsCard';
import { AgencyPaymentHistoryCard } from '@/components/agency/payments/AgencyPaymentHistoryCard';
import { AgencyMonthlyStatementButton } from '@/components/agency/payments/AgencyMonthlyStatementButton';

const translations = {
  TR: {
    title: 'Ödemeler',
    subtitle: 'Rezervasyon ödemelerinizi yönetin',
    payNow: 'Şimdi Öde',
    paymentHistory: 'Ödeme Geçmişi',
    noPayments: 'Henüz ödeme geçmişi yok',
    loading: 'Yükleniyor...',
    refresh: 'Yenile',
  },
  EN: {
    title: 'Payments',
    subtitle: 'Manage your reservation payments',
    payNow: 'Pay Now',
    paymentHistory: 'Payment History',
    noPayments: 'No payment history yet',
    loading: 'Loading...',
    refresh: 'Refresh',
  },
};

const AgencyPayments = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { language: agencyLanguage } = useAgencyLanguage();
  
  // Convert agency language to TR/EN for the hook
  const language = agencyLanguage === 'TR' ? 'TR' : 'EN';
  
  const {
    unpaidReservations,
    paidReservations,
    stats,
    agencyId,
    agencyName,
    loading,
    refreshing,
    handleRefresh,
    getCompanyAmount,
    getCurrency,
  } = useAgencyPayments({ language });

  const t = useMemo(() => translations[language], [language]);

  if (loading) {
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

        {/* Stats Card */}
        <AgencyPaymentStatsCard stats={stats} language={language} />

        {/* Tabs */}
        <Tabs defaultValue="pay" className="space-y-4 mt-4">
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
                onPaymentComplete={handleRefresh}
                language={language}
              />
            )}
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="history" className="space-y-4">
            {/* Monthly Statement Download */}
            <AgencyMonthlyStatementButton
              agencyName={agencyName}
              paidReservations={paidReservations}
              language={language}
              getCompanyAmount={getCompanyAmount}
              getCurrency={getCurrency}
            />
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
                  <AgencyPaymentHistoryCard
                    key={reservation.id}
                    reservation={reservation}
                    index={index}
                    onClick={() => navigate(`/agency/reservation/${reservation.id}`)}
                    language={language}
                    agencyName={agencyName}
                  />
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
