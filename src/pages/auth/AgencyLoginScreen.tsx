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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { ArrowLeft, Loader2, Building2, User, KeyRound, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import TwoFactorVerification from '@/components/auth/TwoFactorVerification';

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
});

type ViewMode = 'login' | 'reset' | '2fa';

const AgencyLoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('agencyRememberMe') === 'true';
  });
  const [savedEmail, setSavedEmail] = useState(() => {
    return localStorage.getItem('agencySavedEmail') || '';
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
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
    checkTrustedDevice,
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
    const shareUrl = window.location.origin + '/login/agency';
    const shareText = t('agencyLoginShareText') || 'Join Meet Transfer as an agency partner!';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meet Transfer - Agency Login',
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
    toast.success(t('linkCopied') || 'Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

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
    if (result.success && pendingRole) {
      // Log successful login attempt
      const userEmail = result.email || twoFactorState.email || '';
      await logLoginAttempt(userEmail, true, undefined, undefined, pendingRole);
      
      toast.success(language === 'TR' ? 'Doğrulama başarılı! Giriş yapılıyor...' : 'Verification successful! Signing in...');
      
      // Try auto-login with the magic link token
      if (result.autoLogin && result.tokenHash && result.email) {
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            email: result.email,
            token: result.tokenHash,
            type: 'magiclink'
          });
          
          if (verifyError) {
            console.error('Auto-login failed:', verifyError);
            // Redirect anyway - user will need to login again
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
        localStorage.setItem('agencyRememberMe', 'true');
        localStorage.setItem('agencySavedEmail', validation.email);
      } else {
        localStorage.removeItem('agencyRememberMe');
        localStorage.removeItem('agencySavedEmail');
      }
      
      // Use supabase directly to get the user data for 2FA check
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: validation.email,
        password: validation.password,
      });
      
      if (error) {
        await logLoginAttempt(validation.email, false, error.message, undefined, 'agency');
        
        if (error.message?.includes('Invalid login credentials')) {
          // Check if failed attempts require 2FA verification
          const updatedRateLimit = await checkRateLimit(validation.email);
          const failedAttempts = updatedRateLimit.failedAttempts || 0;
          
          // After 2+ failed attempts, require 2FA on next successful login
          if (failedAttempts >= 2) {
            localStorage.setItem(`require2FA_${validation.email}`, 'true');
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
        
        const userRole = roleData?.role || 'agency';
        
        // Check if 2FA is required due to previous failed attempts
        const require2FAKey = `require2FA_${validation.email}`;
        const require2FADueToFailedAttempts = localStorage.getItem(require2FAKey) === 'true';
        
        // Check if device is trusted
        const isTrusted = await checkTrustedDevice(authData.user.id);
        
        // Require 2FA if: device not trusted OR there were failed login attempts
        if (!isTrusted || require2FADueToFailedAttempts) {
          // Sign out temporarily - user needs to verify via 2FA
          await supabase.auth.signOut();
          
          // Device not trusted or suspicious activity - require 2FA
          const langCode = language === 'TR' ? 'tr' : 'en';
          const result = await initiate2FA(authData.user.id, validation.email, userRole, langCode);
          
          if (result.success) {
            // Only switch to 2FA view if email was sent successfully
            setPendingRole(userRole);
            setViewMode('2fa');
            toast.info(language === 'TR' ? 'Doğrulama kodu email adresinize gönderildi' : 'Verification code sent to your email');
            // Clear the flag after initiating 2FA
            localStorage.removeItem(require2FAKey);
          } else {
            // Email sending failed - show error and stay on login screen
            toast.error(result.error || (language === 'TR' ? 'Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.' : 'Failed to send verification code. Please try again.'));
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
              <span className="text-sm">{t("back") || "Back"}</span>
            </button>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4 py-8">
          <TwoFactorVerification
            email={twoFactorState.email || ''}
            role={twoFactorState.role || 'agency'}
            isLoading={is2FALoading}
            error={twoFactorError}
            onVerify={handle2FAVerify}
            onResend={resendOTP}
            onCancel={handle2FACancel}
            maxAttempts={maxAttempts}
            remainingAttempts={remainingAttempts}
            otpLength={otpSettings.otpLength}
            expiryMinutes={otpSettings.expiryMinutes}
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
              <span className="text-sm">{t("back") || "Back"}</span>
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
                {t("resetPassword") || "Reset Password"}
              </CardTitle>
              <CardDescription>
                {t("resetPasswordDescription") || "Enter your email to receive a password reset link"}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{t("email") || "Email"}</Label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="agency@email.com" 
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
                      {t("sending") || "Sending..."}
                    </>
                  ) : (
                    t("sendResetLink") || "Send Reset Link"
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
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">{t("back") || "Back"}</span>
          </Link>
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
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-serif">{t("agencyLogin") || "Agency Login"}</CardTitle>
            <CardDescription>{t("agencyLoginDescription") || "Sign in with your agency account"}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email") || "Email"}</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="agency@email.com" 
                  required 
                  className="h-12"
                  autoComplete="email"
                  defaultValue={savedEmail}
                />
                {errors.email && <p className="text-sm text-destructive">{t("invalidEmail") || errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t("password") || "Password"}</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="h-12"
                  autoComplete="current-password"
                />
                {errors.password && <p className="text-sm text-destructive">{t("passwordMinLength") || errors.password}</p>}
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
                    {t("rememberMe") || "Remember me"}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('reset')}
                  className="text-sm text-accent hover:underline"
                >
                  {t("forgotPassword") || "Forgot password?"}
                </button>
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
                    {t("loggingIn") || "Logging in..."}
                  </>
                ) : (
                  t("login") || "Login"
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pb-8">
            <div className="text-center text-sm text-muted-foreground">
              {t("noAgencyAccount") || "Don't have an agency account?"}
            </div>
            <Link to="/signup/agency" className="w-full">
              <Button variant="outline" className="w-full h-12 rounded-xl">
                {t("applyAsAgency") || "Apply as Agency"}
              </Button>
            </Link>
            <div className="text-center text-sm text-muted-foreground">
              {t("areYouGuest") || "Are you a guest?"}{' '}
              <Link to="/login" className="text-accent hover:underline inline-flex items-center gap-1">
                <User className="h-3 w-3" />
                {t("guestLogin") || "Guest Login"}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AgencyLoginScreen;
