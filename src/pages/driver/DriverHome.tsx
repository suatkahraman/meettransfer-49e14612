import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Calendar, Car, AlertCircle, CheckCircle2, Loader2, Bell, Calculator, ChevronDown, RefreshCw, History } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { PushNotificationToggle } from '@/components/PushNotificationToggle';
import { toast } from 'sonner';
import SwipeableJobCard from '@/components/driver/SwipeableJobCard';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  driver_confirmed: boolean | null;
}

const PULL_THRESHOLD = 80;

const DriverHome = () => {
  const { signOut } = useAuth();
  const { driverId } = useUserRole();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { playSound } = useNotificationSound();
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    active: true,
    completed: false
  });

  const pullY = useMotionValue(0);
  const pullProgress = useTransform(pullY, [0, PULL_THRESHOLD], [0, 1]);
  const pullRotation = useTransform(pullY, [0, PULL_THRESHOLD], [0, 180]);
  const pullOpacity = useTransform(pullY, [0, 40, PULL_THRESHOLD], [0, 0.5, 1]);

  const fetchReservations = useCallback(async (showToast = false) => {
    if (!driverId) return;

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('driver_id', driverId)
      .in('status', ['sent_to_driver', 'assigned', 'active', 'completed'])
      .order('pickup_date', { ascending: true })
      .order('pickup_time', { ascending: true });

    if (error) {
      console.error('Error:', error);
      if (showToast) toast.error('Failed to refresh');
    } else {
      // Sort by combined date and time for accurate ordering
      const sortedData = (data || []).sort((a, b) => {
        const dateTimeA = new Date(`${a.pickup_date}T${a.pickup_time}`);
        const dateTimeB = new Date(`${b.pickup_date}T${b.pickup_time}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });
      setReservations(sortedData);
      if (showToast) toast.success('Jobs refreshed');
    }
    setLoading(false);
    setRefreshing(false);
  }, [driverId]);

  const handlePullEnd = async (_: any, info: PanInfo) => {
    if (info.offset.y > PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      await fetchReservations(true);
    }
  };

  useEffect(() => {
    if (driverId) {
      fetchReservations();
    }
  }, [driverId]);

  // Real-time subscription for new job assignments
  useEffect(() => {
    if (!driverId) return;

    const channel = supabase
      .channel('driver-jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newReservation = payload.new as Reservation;
            if (['sent_to_driver', 'assigned', 'active', 'completed'].includes(newReservation.status)) {
              setReservations(prev => {
                const updated = [...prev, newReservation];
                // Re-sort by date/time
                return updated.sort((a, b) => {
                  const dateTimeA = new Date(`${a.pickup_date}T${a.pickup_time}`);
                  const dateTimeB = new Date(`${b.pickup_date}T${b.pickup_time}`);
                  return dateTimeA.getTime() - dateTimeB.getTime();
                });
              });
              playSound();
              toast.success('New job assigned!', {
                description: `${newReservation.pickup} → ${newReservation.dropoff}`,
                icon: <Bell className="h-4 w-4" />
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedReservation = payload.new as Reservation;
            // Keep the reservation visible if it's in valid statuses
            if (['sent_to_driver', 'assigned', 'active', 'completed'].includes(updatedReservation.status)) {
              setReservations(prev => {
                const updated = prev.map(r => r.id === updatedReservation.id ? updatedReservation : r);
                // Re-sort after update
                return updated.sort((a, b) => {
                  const dateTimeA = new Date(`${a.pickup_date}T${a.pickup_time}`);
                  const dateTimeB = new Date(`${b.pickup_date}T${b.pickup_time}`);
                  return dateTimeA.getTime() - dateTimeB.getTime();
                });
              });
            } else {
              // Remove if status changed to something we don't track
              setReservations(prev => prev.filter(r => r.id !== updatedReservation.id));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setReservations(prev => prev.filter(r => r.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  const handleAcceptJob = async (id: string) => {
    const { error } = await supabase
      .from('reservations')
      .update({ driver_confirmed: true, status: 'active' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to accept job');
    } else {
      toast.success('Job accepted! Passenger pickup confirmed.');
      setReservations(prev => 
        prev.map(r => r.id === id ? { ...r, driver_confirmed: true, status: 'active' } : r)
      );
    }
  };

  const handleCompleteJob = async (id: string) => {
    const reservation = reservations.find(r => r.id === id);
    
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'completed' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to complete job');
    } else {
      toast.success('Trip completed successfully!');
      setReservations(prev => 
        prev.map(r => r.id === id ? { ...r, status: 'completed' } : r)
      );
    }
  };

  const toggleSection = (section: 'pending' | 'active' | 'completed') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get current date/time for separating upcoming vs past
  const now = new Date();

  // Separate reservations by status and time
  const pendingJobs = reservations.filter(r => r.status === 'sent_to_driver' || r.status === 'assigned');
  const activeJobs = reservations.filter(r => r.status === 'active');
  
  // Separate completed into recent (today) and past
  const completedJobs = reservations.filter(r => r.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized sticky header */}
      <header className="bg-primary text-primary-foreground py-3 px-4 flex justify-between items-center sticky top-0 z-20 shadow-lg">
        <h1 className="text-lg font-serif font-bold">Driver Panel</h1>
        <div className="flex items-center gap-1">
          <PushNotificationToggle />
          <NotificationBell />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/driver/history')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <History className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/driver/accounting')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <Calculator className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <motion.main 
        className="pb-8 px-4 max-w-lg mx-auto relative"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragEnd={handlePullEnd}
        style={{ y: pullY }}
      >
        {/* Pull to refresh indicator */}
        <motion.div 
          className="absolute left-1/2 -translate-x-1/2 -top-12 flex flex-col items-center gap-1"
          style={{ opacity: pullOpacity }}
        >
          <motion.div style={{ rotate: pullRotation }}>
            <RefreshCw className={cn("h-6 w-6 text-primary", refreshing && "animate-spin")} />
          </motion.div>
          <span className="text-xs text-muted-foreground">
            {refreshing ? 'Refreshing...' : 'Pull to refresh'}
          </span>
        </motion.div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reservations.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No jobs assigned yet</p>
            <p className="text-sm text-muted-foreground mt-2">New jobs will appear here</p>
          </motion.div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* Pending Jobs Section */}
            {pendingJobs.length > 0 && (
              <section>
                <button 
                  onClick={() => toggleSection('pending')}
                  className="flex items-center justify-between w-full py-2 mb-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="font-semibold">New Jobs</span>
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-700">
                      {pendingJobs.length}
                    </Badge>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    expandedSections.pending && "rotate-180"
                  )} />
                </button>
                <AnimatePresence>
                  {expandedSections.pending && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {pendingJobs.map((reservation, index) => (
                        <motion.div
                          key={reservation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <SwipeableJobCard
                            reservation={reservation}
                            onAccept={() => handleAcceptJob(reservation.id)}
                            onClick={() => navigate(`/driver/job/${reservation.id}`)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {/* Active Jobs Section */}
            {activeJobs.length > 0 && (
              <section>
                <button 
                  onClick={() => toggleSection('active')}
                  className="flex items-center justify-between w-full py-2 mb-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-semibold">In Progress</span>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-700">
                      {activeJobs.length}
                    </Badge>
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
                      {activeJobs.map((reservation, index) => (
                        <motion.div
                          key={reservation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <SwipeableJobCard
                            reservation={reservation}
                            onComplete={() => handleCompleteJob(reservation.id)}
                            onClick={() => navigate(`/driver/job/${reservation.id}`)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {/* Completed Jobs Section */}
            {completedJobs.length > 0 && (
              <section>
                <button 
                  onClick={() => toggleSection('completed')}
                  className="flex items-center justify-between w-full py-2 mb-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-semibold">Completed</span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                      {completedJobs.length}
                    </Badge>
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
                      {completedJobs.map((reservation, index) => (
                        <motion.div
                          key={reservation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <SwipeableJobCard
                            reservation={reservation}
                            onClick={() => navigate(`/driver/job/${reservation.id}`)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}
          </div>
        )}
      </motion.main>
    </div>
  );
};

export default DriverHome;
