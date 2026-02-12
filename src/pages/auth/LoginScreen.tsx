import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { usePWADetect } from '@/hooks/usePWADetect';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoginRateLimit } from '@/hooks/useLoginRateLimit';
import { useTwoFactorAuth } from '@/hooks/useTwoFactorAuth';
import { supabase } from '@/integrations/supabase/client';
import { startOAuthSignIn } from '@/lib/oauthSignIn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Mail, CheckCircle, AlertCircle, Share2, Check, ShieldAlert, Eye, EyeOff, User, Car, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthLanguageSelector from '@/components/auth/AuthLanguageSelector';
import TwoFactorVerification from '@/components/auth/TwoFactorVerification';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';
import { scrollToFirstError } from '@/lib/formValidation';
import { safeLocalGet, safeLocalRemove, safeLocalSet } from '@/lib/safeStorage';
import { clearSuppressAuthRedirect, setSuppressAuthRedirect } from '@/lib/authRedirectGuard';



const stripQueryParam = (key: string) => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete(key);
    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + (url.hash || '');
    window.history.replaceState(null, '', next);
  } catch {
    // ignore
  }
};

// Password format: 1 uppercase, 1 lowercase, at least 4 digits (e.g., Ab2215)
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(100)
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/\d.*\d.*\d.*\d/, 'Password must contain at least 4 digits');

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const resetEmailSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
});

const newPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ViewMode = 'login' | 'forgot' | 'reset' | 'reset-sent' | '2fa';
type LoginSection = 'customer' | 'driver' | 'agency';

const LoginScreen = () => {
  const isResetting = typeof window !== 'undefined' && window.location.href.includes('type=recovery');
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get('role') as LoginSection | null;
  const [loginSection, setLoginSection] = useState<LoginSection | null>(() => {
    if (roleParam && ['customer', 'driver', 'agency'].includes(roleParam)) return roleParam;
    return null;
  });
  useEffect(() => {
    if (roleParam && ['customer', 'driver', 'agency'].includes(roleParam)) setLoginSection(roleParam);
  }, [roleParam]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (typeof window !== 'undefined' && window.location.href.includes('type=recovery')) ? 'reset' : 'login'
  );
  const [resetEmail, setResetEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return safeLocalGet('guestRememberMe') === 'true';
  });
  const [savedEmail] = useState(() => {
    return safeLocalGet('guestSavedEmail') || '';
  });
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const { signIn, signOut, user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { isIOS, isStandalone } = usePWADetect();
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

  const handleShare = async () => {
    const shareUrl = window.location.origin + '/login';
    const shareText = t('guestLoginShareText');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meet Transfer - Login',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink(shareUrl);
        }
      }
    } else {
      handleCopyLink(shareUrl);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t('linkCopied'));
    setTimeout(() => setCopied(false), 2000);
  };


  // Check if returning from password reset email and exchange token/code for session
  useEffect(() => {
    const checkRecoverySession = async () => {
      const type = searchParams.get('type');
      if (type !== 'recovery') return;
      
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      const code = url.searchParams.get('code') || hashParams.get('code');
      const hasAccessToken = hashParams.get('access_token');
      const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash') || hashParams.get('token');
      
      // Direct token_hash flow: verify via verifyOtp (bypasses Supabase redirect allowlist)
      if (tokenHash) {
        console.log('[LoginScreen] Recovery token_hash detected, verifying via verifyOtp...');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        if (error) {
          console.error('[LoginScreen] verifyOtp failed:', error);
          toast.error(language === 'TR' 
            ? 'Bağlantı süresi dolmuş veya geçersiz. Lütfen yeni bir şifre sıfırlama bağlantısı isteyin.'
            : 'Recovery link expired or invalid. Please request a new one.');
          window.history.replaceState(null, '', '/login');
          return;
        }
        if (data?.session) {
          console.log('[LoginScreen] Session established from token_hash verifyOtp');
          window.history.replaceState(null, '', '/login?type=recovery');
          setViewMode('reset');
          return;
        }
      }

      // PKCE flow: exchange code for session
      if (code) {
        console.log('[LoginScreen] Recovery PKCE code detected, exchanging...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[LoginScreen] PKCE exchange failed:', error);
          toast.error(language === 'TR' 
            ? 'Bağlantı süresi dolmuş veya geçersiz. Lütfen yeni bir şifre sıfırlama bağlantısı isteyin.'
            : 'Recovery link expired or invalid. Please request a new one.');
          window.history.replaceState(null, '', '/login');
          return;
        }
        if (data?.session) {
          console.log('[LoginScreen] Session established from PKCE code');
          window.history.replaceState(null, '', '/login?type=recovery');
          setViewMode('reset');
          return;
        }
      }
      
      // Implicit flow: access_token in hash
      if (hasAccessToken) {
        console.log('[LoginScreen] Access token in hash, waiting for session...');
        const { data: { session: hashSession } } = await supabase.auth.getSession();
        if (hashSession) {
          console.log('[LoginScreen] Session from hash token established');
          window.history.replaceState(null, '', '/login?type=recovery');
          setViewMode('reset');
          return;
        }
      }
      
      // No code/token but type=recovery - check existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        setViewMode('reset');
      } else {
        toast.error(language === 'TR' 
          ? 'Oturum bulunamadı. Lütfen yeni bir şifre sıfırlama bağlantısı isteyin.'
          : 'Session not found. Please request a new password reset link.');
        window.history.replaceState(null, '', '/login');
      }
    };
    
    checkRecoverySession();
  }, [searchParams, language]);

  // Auto-trigger OAuth if redirected from PWA
  useEffect(() => {
    const oauthParam = searchParams.get('oauth');
    if (!oauthParam || user || authLoading) return;

    // NOTE: This MUST be wrapped in try/catch.
    // On iOS Safari/PWA, an unhandled rejection here can leave the app in a broken state.
    (async () => {
      try {
        const provider = oauthParam as 'google' | 'apple';

        // Use native Supabase OAuth via startOAuthSignIn
        const { error } = await startOAuthSignIn(provider);
        if (error) {
          console.error('[LoginScreen] OAuth auto-trigger error:', error);
          toast.error(t('loginFailed'));
          stripQueryParam('oauth');
        }
      } catch (err) {
        console.error('[LoginScreen] OAuth auto-trigger failed:', err);
        toast.error(t('loginFailed'));
        stripQueryParam('oauth');
      }
    })();
  }, [searchParams, user, authLoading, t]);

  useEffect(() => {
    if (isResetting) setViewMode('reset');
  }, [isResetting]);

  useEffect(() => {
    if (roleParam && ['customer', 'driver', 'agency'].includes(roleParam)) {
      setLoginSection(roleParam);
    }
  }, [roleParam]);

  // Role-based redirect – şifre sıfırlama (link tıklayıp yeni şifre formu) iken ASLA yönlendirme yapma
  useEffect(() => {
    if (isResetting) return;
    if (viewMode === 'reset') return; // Yeni şifre oluşturma ekranındayken panele gitme
    if (!isLoading && user && !roleLoading && role && viewMode !== '2fa') {
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
  }, [isResetting, isLoading, user, role, roleLoading, navigate, viewMode]);

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

      // Log successful login after 2FA
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
      
      // Tam sayfa yonlendirme - AuthContext/useUserRole senkronizasyonu icin
      const path = pendingRole === 'admin' ? '/admin' : pendingRole === 'agency' ? '/agency' : '/customer';
      window.location.replace(path);
    }
  };

  // Handle 2FA cancel - sign out and go back to login
  const handle2FACancel = async () => {
    // User aborted 2FA – allow redirects again
    clearSuppressAuthRedirect();

    cancel2FA();
    setPendingRole(null);
    setViewMode('login');
    await supabase.auth.signOut();
  };

  if (!isResetting && (authLoading || (user && roleLoading && viewMode !== '2fa'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const resolveUserRole = async (userId: string, accessToken?: string): Promise<string> => {
    if (accessToken) {
      const { data } = await supabase.functions.invoke('get-user-role', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (data?.success && data?.role) return data.role;
    }
    const { data: rolesData } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    const roles = (rolesData || []).map((r) => r.role);
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('driver')) return 'driver';
    if (roles.includes('agency')) return 'agency';
    if (roles.includes('customer')) return 'customer';
    const { data: driverRow } = await supabase.from('drivers').select('id').eq('user_id', userId).maybeSingle();
    if (driverRow?.id) return 'driver';
    const { data: agencyRow } = await supabase.from('agencies').select('id').eq('user_id', userId).maybeSingle();
    if (agencyRow?.id) return 'agency';
    return 'customer';
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    const expectedRole = loginSection || 'customer';

    // We sometimes sign in briefly (to validate password) and then sign out again to enforce 2FA.
    let keepRedirectSuppressed = false;

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const validation = loginSchema.parse({ email: email.trim(), password });
      
      const rateLimit = await checkRateLimit(validation.email);
      if (rateLimit.locked) {
        toast.error(`Hesabınız geçici olarak kilitlendi. ${formatLockoutTime(rateLimit.remainingSeconds || 0)} sonra tekrar deneyin.`);
        setIsLoading(false);
        return;
      }
      
      if (rememberMe) {
        safeLocalSet('guestRememberMe', 'true');
        safeLocalSet('guestSavedEmail', validation.email);
      } else {
        safeLocalRemove('guestRememberMe');
        safeLocalRemove('guestSavedEmail');
      }

      setSuppressAuthRedirect();
      
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: validation.email,
        password: validation.password,
      });
      
      if (error) {
        await logLoginAttempt(validation.email, false, error.message);
        if (error.message?.includes('Invalid login credentials')) {
          setErrors({ password: language === 'TR' ? 'Geçersiz email veya şifre' : 'Invalid email or password' });
        } else {
          toast.error(error.message);
        }
      } else if (authData?.user) {
        const userRole = await resolveUserRole(authData.user.id, authData?.session?.access_token);

        // Rol dogrulama - giris bolumuyle eslesmeli
        if (expectedRole === 'driver' && userRole !== 'driver') {
          await supabase.auth.signOut();
          toast.error(language === 'TR' ? 'Bu hesap bir sürücü hesabı değil. Sürücü girişi için doğru hesabı kullanın.' : 'This is not a driver account. Use the correct account for driver login.');
          setIsLoading(false);
          clearSuppressAuthRedirect();
          return;
        }
        if (expectedRole === 'agency' && userRole !== 'agency') {
          await supabase.auth.signOut();
          toast.error(language === 'TR' ? 'Bu hesap bir acenta hesabı değil. Acenta girişi için doğru hesabı kullanın.' : 'This is not an agency account. Use the correct account for agency login.');
          setIsLoading(false);
          clearSuppressAuthRedirect();
          return;
        }
        if (expectedRole === 'customer' && userRole !== 'customer') {
          await supabase.auth.signOut();
          const msg = userRole === 'admin'
            ? (language === 'TR' ? 'Admin girişi için /auth sayfasını kullanın.' : 'Use /auth for admin login.')
            : (language === 'TR' ? 'Bu hesap bir müşteri hesabı değil. Müşteri girişi için doğru hesabı kullanın.' : 'This is not a customer account. Use the correct account.');
          toast.error(msg);
          setIsLoading(false);
          clearSuppressAuthRedirect();
          return;
        }

        // Driver: 2FA yok, dogrudan panele - ayni cihaz 2. giris guvencesi
        if (userRole === 'driver' || expectedRole === 'driver') {
          await logLoginAttempt(validation.email, true, undefined, undefined, 'driver');
          registerTrustedDevice(authData.user.id).catch(() => {});
          clearSuppressAuthRedirect();
          await supabase.auth.refreshSession();
          await new Promise((r) => setTimeout(r, 150));
          window.location.replace('/driver');
          return;
        }

        // Customer/Agency: 2FA kontrolu
        const isTrusted = await checkTrustedDevice(authData.user.id);
        
        if (!isTrusted) {
          keepRedirectSuppressed = true;
          setPendingRole(userRole);
          setViewMode('2fa');
          await supabase.auth.signOut();
          const langCode = language === 'TR' ? 'tr' : 'en';
          const result = await initiate2FA(authData.user.id, validation.email, userRole, langCode);
          if (result.success) {
            toast.info(language === 'TR' ? 'Doğrulama kodu email adresinize gönderildi' : 'Verification code sent to your email');
          } else {
            toast.error(result.error || 'Doğrulama kodu gönderilemedi');
            setPendingRole(null);
            setViewMode('login');
            keepRedirectSuppressed = false;
          }
        } else {
          await logLoginAttempt(validation.email, true, undefined, undefined, userRole);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const errorFieldIds: string[] = [];
        error.errors.forEach((err) => {
          if (err.path[0]) {
            const fieldName = err.path[0].toString();
            fieldErrors[fieldName] = err.message;
            errorFieldIds.push(fieldName);
          }
        });
        setErrors(fieldErrors);
        // Scroll to first error field
        if (errorFieldIds.length > 0) {
          scrollToFirstError(errorFieldIds);
          toast.error(Object.values(fieldErrors)[0]);
        }
      }
    } finally {
      if (!keepRedirectSuppressed) {
        clearSuppressAuthRedirect();
      }
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      const validation = resetEmailSchema.parse({ email: email.trim() });
      
      const redirectUrl = `${window.location.origin}/login?type=recovery`;
      
      console.log('Sending reset email to:', validation.email);
      console.log('Redirect URL:', redirectUrl);
      
      // Use custom edge function that sends proper reset email with link
      const { error, data } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: validation.email,
          redirect_url: redirectUrl,
          language: language,
        },
      });

      if (error) {
        console.error('Password reset invoke error (generic success fallback):', {
          message: error.message,
          name: error.name,
          status: (error as any).status,
          details: error,
        });

        const msg = (error.message || '').toLowerCase();
        const status = (error as any).status;

        // Only surface rate limits; otherwise always show success (prevents enumeration + avoids false negatives)
        if (msg.includes('rate limit') || status === 429) {
          toast.error(t('tooManyRequests') || t('resetFailed'));
          return;
        }

        setResetEmail(validation.email);
        setViewMode('reset-sent');
        return;
      }

      console.log('Reset email sent successfully:', data);
      setResetEmail(validation.email);
      setViewMode('reset-sent');
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
        console.error('Unexpected error:', error);
        toast.error(t('resetFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    try {
      const validation = newPasswordSchema.parse({ password, confirmPassword });

      // Ensure we have a valid session. Some iOS flows can reach this screen before
      // the PKCE code is exchanged (or the `type` is only present in hash).
      let { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        const code = url.searchParams.get("code") || hashParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[LoginScreen] exchangeCodeForSession failed:', exchangeError);
          }
          const after = await supabase.auth.getSession();
          currentSession = after.data.session;
        }
      }

      if (!currentSession) {
        toast.error(
          language === 'TR'
            ? 'Oturum bulunamadı. Lütfen yeni bir şifre sıfırlama bağlantısı isteyin.'
            : 'Auth session missing. Please request a new reset link.'
        );
        return;
      }
      
      const { error } = await supabase.auth.updateUser({ 
        password: validation.password 
      });

      if (error) {
        if (error.message.toLowerCase().includes('weak') || error.message.toLowerCase().includes('easy to guess') || error.message.toLowerCase().includes('pwned')) {
          // Supabase leaked password check - provide helpful message
          toast.error(
            language === 'TR'
              ? 'Bu şifre veri ihlallerinde bulundu. Lütfen daha benzersiz bir şifre seçin (örn: @#$ gibi özel karakterler ekleyin).'
              : 'This password has been found in data breaches. Please choose a more unique password (e.g., add special characters like @#$).'
          );
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(language === 'TR' ? 'Şifre güncellendi. Yönlendiriliyorsunuz...' : 'Password updated. Redirecting...');
        await supabase.auth.refreshSession();
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        let path = '/customer';
        if (token) {
          const { data } = await supabase.functions.invoke('get-user-role', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (data?.success && data?.role) {
            const paths: Record<string, string> = {
              driver: '/driver', agency: '/agency', admin: '/admin', customer: '/customer',
            };
            path = paths[data.role as string] ?? '/customer';
          }
        }
        window.location.replace(path);
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
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show iOS PWA warning
  const showIOSWarning = isIOS && isStandalone;

  const renderContent = () => {
    switch (viewMode) {
      case '2fa':
        return (
          <TwoFactorVerification
            email={twoFactorState.email || ''}
            role={twoFactorState.role || 'customer'}
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
        );

      case 'forgot':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl md:text-3xl font-serif">{t('resetPassword')}</CardTitle>
              <CardDescription>{t('resetPasswordDescription')}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    required 
                    className="h-12"
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <Button 
                  type="submit" 
                  variant="accent"
                  className="w-full h-12 rounded-xl text-base font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('sending')}
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      {t('sendResetLink')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setViewMode('login')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToLogin')}
              </Button>
            </CardFooter>
          </Card>
        );

      case 'reset-sent':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-serif">{t('checkYourEmail')}</CardTitle>
              <CardDescription>
                {t('resetLinkSent')}<br />
                <span className="font-medium text-foreground">{resetEmail}</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center text-sm text-muted-foreground">
              <p>{t('linkExpiresIn')}</p>
              <p className="mt-4">{t('didntReceiveEmail')}</p>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl" 
                onClick={() => setViewMode('forgot')}
              >
                {t('tryAgain')}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setViewMode('login')}
              >
                {t('backToLogin')}
              </Button>
            </CardFooter>
          </Card>
        );

      case 'reset':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl md:text-3xl font-serif">{t('setNewPassword')}</CardTitle>
              <CardDescription>{t('enterNewPassword')}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('newPassword')}</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      name="password" 
                      type={showNewPassword ? 'text' : 'password'} 
                      placeholder="Ab2215" 
                      required 
                      className="h-12 pr-12"
                      autoComplete="new-password"
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <PasswordStrengthIndicator 
                    password={newPasswordValue} 
                    language={language === 'TR' ? 'TR' : 'EN'} 
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      required 
                      className="h-12 pr-12"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                
                <Button 
                  type="submit" 
                  variant="accent"
                  className="w-full h-12 rounded-xl text-base font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('updatingPassword')}
                    </>
                  ) : (
                    t('updatePassword')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      default:
        // Rol secimi veya form gosterimi
        if (loginSection === null) {
          return (
            <Card className="w-full max-w-md">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl md:text-3xl font-serif">{t('welcomeBack')}</CardTitle>
                <CardDescription>{language === 'TR' ? 'Giriş yapmak için hesap türünü seçin' : 'Select account type to sign in'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showIOSWarning && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-600 dark:text-amber-400">{t('iosAppNotice')}</p>
                      <p className="text-muted-foreground mt-1">{t('iosGoogleLoginNotice')}</p>
                    </div>
                  </div>
                )}
                <SocialAuthButtons disabled={isLoading} mode="login" />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t('or')}</span>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Button type="button" variant="outline" className="h-12 w-full justify-start gap-3" onClick={() => setLoginSection('customer')}>
                    <User className="h-5 w-5" />
                    {language === 'TR' ? 'Müşteri Girişi' : 'Customer Login'}
                  </Button>
                  <Button type="button" variant="outline" className="h-12 w-full justify-start gap-3" onClick={() => setLoginSection('driver')}>
                    <Car className="h-5 w-5" />
                    {language === 'TR' ? 'Sürücü Girişi' : 'Driver Login'}
                  </Button>
                  <Button type="button" variant="outline" className="h-12 w-full justify-start gap-3" onClick={() => setLoginSection('agency')}>
                    <Building2 className="h-5 w-5" />
                    {language === 'TR' ? 'Acenta Girişi' : 'Agency Login'}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="text-center text-sm text-muted-foreground">{t('dontHaveAccount')}</div>
                <div className="flex gap-2 w-full">
                  <Link to="/signup/customer" className="flex-1">
                    <Button variant="outline" className="w-full h-12 rounded-xl">{t('guestRegistration')}</Button>
                  </Link>
                  <Link to="/signup/agency" className="flex-1">
                    <Button variant="secondary" className="w-full h-12 rounded-xl">{t('agencyRegistration')}</Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          );
        }
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="relative text-center space-y-2">
              <Button variant="ghost" size="sm" className="absolute left-0 top-0" onClick={() => setLoginSection(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('back')}
              </Button>
              <CardTitle className="text-2xl font-serif">
                {loginSection === 'customer' && (language === 'TR' ? 'Müşteri Girişi' : 'Customer Login')}
                {loginSection === 'driver' && (language === 'TR' ? 'Sürücü Girişi' : 'Driver Login')}
                {loginSection === 'agency' && (language === 'TR' ? 'Acenta Girişi' : 'Agency Login')}
              </CardTitle>
              <CardDescription>{t('signInToManage')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    defaultValue={savedEmail}
                    required 
                    className="h-12"
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('password')}</Label>
                    <button
                      type="button"
                      onClick={() => setViewMode('forgot')}
                      className="text-sm text-accent hover:underline"
                    >
                      {t('forgotPassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      required 
                      className="h-12 pr-12"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="rememberMe" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    {t('rememberMe')}
                  </Label>
                </div>
                
                <Button 
                  type="submit" 
                  variant="accent"
                  className="w-full h-12 rounded-xl text-base font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('loggingIn')}
                    </>
                  ) : (
                    t('login')
                  )}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              {(loginSection === 'driver' || loginSection === 'agency') && (
                <p className="text-center text-xs text-muted-foreground">
                  {loginSection === 'driver' ? (
                    <Link to="/login/driver" className="text-accent hover:underline">{language === 'TR' ? 'Sürücü giriş sayfası' : 'Driver login page'}</Link>
                  ) : (
                    <Link to="/login/agency" className="text-accent hover:underline">{language === 'TR' ? 'Acenta giriş sayfası' : 'Agency login page'}</Link>
                  )}
                </p>
              )}
              <div className="text-center text-sm text-muted-foreground">
                {t('dontHaveAccount')}
              </div>
              <div className="flex gap-2 w-full">
                <Link to="/signup/customer" className="flex-1">
                  <Button variant="outline" className="w-full h-12 rounded-xl">
                    {t('guestRegistration')}
                  </Button>
                </Link>
                <Link to="/signup/agency" className="flex-1">
                  <Button variant="secondary" className="w-full h-12 rounded-xl">
                    {t('agencyRegistration')}
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {/* Header with iOS safe area support */}
      <header className="sticky top-0 z-50 bg-card border-b border-border safe-area-header">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">{t('back')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <AuthLanguageSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-9 w-9"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Share2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default LoginScreen;