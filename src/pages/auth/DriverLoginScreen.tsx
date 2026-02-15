import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { primeUserRoleCache, useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoginRateLimit } from '@/hooks/useLoginRateLimit';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { ArrowLeft, Loader2, Car, KeyRound, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { safeLocalGet, safeLocalRemove, safeLocalSet } from '@/lib/safeStorage';
import { normalizePasswordInput } from '@/lib/normalizePasswordInput';
import { prefetchDriverBootstrap } from '@/lib/driverBootstrapCache';
import { useStorageAvailable } from '@/hooks/useStorageAvailable';
import { usePWADetect } from '@/hooks/usePWADetect';
import { isIOSDevice } from '@/lib/platformDetect';
import { useTwoFactorAuth } from '@/hooks/useTwoFactorAuth';

// Şoförler için 2FA yok - sadece şifre ile giriş
const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
});

// SignupScreen ile aynı güç - Supabase weak/pwned reddini önlemek için (1 büyük, 1 küçük, 4 rakam)
const newPasswordSchema = z.object({
  password: z.string()
    .min(6, 'En az 6 karakter')
    .max(100)
    .regex(/[A-Z]/, 'En az 1 büyük harf gerekli')
    .regex(/[a-z]/, 'En az 1 küçük harf gerekli')
    .regex(/\d.*\d.*\d.*\d/, 'En az 4 rakam gerekli'),
  confirmPassword: z.string().min(6).max(100),
}).refine((d) => d.password === d.confirmPassword, { message: 'Şifreler eşleşmiyor', path: ['confirmPassword'] });

type ViewMode = 'login' | 'reset' | 'set-password';

const DriverLoginScreen = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return safeLocalGet('driverRememberMe') === 'true';
  });
  const [savedEmail, setSavedEmail] = useState(() => {
    return safeLocalGet('driverSavedEmail') || '';
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { t, language } = useLanguage();
  const { rateLimitStatus, checkRateLimit, logLoginAttempt, formatLockoutTime } = useLoginRateLimit();
  const navigate = useNavigate();
  const { available: storageAvailable, checked: storageChecked } = useStorageAvailable();
  const { isIOS, isStandalone } = usePWADetect();
  const { registerTrustedDevice } = useTwoFactorAuth();
  const warmDriverChunks = useCallback(() => {
    void import('../driver/DriverHome');
    void import('../driver/DriverJobList');
    void import('../../components/driver/DriverLayout');
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(warmDriverChunks, 200);
    return () => window.clearTimeout(timer);
  }, [warmDriverChunks]);

  // OAuth role_mismatch: Google ile sürücü olmayan hesap girişi denendi
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'role_mismatch') {
      toast.error(language === 'TR'
        ? 'Bu hesap bir sürücü hesabı değil. Sürücü girişi için e-posta ve şifre kullanın.'
        : 'This is not a driver account. Use email and password for driver login.');
      window.history.replaceState(null, '', '/login/driver');
    }
  }, [searchParams, language]);

  // Lockout countdown timer
  useEffect(() => {
    if (rateLimitStatus.locked && rateLimitStatus.remainingSeconds) {
      setLockoutCountdown(rateLimitStatus.remainingSeconds);
      const interval = setInterval(() => {
        setLockoutCountdown(prev => {
          if (prev && prev > 1) return prev - 1;
          return null;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [rateLimitStatus.locked, rateLimitStatus.remainingSeconds]);

  // Role-based redirect after login (only if not in set-password recovery)
  useEffect(() => {
    if (!isLoading && user && !roleLoading && role && viewMode !== 'set-password') {
      switch (role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'driver':
          navigate('/driver', { replace: true });
          break;
        case 'agency':
          navigate('/agency', { replace: true });
          break;
        default:
          navigate('/customer', { replace: true });
      }
    }
  }, [isLoading, user, role, roleLoading, navigate, viewMode]);

  // Handle recovery link: token_hash or code → verify session → show set-password form
  useEffect(() => {
    const type = searchParams.get('type');
    if (type !== 'recovery' || recoveryChecked) return;

    const run = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams((url.hash || '').replace(/^#/, ''));
      const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash') || hashParams.get('token');
      const code = searchParams.get('code') || hashParams.get('code');
      const hasAccessToken = hashParams.get('access_token');

      if (tokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
        if (error) {
          toast.error(language === 'TR' ? 'Bağlantı süresi dolmuş veya geçersiz. Yeni bir şifre sıfırlama bağlantısı isteyin.' : 'Recovery link expired or invalid. Request a new one.');
          window.history.replaceState(null, '', '/login/driver');
          setRecoveryChecked(true);
          return;
        }
        if (data?.session) {
          window.history.replaceState(null, '', '/login/driver?type=recovery');
          setViewMode('set-password');
        }
        setRecoveryChecked(true);
        return;
      }

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast.error(language === 'TR' ? 'Bağlantı süresi dolmuş veya geçersiz.' : 'Recovery link expired or invalid.');
          window.history.replaceState(null, '', '/login/driver');
          setRecoveryChecked(true);
          return;
        }
        if (data?.session) {
          window.history.replaceState(null, '', '/login/driver?type=recovery');
          setViewMode('set-password');
        }
        setRecoveryChecked(true);
        return;
      }

      if (hasAccessToken) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.history.replaceState(null, '', '/login/driver?type=recovery');
          setViewMode('set-password');
        }
      }
      setRecoveryChecked(true);
    };
    run();
  }, [searchParams, language, recoveryChecked]);

  // If already logged in, show loading (skip when in recovery set-password flow)
  if (authLoading || (user && roleLoading && viewMode !== 'set-password')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const isDriverAccount = async (
    userId: string,
    accessToken?: string
  ): Promise<{ isDriver: boolean; driverId: string | null }> => {
    // 1) Primary path: edge function (RLS bypass)
    if (accessToken) {
      const { data } = await supabase.functions.invoke('get-user-role', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (data?.success && data?.role === 'driver') {
        return { isDriver: true, driverId: data.driverId ?? null };
      }
    }

    // 2) Fallbacks in parallel for speed.
    const [{ data: roleRows }, { data: driverRow }] = await Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId),
      supabase
        .from('drivers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const roles = (roleRows ?? []).map((r) => r.role);
    if (roles.includes('driver')) {
      return { isDriver: true, driverId: driverRow?.id ?? null };
    }

    return { isDriver: !!driverRow?.id, driverId: driverRow?.id ?? null };
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim() || '';
    const rawPassword = formData.get('password') as string;
    // iOS klavyesi alternatif rakam karakterleri girebilir - normalize et (Android/iOS arası uyumluluk)
    const password = normalizePasswordInput(rawPassword || '');

    try {
      const validation = loginSchema.parse({ email, password });

      // Check rate limit before attempting login
      let rateLimit;
      try {
        rateLimit = await checkRateLimit(validation.email);
      } catch (rlErr) {
        console.warn('[DriverLogin] Rate limit check failed:', rlErr);
        rateLimit = { locked: false };
      }
      if (rateLimit.locked) {
        toast.error(`Hesabınız geçici olarak kilitlendi. ${formatLockoutTime(rateLimit.remainingSeconds || 0)} sonra tekrar deneyin.`);
        setIsLoading(false);
        return;
      }

      // Save or clear email based on remember me
      try {
        if (rememberMe) {
          safeLocalSet('driverRememberMe', 'true');
          safeLocalSet('driverSavedEmail', validation.email);
        } else {
          safeLocalRemove('driverRememberMe');
          safeLocalRemove('driverSavedEmail');
        }
      } catch {
        // Storage yazma hatası (iOS gizli mod vb.) - devam et
      }

      // Şoför girişi - 2FA yok
      let authData: { user: { id: string }; session: { access_token: string } } | null = null;
      let authError: { message?: string } | null = null;

      try {
        const result = await supabase.auth.signInWithPassword({
          email: validation.email,
          password: validation.password,
        });
        authError = result.error;
        authData = result.data as typeof authData;
      } catch (authErr) {
        console.error('[DriverLogin] signInWithPassword unhandled rejection:', authErr);
        toast.error(t('loginFailed') || 'Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      if (authError) {
        await logLoginAttempt(validation.email, false, authError.message, undefined, 'driver').catch(
          () => {}
        );

        if (authError.message?.includes('Invalid login credentials')) {
          setErrors({ password: t('invalidCredentials') || 'Invalid email or password' });
        } else if (authError.message?.includes('Email not confirmed')) {
          toast.error(t('emailNotConfirmed') || 'Please confirm your email first');
        } else if (authError.message?.includes('Too many requests')) {
          toast.error(t('tooManyRequests') || 'Too many login attempts. Please try again later.');
        } else {
          toast.error(authError.message || t('loginFailed') || 'Login failed');
        }
        return;
      }

      if (authData?.user && authData?.session) {
        let roleCheck: { isDriver: boolean; driverId: string | null };
        try {
          roleCheck = await isDriverAccount(
            authData.user.id,
            authData.session.access_token
          );
        } catch (roleErr) {
          console.error('[DriverLogin] isDriverAccount failed:', roleErr);
          toast.error(t('loginFailed') || 'Login failed. Please try again.');
          setIsLoading(false);
          return;
        }

        if (!roleCheck.isDriver) {
          toast.error(language === 'TR' ? 'Bu hesap bir sürücü hesabı değil' : 'This is not a driver account');
          await supabase.auth.signOut().catch(() => {});
          setIsLoading(false);
          return;
        }

        void logLoginAttempt(validation.email, true, undefined, undefined, 'driver').catch(() => {});
        primeUserRoleCache({
          userId: authData.user.id,
          role: 'driver',
          driverId: roleCheck.driverId,
          agencyId: null,
        });
        void prefetchDriverBootstrap(authData.user.id, roleCheck.driverId).catch(() => {});
        warmDriverChunks();
        registerTrustedDevice(authData.user.id).catch(() => {});

        // iOS Safari: Storage yazmasının tamamlanması için kısa gecikme (ITP/WebKit uyumluluğu)
        // window.location.replace hemen yapılırsa yeni sayfa yüklendiğinde session henüz storage'da olmayabilir
        if (isIOSDevice()) {
          await new Promise((r) => setTimeout(r, 150));
        }

        window.location.replace('/driver');
        return;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('[DriverLogin] Login error:', error);
        toast.error(t('loginFailed') || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error(t('emailRequired') || 'Email is required');
      return;
    }

    setIsResetLoading(true);
    
    try {
      const { error, data } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: resetEmail.trim(),
          redirect_url: `${window.location.origin}/login/driver?type=recovery`,
          language,
        },
      });
      
      if (error) {
        console.error('Reset password email invoke error (generic success fallback):', {
          message: error.message,
          name: error.name,
          status: (error as any).status,
          details: error,
        });

        const msg = (error.message || '').toLowerCase();
        const status = (error as any).status;

        if (msg.includes('rate limit') || status === 429) {
          toast.error(t('tooManyRequests') || t('resetFailed') || 'Too many requests. Please try again later.');
          return;
        }

        toast.success(t('resetEmailSent') || 'Password reset email sent! Check your inbox.');
        setViewMode('login');
        setResetEmail('');
        return;
      }

      console.log('Reset email sent successfully:', data);
      toast.success(t('resetEmailSent') || 'Password reset email sent! Check your inbox.');
      setViewMode('login');
      setResetEmail('');
    } catch (error) {
      console.error('Reset error:', error);
      toast.error(t('resetFailed') || 'Failed to send reset email');
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    try {
      const validation = newPasswordSchema.parse({ password, confirmPassword });
      let currentSession;
      try {
        const { data } = await supabase.auth.getSession();
        currentSession = data.session;
      } catch (sessionErr) {
        console.error('[DriverLogin] getSession failed:', sessionErr);
        toast.error(language === 'TR' ? 'Oturum alınamadı. Sayfayı yenileyip tekrar deneyin.' : 'Session error. Refresh and try again.');
        return;
      }
      if (!currentSession) {
        toast.error(language === 'TR' ? 'Oturum bulunamadı. Yeni bir şifre sıfırlama bağlantısı isteyin.' : 'Session missing. Request a new reset link.');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: validation.password });
      if (error) {
        if (error.message.toLowerCase().includes('weak') || error.message.toLowerCase().includes('easy to guess') || error.message.toLowerCase().includes('pwned')) {
          toast.error(language === 'TR' ? 'Bu şifre veri ihlallerinde bulundu. Daha benzersiz bir şifre seçin (örn. özel karakterler ekleyin).' : 'This password was found in data breaches. Choose a more unique password.');
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success(language === 'TR' ? 'Şifre güncellendi. Yönlendiriliyorsunuz...' : 'Password updated. Redirecting...');
      setNewPasswordValue('');
      try {
        await supabase.auth.refreshSession();
      } catch (refreshErr) {
        console.warn('[DriverLogin] refreshSession failed:', refreshErr);
      }
      // iOS Safari: Storage flush için kısa gecikme
      if (isIOSDevice()) {
        await new Promise((r) => setTimeout(r, 150));
      }
      window.location.replace('/driver');
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((er) => {
          const p = er.path[0]?.toString();
          if (p) fieldErrors[p] = er.message;
        });
        setErrors(fieldErrors);
      } else {
        console.error('[DriverLogin] handleSetNewPassword error:', err);
        toast.error(language === 'TR' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Set new password (after clicking recovery link in email)
  if (viewMode === 'set-password') {
    return (
      <div className="min-h-screen flex flex-col bg-secondary">
        <header className="sticky top-0 z-50 bg-card border-b border-border safe-area-header">
          <div className="flex items-center h-14 px-4">
            <span className="text-sm text-muted-foreground">{t('resetPassword') || 'Şifre Sıfırla'}</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4 py-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                <KeyRound className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-2xl font-serif">
                {language === 'TR' ? 'Yeni şifre belirleyin' : 'Set new password'}
              </CardTitle>
              <CardDescription>
                {language === 'TR' ? 'Yeni şifrenizi girin ve kaydedin.' : 'Enter and save your new password.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('newPassword') || 'Yeni şifre'}</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      name="password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      className="h-12 pr-12"
                      autoComplete="new-password"
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('confirmPassword') || 'Şifre tekrar'}</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      className="h-12 pr-12"
                      autoComplete="new-password"
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" variant="accent" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{language === 'TR' ? 'Kaydediliyor...' : 'Saving...'}</> : (language === 'TR' ? 'Kaydet ve giriş yap' : 'Save and sign in')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Password reset form
  if (viewMode === 'reset') {
    return (
      <div className="min-h-screen flex flex-col bg-secondary">
        <header className="sticky top-0 z-50 bg-card border-b border-border safe-area-header">
          <div className="flex items-center h-14 px-4">
            <button 
              onClick={() => setViewMode('login')} 
              className="flex items-center gap-2 text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">{t("back") || "Geri"}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 py-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                <KeyRound className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-serif">
                {t("resetPassword") || "Şifre Sıfırla"}
              </CardTitle>
              <CardDescription>
                {t("resetPasswordDescription") || "Şifre sıfırlama bağlantısı almak için email adresinizi girin"}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{t("email") || "Email"}</Label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="driver@email.com" 
                    required 
                    className="h-12"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  variant="accent"
                  className="w-full h-12 rounded-xl text-base font-medium" 
                  disabled={isResetLoading}
                >
                  {isResetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("sending") || "Gönderiliyor..."}
                    </>
                  ) : (
                    t("sendResetLink") || "Sıfırlama Bağlantısı Gönder"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {/* Header with iOS safe area support */}
      <header className="sticky top-0 z-50 bg-card border-b border-border safe-area-header">
        <div className="flex items-center h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">{t("back") || "Geri"}</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <Car className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-serif">
              {language === 'TR' ? 'Sürücü Girişi' : 'Driver Login'}
            </CardTitle>
            <CardDescription>
              {language === 'TR' ? 'Sürücü hesabınızla giriş yapın' : 'Sign in with your driver account'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <SocialAuthButtons disabled={isLoading || !!lockoutCountdown} mode="login" expectedRole="driver" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('or') || 'veya'}</span>
              </div>
            </div>
            {/* iOS/storage uyarısı - localStorage çalışmıyorsa (gizli mod vb.) */}
            {storageChecked && !storageAvailable && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  {language === 'TR'
                    ? 'Oturumunuz kaydedilemiyor. Gizli modu kapatın veya Safari ayarlarında "Çerezleri engelle"yi kapatıp tekrar deneyin.'
                    : 'Session cannot be saved. Disable private mode or turn off "Block Cookies" in Safari settings and try again.'}
                </p>
              </div>
            )}
            {/* iOS PWA ipucu */}
            {isIOS && isStandalone && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {language === 'TR'
                    ? 'Giriş sorunu yaşıyorsanız, Safari\'de siteyi açıp giriş yapmayı deneyin.'
                    : 'If you have login issues, try opening the site in Safari and signing in.'}
                </p>
              </div>
            )}
            {/* Lockout warning */}
            {lockoutCountdown && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                <p className="text-sm text-destructive font-medium">
                  {language === 'TR' 
                    ? `Hesabınız kilitli. ${formatLockoutTime(lockoutCountdown)} sonra tekrar deneyin.`
                    : `Account locked. Try again in ${formatLockoutTime(lockoutCountdown)}.`
                  }
                </p>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email") || "Email"}</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="driver@email.com" 
                  required 
                  className="h-12"
                  autoComplete="email"
                  defaultValue={savedEmail}
                  disabled={!!lockoutCountdown}
                />
                {errors.email && <p className="text-sm text-destructive">{t("invalidEmail") || errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t("password") || "Şifre"}</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="h-12"
                  autoComplete="current-password"
                  disabled={!!lockoutCountdown}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label 
                    htmlFor="remember" 
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    {t("rememberMe") || "Beni hatırla"}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('reset')}
                  className="text-sm text-accent hover:underline"
                >
                  {t("forgotPassword") || "Şifremi unuttum?"}
                </button>
              </div>
              
              <Button 
                type="submit" 
                variant="accent"
                className="w-full h-12 rounded-xl text-base font-medium" 
                disabled={isLoading || !!lockoutCountdown}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loggingIn") || "Giriş yapılıyor..."}
                  </>
                ) : (
                  t("login") || "Giriş Yap"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverLoginScreen;
