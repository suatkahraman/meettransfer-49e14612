import { useState, useEffect, useCallback, useMemo } from "react";
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
  RefreshCw,
  Eye,
  FileText
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

interface PageStats {
  page_path: string;
  views: number;
  uniqueVisitors: number;
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

interface PresenceState {
  visitor_id: string;
  page_path: string;
  country_code: string;
  country_name: string;
  city: string;
  browser: string;
  device: string;
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
  const [pageStats, setPageStats] = useState<PageStats[]>([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      // Parallel fetch for better performance
      const [todayResult, countryResult, weekResult, pageResult] = await Promise.all([
        // Today's unique visitors count
        supabase
          .from('page_visits')
          .select('visitor_id', { count: 'exact', head: false })
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),
        
        // Country stats
        supabase
          .from('page_visits')
          .select('country_name, country_code')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .not('country_name', 'is', null),
        
        // Last 7 days - single query with date grouping
        supabase
          .from('page_visits')
          .select('visitor_id, created_at')
          .gte('created_at', subDays(now, 6).toISOString())
          .lte('created_at', todayEnd),

        // Page visit stats - today
        supabase
          .from('page_visits')
          .select('page_path, visitor_id')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
      ]);

      // Process today's stats
      if (todayResult.data) {
        const uniqueVisitors = new Set(todayResult.data.map(v => v.visitor_id));
        setTodayVisitors(uniqueVisitors.size);
        setTodayPageViews(todayResult.data.length);
      }

      // Process country stats
      if (countryResult.data) {
        const countryMap = new Map<string, { name: string; code: string; count: number }>();
        countryResult.data.forEach(visit => {
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
        setCountryStats(
          Array.from(countryMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(s => ({
              country_name: s.name,
              country_code: s.code,
              count: s.count
            }))
        );
      }

      // Process weekly stats
      if (weekResult.data) {
        const dailyMap = new Map<string, Set<string>>();
        
        for (let i = 6; i >= 0; i--) {
          const date = subDays(now, i);
          const dateKey = format(date, 'yyyy-MM-dd');
          dailyMap.set(dateKey, new Set());
        }

        weekResult.data.forEach(visit => {
          const dateKey = format(new Date(visit.created_at), 'yyyy-MM-dd');
          dailyMap.get(dateKey)?.add(visit.visitor_id);
        });

        const stats: DailyStats[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = subDays(now, i);
          const dateKey = format(date, 'yyyy-MM-dd');
          const visitors = dailyMap.get(dateKey);
          stats.push({
            date: format(date, 'dd MMM', { locale: tr }),
            visitors: visitors?.size || 0,
            pageViews: 0 // Not needed for display
          });
        }
        setDailyStats(stats);
      }

      // Process page stats
      if (pageResult.data) {
        const pageMap = new Map<string, { views: number; visitors: Set<string> }>();
        pageResult.data.forEach(visit => {
          const path = visit.page_path || '/';
          const existing = pageMap.get(path);
          if (existing) {
            existing.views++;
            existing.visitors.add(visit.visitor_id);
          } else {
            pageMap.set(path, { views: 1, visitors: new Set([visit.visitor_id]) });
          }
        });
        setPageStats(
          Array.from(pageMap.entries())
            .map(([path, data]) => ({
              page_path: path,
              views: data.views,
              uniqueVisitors: data.visitors.size
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 15)
        );
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Subscribe to realtime presence for active visitors
  useEffect(() => {
    const channel = supabase.channel('mt_visitors');
    
    const handlePresenceSync = () => {
      const state = channel.presenceState<PresenceState>();
      const visitors: ActiveVisitor[] = [];
      
      Object.values(state).forEach((presences) => {
        if (presences && presences.length > 0) {
          const latest = presences[presences.length - 1];
          visitors.push({
            visitor_id: latest.visitor_id,
            page_path: latest.page_path,
            country_name: latest.country_name || '',
            country_code: latest.country_code || '',
            device: latest.device || 'Desktop',
            browser: latest.browser || 'Unknown',
            last_activity: latest.last_activity || new Date().toISOString()
          });
        }
      });
      
      setActiveVisitors(visitors);
    };

    channel
      .on('presence', { event: 'sync' }, handlePresenceSync)
      .on('presence', { event: 'join' }, handlePresenceSync)
      .on('presence', { event: 'leave' }, handlePresenceSync)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh every 60 seconds (reduced from 30s)
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getDeviceIcon = useCallback((device: string) => {
    switch (device) {
      case 'Mobile': return <Smartphone className="h-4 w-4" />;
      case 'Tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  }, []);

  const getFlagEmoji = useCallback((countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }, []);

  const maxVisitors = useMemo(() => 
    Math.max(...dailyStats.map(d => d.visitors), 1),
    [dailyStats]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                Tekil ziyaretçi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sayfa Görüntüleme
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayPageViews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Toplam görüntüleme
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
                Canlı ziyaretçi
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
                Farklı ülke
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
              <div className="space-y-3 max-h-80 overflow-y-auto">
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
                        <p className="font-medium text-sm truncate max-w-[200px]">{visitor.page_path}</p>
                        <p className="text-xs text-muted-foreground">
                          {visitor.country_name || 'Bilinmeyen Konum'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {getDeviceIcon(visitor.device)}
                        <span className="text-xs hidden sm:inline">{visitor.browser}</span>
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
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min((day.visitors / maxVisitors) * 100, 100)}%` 
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

        {/* Page Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sayfa Ziyaret Analizi (Bugün)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pageStats.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Henüz sayfa verisi yok
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pageStats.map((page, index) => {
                  const maxViews = pageStats[0]?.views || 1;
                  return (
                    <div 
                      key={page.page_path || index}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[300px]" title={page.page_path}>
                          {page.page_path === '/' ? 'Ana Sayfa' : page.page_path}
                        </span>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {page.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {page.uniqueVisitors}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min((page.views / maxViews) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
