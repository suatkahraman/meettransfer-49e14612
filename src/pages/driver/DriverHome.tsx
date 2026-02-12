import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Car, AlertCircle, CheckCircle2, Loader2, Bell, Calculator, History } from 'lucide-react';
import { toast } from 'sonner';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import DriverStatsCard from '@/components/driver/DriverStatsCard';
import JobCategoryCard from '@/components/driver/JobCategoryCard';
import FutureMonthCard from '@/components/driver/FutureMonthCard';
import DayJobCard from '@/components/driver/DayJobCard';
import type { DriverHeaderExtras } from '@/components/driver/DriverLayout';

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
const LIST_RESERVATION_SELECT = `
  id,
  customer_id,
  customer_name,
  customer_phone,
  pickup,
  dropoff,
  pickup_date,
  pickup_time,
  flight_number,
  vehicle_type,
  payment_type,
  payment_status,
  price,
  price_currency,
  passenger_cash_amount,
  passenger_cash_currency,
  driver_cash_amount,
  reservation_code,
  status,
  driver_confirmed,
  agency_id,
  luggage_count,
  baby_seat_count,
  pickup_place_name,
  dropoff_place_name,
  agencies (id, agency_name)
`;

const sortByPickupDateTime = (items: Reservation[]) =>
  [...items].sort((a, b) => {
    const dateTimeA = new Date(`${a.pickup_date}T${a.pickup_time}`);
    const dateTimeB = new Date(`${b.pickup_date}T${b.pickup_time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

interface DriverHomeContext {
  setHeaderExtras: (extras: DriverHeaderExtras) => void;
}

const DriverHome = () => {
  const { driverId } = useUserRole();
  const navigate = useNavigate();
  const { t } = useDriverTranslations();
  const context = useOutletContext<DriverHomeContext>();
  const setHeaderExtras = context?.setHeaderExtras ?? (() => {});
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [adminNotesMap, setAdminNotesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { playSound } = useNotificationSound();
  
  const pullY = useMotionValue(0);
  const pullProgress = useTransform(pullY, [0, PULL_THRESHOLD], [0, 1]);
  const pullRotation = useTransform(pullY, [0, PULL_THRESHOLD], [0, 180]);
  const pullOpacity = useTransform(pullY, [0, 40, PULL_THRESHOLD], [0, 0.5, 1]);

  const fetchReservations = useCallback(async (showToast = false) => {
    if (!driverId) {
      setReservations([]);
      setAdminNotesMap({});
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [actionableQuery, completedQuery] = await Promise.all([
      supabase
        .from('reservations')
        .select(LIST_RESERVATION_SELECT)
        .eq('driver_id', driverId)
        .in('status', ['pending', 'pending_admin_review', 'sent_to_driver', 'assigned', 'confirmed', 'active'])
        .order('pickup_date', { ascending: true })
        .order('pickup_time', { ascending: true }),
      supabase
        .from('reservations')
        .select(LIST_RESERVATION_SELECT)
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .gte('pickup_date', firstDayOfCurrentMonth)
        .lte('pickup_date', lastDayOfCurrentMonth)
        .order('pickup_date', { ascending: true })
        .order('pickup_time', { ascending: true }),
    ]);

    if (actionableQuery.error || completedQuery.error) {
      console.error('Error:', actionableQuery.error || completedQuery.error);
      if (showToast) toast.error(t('failedToRefresh'));
    } else {
      const mergedRows = [...(actionableQuery.data || []), ...(completedQuery.data || [])];
      const sortedData = sortByPickupDateTime(mergedRows as Reservation[]);
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
      } else {
        setAdminNotesMap({});
      }
      
      if (showToast) toast.success(t('jobsRefreshed'));
    }
    setLoading(false);
    setRefreshing(false);
  }, [driverId, t]);

  const handlePullEnd = async (_: any, info: PanInfo) => {
    if (info.offset.y > PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      await fetchReservations(true);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [driverId, fetchReservations]);

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
            if (['pending', 'pending_admin_review', 'sent_to_driver', 'assigned', 'confirmed', 'active', 'completed'].includes(newReservation.status)) {
              setReservations(prev => {
                const updated = [...prev, newReservation];
                return sortByPickupDateTime(updated);
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
            if (['pending', 'pending_admin_review', 'sent_to_driver', 'assigned', 'confirmed', 'active', 'completed'].includes(updatedReservation.status)) {
              setReservations(prev => {
                const updated = prev.map(r => r.id === updatedReservation.id ? updatedReservation : r);
                return sortByPickupDateTime(updated);
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

  // Get current date/time for separating upcoming vs past
  const now = new Date();
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
  const completedJobsCount = completedJobs.length;

  // Pass header extras to DriverLayout
  useEffect(() => {
    setHeaderExtras({
      onRefresh: () => {
        setRefreshing(true);
        fetchReservations(true);
      },
      refreshing,
      pendingCount: pendingJobs.length,
      activeCount: activeJobsCount,
    });
  }, [setHeaderExtras, refreshing, pendingJobs.length, activeJobsCount, fetchReservations]);

  return (
    <div className="h-full min-h-0 flex flex-col overflow-y-auto">
      <div className="pb-8 px-4 max-w-lg mx-auto flex-1 relative">
        {/* Pull to refresh indicator */}
        <motion.div 
          className="absolute left-1/2 -translate-x-1/2 top-2 flex flex-col items-center gap-1 pointer-events-none z-10"
          style={{ opacity: pullOpacity }}
        >
          <motion.div style={{ rotate: pullRotation }}>
            <Loader2 className={cn("h-6 w-6 text-primary", refreshing && "animate-spin")} />
          </motion.div>
          <span className="text-xs text-muted-foreground">
            {refreshing ? t('loading') : t('refresh')}
          </span>
        </motion.div>

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground shadow-lg"
        >
          <div className="px-5 py-6">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {t('active')}: {activeJobsCount}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/30 rounded-full px-3 py-1.5 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {t('completed')}: {completedJobsCount}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-500/30 rounded-full px-3 py-1.5 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                {t('pending')}: {pendingJobs.length}
              </span>
            </div>
          </div>
        </motion.section>

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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full flex-1 h-10 gap-2 text-sm"
                onClick={() => navigate('/driver/monthly-accounting')}
              >
                <Calculator className="h-4 w-4" />
                {t('monthlyAccounting')}
              </Button>
              <Button
                variant="outline"
                className="w-full flex-1 h-10 gap-2 text-sm"
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
    </div>
  );
};

export default DriverHome;
