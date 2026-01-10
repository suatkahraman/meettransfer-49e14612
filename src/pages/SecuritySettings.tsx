import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Shield, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Trash2, 
  MapPin, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Laptop
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface TrustedDevice {
  id: string;
  device_fingerprint: string;
  device_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_used_at: string;
  created_at: string;
  is_active: boolean;
}

const SecuritySettings = () => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<TrustedDevice | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isTurkish = language === 'TR';
  
  const t = useMemo(() => ({
    title: isTurkish ? 'Güvenlik Ayarları' : 'Security Settings',
    trustedDevices: isTurkish ? 'Güvenilir Cihazlar' : 'Trusted Devices',
    trustedDevicesDesc: isTurkish 
      ? 'Bu cihazlardan giriş yaparken 2FA doğrulaması istenmez' 
      : 'You won\'t need 2FA verification when logging in from these devices',
    noDevices: isTurkish ? 'Henüz güvenilir cihaz yok' : 'No trusted devices yet',
    noDevicesDesc: isTurkish 
      ? 'Bir sonraki girişinizde 2FA doğrulamasını tamamladıktan sonra cihazınız otomatik olarak eklenecektir' 
      : 'Your device will be automatically added after completing 2FA verification on your next login',
    remove: isTurkish ? 'Kaldır' : 'Remove',
    removeDevice: isTurkish ? 'Cihazı Kaldır' : 'Remove Device',
    removeDeviceDesc: isTurkish 
      ? 'Bu cihazı güvenilir listeden kaldırmak istediğinize emin misiniz? Bu cihazdan bir sonraki girişinizde 2FA doğrulaması yapmanız gerekecektir.' 
      : 'Are you sure you want to remove this device from trusted list? You will need to complete 2FA verification on your next login from this device.',
    cancel: isTurkish ? 'İptal' : 'Cancel',
    confirm: isTurkish ? 'Kaldır' : 'Remove',
    deviceRemoved: isTurkish ? 'Cihaz kaldırıldı' : 'Device removed',
    error: isTurkish ? 'Bir hata oluştu' : 'An error occurred',
    back: isTurkish ? 'Geri' : 'Back',
    lastUsed: isTurkish ? 'Son kullanım' : 'Last used',
    addedOn: isTurkish ? 'Ekleme tarihi' : 'Added on',
    currentDevice: isTurkish ? 'Bu cihaz' : 'This device',
    location: isTurkish ? 'Konum' : 'Location',
    refresh: isTurkish ? 'Yenile' : 'Refresh',
    revokeAll: isTurkish ? 'Tümünü Kaldır' : 'Revoke All',
    revokeAllTitle: isTurkish ? 'Tüm Cihazları Kaldır' : 'Revoke All Devices',
    revokeAllDesc: isTurkish 
      ? 'Tüm güvenilir cihazları kaldırmak istediğinize emin misiniz? Tüm cihazlardan tekrar 2FA doğrulaması yapmanız gerekecektir.' 
      : 'Are you sure you want to revoke all trusted devices? You will need to complete 2FA verification from all devices.',
    allDevicesRevoked: isTurkish ? 'Tüm cihazlar kaldırıldı' : 'All devices revoked',
    securityTip: isTurkish 
      ? 'Güvenlik ipucu: Tanımadığınız cihazları hemen kaldırın' 
      : 'Security tip: Remove any devices you don\'t recognize',
    deviceCount: (count: number) => isTurkish 
      ? `${count} güvenilir cihaz` 
      : `${count} trusted device${count !== 1 ? 's' : ''}`,
  }), [isTurkish]);

  const dateLocale = language === 'TR' ? tr : enUS;

  // Generate current device fingerprint for comparison
  const currentDeviceFingerprint = useMemo(() => {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.languages?.join(',') || '',
      new Date().getTimezoneOffset().toString(),
      screen.width.toString(),
      screen.height.toString(),
      screen.colorDepth.toString(),
    ];
    const str = components.join('|');
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return hash.toString(36);
  }, []);

  const fetchDevices = useCallback(async (showRefreshToast = false) => {
    if (!user) return;
    
    if (showRefreshToast) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
      
      if (showRefreshToast) {
        toast.success(isTurkish ? 'Liste güncellendi' : 'List refreshed');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, t.error, isTurkish]);

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user, fetchDevices]);

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;

    setDeletingDeviceId(deviceToDelete.id);
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .update({ is_active: false })
        .eq('id', deviceToDelete.id);

      if (error) throw error;

      setDevices(prev => prev.filter(d => d.id !== deviceToDelete.id));
      toast.success(t.deviceRemoved);
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error(t.error);
    } finally {
      setDeletingDeviceId(null);
      setDeviceToDelete(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setDevices([]);
      toast.success(t.allDevicesRevoked);
    } catch (error) {
      console.error('Error revoking all devices:', error);
      toast.error(t.error);
    } finally {
      setShowRevokeAll(false);
    }
  };

  const getDeviceIcon = (userAgent: string | null, isCurrent: boolean) => {
    const iconClass = `h-5 w-5 ${isCurrent ? 'text-accent' : 'text-muted-foreground'}`;
    
    if (!userAgent) return <Monitor className={iconClass} />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('android') && ua.includes('mobile')) {
      return <Smartphone className={iconClass} />;
    }
    if (ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobile'))) {
      return <Tablet className={iconClass} />;
    }
    if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) {
      return <Laptop className={iconClass} />;
    }
    return <Monitor className={iconClass} />;
  };

  const getDeviceDisplayName = (device: TrustedDevice) => {
    if (device.device_name && device.device_name !== 'Unknown Device') {
      return device.device_name;
    }
    
    const ua = device.user_agent?.toLowerCase() || '';
    
    // Extract browser
    let browser = 'Browser';
    if (ua.includes('edg/')) browser = 'Edge';
    else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
    else if (ua.includes('firefox/')) browser = 'Firefox';
    else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
    else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera';
    
    // Extract OS
    let os = '';
    if (ua.includes('iphone')) os = 'iPhone';
    else if (ua.includes('ipad')) os = 'iPad';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('mac os x') || ua.includes('macos')) os = 'macOS';
    else if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('linux')) os = 'Linux';
    
    return os ? `${browser} on ${os}` : browser;
  };

  const isCurrentDevice = useCallback((device: TrustedDevice) => {
    // Compare first part of fingerprint (before the timestamp)
    const deviceFpBase = device.device_fingerprint.split('-')[0];
    return deviceFpBase === currentDeviceFingerprint;
  }, [currentDeviceFingerprint]);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <button 
            onClick={handleGoBack} 
            className="flex items-center gap-2 text-foreground hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">{t.back}</span>
          </button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchDevices(true)}
            disabled={isRefreshing}
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto p-4 py-6 space-y-6">
        {/* Page Title */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="p-2.5 rounded-full bg-accent/10">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-semibold">{t.title}</h1>
            {devices.length > 0 && (
              <p className="text-sm text-muted-foreground">{t.deviceCount(devices.length)}</p>
            )}
          </div>
        </motion.div>

        {/* Security Tip */}
        {devices.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-sm"
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{t.securityTip}</span>
          </motion.div>
        )}

        {/* Trusted Devices Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  {t.trustedDevices}
                </CardTitle>
                <CardDescription>{t.trustedDevicesDesc}</CardDescription>
              </div>
              {devices.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRevokeAll(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {t.revokeAll}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : devices.length === 0 ? (
                <motion.div 
                  className="text-center py-10 space-y-4"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t.noDevices}</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                      {t.noDevicesDesc}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {devices.map((device, index) => {
                      const isCurrent = isCurrentDevice(device);
                      
                      return (
                        <motion.div 
                          key={device.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-start gap-4 p-4 border rounded-xl transition-all ${
                            isCurrent 
                              ? 'bg-accent/5 border-accent/30 shadow-sm' 
                              : 'hover:bg-muted/50 hover:border-border/80'
                          }`}
                        >
                          {/* Device Icon */}
                          <div className={`p-2.5 rounded-full ${
                            isCurrent ? 'bg-accent/15' : 'bg-muted'
                          }`}>
                            {getDeviceIcon(device.user_agent, isCurrent)}
                          </div>
                          
                          {/* Device Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium truncate">
                                {getDeviceDisplayName(device)}
                              </span>
                              {isCurrent && (
                                <Badge 
                                  variant="secondary" 
                                  className="bg-accent/10 text-accent border-0 text-xs shrink-0"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {t.currentDevice}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-1.5 text-sm text-muted-foreground">
                              {device.ip_address && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">IP: {device.ip_address}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  {t.lastUsed}: {formatDistanceToNow(new Date(device.last_used_at), { 
                                    addSuffix: true, 
                                    locale: dateLocale 
                                  })}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground/70">
                                {t.addedOn}: {format(new Date(device.created_at), 'PPP', { locale: dateLocale })}
                              </div>
                            </div>
                          </div>
                          
                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => setDeviceToDelete(device)}
                            disabled={deletingDeviceId === device.id}
                          >
                            {deletingDeviceId === device.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Single Device Dialog */}
      <AlertDialog open={!!deviceToDelete} onOpenChange={() => setDeviceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              {t.removeDevice}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.removeDeviceDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDevice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Devices Dialog */}
      <AlertDialog open={showRevokeAll} onOpenChange={setShowRevokeAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              {t.revokeAllTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.revokeAllDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.revokeAll}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SecuritySettings;
