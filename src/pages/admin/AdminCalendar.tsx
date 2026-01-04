import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Clock, User } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import NotificationBell from '@/components/NotificationBell';
import { getCurrencySymbol } from '@/lib/currency';

interface Reservation {
  id: string;
  customer_name: string;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  status: string;
  driver_id: string | null;
  price: number | null;
  price_currency: string | null;
  drivers?: { id: string; name: string } | null;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  user_id: string;
}

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-orange-500/80 text-white',
  'waiting_for_customer_approval': 'bg-purple-500/80 text-white',
  'customer_approved': 'bg-blue-500/80 text-white',
  'confirmed': 'bg-emerald-500/80 text-white',
  'sent_to_driver': 'bg-yellow-500/80 text-black',
  'active': 'bg-cyan-500/80 text-white',
  'completed': 'bg-green-600/80 text-white',
};


const AdminCalendar = () => {
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedDriver, setDraggedDriver] = useState<Driver | null>(null);

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return '';
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price}`;
  };

  const fetchData = useCallback(async () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const [reservationsRes, driversRes] = await Promise.all([
      supabase
        .from('reservations')
        .select('*, drivers(id, name)')
        .gte('pickup_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('pickup_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('pickup_time'),
      supabase.from('drivers').select('id, name, phone, user_id').eq('active', true),
    ]);

    setReservations(reservationsRes.data || []);
    setDrivers(driversRes.data || []);
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDragStart = (driver: Driver) => {
    setDraggedDriver(driver);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (reservation: Reservation) => {
    if (!draggedDriver) return;
    if (reservation.driver_id === draggedDriver.id) {
      setDraggedDriver(null);
      return;
    }

    // Only allow assignment for certain statuses
    if (!['confirmed', 'customer_approved'].includes(reservation.status)) {
      toast.error('Can only assign driver to confirmed reservations');
      setDraggedDriver(null);
      return;
    }

    const oldDriverId = reservation.driver_id;

    const { error } = await supabase
      .from('reservations')
      .update({ driver_id: draggedDriver.id, status: 'sent_to_driver' })
      .eq('id', reservation.id);

    if (error) {
      toast.error('Failed to assign driver');
    } else {
      await logAction({
        action: 'ASSIGN_DRIVER',
        table_name: 'reservations',
        record_id: reservation.id,
        old_data: { driver_id: oldDriverId, status: reservation.status },
        new_data: { driver_id: draggedDriver.id, status: 'sent_to_driver', driver_name: draggedDriver.name },
      });

      // Notify driver
      try {
        const priceDisplay = formatPrice(reservation.price, reservation.price_currency);
        await supabase.functions.invoke('create-notification', {
          body: {
            user_id: draggedDriver.user_id,
            reservation_id: reservation.id,
            title: 'New Job Assigned',
            message: `New transfer: ${reservation.pickup} → ${reservation.dropoff} on ${format(parseISO(reservation.pickup_date), 'PP')} at ${reservation.pickup_time}. ${priceDisplay ? `Price: ${priceDisplay}` : ''}`,
            type: 'driver_assigned',
            send_push: true
          }
        });
      } catch (err) {
        console.error('Failed to notify driver:', err);
      }

      toast.success(`Assigned to ${draggedDriver.name}`);
      fetchData();
    }
    setDraggedDriver(null);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Pad start with empty cells for proper weekday alignment
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const paddedDays = [...Array(firstDayOfMonth).fill(null), ...days];

  const getReservationsForDay = (date: Date) => {
    return reservations.filter(r => isSameDay(parseISO(r.pickup_date), date));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Takvim Görünümü</h1>
        </div>
        <NotificationBell />
      </header>

      <main className="container mx-auto py-6 px-4">
        <div className="flex gap-6">
          {/* Driver Sidebar */}
          <div className="w-48 flex-shrink-0">
            <h3 className="font-semibold mb-3">Şoförler</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Atamak için şoförü rezervasyonun üzerine sürükleyin
            </p>
            <div className="space-y-2">
              {drivers.map(driver => (
                <div
                  key={driver.id}
                  draggable
                  onDragStart={() => handleDragStart(driver)}
                  className="p-3 bg-card border rounded-lg cursor-grab active:cursor-grabbing hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{driver.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="text-center py-12">Yükleniyor...</div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {paddedDays.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="min-h-[120px] bg-muted/20 rounded" />;
                  }

                  const dayReservations = getReservationsForDay(day);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[120px] border rounded p-1 ${
                        isCurrentDay ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1 overflow-y-auto max-h-[100px]">
                        {dayReservations.map(reservation => (
                          <div
                            key={reservation.id}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(reservation)}
                            onClick={() => navigate(`/admin/reservations/${reservation.id}`)}
                            className={`p-1.5 rounded text-xs cursor-pointer transition-all hover:scale-[1.02] ${
                              statusColors[reservation.status] || 'bg-muted'
                            } ${
                              draggedDriver && ['confirmed', 'customer_approved'].includes(reservation.status) && !reservation.driver_id
                                ? 'ring-2 ring-primary ring-offset-1 animate-pulse'
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-1 truncate">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{reservation.pickup_time.slice(0, 5)}</span>
                            </div>
                            <div className="flex items-center gap-1 truncate mt-0.5">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {reservation.pickup_place_name || reservation.pickup.split(',')[0]} → {reservation.dropoff_place_name || reservation.dropoff.split(',')[0]}
                              </span>
                            </div>
                            {reservation.drivers && (
                              <div className="flex items-center gap-1 mt-0.5 opacity-80">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{reservation.drivers.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500/80" />
                <span>Fiyat Bekleniyor</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-purple-500/80" />
                <span>Müşteri Bekleniyor</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500/80" />
                <span>Onaylandı</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500/80" />
                <span>Şoföre Gönderildi</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-cyan-500/80" />
                <span>Aktif</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-600/80" />
                <span>Tamamlandı</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminCalendar;
