import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, BarChart3, Receipt, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [pressedItem, setPressedItem] = useState<string | null>(null);

  // Haptic feedback function
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const durations = { light: 5, medium: 10, heavy: 20 };
      navigator.vibrate(durations[intensity]);
    }
  }, []);

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
    // Trigger haptic feedback
    triggerHaptic('light');
    
    if (item.path === '/agency?section=notifications') {
      navigate('/agency');
      window.dispatchEvent(new CustomEvent('toggleNotificationHistory'));
    } else {
      navigate(item.path);
    }
  };

  const handlePressStart = (path: string) => {
    setPressedItem(path);
    triggerHaptic('light');
  };

  const handlePressEnd = () => {
    setPressedItem(null);
  };

  // Only show on agency routes
  if (!location.pathname.startsWith('/agency')) {
    return null;
  }

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border pb-safe sm:hidden"
    >
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isPressed = pressedItem === item.path;
          
          return (
            <motion.button
              key={item.path}
              onClick={() => handleNavClick(item)}
              onTouchStart={() => handlePressStart(item.path)}
              onTouchEnd={handlePressEnd}
              onMouseDown={() => handlePressStart(item.path)}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: isPressed ? 0.9 : 1,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative touch-manipulation select-none",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              {/* Active indicator with animation */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full"
                  />
                )}
              </AnimatePresence>

              <motion.div 
                className="relative"
                animate={{
                  scale: active ? 1.1 : 1,
                  y: active ? -1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon className="h-5 w-5" />
                
                {/* Badge with animation */}
                <AnimatePresence>
                  {item.badge && item.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.span 
                className="text-[10px] font-medium"
                animate={{
                  fontWeight: active ? 600 : 500,
                  opacity: active ? 1 : 0.7,
                }}
                transition={{ duration: 0.15 }}
              >
                {item.label}
              </motion.span>

              {/* Ripple effect background */}
              <AnimatePresence>
                {isPressed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.3 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-full bg-primary/20 pointer-events-none"
                    style={{ originX: 0.5, originY: 0.5 }}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default AgencyBottomNav;
