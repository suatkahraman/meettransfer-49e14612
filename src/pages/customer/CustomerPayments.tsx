import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import { motion, AnimatePresence } from 'framer-motion';
import meetTransferLogo from '@/assets/meet-transfer-logo.webp';

// Components
import { BulkPaymentPanel } from '@/components/customer/BulkPaymentPanel';
import { CustomerPaymentStatsCard } from '@/components/customer/payments/CustomerPaymentStatsCard';
import { PaymentHistoryCard } from '@/components/customer/payments/PaymentHistoryCard';

// Hooks
import { useCustomerPayments } from '@/hooks/useCustomerPayments';

const translations = {
  EN: {
    title: 'Payments',
    subtitle: 'Manage your transfer payments',
    payNow: 'Pay Now',
    paymentHistory: 'History',
    noPayments: 'No payment history yet',
    loading: 'Loading...',
  },
  TR: {
    title: 'Ödemeler',
    subtitle: 'Transfer ödemelerinizi yönetin',
    payNow: 'Şimdi Öde',
    paymentHistory: 'Geçmiş',
    noPayments: 'Henüz ödeme geçmişi yok',
    loading: 'Yükleniyor...',
  },
};

const CustomerPayments = () => {
  const { signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pay');

  const lang = language === 'TR' ? 'TR' : 'EN';
  const t = translations[lang];

  const {
    unpaidReservations,
    paidReservations,
    stats,
    loading,
    refreshing,
    handleRefresh,
  } = useCustomerPayments({ language: lang });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <img 
              src={meetTransferLogo} 
              alt="Meet Transfer" 
              className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
            />
            <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
          </div>
          <p className="text-muted-foreground text-sm">{t.loading}</p>
        </motion.div>
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
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
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
      <main className="flex-1 container mx-auto py-4 px-3 max-w-2xl space-y-4">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </motion.div>

        {/* Stats Card */}
        <CustomerPaymentStatsCard stats={stats} language={lang} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pay" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{t.payNow}</span>
              <span className="sm:hidden">Öde</span>
              {unpaidReservations.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs">
                  {unpaidReservations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">{t.paymentHistory}</span>
              <span className="sm:hidden">Geçmiş</span>
              {paidReservations.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {paidReservations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pay Now Tab */}
          <TabsContent value="pay" className="space-y-4">
            <BulkPaymentPanel
              reservations={unpaidReservations}
              onPaymentComplete={handleRefresh}
              language={lang}
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
                <div className="space-y-3">
                  {paidReservations.map((reservation, index) => (
                    <PaymentHistoryCard
                      key={reservation.id}
                      reservation={reservation}
                      index={index}
                      language={lang}
                      onRefresh={handleRefresh}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CustomerPayments;
