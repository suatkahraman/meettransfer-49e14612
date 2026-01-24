import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Wallet,
  TrendingUp,
  Banknote
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { CustomerPaymentStats } from '@/hooks/useCustomerPayments';
import { motion } from 'framer-motion';

interface CustomerPaymentStatsProps {
  stats: CustomerPaymentStats;
  language: 'TR' | 'EN';
}

const translations = {
  EN: {
    paid: 'Paid',
    unpaid: 'Unpaid', 
    totalPaid: 'Total Paid',
    pending: 'Pending',
    transfers: 'transfers',
    progress: 'Payment Progress',
    cash: 'Cash',
    online: 'Online',
  },
  TR: {
    paid: 'Ödendi',
    unpaid: 'Ödenmedi',
    totalPaid: 'Toplam Ödenen',
    pending: 'Bekleyen',
    transfers: 'transfer',
    progress: 'Ödeme Durumu',
    cash: 'Nakit',
    online: 'Online',
  }
};

export const CustomerPaymentStatsCard = ({ stats, language }: CustomerPaymentStatsProps) => {
  const t = translations[language];
  const progressPercent = stats.totalReservations > 0 
    ? ((stats.paidCount + stats.cashCount) / (stats.paidCount + stats.cashCount + stats.unpaidCount)) * 100 
    : 100;

  // Don't show if no reservations
  if (stats.totalReservations === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Progress Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{t.progress}</span>
            </div>
            <span className="text-sm font-bold text-primary">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{stats.paidCount + stats.cashCount} {t.paid}</span>
            <span>{stats.unpaidCount} {t.pending}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Paid */}
        <Card className="border-green-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">{t.paid}</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(stats.totalPaid, 'EUR')}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.paidCount + stats.cashCount} {t.transfers}
            </p>
          </CardContent>
        </Card>

        {/* Unpaid */}
        <Card className="border-yellow-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">{t.pending}</span>
            </div>
            <p className="text-lg font-bold text-yellow-600">
              {formatCurrency(stats.totalUnpaid, 'EUR')}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.unpaidCount} {t.transfers}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Breakdown - Only show if there are payments */}
      {(stats.onlineCount > 0 || stats.cashCount > 0) && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-around gap-2">
              {stats.onlineCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.online}</p>
                    <p className="text-sm font-bold">{stats.onlineCount}</p>
                  </div>
                </div>
              )}
              {stats.cashCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <Banknote className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.cash}</p>
                    <p className="text-sm font-bold">{stats.cashCount}</p>
                  </div>
                </div>
              )}
              {Object.entries(stats.byProvider).length > 0 && (
                <div className="flex gap-1">
                  {Object.entries(stats.byProvider).map(([provider, count]) => (
                    <Badge key={provider} variant="secondary" className="text-xs capitalize">
                      {provider}: {count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multi-currency breakdown */}
      {Object.keys(stats.byCurrency).length > 1 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCurrency).map(([currency, data]) => (
                <div key={currency} className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                  <span className="text-xs font-medium">{currency}</span>
                  <span className="text-xs text-green-600">+{getCurrencySymbol(currency)}{data.paid.toFixed(0)}</span>
                  {data.unpaid > 0 && (
                    <span className="text-xs text-yellow-600">-{getCurrencySymbol(currency)}{data.unpaid.toFixed(0)}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
