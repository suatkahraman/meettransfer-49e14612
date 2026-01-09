import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, BarChart3, Receipt, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

export const AgencyBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAgencyTranslations();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Real-time subscription for notifications
    const channel = supabase
      .channel(`agency-bottom-nav-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: t('home') || 'Ana Sayfa',
      path: '/agency',
    },
    {
      icon: Plus,
      label: t('newReservation') || 'Yeni',
      path: '/agency/create-reservation',
    },
    {
      icon: Bell,
      label: t('notifications') || 'Bildirimler',
      path: '/agency?section=notifications',
      badge: unreadCount,
    },
    {
      icon: Receipt,
      label: t('transactions') || 'İşlemler',
      path: '/agency/transactions',
    },
    {
      icon: BarChart3,
      label: t('reports') || 'Raporlar',
      path: '/agency/reports',
    },
  ];

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  const handleNavClick = (item: NavItem) => {
    if (item.path === '/agency?section=notifications') {
      // Navigate to agency home and trigger notification panel
      navigate('/agency');
      // Dispatch custom event to toggle notification history
      window.dispatchEvent(new CustomEvent('toggleNotificationHistory'));
    } else {
      navigate(item.path);
    }
  };

  // Only show on agency routes
  if (!location.pathname.startsWith('/agency')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe sm:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative touch-manipulation",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AgencyBottomNav;
