import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CalendarDays,
  CreditCard,
  Wallet
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { PaymentStats } from '@/hooks/useAdminPayments';

interface PaymentStatsCardsProps {
  stats: PaymentStats;
}

export const PaymentStatsCards = ({ stats }: PaymentStatsCardsProps) => {
  const renderTotal = (totals: Record<string, number>, fallbackClass = "text-green-600") => {
    const entries = Object.entries(totals).filter(([_, val]) => val > 0);
    if (entries.length === 0) return <span className={fallbackClass}>-</span>;
    
    return (
      <div className="flex flex-col">
        {entries.map(([currency, total]) => (
          <span key={currency} className={fallbackClass}>
            {formatCurrency(total, currency)}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Müşteri Ödemeleri</p>
                <p className="text-xl font-bold">{stats.customerCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Müşteri Toplam</p>
                <div className="text-xl font-bold">
                  {renderTotal(stats.customerTotal)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Building2 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Acenta Ödemeleri</p>
                <p className="text-xl font-bold">{stats.agencyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <DollarSign className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Acenta Toplam</p>
                <div className="text-xl font-bold">
                  {renderTotal(stats.agencyTotal)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Stats */}
      {stats.customerPendingCount > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Bekleyen Ödemeler</p>
                  <p className="text-xs text-muted-foreground">{stats.customerPendingCount} adet bekliyor</p>
                </div>
              </div>
              <div className="text-lg font-bold">
                {renderTotal(stats.customerPending, "text-yellow-600")}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time-based Revenue */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <CalendarDays className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Bugün</p>
            <div className="text-sm font-bold">
              {renderTotal(stats.todayRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CalendarDays className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Son 7 Gün</p>
            <div className="text-sm font-bold">
              {renderTotal(stats.weekRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CalendarDays className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Bu Ay</p>
            <div className="text-sm font-bold">
              {renderTotal(stats.monthRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider breakdown */}
      {Object.keys(stats.byProvider).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Ödeme Yöntemlerine Göre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.byProvider).map(([provider, data]) => (
                <div key={provider} className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                  {provider === 'stripe' ? (
                    <CreditCard className="h-4 w-4 text-purple-500" />
                  ) : (
                    <Wallet className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-sm font-medium capitalize">{provider}</span>
                  <Badge variant="secondary" className="text-xs">{data.count}</Badge>
                  <div className="text-sm font-bold">
                    {renderTotal(data.total)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currency breakdown */}
      {Object.keys(stats.byCurrency).length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Para Birimine Göre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(stats.byCurrency).map(([currency, data]) => (
                <div key={currency} className="bg-muted/50 px-3 py-2 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{currency}</span>
                    <Badge variant="outline" className="text-xs">{data.count} işlem</Badge>
                  </div>
                  <p className="text-sm font-bold">{getCurrencySymbol(currency)}{(data.customerTotal + data.agencyTotal).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
