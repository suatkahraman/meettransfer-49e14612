import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  reservation_id: string | null;
}

const notificationIcons: Record<string, string> = {
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
  'admin_updated_price': '💵',
};

export const AgencyNotificationHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, locale } = useAgencyTranslations();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter === 'unread') {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`agency-notifications-history-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.reservation_id) {
      navigate(`/agency/reservation/${notification.reservation_id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="touch-manipulation">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg">{t('notificationHistory') || 'Bildirim Geçmişi'}</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                variant={filter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-none h-7 text-[10px] sm:text-xs px-2 sm:px-3"
                onClick={() => setFilter('all')}
              >
                {t('all') || 'Tümü'}
              </Button>
              <Button
                variant={filter === 'unread' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-none h-7 text-[10px] sm:text-xs px-2 sm:px-3"
                onClick={() => setFilter('unread')}
              >
                {t('unread') || 'Okunmamış'}
              </Button>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] sm:text-xs px-2 sm:px-3"
                onClick={markAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{t('markAllRead') || 'Tümünü Okundu Yap'}</span>
                <span className="sm:hidden">✓</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6">
        {notifications.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Bell className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-muted-foreground/50" />
            <p className="text-sm sm:text-base text-muted-foreground">
              {filter === 'unread' 
                ? (t('noUnreadNotifications') || 'Okunmamış bildirim yok')
                : (t('noNotifications') || 'Bildirim bulunamadı')
              }
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "group relative p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-colors active:scale-[0.98]",
                    !notification.read 
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10" 
                      : "bg-muted/30 hover:bg-muted/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl flex-shrink-0">
                      {notificationIcons[notification.type] || '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {!notification.read && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full flex-shrink-0 animate-pulse" />
                        )}
                        <span className="font-medium text-xs sm:text-sm truncate">{notification.title}</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale })}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">•</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
                          {format(new Date(notification.created_at), 'dd MMM HH:mm', { locale })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-7 sm:w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                      {notification.reservation_id && (
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgencyNotificationHistory;
