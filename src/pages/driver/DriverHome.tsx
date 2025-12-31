import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { checkCompletionEligibility } from '@/hooks/useCompletionValidation';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Calendar, Car, AlertCircle, CheckCircle2, Loader2, Bell, Calculator, ChevronDown, RefreshCw, History } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { PushNotificationToggle } from '@/components/PushNotificationToggle';
import { toast } from 'sonner';
import SwipeableJobCard from '@/components/driver/SwipeableJobCard';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReservationSearch from '@/components/ReservationSearch';

interface Reservation {
  id: string;
  customer_id: string;
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
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  status: string;
  driver_confirmed: boolean | null;
  agency_id: string | null;
  // Place details
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  // Agency details
  agencies?: {
    id: string;
    agency_name: string;
  } | null;
}

const PULL_THRESHOLD = 80;

const DriverHome = () => {
  const { signOut } = useAuth();
  const { driverId } = useUserRole();
  const navigate = useNavigate();
  const { t } = useDriverTranslations();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [adminNotesMap, setAdminNotesMap] = useState<Record<string, string>>({});
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
      .select('*, agencies (id, agency_name)')
      .eq('driver_id', driverId)
      .in('status', ['sent_to_driver', 'assigned', 'active', 'completed'])
      .order('pickup_date', { ascending: true })
      .order('pickup_time', { ascending: true });

    if (error) {
      console.error('Error:', error);
      if (showToast) toast.error(t('failedToRefresh'));
    } else {
      // Sort by combined date and time for accurate ordering
      const sortedData = (data || []).sort((a, b) => {
        const dateTimeA = new Date(`${a.pickup_date}T${a.pickup_time}`);
        const dateTimeB = new Date(`${b.pickup_date}T${b.pickup_time}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });
      setReservations(sortedData);
      
      // Fetch admin notes for all reservations
      if (sortedData.length > 0) {
        const ids = sortedData.map(r => r.id);
        const { data: notesData } = await supabase
          .from('reservation_admin_notes')
          .select('reservation_id, notes')
          .in('reservation_id', ids);
        
        if (notesData) {
          const notesObj: Record<string, string> = {};
          notesData.forEach(n => {
            if (n.notes) notesObj[n.reservation_id] = n.notes;
          });
          setAdminNotesMap(notesObj);
        }
      }
      
      if (showToast) toast.success(t('jobsRefreshed'));
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
              toast.success(t('newJobAssigned'), {
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
    const reservation = reservations.find(r => r.id === id);
    
    const { error } = await supabase
      .from('reservations')
      .update({ driver_confirmed: true, status: 'active' })
      .eq('id', id);

    if (error) {
      toast.error(t('failedToAccept'));
      return;
    }

    toast.success(t('jobAccepted'));
    setReservations(prev => 
      prev.map(r => r.id === id ? { ...r, driver_confirmed: true, status: 'active' } : r)
    );

    // Notify customer that driver accepted their reservation
    if (reservation) {
      try {
        // Get driver name, plate number and vehicle model
        const { data: driverData } = await supabase
          .from('drivers')
          .select('name, plate_number, vehicle_model')
          .eq('id', driverId)
          .maybeSingle();

        const driverName = driverData?.name || 'Your driver';
        const plateNumber = driverData?.plate_number || '';
        const vehicleModel = driverData?.vehicle_model || '';
        
        const vehicleInfo = vehicleModel ? `\n🚗 ${vehicleModel}${plateNumber ? ` (${plateNumber})` : ''}` : (plateNumber ? `\n🚗 Plate: ${plateNumber}` : '');

        // Create notification for customer
        await supabase.from('notifications').insert({
          user_id: reservation.customer_id,
          reservation_id: id,
          type: 'driver_accepted',
          title: '✅ Driver Confirmed',
          message: `Your driver: ${driverName}${vehicleInfo}`
        });

        // Try to send push notification to customer
        try {
          const pushBody = vehicleModel 
            ? `Your driver: ${driverName} - ${vehicleModel}${plateNumber ? ` (${plateNumber})` : ''}`
            : `Your driver: ${driverName}${plateNumber ? ` (${plateNumber})` : ''}`;
          
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: reservation.customer_id,
              title: '✅ Driver Confirmed',
              body: pushBody,
              data: { reservation_id: id }
            }
          });
        } catch (pushError) {
          console.log('Push notification failed (customer may not have enabled push):', pushError);
        }

        // Notify admins that driver accepted the job
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'driver_accepted',
            title: '✅ Driver Accepted Job',
            message: `${driverName} has accepted job #${id.slice(0, 8)}.`,
            notify_admins: true,
            reservation_id: id,
          }
        });
      } catch (notifyError) {
        console.error('Failed to notify customer:', notifyError);
        // Don't show error to driver - the main action succeeded
      }
    }
  };

  const handleCompleteJob = async (id: string) => {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) {
      toast.error(t('reservationNotFound'));
      return;
    }

    // Validate completion eligibility
    const validation = checkCompletionEligibility(reservation);
    if (!validation.canComplete) {
      if (validation.isCompleted) {
        toast.error(t('alreadyCompleted'));
      } else {
        toast.error(validation.reason || t('cannotCompleteNow'));
      }
      return;
    }
    
    const { error } = await supabase
      .from('reservations')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString() // Store completion timestamp
      })
      .eq('id', id);

    if (error) {
      toast.error(t('failedToComplete'));
    } else {
      toast.success(t('jobCompleted'));
      setReservations(prev => 
        prev.map(r => r.id === id ? { ...r, status: 'completed' } : r)
      );

      // Notify customer that trip is completed
      try {
        // Get driver name
        const { data: driverData } = await supabase
          .from('drivers')
          .select('name')
          .eq('id', driverId)
          .maybeSingle();

        // Create notification for customer
        await supabase.from('notifications').insert({
          user_id: reservation.customer_id,
          reservation_id: id,
          type: 'trip_completed',
          title: '🎉 Trip Completed',
          message: 'Your trip has been completed. Thank you for choosing Meet Transfer!'
        });

        // Try to send push notification to customer
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: reservation.customer_id,
              title: '🎉 Trip Completed',
              body: 'Your trip has been completed. Thank you for choosing Meet Transfer!',
              data: { reservation_id: id }
            }
          });
        } catch (pushError) {
          console.log('Push notification failed:', pushError);
        }

        // Notify admins
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'trip_completed',
            title: '✅ Trip Completed',
            message: `${driverData?.name || 'Driver'} completed trip #${id.slice(0, 8)}.`,
            notify_admins: true,
            reservation_id: id,
          }
        });
      } catch (notifyError) {
        console.error('Failed to send notifications:', notifyError);
      }
    }
  };

  const toggleSection = (section: 'pending' | 'active' | 'completed') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get current date/time for separating upcoming vs past
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Separate reservations by status and time
  const pendingJobs = reservations.filter(r => r.status === 'sent_to_driver' || r.status === 'assigned');
  const activeJobs = reservations.filter(r => r.status === 'active');
  
  // Only show completed jobs from current month (older ones go to history)
  const completedJobs = reservations.filter(r => {
    if (r.status !== 'completed') return false;
    const pickupDate = new Date(r.pickup_date);
    return pickupDate.getMonth() === currentMonth && pickupDate.getFullYear() === currentYear;
  });

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Mobile-optimized sticky header */}
      <header className="bg-primary text-primary-foreground py-3 px-4 flex justify-between items-center flex-shrink-0 z-20 shadow-lg">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-serif font-bold">{t('driverPanel')}</h1>
          {activeJobs.length > 0 && (
            <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-600">
              {activeJobs.length} {t('active')}
            </Badge>
          )}
          {pendingJobs.length > 0 && (
            <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600">
              {pendingJobs.length} {t('pending')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <PushNotificationToggle compact />
          <NotificationBell />
          <Button 
            variant="ghost" 
            onClick={() => navigate('/driver/history')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 px-2 gap-1"
          >
            <History className="h-5 w-5" />
            <span className="text-xs">{t('history')}</span>
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/driver/monthly-accounting')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 px-2 gap-1"
          >
            <Calculator className="h-5 w-5" />
            <span className="text-xs">{t('monthlyAccounting')}</span>
          </Button>
          <Button 
            variant="ghost" 
            onClick={signOut} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 px-2 gap-1"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs">{t('logout')}</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative">
        <div className="pb-8 px-4 max-w-lg mx-auto">
        {/* Pull to refresh indicator */}
        <motion.div 
          className="absolute left-1/2 -translate-x-1/2 -top-12 flex flex-col items-center gap-1"
          style={{ opacity: pullOpacity }}
        >
          <motion.div style={{ rotate: pullRotation }}>
            <RefreshCw className={cn("h-6 w-6 text-primary", refreshing && "animate-spin")} />
          </motion.div>
          <span className="text-xs text-muted-foreground">
            {refreshing ? t('loading') : t('refresh')}
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
            <p className="text-lg text-muted-foreground">{t('noJobsAssigned')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('completedTransfersWillAppear')}</p>
          </motion.div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* Reservation Code Search */}
            <Card className="mb-2">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-2">Kod ile Ara</p>
                <ReservationSearch userType="driver" driverId={driverId || undefined} placeholder="MT123456" />
              </CardContent>
            </Card>

            {/* Monthly Accounting Button */}
            <Button
              variant="outline"
              className="w-full mb-4 h-12 gap-2"
              onClick={() => navigate('/driver/monthly-accounting')}
            >
              <Calculator className="h-5 w-5" />
              {t('monthlyAccounting')}
            </Button>
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
                    <span className="font-semibold">{t('pendingJobs')}</span>
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
                            adminNotes={adminNotesMap[reservation.id]}
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
                    <span className="font-semibold">{t('activeJobs')}</span>
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
                            adminNotes={adminNotesMap[reservation.id]}
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
                    <span className="font-semibold">{t('completedJobs')}</span>
                    <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30">
                      {t('transfers')}
                    </Badge>
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
                            adminNotes={adminNotesMap[reservation.id]}
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
        </div>
      </main>
    </div>
  );
};

export default DriverHome;
