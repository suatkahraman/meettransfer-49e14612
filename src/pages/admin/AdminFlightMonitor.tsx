import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plane, RefreshCw, Clock, AlertTriangle, CheckCircle, XCircle, PlaneLanding } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import FlightStatus from '@/components/ui/flight-status';
import { AirlineDisplay } from '@/components/ui/airline-display';
import NotificationBell from '@/components/NotificationBell';

interface Reservation {
  id: string;
  reservation_code: string;
  customer_name: string;
  flight_number: string | null;
  flight_arrival_time: string | null;
  flight_status: string | null;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  status: string;
  driver_id: string | null;
  drivers?: {
    name: string;
    plate_number: string | null;
  } | null;
}

const AdminFlightMonitor = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchTodayReservations = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        reservation_code,
        customer_name,
        flight_number,
        flight_arrival_time,
        flight_status,
        pickup,
        dropoff,
        pickup_date,
        pickup_time,
        status,
        driver_id,
        drivers (
          name,
          plate_number
        )
      `)
      .eq('pickup_date', today)
      .not('flight_number', 'is', null)
      .neq('flight_number', '')
      .order('pickup_time', { ascending: true });

    if (error) {
      console.error('Error fetching reservations:', error);
      return;
    }

    setReservations(data || []);
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    fetchTodayReservations();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchTodayReservations();
    }, 5 * 60 * 1000);

    // Real-time subscription
    const channel = supabase
      .channel('admin-flight-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
        },
        () => {
          fetchTodayReservations();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTodayReservations();
    setRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      'awaiting-price': { variant: 'secondary', label: 'Fiyat Bekliyor' },
      'awaiting-customer': { variant: 'secondary', label: 'Müşteri Onayı' },
      'confirmed': { variant: 'default', label: 'Onaylandı' },
      'assigned': { variant: 'default', label: 'Atandı' },
      'sent_to_driver': { variant: 'default', label: 'Şoföre Gönderildi' },
      'active': { variant: 'default', label: 'Aktif' },
      'completed': { variant: 'outline', label: 'Tamamlandı' },
      'cancelled': { variant: 'destructive', label: 'İptal' },
    };

    const config = statusConfig[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const reservationsWithFlights = reservations.filter(r => r.flight_number);
  const flightCount = reservationsWithFlights.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin')}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6" />
            <h1 className="text-xl font-serif">Uçuş Takip</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Bugünkü Uçuşlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '-' : flightCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Son Güncelleme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {format(lastRefresh, 'HH:mm:ss', { locale: tr })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Şoför Atanmış
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '-' : reservationsWithFlights.filter(r => r.driver_id).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Şoför Bekliyor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {loading ? '-' : reservationsWithFlights.filter(r => !r.driver_id).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flight List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          ) : reservationsWithFlights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Bugün uçuşlu rezervasyon bulunmuyor.</p>
              </CardContent>
            </Card>
          ) : (
            reservationsWithFlights.map((reservation) => (
              <Card 
                key={reservation.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/admin/reservations/${reservation.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Reservation Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono">
                          {reservation.reservation_code}
                        </Badge>
                        {getStatusBadge(reservation.status)}
                        <span className="text-sm text-muted-foreground">
                          {reservation.pickup_time}
                        </span>
                      </div>
                      
                      <div className="font-medium">{reservation.customer_name}</div>
                      
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">📍</span>
                          {reservation.pickup}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">🎯</span>
                          {reservation.dropoff}
                        </div>
                      </div>

                      {reservation.drivers && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Şoför:</span>
                          <span className="font-medium">{reservation.drivers.name}</span>
                          {reservation.drivers.plate_number && (
                            <Badge variant="secondary" className="text-xs">
                              {reservation.drivers.plate_number}
                            </Badge>
                          )}
                        </div>
                      )}

                      {!reservation.driver_id && (
                        <div className="flex items-center gap-2 text-sm text-yellow-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Şoför atanmamış</span>
                        </div>
                      )}
                    </div>

                    {/* Flight Status */}
                    <div className="md:w-80 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4">
                      <div className="mb-2">
                        <AirlineDisplay 
                          flightNumber={reservation.flight_number || ''} 
                          size="md"
                          showFlightNumber
                        />
                      </div>
                      
                      {/* Stored Flight Info */}
                      {(reservation.flight_arrival_time || reservation.flight_status) && (
                        <div className="mb-3 p-2 bg-muted/50 rounded-md space-y-1">
                          {reservation.flight_arrival_time && (
                            <div className="flex items-center gap-2 text-sm">
                              <PlaneLanding className="h-4 w-4 text-primary" />
                              <span className="font-medium">Varış Saati:</span>
                              <span className="text-primary font-bold">{reservation.flight_arrival_time}</span>
                            </div>
                          )}
                          {reservation.flight_status && (
                            <div className="flex items-center gap-2 text-sm">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs capitalize",
                                  reservation.flight_status === 'delayed' && "text-amber-600 border-amber-300 bg-amber-50",
                                  reservation.flight_status === 'landed' && "text-green-600 border-green-300 bg-green-50",
                                  reservation.flight_status === 'cancelled' && "text-red-600 border-red-300 bg-red-50",
                                  reservation.flight_status === 'active' && "text-blue-600 border-blue-300 bg-blue-50"
                                )}
                              >
                                {reservation.flight_status === 'delayed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {reservation.flight_status === 'landed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {reservation.flight_status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <FlightStatus 
                        flightNumber={reservation.flight_number || ''} 
                        date={reservation.pickup_date}
                        reservationId={reservation.id}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminFlightMonitor;
