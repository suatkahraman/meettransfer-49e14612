import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { z } from 'zod';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const resetEmailSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters').max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ViewMode = 'login' | 'forgot' | 'reset' | 'reset-sent';

const LoginScreen = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [resetEmail, setResetEmail] = useState('');
  const { signIn, user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // Check if returning from password reset email
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setViewMode('reset');
    }
  }, [searchParams]);

  // Role-based redirect after login
  useEffect(() => {
    if (user && !roleLoading && role) {
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'driver') {
        navigate('/driver');
      } else {
        navigate('/customer');
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
        // Clear URL params
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
                    placeholder="••••••••" 
                    required 
                    className="h-12"
                    autoComplete="new-password"
                  />
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
            
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
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
              <Link to="/signup" className="w-full">
                <Button variant="outline" className="w-full h-12 rounded-xl">
                  Create Account
                </Button>
              </Link>
            </CardFooter>
          </Card>
        );
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
      <div className="flex-1 flex items-center justify-center p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default LoginScreen;
