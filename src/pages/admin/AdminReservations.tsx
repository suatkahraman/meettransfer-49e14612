import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, User, CreditCard, UserCheck, Pencil, Trash2, Plus, Copy, CheckSquare, Square, X, AlertTriangle, Building2, Banknote, CheckCircle2, Clock3 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import NotificationBell from '@/components/NotificationBell';

interface Reservation {
  id: string;
  reservation_code: string | null;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  payment_type: string;
  payment_status: string | null;
  price: number | null;
  price_currency: string | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  admin_set_price: number | null;
  status: string;
  driver_id: string | null;
  agency_id: string | null;
  drivers?: {
    id: string;
    name: string;
  } | null;
  agencies?: {
    id: string;
    agency_name: string;
  } | null;
  agency_reservation_details?: {
    customer_price: number | null;
    company_amount: number | null;
    agency_profit: number | null;
    agency_price_currency: string | null;
    payment_status: string | null;
  } | null;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  user_id: string;
}

const statusColors: Record<string, string> = {
  'pending_price': 'bg-orange-500/20 text-orange-700',
  'waiting_for_customer_approval': 'bg-purple-500/20 text-purple-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'customer_rejected': 'bg-destructive/20 text-destructive',
  'confirmed': 'bg-emerald-500/20 text-emerald-700',
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
  'pending_admin_review': 'bg-amber-500/20 text-amber-700',
  'cancelled_by_customer': 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, string> = {
  'pending_price': 'Fiyat Bekliyor',
  'waiting_for_customer_approval': 'Müşteri Onayı Bekliyor',
  'customer_approved': 'Onaylandı',
  'customer_rejected': 'Reddedildi',
  'confirmed': 'Onaylandı',
  'sent_to_driver': 'Şoföre Gönderildi',
  'active': 'Aktif',
  'completed': 'Tamamlandı',
  'pending_admin_review': 'İnceleme Bekliyor',
  'cancelled_by_customer': 'Müşteri İptal Etti',
};

const currencySymbols: Record<string, string> = {
  'TRY': '₺',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
};

const AdminReservations = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const { playSound } = useNotificationSound();
  const { emailDriverAssigned } = useEmailNotifications();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    search: '',
  });
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; reservationId: string | null }>({
    open: false,
    reservationId: null,
  });
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssignDialog, setBulkAssignDialog] = useState(false);
  const [bulkAssigning, setBulkAssigning] = useState(false);

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return '-';
    const symbol = currencySymbols[currency || 'TRY'] || currency || '';
    return `${symbol}${price}`;
  };

  const isPriceModifiedByDriver = (reservation: Reservation) => {
    if (reservation.admin_set_price === null || reservation.price === null) return false;
    return reservation.price !== reservation.admin_set_price;
  };

  const fetchReservations = async () => {
    let query = supabase
      .from('reservations')
      .select(`
        *,
        drivers (id, name),
        agencies (id, agency_name),
        agency_reservation_details (customer_price, company_amount, agency_profit, agency_price_currency, payment_status)
      `)
      .order('pickup_date', { ascending: false });

    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.date) {
      query = query.eq('pickup_date', filters.date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error:', error);
    } else {
      let filtered = data || [];
      
      // KURAL: Tamamlanmış + Acentaya bağlı + Acenta fiyatı kaydedilmiş rezervasyonlar
      // Ana listeden KESİNLİKLE kaldırılmalı - SADECE Acenta Muhasebesinde görünmeli
      filtered = filtered.filter(r => {
        const isCompleted = r.status === 'completed';
        const hasAgency = r.agency_id !== null && r.agency_id !== undefined;
        const hasAgencyPrice = r.agency_reservation_details?.customer_price !== null && 
                               r.agency_reservation_details?.customer_price !== undefined &&
                               Number(r.agency_reservation_details?.customer_price) > 0;
        
        // 3 koşul da sağlanıyorsa → Admin rezervasyon listesinden ÇIKAR
        if (isCompleted && hasAgency && hasAgencyPrice) {
          return false;
        }
        return true;
      });
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(r => 
          r.customer_name.toLowerCase().includes(search) ||
          r.pickup.toLowerCase().includes(search) ||
          r.dropoff.toLowerCase().includes(search)
        );
      }
      setReservations(filtered);
    }
    setLoading(false);
  };

  const fetchDrivers = async () => {
    const { data } = await supabase
      .from('drivers')
      .select('id, name, phone, user_id')
      .eq('active', true);
    setDrivers(data || []);
  };

  useEffect(() => {
    fetchReservations();
    fetchDrivers();
  }, [filters.status, filters.date]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReservations();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Real-time subscription for reservations
  useEffect(() => {
    const channel = supabase
      .channel('admin-reservations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          console.log('Reservation change:', payload);
          fetchReservations();
          if (payload.eventType === 'INSERT') {
            playSound();
            toast.info('Yeni rezervasyon alındı');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters.status, filters.date]);

  const handleAssignDriver = async () => {
    if (!assignDialog.reservationId || !selectedDriver) return;

    // Get the reservation details
    const reservation = reservations.find(r => r.id === assignDialog.reservationId);
    const selectedDriverData = drivers.find(d => d.id === selectedDriver);
    const oldDriverId = reservation?.driver_id;

    const { error } = await supabase
      .from('reservations')
      .update({ 
        driver_id: selectedDriver,
        status: 'sent_to_driver'
      })
      .eq('id', assignDialog.reservationId);

    if (error) {
      toast.error('Şoför atanamadı');
    } else {
      // Audit log
      await logAction({
        action: 'ASSIGN_DRIVER',
        table_name: 'reservations',
        record_id: assignDialog.reservationId,
        old_data: { driver_id: oldDriverId, status: reservation?.status },
        new_data: { driver_id: selectedDriver, status: 'sent_to_driver', driver_name: selectedDriverData?.name },
      });

      // Notify driver with price (push notification)
      if (selectedDriverData?.user_id && reservation) {
        try {
          const priceDisplay = formatPrice(reservation.price, reservation.price_currency);
          await supabase.functions.invoke('create-notification', {
            body: {
              user_id: selectedDriverData.user_id,
              reservation_id: assignDialog.reservationId,
              title: 'Yeni İş Atandı',
              message: `Yeni transfer: ${reservation.pickup} → ${reservation.dropoff} tarih ${format(new Date(reservation.pickup_date), 'PP', { locale: tr })} saat ${reservation.pickup_time}. Fiyat: ${priceDisplay}`,
              type: 'driver_assigned'
            }
          });
        } catch (err) {
          console.error('Failed to create notification:', err);
        }
      }

      // Send email to driver
      if (assignDialog.reservationId) {
        try {
          // Get driver email from auth.users via edge function
          await emailDriverAssigned(assignDialog.reservationId);
          console.log('Driver assignment email sent');
        } catch (err) {
          console.error('Failed to send driver email:', err);
        }
      }

      toast.success('Şoför başarıyla atandı');
      setAssignDialog({ open: false, reservationId: null });
      setSelectedDriver('');
      fetchReservations();
    }
  };

  // Bulk assignment logic
  const assignableReservations = reservations.filter(
    r => (r.status === 'confirmed' || r.status === 'customer_approved') && !r.driver_id
  );

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === assignableReservations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assignableReservations.map(r => r.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkAssign = async () => {
    if (!selectedDriver || selectedIds.size === 0) return;

    setBulkAssigning(true);
    const selectedDriverData = drivers.find(d => d.id === selectedDriver);

    try {
      // Update all selected reservations
      const { error } = await supabase
        .from('reservations')
        .update({ 
          driver_id: selectedDriver,
          status: 'sent_to_driver'
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      // Audit log for bulk action
      await logAction({
        action: 'BULK_ASSIGN_DRIVER',
        table_name: 'reservations',
        new_data: { 
          driver_id: selectedDriver, 
          driver_name: selectedDriverData?.name,
          reservation_count: selectedIds.size,
          reservation_ids: Array.from(selectedIds)
        },
      });

      // Send notifications for each reservation
      if (selectedDriverData?.user_id) {
        for (const id of selectedIds) {
          const reservation = reservations.find(r => r.id === id);
          if (reservation) {
            try {
              const priceDisplay = formatPrice(reservation.price, reservation.price_currency);
              await supabase.functions.invoke('create-notification', {
                body: {
                  user_id: selectedDriverData.user_id,
                  reservation_id: id,
                  title: 'Yeni İş Atandı',
                  message: `Yeni transfer: ${reservation.pickup} → ${reservation.dropoff} tarih ${format(new Date(reservation.pickup_date), 'PP', { locale: tr })} saat ${reservation.pickup_time}. Fiyat: ${priceDisplay}`,
                  type: 'driver_assigned'
                }
              });
            } catch (err) {
              console.error('Failed to notify for reservation:', id, err);
            }
          }
        }
      }

      toast.success(`${selectedIds.size} rezervasyon ${selectedDriverData?.name} şoföre atandı`);
      setBulkAssignDialog(false);
      setSelectedDriver('');
      setSelectedIds(new Set());
      fetchReservations();
    } catch (error: any) {
      toast.error(error.message || 'Şoför atanamadı');
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) return;

    const reservationToDelete = reservations.find(r => r.id === id);

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Rezervasyon silinemedi');
    } else {
      await logAction({
        action: 'DELETE',
        table_name: 'reservations',
        record_id: id,
        old_data: reservationToDelete ? {
          customer_name: reservationToDelete.customer_name,
          pickup: reservationToDelete.pickup,
          dropoff: reservationToDelete.dropoff,
          pickup_date: reservationToDelete.pickup_date,
          status: reservationToDelete.status,
        } : undefined,
      });

      toast.success('Rezervasyon silindi');
      fetchReservations();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Rezervasyonlar</h1>
        </div>
        <NotificationBell />
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8 px-4">
        {/* Header with Create Button */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Tüm Rezervasyonlar</h2>
          <Button onClick={() => navigate('/admin/reservations/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Rezervasyon Oluştur
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Input
            placeholder="Müşteri, alış, bırakış ara..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="max-w-xs"
          />
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({...filters, date: e.target.value})}
            className="max-w-[180px]"
          />
          <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="pending_price">Fiyat Bekliyor</SelectItem>
              <SelectItem value="waiting_for_customer_approval">Müşteri Onayı Bekliyor</SelectItem>
              <SelectItem value="customer_approved">Müşteri Onayladı</SelectItem>
              <SelectItem value="confirmed">Onaylandı</SelectItem>
              <SelectItem value="customer_rejected">Reddedildi</SelectItem>
              <SelectItem value="sent_to_driver">Şoföre Gönderildi</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="pending_admin_review">İnceleme Bekliyor</SelectItem>
              <SelectItem value="cancelled_by_customer">Müşteri İptal Etti</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Selection Bar */}
        {assignableReservations.length > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            <Checkbox 
              checked={selectedIds.size === assignableReservations.length && assignableReservations.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size === 0 
                ? `${assignableReservations.length} rezervasyon şoför ataması bekliyor`
                : `${selectedIds.size} / ${assignableReservations.length} seçildi`}
            </span>
            {selectedIds.size > 0 && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setSelectedDriver('');
                    setBulkAssignDialog(true);
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  {selectedIds.size} Rezervasyona Şoför Ata
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4 mr-1" />
                  Temizle
                </Button>
              </>
            )}
          </div>
        )}

        {/* Needs Admin Review Section */}
        {!loading && (() => {
          const needsReview = reservations.filter(r => r.status === 'pending_admin_review');
          if (needsReview.length === 0) return null;
          return (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-lg font-semibold text-amber-700">
                  İnceleme Bekliyor - Müşteri Düzenledi ({needsReview.length})
                </h3>
              </div>
              <div className="space-y-3">
                {needsReview.map((reservation) => (
                  <Card 
                    key={reservation.id} 
                    className="border-amber-300 bg-amber-50/50 cursor-pointer hover:shadow-md"
                    onClick={() => navigate(`/admin/reservations/${reservation.id}`)}
                  >
                    <CardContent className="py-4">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-amber-500/20 text-amber-700">
                              İnceleme Bekliyor
                            </Badge>
                            <span className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(reservation.pickup_date), 'PPP', { locale: tr })}
                            </span>
                            <span className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4" />
                              {reservation.pickup_time}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{reservation.customer_name}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{reservation.pickup}</span>
                            <span>→</span>
                            <span>{reservation.dropoff}</span>
                          </div>
                        </div>
                        
                        <Button size="sm">
                          Değişiklikleri İncele
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Needs Driver Assignment Section */}
        {!loading && (() => {
          const needsAssignment = assignableReservations;
          if (needsAssignment.length === 0) return null;
          return (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-lg font-semibold text-amber-700">
                  Şoför Ataması Bekliyor ({needsAssignment.length})
                </h3>
              </div>
              <div className="space-y-3">
                {needsAssignment.map((reservation) => (
                  <Card 
                    key={reservation.id} 
                    className={`border-amber-300 bg-amber-50/50 ${selectedIds.has(reservation.id) ? 'ring-2 ring-primary' : ''}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex gap-3">
                          <Checkbox 
                            checked={selectedIds.has(reservation.id)}
                            onCheckedChange={() => toggleSelect(reservation.id)}
                            className="mt-1"
                          />
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge className={statusColors[reservation.status] || 'bg-muted'}>
                                {statusLabels[reservation.status] || reservation.status}
                              </Badge>
                              <span className="flex items-center gap-1 text-sm">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(reservation.pickup_date), 'PPP', { locale: tr })}
                              </span>
                              <span className="flex items-center gap-1 text-sm">
                                <Clock className="h-4 w-4" />
                                {reservation.pickup_time}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{reservation.customer_name}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-sm text-muted-foreground">{reservation.customer_phone}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span>{reservation.pickup}</span>
                              <span>→</span>
                              <span>{reservation.dropoff}</span>
                            </div>

                            <div className="flex items-center gap-4 text-sm flex-wrap">
                              {reservation.payment_type === 'payment_link' ? (
                                <>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Payment Link
                                  </Badge>
                                  {reservation.payment_status === 'paid' ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Ödendi
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                      <Clock3 className="h-3 w-3 mr-1" />
                                      Ödeme Bekliyor
                                    </Badge>
                                  )}
                                </>
                              ) : reservation.payment_type === 'agency_pay' ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  Acenta Öder
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Banknote className="h-3 w-3 mr-1" />
                                  Nakit
                                </Badge>
                              )}
                              <span className={`font-bold ${isPriceModifiedByDriver(reservation) ? 'text-amber-600' : 'text-primary'}`}>
                                {formatPrice(reservation.price, reservation.price_currency)}
                                {isPriceModifiedByDriver(reservation) && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                    <AlertTriangle className="h-3 w-3" />
                                    Değiştirildi
                                  </span>
                                )}
                              </span>
                              {/* Yolcudan Alınacak Nakit */}
                              {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
                                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  💵 {currencySymbols[reservation.passenger_cash_currency || 'TRY'] || '₺'}{reservation.passenger_cash_amount}
                                </span>
                              )}
                              {reservation.agencies && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <Building2 className="h-4 w-4" />
                                  {reservation.agencies.agency_name}
                                  {reservation.agency_reservation_details?.customer_price && (
                                    <span className="font-bold ml-1">
                                      ({formatPrice(reservation.agency_reservation_details.customer_price, reservation.agency_reservation_details.agency_price_currency || 'USD')})
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={() => {
                            setAssignDialog({ open: true, reservationId: reservation.id });
                            setSelectedDriver('');
                          }}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Şoför Ata
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })()}

        {/* All Reservations List */}
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Rezervasyon bulunamadı</div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <Card key={reservation.id}>
                <CardContent className="py-4">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        {reservation.reservation_code && (
                          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{reservation.reservation_code}</span>
                        )}
                        <Badge className={statusColors[reservation.status] || 'bg-muted'}>
                          {statusLabels[reservation.status] || reservation.status}
                        </Badge>
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(reservation.pickup_date), 'PPP', { locale: tr })}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4" />
                          {reservation.pickup_time}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{reservation.customer_name}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">{reservation.customer_phone}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{reservation.pickup}</span>
                        <span>→</span>
                        <span>{reservation.dropoff}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        {reservation.payment_type === 'payment_link' ? (
                          <>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <CreditCard className="h-3 w-3 mr-1" />
                              Payment Link
                            </Badge>
                            {reservation.payment_status === 'paid' ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ödendi
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <Clock3 className="h-3 w-3 mr-1" />
                                Ödeme Bekliyor
                              </Badge>
                            )}
                          </>
                        ) : reservation.payment_type === 'agency_pay' ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <Building2 className="h-3 w-3 mr-1" />
                            Acenta Öder
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Banknote className="h-3 w-3 mr-1" />
                            Nakit
                          </Badge>
                        )}
                        <span className={`font-bold ${isPriceModifiedByDriver(reservation) ? 'text-amber-600' : 'text-primary'}`}>
                          {formatPrice(reservation.price, reservation.price_currency)}
                          {isPriceModifiedByDriver(reservation) && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="h-3 w-3" />
                              Değiştirildi (önceki: {formatPrice(reservation.admin_set_price, reservation.price_currency)})
                            </span>
                          )}
                        </span>
                        {/* Yolcudan Alınacak Nakit */}
                        {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
                          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            💵 {currencySymbols[reservation.passenger_cash_currency || 'TRY'] || '₺'}{reservation.passenger_cash_amount}
                          </span>
                        )}
                        {reservation.drivers && (
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            {reservation.drivers.name}
                          </span>
                        )}
                        {reservation.agencies && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Building2 className="h-4 w-4" />
                            {reservation.agencies.agency_name}
                            {reservation.agency_reservation_details?.customer_price && (
                              <span className="font-bold ml-1">
                                ({formatPrice(reservation.agency_reservation_details.customer_price, reservation.agency_reservation_details.agency_price_currency || 'USD')})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(reservation.status === 'customer_approved' || reservation.status === 'confirmed') && !reservation.driver_id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setAssignDialog({ open: true, reservationId: reservation.id });
                            setSelectedDriver(reservation.driver_id || '');
                          }}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Şoför Ata
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const params = new URLSearchParams({
                            customer_name: reservation.customer_name,
                            customer_phone: reservation.customer_phone,
                            pickup: reservation.pickup,
                            dropoff: reservation.dropoff,
                            vehicle_type: reservation.vehicle_type,
                            payment_type: reservation.payment_type,
                            price: reservation.price?.toString() || '',
                            price_currency: reservation.price_currency || 'TRY',
                            flight_number: reservation.flight_number || '',
                          });
                          navigate(`/admin/reservations/create?${params.toString()}`);
                        }}
                        title="Rezervasyonu kopyala"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/reservations/${reservation.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(reservation.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ ...assignDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şoför Ata</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Bu rezervasyona atanacak şoförü seçin. Şoför iş detayları hakkında bildirim alacak.
          </p>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger>
              <SelectValue placeholder="Şoför seçin" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map(driver => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name} - {driver.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, reservationId: null })}>
              İptal
            </Button>
            <Button onClick={handleAssignDriver} disabled={!selectedDriver}>
              Ata ve Bildir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkAssignDialog} onOpenChange={setBulkAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Toplu Şoför Ata</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            <strong>{selectedIds.size}</strong> seçili rezervasyona şoför ata. Her şoför ayrı ayrı bildirim alacak.
          </p>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger>
              <SelectValue placeholder="Şoför seçin" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map(driver => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name} - {driver.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleBulkAssign} disabled={!selectedDriver || bulkAssigning}>
              {bulkAssigning ? 'Atanıyor...' : `${selectedIds.size} Rezervasyona Ata`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReservations;
