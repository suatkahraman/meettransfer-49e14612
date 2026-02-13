import { useEffect, useState, useCallback, useRef, startTransition } from 'react';
import { useNavigate, useParams, useSearchParams, useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Car, CheckCircle2, RefreshCw, ArrowDown } from 'lucide-react';
import SwipeableJobCard from '@/components/driver/SwipeableJobCard';
import { JobListSkeleton } from '@/components/driver/JobListSkeleton';
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
  payment_status: string | null;
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
  // agencies omitted in list query - card shows 'Acenta' when agency_id exists
}

type JobType = 'pending' | 'active' | 'completed';

// Lean select: only columns needed for list display (no agencies join, no json fields)
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
  dropoff_place_name
`;
const PENDING_BASE_STATUSES = ['pending', 'pending_admin_review', 'sent_to_driver', 'assigned'] as const;
const PENDING_PAGE_SIZE = 12;
const ACTIVE_COMPLETED_PAGE_SIZE = 10;
const TAB_CACHE_STALE_MS = 2 * 60 * 1000; // 2 min - avoid refetch when switching tabs

const sortByPickupDateTime = (items: Reservation[]) =>
  [...items].sort((a, b) => {
    const dateTimeA = new Date(`${a.pickup_date}T${a.pickup_time}`);
    const dateTimeB = new Date(`${b.pickup_date}T${b.pickup_time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

const CACHE_QUERY_KEY = 'driver-jobs-tab-cache' as const;

const DriverJobList = () => {
  const { type } = useParams<{ type: JobType }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { driverId } = useUserRole();
  const context = useOutletContext<{ setHeaderRight: (n: React.ReactNode) => void }>();
  const setHeaderRight = context?.setHeaderRight ?? (() => {});
  const { t } = useDriverTranslations();
  const tRef = useRef(t);
  tRef.current = t;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [adminNotesMap, setAdminNotesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMorePending, setHasMorePending] = useState(false);
  const [loadingMorePending, setLoadingMorePending] = useState(false);
  const [hasMoreActiveCompleted, setHasMoreActiveCompleted] = useState(false);
  const [loadingMoreActiveCompleted, setLoadingMoreActiveCompleted] = useState(false);
  const activeCompletedPageRef = useRef(0);
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const driverMetaRef = useRef<{ name: string; plateNumber: string; vehicleModel: string } | null>(null);
  const pendingPageRef = useRef(0);
  const PULL_THRESHOLD = 80;

  const jobType = type as JobType || 'pending';
  
  // Get month/year filter from URL params (for future months filtering)
  const filterDate = searchParams.get('date');
  const filterMonth = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
  const filterYear = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;

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

  const getCacheKey = useCallback(() => 
    [CACHE_QUERY_KEY, driverId, jobType, filterDate, filterMonth, filterYear].join(':'),
    [driverId, jobType, filterDate, filterMonth, filterYear]
  );

  const fetchReservations = useCallback(async (options?: { showToast?: boolean; append?: boolean; force?: boolean }) => {
    const showToast = options?.showToast ?? false;
    const append = options?.append ?? false;
    const force = options?.force ?? false;

    if (!driverId) {
      setReservations([]);
      setAdminNotesMap({});
      pendingPageRef.current = 0;
      activeCompletedPageRef.current = 0;
      setHasMorePending(false);
      setHasMoreActiveCompleted(false);
      setLoading(false);
      setRefreshing(false);
      setLoadingMorePending(false);
      setLoadingMoreActiveCompleted(false);
      return;
    }

    try {
      // Tab cache: skip fetch when switching back to a tab with fresh data
      if (!force && !append && (jobType === 'active' || jobType === 'completed')) {
        const cached = queryClient.getQueryData<{ data: Reservation[]; notes: Record<string, string>; ts: number }>([CACHE_QUERY_KEY, getCacheKey()]);
        if (cached && Date.now() - cached.ts < TAB_CACHE_STALE_MS) {
          setReservations(sortByPickupDateTime(cached.data));
          setAdminNotesMap(cached.notes);
          setLoading(false);
          setRefreshing(false);
          if (cached.data.length > 0) {
            void supabase.from('reservation_admin_notes').select('reservation_id, notes').in('reservation_id', cached.data.map(r => r.id)).then(({ data: notesData }) => {
              if (!notesData) return;
              const notesObj: Record<string, string> = {};
              notesData.forEach((n) => { if (n.notes) notesObj[n.reservation_id] = n.notes; });
              setAdminNotesMap(notesObj);
            });
          }
          return;
        }
      }

      const statusFilter = getStatusFilter();
      let data: Reservation[] = [];
      let error: Error | null = null;

      if (jobType === 'pending') {
        const nextPage = append ? pendingPageRef.current + 1 : 0;
        const from = nextPage * PENDING_PAGE_SIZE;
        const to = from + PENDING_PAGE_SIZE;

        let query = supabase
          .from('reservations')
          .select(LIST_RESERVATION_SELECT)
          .eq('driver_id', driverId)
          .or('status.in.(pending,pending_admin_review,sent_to_driver,assigned),and(status.eq.confirmed,driver_confirmed.eq.false)')
          .order('pickup_date', { ascending: true })
          .order('pickup_time', { ascending: true });

        if (filterDate) {
          query = query.eq('pickup_date', filterDate);
        } else if (filterMonth !== null && filterYear !== null) {
          const firstDay = new Date(filterYear, filterMonth - 1, 1).toISOString().split('T')[0];
          const lastDay = new Date(filterYear, filterMonth, 0).toISOString().split('T')[0];
          query = query.gte('pickup_date', firstDay).lte('pickup_date', lastDay);
        }

        const response = await query.range(from, to);
        const rows = (response.data || []) as Reservation[];
        error = response.error as Error | null;

        if (!error) {
          const pageRows = sortByPickupDateTime(rows.slice(0, PENDING_PAGE_SIZE));
          const hasMoreRows = rows.length > PENDING_PAGE_SIZE;

          setHasMorePending(hasMoreRows);
          pendingPageRef.current = nextPage;

          if (append) {
            setReservations((prev) => {
              const byId = new Map(prev.map((item) => [item.id, item]));
              pageRows.forEach((row) => byId.set(row.id, row));
              return sortByPickupDateTime(Array.from(byId.values()));
            });
          } else {
            setReservations(pageRows);
            setAdminNotesMap({});
          }

          if (pageRows.length > 0) {
            const ids = pageRows.map((r) => r.id);
            void supabase
              .from('reservation_admin_notes')
              .select('reservation_id, notes')
              .in('reservation_id', ids)
              .then(({ data: notesData }) => {
                if (!notesData) return;
                const notesObj: Record<string, string> = {};
                notesData.forEach((n) => {
                  if (n.notes) notesObj[n.reservation_id] = n.notes;
                });

                if (append) {
                  setAdminNotesMap((prev) => ({ ...prev, ...notesObj }));
                } else {
                  setAdminNotesMap(notesObj);
                }
              });
          } else if (!append) {
            setAdminNotesMap({});
          }
        }
      } else {
        // Active/Completed: pagination (limit 10 per page)
        if (!append) activeCompletedPageRef.current = 0;
        const nextPage = append ? activeCompletedPageRef.current + 1 : 0;
        const from = nextPage * ACTIVE_COMPLETED_PAGE_SIZE;
        const to = from + ACTIVE_COMPLETED_PAGE_SIZE; // request 11 to detect hasMore

        const asc = jobType === 'active';
        let query = supabase
          .from('reservations')
          .select(LIST_RESERVATION_SELECT)
          .eq('driver_id', driverId)
          .in('status', statusFilter)
          .order('pickup_date', { ascending: asc })
          .order('pickup_time', { ascending: asc });

        // For completed, only show current month
        if (jobType === 'completed') {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
          query = query.gte('pickup_date', firstDay).lte('pickup_date', lastDay);
        }

        if (filterDate) {
          query = query.eq('pickup_date', filterDate);
        }

        // Apply month/year filter if present (for future months)
        if (!filterDate && filterMonth !== null && filterYear !== null) {
          const firstDay = new Date(filterYear, filterMonth - 1, 1).toISOString().split('T')[0];
          const lastDay = new Date(filterYear, filterMonth, 0).toISOString().split('T')[0];
          query = query.gte('pickup_date', firstDay).lte('pickup_date', lastDay);
        }

        const response = await query.range(from, to);
        const rows = (response.data || []) as Reservation[];
        error = response.error as Error | null;

        if (!error) {
          const hasMore = rows.length > ACTIVE_COMPLETED_PAGE_SIZE;
          const pageRows = rows.slice(0, ACTIVE_COMPLETED_PAGE_SIZE);
          data = pageRows;
          activeCompletedPageRef.current = nextPage;
          setHasMoreActiveCompleted(hasMore);
        }
      }

      if (error) {
        console.error('Error:', error);
        if (showToast) toast.error(tRef.current('failedToRefresh'));
        return;
      }

      if (jobType !== 'pending') {
        const sortedData = sortByPickupDateTime(data);
        if (!append) {
          setReservations(sortedData);
          setAdminNotesMap({});
        } else {
          setReservations(prev => {
            const byId = new Map(prev.map((item) => [item.id, item]));
            sortedData.forEach((row) => byId.set(row.id, row));
            return sortByPickupDateTime(Array.from(byId.values()));
          });
        }
        pendingPageRef.current = 0;
        setHasMorePending(false);

        // Cache for tab switching (Aktif/Tamamlanan) - admin notes in background
        if (sortedData.length > 0) {
          const ids = sortedData.map((r) => r.id);
          void supabase
            .from('reservation_admin_notes')
            .select('reservation_id, notes')
            .in('reservation_id', ids)
            .then(({ data: notesData }) => {
              if (!notesData) return;
              const notesObj: Record<string, string> = {};
              notesData.forEach((n) => {
                if (n.notes) notesObj[n.reservation_id] = n.notes;
              });
              if (append) {
                setAdminNotesMap((prev) => ({ ...prev, ...notesObj }));
              } else {
                setAdminNotesMap(notesObj);
              }
            });
        } else if (!append) {
          setAdminNotesMap({});
        }
        if (!append) {
          queryClient.setQueryData([CACHE_QUERY_KEY, getCacheKey()], {
            data: sortedData,
            notes: {},
            ts: Date.now(),
          });
        }
      }
      
      if (showToast) toast.success(tRef.current('jobsRefreshed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMorePending(false);
      setLoadingMoreActiveCompleted(false);
    }
  }, [driverId, jobType, getStatusFilter, getCacheKey, filterMonth, filterYear, filterDate, queryClient]);

  useEffect(() => {
    if (driverId) {
      setLoading(true);
      void fetchReservations();
    }
  }, [driverId, fetchReservations]);

  useEffect(() => {
    setHeaderRight(
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setRefreshing(true);
          void fetchReservations({ showToast: true, force: true });
        }}
        disabled={refreshing || loadingMorePending || loadingMoreActiveCompleted}
        className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
      >
        <RefreshCw className={cn("h-4.5 w-4.5 sm:h-5 sm:w-5", (refreshing || loadingMorePending || loadingMoreActiveCompleted) && "animate-spin")} />
      </Button>
    );
    return () => setHeaderRight(null);
  }, [setHeaderRight, refreshing, fetchReservations, loadingMorePending, loadingMoreActiveCompleted]);

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
            const pickupDate = updatedRes.pickup_date;
            const matchesDateFilter = filterDate
              ? pickupDate === filterDate
              : (
                  filterMonth !== null && filterYear !== null
                    ? (() => {
                        const d = new Date(pickupDate);
                        return d.getFullYear() === filterYear && d.getMonth() === filterMonth - 1;
                      })()
                    : true
                );
            const includeInList = jobType === 'pending'
              ? (
                  matchesDateFilter &&
                  (
                    PENDING_BASE_STATUSES.includes(updatedRes.status as (typeof PENDING_BASE_STATUSES)[number]) ||
                    (updatedRes.status === 'confirmed' && updatedRes.driver_confirmed === false)
                  )
                )
              : (matchesDateFilter && statusFilter.includes(updatedRes.status));

            if (includeInList) {
              setReservations(prev => {
                const existing = prev.find(r => r.id === updatedRes.id);
                if (existing) {
                  const next = prev.map(r => r.id === updatedRes.id ? updatedRes : r);
                  return sortByPickupDateTime(next);
                }
                return sortByPickupDateTime([...prev, updatedRes]);
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
  }, [driverId, jobType, getStatusFilter, filterDate, filterMonth, filterYear]);

  const loadNextPendingPage = useCallback(() => {
    if (jobType !== 'pending') return;
    if (!hasMorePending || loadingMorePending || refreshing || loading) return;
    setLoadingMorePending(true);
    void fetchReservations({ append: true });
  }, [jobType, hasMorePending, loadingMorePending, refreshing, loading, fetchReservations]);

  const loadNextActiveCompletedPage = useCallback(() => {
    if (jobType === 'pending') return;
    if (!hasMoreActiveCompleted || loadingMoreActiveCompleted || refreshing || loading) return;
    setLoadingMoreActiveCompleted(true);
    void fetchReservations({ append: true });
  }, [jobType, hasMoreActiveCompleted, loadingMoreActiveCompleted, refreshing, loading, fetchReservations]);

  useEffect(() => {
    if (jobType !== 'pending' || !hasMorePending) return;
    const rootElement = containerRef.current;
    const sentinel = loadMoreSentinelRef.current;
    if (!rootElement || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadNextPendingPage();
        }
      },
      {
        root: rootElement,
        rootMargin: '220px 0px 220px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [jobType, hasMorePending, loadNextPendingPage, reservations.length]);

  useEffect(() => {
    if (jobType === 'pending' || !hasMoreActiveCompleted) return;
    const rootElement = containerRef.current;
    const sentinel = loadMoreSentinelRef.current;
    if (!rootElement || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadNextActiveCompletedPage();
      },
      { root: rootElement, rootMargin: '220px 0px 220px 0px', threshold: 0.01 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [jobType, hasMoreActiveCompleted, loadNextActiveCompletedPage, reservations.length]);

  const getDriverMeta = useCallback(async () => {
    if (driverMetaRef.current) return driverMetaRef.current;
    if (!driverId) return null;

    const { data: driverData } = await supabase
      .from('drivers')
      .select('name, plate_number, vehicle_model')
      .eq('id', driverId)
      .maybeSingle();

    const meta = {
      name: driverData?.name || 'Your driver',
      plateNumber: driverData?.plate_number || '',
      vehicleModel: driverData?.vehicle_model || '',
    };
    driverMetaRef.current = meta;
    return meta;
  }, [driverId]);

  const runAcceptNotifications = useCallback(async (reservation: Reservation, reservationId: string) => {
    try {
      const driverMeta = await getDriverMeta();
      if (!driverMeta) return;

      const vehicleInfo = driverMeta.vehicleModel
        ? `\n🚗 ${driverMeta.vehicleModel}${driverMeta.plateNumber ? ` (${driverMeta.plateNumber})` : ''}`
        : '';

      await supabase.from('notifications').insert({
        user_id: reservation.customer_id,
        reservation_id: reservationId,
        type: 'driver_accepted',
        title: '✅ Driver Confirmed',
        message: `Your driver: ${driverMeta.name}${vehicleInfo}`,
      });

      await supabase.functions.invoke('create-notification', {
        body: {
          type: 'driver_accepted',
          title: '✅ Driver Accepted Job',
          message: `${driverMeta.name} has accepted job #${reservationId.slice(0, 8)}.`,
          notify_admins: true,
          reservation_id: reservationId,
        }
      });
    } catch (e) {
      console.error('Notification error:', e);
    }
  }, [getDriverMeta]);

  const runCompletionSideEffects = useCallback(async (reservation: Reservation, reservationId: string) => {
    try {
      const driverMeta = await getDriverMeta();
      const driverName = driverMeta?.name || 'Your driver';

      let customerEmail = '';
      if (reservation.customer_id) {
        const { data: emailData } = await supabase.functions.invoke('get-customer-email', {
          body: { customer_id: reservation.customer_id },
        });
        customerEmail = emailData?.email || '';

        await supabase.from('notifications').insert({
          user_id: reservation.customer_id,
          reservation_id: reservationId,
          type: 'trip_completed',
          title: '🎉 Trip Completed',
          message: 'Your trip has been completed. Thank you for choosing Meet Transfer!',
        });
      }

      await supabase.functions.invoke('send-review-request', {
        body: {
          reservationId: reservationId,
          customerEmail,
          customerName: reservation.customer_name,
          driverName,
          reservationCode: reservation.reservation_code || reservationId.slice(0, 8).toUpperCase(),
          pickupDate: reservation.pickup_date,
          pickup: reservation.pickup,
          dropoff: reservation.dropoff,
          pickupPlaceName: reservation.pickup_place_name,
          dropoffPlaceName: reservation.dropoff_place_name,
        }
      });

      await supabase.functions.invoke('create-notification', {
        body: {
          type: 'trip_completed',
          title: '✅ Trip Completed',
          message: `${reservation.reservation_code || reservationId.slice(0, 8)} transfer completed by ${driverName}.`,
          notify_admins: true,
          reservation_id: reservationId,
        }
      });
    } catch (e) {
      console.error('Error sending completion side effects:', e);
    }
  }, [getDriverMeta]);

  const handleAcceptJob = async (id: string) => {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;

    setReservations((prev) => prev.filter((r) => r.id !== id));
    
    const { error } = await supabase
      .from('reservations')
      .update({ driver_confirmed: true, status: 'active' })
      .eq('id', id);

    if (error) {
      toast.error(t('failedToAccept'));
      setReservations((prev) => sortByPickupDateTime([...prev, reservation]));
      return;
    }

    toast.success(t('jobAccepted'));

    // Do not block UI on notification pipeline.
    void runAcceptNotifications(reservation, id);
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

    setReservations((prev) => prev.filter((r) => r.id !== id));

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error(t('failedToComplete'));
      setReservations((prev) => sortByPickupDateTime([...prev, reservation]));
      return;
    }

    toast.success(t('jobCompleted'));
    // Do not block UI on non-critical side effects.
    void runCompletionSideEffects(reservation, id);
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

  // Pull-to-refresh: only activate when touch starts in top zone to avoid blocking card taps
  const PULL_ZONE_TOP_PX = 80;
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current || containerRef.current.scrollTop > 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;
    if (touchY <= PULL_ZONE_TOP_PX) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || refreshing || loadingMorePending || loadingMoreActiveCompleted) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - touchStartY.current);
    
    // Apply resistance for smoother feel
    const resistedDistance = Math.min(distance * 0.5, 120);
    setPullDistance(resistedDistance);
  };

  const handleTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing && !loadingMorePending && !loadingMoreActiveCompleted) {
      setRefreshing(true);
      void fetchReservations({ showToast: true, force: true });
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  return (
    <div 
      ref={containerRef}
      className="h-full min-h-0 w-full max-w-[100vw] flex flex-col items-center overflow-x-hidden overflow-y-auto touch-manipulation"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
      <main className="px-3 sm:px-4 py-4 max-w-lg mx-auto w-full overflow-x-hidden">
        {loading ? (
          <JobListSkeleton count={5} />
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
                  transition={{ duration: 0.16, delay: Math.min(index, 2) * 0.02 }}
                  className="touch-manipulation"
                >
                  <SwipeableJobCard
                    reservation={reservation}
                    adminNotes={adminNotesMap[reservation.id]}
                    onAccept={jobType === 'pending' ? () => handleAcceptJob(reservation.id) : undefined}
                    onComplete={jobType === 'active' ? () => handleCompleteJob(reservation.id) : undefined}
                    onClick={() => requestAnimationFrame(() => startTransition(() => navigate(`/driver/job/${reservation.id}`)))}
                  />
                </motion.div>
              ))}

              {(jobType === 'pending' && hasMorePending) || (jobType !== 'pending' && hasMoreActiveCompleted) ? (
                <div ref={loadMoreSentinelRef} className="h-2 w-full" />
              ) : null}
              {(jobType === 'pending' && loadingMorePending) || (jobType !== 'pending' && loadingMoreActiveCompleted) ? (
                <div className="flex items-center justify-center py-2 text-muted-foreground text-sm gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('loading') || 'Yükleniyor...'}</span>
                </div>
              ) : null}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default DriverJobList;
