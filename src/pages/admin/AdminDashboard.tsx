import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Calendar, Users, Car, CheckCircle, DollarSign, ClipboardList, Settings, FileText, CalendarDays } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns';
import NotificationBell from '@/components/NotificationBell';

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

  const menuItems = [
    { icon: ClipboardList, label: 'Reservations', path: '/admin/reservations' },
    { icon: CalendarDays, label: 'Calendar', path: '/admin/calendar' },
    { icon: Users, label: 'Drivers', path: '/admin/drivers' },
    { icon: FileText, label: 'Templates', path: '/admin/templates' },
    { icon: DollarSign, label: 'Accounting', path: '/admin/accounting' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-serif">Admin Dashboard</h1>
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
                New Today
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
                Pending Assignment
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
                Active Trips
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
                Completed
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
                Revenue ({format(new Date(), 'MMM')})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₺{loading ? '-' : kpis.monthlyRevenue.toFixed(0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Menu */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Card 
              key={item.path} 
              className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
              onClick={() => navigate(item.path)}
            >
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
