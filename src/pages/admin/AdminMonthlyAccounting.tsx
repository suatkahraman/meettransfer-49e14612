import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users } from 'lucide-react';
import { MonthNavigator } from '@/components/accounting/MonthNavigator';
import { MonthlySummaryCard } from '@/components/accounting/MonthlySummaryCard';
import { MonthlyAccountingTable } from '@/components/accounting/MonthlyAccountingTable';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

interface Driver {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  pickup_date: string;
  pickup_time: string;
  pickup: string;
  dropoff: string;
  price: number | null;
  price_currency: string | null;
  driver_cash_amount: number | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  status: string;
  customer_name: string;
  driver_id: string | null;
}

interface DriverSummary {
  driver: Driver;
  totalPrice: number;
  totalCash: number;
  balance: number;
  transferCount: number;
}

const AdminMonthlyAccounting = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [driverSummaries, setDriverSummaries] = useState<DriverSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      const { data } = await supabase
        .from('drivers')
        .select('id, name')
        .order('name');
      if (data) setDrivers(data);
    };
    fetchDrivers();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      let query = supabase
        .from('reservations')
        .select('*')
        .gte('pickup_date', monthStart)
        .lte('pickup_date', monthEnd)
        .not('driver_id', 'is', null)
        .order('pickup_date', { ascending: true });

      if (selectedDriver !== 'all') {
        query = query.eq('driver_id', selectedDriver);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data } = await query;

      if (data) {
        setReservations(data);

        // Calculate driver summaries
        const summaryMap = new Map<string, DriverSummary>();
        
        data.forEach(res => {
          const driverId = res.driver_id;
          if (!driverId) return;
          
          const driver = drivers.find(d => d.id === driverId);
          if (!driver) return;

          const existing = summaryMap.get(driverId) || {
            driver,
            totalPrice: 0,
            totalCash: 0,
            balance: 0,
            transferCount: 0
          };

          existing.totalPrice += res.price || 0;
          existing.totalCash += res.driver_cash_amount || 0;
          existing.transferCount += 1;
          existing.balance = existing.totalPrice - existing.totalCash;

          summaryMap.set(driverId, existing);
        });

        setDriverSummaries(Array.from(summaryMap.values()));
      }
      setLoading(false);
    };

    if (drivers.length > 0) {
      fetchData();
    }
  }, [currentMonth, selectedDriver, selectedStatus, drivers]);

  const totalPrice = reservations.reduce((sum, r) => sum + (r.price || 0), 0);
  const totalCash = reservations.reduce((sum, r) => sum + (r.driver_cash_amount || 0), 0);

  const handleEditReservation = (reservation: Reservation) => {
    navigate(`/admin/reservations/${reservation.id}/edit`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/admin')} 
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif">Aylık Muhasebe</h1>
      </header>

      <main className="container mx-auto py-6 px-4 space-y-6">
        {/* Month Navigator */}
        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
          onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Şoför seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Şoförler</SelectItem>
              {drivers.map(driver => (
                <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="assigned">Atandı</SelectItem>
              <SelectItem value="sent_to_driver">Şoföre Gönderildi</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="cancelled">İptal Edildi</SelectItem>
            </SelectContent>
          </Select>
        </div>

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

            {/* Driver Breakdown */}
            {selectedDriver === 'all' && driverSummaries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    Şoför Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {driverSummaries.map(summary => {
                      const balanceColor = summary.balance > 0 ? 'text-amber-600' : summary.balance < 0 ? 'text-blue-600' : 'text-green-600';
                      return (
                        <div 
                          key={summary.driver.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <div className="font-medium">{summary.driver.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {summary.transferCount} transfer
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              Fiyat: ₺{summary.totalPrice.toFixed(2)} | Nakit: ₺{summary.totalCash.toFixed(2)}
                            </div>
                            <div className={`font-semibold ${balanceColor}`}>
                              Bakiye: ₺{Math.abs(summary.balance).toFixed(2)}
                              {summary.balance > 0 ? ' (borçlu)' : summary.balance < 0 ? ' (alacaklı)' : ' (kapalı)'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reservations Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rezervasyonlar</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyAccountingTable
                  reservations={reservations}
                  showActions={true}
                  onEdit={handleEditReservation}
                />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminMonthlyAccounting;
