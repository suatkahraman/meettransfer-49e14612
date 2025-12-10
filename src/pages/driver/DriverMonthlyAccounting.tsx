import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut } from 'lucide-react';
import { MonthNavigator } from '@/components/accounting/MonthNavigator';
import { MonthlySummaryCard } from '@/components/accounting/MonthlySummaryCard';
import { MonthlyAccountingTable } from '@/components/accounting/MonthlyAccountingTable';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

interface Reservation {
  id: string;
  pickup_date: string;
  pickup_time: string;
  pickup: string;
  dropoff: string;
  price: number | null;
  price_currency: string | null;
  driver_cash_amount: number | null;
  status: string;
  customer_name: string;
}

const DriverMonthlyAccounting = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { driverId } = useUserRole();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!driverId) return;

      setLoading(true);
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data } = await supabase
        .from('reservations')
        .select('*')
        .eq('driver_id', driverId)
        .gte('pickup_date', monthStart)
        .lte('pickup_date', monthEnd)
        .order('pickup_date', { ascending: true });

      if (data) {
        setReservations(data);
      }
      setLoading(false);
    };

    if (driverId) {
      fetchData();

      // Set up real-time subscription
      const channel = supabase
        .channel('driver-monthly-accounting')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reservations',
            filter: `driver_id=eq.${driverId}`
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [driverId, currentMonth]);

  const totalPrice = reservations.reduce((sum, r) => sum + (r.price || 0), 0);
  const totalCash = reservations.reduce((sum, r) => sum + (r.driver_cash_amount || 0), 0);

  const handleViewDetails = (reservation: Reservation) => {
    navigate(`/driver/job/${reservation.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/driver')} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Aylık Kazanç</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={signOut} 
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="container mx-auto py-6 px-4 space-y-6 max-w-2xl">
        {/* Month Navigator */}
        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
          onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
        />

        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : (
          <>
            {/* Monthly Summary */}
            <MonthlySummaryCard
              totalTransfers={reservations.length}
              totalPrice={totalPrice}
              totalCashCollected={totalCash}
            />

            {/* Reservations Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transferler</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyAccountingTable
                  reservations={reservations}
                  showActions={true}
                  onEdit={handleViewDetails}
                />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default DriverMonthlyAccounting;
