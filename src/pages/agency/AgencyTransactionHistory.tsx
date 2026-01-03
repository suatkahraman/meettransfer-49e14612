import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { useAgencyLanguage } from '@/contexts/AgencyLanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, RefreshCw, ArrowUpCircle, ArrowDownCircle, Receipt, Calendar, Filter, X } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  balance_after: number;
  reservation_id: string | null;
  created_at: string;
}

const AgencyTransactionHistory = () => {
  const { agencyId } = useUserRole();
  const { t } = useAgencyTranslations();
  const { currencySymbol } = useAgencyLanguage();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (!agencyId) return;
    
    if (showRefresh) setRefreshing(true);

    // Fetch agency balance
    const { data: agencyData } = await supabase
      .from('agencies')
      .select('balance')
      .eq('id', agencyId)
      .single();

    if (agencyData) {
      setCurrentBalance(agencyData.balance || 0);
    }

    // Fetch transactions
    const { data, error } = await supabase
      .from('agency_transactions')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data || []);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (agencyId) {
      fetchData();
    }
  }, [agencyId]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }

      // Date filters
      const transactionDate = parseISO(transaction.created_at);
      
      if (startDate) {
        const start = startOfDay(parseISO(startDate));
        if (isBefore(transactionDate, start)) {
          return false;
        }
      }
      
      if (endDate) {
        const end = endOfDay(parseISO(endDate));
        if (isAfter(transactionDate, end)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, startDate, endDate]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setTypeFilter('all');
  };

  const hasActiveFilters = startDate || endDate || typeFilter !== 'all';

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'reservation_completed':
        return t('reservationCompleted') || 'Rezervasyon Tamamlandı';
      case 'payment':
        return t('payment') || 'Ödeme';
      case 'adjustment':
        return t('adjustment') || 'Düzeltme';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'reservation_completed':
        return 'bg-blue-500/20 text-blue-700';
      case 'payment':
        return 'bg-green-500/20 text-green-700';
      case 'adjustment':
        return 'bg-amber-500/20 text-amber-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

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
          <h1 className="text-xl font-serif font-bold">{t('transactionHistory') || 'İşlem Geçmişi'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9",
              hasActiveFilters && "bg-primary-foreground/20"
            )}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-2xl space-y-6">
        {/* Filters */}
        {showFilters && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {t('filters') || 'Filtreler'}
                </CardTitle>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                    <X className="h-4 w-4 mr-1" />
                    {t('clearFilters') || 'Temizle'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t('startDate') || 'Başlangıç'}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">{t('endDate') || 'Bitiş'}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Transaction Type */}
              <div className="space-y-2">
                <Label>{t('transactionType') || 'İşlem Tipi'}</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTypes') || 'Tüm İşlemler'}</SelectItem>
                    <SelectItem value="reservation_completed">{t('reservationCompleted') || 'Rezervasyon Tamamlandı'}</SelectItem>
                    <SelectItem value="payment">{t('payment') || 'Ödeme'}</SelectItem>
                    <SelectItem value="adjustment">{t('adjustment') || 'Düzeltme'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Balance Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{t('currentBalance') || 'Mevcut Bakiye'}</p>
              <p className={cn(
                "text-3xl font-bold",
                currentBalance > 0 ? "text-destructive" : currentBalance < 0 ? "text-green-600" : ""
              )}>
                {currentBalance > 0 ? '+' : ''}{currencySymbol}{Math.abs(currentBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
              {currentBalance > 0 && (
                <p className="text-sm text-destructive mt-1">{t('amountOwed') || 'Borçlu tutar'}</p>
              )}
              {currentBalance < 0 && (
                <p className="text-sm text-green-600 mt-1">{t('creditBalance') || 'Alacak bakiyesi'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {t('allTransactions') || 'Tüm İşlemler'}
              </span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="font-normal">
                  {filteredTransactions.length} / {transactions.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{hasActiveFilters ? (t('noMatchingTransactions') || 'Filtrelere uyan işlem bulunamadı') : (t('noTransactions') || 'Henüz işlem bulunmuyor')}</p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    {t('clearFilters') || 'Filtreleri Temizle'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {transaction.amount > 0 ? (
                          <ArrowUpCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-green-600" />
                        )}
                        <Badge className={getTransactionTypeColor(transaction.type)}>
                          {getTransactionTypeLabel(transaction.type)}
                        </Badge>
                      </div>
                      <span className={cn(
                        "font-bold text-lg",
                        transaction.amount > 0 ? "text-destructive" : "text-green-600"
                      )}>
                        {transaction.amount > 0 ? '+' : ''}{currencySymbol}{transaction.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground mb-2">{transaction.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm')}</span>
                      </div>
                      <span>{t('balanceAfter') || 'Bakiye'}: {currencySymbol}{transaction.balance_after.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    {transaction.reservation_id && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-2 text-xs"
                        onClick={() => navigate(`/agency/reservation/${transaction.reservation_id}`)}
                      >
                        {t('viewReservation') || 'Rezervasyonu Görüntüle'} →
                      </Button>
                    )}
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

export default AgencyTransactionHistory;
