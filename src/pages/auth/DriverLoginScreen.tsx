import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Loader2, Car, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import TwoFactorVerification from '@/components/auth/TwoFactorVerification';

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
});

type ViewMode = 'login' | 'reset' | '2fa';

const DriverLoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('driverRememberMe') === 'true';
  });
  const [savedEmail, setSavedEmail] = useState(() => {
    return localStorage.getItem('driverSavedEmail') || '';
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
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
    checkTrustedDevice 
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

  // Role-based redirect after login (only if not pending 2FA)
  useEffect(() => {
    if (user && !roleLoading && role && viewMode !== '2fa') {
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
  }, [user, role, roleLoading, navigate, viewMode]);

  // Handle 2FA verification success
  const handle2FAVerify = async (code: string) => {
    const result = await verify2FA(code);
    if (result.success && user && pendingRole) {
      await logLoginAttempt(user.email || '', true, undefined, undefined, pendingRole);
      
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
    }
  };

  // Handle 2FA cancel
  const handle2FACancel = async () => {
    cancel2FA();
    setPendingRole(null);
    setViewMode('login');
    await supabase.auth.signOut();
  };

  // If already logged in, show loading
  if (authLoading || (user && roleLoading)) {
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
        localStorage.setItem('driverRememberMe', 'true');
        localStorage.setItem('driverSavedEmail', validation.email);
      } else {
        localStorage.removeItem('driverRememberMe');
        localStorage.removeItem('driverSavedEmail');
      }
      
      // Use supabase directly to get the user data for 2FA check
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: validation.email,
        password: validation.password,
      });
      
      if (error) {
        await logLoginAttempt(validation.email, false, error.message, undefined, 'driver');
        
        if (error.message?.includes('Invalid login credentials')) {
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
        
        // Check if device is trusted
        const isTrusted = await checkTrustedDevice(authData.user.id);
        
        if (!isTrusted) {
          // Device not trusted - require 2FA
          setPendingRole(userRole);
          setViewMode('2fa');
          const langCode = language === 'TR' ? 'tr' : 'en';
          await initiate2FA(authData.user.id, validation.email, userRole, langCode);
          toast.info(language === 'TR' ? 'Doğrulama kodu email adresinize gönderildi' : 'Verification code sent to your email');
        } else {
          // Device trusted - proceed with login
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
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      
      if (error) {
        toast.error(error.message || t('resetFailed') || 'Failed to send reset email');
      } else {
        toast.success(t('resetEmailSent') || 'Password reset email sent! Check your inbox.');
        setViewMode('login');
        setResetEmail('');
      }
    } catch (error) {
      console.error('Reset error:', error);
      toast.error(t('resetFailed') || 'Failed to send reset email');
    } finally {
      setIsResetLoading(false);
    }
  };

  // 2FA verification screen
  if (viewMode === '2fa') {
    return (
      <div className="min-h-screen flex flex-col bg-secondary">
        <header className="sticky top-0 z-50 bg-card border-b border-border">
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
          />
        </div>
      </div>
    );
  }

  // Password reset form
  if (viewMode === 'reset') {
    return (
      <div className="min-h-screen flex flex-col bg-secondary">
        <header className="sticky top-0 z-50 bg-card border-b border-border">
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
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
