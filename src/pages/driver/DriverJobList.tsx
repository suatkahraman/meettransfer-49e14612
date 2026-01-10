import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, AlertCircle, Car, CheckCircle2, RefreshCw, ArrowDown } from 'lucide-react';
import SwipeableJobCard from '@/components/driver/SwipeableJobCard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { checkCompletionEligibility } from '@/hooks/useCompletionValidation';

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
  driver_cash_amount: number | null;
  reservation_code: string | null;
  status: string;
  driver_confirmed: boolean | null;
  agency_id: string | null;
  luggage_count: number | null;
  baby_seat_count: number | null;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  agencies?: {
    id: string;
    agency_name: string;
  } | null;
}

type JobType = 'pending' | 'active' | 'completed';

const DriverJobList = () => {
  const { type } = useParams<{ type: JobType }>();
  const navigate = useNavigate();
  const { driverId } = useUserRole();
  const { t } = useDriverTranslations();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [adminNotesMap, setAdminNotesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const PULL_THRESHOLD = 80;

  const jobType = type as JobType || 'pending';

  const getStatusFilter = useCallback(() => {
    switch (jobType) {
      case 'pending':
        // Include all pending-like statuses - driver should see jobs waiting for action
        return ['pending', 'pending_admin_review', 'sent_to_driver', 'assigned', 'confirmed'];
      case 'active':
        // Include cancelled statuses so driver can still see cancelled jobs
        // Only actually deleted reservations will disappear
        return ['active', 'cancelled', 'cancelled_by_customer', 'cancelled_by_agency', 'no_show'];
      case 'completed':
        return ['completed'];
      default:
        return ['pending', 'pending_admin_review', 'sent_to_driver', 'assigned', 'confirmed'];
    }
  }, [jobType]);

  const fetchReservations = useCallback(async (showToast = false) => {
    if (!driverId) return;

    const statusFilter = getStatusFilter();
    let query = supabase
      .from('reservations')
      .select('*, agencies (id, agency_name)')
      .eq('driver_id', driverId)
      .in('status', statusFilter)
      .order('pickup_date', { ascending: true })
      .order('pickup_time', { ascending: true });

    // For completed, only show current month
    if (jobType === 'completed') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      query = query.gte('pickup_date', firstDay).lte('pickup_date', lastDay);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error:', error);
      if (showToast) toast.error(t('failedToRefresh'));
    } else {
      const sortedData = (data || []).sort((a, b) => {
        const dateTimeA = new Date(`${a.pickup_date}T${a.pickup_time}`);
        const dateTimeB = new Date(`${b.pickup_date}T${b.pickup_time}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });
      setReservations(sortedData);

      // Fetch admin notes
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
  }, [driverId, jobType, getStatusFilter, t]);

  useEffect(() => {
    if (driverId) {
      fetchReservations();
    }
  }, [driverId, fetchReservations]);

  // Real-time subscription
  useEffect(() => {
    if (!driverId) return;

    const statusFilter = getStatusFilter();
    const channel = supabase
      .channel(`driver-jobs-${jobType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedRes = payload.new as Reservation;
            if (statusFilter.includes(updatedRes.status)) {
              setReservations(prev => {
                const existing = prev.find(r => r.id === updatedRes.id);
                if (existing) {
                  return prev.map(r => r.id === updatedRes.id ? updatedRes : r);
                }
                return [...prev, updatedRes].sort((a, b) => {
                  const dateTimeA = new Date(`${a.pickup_date}T${a.pickup_time}`);
                  const dateTimeB = new Date(`${b.pickup_date}T${b.pickup_time}`);
                  return dateTimeA.getTime() - dateTimeB.getTime();
                });
              });
            } else {
              setReservations(prev => prev.filter(r => r.id !== updatedRes.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setReservations(prev => prev.filter(r => r.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, jobType, getStatusFilter]);

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
    
    // Remove from pending list since it's now active
    setReservations(prev => prev.filter(r => r.id !== id));

    // Notifications...
    if (reservation) {
      try {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('name, plate_number, vehicle_model')
          .eq('id', driverId)
          .maybeSingle();

        const driverName = driverData?.name || 'Your driver';
        const plateNumber = driverData?.plate_number || '';
        const vehicleModel = driverData?.vehicle_model || '';
        const vehicleInfo = vehicleModel ? `\n🚗 ${vehicleModel}${plateNumber ? ` (${plateNumber})` : ''}` : '';

        await supabase.from('notifications').insert({
          user_id: reservation.customer_id,
          reservation_id: id,
          type: 'driver_accepted',
          title: '✅ Driver Confirmed',
          message: `Your driver: ${driverName}${vehicleInfo}`
        });

        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'driver_accepted',
            title: '✅ Driver Accepted Job',
            message: `${driverName} has accepted job #${id.slice(0, 8)}.`,
            notify_admins: true,
            reservation_id: id,
          }
        });
      } catch (e) {
        console.error('Notification error:', e);
      }
    }
  };

  const handleCompleteJob = async (id: string) => {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) {
      toast.error(t('reservationNotFound'));
      return;
    }

    const validation = checkCompletionEligibility(reservation);
    if (!validation.canComplete) {
      toast.error(validation.reason || t('cannotCompleteNow'));
      return;
    }
    
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error(t('failedToComplete'));
    } else {
      toast.success(t('jobCompleted'));
      // Remove from active list since it's now completed
      setReservations(prev => prev.filter(r => r.id !== id));

      // Send review request email to customer
      try {
        // Get driver info
        const { data: driverData } = await supabase
          .from('drivers')
          .select('name')
          .eq('id', driverId)
          .maybeSingle();

        // Get customer email from profiles or user_roles
        let customerEmail = '';
        if (reservation.customer_id) {
          const { data: userData } = await supabase.auth.admin.getUserById(reservation.customer_id);
          if (userData?.user?.email) {
            customerEmail = userData.user.email;
          }
        }

        // If we couldn't get email from auth, try getting it from a different source
        // For now, we'll use the notification email function which handles this
        if (customerEmail || reservation.customer_id) {
          await supabase.functions.invoke('send-review-request', {
            body: {
              reservationId: id,
              customerEmail: customerEmail,
              customerName: reservation.customer_name,
              driverName: driverData?.name || 'Your driver',
              reservationCode: reservation.reservation_code || id.slice(0, 8).toUpperCase(),
              pickupDate: reservation.pickup_date,
              pickup: reservation.pickup,
              dropoff: reservation.dropoff,
              pickupPlaceName: reservation.pickup_place_name,
              dropoffPlaceName: reservation.dropoff_place_name,
            }
          });
          console.log('Review request email sent for reservation:', id);
        }

        // Send completion notification to admins
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'trip_completed',
            title: '✅ Trip Completed',
            message: `${reservation.reservation_code || id.slice(0, 8)} transfer completed by ${driverData?.name || 'driver'}.`,
            notify_admins: true,
            reservation_id: id,
          }
        });
      } catch (e) {
        console.error('Error sending review request:', e);
        // Don't show error to driver, as the job was completed successfully
      }
    }
  };

  const getPageConfig = () => {
    switch (jobType) {
      case 'pending':
        return {
          title: t('pendingJobs'),
          icon: AlertCircle,
          iconColor: 'text-orange-500',
          bgColor: 'from-amber-500/20 to-orange-500/20',
          emptyMessage: t('noPendingJobs') || 'Bekleyen iş yok'
        };
      case 'active':
        return {
          title: t('activeJobs'),
          icon: Car,
          iconColor: 'text-blue-500',
          bgColor: 'from-blue-500/20 to-indigo-500/20',
          emptyMessage: t('noActiveJobs') || 'Aktif iş yok'
        };
      case 'completed':
        return {
          title: t('completedJobs'),
          icon: CheckCircle2,
          iconColor: 'text-green-500',
          bgColor: 'from-emerald-500/20 to-green-500/20',
          emptyMessage: t('noCompletedJobs') || 'Bu ay tamamlanan iş yok'
        };
      default:
        return {
          title: t('jobs'),
          icon: Car,
          iconColor: 'text-primary',
          bgColor: 'from-primary/20 to-primary/10',
          emptyMessage: t('noJobs') || 'İş yok'
        };
    }
  };

  const config = getPageConfig();
  const PageIcon = config.icon;

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || refreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - touchStartY.current);
    
    // Apply resistance for smoother feel
    const resistedDistance = Math.min(distance * 0.5, 120);
    setPullDistance(resistedDistance);
  };

  const handleTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      fetchReservations(true);
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className={cn(
        "bg-gradient-to-r py-4 px-4 sticky top-0 z-10",
        config.bgColor
      )}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/driver')}
            className="h-10 w-10 rounded-full bg-background/50 hover:bg-background/70"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <PageIcon className={cn("h-6 w-6", config.iconColor)} />
            <h1 className="text-xl font-bold">{config.title}</h1>
            <Badge variant="secondary" className="ml-1">
              {reservations.length}
            </Badge>
          </div>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setRefreshing(true);
              fetchReservations(true);
            }}
            disabled={refreshing}
            className="h-10 w-10 rounded-full bg-background/50 hover:bg-background/70"
          >
            <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
          </Button>
        </div>
      </header>

      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || refreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: refreshing ? 60 : pullDistance 
            }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center bg-gradient-to-b from-muted/50 to-transparent overflow-hidden"
          >
            <motion.div
              animate={{ 
                rotate: refreshing ? 360 : (pullDistance / PULL_THRESHOLD) * 180,
                scale: pullDistance >= PULL_THRESHOLD ? 1.2 : 1
              }}
              transition={{ 
                rotate: refreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0 }
              }}
              className={cn(
                "flex items-center justify-center rounded-full p-2",
                pullDistance >= PULL_THRESHOLD ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {refreshing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowDown className={cn(
                  "h-5 w-5 transition-transform",
                  pullDistance >= PULL_THRESHOLD && "rotate-180"
                )} />
              )}
            </motion.div>
            {pullDistance >= PULL_THRESHOLD && !refreshing && (
              <span className="ml-2 text-sm text-primary font-medium">
                {t('releaseToRefresh') || 'Yenilemek için bırakın'}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="px-4 py-4 max-w-lg mx-auto">
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
            <PageIcon className={cn("h-16 w-16 mx-auto mb-4", config.iconColor, "opacity-50")} />
            <p className="text-muted-foreground">{config.emptyMessage}</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {reservations.map((reservation, index) => (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SwipeableJobCard
                    reservation={reservation}
                    adminNotes={adminNotesMap[reservation.id]}
                    onAccept={jobType === 'pending' ? () => handleAcceptJob(reservation.id) : undefined}
                    onComplete={jobType === 'active' ? () => handleCompleteJob(reservation.id) : undefined}
                    onClick={() => navigate(`/driver/job/${reservation.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default DriverJobList;
