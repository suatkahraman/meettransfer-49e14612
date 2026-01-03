import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { usePWADetect } from '@/hooks/usePWADetect';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Mail, CheckCircle, AlertCircle, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

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

type ViewMode = 'login' | 'forgot' | 'reset' | 'reset-sent';

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
  const { signIn, user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { isIOS, isStandalone } = usePWADetect();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleShare = async () => {
    const shareUrl = window.location.origin + '/login';
    const shareText = t('guestLoginShareText') || 'Book your premium transfer with Meet Transfer!';
    
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
    toast.success(t('linkCopied') || 'Link copied to clipboard!');
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
          setGoogleError('iOS uygulamasında Google ile giriş için Safari\'de açın. Alternatif olarak e-posta ile giriş yapabilirsiniz.');
          setIsGoogleLoading(false);
          return;
        }
        toast.info('Google ile giriş için Safari açılıyor...');
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
      setGoogleError('Google ile giriş yapılamadı. Lütfen e-posta ile deneyin.');
      toast.error('Google ile giriş yapılamadı');
    } finally {
      setIsGoogleLoading(false);
    }
  }, [isIOS, isStandalone]);

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

  // Role-based redirect after login
  useEffect(() => {
    if (user && !roleLoading && role) {
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
  }, [user, role, roleLoading, navigate]);

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
      
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem('guestRememberMe', 'true');
        localStorage.setItem('guestSavedEmail', validation.email);
      } else {
        localStorage.removeItem('guestRememberMe');
        localStorage.removeItem('guestSavedEmail');
      }
      
      await signIn(validation.email, validation.password);
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
        toast.success('Password updated successfully!');
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
      case 'forgot':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl md:text-3xl font-serif">Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a reset link</CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
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
                Back to Login
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
              <CardTitle className="text-2xl md:text-3xl font-serif">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a password reset link to<br />
                <span className="font-medium text-foreground">{resetEmail}</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center text-sm text-muted-foreground">
              <p>Click the link in the email to reset your password. The link will expire in 1 hour.</p>
              <p className="mt-4">Didn't receive the email? Check your spam folder or try again.</p>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl" 
                onClick={() => setViewMode('forgot')}
              >
                Try Again
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setViewMode('login')}
              >
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        );

      case 'reset':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl md:text-3xl font-serif">Set New Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="Ab2215" 
                    required 
                    className="h-12"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    1 uppercase, 1 lowercase, 4+ digits (e.g., Ab2215)
                  </p>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    className="h-12"
                    autoComplete="new-password"
                  />
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
                      Updating...
                    </>
                  ) : (
                    'Update Password'
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
              <CardTitle className="text-2xl md:text-3xl font-serif">Welcome Back</CardTitle>
              <CardDescription>Sign in to manage your bookings</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* iOS PWA Notice */}
              {showIOSWarning && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">iOS Uygulaması</p>
                    <p className="text-muted-foreground mt-1">
                      Google ile giriş Safari'de açılacaktır. Alternatif olarak e-posta ile giriş yapabilirsiniz.
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
                  {isGoogleLoading ? 'Yönlendiriliyor...' : 'Continue with Google'}
                </span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setViewMode('forgot')}
                      className="text-sm text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    className="h-12"
                    autoComplete="current-password"
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="rememberMe" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    Remember me
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
                      Signing in...
                    </>
                  ) : (
                    'Log In'
                  )}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?
              </div>
              <div className="flex gap-2 w-full">
                <Link to="/signup/customer" className="flex-1">
                  <Button variant="outline" className="w-full h-12 rounded-xl">
                    Guest Registration
                  </Button>
                </Link>
                <Link to="/signup/agency" className="flex-1">
                  <Button variant="secondary" className="w-full h-12 rounded-xl">
                    Agency Registration
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
            <span className="text-sm">Back</span>
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
      <div className="flex-1 flex items-center justify-center p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default LoginScreen;
