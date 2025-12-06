import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, Briefcase, DollarSign, Banknote, TrendingDown } from 'lucide-react';

interface DriverData {
  commission_rate: number;
}

interface AccountingData {
  totalJobs: number;
  totalEarnings: number;
  cashCollected: number;
  balanceOwed: number;
}

const DriverAccounting = () => {
  const { signOut } = useAuth();
  const { driverId } = useUserRole();
  const navigate = useNavigate();
  const [data, setData] = useState<AccountingData>({
    totalJobs: 0,
    totalEarnings: 0,
    cashCollected: 0,
    balanceOwed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!driverId) return;

      // Get driver's commission rate
      const { data: driverData } = await supabase
        .from('drivers')
        .select('commission_rate')
        .eq('id', driverId)
        .single();

      const commissionRate = (driverData as DriverData)?.commission_rate || 10;

      // Get completed reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('price, driver_cash')
        .eq('driver_id', driverId)
        .eq('status', 'completed');

      if (reservations) {
        const totalJobs = reservations.length;
        const totalRevenue = reservations.reduce((sum, r) => sum + (r.price || 0), 0);
        const totalEarnings = totalRevenue * (commissionRate / 100);
        const cashCollected = reservations
          .filter(r => r.driver_cash)
          .reduce((sum, r) => sum + (r.price || 0), 0);
        const balanceOwed = cashCollected - totalEarnings;

        setData({
          totalJobs,
          totalEarnings,
          cashCollected,
          balanceOwed: Math.max(0, balanceOwed),
        });
      }
      setLoading(false);
    };

    if (driverId) {
      fetchData();
    }
  }, [driverId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/driver')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Accounting</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Total Jobs Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalJobs}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">€{data.totalEarnings.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">Based on your commission rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Total Cash Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">€{data.cashCollected.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Balance Owed to Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">€{data.balanceOwed.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">Cash collected minus your earnings</p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverAccounting;
