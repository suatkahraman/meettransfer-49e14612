import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { usePWADetect } from '@/hooks/usePWADetect';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoginRateLimit } from '@/hooks/useLoginRateLimit';
import { useTwoFactorAuth } from '@/hooks/useTwoFactorAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Mail, CheckCircle, AlertCircle, Share2, Check, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import AuthLanguageSelector from '@/components/auth/AuthLanguageSelector';
import TwoFactorVerification from '@/components/auth/TwoFactorVerification';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';

// Google Icon SVG component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

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

const LoginScreen = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('guestRememberMe') === 'true';
  });
  const [savedEmail] = useState(() => {
    return localStorage.getItem('guestSavedEmail') || '';
  });
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const { signIn, user, loading: authLoading } = useAuth();
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

  // Improved Google OAuth handler
  const handleGoogleLogin = useCallback(async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    
    try {
      const baseUrl = window.location.origin;
      const redirectTo = `${baseUrl}/login`;
      
      // For iOS PWA standalone mode, show a helpful message
      if (isIOS && isStandalone) {
        const authUrl = `${baseUrl}/login?oauth=google`;
        const opened = window.open(authUrl, '_blank');
        if (!opened) {
          setGoogleError(t('iosGoogleLoginNotice'));
          setIsGoogleLoading(false);
          return;
        }
        toast.info(t('redirectingGoogle'));
        setIsGoogleLoading(false);
        return;
      }

      // Standard OAuth flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        setGoogleError(error.message);
        toast.error(error.message);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      setGoogleError(t('loginFailed'));
      toast.error(t('loginFailed'));
    } finally {
      setIsGoogleLoading(false);
    }
  }, [isIOS, isStandalone, t]);

  // Check if returning from password reset email
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setViewMode('reset');
    }
  }, [searchParams]);

  // Auto-trigger OAuth if redirected from PWA
  useEffect(() => {
    const oauthParam = searchParams.get('oauth');
    if (oauthParam === 'google' && !user && !authLoading) {
      handleGoogleLogin();
    }
  }, [searchParams, user, authLoading, handleGoogleLogin]);

  // Role-based redirect after login (only if not pending 2FA)
  useEffect(() => {
    // During an active login attempt we must not auto-redirect, otherwise we can race
    // the 2FA flow and never show the OTP entry screen.
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
  }, [isLoading, user, role, roleLoading, navigate, viewMode]);

  // Handle 2FA verification success
  const handle2FAVerify = async (code: string, rememberDevice: boolean = false) => {
    const result = await verify2FA(code);
    if (result.success && pendingRole) {
      // 2FA complete – allow global redirects again
      localStorage.removeItem('suppress_auth_redirect');

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
      
      // Redirect based on role
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

  // Handle 2FA cancel - sign out and go back to login
  const handle2FACancel = async () => {
    // User aborted 2FA – allow redirects again
    localStorage.removeItem('suppress_auth_redirect');

    cancel2FA();
    setPendingRole(null);
    setViewMode('login');
    await supabase.auth.signOut();
  };

  // If already logged in, show loading
  if (authLoading || (user && roleLoading && viewMode !== '2fa')) {
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
      
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem('guestRememberMe', 'true');
        localStorage.setItem('guestSavedEmail', validation.email);
      } else {
        localStorage.removeItem('guestRememberMe');
        localStorage.removeItem('guestSavedEmail');
      }

      // Prevent global auth redirect racing our 2FA flow
      localStorage.setItem('suppress_auth_redirect', 'true');
      
      // Use supabase directly to get the user data for 2FA check
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: validation.email,
        password: validation.password,
      });
      
      if (error) {
        // Log failed login attempt
        await logLoginAttempt(validation.email, false, error.message);
        
        if (error.message?.includes('Invalid login credentials')) {
          // Check if failed attempts require 2FA verification
          const updatedRateLimit = await checkRateLimit(validation.email);
          const failedAttempts = updatedRateLimit.failedAttempts || 0;
          
          // After 2+ failed attempts, require 2FA on next successful login
          if (failedAttempts >= 2) {
            localStorage.setItem(`require2FA_${validation.email}`, 'true');
          }
          
          setErrors({ password: 'Geçersiz email veya şifre' });
        } else {
          toast.error(error.message);
        }
      } else if (authData?.user) {
        // Check user role to determine if 2FA is needed
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();
        
        const userRole = roleData?.role || 'customer';
        
        // Check if 2FA is required due to previous failed attempts
        const require2FAKey = `require2FA_${validation.email}`;
        const require2FADueToFailedAttempts = localStorage.getItem(require2FAKey) === 'true';
        
        // Check if device is trusted
        const isTrusted = await checkTrustedDevice(authData.user.id);
        
        console.log('2FA check:', { isTrusted, require2FADueToFailedAttempts, userRole });
        
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
          console.log('Initiating 2FA for:', validation.email);

          const result = await initiate2FA(authData.user.id, validation.email, userRole, langCode);

          if (result.success) {
            toast.info(language === 'TR' ? 'Doğrulama kodu email adresinize gönderildi' : 'Verification code sent to your email');
          } else {
            console.error('2FA initiation failed:', result.error);
            toast.error(result.error || 'Doğrulama kodu gönderilemedi');
            // Revert back to login if failed
            setPendingRole(null);
            setViewMode('login');
            keepRedirectSuppressed = false;
          }

          // Clear the flag after initiating 2FA
          localStorage.removeItem(require2FAKey);
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
      }
    } finally {
      if (!keepRedirectSuppressed) {
        localStorage.removeItem('suppress_auth_redirect');
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
      
      const { error } = await supabase.auth.resetPasswordForEmail(validation.email, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setResetEmail(validation.email);
        setViewMode('reset-sent');
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

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    try {
      const validation = newPasswordSchema.parse({ password, confirmPassword });
      
      const { error } = await supabase.auth.updateUser({ 
        password: validation.password 
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('passwordUpdated'));
        setViewMode('login');
        navigate('/login', { replace: true });
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
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl md:text-3xl font-serif">{t('welcomeBack')}</CardTitle>
              <CardDescription>{t('signInToManage')}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* iOS PWA Notice */}
              {showIOSWarning && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">{t('iosAppNotice')}</p>
                    <p className="text-muted-foreground mt-1">
                      {t('iosGoogleLoginNotice')}
                    </p>
                  </div>
                </div>
              )}

              {/* Google Error Message */}
              {googleError && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-destructive">{googleError}</p>
                </div>
              )}

              {/* Google Sign-In Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl text-base font-medium"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="ml-2">
                  {isGoogleLoading ? t('redirectingGoogle') : t('continueWithGoogle')}
                </span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">{t('or')}</span>
                </div>
              </div>

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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
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