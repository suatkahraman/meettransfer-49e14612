import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Clock, User, UserCheck, Pencil } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LocationDisplay } from '@/components/ui/location-display';
import { getCurrencySymbol } from '@/lib/currency';

interface Reservation {
  id: string;
  reservation_code: string | null;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  payment_type: string;
  price: number | null;
  price_currency: string | null;
  status: string;
  driver_id: string | null;
  drivers?: {
    id: string;
    name: string;
  } | null;
}

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-orange-500/20 text-orange-700',
  'waiting_for_customer_approval': 'bg-purple-500/20 text-purple-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'customer_rejected': 'bg-destructive/20 text-destructive',
  'confirmed': 'bg-emerald-500/20 text-emerald-700',
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
  'pending_admin_review': 'bg-amber-500/20 text-amber-700',
  'cancelled_by_customer': 'bg-destructive/20 text-destructive',
  'new': 'bg-yellow-500/20 text-yellow-700',
};

const statusLabels: Record<string, string> = {
  'awaiting-price': 'Fiyat Bekliyor',
  'waiting_for_customer_approval': 'Müşteri Onayı Bekliyor',
  'customer_approved': 'Onaylandı',
  'customer_rejected': 'Reddedildi',
  'confirmed': 'Onaylandı',
  'sent_to_driver': 'Şoföre Gönderildi',
  'active': 'Aktif',
  'completed': 'Tamamlandı',
  'pending_admin_review': 'İnceleme Bekliyor',
  'cancelled_by_customer': 'Müşteri İptal Etti',
  'new': 'Atama Bekliyor',
};

const filterTitles: Record<string, string> = {
  'completed': 'Aylık Tamamlanan Transferler',
  'new': 'Atama Bekleyen Transferler',
  'active': 'Aktif Transferler',
  'pending_admin_review': 'Admin Onayı Bekleyen Transferler',
};

const AdminFilteredReservations = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'completed';
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return '-';
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price}`;
  };

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      
      let query = supabase
        .from('reservations')
        .select(`
          id, reservation_code, customer_name, customer_phone, 
          pickup, dropoff, pickup_place_name, dropoff_place_name,
          pickup_date, pickup_time, flight_number, vehicle_type,
          payment_type, price, price_currency, status, driver_id,
          drivers (id, name)
        `)
        .order('pickup_date', { ascending: false });

      if (filter === 'completed') {
        // Monthly completed reservations
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        
        query = query
          .eq('status', 'completed')
          .gte('updated_at', monthStart.toISOString())
          .lte('updated_at', monthEnd.toISOString());
      } else if (filter === 'new') {
        // Pending assignment (new status = awaiting driver)
        query = query.eq('status', 'new');
      } else if (filter === 'active') {
        // Active transfers
        query = query.eq('status', 'active');
      } else if (filter === 'pending_admin_review') {
        // Pending admin review
        query = query.eq('status', 'pending_admin_review');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reservations:', error);
      } else {
        setReservations(data || []);
      }
      setLoading(false);
    };

    fetchReservations();
  }, [filter]);

  const currentPath = `/admin/filtered-reservations?filter=${filter}`;

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
        <h1 className="text-xl font-serif">{filterTitles[filter] || 'Rezervasyonlar'}</h1>
      </header>

      <main className="container mx-auto py-6 px-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Rezervasyon bulunamadı</div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Toplam {reservations.length} rezervasyon
            </div>
            
            {reservations.map((reservation) => (
              <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={statusColors[reservation.status] || 'bg-gray-100'}>
                          {statusLabels[reservation.status] || reservation.status}
                        </Badge>
                        {reservation.reservation_code && (
                          <Badge variant="outline" className="font-mono">
                            {reservation.reservation_code}
                          </Badge>
                        )}
                        <span className="font-medium">{formatPrice(reservation.price, reservation.price_currency)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{reservation.customer_name}</span>
                        <span className="text-muted-foreground">{reservation.customer_phone}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(reservation.pickup_date), 'PP', { locale: tr })}</span>
                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{reservation.pickup_time}</span>
                      </div>

                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <LocationDisplay 
                            address={reservation.pickup} 
                            placeName={reservation.pickup_place_name}
                            className="text-green-700"
                          />
                          <span className="text-muted-foreground mx-1">→</span>
                          <LocationDisplay 
                            address={reservation.dropoff} 
                            placeName={reservation.dropoff_place_name}
                            className="text-red-700"
                          />
                        </div>
                      </div>

                      {reservation.drivers && (
                        <div className="flex items-center gap-2 text-sm">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-primary">{reservation.drivers.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/reservations/${reservation.id}?returnTo=${encodeURIComponent(currentPath)}`)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Düzenle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminFilteredReservations;
