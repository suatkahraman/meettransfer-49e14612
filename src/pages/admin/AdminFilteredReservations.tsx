import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Clock, User, UserCheck, Pencil, Check, X, Car, Briefcase, Baby, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LocationDisplay } from '@/components/ui/location-display';
import { getCurrencySymbol } from '@/lib/currency';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  driver_user_id: string | null;
  agency_user_id: string | null;
  luggage_count: number | null;
  baby_seat_count: number | null;
  drivers?: {
    id: string;
    name: string;
  } | null;
}

const vehicleLabels: Record<string, string> = {
  'mercedes-vito': 'Mercedes Vito',
  'vip-mercedes': 'VIP Mercedes',
  'maybach-minibus': 'Maybach Minibus',
  'minibus': 'Mercedes Sprinter',
  'mercedes-vclass': 'VIP Vito',
  'maybach': 'Maybach',
};

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
  'cancelled_by_agency': 'bg-destructive/20 text-destructive',
  'cancelled': 'bg-destructive/20 text-destructive',
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
  'cancelled_by_agency': 'Acenta İptal Etti',
  'cancelled': 'İptal Edildi',
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
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);

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
          driver_user_id, agency_user_id, luggage_count, baby_seat_count,
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

  const handleApprove = async (reservation: Reservation) => {
    setProcessingId(reservation.id);
    try {
      // Update reservation status to confirmed
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', reservation.id);

      if (updateError) throw updateError;

      // Send notification to agency
      if (reservation.agency_user_id) {
        await supabase.functions.invoke('create-notification', {
          body: {
            userId: reservation.agency_user_id,
            title: 'Rezervasyon Onaylandı',
            message: `${reservation.reservation_code || reservation.id} kodlu rezervasyon admin tarafından onaylandı.`,
            type: 'reservation_update',
            reservationId: reservation.id,
          },
        });
      }

      // Send notification to driver
      if (reservation.driver_user_id) {
        await supabase.functions.invoke('create-notification', {
          body: {
            userId: reservation.driver_user_id,
            title: 'Rezervasyon Güncellendi',
            message: `${reservation.reservation_code || reservation.id} kodlu rezervasyon güncellendi ve onaylandı.`,
            type: 'reservation_update',
            reservationId: reservation.id,
          },
        });
      }

      // Remove from list
      setReservations(prev => prev.filter(r => r.id !== reservation.id));
      toast.success('Rezervasyon onaylandı');
    } catch (error) {
      console.error('Error approving reservation:', error);
      toast.error('Onaylama sırasında hata oluştu');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reservation: Reservation) => {
    setProcessingId(reservation.id);
    try {
      // Revert to previous status (sent_to_driver if has driver, otherwise confirmed)
      const newStatus = reservation.driver_id ? 'sent_to_driver' : 'customer_approved';
      
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservation.id);

      if (updateError) throw updateError;

      // Send notification to agency
      if (reservation.agency_user_id) {
        await supabase.functions.invoke('create-notification', {
          body: {
            userId: reservation.agency_user_id,
            title: 'Güncelleme Reddedildi',
            message: `${reservation.reservation_code || reservation.id} kodlu rezervasyon güncellemesi admin tarafından reddedildi.`,
            type: 'reservation_update',
            reservationId: reservation.id,
          },
        });
      }

      // Remove from list
      setReservations(prev => prev.filter(r => r.id !== reservation.id));
      toast.success('Güncelleme reddedildi');
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      toast.error('Reddetme sırasında hata oluştu');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteClick = (reservation: Reservation) => {
    setReservationToDelete(reservation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reservationToDelete) return;
    
    setProcessingId(reservationToDelete.id);
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationToDelete.id);

      if (error) throw error;

      setReservations(prev => prev.filter(r => r.id !== reservationToDelete.id));
      toast.success('Rezervasyon silindi');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Silme sırasında hata oluştu');
    } finally {
      setProcessingId(null);
      setDeleteDialogOpen(false);
      setReservationToDelete(null);
    }
  };

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

                      {/* Vehicle & Capacity Info */}
                      <div className="flex items-center gap-3 text-sm flex-wrap">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Car className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium">{vehicleLabels[reservation.vehicle_type] || reservation.vehicle_type}</span>
                        </span>
                        {reservation.luggage_count !== null && reservation.luggage_count > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-xs">
                            <Briefcase className="h-3 w-3" />
                            {reservation.luggage_count} valiz
                          </span>
                        )}
                        {reservation.baby_seat_count !== null && reservation.baby_seat_count > 0 && (
                          <span className="flex items-center gap-1 text-pink-600 bg-pink-50 dark:bg-pink-900/30 px-1.5 py-0.5 rounded text-xs">
                            <Baby className="h-3 w-3" />
                            {reservation.baby_seat_count} bebek koltuğu
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {filter === 'pending_admin_review' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(reservation)}
                            disabled={processingId === reservation.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Onayla
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(reservation)}
                            disabled={processingId === reservation.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reddet
                          </Button>
                        </>
                      )}
                      {filter === 'completed' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(reservation)}
                          disabled={processingId === reservation.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Sil
                        </Button>
                      )}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rezervasyonu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {reservationToDelete && (
                <>
                  <strong>{reservationToDelete.reservation_code}</strong> kodlu rezervasyonu silmek istediğinizden emin misiniz?
                  <br /><br />
                  <span className="font-medium">{reservationToDelete.customer_name}</span> - {format(new Date(reservationToDelete.pickup_date), 'dd MMMM yyyy', { locale: tr })}
                  <br /><br />
                  Bu işlem geri alınamaz ve rezervasyon kalıcı olarak silinecektir.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFilteredReservations;
