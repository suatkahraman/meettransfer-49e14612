import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, MapPin, Phone, User, Car, Building2 } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminMonthCard from '@/components/admin/AdminMonthCard';
import AdminDayCard from '@/components/admin/AdminDayCard';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  vehicle_type: string;
  status: string;
  price: number | null;
  price_currency: string | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  driver_earning: number | null;
  agency_id: string | null;
  agencies?: {
    id: string;
    agency_name: string;
  } | null;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  region: string | null;
}

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-yellow-500',
  'awaiting-customer': 'bg-orange-500',
  'confirmed': 'bg-blue-500',
  'assigned': 'bg-purple-500',
  'active': 'bg-green-500',
  'completed': 'bg-gray-500',
  'cancelled': 'bg-red-500',
  'cancelled_by_customer': 'bg-red-500',
  'cancelled_by_agency': 'bg-red-500',
  'customer_rejected': 'bg-red-500',
};

const AdminDriverJobs = () => {
  const navigate = useNavigate();
  const { driverId } = useParams<{ driverId: string }>();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!driverId) return;

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, name, phone, region')
        .eq('id', driverId)
        .maybeSingle();

      if (driverData) {
        setDriver(driverData);
      }

      const { data: reservationsData, error } = await supabase
        .from('reservations')
        .select('*, agencies (id, agency_name)')
        .eq('driver_id', driverId)
        .order('pickup_date', { ascending: false });

      if (error) {
        console.error('Error fetching reservations:', error);
      } else {
        setReservations(reservationsData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [driverId]);

  // Separate active and completed jobs
  const activeJobs = useMemo(() => 
    reservations.filter(r => r.status !== 'completed' && !r.status.startsWith('cancelled')),
    [reservations]
  );

  const completedJobs = useMemo(() => 
    reservations.filter(r => r.status === 'completed'),
    [reservations]
  );

  // Group completed jobs by month and day
  const groupedCompletedJobs = useMemo(() => {
    const months: Record<string, Record<string, Reservation[]>> = {};
    
    completedJobs.forEach(job => {
      const date = parseISO(job.pickup_date);
      const monthKey = format(date, 'yyyy-MM');
      const dayKey = job.pickup_date;
      
      if (!months[monthKey]) {
        months[monthKey] = {};
      }
      if (!months[monthKey][dayKey]) {
        months[monthKey][dayKey] = [];
      }
      months[monthKey][dayKey].push(job);
    });

    return months;
  }, [completedJobs]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  const toggleDay = (dayKey: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayKey)) {
        next.delete(dayKey);
      } else {
        next.add(dayKey);
      }
      return next;
    });
  };

  const formatDate = (date: string) => {
    return format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: tr });
  };

  const renderReservationCard = (reservation: Reservation) => (
    <Card 
      key={reservation.id} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/admin/reservations/${reservation.id}`)}
    >
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={`${statusColors[reservation.status] || 'bg-gray-500'} text-white`}>
              {reservation.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(reservation.pickup_date)}
            </span>
            {reservation.agencies && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Building2 className="h-3 w-3 mr-1" />
                {reservation.agencies.agency_name}
              </Badge>
            )}
          </div>
          {reservation.price && (
            <span className="font-semibold text-lg">{getCurrencySymbol(reservation.price_currency)}{reservation.price}</span>
          )}
        </div>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{reservation.customer_name}</span>
            <Phone className="h-4 w-4 text-muted-foreground ml-2" />
            <span>{reservation.customer_phone}</span>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p><span className="text-muted-foreground">From:</span> {reservation.pickup}</p>
              <p><span className="text-muted-foreground">To:</span> {reservation.dropoff}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{reservation.pickup_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span>{reservation.vehicle_type}</span>
            </div>
          </div>

          {reservation.driver_earning && (
            <div className="pt-2 border-t mt-2">
              <span className="text-muted-foreground">Şoför Kazancı:</span>{' '}
              <span className="font-medium text-green-600">₺{reservation.driver_earning}</span>
            </div>
          )}

          {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800 mt-2">
              <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">💵 Yolcudan Alınacak Nakit</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin/drivers')} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-serif">Şoför İşleri</h1>
            {driver && (
              <p className="text-primary-foreground/80 text-sm">{driver.name} • {driver.region || 'Bölge yok'}</p>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Bu şoföre henüz iş atanmadı
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="active">
                Aktif İşler ({activeJobs.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Tamamlananlar ({completedJobs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeJobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aktif iş bulunmuyor
                </div>
              ) : (
                activeJobs.map(renderReservationCard)
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedJobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Tamamlanmış iş bulunmuyor
                </div>
              ) : (
                Object.keys(groupedCompletedJobs)
                  .sort((a, b) => b.localeCompare(a))
                  .map(monthKey => {
                    const daysInMonth = groupedCompletedJobs[monthKey];
                    const totalJobsInMonth = Object.values(daysInMonth).flat().length;

                    return (
                      <AdminMonthCard
                        key={monthKey}
                        monthKey={monthKey}
                        totalJobs={totalJobsInMonth}
                        isExpanded={expandedMonths.has(monthKey)}
                        onToggle={() => toggleMonth(monthKey)}
                      >
                        {Object.keys(daysInMonth)
                          .sort((a, b) => b.localeCompare(a))
                          .map(dayKey => {
                            const jobsForDay = daysInMonth[dayKey];
                            return (
                              <AdminDayCard
                                key={dayKey}
                                date={dayKey}
                                totalJobs={jobsForDay.length}
                                isExpanded={expandedDays.has(dayKey)}
                                onToggle={() => toggleDay(dayKey)}
                              >
                                <div className="space-y-3">
                                  {jobsForDay.map(renderReservationCard)}
                                </div>
                              </AdminDayCard>
                            );
                          })}
                      </AdminMonthCard>
                    );
                  })
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default AdminDriverJobs;
