import { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Vibrate, Smartphone, TestTube, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSound, NotificationSoundType } from '@/hooks/useNotificationSound';
import { toast } from 'sonner';

interface NotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  volume: number;
  soundType: NotificationSoundType;
}

const STORAGE_KEY = 'notification_settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  volume: 0.7,
  soundType: 'default'
};

// Multi-language translations
type NotificationLanguage = 'TR' | 'EN';

const translations: Record<NotificationLanguage, Record<string, string>> = {
  TR: {
    notificationsNotSupported: 'Bildirimler Desteklenmiyor',
    browserNotSupported: 'Tarayıcınız push bildirimleri desteklemiyor. Lütfen modern bir tarayıcı kullanın.',
    notificationSettings: 'Bildirim Ayarları',
    manageSettings: 'Push bildirimleri, ses ve titreşim ayarlarınızı yönetin',
    permissionGranted: 'İzin Verildi',
    permissionDenied: 'Reddedildi',
    permissionPending: 'Bekliyor',
    pushNotifications: 'Push Bildirimleri',
    notificationsOn: 'Bildirimler açık',
    getImportantUpdates: 'Önemli güncellemeler için bildirim alın',
    permissionDeniedMessage: 'Bildirim izni reddedilmiş. Bildirimleri etkinleştirmek için tarayıcı ayarlarından izin vermeniz gerekiyor.',
    notificationSound: 'Bildirim Sesi',
    playSoundOnNotification: 'Bildirim geldiğinde ses çal',
    soundVolume: 'Ses Seviyesi',
    soundType: 'Ses Türü',
    vibration: 'Titreşim',
    vibrationOnNotification: 'Bildirim geldiğinde titreşim',
    activeForImportantRoles: '(Admin/Sürücü için aktif)',
    testNotification: 'Bildirimi Test Et',
    testSent: 'Test Gönderildi',
    testNotificationSent: 'Test bildirimi gönderildi!',
    testNotificationTitle: '🔔 Test Bildirimi',
    testNotificationBody: 'Bu bir test bildirimidir. Ses ve titreşim ayarlarınız çalışıyor!',
    // Sound type labels
    default: 'Varsayılan',
    success: 'Başarı',
    warning: 'Uyarı',
    urgent: 'Acil',
    message: 'Mesaj',
    reservation: 'Rezervasyon',
    driver: 'Sürücü',
    payment: 'Ödeme',
  },
  EN: {
    notificationsNotSupported: 'Notifications Not Supported',
    browserNotSupported: 'Your browser does not support push notifications. Please use a modern browser.',
    notificationSettings: 'Notification Settings',
    manageSettings: 'Manage your push notifications, sound and vibration settings',
    permissionGranted: 'Granted',
    permissionDenied: 'Denied',
    permissionPending: 'Pending',
    pushNotifications: 'Push Notifications',
    notificationsOn: 'Notifications are on',
    getImportantUpdates: 'Get notifications for important updates',
    permissionDeniedMessage: 'Notification permission was denied. You need to enable permissions in browser settings.',
    notificationSound: 'Notification Sound',
    playSoundOnNotification: 'Play sound when notification arrives',
    soundVolume: 'Sound Volume',
    soundType: 'Sound Type',
    vibration: 'Vibration',
    vibrationOnNotification: 'Vibrate when notification arrives',
    activeForImportantRoles: '(Active for Admin/Driver)',
    testNotification: 'Test Notification',
    testSent: 'Test Sent',
    testNotificationSent: 'Test notification sent!',
    testNotificationTitle: '🔔 Test Notification',
    testNotificationBody: 'This is a test notification. Your sound and vibration settings are working!',
    // Sound type labels
    default: 'Default',
    success: 'Success',
    warning: 'Warning',
    urgent: 'Urgent',
    message: 'Message',
    reservation: 'Reservation',
    driver: 'Driver',
    payment: 'Payment',
  }
};

interface NotificationSettingsPanelProps {
  language?: NotificationLanguage;
}

export const NotificationSettingsPanel = ({ language = 'TR' }: NotificationSettingsPanelProps) => {
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();
  
  const { testSound, vibrate, isImportantRole } = useNotificationSound();
  
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isTesting, setIsTesting] = useState(false);

  // Translation helper
  const t = (key: string): string => {
    return translations[language]?.[key] || translations['EN'][key] || key;
  };

  const SOUND_TYPE_LABELS: Record<NotificationSoundType, string> = {
    default: t('default'),
    success: t('success'),
    warning: t('warning'),
    urgent: t('urgent'),
    message: t('message'),
    reservation: t('reservation'),
    driver: t('driver'),
    payment: t('payment')
  };

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Error loading notification settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    
    // Test sound
    if (settings.soundEnabled) {
      testSound(settings.soundType);
    }
    
    // Test vibration
    if (settings.vibrationEnabled) {
      vibrate();
    }
    
    // Show test notification if supported and subscribed
    if (isSupported && isSubscribed && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
          body: t('testNotificationBody'),
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'test-notification',
          requireInteraction: false
        };
        
        // Add vibrate if supported
        if (settings.vibrationEnabled) {
          (notificationOptions as any).vibrate = [200, 100, 200];
        }
        
        await registration.showNotification(t('testNotificationTitle'), notificationOptions);
      } catch (error) {
        console.error('Test notification error:', error);
      }
    }
    
    toast.success(t('testNotificationSent'));
    
    setTimeout(() => setIsTesting(false), 1000);
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">{t('permissionGranted')}</Badge>;
      case 'denied':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">{t('permissionDenied')}</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">{t('permissionPending')}</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            {t('notificationsNotSupported')}
          </CardTitle>
          <CardDescription>
            {t('browserNotSupported')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('notificationSettings')}
          </span>
          {getPermissionBadge()}
        </CardTitle>
        <CardDescription>
          {t('manageSettings')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notifications Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base">{t('pushNotifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {isSubscribed ? t('notificationsOn') : t('getImportantUpdates')}
              </p>
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleTogglePush}
            disabled={isLoading || permission === 'denied'}
          />
        </div>

        {permission === 'denied' && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">
              {t('permissionDeniedMessage')}
            </p>
          </div>
        )}

        {/* Sound Settings */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-base">{t('notificationSound')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('playSoundOnNotification')}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => saveSettings({ ...settings, soundEnabled: checked })}
            />
          </div>

          {settings.soundEnabled && (
            <>
              {/* Volume Slider */}
              <div className="space-y-2 pl-8">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">{t('soundVolume')}</Label>
                  <span className="text-sm font-medium">{Math.round(settings.volume * 100)}%</span>
                </div>
                <Slider
                  value={[settings.volume * 100]}
                  onValueChange={([value]) => saveSettings({ ...settings, volume: value / 100 })}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Sound Type Selector */}
              <div className="space-y-2 pl-8">
                <Label className="text-sm text-muted-foreground">{t('soundType')}</Label>
                <Select
                  value={settings.soundType}
                  onValueChange={(value: NotificationSoundType) => {
                    saveSettings({ ...settings, soundType: value });
                    testSound(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('soundType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOUND_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Vibration Settings */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-3">
            <Vibrate className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base">{t('vibration')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('vibrationOnNotification')}
                {isImportantRole && <span className="text-primary"> {t('activeForImportantRoles')}</span>}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.vibrationEnabled}
            onCheckedChange={(checked) => saveSettings({ ...settings, vibrationEnabled: checked })}
          />
        </div>

        {/* Test Button */}
        <div className="pt-4 border-t">
          <Button 
            onClick={handleTestNotification}
            disabled={isTesting}
            variant="outline"
            className="w-full gap-2"
          >
            {isTesting ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                {t('testSent')}
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4" />
                {t('testNotification')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
