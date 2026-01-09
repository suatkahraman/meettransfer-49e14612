import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Car, AlertCircle, CheckCircle2, Loader2, Bell, Calculator, RefreshCw, History, Settings, Volume2, Search } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { PushNotificationToggle } from '@/components/PushNotificationToggle';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import { toast } from 'sonner';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import ReservationSearch from '@/components/ReservationSearch';
import DriverInfoEditor from '@/components/driver/DriverInfoEditor';
import DriverStatsCard from '@/components/driver/DriverStatsCard';
import JobCategoryCard from '@/components/driver/JobCategoryCard';
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
    settings: false,
    notificationSettings: false,
    search: false
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
      .in('status', ['sent_to_driver', 'assigned', 'confirmed', 'active', 'completed', 'cancelled', 'cancelled_by_customer', 'cancelled_by_agency'])
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

  const toggleSection = (section: 'settings' | 'notificationSettings' | 'search') => {
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
      {/* Compact mobile-optimized header */}
      <header className="bg-primary text-primary-foreground py-2 px-3 flex justify-between items-center flex-shrink-0 z-20 shadow-lg">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-serif font-bold">{t('driverPanel')}</h1>
          {activeJobs.length > 0 && (
            <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-600 h-5 px-1.5 text-xs">
              {activeJobs.length}
            </Badge>
          )}
          {pendingJobs.length > 0 && (
            <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600 h-5 px-1.5 text-xs">
              {pendingJobs.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button 
            variant="ghost" 
            onClick={() => {
              setRefreshing(true);
              fetchReservations(true);
            }}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => toggleSection('search')} 
            className={cn(
              "text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 p-0",
              expandedSections.search && "bg-primary-foreground/20"
            )}
          >
            <Search className="h-4 w-4" />
          </Button>
          <PushNotificationToggle compact />
          <NotificationBell />
          <Button 
            variant="ghost" 
            onClick={() => navigate('/driver/history')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-8 px-2 gap-1"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => toggleSection('notificationSettings')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 p-0"
            title="Bildirim Ayarları"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => toggleSection('settings')} 
            className={cn(
              "text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 p-0",
              expandedSections.settings && "bg-primary-foreground/20"
            )}
            title={t('updateInfo')}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={signOut} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 p-0"
          >
            <LogOut className="h-4 w-4" />
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
        {/* Notification Settings Section */}
        <AnimatePresence>
          {expandedSections.notificationSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <NotificationSettingsPanel language="TR" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Section - Driver Info Editor */}
        <AnimatePresence>
          {expandedSections.settings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4 mt-4"
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('settings')}
                  className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
                >
                  ✕
                </Button>
                <DriverInfoEditor onClose={() => toggleSection('settings')} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Section */}
        <AnimatePresence>
          {expandedSections.search && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4 mt-4"
            >
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{t('searchByCode') || 'Kod ile Ara'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection('search')}
                      className="h-6 w-6 p-0 text-muted-foreground"
                    >
                      ✕
                    </Button>
                  </div>
                  <ReservationSearch userType="driver" driverId={driverId || undefined} placeholder="MT123456" />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reservations.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 space-y-6"
          >
            {/* Stats Card even when no jobs */}
            {driverId && (
              <div className="mb-6">
                <DriverStatsCard driverId={driverId} />
              </div>
            )}
            <Car className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg text-muted-foreground">{t('noJobsAssigned')}</p>
              <p className="text-sm text-muted-foreground mt-2">{t('completedTransfersWillAppear')}</p>
            </div>
            {/* Quick Actions */}
            <div className="flex flex-col gap-2 px-4">
              <Button
                variant="outline"
                className="w-full h-11 gap-2"
                onClick={() => navigate('/driver/monthly-accounting')}
              >
                <Calculator className="h-4 w-4" />
                {t('monthlyAccounting')}
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 gap-2"
                onClick={() => navigate('/driver/history')}
              >
                <History className="h-4 w-4" />
                {t('history')}
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* Driver Stats Card */}
            {driverId && (
              <DriverStatsCard driverId={driverId} />
            )}

            {/* Quick Actions Row */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 gap-2 text-sm"
                onClick={() => navigate('/driver/monthly-accounting')}
              >
                <Calculator className="h-4 w-4" />
                {t('monthlyAccounting')}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 gap-2 text-sm"
                onClick={() => navigate('/driver/history')}
              >
                <History className="h-4 w-4" />
                {t('history')}
              </Button>
            </div>

            {/* Job Category Cards */}
            <div className="space-y-3">
              {/* Pending Jobs Card */}
              <JobCategoryCard
                icon={AlertCircle}
                title={t('pendingJobs')}
                count={pendingJobs.length}
                colorClass="orange"
                subtitle={pendingJobs.length > 0 ? t('tapToView') || 'Görüntülemek için dokun' : t('noPendingJobs') || 'Bekleyen iş yok'}
                nextJob={pendingJobs.length > 0 ? {
                  time: pendingJobs[0].pickup_time.slice(0, 5),
                  route: `${pendingJobs[0].pickup_place_name || pendingJobs[0].pickup.slice(0, 20)} → ${pendingJobs[0].dropoff_place_name || pendingJobs[0].dropoff.slice(0, 20)}`
                } : undefined}
                onClick={() => navigate('/driver/jobs/pending')}
              />

              {/* Active Jobs Card */}
              <JobCategoryCard
                icon={Car}
                title={t('activeJobs')}
                count={activeJobs.length}
                colorClass="blue"
                subtitle={activeJobs.length > 0 ? t('tapToView') || 'Görüntülemek için dokun' : t('noActiveJobs') || 'Aktif iş yok'}
                nextJob={activeJobs.length > 0 ? {
                  time: activeJobs[0].pickup_time.slice(0, 5),
                  route: `${activeJobs[0].pickup_place_name || activeJobs[0].pickup.slice(0, 20)} → ${activeJobs[0].dropoff_place_name || activeJobs[0].dropoff.slice(0, 20)}`
                } : undefined}
                onClick={() => navigate('/driver/jobs/active')}
              />

              {/* Completed Jobs Card */}
              <JobCategoryCard
                icon={CheckCircle2}
                title={t('completedJobs')}
                count={completedJobs.length}
                colorClass="green"
                subtitle={completedJobs.length > 0 ? `${t('thisMonth') || 'Bu ay'} - ${t('tapToView') || 'Görüntülemek için dokun'}` : t('noCompletedJobs') || 'Bu ay tamamlanan iş yok'}
                onClick={() => navigate('/driver/jobs/completed')}
              />
            </div>

          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default DriverHome;
