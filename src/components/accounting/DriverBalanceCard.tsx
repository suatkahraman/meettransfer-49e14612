import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';

interface DriverBalanceCardProps {
  balance: number; // Net cari bakiye (hesaplanmış)
  totalPayments: number;
  totalEarnings: number;
}

export const DriverBalanceCard = ({ balance, totalPayments, totalEarnings }: DriverBalanceCardProps) => {
  // Use the pre-calculated balance from parent (includes carry-over)
  const netBalance = balance;
  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Cari Hesap Durumu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Toplam Kazanç
            </div>
            <div className="text-xl font-bold">{getCurrencySymbol('TRY')}{totalEarnings.toFixed(2)}</div>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingDown className="h-4 w-4" />
              Toplam Ödeme
            </div>
            <div className="text-xl font-bold">{getCurrencySymbol('TRY')}{totalPayments.toFixed(2)}</div>
          </div>
          
          <div className={`p-4 rounded-lg ${isPositive ? 'bg-amber-100 dark:bg-amber-950' : isNegative ? 'bg-blue-100 dark:bg-blue-950' : 'bg-green-100 dark:bg-green-950'}`}>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Scale className="h-4 w-4" />
              Cari Bakiye
            </div>
            <div className={`text-xl font-bold ${isPositive ? 'text-amber-600' : isNegative ? 'text-blue-600' : 'text-green-600'}`}>
              {getCurrencySymbol('TRY')}{Math.abs(netBalance).toFixed(2)}
              <span className="text-sm font-normal ml-1">
                {isPositive ? '(alacak)' : isNegative ? '(verecek)' : '(kapalı)'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
