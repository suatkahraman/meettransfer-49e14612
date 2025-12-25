import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Users, 
  Globe, 
  Activity, 
  TrendingUp,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";

interface DailyStats {
  date: string;
  visitors: number;
  pageViews: number;
}

interface CountryStats {
  country_name: string;
  country_code: string;
  count: number;
}

interface ActiveVisitor {
  visitor_id: string;
  page_path: string;
  country_name: string;
  country_code: string;
  device: string;
  browser: string;
  last_activity: string;
}

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const [todayPageViews, setTodayPageViews] = useState(0);
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitor[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  const fetchAnalytics = async () => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const activeThreshold = new Date(now.getTime() - 5 * 60 * 1000).toISOString(); // 5 minutes

      // Fetch today's stats
      const { data: todayData } = await supabase
        .from('page_visits')
        .select('visitor_id')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      if (todayData) {
        const uniqueVisitors = new Set(todayData.map(v => v.visitor_id));
        setTodayVisitors(uniqueVisitors.size);
        setTodayPageViews(todayData.length);
      }

      // Fetch active visitors (last 5 minutes)
      const { data: activeData } = await supabase
        .from('page_visits')
        .select('visitor_id, page_path, country_name, country_code, device, browser, last_activity')
        .gte('last_activity', activeThreshold)
        .order('last_activity', { ascending: false });

      if (activeData) {
        // Get unique visitors by visitor_id (most recent activity)
        const uniqueActive = activeData.reduce((acc: ActiveVisitor[], curr) => {
          if (!acc.find(v => v.visitor_id === curr.visitor_id)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        setActiveVisitors(uniqueActive);
      }

      // Fetch country stats for today
      const { data: countryData } = await supabase
        .from('page_visits')
        .select('country_name, country_code')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .not('country_name', 'is', null);

      if (countryData) {
        const countryMap = new Map<string, { name: string; code: string; count: number }>();
        countryData.forEach(visit => {
          const key = visit.country_code || visit.country_name || 'Unknown';
          const existing = countryMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            countryMap.set(key, {
              name: visit.country_name || 'Unknown',
              code: visit.country_code || '',
              count: 1
            });
          }
        });
        const sorted = Array.from(countryMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setCountryStats(sorted.map(s => ({
          country_name: s.name,
          country_code: s.code,
          count: s.count
        })));
      }

      // Fetch last 7 days stats
      const last7Days: DailyStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const { data: dayData } = await supabase
          .from('page_visits')
          .select('visitor_id')
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);

        if (dayData) {
          const uniqueVisitors = new Set(dayData.map(v => v.visitor_id));
          last7Days.push({
            date: format(date, 'dd MMM', { locale: tr }),
            visitors: uniqueVisitors.size,
            pageViews: dayData.length
          });
        } else {
          last7Days.push({
            date: format(date, 'dd MMM', { locale: tr }),
            visitors: 0,
            pageViews: 0
          });
        }
      }
      setDailyStats(last7Days);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Mobile': return <Smartphone className="h-4 w-4" />;
      case 'Tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Ziyaretçi Analizi</h1>
              <p className="text-muted-foreground text-sm">Web sitesi trafiği ve ziyaretçi istatistikleri</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bugünkü Ziyaretçiler
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayVisitors}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayPageViews} sayfa görüntüleme
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Şu An Aktif
              </CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeVisitors.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Son 5 dakikada aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ülke Sayısı
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{countryStats.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Farklı ülkeden ziyaretçi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Visitors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Şu An Aktif Ziyaretçiler
              <Badge variant="secondary" className="ml-2">
                {activeVisitors.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeVisitors.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Şu an aktif ziyaretçi yok
              </p>
            ) : (
              <div className="space-y-3">
                {activeVisitors.map((visitor, index) => (
                  <div 
                    key={`${visitor.visitor_id}-${index}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {getFlagEmoji(visitor.country_code)}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{visitor.page_path}</p>
                        <p className="text-xs text-muted-foreground">
                          {visitor.country_name || 'Bilinmeyen Konum'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {getDeviceIcon(visitor.device)}
                        <span className="text-xs">{visitor.browser}</span>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Ülkelere Göre Ziyaretçiler (Bugün)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {countryStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Henüz ülke verisi yok
                </p>
              ) : (
                <div className="space-y-3">
                  {countryStats.map((country, index) => (
                    <div 
                      key={country.country_code || index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {getFlagEmoji(country.country_code)}
                        </span>
                        <span className="font-medium">{country.country_name}</span>
                      </div>
                      <Badge variant="secondary">{country.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Son 7 Gün
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyStats.map((day, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-muted-foreground w-16">{day.date}</span>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ 
                            width: `${Math.min((day.visitors / Math.max(...dailyStats.map(d => d.visitors), 1)) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{day.visitors}</span>
                      <span className="text-xs text-muted-foreground ml-1">ziyaretçi</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
