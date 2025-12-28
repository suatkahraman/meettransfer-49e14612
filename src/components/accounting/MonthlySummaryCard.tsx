import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Banknote, Scale, Car } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';

interface MonthlySummaryCardProps {
  totalTransfers: number;
  totalPrice: number;
  totalCashCollected: number;
  currency?: string;
  paymentsToDriver?: number;
  paymentsFromDriver?: number;
}

export const MonthlySummaryCard = ({
  totalTransfers,
  totalPrice,
  totalCashCollected,
  currency = 'TRY',
  paymentsToDriver = 0,
  paymentsFromDriver = 0
}: MonthlySummaryCardProps) => {
  // Balance calculation: (Price - Cash) represents what driver owes
  // Then subtract payments made TO driver (reduces what driver owes)
  // Then add payments received FROM driver (reduces what driver owes)
  const rawBalance = totalPrice - totalCashCollected;
  const balance = rawBalance - paymentsToDriver + paymentsFromDriver;
  const symbol = getCurrencySymbol(currency);

  const getBalanceStatus = () => {
    if (balance > 0) return { text: 'Şoföre Ödenecek', color: 'text-amber-600' };
    if (balance < 0) return { text: 'Şirkete Ödenecek', color: 'text-blue-600' };
    return { text: 'Kapatıldı', color: 'text-green-600' };
  };

  const balanceStatus = getBalanceStatus();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
            <Car className="h-4 w-4" />
            Transfer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTransfers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Bütçe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {symbol}{totalPrice.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Şoför Nakit Aldı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {symbol}{totalCashCollected.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Bakiye
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balanceStatus.color}`}>
            {symbol}{Math.abs(balance).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{balanceStatus.text}</p>
        </CardContent>
      </Card>
    </div>
  );
};
