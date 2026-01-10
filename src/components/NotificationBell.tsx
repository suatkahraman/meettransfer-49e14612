import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  reservation_id: string | null;
}

interface NotificationBellProps {
  variant?: 'light' | 'dark';
}

// Update PWA badge count
const updateBadgeCount = (count: number) => {
  // Try to update the badge via service worker
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_BADGE',
      count,
    });
  }
  
  // Also try direct badge API
  if ('setAppBadge' in navigator) {
    if (count > 0) {
      (navigator as any).setAppBadge(count).catch(() => {});
    } else {
      (navigator as any).clearAppBadge().catch(() => {});
    }
  }
};

export const NotificationBell = ({ variant = 'light' }: NotificationBellProps) => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const { playSound } = useNotificationSound();
  const { t } = useDriverTranslations();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
      const unread = data.filter(n => !n.read).length;
      setUnreadCount(unread);
      updateBadgeCount(unread);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
          setUnreadCount(prev => {
            const newCount = prev + 1;
            updateBadgeCount(newCount);
            return newCount;
          });
          playSound();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          // Recalculate unread count
          setNotifications(prev => {
            const unread = prev.filter(n => !n.read).length;
            setUnreadCount(unread);
            updateBadgeCount(unread);
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setNotifications(prev => {
            const filtered = prev.filter(n => n.id !== deletedId);
            const unread = filtered.filter(n => !n.read).length;
            setUnreadCount(unread);
            updateBadgeCount(unread);
            return filtered;
          });
        }
      )
      .subscribe();

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_RECEIVED') {
        fetchNotifications();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      supabase.removeChannel(channel);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [user, fetchNotifications, playSound]);

  const markAsRead = async (notification: Notification) => {
    if (!notification.read) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        updateBadgeCount(newCount);
        return newCount;
      });
    }

    setIsOpen(false);

    if (notification.reservation_id) {
      // Navigate based on user role
      if (role === 'admin') {
        navigate(`/admin/reservations/${notification.reservation_id}`);
      } else if (role === 'driver') {
        navigate(`/driver/job/${notification.reservation_id}`);
      } else {
        navigate(`/customer/reservation/${notification.reservation_id}`);
      }
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    updateBadgeCount(0);
  };

  const deleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== notificationId);
      const unread = filtered.filter(n => !n.read).length;
      setUnreadCount(unread);
      updateBadgeCount(unread);
      return filtered;
    });
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'price_ready': '💰',
      'reservation_confirmed': '✅',
      'reservation_updated': '📝',
      'reservation_cancelled': '❌',
      'driver_assigned': '🚗',
      'driver_on_way': '🚕',
      'trip_completed': '🎉',
      'new_reservation': '📬',
      'reservation_edited': '✏️',
      'customer_cancelled': '❌',
      'driver_accepted': '✅',
      'driver_updated_payment': '💵',
      'driver_reminder': '⏰',
    };
    return icons[type] || '🔔';
  };

  const buttonClass = variant === 'light' 
    ? 'text-primary-foreground hover:bg-primary-foreground/10' 
    : 'text-foreground hover:bg-muted';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative h-9 w-9 sm:h-10 sm:w-10 ${buttonClass}`}>
          <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-background z-50 max-h-[70vh] overflow-y-auto">
        <div className="p-3 font-semibold border-b flex items-center justify-between sticky top-0 bg-background">
          <span>{t('notifications')} {unreadCount > 0 && `(${unreadCount})`}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              {t('markAllRead')}
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            {t('noNotifications')}
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => markAsRead(notification)}
              className={`flex flex-col items-start gap-1 p-3 cursor-pointer relative group ${!notification.read ? 'bg-primary/5' : ''}`}
            >
              <div className="flex items-start gap-2 w-full">
                <span className="text-lg flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm truncate">{notification.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {notification.message}
                  </p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => deleteNotification(e, notification.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </DropdownMenuItem>
          ))
        )}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground w-full">
                {t('viewAll')}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;