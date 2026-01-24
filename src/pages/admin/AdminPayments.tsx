import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  CreditCard, 
  Loader2, 
  RefreshCw,
  Building2,
  User,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Custom hook
import { useAdminPayments } from '@/hooks/useAdminPayments';

// Components
import { PaymentStatsCards } from '@/components/admin/payments/PaymentStatsCards';
import { PaymentFilters } from '@/components/admin/payments/PaymentFilters';
import { CustomerPaymentCard } from '@/components/admin/payments/CustomerPaymentCard';
import { AgencyPaymentCard } from '@/components/admin/payments/AgencyPaymentCard';
import { CustomerPaymentTable, AgencyPaymentTable } from '@/components/admin/payments/PaymentTable';

// Utils
import { exportPaymentsToExcel } from '@/utils/exportPayments';

const AdminPayments = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'customer' | 'agency'>('customer');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');

  const {
    customerPayments,
    agencyPayments,
    allCustomerPayments,
    allAgencyPayments,
    stats,
    loading,
    refreshing,
    handleRefresh,
    availableProviders,
    availableCurrencies,
  } = useAdminPayments({
    searchQuery,
    statusFilter,
    dateFilter,
    providerFilter,
    currencyFilter,
  });

  const handleExport = useCallback(async () => {
    try {
      await exportPaymentsToExcel(
        activeTab === 'customer' ? customerPayments : allCustomerPayments,
        activeTab === 'agency' ? agencyPayments : allAgencyPayments,
        activeTab
      );
      toast.success('Excel dosyası indirildi');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export sırasında hata oluştu');
    }
  }, [activeTab, customerPayments, agencyPayments, allCustomerPayments, allAgencyPayments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-3 px-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Online Ödemeler</h1>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      <main className="container mx-auto py-4 px-3 max-w-6xl space-y-6">
        {/* Statistics Cards */}
        <PaymentStatsCards stats={stats} />

        {/* Filters */}
        <PaymentFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          providerFilter={providerFilter}
          onProviderChange={setProviderFilter}
          currencyFilter={currencyFilter}
          onCurrencyChange={setCurrencyFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          availableProviders={availableProviders}
          availableCurrencies={availableCurrencies}
          onExport={handleExport}
          activeTab={activeTab}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'customer' | 'agency')} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Müşteri Ödemeleri</span>
              <span className="sm:hidden">Müşteri</span>
              <Badge variant="secondary" className="ml-1">
                {customerPayments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="agency" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Acenta Ödemeleri</span>
              <span className="sm:hidden">Acenta</span>
              <Badge variant="secondary" className="ml-1">
                {agencyPayments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Customer Payments Tab */}
          <TabsContent value="customer" className="space-y-3">
            {customerPayments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Ödeme bulunamadı</p>
                </CardContent>
              </Card>
            ) : viewMode === 'table' ? (
              <CustomerPaymentTable payments={customerPayments} />
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {customerPayments.map((payment, index) => (
                    <CustomerPaymentCard key={payment.id} payment={payment} index={index} />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Agency Payments Tab */}
          <TabsContent value="agency" className="space-y-3">
            {agencyPayments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Acenta ödemesi bulunamadı</p>
                </CardContent>
              </Card>
            ) : viewMode === 'table' ? (
              <AgencyPaymentTable payments={agencyPayments} />
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {agencyPayments.map((payment, index) => (
                    <AgencyPaymentCard key={payment.id} payment={payment} index={index} />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPayments;
