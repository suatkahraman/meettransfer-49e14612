import { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
  Laptop,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Info,
  Globe,
  Fingerprint,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, Locale } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import PasswordChangeCard from '@/components/security/PasswordChangeCard';

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

interface LoginAttempt {
  id: string;
  attempted_at: string;
  success: boolean;
  ip_address: string | null;
  failure_reason: string | null;
}

// Memoized Device Card Component
const DeviceCard = memo(({ 
  device, 
  isCurrent, 
  onDelete, 
  isDeleting,
  t,
  dateLocale,
  getDeviceIcon,
  getDeviceDisplayName
}: {
  device: TrustedDevice;
  isCurrent: boolean;
  onDelete: (device: TrustedDevice) => void;
  isDeleting: boolean;
  t: any;
  dateLocale: Locale;
  getDeviceIcon: (ua: string | null, current: boolean) => React.ReactNode;
  getDeviceDisplayName: (device: TrustedDevice) => string;
}) => (
  <motion.div 
    layout
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20, height: 0 }}
    className={`flex items-start gap-4 p-4 border rounded-xl transition-all ${
      isCurrent 
        ? 'bg-accent/5 border-accent/30 shadow-sm' 
        : 'hover:bg-muted/50 hover:border-border/80'
    }`}
  >
    <div className={`p-2.5 rounded-full ${isCurrent ? 'bg-accent/15' : 'bg-muted'}`}>
      {getDeviceIcon(device.user_agent, isCurrent)}
    </div>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="font-medium truncate">{getDeviceDisplayName(device)}</span>
        {isCurrent && (
          <Badge variant="secondary" className="bg-accent/10 text-accent border-0 text-xs shrink-0">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t.currentDevice}
          </Badge>
        )}
      </div>
      
      <div className="space-y-1.5 text-sm text-muted-foreground">
        {device.ip_address && (
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 shrink-0" />
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
    
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
      onClick={() => onDelete(device)}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  </motion.div>
));

DeviceCard.displayName = 'DeviceCard';

// Security Score Component
const SecurityScore = memo(({ 
  score, 
  label,
  tips 
}: { 
  score: number; 
  label: string;
  tips: string[];
}) => {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-2xl font-bold ${getScoreColor()}`}>{score}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getProgressColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {tips.length > 0 && (
        <div className="space-y-1">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

SecurityScore.displayName = 'SecurityScore';

const SecuritySettings = () => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<TrustedDevice | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isTogglingTwoFactor, setIsTogglingTwoFactor] = useState(false);
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
    securityScore: isTurkish ? 'Güvenlik Puanı' : 'Security Score',
    twoFactorAuth: isTurkish ? 'İki Faktörlü Doğrulama (2FA)' : 'Two-Factor Authentication (2FA)',
    twoFactorDesc: isTurkish 
      ? 'Her girişte e-posta ile doğrulama kodu gönderilir' 
      : 'A verification code will be sent to your email on each login',
    twoFactorEnabled: isTurkish ? '2FA Aktif' : '2FA Enabled',
    twoFactorDisabled: isTurkish ? '2FA Pasif' : '2FA Disabled',
    twoFactorToggleSuccess: isTurkish ? '2FA ayarı güncellendi' : '2FA setting updated',
    loginHistory: isTurkish ? 'Giriş Geçmişi' : 'Login History',
    loginHistoryDesc: isTurkish 
      ? 'Son giriş denemelerinizi görüntüleyin' 
      : 'View your recent login attempts',
    viewHistory: isTurkish ? 'Geçmişi Görüntüle' : 'View History',
    hideHistory: isTurkish ? 'Geçmişi Gizle' : 'Hide History',
    successful: isTurkish ? 'Başarılı' : 'Successful',
    failed: isTurkish ? 'Başarısız' : 'Failed',
    noLoginHistory: isTurkish ? 'Giriş geçmişi bulunamadı' : 'No login history found',
    enable2faTip: isTurkish ? '2FA\'yı etkinleştirerek güvenliğinizi artırın' : 'Enable 2FA to increase your security',
    addDeviceTip: isTurkish ? 'Güvenilir cihaz ekleyerek hızlı giriş yapın' : 'Add trusted devices for faster login',
    reviewDevicesTip: isTurkish ? 'Tanımadığınız cihazları kaldırın' : 'Remove devices you don\'t recognize',
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

  // Calculate security score
  const securityScore = useMemo(() => {
    let score = 0;
    const tips: string[] = [];

    // 2FA enabled: +40 points
    if (twoFactorEnabled) {
      score += 40;
    } else {
      tips.push(t.enable2faTip);
    }

    // Has trusted devices: +30 points
    if (devices.length > 0) {
      score += 30;
    } else {
      tips.push(t.addDeviceTip);
    }

    // Check for recent failed attempts
    const recentFailedAttempts = loginAttempts.filter(a => !a.success).length;
    if (recentFailedAttempts === 0) {
      score += 20;
    } else if (recentFailedAttempts <= 2) {
      score += 10;
    }

    // Device count reasonable (not too many): +10 points
    if (devices.length > 0 && devices.length <= 5) {
      score += 10;
    } else if (devices.length > 5) {
      tips.push(t.reviewDevicesTip);
    }

    return { score: Math.min(score, 100), tips };
  }, [twoFactorEnabled, devices.length, loginAttempts, t]);

  const fetchData = useCallback(async (showRefreshToast = false) => {
    if (!user) return;
    
    if (showRefreshToast) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      // Fetch all data in parallel
      const [devicesResult, attemptsResult, roleResult] = await Promise.all([
        supabase
          .from('trusted_devices')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('last_used_at', { ascending: false }),
        supabase
          .from('login_attempts')
          .select('id, attempted_at, success, ip_address, failure_reason')
          .eq('email', user.email)
          .order('attempted_at', { ascending: false })
          .limit(10),
        supabase
          .from('user_roles')
          .select('two_factor_enabled')
          .eq('user_id', user.id)
          .single()
      ]);

      if (devicesResult.data) {
        setDevices(devicesResult.data);
      }

      if (attemptsResult.data) {
        setLoginAttempts(attemptsResult.data);
      }

      if (roleResult.data) {
        setTwoFactorEnabled(roleResult.data.two_factor_enabled || false);
      }
      
      if (showRefreshToast) {
        toast.success(isTurkish ? 'Liste güncellendi' : 'List refreshed');
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, t.error, isTurkish]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleToggleTwoFactor = async () => {
    if (!user) return;
    
    setIsTogglingTwoFactor(true);
    try {
      const newValue = !twoFactorEnabled;
      const { error } = await supabase
        .from('user_roles')
        .update({ two_factor_enabled: newValue })
        .eq('user_id', user.id);

      if (error) throw error;

      setTwoFactorEnabled(newValue);
      toast.success(t.twoFactorToggleSuccess);
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      toast.error(t.error);
    } finally {
      setIsTogglingTwoFactor(false);
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

  const getDeviceIcon = useCallback((userAgent: string | null, isCurrent: boolean) => {
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
  }, []);

  const getDeviceDisplayName = useCallback((device: TrustedDevice) => {
    if (device.device_name && device.device_name !== 'Unknown Device') {
      return device.device_name;
    }
    
    const ua = device.user_agent?.toLowerCase() || '';
    
    let browser = 'Browser';
    if (ua.includes('edg/')) browser = 'Edge';
    else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
    else if (ua.includes('firefox/')) browser = 'Firefox';
    else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
    else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera';
    
    let os = '';
    if (ua.includes('iphone')) os = 'iPhone';
    else if (ua.includes('ipad')) os = 'iPad';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('mac os x') || ua.includes('macos')) os = 'macOS';
    else if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('linux')) os = 'Linux';
    
    return os ? `${browser} on ${os}` : browser;
  }, []);

  const isCurrentDevice = useCallback((device: TrustedDevice) => {
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
            onClick={() => fetchData(true)}
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

        {/* Security Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-accent" />
                {t.securityScore}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-20 ml-auto" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : (
                <SecurityScore 
                  score={securityScore.score} 
                  label={t.securityScore}
                  tips={securityScore.tips}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 2FA Toggle Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-accent" />
                {t.twoFactorAuth}
              </CardTitle>
              <CardDescription>{t.twoFactorDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {twoFactorEnabled ? (
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-0">
                      <Lock className="h-3 w-3 mr-1" />
                      {t.twoFactorEnabled}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      <EyeOff className="h-3 w-3 mr-1" />
                      {t.twoFactorDisabled}
                    </Badge>
                  )}
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleToggleTwoFactor}
                  disabled={isLoading || isTogglingTwoFactor}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Password Change Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <PasswordChangeCard isTurkish={isTurkish} />
        </motion.div>

        {/* Login History Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-accent" />
                    {t.loginHistory}
                  </CardTitle>
                  <CardDescription>{t.loginHistoryDesc}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLoginHistory(!showLoginHistory)}
                >
                  {showLoginHistory ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      {t.hideHistory}
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      {t.viewHistory}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <AnimatePresence>
              {showLoginHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0">
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : loginAttempts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t.noLoginHistory}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {loginAttempts.map((attempt) => (
                          <div 
                            key={attempt.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              attempt.success 
                                ? 'bg-green-500/5 border-green-500/20' 
                                : 'bg-red-500/5 border-red-500/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {attempt.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {attempt.success ? t.successful : t.failed}
                                </p>
                                {attempt.ip_address && (
                                  <p className="text-xs text-muted-foreground">
                                    IP: {attempt.ip_address}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(attempt.attempted_at), { 
                                addSuffix: true, 
                                locale: dateLocale 
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Security Tip */}
        {devices.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
          transition={{ delay: 0.25 }}
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
                    {devices.map((device) => (
                      <DeviceCard
                        key={device.id}
                        device={device}
                        isCurrent={isCurrentDevice(device)}
                        onDelete={setDeviceToDelete}
                        isDeleting={deletingDeviceId === device.id}
                        t={t}
                        dateLocale={dateLocale}
                        getDeviceIcon={getDeviceIcon}
                        getDeviceDisplayName={getDeviceDisplayName}
                      />
                    ))}
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
