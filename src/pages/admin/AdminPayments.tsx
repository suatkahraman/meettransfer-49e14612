import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  CreditCard, 
  Loader2, 
  RefreshCw,
  CheckCircle,
  Clock,
  Banknote,
  Building2,
  User,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface CustomerPayment {
  id: string;
  reservation_code: string | null;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  price: number | null;
  price_currency: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  payment_completed_at: string | null;
  status: string;
}

interface AgencyPayment {
  id: string;
  agency_id: string;
  agency_name: string;
  amount: number;
  currency: string;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

interface Agency {
  id: string;
  agency_name: string;
}

const AdminPayments = () => {
  const navigate = useNavigate();
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [agencyPayments, setAgencyPayments] = useState<AgencyPayment[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('customer');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      // Fetch customer payments (reservations with online payment)
      const { data: customerData, error: customerError } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_code,
          customer_name,
          customer_phone,
          pickup,
          dropoff,
          pickup_date,
          price,
          price_currency,
          payment_status,
          payment_provider,
          payment_completed_at,
          status
        `)
        .in('payment_status', ['paid', 'pay_on_transfer', 'pending'])
        .not('payment_provider', 'is', null)
        .order('payment_completed_at', { ascending: false, nullsFirst: false });

      if (customerError) {
        console.error('Error fetching customer payments:', customerError);
      } else {
        setCustomerPayments(customerData || []);
      }

      // Fetch agencies first
      const { data: agenciesData } = await supabase
        .from('agencies')
        .select('id, agency_name');
      
      setAgencies(agenciesData || []);

      // Fetch agency payments
      const { data: agencyData, error: agencyError } = await supabase
        .from('agency_payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (agencyError) {
        console.error('Error fetching agency payments:', agencyError);
      } else {
        // Map agency names
        const paymentsWithNames = (agencyData || []).map(p => ({
          ...p,
          agency_name: agenciesData?.find(a => a.id === p.agency_id)?.agency_name || 'Bilinmiyor'
        }));
        setAgencyPayments(paymentsWithNames);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter customer payments
  const filteredCustomerPayments = useMemo(() => {
    let filtered = customerPayments;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.customer_name?.toLowerCase().includes(query) ||
        p.customer_phone?.includes(query) ||
        p.reservation_code?.toLowerCase().includes(query) ||
        p.pickup?.toLowerCase().includes(query) ||
        p.dropoff?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(p => {
        if (!p.payment_completed_at) return false;
        const paymentDate = new Date(p.payment_completed_at);
        if (dateFilter === 'today') return paymentDate >= startOfToday;
        if (dateFilter === 'week') return paymentDate >= startOfWeek;
        if (dateFilter === 'month') return paymentDate >= startOfMonth;
        return true;
      });
    }

    return filtered;
  }, [customerPayments, searchQuery, statusFilter, dateFilter]);

  // Filter agency payments
  const filteredAgencyPayments = useMemo(() => {
    let filtered = agencyPayments;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.agency_name?.toLowerCase().includes(query) ||
        p.notes?.toLowerCase().includes(query)
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(p => {
        const paymentDate = new Date(p.payment_date);
        if (dateFilter === 'today') return paymentDate >= startOfToday;
        if (dateFilter === 'week') return paymentDate >= startOfWeek;
        if (dateFilter === 'month') return paymentDate >= startOfMonth;
        return true;
      });
    }

    return filtered;
  }, [agencyPayments, searchQuery, dateFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const customerPaid = customerPayments.filter(p => p.payment_status === 'paid');
    const customerTotal = customerPaid.reduce((sum, p) => sum + (p.price || 0), 0);
    const agencyTotal = agencyPayments.reduce((sum, p) => sum + p.amount, 0);

    // Group by provider
    const byProvider: Record<string, number> = {};
    customerPaid.forEach(p => {
      const provider = p.payment_provider || 'unknown';
      byProvider[provider] = (byProvider[provider] || 0) + (p.price || 0);
    });

    return {
      customerCount: customerPaid.length,
      customerTotal,
      agencyCount: agencyPayments.length,
      agencyTotal,
      byProvider,
    };
  }, [customerPayments, agencyPayments]);

  const getPaymentStatusBadge = (status: string | null, provider: string | null) => {
    if (status === 'paid') {
      return (
        <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ödendi {provider && `(${provider})`}
        </Badge>
      );
    }
    if (status === 'pay_on_transfer') {
      return (
        <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
          <Banknote className="h-3 w-3 mr-1" />
          Nakit
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
        <Clock className="h-3 w-3 mr-1" />
        Bekliyor
      </Badge>
    );
  };

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
          <h1 className="text-lg font-semibold">Online Ödemeler</h1>
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

      <main className="container mx-auto py-4 px-3 max-w-6xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Müşteri Ödemeleri</p>
                  <p className="text-lg font-bold">{stats.customerCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Müşteri Toplam</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.customerTotal, 'EUR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Acenta Ödemeleri</p>
                  <p className="text-lg font-bold">{stats.agencyCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Acenta Toplam</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.agencyTotal, 'EUR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provider breakdown */}
        {Object.keys(stats.byProvider).length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ödeme Yöntemlerine Göre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.byProvider).map(([provider, total]) => (
                  <div key={provider} className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium capitalize">{provider}:</span>
                    <span className="text-sm font-bold">{formatCurrency(total, 'EUR')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="paid">Ödendi</SelectItem>
              <SelectItem value="pending">Bekliyor</SelectItem>
              <SelectItem value="pay_on_transfer">Nakit</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tarih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Zamanlar</SelectItem>
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="week">Son 7 Gün</SelectItem>
              <SelectItem value="month">Bu Ay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Müşteri Ödemeleri
              <Badge variant="secondary" className="ml-1">
                {filteredCustomerPayments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="agency" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Acenta Ödemeleri
              <Badge variant="secondary" className="ml-1">
                {filteredAgencyPayments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Customer Payments Tab */}
          <TabsContent value="customer" className="space-y-3">
            <AnimatePresence>
              {filteredCustomerPayments.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Ödeme bulunamadı</p>
                  </CardContent>
                </Card>
              ) : (
                filteredCustomerPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => navigate(`/admin/reservations/${payment.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {payment.reservation_code && (
                                <Badge variant="outline" className="text-xs">
                                  #{payment.reservation_code}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(payment.pickup_date), 'dd MMM yyyy', { locale: tr })}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{payment.customer_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {payment.pickup} → {payment.dropoff}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-primary">
                                {formatCurrency(payment.price, payment.price_currency)}
                              </span>
                              {getPaymentStatusBadge(payment.payment_status, payment.payment_provider)}
                            </div>
                            {payment.payment_completed_at && (
                              <p className="text-xs text-muted-foreground">
                                Ödeme: {format(new Date(payment.payment_completed_at), 'dd MMM yyyy HH:mm', { locale: tr })}
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

          {/* Agency Payments Tab */}
          <TabsContent value="agency" className="space-y-3">
            <AnimatePresence>
              {filteredAgencyPayments.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Acenta ödemesi bulunamadı</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAgencyPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => navigate(`/admin/agency-accounting/${payment.agency_id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                {payment.agency_name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: tr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-green-600">
                                +{formatCurrency(payment.amount, payment.currency)}
                              </span>
                              <Badge className="bg-green-500/20 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ödendi
                              </Badge>
                            </div>
                            {payment.notes && (
                              <p className="text-xs text-muted-foreground">{payment.notes}</p>
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

export default AdminPayments;
