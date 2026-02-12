import { useState, useCallback, Suspense, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu, ArrowLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';
import { PushNotificationToggle } from '@/components/PushNotificationToggle';
import ReservationSearch from '@/components/ReservationSearch';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import DriverInfoEditor from '@/components/driver/DriverInfoEditor';
import { DriverNavSheet } from './DriverNavSheet';

export interface DriverHeaderExtras {
  onRefresh?: () => void;
  refreshing?: boolean;
  pendingCount?: number;
  activeCount?: number;
}

const ROUTE_TITLES: Record<string, string> = {
  '/driver': 'driverPanel',
  '/driver/jobs/pending': 'pendingJobs',
  '/driver/jobs/completed': 'completedJobs',
  '/driver/jobs/active': 'activeJobs',
  '/driver/accounting': 'accounting',
  '/driver/monthly-accounting': 'monthlyEarnings',
  '/driver/history': 'transferHistory',
  '/driver/settings': 'accountSettings',
  '/driver/job': 'jobDetails',
};

const getTitleKey = (pathname: string): string => {
  if (pathname === '/driver') return 'driverPanel';
  if (pathname.startsWith('/driver/job/')) return 'jobDetails';
  if (pathname.startsWith('/driver/jobs/')) {
    const type = pathname.split('/').pop()?.split('?')[0];
    return ROUTE_TITLES[`/driver/jobs/${type}`] || 'jobs';
  }
  return ROUTE_TITLES[pathname] || 'driverPanel';
};

export const DriverLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { driverId } = useUserRole();
  const { t } = useDriverTranslations();

  const [menuOpen, setMenuOpen] = useState(false);
  const [utilityPanel, setUtilityPanel] = useState<'search' | 'notification' | 'driverinfo' | null>(null);
  const [headerExtras, setHeaderExtras] = useState<DriverHeaderExtras>({});
  const [headerRight, setHeaderRight] = useState<React.ReactNode>(null);
  const setHeaderExtrasFn = useCallback((extras: DriverHeaderExtras) => {
    setHeaderExtras(prev => ({ ...prev, ...extras }));
  }, []);

  const { onRefresh, refreshing = false, pendingCount = 0, activeCount = 0 } = headerExtras;
  const isHome = location.pathname === '/driver';

  // Clear header right when route changes (child can set it)
  useEffect(() => {
    setHeaderRight(null);
  }, [location.pathname]);
  const showBack = !isHome;

  const titleKey = getTitleKey(location.pathname);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Compact mobile header */}
      <header className="bg-primary text-primary-foreground py-2.5 px-3 sm:py-3 sm:px-4 flex justify-between items-center flex-shrink-0 z-20 shadow-lg safe-area-inset-top">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-sm sm:text-lg font-serif font-bold truncate max-w-[130px] sm:max-w-none">
            {t(titleKey)}
          </h1>
          {isHome && activeCount > 0 && (
            <Badge variant="secondary" className="hidden sm:inline-flex bg-green-500 text-white hover:bg-green-600 h-5 sm:h-6 px-1.5 sm:px-2 text-xs flex-shrink-0">
              {activeCount}
            </Badge>
          )}
          {isHome && pendingCount > 0 && (
            <Badge variant="secondary" className="hidden sm:inline-flex bg-amber-500 text-white hover:bg-amber-600 h-5 sm:h-6 px-1.5 sm:px-2 text-xs flex-shrink-0">
              {pendingCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {headerRight}
          {isHome && onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={refreshing}
              className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
            >
              <RefreshCw className={cn("h-4.5 w-4.5 sm:h-5 sm:w-5", refreshing && "animate-spin")} />
            </Button>
          )}
          <PushNotificationToggle compact />
          <NotificationBell />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
          <Outlet context={{ setHeaderExtras: setHeaderExtrasFn, setHeaderRight, setMenuOpen, setUtilityPanel }} />
        </Suspense>
      </main>

      {/* Hamburger Menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col border-r">
          <DriverNavSheet
            onOpenChange={setMenuOpen}
            onOpenSearch={() => setUtilityPanel('search')}
            onOpenNotificationSettings={() => setUtilityPanel('notification')}
            onOpenDriverInfo={() => setUtilityPanel('driverinfo')}
          />
        </SheetContent>
      </Sheet>

      {/* Utility Panels (Search, Notification Settings, Driver Info) */}
      <Sheet open={utilityPanel !== null} onOpenChange={(open) => !open && setUtilityPanel(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {utilityPanel === 'search' && (
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">{t('searchByCode')}</h3>
              <ReservationSearch
                userType="driver"
                driverId={driverId || undefined}
                placeholder="MT123456"
              />
            </div>
          )}
          {utilityPanel === 'notification' && (
            <div className="p-4">
              <NotificationSettingsPanel language="TR" />
            </div>
          )}
          {utilityPanel === 'driverinfo' && (
            <div className="p-4">
              <DriverInfoEditor onClose={() => setUtilityPanel(null)} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
