import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Card, CardContent } from '@/components/ui/card';
import { Star, TrendingUp, Wallet, CheckCircle, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface DriverStats {
  name: string;
  averageRating: number | null;
  totalReviews: number;
  totalCompletedThisMonth: number;
  totalEarningsThisMonth: number;
  totalCashThisMonth: number;
  currentBalance: number;
  nextJob: {
    date: string;
    time: string;
    pickup: string;
  } | null;
}

interface DriverStatsCardProps {
  driverId: string;
}

export const DriverStatsCard = ({ driverId }: DriverStatsCardProps) => {
  const { t } = useDriverTranslations();
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!driverId) return;

      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      // Fetch driver info with rating
      const { data: driverData } = await supabase
        .from('drivers')
        .select('name, average_rating, total_reviews')
        .eq('id', driverId)
        .single();

      // Fetch monthly completed reservations
      const { data: monthlyRes } = await supabase
        .from('reservations')
        .select('id, driver_earning, driver_cash_amount')
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .gte('pickup_date', monthStart)
        .lte('pickup_date', monthEnd);

      // Fetch driver balance
      const { data: balanceData } = await supabase
        .from('driver_balances')
        .select('balance')
        .eq('driver_id', driverId)
        .single();

      // Fetch next upcoming job
      const { data: nextJobData } = await supabase
        .from('reservations')
        .select('pickup_date, pickup_time, pickup, pickup_place_name')
        .eq('driver_id', driverId)
        .in('status', ['sent_to_driver', 'assigned', 'active'])
        .gte('pickup_date', format(now, 'yyyy-MM-dd'))
        .order('pickup_date', { ascending: true })
        .order('pickup_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      const totalEarnings = monthlyRes?.reduce((sum, r) => sum + (r.driver_earning || 0), 0) || 0;
      const totalCash = monthlyRes?.reduce((sum, r) => sum + (r.driver_cash_amount || 0), 0) || 0;

      setStats({
        name: driverData?.name || '',
        averageRating: driverData?.average_rating,
        totalReviews: driverData?.total_reviews || 0,
        totalCompletedThisMonth: monthlyRes?.length || 0,
        totalEarningsThisMonth: totalEarnings,
        totalCashThisMonth: totalCash,
        currentBalance: balanceData?.balance || 0,
        nextJob: nextJobData ? {
          date: nextJobData.pickup_date,
          time: nextJobData.pickup_time,
          pickup: nextJobData.pickup_place_name || nextJobData.pickup
        } : null
      });

      setLoading(false);
    };

    fetchStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('driver-stats-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `driver_id=eq.${driverId}`
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  if (loading || !stats) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const rating = stats.averageRating || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden">
        <CardContent className="p-4 space-y-4">
          {/* Driver Name & Rating */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">{t('welcome') || 'Hoş geldin'}, {stats.name.split(' ')[0]}!</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, d MMMM')}
              </p>
            </div>
            
            {/* Rating Badge */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 bg-accent/20 px-3 py-1.5 rounded-full">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-bold text-accent">
                  {rating > 0 ? rating.toFixed(1) : '-'}
                </span>
              </div>
              {stats.totalReviews > 0 && (
                <span className="text-xs text-muted-foreground mt-1">
                  {stats.totalReviews} {t('reviews') || 'değerlendirme'}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* This Month Completed */}
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-600">{stats.totalCompletedThisMonth}</p>
              <p className="text-[10px] text-muted-foreground">{t('thisMonth') || 'Bu Ay'}</p>
            </div>

            {/* This Month Earnings */}
            <div className="bg-blue-500/10 rounded-lg p-3 text-center">
              <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-600">₺{stats.totalEarningsThisMonth.toLocaleString('tr-TR')}</p>
              <p className="text-[10px] text-muted-foreground">{t('earnings')}</p>
            </div>

            {/* Cash Collected */}
            <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
              <Wallet className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-emerald-600">₺{stats.totalCashThisMonth.toLocaleString('tr-TR')}</p>
              <p className="text-[10px] text-muted-foreground">{t('cashCollected')}</p>
            </div>
          </div>

          {/* Balance Indicator */}
          {stats.currentBalance !== 0 && (
            <div className={`rounded-lg p-3 ${stats.currentBalance > 0 ? 'bg-amber-500/10' : 'bg-green-500/10'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('balance')}
                </span>
                <span className={`font-bold ${stats.currentBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {stats.currentBalance > 0 ? '+' : ''}₺{stats.currentBalance.toLocaleString('tr-TR')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.currentBalance > 0 
                  ? (t('companyOwesYou') || 'Şirket size borçlu')
                  : (t('youOweCompany') || 'Şirkete borcunuz')}
              </p>
            </div>
          )}

          {/* Next Job Preview */}
          {stats.nextJob && (
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {t('nextJob') || 'Sonraki Transfer'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(stats.nextJob.date), 'd MMM')} - {stats.nextJob.time}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {stats.nextJob.pickup}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DriverStatsCard;
