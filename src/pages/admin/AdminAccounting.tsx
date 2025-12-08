import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, DollarSign, Banknote, TrendingUp, Users } from 'lucide-react';

interface DriverAccounting {
  id: string;
  name: string;
  commission_rate: number;
  totalRevenue: number;
  earnings: number;
  cashCollected: number;
  balanceOwed: number;
}

const AdminAccounting = () => {
  const navigate = useNavigate();
  const [driverData, setDriverData] = useState<DriverAccounting[]>([]);
  const [totals, setTotals] = useState({
    revenue: 0,
    commissions: 0,
    cashCollected: 0,
    unpaidBalances: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get all drivers
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, name, commission_rate');

      // Get all completed reservations with driver financial data
      const { data: reservations } = await supabase
        .from('reservations')
        .select('driver_id, price, driver_earning, driver_cash_amount')
        .eq('status', 'completed');

      if (drivers && reservations) {
        const driverAccounting: DriverAccounting[] = drivers.map(driver => {
          const driverReservations = reservations.filter(r => r.driver_id === driver.id);
          const totalRevenue = driverReservations.reduce((sum, r) => sum + (r.price || 0), 0);
          
          // Use driver_earning if set, otherwise calculate from commission rate
          const earnings = driverReservations.reduce((sum, r) => {
            if (r.driver_earning !== null) {
              return sum + r.driver_earning;
            }
            return sum + (r.price || 0) * (driver.commission_rate / 100);
          }, 0);
          
          // Use actual driver_cash_amount entered by drivers
          const cashCollected = driverReservations.reduce((sum, r) => sum + (r.driver_cash_amount || 0), 0);
          
          // Balance owed = cash collected - driver earnings (what driver keeps)
          const balanceOwed = Math.max(0, cashCollected - earnings);

          return {
            id: driver.id,
            name: driver.name,
            commission_rate: driver.commission_rate,
            totalRevenue,
            earnings,
            cashCollected,
            balanceOwed,
          };
        });

        setDriverData(driverAccounting);

        // Calculate totals
        const totalRevenue = reservations.reduce((sum, r) => sum + (r.price || 0), 0);
        const totalCommissions = driverAccounting.reduce((sum, d) => sum + d.earnings, 0);
        const totalCash = driverAccounting.reduce((sum, d) => sum + d.cashCollected, 0);
        const totalUnpaid = driverAccounting.reduce((sum, d) => sum + d.balanceOwed, 0);

        setTotals({
          revenue: totalRevenue,
          commissions: totalCommissions,
          cashCollected: totalCash,
          unpaidBalances: totalUnpaid,
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">₺{totals.revenue.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Driver Commissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₺{totals.commissions.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Cash Collected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₺{totals.cashCollected.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Unpaid Balances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">₺{totals.unpaidBalances.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Driver Breakdown Table */}
            <Card>
              <CardHeader>
                <CardTitle>Driver Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Driver</TableHead>
                      <TableHead className="text-right">Commission %</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Earnings</TableHead>
                      <TableHead className="text-right">Cash Collected</TableHead>
                      <TableHead className="text-right">Balance Owed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverData.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell className="text-right">{driver.commission_rate}%</TableCell>
                        <TableCell className="text-right">₺{driver.totalRevenue.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-green-600">₺{driver.earnings.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₺{driver.cashCollected.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-destructive font-medium">
                          ₺{driver.balanceOwed.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {driverData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
