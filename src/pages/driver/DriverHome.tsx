import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Car, AlertCircle, CheckCircle2, Loader2, Bell, Calculator, RefreshCw, History, Settings, Volume2, Search, Shield, Globe } from 'lucide-react';
import UniversalLanguageSelector from '@/components/UniversalLanguageSelector';
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
import FutureMonthCard from '@/components/driver/FutureMonthCard';
import DayJobCard from '@/components/driver/DayJobCard';

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
      .in('status', ['pending', 'pending_admin_review', 'sent_to_driver', 'assigned', 'confirmed', 'active', 'completed', 'cancelled', 'cancelled_by_customer', 'cancelled_by_agency', 'no_show'])
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
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Separate reservations by status and time
  // Pending = awaiting driver confirmation (sent_to_driver, assigned) OR confirmed but driver_confirmed=false
  const pendingJobs = reservations.filter(r => 
    r.status === 'sent_to_driver' || 
    r.status === 'assigned' ||
    (r.status === 'confirmed' && r.driver_confirmed === false)
  );
  
  // Confirmed jobs (driver_confirmed = true) for current month - these go to day cards
  const confirmedCurrentMonthJobs = reservations.filter(r => {
    if (r.status !== 'active' && !(r.status === 'confirmed' && r.driver_confirmed === true)) return false;
    const pickupDate = new Date(r.pickup_date);
    const jobMonth = pickupDate.getMonth();
    const jobYear = pickupDate.getFullYear();
    
    // Only current month jobs
    return jobYear === currentYear && jobMonth === currentMonth;
  });
  
  // Completed jobs (past dates or status=completed) for current month
  const completedJobs = reservations.filter(r => {
    if (r.status !== 'completed') return false;
    const pickupDate = new Date(r.pickup_date);
    return pickupDate.getMonth() === currentMonth && pickupDate.getFullYear() === currentYear;
  });

  // Get month name helper
  const getMonthName = (month: number): string => {
    const monthKeys = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return t(monthKeys[month]) || monthKeys[month];
  };

  // Day name helper
  const getDayName = (date: Date): string => {
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayNamesMap: Record<string, Record<string, string>> = {
      TR: { sunday: 'Pazar', monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba', thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi' },
      EN: { sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' },
      DE: { sunday: 'Sonntag', monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch', thursday: 'Donnerstag', friday: 'Freitag', saturday: 'Samstag' },
      FR: { sunday: 'Dimanche', monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi' },
      RU: { sunday: 'Воскресенье', monday: 'Понедельник', tuesday: 'Вторник', wednesday: 'Среда', thursday: 'Четверг', friday: 'Пятница', saturday: 'Суббота' },
      AR: { sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت' }
    };
    const lang = navigator.language.split('-')[0].toUpperCase();
    const dayKey = dayKeys[date.getDay()];
    return dayNamesMap[lang]?.[dayKey] || dayNamesMap['TR'][dayKey];
  };

  // Group current month confirmed jobs by day
  const currentMonthDayCards = useMemo(() => {
    const grouped: Record<string, { date: Date; jobs: Reservation[] }> = {};
    
    confirmedCurrentMonthJobs.forEach(job => {
      const pickupDate = new Date(job.pickup_date);
      const key = job.pickup_date; // YYYY-MM-DD format
      
      if (!grouped[key]) {
        grouped[key] = {
          date: pickupDate,
          jobs: []
        };
      }
      grouped[key].jobs.push(job);
    });

    // Convert to array and sort by date
    return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [confirmedCurrentMonthJobs]);

  // Future months reservations (active/confirmed jobs for months after current month)
  const futureMonthsData = useMemo(() => {
    const futureJobs = reservations.filter(r => {
      if (r.status !== 'active' && !(r.status === 'confirmed' && r.driver_confirmed === true)) return false;
      const pickupDate = new Date(r.pickup_date);
      const jobMonth = pickupDate.getMonth();
      const jobYear = pickupDate.getFullYear();
      
      // Check if it's in a future month
      if (jobYear > currentYear) return true;
      if (jobYear === currentYear && jobMonth > currentMonth) return true;
      return false;
    });

    // Group by month-year
    const grouped: Record<string, { month: number; year: number; jobs: Reservation[] }> = {};
    
    futureJobs.forEach(job => {
      const pickupDate = new Date(job.pickup_date);
      const key = `${pickupDate.getFullYear()}-${pickupDate.getMonth()}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          month: pickupDate.getMonth(),
          year: pickupDate.getFullYear(),
          jobs: []
        };
      }
      grouped[key].jobs.push(job);
    });

    // Sort by date and convert to array
    return Object.values(grouped).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [reservations, currentMonth, currentYear]);

  // Count for header badges
  const activeJobsCount = confirmedCurrentMonthJobs.length;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Compact mobile-optimized header */}
      <header className="bg-primary text-primary-foreground py-2.5 px-3 sm:py-3 sm:px-4 flex justify-between items-center flex-shrink-0 z-20 shadow-lg safe-area-inset-top">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base sm:text-lg font-serif font-bold truncate">{t('driverPanel')}</h1>
          {activeJobsCount > 0 && (
            <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-600 h-5 sm:h-6 px-1.5 sm:px-2 text-xs flex-shrink-0">
              {activeJobsCount}
            </Badge>
          )}
          {pendingJobs.length > 0 && (
            <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600 h-5 sm:h-6 px-1.5 sm:px-2 text-xs flex-shrink-0">
              {pendingJobs.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              setRefreshing(true);
              fetchReservations(true);
            }}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
          >
            <RefreshCw className={cn("h-4.5 w-4.5 sm:h-5 sm:w-5", refreshing && "animate-spin")} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => toggleSection('search')} 
            className={cn(
              "text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10",
              expandedSections.search && "bg-primary-foreground/20"
            )}
          >
            <Search className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </Button>
          <PushNotificationToggle compact />
          <NotificationBell />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/driver/history')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
          >
            <History className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => toggleSection('notificationSettings')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
            title="Bildirim Ayarları"
          >
            <Volume2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => toggleSection('settings')} 
            className={cn(
              "text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10",
              expandedSections.settings && "bg-primary-foreground/20"
            )}
            title={t('updateInfo')}
          >
            <Settings className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </Button>
          {/* Language Selector */}
          <UniversalLanguageSelector variant="header" />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/security-settings')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
            title={t('securitySettings') || 'Güvenlik Ayarları'}
          >
            <Shield className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={signOut} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
          >
            <LogOut className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
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

            {/* Job Category Cards - New Order: Pending → Completed → Day Cards → Future Months */}
            <div className="space-y-3">
              {/* 1. Pending Jobs Card */}
              {pendingJobs.length > 0 && (
                <JobCategoryCard
                  icon={AlertCircle}
                  title={t('pendingJobs')}
                  count={pendingJobs.length}
                  colorClass="orange"
                  subtitle={t('tapToView') || 'Görüntülemek için dokun'}
                  nextJob={{
                    time: pendingJobs[0].pickup_time.slice(0, 5),
                    route: `${pendingJobs[0].pickup_place_name || pendingJobs[0].pickup.slice(0, 20)} → ${pendingJobs[0].dropoff_place_name || pendingJobs[0].dropoff.slice(0, 20)}`
                  }}
                  onClick={() => navigate('/driver/jobs/pending')}
                />
              )}

              {/* 2. Completed Jobs Card */}
              {completedJobs.length > 0 && (
                <JobCategoryCard
                  icon={CheckCircle2}
                  title={t('completedJobs')}
                  count={completedJobs.length}
                  colorClass="green"
                  subtitle={`${t('thisMonth') || 'Bu ay'} - ${t('tapToView') || 'Görüntülemek için dokun'}`}
                  onClick={() => navigate('/driver/jobs/completed')}
                />
              )}
            </div>

            {/* 3. Current Month Day Cards - Only days with confirmed jobs */}
            {currentMonthDayCards.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {getMonthName(currentMonth)} {currentYear} - {t('activeJobs') || 'Onaylanan İşler'}
                </h3>
                <div className="space-y-2">
                  {currentMonthDayCards.map((dayData) => {
                    const firstJob = dayData.jobs.sort((a, b) => a.pickup_time.localeCompare(b.pickup_time))[0];
                    const activeCount = dayData.jobs.filter(j => j.status === 'active').length;
                    
                    return (
                      <DayJobCard
                        key={dayData.date.toISOString()}
                        dayNumber={dayData.date.getDate()}
                        monthName={getMonthName(dayData.date.getMonth())}
                        dayName={getDayName(dayData.date)}
                        totalJobs={dayData.jobs.length}
                        activeJobs={activeCount}
                        firstJobTime={firstJob.pickup_time.slice(0, 5)}
                        firstJobRoute={`${firstJob.pickup_place_name || firstJob.pickup.slice(0, 15)} → ${firstJob.dropoff_place_name || firstJob.dropoff.slice(0, 15)}`}
                        onClick={() => navigate(`/driver/jobs/active?date=${dayData.jobs[0].pickup_date}`)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Future Months Section */}
            {futureMonthsData.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {t('futureReservations') || 'İleri Tarihli Rezervasyonlar'}
                </h3>
                <div className="space-y-2">
                  {futureMonthsData.map((monthData) => {
                    const firstJob = monthData.jobs[0];
                    const firstJobDate = firstJob ? new Date(firstJob.pickup_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : undefined;
                    const firstJobRoute = firstJob ? `${firstJob.pickup_place_name || firstJob.pickup.slice(0, 15)} → ${firstJob.dropoff_place_name || firstJob.dropoff.slice(0, 15)}` : undefined;
                    
                    return (
                      <FutureMonthCard
                        key={`${monthData.year}-${monthData.month}`}
                        monthName={getMonthName(monthData.month)}
                        year={monthData.year}
                        count={monthData.jobs.length}
                        firstJobDate={firstJobDate}
                        firstJobRoute={firstJobRoute}
                        onClick={() => navigate(`/driver/jobs/active?month=${monthData.month + 1}&year=${monthData.year}`)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state when no jobs at all */}
            {pendingJobs.length === 0 && completedJobs.length === 0 && currentMonthDayCards.length === 0 && futureMonthsData.length === 0 && (
              <div className="text-center py-8">
                <Car className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">{t('noJobsAssigned')}</p>
              </div>
            )}

          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default DriverHome;
