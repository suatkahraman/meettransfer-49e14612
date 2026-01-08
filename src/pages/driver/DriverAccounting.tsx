import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, Briefcase, DollarSign, Banknote } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';

interface AccountingData {
  totalJobs: number;
  totalRevenue: number;
  cashCollected: number;
}

const DriverAccounting = () => {
  const { signOut } = useAuth();
  const { driverId } = useUserRole();
  const navigate = useNavigate();
  const { t } = useDriverTranslations();
  const [data, setData] = useState<AccountingData>({
    totalJobs: 0,
    totalRevenue: 0,
    cashCollected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!driverId) return;

      // Get completed reservations - TL bazlı (driver_earning ve driver_cash_amount)
      const { data: reservations } = await supabase
        .from('reservations')
        .select('driver_earning, driver_cash_amount')
        .eq('driver_id', driverId)
        .eq('status', 'completed');

      if (reservations) {
        const totalJobs = reservations.length;
        // TL bazlı hesaplama: driver_earning (şoför maliyeti)
        const totalRevenue = reservations.reduce((sum, r) => sum + (r.driver_earning || 0), 0);
        // TL bazlı hesaplama: driver_cash_amount (şoförün aldığı nakit)
        const cashCollected = reservations.reduce((sum, r) => sum + (r.driver_cash_amount || 0), 0);

        setData({
          totalJobs,
          totalRevenue,
          cashCollected,
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
          <h1 className="text-2xl font-serif">{t('accounting')}</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
        {loading ? (
          <div className="text-center py-12">{t('loading')}</div>
        ) : (
          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {t('totalJobsCompleted')}
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
                  {t('totalRevenue')} (₺)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">₺{data.totalRevenue.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('valueOfCompletedJobs')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  {t('totalCashCollected')} (₺)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₺{data.cashCollected.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverAccounting;