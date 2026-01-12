import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, Smartphone, Monitor, Apple, TrendingUp, ArrowRight } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InstallStats {
  total: number;
  mobile: number;
  desktop: number;
  ios: number;
  android: number;
  last7Days: number;
  todayCount: number;
}

const PWAInstallWidget = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<InstallStats>({
    total: 0,
    mobile: 0,
    desktop: 0,
    ios: 0,
    android: 0,
    last7Days: 0,
    todayCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      const sevenDaysAgo = subDays(today, 7);
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();

      // Fetch all installations
      const { data: installations, error } = await supabase
        .from('app_installations')
        .select('*')
        .order('installed_at', { ascending: false });

      if (error) {
        console.error('Error fetching installations:', error);
        setLoading(false);
        return;
      }

      // Filter out admin/driver/agency user installations
      const { data: excludedRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'driver', 'agency']);

      const excludedUserIds = excludedRoles?.map(r => r.user_id) || [];
      const filteredInstalls = (installations || []).filter(
        i => !i.user_id || !excludedUserIds.includes(i.user_id)
      );

      // Calculate stats
      const total = filteredInstalls.length;
      const mobile = filteredInstalls.filter(i => i.device === 'mobile').length;
      const desktop = filteredInstalls.filter(i => i.device === 'desktop').length;
      const ios = filteredInstalls.filter(i => i.platform === 'iOS').length;
      const android = filteredInstalls.filter(i => i.platform === 'Android').length;
      
      const last7Days = filteredInstalls.filter(
        i => new Date(i.installed_at) >= sevenDaysAgo
      ).length;

      const todayCount = filteredInstalls.filter(
        i => i.installed_at >= todayStart && i.installed_at <= todayEnd
      ).length;

      // Calculate daily data for the last 7 days
      const dailyCounts: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(today, i);
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        const count = filteredInstalls.filter(
          inst => {
            const instDate = new Date(inst.installed_at);
            return instDate >= dayStart && instDate <= dayEnd;
          }
        ).length;
        dailyCounts.push({
          date: format(day, 'EEE'),
          count,
        });
      }
      setDailyData(dailyCounts);

      setStats({
        total,
        mobile,
        desktop,
        ios,
        android,
        last7Days,
        todayCount,
      });
      setLoading(false);
    };

    fetchStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('pwa-install-widget')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'app_installations' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const mobilePercentage = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.mobile / stats.total) * 100);
  }, [stats.mobile, stats.total]);

  const maxDailyCount = useMemo(() => {
    return Math.max(...dailyData.map(d => d.count), 1);
  }, [dailyData]);

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-2"
    >
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-300 border-purple-500/30 hover:border-purple-500/60 overflow-hidden"
        onClick={() => navigate('/admin/app-installations')}
      >
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Download className="h-4 w-4 text-purple-600" />
              PWA Kurulumları
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Main Stats Row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Toplam Kurulum</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">+{stats.last7Days}</span>
              </div>
              <p className="text-xs text-muted-foreground">Son 7 gün</p>
            </div>
          </div>

          {/* Today Badge */}
          {stats.todayCount > 0 && (
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-700">
                Bugün {stats.todayCount} yeni kurulum
              </span>
            </div>
          )}

          {/* Device Distribution */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" /> Mobil
              </span>
              <span className="flex items-center gap-1">
                <Monitor className="h-3 w-3" /> Masaüstü
              </span>
            </div>
            <Progress value={mobilePercentage} className="h-2" />
            <div className="flex justify-between text-xs">
              <span className="font-medium">{stats.mobile} ({mobilePercentage}%)</span>
              <span className="font-medium">{stats.desktop} ({100 - mobilePercentage}%)</span>
            </div>
          </div>

          {/* Platform Badges */}
          <div className="flex gap-2">
            <div className={cn(
              "flex-1 flex items-center justify-center gap-2 p-2 rounded-lg",
              "bg-gray-100 dark:bg-gray-800"
            )}>
              <Apple className="h-4 w-4" />
              <span className="text-sm font-semibold">{stats.ios}</span>
            </div>
            <div className={cn(
              "flex-1 flex items-center justify-center gap-2 p-2 rounded-lg",
              "bg-green-100 dark:bg-green-900/30"
            )}>
              <Smartphone className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">{stats.android}</span>
            </div>
          </div>

          {/* Mini Chart - Last 7 Days */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Son 7 Gün</p>
            <div className="flex items-end gap-1 h-12">
              {dailyData.map((day, index) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.count / maxDailyCount) * 100}%` }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className={cn(
                      "w-full rounded-t min-h-[4px]",
                      day.count > 0 ? "bg-purple-500" : "bg-muted"
                    )}
                  />
                  <span className="text-[10px] text-muted-foreground">{day.date}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PWAInstallWidget;
