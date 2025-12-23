import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Calendar, Users, Car, CheckCircle, DollarSign, ClipboardList, Settings, FileText, CalendarDays, Building2, Plane, MessageCircle } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import NotificationBell from '@/components/NotificationBell';
import { MonthlyProfitCard } from '@/components/admin/MonthlyProfitCard';
import { Badge } from '@/components/ui/badge';
interface KPIs {
  newToday: number;
  pendingAssignment: number;
  activeTrips: number;
  completedTrips: number;
  monthlyRevenue: number;
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIs>({
    newToday: 0,
    pendingAssignment: 0,
    activeTrips: 0,
    completedTrips: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [unreadWhatsApp, setUnreadWhatsApp] = useState(0);

  useEffect(() => {
    const fetchKPIs = async () => {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const dayStart = startOfDay(today);
      const dayEnd = endOfDay(today);

      // New bookings today
      const { count: newToday } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

      // Pending assignment
      const { count: pendingAssignment } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      // Active trips
      const { count: activeTrips } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Completed trips this month
      const { count: completedTrips } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', monthStart.toISOString())
        .lte('updated_at', monthEnd.toISOString());

      // Monthly revenue
      const { data: revenueData } = await supabase
        .from('reservations')
        .select('price')
        .eq('status', 'completed')
        .gte('updated_at', monthStart.toISOString())
        .lte('updated_at', monthEnd.toISOString());

      const monthlyRevenue = revenueData?.reduce((sum, r) => sum + (r.price || 0), 0) || 0;

      setKpis({
        newToday: newToday || 0,
        pendingAssignment: pendingAssignment || 0,
        activeTrips: activeTrips || 0,
        completedTrips: completedTrips || 0,
        monthlyRevenue,
      });
      setLoading(false);
    };

    fetchKPIs();
  }, []);

  // Fetch unread WhatsApp messages count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data } = await supabase
        .from('whatsapp_conversations')
        .select('unread_count');
      
      const total = data?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0;
      setUnreadWhatsApp(total);
    };

    fetchUnreadCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('whatsapp-unread')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_conversations' },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const menuItems = [
    { icon: ClipboardList, label: 'Rezervasyonlar', path: '/admin/reservations' },
    { icon: CalendarDays, label: 'Takvim', path: '/admin/calendar' },
    { icon: MessageCircle, label: 'WhatsApp Chat', path: '/admin/whatsapp', badge: unreadWhatsApp },
    { icon: Plane, label: 'Uçuş Takip', path: '/admin/flight-monitor' },
    { icon: Users, label: 'Şoförler', path: '/admin/drivers' },
    { icon: Building2, label: 'Acenteler', path: '/admin/agencies' },
    { icon: FileText, label: 'Şablonlar', path: '/admin/templates' },
    { icon: DollarSign, label: 'Aylık Muhasebe', path: '/admin/monthly-accounting' },
    { icon: Settings, label: 'Ayarlar', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-serif">Yönetim Paneli</h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Bugün Yeni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '-' : kpis.newToday}</div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Atama Bekleyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{loading ? '-' : kpis.pendingAssignment}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Car className="h-4 w-4" />
                Aktif Transferler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{loading ? '-' : kpis.activeTrips}</div>
            </CardContent>
          </Card>

          <Card className="border-green-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Tamamlanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? '-' : kpis.completedTrips}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Aylık Şöför Gideri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₺{loading ? '-' : kpis.monthlyRevenue.toFixed(0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Profit Card */}
        <div className="mb-8">
          <MonthlyProfitCard />
        </div>

        {/* Navigation Menu */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Card 
              key={item.path} 
              className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary relative"
              onClick={() => navigate(item.path)}
            >
              {item.badge && item.badge > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground min-w-[24px] h-6 flex items-center justify-center"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
              <CardContent className="flex flex-col items-center justify-center py-8">
                <item.icon className="h-12 w-12 text-primary mb-3" />
                <span className="font-medium">{item.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
