import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Smartphone, Monitor, Apple, Chrome, Globe, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AppInstallation {
  id: string;
  visitor_id: string;
  user_id: string | null;
  installed_at: string;
  device: string | null;
  browser: string | null;
  platform: string | null;
  country_code: string | null;
  country_name: string | null;
  city: string | null;
}

const AdminAppInstallations = () => {
  const navigate = useNavigate();
  const [installations, setInstallations] = useState<AppInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [excludedUserIds, setExcludedUserIds] = useState<string[]>([]);

  // Fetch excluded user IDs once on mount
  useEffect(() => {
    const fetchExcludedUsers = async () => {
      const { data: excludedRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'driver', 'agency']);
      
      setExcludedUserIds(excludedRoles?.map(r => r.user_id) || []);
    };
    
    fetchExcludedUsers();
  }, []);

  const fetchInstallations = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_installations')
      .select('*')
      .order('installed_at', { ascending: false })
      .limit(500); // Limit for performance

    if (!error && data) {
      // Filter out excluded user installations (already fetched excluded IDs)
      const filteredData = data.filter(i => !i.user_id || !excludedUserIds.includes(i.user_id));
      setInstallations(filteredData);
    }
    setLoading(false);
    setRefreshing(false);
  }, [excludedUserIds]);

  useEffect(() => {
    if (excludedUserIds.length >= 0) {
      fetchInstallations();
    }
  }, [excludedUserIds, fetchInstallations]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('app-installations-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'app_installations' },
        () => fetchInstallations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInstallations]);

  // Calculate stats using useMemo for performance
  const stats = useMemo(() => ({
    total: installations.length,
    mobile: installations.filter(i => i.device === 'mobile').length,
    desktop: installations.filter(i => i.device === 'desktop').length,
    ios: installations.filter(i => i.platform === 'iOS').length,
    android: installations.filter(i => i.platform === 'Android').length,
  }), [installations]);

  // Calculate country stats with useMemo
  const sortedCountries = useMemo(() => {
    const countryStats = installations.reduce((acc, inst) => {
      const country = inst.country_name || 'Bilinmiyor';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countryStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [installations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInstallations();
  };

  const getPlatformIcon = (platform: string | null) => {
    switch (platform) {
      case 'iOS':
        return <Apple className="h-4 w-4" />;
      case 'Android':
        return <Smartphone className="h-4 w-4 text-green-600" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getBrowserBadge = (browser: string | null) => {
    switch (browser) {
      case 'Chrome':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Chrome className="h-3 w-3 mr-1" />Chrome</Badge>;
      case 'Safari':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Safari</Badge>;
      case 'Firefox':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Firefox</Badge>;
      default:
        return <Badge variant="outline">{browser || 'Bilinmiyor'}</Badge>;
    }
  };

  const getDeviceBadge = (device: string | null) => {
    if (device === 'mobile') {
      return <Badge className="bg-purple-100 text-purple-700 border-purple-200"><Smartphone className="h-3 w-3 mr-1" />Mobil</Badge>;
    }
    return <Badge variant="secondary"><Monitor className="h-3 w-3 mr-1" />Masaüstü</Badge>;
  };

  const getFlagEmoji = (countryCode: string | null) => {
    if (!countryCode) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Uygulama İndirmeleri</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      <main className="container mx-auto py-8 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Download className="h-4 w-4" />
                Toplam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.mobile}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Masaüstü
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.desktop}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Apple className="h-4 w-4" />
                iOS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.ios}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                Android
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.android}</div>
            </CardContent>
          </Card>
        </div>

        {/* Country Stats */}
        {sortedCountries.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Ülkelere Göre İndirmeler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedCountries.map(([country, count]) => {
                  const inst = installations.find(i => i.country_name === country);
                  const percentage = Math.round((count / stats.total) * 100);
                  return (
                    <div key={country} className="flex items-center gap-3">
                      <span className="text-xl">{getFlagEmoji(inst?.country_code || null)}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{country}</span>
                          <span className="text-muted-foreground">{count} indirme</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Installations Table */}
        <Card>
          <CardHeader>
            <CardTitle>İndirme Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
            ) : installations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Henüz uygulama indirmesi yok
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Ülke</TableHead>
                    <TableHead>Cihaz</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Tarayıcı</TableHead>
                    <TableHead className="text-right">Visitor ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installations.map((install) => (
                    <TableRow key={install.id}>
                      <TableCell>
                        {format(new Date(install.installed_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getFlagEmoji(install.country_code)}</span>
                          <span>{install.country_name || 'Bilinmiyor'}</span>
                          {install.city && (
                            <span className="text-muted-foreground text-sm">({install.city})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getDeviceBadge(install.device)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(install.platform)}
                          <span>{install.platform || 'Bilinmiyor'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getBrowserBadge(install.browser)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {install.visitor_id.substring(0, 8)}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminAppInstallations;
