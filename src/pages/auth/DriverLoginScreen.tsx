import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoginRateLimit } from '@/hooks/useLoginRateLimit';
import { useTwoFactorAuth } from '@/hooks/useTwoFactorAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { ArrowLeft, Loader2, Car, KeyRound, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import TwoFactorVerification from '@/components/auth/TwoFactorVerification';
import { safeLocalGet, safeLocalRemove, safeLocalSet } from '@/lib/safeStorage';
import { clearSuppressAuthRedirect, setSuppressAuthRedirect } from '@/lib/authRedirectGuard';

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
});

// Same strength as LoginScreen to avoid Supabase "weak/pwned" rejections
const newPasswordSchema = z.object({
  password: z.string().min(6, 'En az 6 karakter').max(100),
  confirmPassword: z.string().min(6, 'En az 6 karakter').max(100),
}).refine((d) => d.password === d.confirmPassword, { message: 'Şifreler eşleşmiyor', path: ['confirmPassword'] });

type ViewMode = 'login' | 'reset' | '2fa' | 'set-password';

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
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { t, language } = useLanguage();
  const { rateLimitStatus, checkRateLimit, logLoginAttempt, formatLockoutTime } = useLoginRateLimit();
  const { 
    twoFactorState, 
    isLoading: is2FALoading, 
    error: twoFactorError, 
    initiate2FA, 
    verify2FA, 
    resendOTP, 
    cancel2FA,
    checkTrustedDevice,
    registerTrustedDevice,
    maxAttempts,
    remainingAttempts,
    otpSettings
  } = useTwoFactorAuth();
  const navigate = useNavigate();

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

  // Role-based redirect after login (only if not pending 2FA or set-password recovery)
  useEffect(() => {
    if (!isLoading && user && !roleLoading && role && viewMode !== '2fa' && viewMode !== 'set-password') {
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

  // Handle 2FA verification success
  const handle2FAVerify = async (code: string, rememberDevice: boolean = false) => {
    const result = await verify2FA(code);
    if (result.success && pendingRole) {
      // 2FA complete – allow global redirects again
      clearSuppressAuthRedirect();

      // If user chose to remember device, register it
      if (rememberDevice && twoFactorState.userId) {
        try {
          await registerTrustedDevice(twoFactorState.userId);
          console.log('Device registered as trusted');
        } catch (e) {
          console.error('Failed to register trusted device:', e);
        }
      }

      // Log successful login attempt
      const userEmail = result.email || twoFactorState.email || '';
      await logLoginAttempt(userEmail, true, undefined, undefined, pendingRole);
      
      toast.success(language === 'TR' ? 'Doğrulama başarılı! Giriş yapılıyor...' : 'Verification successful! Signing in...');
      
      // Try auto-login with the magic link token
      if (result.autoLogin && result.tokenHash) {
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: result.tokenHash,
            type: 'magiclink',
          });

          if (verifyError) {
            console.error('Auto-login failed:', verifyError);
          }
        } catch (e) {
          console.error('Auto-login error:', e);
        }
      }
      
      // Navigate to the appropriate page
      setTimeout(() => {
        switch (pendingRole) {
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
      }, 500);
    }
  };

  // Handle 2FA cancel
  const handle2FACancel = async () => {
    // User aborted 2FA – allow redirects again
    clearSuppressAuthRedirect();

    cancel2FA();
    setPendingRole(null);
    setViewMode('login');
    await supabase.auth.signOut();
  };

  // If already logged in, show loading (skip when in recovery set-password flow)
  if (authLoading || (user && roleLoading && viewMode !== '2fa' && viewMode !== 'set-password')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // We sometimes sign in briefly (to validate password) and then sign out again to enforce 2FA.
    // During that window, AuthContext must NOT auto-redirect away from this screen.
    let keepRedirectSuppressed = false;

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const validation = loginSchema.parse({ email: email.trim(), password });
      
      // Check rate limit before attempting login
      const rateLimit = await checkRateLimit(validation.email);
      if (rateLimit.locked) {
        toast.error(`Hesabınız geçici olarak kilitlendi. ${formatLockoutTime(rateLimit.remainingSeconds || 0)} sonra tekrar deneyin.`);
        setIsLoading(false);
        return;
      }
      
      // Save or clear email based on remember me
      if (rememberMe) {
        safeLocalSet('driverRememberMe', 'true');
        safeLocalSet('driverSavedEmail', validation.email);
      } else {
        safeLocalRemove('driverRememberMe');
        safeLocalRemove('driverSavedEmail');
      }

      // Prevent global auth redirect racing our 2FA flow
      setSuppressAuthRedirect();

      // Use supabase directly to get the user data for 2FA check
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: validation.email,
        password: validation.password,
      });
      
      if (error) {
        await logLoginAttempt(validation.email, false, error.message, undefined, 'driver');
        
        if (error.message?.includes('Invalid login credentials')) {
          // Check if failed attempts require 2FA verification
          const updatedRateLimit = await checkRateLimit(validation.email);
          const failedAttempts = updatedRateLimit.failedAttempts || 0;
          
          // After 2+ failed attempts, require 2FA on next successful login
          if (failedAttempts >= 2) {
            safeLocalSet(`require2FA_${validation.email}`, 'true');
          }
          
          setErrors({ password: t('invalidCredentials') || 'Invalid email or password' });
        } else if (error.message?.includes('Email not confirmed')) {
          toast.error(t('emailNotConfirmed') || 'Please confirm your email first');
        } else if (error.message?.includes('Too many requests')) {
          toast.error(t('tooManyRequests') || 'Too many login attempts. Please try again later.');
        } else {
          toast.error(error.message || t('loginFailed') || 'Login failed');
        }
      } else if (authData?.user) {
        // Check user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();
        
        const userRole = roleData?.role || 'driver';
        
        // Verify this is actually a driver account
        if (userRole !== 'driver') {
          toast.error(language === 'TR' ? 'Bu hesap bir sürücü hesabı değil' : 'This is not a driver account');
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }
        
        // Check if 2FA is required due to previous failed attempts
        const require2FAKey = `require2FA_${validation.email}`;
        const require2FADueToFailedAttempts = safeLocalGet(require2FAKey) === 'true';
        
        // Check if device is trusted
        const isTrusted = await checkTrustedDevice(authData.user.id);
        
        // Require 2FA if: device not trusted OR there were failed login attempts
        if (!isTrusted || require2FADueToFailedAttempts) {
          keepRedirectSuppressed = true;

          // IMPORTANT: Switch UI to 2FA immediately to avoid redirect race conditions
          setPendingRole(userRole);
          setViewMode('2fa');

          // Sign out temporarily - user needs to verify via 2FA
          await supabase.auth.signOut();

          // Device not trusted or suspicious activity - require 2FA
          const langCode = language === 'TR' ? 'tr' : 'en';
          const result = await initiate2FA(authData.user.id, validation.email, userRole, langCode);

          if (result.success) {
            toast.info(language === 'TR' ? 'Doğrulama kodu email adresinize gönderildi' : 'Verification code sent to your email');
            // Clear the flag after initiating 2FA
            safeLocalRemove(require2FAKey);
          } else {
            toast.error(result.error || (language === 'TR' ? 'Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.' : 'Failed to send verification code. Please try again.'));
            setPendingRole(null);
            setViewMode('login');
            keepRedirectSuppressed = false;
          }
        } else {
          // Device trusted and no suspicious activity - proceed with login
          await logLoginAttempt(validation.email, true, undefined, undefined, userRole);
        }
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
        console.error('Login error:', error);
        toast.error(t('loginFailed') || 'Login failed. Please try again.');
      }
    } finally {
      if (!keepRedirectSuppressed) {
        clearSuppressAuthRedirect();
      }
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
      let { data: { session: currentSession } } = await supabase.auth.getSession();
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
      toast.success(language === 'TR' ? 'Şifre güncellendi. Giriş yapabilirsiniz.' : 'Password updated. You can sign in.');
      await signOut();
      window.history.replaceState(null, '', '/login/driver');
      setNewPasswordValue('');
      navigate('/login/driver', { replace: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((er) => {
          const p = er.path[0]?.toString();
          if (p) fieldErrors[p] = er.message;
        });
        setErrors(fieldErrors);
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

  // 2FA verification screen
  if (viewMode === '2fa') {
    return (
      <div className="min-h-screen flex flex-col bg-secondary">
        <header className="sticky top-0 z-50 bg-card border-b border-border safe-area-header">
          <div className="flex items-center h-14 px-4">
            <button 
              onClick={handle2FACancel} 
              className="flex items-center gap-2 text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">{t("back") || "Geri"}</span>
            </button>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4 py-8">
          <TwoFactorVerification
            email={twoFactorState.email || ''}
            role={twoFactorState.role || 'driver'}
            isLoading={is2FALoading}
            error={twoFactorError}
            onVerify={handle2FAVerify}
            onResend={resendOTP}
            onCancel={handle2FACancel}
            maxAttempts={maxAttempts}
            remainingAttempts={remainingAttempts}
            otpLength={otpSettings.otpLength}
            expiryMinutes={otpSettings.expiryMinutes}
            trustedDeviceDays={otpSettings.trustedDeviceDays}
          />
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
