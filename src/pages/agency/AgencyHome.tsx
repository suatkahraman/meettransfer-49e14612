import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Calendar, User, Loader2, BarChart3, Clock, Car, ChevronDown, RefreshCw, Wallet, TrendingUp, CheckCircle, CreditCard, Plus, Bell, BellOff, Receipt, Volume2, History, AlertCircle, Shield } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import AgencyLanguageSelector from '@/components/agency/AgencyLanguageSelector';
import { useAgencyLanguage } from '@/contexts/AgencyLanguageContext';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, isToday, isTomorrow, parseISO, compareAsc } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LocationDisplay } from '@/components/ui/location-display';
import { getCurrencySymbol, calculateCurrencyBalances, CurrencyBalance } from '@/lib/currency';
import AgencyNotificationHistory from '@/components/agency/AgencyNotificationHistory';
import AgencyReservationFilters, { ReservationFilters } from '@/components/agency/AgencyReservationFilters';
import AgencyBottomNav from '@/components/agency/AgencyBottomNav';
import SwipeableReservationCard from '@/components/agency/SwipeableReservationCard';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/agency/PullToRefreshIndicator';
import AgencyHomeSkeleton, { ReservationCardSkeleton, SectionSkeleton } from '@/components/agency/AgencyHomeSkeleton';

interface Driver {
  id: string;
  name: string;
  plate_number: string | null;
  phone: string;
  vehicle_model: string | null;
  vehicle_color: string | null;
}

interface AgencyReservationDetail {
  payment_status: string | null;
  agency_price_currency: string | null;
  company_amount: number | null;
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
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  agency_reservation_details?: AgencyReservationDetail | null;
}

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-gray-500/20 text-gray-700',
  'pending_admin_review': 'bg-amber-500/20 text-amber-700',
  'waiting_for_agency_approval': 'bg-purple-500/20 text-purple-700',
  'waiting_for_customer_approval': 'bg-yellow-500/20 text-yellow-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'confirmed': 'bg-green-500/20 text-green-700',
  'sent_to_driver': 'bg-purple-500/20 text-purple-700',
  'assigned': 'bg-purple-500/20 text-purple-700',
  'active': 'bg-blue-500/20 text-blue-700',
  'completed': 'bg-green-500/20 text-green-700',
  'cancelled': 'bg-red-500/20 text-red-700',
  'cancelled_by_customer': 'bg-red-500/20 text-red-700',
  'cancelled_by_agency': 'bg-red-500/20 text-red-700',
  'customer_rejected': 'bg-red-500/20 text-red-700',
};

const statusLabels: Record<string, string> = {
  'awaiting-price': 'Awaiting Price',
  'pending_admin_review': 'Pending Admin Review',
  'waiting_for_agency_approval': 'Awaiting Your Approval',
  'waiting_for_customer_approval': 'Awaiting Customer',
  'customer_approved': 'Meet Transfer Approved',
  'confirmed': 'Confirmed',
  'sent_to_driver': 'Sent to Driver',
  'assigned': 'Assigned',
  'active': 'Active',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'cancelled_by_customer': 'Cancelled by Customer',
  'cancelled_by_agency': 'Cancelled by Agency',
  'customer_rejected': 'Rejected',
};

interface AccountingSummary {
  currencyBalances: CurrencyBalance[];
  monthlyReservations: number;
  completedReservations: number;
}

const AgencyHome = () => {
  const { signOut } = useAuth();
  const { agencyId } = useUserRole();
  const { t, locale } = useAgencyTranslations();
  const { language: agencyLang } = useAgencyLanguage();
  const { isSupported, isSubscribed, isLoading: pushLoading, permission, subscribe, unsubscribe } = usePushNotifications();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agency, setAgency] = useState<{ agency_name: string; balance: number } | null>(null);
  const [accountingSummary, setAccountingSummary] = useState<AccountingSummary>({
    currencyBalances: [],
    monthlyReservations: 0,
    completedReservations: 0
  });
  const [expandedSections, setExpandedSections] = useState({
    awaitingApproval: false,
    upcoming: false,
    active: false,
    pastIncomplete: false,
    completed: false,
    accounting: false,
    notificationSettings: false,
    notificationHistory: false
  });

  // Listen for bottom nav notification toggle
  useEffect(() => {
    const handleToggleNotifications = () => {
      setExpandedSections(prev => ({ ...prev, notificationHistory: !prev.notificationHistory }));
    };

    window.addEventListener('toggleNotificationHistory', handleToggleNotifications);
    return () => window.removeEventListener('toggleNotificationHistory', handleToggleNotifications);
  }, []);
  const [filters, setFilters] = useState<ReservationFilters>({
    searchQuery: '',
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined,
    customerName: '',
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
      setAgency({ agency_name: agencyData.agency_name, balance: agencyData.balance || 0 });
    }

    // Fetch accounting summary
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    // Get completed reservations with agency details and passenger cash
    const { data: completedRes } = await supabase
      .from('reservations')
      .select('id, status, passenger_cash_amount, passenger_cash_currency, agency_reservation_details!inner(customer_price, company_amount, agency_price_currency)')
      .eq('agency_id', agencyId)
      .eq('status', 'completed');

    // Get monthly reservations
    const { data: monthlyRes } = await supabase
      .from('reservations')
      .select('id')
      .eq('agency_id', agencyId)
      .gte('pickup_date', monthStart)
      .lte('pickup_date', monthEnd);

    // Get payments with currency
    const { data: payments } = await supabase
      .from('agency_payments')
      .select('amount, currency')
      .eq('agency_id', agencyId);

    // Calculate currency balances using shared helper (no EUR fallback)
    // YENİ: customer_price kullanılıyor (hem borç hem kâr hesabı için)
    const reservationData: import('@/lib/currency').CompletedReservationData[] = (completedRes || []).map((r) => ({
      passenger_cash_amount: r.passenger_cash_amount ?? null,
      passenger_cash_currency: r.passenger_cash_currency ?? null,
      agency_reservation_details: r.agency_reservation_details ? {
        customer_price: (r.agency_reservation_details as any).customer_price ?? null,
        company_amount: (r.agency_reservation_details as any).company_amount ?? null,
        agency_price_currency: (r.agency_reservation_details as any).agency_price_currency ?? null,
      } : null
    }));
    
    const currencyBalances = calculateCurrencyBalances(reservationData, payments || []);

    setAccountingSummary({
      currencyBalances,
      monthlyReservations: monthlyRes?.length || 0,
      completedReservations: completedRes?.length || 0
    });

    // Fetch reservations with driver info and cash payment details
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id, reservation_code, customer_name, pickup, dropoff,
        pickup_place_name, dropoff_place_name,
        pickup_date, pickup_time, vehicle_type, status, driver_id,
        passenger_cash_amount, passenger_cash_currency,
        drivers:driver_id (id, name, plate_number, phone, vehicle_model, vehicle_color),
        agency_reservation_details (payment_status, agency_price_currency, company_amount)
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

  // Pull to refresh handler
  const handlePullRefresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const { pullDistance, isRefreshing: isPullRefreshing, isPulling, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    threshold: 80,
    disabled: loading,
  });

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

  const toggleSection = (section: 'awaitingApproval' | 'upcoming' | 'active' | 'pastIncomplete' | 'completed' | 'accounting' | 'notificationSettings' | 'notificationHistory') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.customerName) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  }, [filters]);

  // Filter reservations based on filters
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesCode = r.reservation_code?.toLowerCase().includes(query);
        const matchesCustomer = r.customer_name.toLowerCase().includes(query);
        const matchesPickup = r.pickup.toLowerCase().includes(query) || r.pickup_place_name?.toLowerCase().includes(query);
        const matchesDropoff = r.dropoff.toLowerCase().includes(query) || r.dropoff_place_name?.toLowerCase().includes(query);
        if (!matchesCode && !matchesCustomer && !matchesPickup && !matchesDropoff) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && r.status !== filters.status) return false;

      // Customer name filter
      if (filters.customerName && !r.customer_name.toLowerCase().includes(filters.customerName.toLowerCase())) return false;

      // Date range filter
      const pickupDate = new Date(r.pickup_date);
      if (filters.dateFrom && pickupDate < filters.dateFrom) return false;
      if (filters.dateTo && pickupDate > filters.dateTo) return false;

      return true;
    });
  }, [reservations, filters]);

  // Cancel reservation handler
  const handleCancelReservation = useCallback(async (reservationId: string) => {
    try {
      // Find reservation details for notification
      const reservation = reservations.find(r => r.id === reservationId);
      
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled_by_agency' })
        .eq('id', reservationId);

      if (error) throw error;

      // Send notification to admin
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            notify_admins: true,
            reservation_id: reservationId,
            title: '🚫 Acenta Rezervasyon İptali',
            message: `${agency?.agency_name || 'Acenta'} tarafından iptal edildi: ${reservation?.customer_name || 'Müşteri'} - ${reservation?.pickup_date || ''}`,
            type: 'reservation_cancelled',
            send_push: true,
          },
        });
        console.log('Admin notification sent for cancellation');
      } catch (notifyError) {
        console.error('Failed to send admin notification:', notifyError);
        // Don't fail the cancellation if notification fails
      }

      toast.success(t('reservationCancelled') || 'Rezervasyon iptal edildi');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(t('cancelError') || 'İptal işlemi başarısız');
    }
  }, [fetchData, t, reservations, agency]);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Reservations awaiting agency price approval
  const awaitingApprovalJobs = filteredReservations.filter(
    (r) => r.status === 'waiting_for_agency_approval'
  );

  // Keep same-day reservations visible even if pickup_time already passed
  // Exclude waiting_for_agency_approval from upcoming
  const upcomingJobs = filteredReservations.filter(
    (r) =>
      !['completed', 'cancelled', 'active', 'waiting_for_agency_approval'].includes(r.status) &&
      new Date(`${r.pickup_date}T00:00:00`) >= startOfToday
  );
  const activeJobs = filteredReservations.filter((r) => r.status === 'active');
  
  // Past incomplete: pickup date before today and status is NOT completed/cancelled
  const pastIncompleteJobs = filteredReservations.filter(
    (r) =>
      new Date(`${r.pickup_date}T00:00:00`) < startOfToday &&
      !['completed', 'cancelled', 'cancelled_by_customer', 'cancelled_by_agency'].includes(r.status)
  );
  
  const completedJobs = filteredReservations.filter((r) => r.status === 'completed');

  // Group upcoming jobs by date for better organization
  const groupedUpcomingJobs = useMemo(() => {
    const groups: { date: string; label: string; jobs: Reservation[] }[] = [];
    const jobsByDate = new Map<string, Reservation[]>();
    
    upcomingJobs.forEach(job => {
      const dateKey = job.pickup_date;
      if (!jobsByDate.has(dateKey)) {
        jobsByDate.set(dateKey, []);
      }
      jobsByDate.get(dateKey)!.push(job);
    });
    
    // Sort dates and create groups
    const sortedDates = Array.from(jobsByDate.keys()).sort();
    
    sortedDates.forEach(dateKey => {
      const date = parseISO(dateKey);
      let label: string;
      
      if (isToday(date)) {
        label = t('today') || 'Bugün';
      } else if (isTomorrow(date)) {
        label = t('tomorrow') || 'Yarın';
      } else {
        label = format(date, 'dd MMMM yyyy', { locale });
      }
      
      groups.push({
        date: dateKey,
        label,
        jobs: jobsByDate.get(dateKey)!.sort((a, b) => a.pickup_time.localeCompare(b.pickup_time))
      });
    });
    
    return groups;
  }, [upcomingJobs, t, locale]);

  // Group completed jobs by month for better organization
  const groupedCompletedJobs = useMemo(() => {
    const groups: { month: string; label: string; days: { date: string; label: string; jobs: Reservation[] }[] }[] = [];
    const jobsByMonth = new Map<string, Map<string, Reservation[]>>();
    
    completedJobs.forEach(job => {
      const date = parseISO(job.pickup_date);
      const monthKey = format(date, 'yyyy-MM');
      const dateKey = job.pickup_date;
      
      if (!jobsByMonth.has(monthKey)) {
        jobsByMonth.set(monthKey, new Map());
      }
      const monthData = jobsByMonth.get(monthKey)!;
      
      if (!monthData.has(dateKey)) {
        monthData.set(dateKey, []);
      }
      monthData.get(dateKey)!.push(job);
    });
    
    // Sort months descending (newest first)
    const sortedMonths = Array.from(jobsByMonth.keys()).sort().reverse();
    
    sortedMonths.forEach(monthKey => {
      const monthDate = parseISO(`${monthKey}-01`);
      const monthLabel = format(monthDate, 'MMMM yyyy', { locale });
      
      const monthData = jobsByMonth.get(monthKey)!;
      // Sort days descending within month (newest first)
      const sortedDays = Array.from(monthData.keys()).sort().reverse();
      
      const days = sortedDays.map(dateKey => {
        const date = parseISO(dateKey);
        return {
          date: dateKey,
          label: format(date, 'dd MMMM', { locale }),
          jobs: monthData.get(dateKey)!.sort((a, b) => b.pickup_time.localeCompare(a.pickup_time))
        };
      });
      
      groups.push({
        month: monthKey,
        label: monthLabel,
        days
      });
    });
    
    return groups;
  }, [completedJobs, locale]);

  const ReservationCard = ({ reservation }: { reservation: Reservation }) => (
    <Card 
      className="cursor-pointer hover:shadow-md active:scale-[0.98] transition-all touch-manipulation"
      onClick={() => navigate(`/agency/reservation/${reservation.id}`)}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {reservation.reservation_code && (
                <span className="text-[10px] sm:text-xs font-mono bg-muted px-1.5 sm:px-2 py-0.5 rounded">
                  {reservation.reservation_code}
                </span>
              )}
              {/* Currency Badge */}
              {reservation.agency_reservation_details?.agency_price_currency && reservation.agency_reservation_details?.company_amount && reservation.agency_reservation_details.company_amount > 0 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 font-mono bg-primary/5 border-primary/20 text-primary">
                  {getCurrencySymbol(reservation.agency_reservation_details.agency_price_currency)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">{reservation.customer_name}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end flex-shrink-0">
            <Badge className={cn("text-[10px] sm:text-xs px-1.5 sm:px-2", statusColors[reservation.status] || 'bg-muted')}>
              {statusLabels[reservation.status] || reservation.status}
            </Badge>
            {reservation.status === 'customer_approved' && !reservation.driver_id && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[10px] px-1.5">
                {t('awaitingDriverInfo')}
              </Badge>
            )}
            {/* Cash payment warning badge - show when cash payment is expected but amount not entered */}
            {reservation.agency_reservation_details?.payment_status === 'cash' && 
             !reservation.passenger_cash_amount && 
             !['completed', 'cancelled', 'cancelled_by_customer', 'cancelled_by_agency'].includes(reservation.status) && (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Badge className="bg-red-500 text-white border-red-600 text-[10px] px-1.5 animate-pulse">
                  💵 {t('cashRequired') || 'Nakit Girin'}
                </Badge>
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span>{format(new Date(reservation.pickup_date), 'dd MMM yyyy', { locale })}</span>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground ml-1 sm:ml-2 flex-shrink-0" />
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
            <div className="pt-1.5 sm:pt-2 border-t space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                <span className="font-medium text-green-700 text-xs sm:text-sm">{reservation.drivers.name}</span>
              </div>
              {reservation.drivers.plate_number && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground flex-wrap">
                  <span className="text-[10px] sm:text-xs">{t('plate')}:</span>
                  <span className="font-mono text-[10px] sm:text-xs">{reservation.drivers.plate_number}</span>
                  {reservation.drivers.vehicle_color && (
                    <span className="text-[10px] sm:text-xs">• {reservation.drivers.vehicle_color}</span>
                  )}
                </div>
              )}
              {reservation.drivers.vehicle_model && (
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {reservation.drivers.vehicle_model}
                </div>
              )}
            </div>
          )}

          {/* Cash amount display */}
          {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
            <div className="pt-1.5 sm:pt-2 border-t">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg">💵</span>
                <span className="font-semibold text-green-700 text-sm sm:text-base">
                  {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">({t('cashToCollect') || 'Alınacak Nakit'})</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div 
      className="min-h-screen bg-background pb-safe"
      {...pullHandlers}
    >
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isPullRefreshing}
        isPulling={isPulling}
        threshold={80}
      />
      <header className="bg-primary text-primary-foreground py-2.5 px-3 sm:py-4 sm:px-4 flex justify-between items-center sticky top-0 z-10 safe-area-inset-top">
        <div className="min-w-0 flex-1 mr-2">
          <h1 className="text-base sm:text-xl font-serif font-bold truncate">{t('agencyPanel')}</h1>
          {agency && (
            <p className="text-[10px] sm:text-sm opacity-80 truncate">{agency.agency_name}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1.5 flex-shrink-0">
          <AgencyLanguageSelector />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => toggleSection('notificationHistory')}
            className={cn(
              "text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10",
              expandedSections.notificationHistory && "bg-primary-foreground/20"
            )}
            title={t('notificationHistory') || 'Bildirim Geçmişi'}
          >
            <History className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => toggleSection('notificationSettings')}
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
            title={t('notificationSettings') || 'Bildirim Ayarları'}
          >
            <Volume2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </Button>
          {isSupported && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={pushLoading || permission === 'denied'}
              className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
              title={isSubscribed ? t('notificationsOn') : t('enableNotifications')}
            >
              {pushLoading ? (
                <Loader2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 animate-spin" />
              ) : isSubscribed ? (
                <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              ) : (
                <BellOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              )}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
          >
            <RefreshCw className={cn("h-4.5 w-4.5 sm:h-5 sm:w-5", refreshing && "animate-spin")} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/agency/reports')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10 hidden sm:flex"
          >
            <BarChart3 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </Button>
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


      <main className="container mx-auto py-4 px-3 sm:py-6 sm:px-4 max-w-2xl">
        {loading ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Skeleton for search/filters */}
            <div className="space-y-3">
              <div className="h-10 bg-muted animate-pulse rounded-lg" />
            </div>
            
            {/* Skeleton for upcoming section */}
            <SectionSkeleton count={2} />
            
            {/* Skeleton for active section */}
            <SectionSkeleton count={1} />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Notification Settings Panel */}
            <AnimatePresence>
              {expandedSections.notificationSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <NotificationSettingsPanel language={agencyLang === 'TR' ? 'TR' : 'EN'} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notification History Panel */}
            <AnimatePresence>
              {expandedSections.notificationHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <AgencyNotificationHistory />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Advanced Filters & Search */}
            <AgencyReservationFilters 
              filters={filters} 
              onFiltersChange={setFilters} 
              activeFilterCount={activeFilterCount} 
            />

            {/* Muhasebe Detayları - Collapsible Card */}
            <Card 
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                expandedSections.accounting 
                  ? "ring-2 ring-amber-500/30 shadow-lg" 
                  : "hover:border-amber-500/30"
              )}
            >
              <CardContent 
                className="p-4"
                onClick={() => toggleSection('accounting')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-amber-500/10">
                      <Wallet className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{t('accountingDetails')}</p>
                      <p className="text-sm text-muted-foreground">
                        {accountingSummary.currencyBalances.length > 0 
                          ? `${accountingSummary.currencyBalances.length} ${t('currency') || 'para birimi'}`
                          : t('noCompletedReservations') || 'Henüz tamamlanmış rezervasyon yok'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {accountingSummary.currencyBalances.length > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-700 border-amber-300">
                        {accountingSummary.completedReservations} {t('transfer')}
                      </Badge>
                    )}
                    <motion.div
                      animate={{ rotate: expandedSections.accounting ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                </div>
              </CardContent>
              
              {/* Expanded Content */}
              <AnimatePresence>
                {expandedSections.accounting && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t pt-4">
                      {accountingSummary.currencyBalances.length > 0 ? (
                        <>
                          {/* Aylık Borç Özeti Kartı */}
                          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-amber-600" />
                                <p className="font-semibold text-amber-800 dark:text-amber-200">
                                  {format(new Date(), 'MMMM yyyy', { locale: tr })} - Aylık Borç Özeti
                                </p>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {accountingSummary.currencyBalances.map((cb) => (
                                  <div 
                                    key={`monthly-${cb.currency}`}
                                    className={cn(
                                      "p-3 rounded-lg text-center",
                                      cb.netBalance > 0 
                                        ? "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                                        : cb.netBalance < 0
                                          ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                                          : "bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                    )}
                                  >
                                    <Badge variant="outline" className="font-mono mb-1 text-xs">
                                      {cb.currency}
                                    </Badge>
                                    <p className={cn(
                                      "text-lg font-bold",
                                      cb.netBalance > 0 ? "text-destructive" : cb.netBalance < 0 ? "text-green-600" : ""
                                    )}>
                                      {cb.netBalance > 0 ? '' : cb.netBalance < 0 ? '+' : ''}{getCurrencySymbol(cb.currency)}{Math.abs(cb.netBalance).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      {cb.netBalance > 0 ? 'Borç' : cb.netBalance < 0 ? 'Alacak' : 'Dengede'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-3 text-center">
                                {accountingSummary.completedReservations} tamamlanmış transfer • {accountingSummary.monthlyReservations} bu ay oluşturulan
                              </p>
                            </CardContent>
                          </Card>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {accountingSummary.currencyBalances.map((cb) => (
                              <Card 
                                key={cb.currency}
                                className={cn(
                                  "cursor-pointer hover:shadow-md transition-shadow",
                                  cb.netBalance > 0 
                                    ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800" 
                                    : cb.netBalance < 0 
                                      ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800"
                                      : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/agency/currency/${cb.currency}`);
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="font-mono">
                                      {cb.currency}
                                    </Badge>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-xs text-muted-foreground">{t('agencyDebt')}</span>
                                      <p className={cn(
                                        "text-2xl font-bold",
                                        cb.netBalance > 0 ? "text-destructive" : cb.netBalance < 0 ? "text-green-600" : ""
                                      )}>
                                        {getCurrencySymbol(cb.currency)}{Math.abs(cb.netBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">{t('agencyExpense')}</span>
                                        <p className="font-medium">{getCurrencySymbol(cb.currency)}{cb.totalCompanyAmount.toLocaleString('tr-TR')}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">{t('paid')}</span>
                                        <p className="font-medium text-blue-600">{getCurrencySymbol(cb.currency)}{cb.totalPaid.toLocaleString('tr-TR')}</p>
                                      </div>
                                    </div>
                                    {cb.totalPassengerCash > 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        {t('passengerCash')}: -{getCurrencySymbol(cb.currency)}{cb.totalPassengerCash.toLocaleString('tr-TR')}
                                      </p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {/* Completed Transfers Summary */}
                          <Card 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedSections(prev => ({ ...prev, completed: true }));
                              setTimeout(() => {
                                document.getElementById('completed-section')?.scrollIntoView({ behavior: 'smooth' });
                              }, 100);
                            }}
                          >
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-green-500/20">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{t('completed') || 'Completed'}</p>
                                  <p className="text-2xl font-bold text-green-600">
                                    {accountingSummary.completedReservations} <span className="text-sm font-normal">{t('transfer')}</span>
                                  </p>
                                </div>
                              </div>
                              <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <Wallet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">{t('noCompletedReservations') || 'Henüz tamamlanmış rezervasyon yok'}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-primary/30 bg-primary/5"
                onClick={() => navigate('/agency/create-reservation')}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t('newReservation')}</p>
                      <p className="text-sm text-muted-foreground">{t('createTransferRequest')}</p>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20"
                onClick={() => navigate('/agency/transactions')}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-500/20">
                      <Receipt className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">{t('transactionHistory') || 'İşlem Geçmişi'}</p>
                      <p className="text-sm text-muted-foreground">{t('allTransactions') || 'Tüm İşlemler'}</p>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
                </CardContent>
              </Card>
            </div>

            {reservations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">{t('noReservationsYet')}</p>
              </div>
            ) : (
              <>
            {/* Transfer Categories - Collapsible Card Style */}
            <div className="space-y-3">
              {/* Awaiting Price Approval Card */}
              {awaitingApprovalJobs.length > 0 && (
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg border-purple-200 dark:border-purple-800",
                    expandedSections.awaitingApproval 
                      ? "ring-2 ring-purple-400/30 shadow-lg" 
                      : "hover:border-purple-400/50"
                  )}
                >
                  <CardContent 
                    className="p-4 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/30"
                    onClick={() => toggleSection('awaitingApproval')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-purple-500/20">
                          <AlertCircle className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-purple-800 dark:text-purple-200">{t('awaitingPriceApproval') || 'Fiyat Onayı Bekleniyor'}</p>
                          <p className="text-sm text-purple-600/70 dark:text-purple-400/70">{t('priceSetByAdmin') || 'Admin fiyat belirledi'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500 text-white text-base px-3 py-1 animate-pulse">
                          {awaitingApprovalJobs.length}
                        </Badge>
                        <ChevronDown className={cn(
                          "h-5 w-5 text-purple-500 transition-transform duration-200",
                          expandedSections.awaitingApproval && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </CardContent>
                  <AnimatePresence>
                    {expandedSections.awaitingApproval && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-purple-200 dark:border-purple-800"
                      >
                        <div className="p-3 space-y-3 bg-purple-50/30 dark:bg-purple-950/20">
                          {awaitingApprovalJobs.map((res) => (
                            <SwipeableReservationCard 
                              key={res.id} 
                              reservation={res}
                              statusColors={statusColors}
                              statusLabels={statusLabels}
                              locale={locale}
                              onView={() => navigate(`/agency/reservation/${res.id}`)}
                              onEdit={() => navigate(`/agency/edit-reservation/${res.id}`)}
                              onCancel={() => handleCancelReservation(res.id)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )}

              {/* Upcoming Transfers Card */}
              {upcomingJobs.length > 0 && (
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg",
                    expandedSections.upcoming 
                      ? "ring-2 ring-primary/30 shadow-lg" 
                      : "hover:border-primary/30"
                  )}
                >
                  <CardContent 
                    className="p-4"
                    onClick={() => toggleSection('upcoming')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{t('upcomingTransfers')}</p>
                          <p className="text-sm text-muted-foreground">{t('scheduledTransfers') || 'Planlanmış transferler'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
                          {upcomingJobs.length}
                        </Badge>
                        <ChevronDown className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform duration-200",
                          expandedSections.upcoming && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </CardContent>
                  <AnimatePresence>
                    {expandedSections.upcoming && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t"
                      >
                        <div className="p-3 space-y-4 bg-muted/30">
                          {groupedUpcomingJobs.map((group) => (
                            <div key={group.date} className="space-y-2">
                              {/* Date Header */}
                              <div className="flex items-center gap-2 px-2">
                                <div className={cn(
                                  "h-2 w-2 rounded-full",
                                  isToday(parseISO(group.date)) ? "bg-red-500 animate-pulse" : 
                                  isTomorrow(parseISO(group.date)) ? "bg-amber-500" : "bg-primary/50"
                                )} />
                                <span className={cn(
                                  "text-sm font-semibold",
                                  isToday(parseISO(group.date)) ? "text-red-600" : 
                                  isTomorrow(parseISO(group.date)) ? "text-amber-600" : "text-muted-foreground"
                                )}>
                                  {group.label}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {group.jobs.length} {t('transfer')}
                                </Badge>
                              </div>
                              {/* Reservations for this date */}
                              <div className="space-y-2 pl-3 border-l-2 border-primary/20 ml-1">
                                {group.jobs.map((res) => (
                                  <SwipeableReservationCard 
                                    key={res.id} 
                                    reservation={res}
                                    statusColors={statusColors}
                                    statusLabels={statusLabels}
                                    locale={locale}
                                    onView={() => navigate(`/agency/reservation/${res.id}`)}
                                    onEdit={() => navigate(`/agency/edit-reservation/${res.id}`)}
                                    onCancel={() => handleCancelReservation(res.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )}

              {/* Active Transfers Card */}
              {activeJobs.length > 0 && (
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg border-blue-200 dark:border-blue-800",
                    expandedSections.active 
                      ? "ring-2 ring-blue-400/30 shadow-lg" 
                      : "hover:border-blue-400/50"
                  )}
                >
                  <CardContent 
                    className="p-4 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/30"
                    onClick={() => toggleSection('active')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-blue-500/20">
                          <Car className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-blue-800 dark:text-blue-200">{t('activeTransfers') || 'Aktif Transferler'}</p>
                          <p className="text-sm text-blue-600/70 dark:text-blue-400/70">{t('inProgressNow') || 'Şu an devam eden'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500 text-white text-base px-3 py-1 animate-pulse">
                          {activeJobs.length}
                        </Badge>
                        <ChevronDown className={cn(
                          "h-5 w-5 text-blue-500 transition-transform duration-200",
                          expandedSections.active && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </CardContent>
                  <AnimatePresence>
                    {expandedSections.active && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-blue-200 dark:border-blue-800"
                      >
                        <div className="p-3 space-y-3 bg-blue-50/30 dark:bg-blue-950/20">
                          {activeJobs.map((res) => (
                            <SwipeableReservationCard 
                              key={res.id} 
                              reservation={res}
                              statusColors={statusColors}
                              statusLabels={statusLabels}
                              locale={locale}
                              onView={() => navigate(`/agency/reservation/${res.id}`)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )}

              {/* Past Incomplete Transfers Card */}
              {pastIncompleteJobs.length > 0 && (
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg border-orange-200 dark:border-orange-800",
                    expandedSections.pastIncomplete 
                      ? "ring-2 ring-orange-400/30 shadow-lg" 
                      : "hover:border-orange-400/50"
                  )}
                >
                  <CardContent 
                    className="p-4 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/30"
                    onClick={() => toggleSection('pastIncomplete')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-orange-500/20">
                          <History className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-orange-800 dark:text-orange-200">{t('pastIncompleteTransfers') || 'Geçmiş (Tamamlanmamış)'}</p>
                          <p className="text-sm text-orange-600/70 dark:text-orange-400/70">{t('requiresAttention') || 'Dikkat gerektiren'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-500 text-white text-base px-3 py-1">
                          {pastIncompleteJobs.length}
                        </Badge>
                        <ChevronDown className={cn(
                          "h-5 w-5 text-orange-500 transition-transform duration-200",
                          expandedSections.pastIncomplete && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </CardContent>
                  <AnimatePresence>
                    {expandedSections.pastIncomplete && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-orange-200 dark:border-orange-800"
                      >
                        <div className="p-3 space-y-3 bg-orange-50/30 dark:bg-orange-950/20">
                          {pastIncompleteJobs.map((res) => (
                            <SwipeableReservationCard 
                              key={res.id} 
                              reservation={res}
                              statusColors={statusColors}
                              statusLabels={statusLabels}
                              locale={locale}
                              onView={() => navigate(`/agency/reservation/${res.id}`)}
                              onEdit={() => navigate(`/agency/edit-reservation/${res.id}`)}
                              onCancel={() => handleCancelReservation(res.id)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )}

              {/* Completed Transfers Card */}
              {completedJobs.length > 0 && (
                <Card 
                  id="completed-section"
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg border-green-200 dark:border-green-800",
                    expandedSections.completed 
                      ? "ring-2 ring-green-400/30 shadow-lg" 
                      : "hover:border-green-400/50"
                  )}
                >
                  <CardContent 
                    className="p-4 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/30"
                    onClick={() => toggleSection('completed')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-green-500/20">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800 dark:text-green-200">{t('completedTransfers') || 'Tamamlanan Transferler'}</p>
                          <p className="text-sm text-green-600/70 dark:text-green-400/70">{t('successfullyCompleted') || 'Başarıyla tamamlanan'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500 text-white text-base px-3 py-1">
                          {completedJobs.length}
                        </Badge>
                        <ChevronDown className={cn(
                          "h-5 w-5 text-green-500 transition-transform duration-200",
                          expandedSections.completed && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </CardContent>
                  <AnimatePresence>
                    {expandedSections.completed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-green-200 dark:border-green-800"
                      >
                        <div className="p-3 space-y-4 bg-green-50/30 dark:bg-green-950/20">
                          {/* Grouped by Month and Day */}
                          {groupedCompletedJobs.slice(0, 3).map((monthGroup) => (
                            <div key={monthGroup.month} className="space-y-3">
                              {/* Month Header */}
                              <div className="flex items-center gap-2 px-2">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                  {monthGroup.label}
                                </span>
                                <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300">
                                  {monthGroup.days.reduce((sum, day) => sum + day.jobs.length, 0)} {t('transfer')}
                                </Badge>
                              </div>
                              
                              {/* Days within this month */}
                              <div className="space-y-3">
                                {monthGroup.days.slice(0, 5).map((dayGroup) => (
                                  <div key={dayGroup.date} className="space-y-2">
                                    {/* Day Header */}
                                    <div className="flex items-center gap-2 px-2 pl-4">
                                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                        {dayGroup.label}
                                      </span>
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                        {dayGroup.jobs.length}
                                      </Badge>
                                    </div>
                                    {/* Reservations for this day */}
                                    <div className="space-y-2 pl-4 border-l-2 border-green-300/50 ml-2">
                                      {dayGroup.jobs.map((res) => (
                                        <SwipeableReservationCard 
                                          key={res.id} 
                                          reservation={res}
                                          statusColors={statusColors}
                                          statusLabels={statusLabels}
                                          locale={locale}
                                          onView={() => navigate(`/agency/reservation/${res.id}`)}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                {/* Show more days in this month */}
                                {monthGroup.days.length > 5 && (
                                  <p className="text-xs text-green-600 text-center pl-4">
                                    +{monthGroup.days.length - 5} {t('moreDays') || 'daha fazla gün'}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* View all completed */}
                          {groupedCompletedJobs.length > 3 && (
                            <Card 
                              className="cursor-pointer hover:shadow-md transition-shadow text-center bg-white dark:bg-slate-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/agency/reports');
                              }}
                            >
                              <CardContent className="py-4">
                                <p className="text-muted-foreground">
                                  +{groupedCompletedJobs.length - 3} {t('moreMonths') || 'daha fazla ay'}
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )}
            </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <AgencyBottomNav />
      
      {/* Spacer for bottom nav on mobile */}
      <div className="h-14 sm:hidden" />
    </div>
  );
};

export default AgencyHome;
