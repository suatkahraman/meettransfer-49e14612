import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Banknote, TrendingUp, Users } from 'lucide-react';

interface DriverAccounting {
  id: string;
  name: string;
  totalRevenue: number;
  cashCollected: number;
}

const AdminAccounting = () => {
  const navigate = useNavigate();
  const [driverData, setDriverData] = useState<DriverAccounting[]>([]);
  const [totals, setTotals] = useState({
    revenue: 0,
    cashCollected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get all drivers
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, name');

      // Get all completed reservations with driver financial data - TL bazlı
      const { data: reservations } = await supabase
        .from('reservations')
        .select('driver_id, driver_earning, driver_cash_amount')
        .eq('status', 'completed');

      if (drivers && reservations) {
        const driverAccounting: DriverAccounting[] = drivers.map(driver => {
          const driverReservations = reservations.filter(r => r.driver_id === driver.id);
          // TL bazlı: driver_earning (şoför maliyeti)
          const totalRevenue = driverReservations.reduce((sum, r) => sum + (r.driver_earning || 0), 0);
          
          // TL bazlı: driver_cash_amount (şoförün aldığı nakit)
          const cashCollected = driverReservations.reduce((sum, r) => sum + (r.driver_cash_amount || 0), 0);

          return {
            id: driver.id,
            name: driver.name,
            totalRevenue,
            cashCollected,
          };
        });

        setDriverData(driverAccounting);

        // Calculate totals - TL bazlı
        const totalRevenue = reservations.reduce((sum, r) => sum + (r.driver_earning || 0), 0);
        const totalCash = driverAccounting.reduce((sum, d) => sum + d.cashCollected, 0);

        setTotals({
          revenue: totalRevenue,
          cashCollected: totalCash,
        });
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif">Accounting</h1>
      </header>

      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Toplam Şoför Maliyeti (₺)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">₺{totals.revenue.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Şoför Nakit Aldı (₺)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₺{totals.cashCollected.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Driver Breakdown Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Driver Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şoför</TableHead>
                      <TableHead className="text-right">Maliyet (₺)</TableHead>
                      <TableHead className="text-right">Nakit Aldı (₺)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverData.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell className="text-right">₺{driver.totalRevenue.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₺{driver.cashCollected.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {driverData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No driver data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminAccounting;