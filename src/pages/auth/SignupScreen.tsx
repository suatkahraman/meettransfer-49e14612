import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { usePWADetect } from '@/hooks/usePWADetect';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { ArrowLeft, Loader2, AlertCircle, Share2, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import AuthLanguageSelector from '@/components/auth/AuthLanguageSelector';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';
import { scrollToFirstError } from '@/lib/formValidation';
import { safeLocalGet } from '@/lib/safeStorage';

// Password format: 1 uppercase, 1 lowercase, at least 4 digits (e.g., Ab2215)
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(100)
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/\d.*\d.*\d.*\d/, 'Password must contain at least 4 digits');

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().min(5, 'Phone number is required').max(20),
  email: z.string().trim().email('Invalid email address').max(255),
  password: passwordSchema,
});

const SignupScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { isIOS, isStandalone } = usePWADetect();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleShare = async () => {
    const shareUrl = 'https://meettransfer.app/signup/customer';
    const shareText = t('guestSignupShareText');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meet Transfer - Sign Up',
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

useEffect(() => {
  // 1. Recovery Mode Detection: Prevent redirect if user is resetting password
  const isActualRecovery = 
    window.location.search.includes('type=recovery') || 
    window.location.hash.includes('type=recovery') ||
    window.location.href.includes('recovery');

  if (isActualRecovery) {
    console.log('[Auth] Recovery mode detected: Redirect suspended to allow password reset.');
    return;
  }

  // 2. Wait for Authentication and Role Data
  // Stop if we don't have a user, or if we are still loading the role
  if (!user || roleLoading) {
    return;
  }

  // 3. Handle Pending Bookings (if any)
  const pendingBookingToken = safeLocalGet('pending_booking_token');
  const pendingBookingData = safeLocalGet('pending_booking_data');
  
  if (pendingBookingToken || pendingBookingData) {
    console.log('[Auth] Pending booking found, redirecting to /customer');
    navigate('/customer', { replace: true });
    return;
  }

  // 4. Role-Based Routing Logic
  if (role) {
    console.log('[Auth] Login successful, redirecting to role path:', role);
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
  } else {
    // 5. Fallback for New Users (Google Sign-in / Guest)
    // If user exists but role is not found in database yet
    console.log('[Auth] User exists but no role found, redirecting to /customer as default');
    navigate('/customer', { replace: true });
  }
}, [user, role, roleLoading, navigate]);
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const validation = signupSchema.parse({ 
        fullName: fullName.trim(), 
        phone: phone.trim(), 
        email: email.trim(), 
        password 
      });

      const redirectUrl = `${window.location.origin}/customer`;

      // Create auth user - with auto-confirm enabled, user will be logged in immediately
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: validation.email,
        password: validation.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validation.fullName,
          },
        },
      });

      if (signUpError) {
        const msg = (signUpError.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('user already registered')) {
          toast.error(t('emailAlreadyRegistered'));
          navigate('/login');
        } else if (msg.includes('weak') || msg.includes('pwned') || msg.includes('easy to guess')) {
          toast.error(language === 'TR' ? 'Bu şifre güvenli değil. Daha benzersiz bir şifre seçin (örn. özel karakterler ekleyin).' : 'This password is not secure. Choose a more unique password.');
        } else if (msg.includes('rate limit') || msg.includes('too many')) {
          toast.error(language === 'TR' ? 'Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.' : 'Too many attempts. Please try again later.');
        } else {
          toast.error(signUpError.message);
        }
        return;
      }

      if (signUpData.user && signUpData.session) {
        // User is now logged in automatically (auto-confirm enabled)
        // Update profile with phone number
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: signUpData.user.id,
            full_name: validation.fullName,
            phone: validation.phone,
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        toast.success(t('accountCreated'));
        // Navigate to customer panel - user is already authenticated
        navigate('/customer', { replace: true });
      } else if (signUpData.user && !signUpData.session) {
        // Fallback: If somehow session is not created, try to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: validation.email,
          password: validation.password,
        });

        if (signInError) {
          const msg = (signInError.message || '').toLowerCase();
          if (msg.includes('email not confirmed')) {
            toast.info(language === 'TR' ? 'E-posta adresinizi kontrol edin ve hesabınızı onaylayın.' : 'Please check your email and confirm your account.');
          } else {
            toast.error(signInError.message);
          }
          return;
        }

        // Update profile after sign in
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: signUpData.user.id,
            full_name: validation.fullName,
            phone: validation.phone,
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        toast.success(t('accountCreated'));
        navigate('/customer', { replace: true });
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
      } else {
        const errMsg = error instanceof Error ? error.message : t('loginFailed');
        toast.error(errMsg);
      }
    } finally {
      setIsLoading(false);
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
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-sm font-medium text-primary">
              {t('loginWelcomeFeature')}
            </div>
            <CardTitle className="text-2xl md:text-3xl font-serif">{t('createAccount')}</CardTitle>
            <CardDescription>{t('joinMeetTransfer')}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* iOS PWA Notice */}
            {isIOS && isStandalone && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">{t('iosAppNotice')}</p>
                  <p className="text-muted-foreground mt-1">
                    {t('iosGoogleSignupNotice')}
                  </p>
                </div>
              </div>
            )}


            {/* Social Sign-Up Buttons */}
            <SocialAuthButtons
              disabled={isLoading}
              mode="signup"
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('or')}</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('fullName')}</Label>
                <Input 
                  id="fullName" 
                  name="fullName" 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  className="h-12"
                  autoComplete="name"
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  placeholder="+90 5XX XXX XXXX" 
                  required 
                  className="h-12"
                  autoComplete="tel"
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
              
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
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Ab2215" 
                    required 
                    className="h-12 pr-12"
                    autoComplete="new-password"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
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
                <PasswordStrengthIndicator 
                  password={passwordValue} 
                  language={language === 'TR' ? 'TR' : 'EN'} 
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              {/* KVKK Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="kvkk"
                  name="kvkk"
                  required
                  className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <Label htmlFor="kvkk" className="text-sm text-muted-foreground leading-tight">
                  <Link to="/privacy" target="_blank" className="text-accent hover:underline">
                    {t('kvkkLink')}
                  </Link>
                  {" "}{t('kvkkText').replace(t('kvkkLink'), '').replace("I have read and accept the ", "").replace(". ", " ")}
                </Label>
              </div>
              {errors.kvkk && <p className="text-sm text-destructive">{errors.kvkk}</p>}
              
              <Button 
                type="submit" 
                variant="accent"
                className="w-full h-12 rounded-xl text-base font-medium" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('creatingAccount')}
                  </>
                ) : (
                  t('createAccount')
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pb-8">
            <div className="text-center text-sm text-muted-foreground">
              {t('alreadyHaveAccount')}
            </div>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full h-12 rounded-xl">
                {t('login')}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignupScreen;
