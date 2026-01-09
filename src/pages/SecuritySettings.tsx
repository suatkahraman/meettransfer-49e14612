import { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

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
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<TrustedDevice | null>(null);
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = {
    title: language === 'TR' ? 'Güvenlik Ayarları' : 'Security Settings',
    trustedDevices: language === 'TR' ? 'Güvenilir Cihazlar' : 'Trusted Devices',
    trustedDevicesDesc: language === 'TR' 
      ? 'Bu cihazlardan giriş yaparken 2FA doğrulaması istenmez' 
      : 'You won\'t need 2FA verification when logging in from these devices',
    noDevices: language === 'TR' ? 'Henüz güvenilir cihaz yok' : 'No trusted devices yet',
    noDevicesDesc: language === 'TR' 
      ? 'Bir sonraki girişinizde 2FA doğrulamasını tamamladıktan sonra cihazınız otomatik olarak eklenecektir' 
      : 'Your device will be automatically added after completing 2FA verification on your next login',
    remove: language === 'TR' ? 'Kaldır' : 'Remove',
    removeDevice: language === 'TR' ? 'Cihazı Kaldır' : 'Remove Device',
    removeDeviceDesc: language === 'TR' 
      ? 'Bu cihazı güvenilir listeden kaldırmak istediğinize emin misiniz? Bu cihazdan bir sonraki girişinizde 2FA doğrulaması yapmanız gerekecektir.' 
      : 'Are you sure you want to remove this device from trusted list? You will need to complete 2FA verification on your next login from this device.',
    cancel: language === 'TR' ? 'İptal' : 'Cancel',
    confirm: language === 'TR' ? 'Kaldır' : 'Remove',
    deviceRemoved: language === 'TR' ? 'Cihaz kaldırıldı' : 'Device removed',
    error: language === 'TR' ? 'Bir hata oluştu' : 'An error occurred',
    back: language === 'TR' ? 'Geri' : 'Back',
    lastUsed: language === 'TR' ? 'Son kullanım' : 'Last used',
    addedOn: language === 'TR' ? 'Ekleme tarihi' : 'Added on',
    currentDevice: language === 'TR' ? 'Bu cihaz' : 'This device',
    location: language === 'TR' ? 'Konum' : 'Location',
  };

  const dateLocale = language === 'TR' ? tr : enUS;

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  const fetchDevices = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="h-5 w-5" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (ua.includes('ipad') || ua.includes('tablet')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceDisplayName = (device: TrustedDevice) => {
    if (device.device_name) return device.device_name;
    
    const ua = device.user_agent?.toLowerCase() || '';
    
    // Extract browser
    let browser = 'Unknown Browser';
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';
    
    // Extract OS
    let os = '';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    
    return os ? `${browser} on ${os}` : browser;
  };

  const isCurrentDevice = (device: TrustedDevice) => {
    // Generate current device fingerprint and compare
    const currentFingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`;
    const hash = currentFingerprint.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(16);
    
    return device.device_fingerprint === hash;
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center h-14 px-4">
          <button 
            onClick={handleGoBack} 
            className="flex items-center gap-2 text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">{t.back}</span>
          </button>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto p-4 py-6 space-y-6">
        {/* Page Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-accent/10">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-semibold">{t.title}</h1>
          </div>
        </div>

        {/* Trusted Devices Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.trustedDevices}</CardTitle>
            <CardDescription>{t.trustedDevicesDesc}</CardDescription>
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
              <div className="text-center py-8 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">{t.noDevices}</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {t.noDevicesDesc}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => {
                  const isCurrent = isCurrentDevice(device);
                  
                  return (
                    <div 
                      key={device.id} 
                      className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                        isCurrent ? 'bg-accent/5 border-accent/30' : 'hover:bg-muted/50'
                      }`}
                    >
                      {/* Device Icon */}
                      <div className={`p-2.5 rounded-full ${isCurrent ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                        {getDeviceIcon(device.user_agent)}
                      </div>
                      
                      {/* Device Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {getDeviceDisplayName(device)}
                          </span>
                          {isCurrent && (
                            <Badge variant="secondary" className="bg-accent/10 text-accent border-0 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {t.currentDevice}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {device.ip_address && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>IP: {device.ip_address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
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
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deviceToDelete} onOpenChange={() => setDeviceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.removeDevice}</AlertDialogTitle>
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
    </div>
  );
};

export default SecuritySettings;
