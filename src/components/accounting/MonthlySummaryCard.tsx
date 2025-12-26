import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Banknote, Scale, Car } from 'lucide-react';

interface MonthlySummaryCardProps {
  totalTransfers: number;
  totalPrice: number;
  totalCashCollected: number;
  currency?: string;
}

export const MonthlySummaryCard = ({
  totalTransfers,
  totalPrice,
  totalCashCollected,
  currency = 'TRY'
}: MonthlySummaryCardProps) => {
  const balance = totalPrice - totalCashCollected;
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '₺';

  const getBalanceStatus = () => {
    if (balance > 0) return { text: 'Şoför borçlu', color: 'text-amber-600' };
    if (balance < 0) return { text: 'Şirkete borçlu', color: 'text-blue-600' };
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
