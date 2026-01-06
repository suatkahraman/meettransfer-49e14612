import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from 'date-fns';
import { AlertCircle, Banknote, BarChart3, Building2, Calculator, Calendar, CalendarDays, Car, CheckCircle, ClipboardList, DollarSign, Download, FileText, Inbox, LogOut, MapPin, MessageCircle, Plane, Receipt, Settings, Users } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoiceDialog } from '@/components/admin/InvoiceDialog';
import { supabase } from '@/integrations/supabase/client';
interface KPIs {
  newToday: number;
  pendingAssignment: number;
  activeTrips: number;
  completedTrips: number;
  monthlyDriverExpense: number;
}

interface DriverExpenseBreakdownItem {
  driverId: string;
  driverName: string;
  totalExpense: number;
  transferCount: number;
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIs>({
    newToday: 0,
    pendingAssignment: 0,
    activeTrips: 0,
    completedTrips: 0,
    monthlyDriverExpense: 0,
  });
  const [driverExpenseBreakdown, setDriverExpenseBreakdown] = useState<DriverExpenseBreakdownItem[]>([]);
  const [driverExpenseOpen, setDriverExpenseOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadWhatsApp, setUnreadWhatsApp] = useState(0);
  const [pendingQuickBookings, setPendingQuickBookings] = useState(0);
  const [pendingAdminReview, setPendingAdminReview] = useState(0);
  const [appInstallCount, setAppInstallCount] = useState(0);

  const monthLabel = format(new Date(), 'MM.yyyy');
  const formatTRY = (amount: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

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

      // Monthly driver expense (sum of driver_earning) for completed jobs by pickup_date
      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

      const { data: expenseRows } = await supabase
        .from('reservations')
        .select('driver_id, driver_earning')
        .eq('status', 'completed')
        .gte('pickup_date', monthStartStr)
        .lte('pickup_date', monthEndStr)
        .not('driver_id', 'is', null)
        .not('driver_earning', 'is', null)
        .gt('driver_earning', 0);

      const driverIds = Array.from(
        new Set((expenseRows || []).map((r) => r.driver_id).filter(Boolean))
      ) as string[];

      const driverNameMap = new Map<string, string>();
      if (driverIds.length > 0) {
        const { data: driversData } = await supabase
          .from('drivers')
          .select('id, name')
          .in('id', driverIds);

        (driversData || []).forEach((d) => driverNameMap.set(d.id, d.name));
      }

      const expenseMap = new Map<string, { total: number; count: number }>();
      (expenseRows || []).forEach((r) => {
        if (!r.driver_id) return;
        const existing = expenseMap.get(r.driver_id) || { total: 0, count: 0 };
        existing.total += Number(r.driver_earning || 0);
        existing.count += 1;
        expenseMap.set(r.driver_id, existing);
      });

      const breakdown: DriverExpenseBreakdownItem[] = Array.from(expenseMap.entries())
        .map(([driverId, val]) => ({
          driverId,
          driverName: driverNameMap.get(driverId) || 'Bilinmiyor',
          totalExpense: val.total,
          transferCount: val.count,
        }))
        .sort((a, b) => b.totalExpense - a.totalExpense);

      const monthlyDriverExpense = breakdown.reduce((sum, row) => sum + row.totalExpense, 0);
      setDriverExpenseBreakdown(breakdown);

      setKpis({
        newToday: newToday || 0,
        pendingAssignment: pendingAssignment || 0,
        activeTrips: activeTrips || 0,
        completedTrips: completedTrips || 0,
        monthlyDriverExpense,
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

  // Fetch pending quick bookings count
  useEffect(() => {
    const fetchPendingQuickBookings = async () => {
      const { count } = await supabase
        .from('quick_booking_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      setPendingQuickBookings(count || 0);
    };

    fetchPendingQuickBookings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('quick-bookings-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quick_booking_requests' },
        () => fetchPendingQuickBookings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch pending admin review reservations count
  useEffect(() => {
    const fetchPendingAdminReview = async () => {
      const { count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_admin_review');
      
      setPendingAdminReview(count || 0);
    };

    fetchPendingAdminReview();

    const channel = supabase
      .channel('pending-admin-review-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => fetchPendingAdminReview()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch app installation count
  useEffect(() => {
    const fetchInstallCount = async () => {
      const { count } = await supabase
        .from('app_installations')
        .select('*', { count: 'exact', head: true });
      
      setAppInstallCount(count || 0);
    };

    fetchInstallCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('app-installations-count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'app_installations' },
        () => fetchInstallCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch pending agency applications count
  const [pendingAgencyApps, setPendingAgencyApps] = useState(0);
  
  useEffect(() => {
    const fetchPendingAgencyApps = async () => {
      const { count } = await supabase
        .from('agency_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      setPendingAgencyApps(count || 0);
    };

    fetchPendingAgencyApps();

    const channel = supabase
      .channel('agency-apps-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agency_applications' },
        () => fetchPendingAgencyApps()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const menuItems = [
    { icon: Inbox, label: 'Quick Bookings', path: '/admin/quick-bookings', badge: pendingQuickBookings },
    { icon: MessageCircle, label: 'WhatsApp Chat', path: '/admin/whatsapp', badge: unreadWhatsApp },
    { icon: ClipboardList, label: 'Rezervasyonlar', path: '/admin/reservations' },
    { icon: CalendarDays, label: 'Takvim', path: '/admin/calendar' },
    { icon: Plane, label: 'Uçuş Takip', path: '/admin/flight-monitor' },
    { icon: Users, label: 'Şoförler', path: '/admin/drivers' },
    { icon: Building2, label: 'Acenteler', path: '/admin/agencies' },
    { icon: ClipboardList, label: 'Acenta Başvuruları', path: '/admin/agency-applications', badge: pendingAgencyApps },
    { icon: FileText, label: 'Şablonlar', path: '/admin/templates' },
    { icon: DollarSign, label: 'Aylık Muhasebe', path: '/admin/monthly-accounting' },
    { icon: Calculator, label: 'Aylık Kâr', path: '/admin/monthly-profit' },
    { icon: MapPin, label: 'Bölge Fiyatları', path: '/admin/region-prices' },
    { icon: BarChart3, label: 'Ziyaretçi Analizi', path: '/admin/analytics' },
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
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

          <Card 
            className="border-orange-500/50 cursor-pointer hover:shadow-lg transition-shadow hover:border-orange-400"
            onClick={() => navigate('/admin/filtered-reservations?filter=pending_admin_review')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Onay Bekleyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingAdminReview}</div>
            </CardContent>
          </Card>

          <Card 
            className="border-yellow-500/50 cursor-pointer hover:shadow-lg transition-shadow hover:border-yellow-400"
            onClick={() => navigate('/admin/filtered-reservations?filter=new')}
          >
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

          <Card 
            className="border-blue-500/50 cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-400"
            onClick={() => navigate('/admin/filtered-reservations?filter=active')}
          >
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

          <Card 
            className="border-green-500/50 cursor-pointer hover:shadow-lg transition-shadow hover:border-green-400"
            onClick={() => navigate('/admin/filtered-reservations?filter=completed')}
          >
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

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
            role="button"
            tabIndex={0}
            onClick={() => setDriverExpenseOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setDriverExpenseOpen(true);
            }}
            aria-label="Aylık şoför gideri detaylarını aç"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Aylık Şoför Gideri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {loading ? '-' : formatTRY(kpis.monthlyDriverExpense)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Detay için tıklayın</div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/50 cursor-pointer hover:shadow-lg transition-shadow hover:border-purple-400" onClick={() => navigate('/admin/app-installations')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Download className="h-4 w-4" />
                Uygulama İndirme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{appInstallCount}</div>
            </CardContent>
          </Card>

          <Card 
            className="border-amber-500/50 cursor-pointer hover:shadow-lg transition-shadow hover:border-amber-400"
            onClick={() => setInvoiceOpen(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Fatura Hazırla
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-amber-600 font-medium">Fatura Oluştur</div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={driverExpenseOpen} onOpenChange={setDriverExpenseOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Aylık Şoför Gideri ({monthLabel})</DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <div className="text-sm text-muted-foreground">Toplam</div>
              <div className="text-lg font-semibold">{formatTRY(kpis.monthlyDriverExpense)}</div>
            </div>

            {driverExpenseBreakdown.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Bu ay tamamlanmış şoför işi bulunamadı.
              </div>
            ) : (
              <div className="space-y-2">
                {driverExpenseBreakdown.map((row) => (
                  <div key={row.driverId} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">{row.driverName}</div>
                      <div className="text-xs text-muted-foreground">{row.transferCount} transfer</div>
                    </div>
                    <div className="font-semibold">{formatTRY(row.totalExpense)}</div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <InvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} />

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
