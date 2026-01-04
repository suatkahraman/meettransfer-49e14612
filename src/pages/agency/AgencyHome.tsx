import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Calendar, User, Loader2, BarChart3, Clock, Car, ChevronDown, RefreshCw, Wallet, TrendingUp, CheckCircle, CreditCard, Plus, Bell, BellOff, Receipt, Volume2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import AgencyLanguageSelector from '@/components/agency/AgencyLanguageSelector';
import { useAgencyLanguage } from '@/contexts/AgencyLanguageContext';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LocationDisplay } from '@/components/ui/location-display';
import ReservationSearch from '@/components/ReservationSearch';

interface Driver {
  id: string;
  name: string;
  plate_number: string | null;
  phone: string;
  vehicle_model: string | null;
  vehicle_color: string | null;
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
  totalRevenue: number;
  totalPaid: number;
  totalPassengerCash: number;
  balance: number;
  monthlyReservations: number;
  completedReservations: number;
}

const AgencyHome = () => {
  const { signOut } = useAuth();
  const { agencyId } = useUserRole();
  const { t, locale } = useAgencyTranslations();
  const { currencySymbol, language: agencyLang } = useAgencyLanguage();
  const { isSupported, isSubscribed, isLoading: pushLoading, permission, subscribe, unsubscribe } = usePushNotifications();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agency, setAgency] = useState<{ agency_name: string; balance: number } | null>(null);
  const [accountingSummary, setAccountingSummary] = useState<AccountingSummary>({
    totalRevenue: 0,
    totalPaid: 0,
    totalPassengerCash: 0,
    balance: 0,
    monthlyReservations: 0,
    completedReservations: 0
  });
  const [expandedSections, setExpandedSections] = useState({
    upcoming: true,
    active: true,
    pastIncomplete: false,
    completed: false,
    notificationSettings: false
  });

  const fetchData = useCallback(async (showToast = false) => {
    if (!agencyId) return;

    // Fetch agency info
    const { data: agencyData } = await supabase
      .from('agencies')
      .select('agency_name, balance, currency')
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
      .select('id, status, passenger_cash_amount, agency_reservation_details!inner(customer_price, company_amount, agency_price_currency)')
      .eq('agency_id', agencyId)
      .eq('status', 'completed');

    // Get monthly reservations
    const { data: monthlyRes } = await supabase
      .from('reservations')
      .select('id')
      .eq('agency_id', agencyId)
      .gte('pickup_date', monthStart)
      .lte('pickup_date', monthEnd);

    // Get payments
    const { data: payments } = await supabase
      .from('agency_payments')
      .select('amount')
      .eq('agency_id', agencyId);

    // Get agency currency from context or DB
    const agencyCurrencyCode = agencyData?.currency || 'EUR';

    const totalRevenue = completedRes?.reduce((sum, r) => {
      const detail = r.agency_reservation_details as unknown as { customer_price: number; company_amount: number; agency_price_currency: string | null };
      // Only count if currency matches agency's currency
      if (detail?.agency_price_currency && detail.agency_price_currency !== agencyCurrencyCode) {
        return sum;
      }
      return sum + (detail?.customer_price || 0);
    }, 0) || 0;

    // Calculate total company amount (agency debt)
    const totalCompanyAmount = completedRes?.reduce((sum, r) => {
      const detail = r.agency_reservation_details as unknown as { customer_price: number; company_amount: number; agency_price_currency: string | null };
      // Only count if currency matches agency's currency
      if (detail?.agency_price_currency && detail.agency_price_currency !== agencyCurrencyCode) {
        return sum;
      }
      return sum + (detail?.company_amount || 0);
    }, 0) || 0;

    // Calculate total passenger cash collected
    const totalPassengerCash = completedRes?.reduce((sum, r) => {
      return sum + (r.passenger_cash_amount || 0);
    }, 0) || 0;

    const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Net agency debt = company amount - passenger cash collected
    const netAgencyDebt = totalCompanyAmount - totalPassengerCash;

    setAccountingSummary({
      totalRevenue,
      totalPaid,
      totalPassengerCash,
      balance: netAgencyDebt - totalPaid,
      monthlyReservations: monthlyRes?.length || 0,
      completedReservations: completedRes?.length || 0
    });

    // Fetch reservations with driver info
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id, reservation_code, customer_name, pickup, dropoff,
        pickup_place_name, dropoff_place_name,
        pickup_date, pickup_time, vehicle_type, status, driver_id,
        drivers:driver_id (id, name, plate_number, phone, vehicle_model, vehicle_color)
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

  const toggleSection = (section: 'upcoming' | 'active' | 'pastIncomplete' | 'completed' | 'notificationSettings') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Keep same-day reservations visible even if pickup_time already passed
  const upcomingJobs = reservations.filter(
    (r) =>
      !['completed', 'cancelled', 'active'].includes(r.status) &&
      new Date(`${r.pickup_date}T00:00:00`) >= startOfToday
  );
  const activeJobs = reservations.filter((r) => r.status === 'active');
  
  // Past incomplete: pickup date before today and status is NOT completed/cancelled
  const pastIncompleteJobs = reservations.filter(
    (r) =>
      new Date(`${r.pickup_date}T00:00:00`) < startOfToday &&
      !['completed', 'cancelled', 'cancelled_by_customer', 'cancelled_by_agency'].includes(r.status)
  );
  
  const completedJobs = reservations.filter((r) => r.status === 'completed');

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
          <div className="flex flex-col gap-1">
            <Badge className={statusColors[reservation.status] || 'bg-muted'}>
              {statusLabels[reservation.status] || reservation.status}
            </Badge>
            {reservation.status === 'customer_approved' && !reservation.driver_id && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
                {t('awaitingDriverInfo')}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(reservation.pickup_date), 'dd MMM yyyy', { locale })}</span>
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
            <div className="pt-2 border-t space-y-1">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700">{reservation.drivers.name}</span>
              </div>
              {reservation.drivers.plate_number && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">{t('plate')}:</span>
                  <span className="font-mono text-xs">{reservation.drivers.plate_number}</span>
                  {reservation.drivers.vehicle_color && (
                    <span className="text-xs">• {reservation.drivers.vehicle_color}</span>
                  )}
                </div>
              )}
              {reservation.drivers.vehicle_model && (
                <div className="text-xs text-muted-foreground">
                  {reservation.drivers.vehicle_model}
                </div>
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
          <h1 className="text-xl font-serif font-bold">{t('agencyPanel')}</h1>
          {agency && (
            <p className="text-sm opacity-80">{agency.agency_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <AgencyLanguageSelector />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => toggleSection('notificationSettings')}
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
            title={t('notificationSettings') || 'Bildirim Ayarları'}
          >
            <Volume2 className="h-4 w-4" />
          </Button>
          {isSupported && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={pushLoading || permission === 'denied'}
              className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
              title={isSubscribed ? t('notificationsOn') : t('enableNotifications')}
            >
              {pushLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSubscribed ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/agency/reports')} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut} 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Balance Warning */}
      {agency && agency.balance < 0 && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4">
          <p className="text-destructive font-medium">
            ⚠️ {t('insufficientBalance')} ({currencySymbol}{Math.abs(agency.balance).toFixed(2)})
          </p>
        </div>
      )}

      <main className="container mx-auto py-6 px-4 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
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

            {/* Reservation Code Search */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">{t('searchReservation') || 'Rezervasyon Ara'}</p>
                <ReservationSearch userType="agency" agencyId={agencyId || undefined} placeholder="MT123456" />
              </CardContent>
            </Card>

            {/* Accounting Summary Card - Clickable */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700"
              onClick={() => navigate('/agency/reports')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{t('accountingDetails')}</CardTitle>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-4">
                  {/* Agency Debt */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('agencyDebt')}</span>
                    <p className={cn(
                      "text-xl font-bold",
                      accountingSummary.balance > 0 ? "text-destructive" : accountingSummary.balance < 0 ? "text-green-600" : ""
                    )}>
                      {currencySymbol}{Math.abs(accountingSummary.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                    {accountingSummary.totalPassengerCash > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t('passengerCash')}: -{currencySymbol}{accountingSummary.totalPassengerCash.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {/* Agency Expense / Revenue */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('agencyExpense')}</span>
                    <p className="text-xl font-bold text-green-600">
                      {currencySymbol}{accountingSummary.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Paid */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('paid')}</span>
                    <p className="text-xl font-bold text-blue-600">
                      {currencySymbol}{accountingSummary.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Completed - Clickable */}
                  <div 
                    className="space-y-1 cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg p-2 -m-2 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSections(prev => ({ ...prev, completed: true }));
                      setTimeout(() => {
                        document.getElementById('completed-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                  >
                    <span className="text-xs text-muted-foreground">{t('completed') || 'Completed'}</span>
                    <p className="text-xl font-bold text-green-600">
                      {accountingSummary.completedReservations} <span className="text-sm font-normal">{t('transfer')}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
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
            {/* Upcoming Section */}
            {upcomingJobs.length > 0 && (
              <section>
                <button 
                  onClick={() => toggleSection('upcoming')}
                  className="flex items-center justify-between w-full py-2 mb-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t('upcomingTransfers')}</span>
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

            {/* Past Incomplete Section */}
            {pastIncompleteJobs.length > 0 && (
              <section>
                <button 
                  onClick={() => toggleSection('pastIncomplete')}
                  className="flex items-center justify-between w-full py-2 mb-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t('pastIncompleteTransfers') || 'Past (Incomplete)'}</span>
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-700">{pastIncompleteJobs.length}</Badge>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    expandedSections.pastIncomplete && "rotate-180"
                  )} />
                </button>
                <AnimatePresence>
                  {expandedSections.pastIncomplete && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {pastIncompleteJobs.map((res) => (
                        <ReservationCard key={res.id} reservation={res} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {/* Completed Section */}
            {completedJobs.length > 0 && (
              <section id="completed-section">
                <button 
                  onClick={() => toggleSection('completed')}
                  className="flex items-center justify-between w-full py-2 mb-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t('completedTransfers') || 'Completed Transfers'}</span>
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
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AgencyHome;
