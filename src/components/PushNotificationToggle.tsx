import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PushNotificationToggleProps {
  compact?: boolean;
}

export const PushNotificationToggle = ({ compact = false }: PushNotificationToggleProps) => {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotifications();
  const { t } = useLanguage();

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={isLoading || permission === 'denied'}
        className="h-9 w-9 sm:h-10 sm:w-10 text-primary-foreground hover:bg-primary-foreground/10"
        title={isSubscribed ? (t("notificationsOn") || 'Notifications On') : (t("enableNotifications") || 'Enable Notifications')}
      >
        {isLoading ? (
          <Loader2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        ) : (
          <BellOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading || permission === 'denied'}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {isSubscribed ? (t("notificationsOn") || 'Notifications On') : (t("enableNotifications") || 'Enable Notifications')}
    </Button>
  );
};
