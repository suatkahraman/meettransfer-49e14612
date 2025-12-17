import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Calendar, User, Loader2, BarChart3, Clock, Car, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LocationDisplay } from '@/components/ui/location-display';

interface Driver {
  id: string;
  name: string;
  plate_number: string | null;
}

interface Reservation {
  id: string;
  reservation_code: string | null;
  customer_name: string;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  vehicle_type: string;
  status: string;
  driver_id: string | null;
  drivers?: Driver | null;
}

const statusColors: Record<string, string> = {
  'pending_price': 'bg-gray-500/20 text-gray-700',
  'awaiting-price': 'bg-gray-500/20 text-gray-700',
  'waiting_for_customer_approval': 'bg-yellow-500/20 text-yellow-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'confirmed': 'bg-green-500/20 text-green-700',
  'sent_to_driver': 'bg-purple-500/20 text-purple-700',
  'assigned': 'bg-purple-500/20 text-purple-700',
  'active': 'bg-blue-500/20 text-blue-700',
  'completed': 'bg-green-500/20 text-green-700',
  'cancelled': 'bg-red-500/20 text-red-700',
};

const statusLabels: Record<string, string> = {
  'pending_price': 'Pending Price',
  'awaiting-price': 'Awaiting Price',
  'waiting_for_customer_approval': 'Awaiting Customer',
  'customer_approved': 'Customer Approved',
  'confirmed': 'Confirmed',
  'sent_to_driver': 'Sent to Driver',
  'assigned': 'Assigned',
  'active': 'Active',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
};

const AgencyHome = () => {
  const { signOut } = useAuth();
  const { agencyId } = useUserRole();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agency, setAgency] = useState<{ agency_name: string; balance: number } | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    upcoming: true,
    active: true,
    completed: false
  });

  const fetchData = useCallback(async (showToast = false) => {
    if (!agencyId) return;

    // Fetch agency info
    const { data: agencyData } = await supabase
      .from('agencies')
      .select('agency_name, balance')
      .eq('id', agencyId)
      .single();

    if (agencyData) {
      setAgency(agencyData);
    }

    // Fetch reservations with driver info
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id, reservation_code, customer_name, pickup, dropoff,
        pickup_place_name, dropoff_place_name,
        pickup_date, pickup_time, vehicle_type, status, driver_id,
        drivers:driver_id (id, name, plate_number)
      `)
      .eq('agency_id', agencyId)
      .order('pickup_date', { ascending: true })
      .order('pickup_time', { ascending: true });

    if (error) {
      console.error('Error:', error);
      if (showToast) toast.error('Failed to refresh');
    } else {
      setReservations(data || []);
      if (showToast) toast.success('Refreshed');
    }
    setLoading(false);
    setRefreshing(false);
  }, [agencyId]);

  useEffect(() => {
    if (agencyId) {
      fetchData();
    }
  }, [agencyId, fetchData]);

  // Real-time subscription
  useEffect(() => {
    if (!agencyId) return;

    const channel = supabase
      .channel('agency-reservations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `agency_id=eq.${agencyId}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
  };

  const toggleSection = (section: 'upcoming' | 'active' | 'completed') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const now = new Date();
  const upcomingJobs = reservations.filter(r => 
    !['completed', 'cancelled', 'active'].includes(r.status) && 
    new Date(`${r.pickup_date}T${r.pickup_time}`) >= now
  );
  const activeJobs = reservations.filter(r => r.status === 'active');
  const completedJobs = reservations.filter(r => r.status === 'completed');

  const ReservationCard = ({ reservation }: { reservation: Reservation }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/agency/reservation/${reservation.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            {reservation.reservation_code && (
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                {reservation.reservation_code}
              </span>
            )}
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{reservation.customer_name}</span>
            </div>
          </div>
          <Badge className={statusColors[reservation.status] || 'bg-muted'}>
            {statusLabels[reservation.status] || reservation.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(reservation.pickup_date), 'dd MMM yyyy')}</span>
            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
            <span>{reservation.pickup_time}</span>
          </div>

          <LocationDisplay
            placeName={reservation.pickup_place_name}
            address={reservation.pickup}
            type="pickup"
            size="sm"
          />
          <LocationDisplay
            placeName={reservation.dropoff_place_name}
            address={reservation.dropoff}
            type="dropoff"
            size="sm"
          />

          {reservation.drivers && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{reservation.drivers.name}</span>
              {reservation.drivers.plate_number && (
                <span className="text-muted-foreground">({reservation.drivers.plate_number})</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-serif font-bold">Agency Panel</h1>
          {agency && (
            <p className="text-sm opacity-80">{agency.agency_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/agency/reports')} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Balance Warning */}
      {agency && agency.balance < 0 && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4">
          <p className="text-destructive font-medium">
            ⚠️ Your balance is insufficient ({agency.balance.toFixed(2)} TRY). Please make a payment.
          </p>
        </div>
      )}

      <main className="container mx-auto py-6 px-4 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No reservations yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Section */}
            {upcomingJobs.length > 0 && (
              <section>
                <button 
                  onClick={() => toggleSection('upcoming')}
                  className="flex items-center justify-between w-full py-2 mb-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Upcoming Transfers</span>
                    <Badge variant="secondary">{upcomingJobs.length}</Badge>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    expandedSections.upcoming && "rotate-180"
                  )} />
                </button>
                <AnimatePresence>
                  {expandedSections.upcoming && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {upcomingJobs.map((res) => (
                        <ReservationCard key={res.id} reservation={res} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {/* Active Section */}
            {activeJobs.length > 0 && (
              <section>
                <button 
                  onClick={() => toggleSection('active')}
                  className="flex items-center justify-between w-full py-2 mb-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Active Transfers</span>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-700">{activeJobs.length}</Badge>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    expandedSections.active && "rotate-180"
                  )} />
                </button>
                <AnimatePresence>
                  {expandedSections.active && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {activeJobs.map((res) => (
                        <ReservationCard key={res.id} reservation={res} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {/* Completed Section */}
            {completedJobs.length > 0 && (
              <section>
                <button 
                  onClick={() => toggleSection('completed')}
                  className="flex items-center justify-between w-full py-2 mb-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Completed Transfers</span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-700">{completedJobs.length}</Badge>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    expandedSections.completed && "rotate-180"
                  )} />
                </button>
                <AnimatePresence>
                  {expandedSections.completed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {completedJobs.map((res) => (
                        <ReservationCard key={res.id} reservation={res} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AgencyHome;
