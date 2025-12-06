import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, User, CreditCard, UserCheck, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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
  price: number;
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
}

const statusColors: Record<string, string> = {
  new: 'bg-muted text-muted-foreground',
  assigned: 'bg-yellow-500/20 text-yellow-700',
  active: 'bg-blue-500/20 text-blue-700',
  completed: 'bg-green-500/20 text-green-700',
  cancelled: 'bg-destructive/20 text-destructive',
};

const AdminReservations = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
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
      .select('id, name, phone')
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

  const handleAssignDriver = async () => {
    if (!assignDialog.reservationId || !selectedDriver) return;

    const { error } = await supabase
      .from('reservations')
      .update({ 
        driver_id: selectedDriver,
        status: 'assigned'
      })
      .eq('id', assignDialog.reservationId);

    if (error) {
      toast.error('Failed to assign driver');
    } else {
      toast.success('Driver assigned successfully');
      setAssignDialog({ open: false, reservationId: null });
      setSelectedDriver('');
      fetchReservations();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete reservation');
    } else {
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
      </header>

      <main className="container mx-auto py-8 px-4">
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
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reservations List */}
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
                        <Badge className={statusColors[reservation.status]}>{reservation.status}</Badge>
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
                        <span className="font-bold text-primary">€{reservation.price}</span>
                        {reservation.drivers && (
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            {reservation.drivers.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setAssignDialog({ open: true, reservationId: reservation.id });
                          setSelectedDriver(reservation.driver_id || '');
                        }}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Assign
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
      </main>

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ ...assignDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
          </DialogHeader>
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
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReservations;
