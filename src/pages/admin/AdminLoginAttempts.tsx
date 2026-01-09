import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, RefreshCw, Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  user_id: string | null;
  role: string | null;
  attempted_at: string;
}

const AdminLoginAttempts = () => {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0 });

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('login_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(200);

      if (searchQuery) {
        query = query.ilike('email', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttempts(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const successful = data?.filter(a => a.success).length || 0;
      const failed = total - successful;
      setStats({ total, successful, failed });
    } catch (error) {
      console.error('Error fetching login attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [searchQuery]);

  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return '-';
    if (ua.includes('iPhone')) return '📱 iPhone';
    if (ua.includes('Android')) return '📱 Android';
    if (ua.includes('Mac')) return '💻 Mac';
    if (ua.includes('Windows')) return '💻 Windows';
    if (ua.includes('Linux')) return '💻 Linux';
    return '🌐 Browser';
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      admin: 'destructive',
      agency: 'default',
      driver: 'secondary',
      customer: 'outline',
    };
    return <Badge variant={variants[role] || 'outline'}>{role}</Badge>;
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/admin/settings" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Ayarlar</span>
          </Link>
          <h1 className="text-base font-medium">Giriş Denemeleri</h1>
          <Button variant="ghost" size="icon" onClick={fetchAttempts}>
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Toplam</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ShieldCheck className="h-6 w-6 mx-auto text-green-500 mb-1" />
              <div className="text-2xl font-bold text-green-500">{stats.successful}</div>
              <div className="text-xs text-muted-foreground">Başarılı</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ShieldAlert className="h-6 w-6 mx-auto text-destructive mb-1" />
              <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Başarısız</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Email ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Login Attempts Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Son Giriş Denemeleri</CardTitle>
            <CardDescription>Son 200 giriş denemesi listeleniyor</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Giriş denemesi bulunamadı
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Cihaz</TableHead>
                      <TableHead>Hata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(attempt.attempted_at), 'dd MMM HH:mm', { locale: tr })}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">
                          {attempt.email}
                        </TableCell>
                        <TableCell>
                          {attempt.success ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              ✓ Başarılı
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              ✗ Başarısız
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getRoleBadge(attempt.role)}</TableCell>
                        <TableCell className="text-sm">
                          {parseUserAgent(attempt.user_agent)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {attempt.failure_reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginAttempts;