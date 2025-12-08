import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, User, CreditCard, UserCheck, Pencil, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import NotificationBell from '@/components/NotificationBell';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
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
};

const statusLabels: Record<string, string> = {
  'pending_price': 'Pending Price',
  'waiting_for_customer_approval': 'Waiting Customer',
  'customer_approved': 'Approved',
  'customer_rejected': 'Rejected',
  'confirmed': 'Confirmed',
  'sent_to_driver': 'Sent to Driver',
  'active': 'Active',
  'completed': 'Completed',
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

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return '-';
    const symbol = currencySymbols[currency || 'TRY'] || currency || '';
    return `${symbol}${price}`;
  };

  const fetchReservations = async () => {
    let query = supabase
      .from('reservations')
      .select(`
        *,
        drivers (id, name)
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
            toast.info('New reservation received');
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
      toast.error('Failed to assign driver');
    } else {
      // Audit log
      await logAction({
        action: 'ASSIGN_DRIVER',
        table_name: 'reservations',
        record_id: assignDialog.reservationId,
        old_data: { driver_id: oldDriverId, status: reservation?.status },
        new_data: { driver_id: selectedDriver, status: 'sent_to_driver', driver_name: selectedDriverData?.name },
      });

      // Notify driver with price
      if (selectedDriverData?.user_id && reservation) {
        try {
          const priceDisplay = formatPrice(reservation.price, reservation.price_currency);
          await supabase.functions.invoke('create-notification', {
            body: {
              user_id: selectedDriverData.user_id,
              reservation_id: assignDialog.reservationId,
              title: 'New Job Assigned',
              message: `New transfer: ${reservation.pickup} → ${reservation.dropoff} on ${format(new Date(reservation.pickup_date), 'PP')} at ${reservation.pickup_time}. Price: ${priceDisplay}`,
              type: 'driver_assigned'
            }
          });
        } catch (err) {
          console.error('Failed to create notification:', err);
        }
      }

      toast.success('Driver assigned successfully');
      setAssignDialog({ open: false, reservationId: null });
      setSelectedDriver('');
      fetchReservations();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;

    const reservationToDelete = reservations.find(r => r.id === id);

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete reservation');
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

      toast.success('Reservation deleted');
      fetchReservations();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Reservations</h1>
        </div>
        <NotificationBell />
      </header>

      <main className="container mx-auto py-8 px-4">
        {/* Header with Create Button */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">All Reservations</h2>
          <Button onClick={() => navigate('/admin/reservations/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Reservation
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Input
            placeholder="Search customer, pickup, dropoff..."
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
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending_price">Pending Price</SelectItem>
              <SelectItem value="waiting_for_customer_approval">Waiting Customer</SelectItem>
              <SelectItem value="customer_approved">Customer Approved</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="customer_rejected">Rejected</SelectItem>
              <SelectItem value="sent_to_driver">Sent to Driver</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Needs Driver Assignment Section */}
        {!loading && (() => {
          const needsAssignment = reservations.filter(
            r => (r.status === 'confirmed' || r.status === 'customer_approved') && !r.driver_id
          );
          if (needsAssignment.length === 0) return null;
          return (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-lg font-semibold text-amber-700">
                  Needs Driver Assignment ({needsAssignment.length})
                </h3>
              </div>
              <div className="space-y-3">
                {needsAssignment.map((reservation) => (
                  <Card key={reservation.id} className="border-amber-300 bg-amber-50/50">
                    <CardContent className="py-4">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge className={statusColors[reservation.status] || 'bg-muted'}>
                              {statusLabels[reservation.status] || reservation.status}
                            </Badge>
                            <span className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(reservation.pickup_date), 'PPP')}
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

                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              {reservation.payment_type}
                            </span>
                            <span className="font-bold text-primary">
                              {formatPrice(reservation.price, reservation.price_currency)}
                            </span>
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
                          Assign Driver
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
          <div className="text-center py-12">Loading...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No reservations found</div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <Card key={reservation.id}>
                <CardContent className="py-4">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[reservation.status] || 'bg-muted'}>
                          {statusLabels[reservation.status] || reservation.status}
                        </Badge>
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(reservation.pickup_date), 'PPP')}
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

                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {reservation.payment_type}
                        </span>
                        <span className="font-bold text-primary">
                          {formatPrice(reservation.price, reservation.price_currency)}
                        </span>
                        {reservation.drivers && (
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            {reservation.drivers.name}
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
                          Assign Driver
                        </Button>
                      )}
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
      </main>

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ ...assignDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Select a driver to assign to this reservation. The driver will receive a notification with the job details.
          </p>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger>
              <SelectValue placeholder="Select a driver" />
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
              Cancel
            </Button>
            <Button onClick={handleAssignDriver} disabled={!selectedDriver}>
              Assign & Notify Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReservations;