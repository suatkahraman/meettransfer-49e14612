import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().min(5, 'Phone number is required').max(20),
  email: z.string().trim().email('Invalid email address').max(255),
  password: passwordSchema,
});

const SignupScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { isIOS, isStandalone } = usePWADetect();
  const navigate = useNavigate();

  // Role-based redirect if already logged in
  useEffect(() => {
    if (user && !roleLoading && role) {
      switch (role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'driver':
          navigate('/driver', { replace: true });
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

      const redirectUrl = `${window.location.origin}/`;

      // Create auth user
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
        if (signUpError.message.includes('already registered')) {
          toast.error('This email is already registered. Please log in instead.');
          navigate('/login');
        } else {
          toast.error(signUpError.message);
        }
        return;
      }

      if (signUpData.user) {
        // Update profile with phone number
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            full_name: validation.fullName,
            phone: validation.phone 
          })
          .eq('id', signUpData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        toast.success('Account created successfully! Welcome to Meet Transfer.');
        navigate('/customer', { replace: true });
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
        toast.error('An error occurred during sign up');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl md:text-3xl font-serif">Create Account</CardTitle>
            <CardDescription>Join Meet Transfer for premium transfers</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* iOS PWA Notice */}
            {isIOS && isStandalone && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">iOS Uygulaması</p>
                  <p className="text-muted-foreground mt-1">
                    Google ile kayıt Safari'de açılacaktır. Alternatif olarak e-posta ile kayıt olabilirsiniz.
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

            {/* Google Sign-Up Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl text-base font-medium"
              onClick={async () => {
                setIsGoogleLoading(true);
                setGoogleError(null);
                
                try {
                  if (isIOS && isStandalone) {
                    const authUrl = `${window.location.origin}/signup?oauth=google`;
                    const opened = window.open(authUrl, '_blank');
                    if (!opened) {
                      setGoogleError('iOS uygulamasında Google ile kayıt için Safari\'de açın.');
                      setIsGoogleLoading(false);
                      return;
                    }
                    toast.info('Google ile kayıt için Safari açılıyor...');
                    setIsGoogleLoading(false);
                    return;
                  }

                  const { error } = await signInWithGoogle();
                  if (error) {
                    setGoogleError(error.message);
                  }
                } catch (error) {
                  setGoogleError('Google ile kayıt yapılamadı');
                } finally {
                  setIsGoogleLoading(false);
                }
              }}
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

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
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
                <Label htmlFor="phone">Phone</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                    KVKK Aydınlatma Metni
                  </Link>
                  'ni okudum ve kabul ediyorum. Kişisel verilerimin işlenmesine onay veriyorum.
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
                    Hesap oluşturuluyor...
                  </>
                ) : (
                  'Hesap Oluştur'
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pb-8">
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?
            </div>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full h-12 rounded-xl">
                Log In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignupScreen;
