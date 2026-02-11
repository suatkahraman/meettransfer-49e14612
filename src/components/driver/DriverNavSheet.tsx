import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import UniversalLanguageSelector from '@/components/UniversalLanguageSelector';
import {
  Home,
  AlertCircle,
  CheckCircle2,
  Calculator,
  History,
  Search,
  Volume2,
  Settings,
  Shield,
  Globe,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSearch?: () => void;
  onOpenNotificationSettings?: () => void;
  onOpenDriverInfo?: () => void;
}

const navItems = [
  { path: '/driver', icon: Home, key: 'home' },
  { path: '/driver/jobs/pending', icon: AlertCircle, key: 'pendingJobs' },
  { path: '/driver/jobs/completed', icon: CheckCircle2, key: 'completedJobs' },
  { path: '/driver/monthly-accounting', icon: Calculator, key: 'monthlyAccounting' },
  { path: '/driver/history', icon: History, key: 'history' },
];

export const DriverNavSheet = ({
  open,
  onOpenChange,
  onOpenSearch,
  onOpenNotificationSettings,
  onOpenDriverInfo,
}: DriverNavSheetProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useDriverTranslations();

  const handleNav = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleUtility = (fn?: () => void) => {
    fn?.();
    onOpenChange(false);
  };

  return (
    <SheetContent
      side="left"
      className="w-[280px] sm:w-[300px] p-0 flex flex-col border-r"
    >
      <SheetHeader className="p-4 border-b text-left">
        <SheetTitle className="text-lg font-serif">{t('driverPanel')}</SheetTitle>
      </SheetHeader>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Main Nav */}
        {navItems.map(({ path, icon: Icon, key }) => (
          <button
            key={path}
            onClick={() => handleNav(path)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
              location.pathname === path
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="font-medium">{t(key)}</span>
          </button>
        ))}

        {/* Utility Actions */}
        <div className="pt-4 mt-4 border-t space-y-1">
          {onOpenSearch && (
            <button
              onClick={() => handleUtility(onOpenSearch)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <Search className="h-5 w-5 shrink-0" />
              <span className="font-medium">{t('searchByCode')}</span>
            </button>
          )}
          {onOpenNotificationSettings && (
            <button
              onClick={() => handleUtility(onOpenNotificationSettings)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <Volume2 className="h-5 w-5 shrink-0" />
              <span className="font-medium">{t('notificationSettings')}</span>
            </button>
          )}
          {onOpenDriverInfo && (
            <button
              onClick={() => handleUtility(onOpenDriverInfo)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span className="font-medium">{t('updateInfo')}</span>
            </button>
          )}
        </div>

        {/* Settings & Logout */}
        <div className="pt-4 mt-4 border-t space-y-1">
          <button
            onClick={() => handleNav('/driver/settings')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <User className="h-5 w-5 shrink-0" />
            <span className="font-medium">{t('accountSettings')}</span>
          </button>
          <button
            onClick={() => handleNav('/security-settings')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <Shield className="h-5 w-5 shrink-0" />
            <span className="font-medium">{t('securitySettings')}</span>
          </button>
          <div className="px-3 py-2 flex items-center gap-3">
            <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
            <UniversalLanguageSelector variant="compact" />
          </div>
          <button
            onClick={() => {
              signOut();
              onOpenChange(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </nav>
    </SheetContent>
  );
};
