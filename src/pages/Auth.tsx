import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { ArrowLeft, Loader2, Mail, CheckCircle, Eye, EyeOff, ShieldCheck, XCircle, AlertCircle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Invalid email address').max(255),
  password: passwordSchema,
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

type ViewMode = 'auth' | 'forgot' | 'reset-sent' | 'reset' | 'reset-success' | 'reset-error';

// Password strength indicator component
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const checks = useMemo(() => ({
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasFourDigits: /\d.*\d.*\d.*\d/.test(password),
  }), [password]);

  const score = useMemo(() => {
    let s = 0;
    if (checks.minLength) s += 25;
    if (checks.hasUppercase) s += 25;
    if (checks.hasLowercase) s += 25;
    if (checks.hasFourDigits) s += 25;
    return s;
  }, [checks]);

  if (!password) return null;

  const getColor = () => {
    if (score >= 100) return 'bg-green-500';
    if (score >= 75) return 'bg-primary';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-destructive';
  };

  const getLabel = () => {
    if (score >= 100) return 'Strong';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Weak';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2 mt-2"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password Strength</span>
        <span className={`font-medium ${
          score >= 100 ? 'text-green-600' :
          score >= 75 ? 'text-primary' :
          score >= 50 ? 'text-amber-600' :
          'text-destructive'
        }`}>
          {getLabel()}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className={`flex items-center gap-1 ${checks.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.minLength ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          <span>6+ characters</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.hasUppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.hasUppercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          <span>Uppercase</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.hasLowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.hasLowercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          <span>Lowercase</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.hasFourDigits ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.hasFourDigits ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          <span>4+ digits</span>
        </div>
      </div>
    </motion.div>
  );
};

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('auth');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const { signIn, signUp, user, session } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for password recovery in URL and auth state
  useEffect(() => {
    const checkRecovery = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Check for recovery type in URL params or hash
      const isRecoveryType = params.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
      const hasAccessToken = hashParams.get('access_token');
      const errorDescription = hashParams.get('error_description');
      
      console.log('Recovery check:', { 
        isRecoveryType, 
        hasAccessToken: !!hasAccessToken, 
        errorDescription,
        hash: window.location.hash.substring(0, 50) + '...'
      });

      // Check for errors in the URL
      if (errorDescription) {
        console.error('Auth error from URL:', errorDescription);
        toast.error(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
        setViewMode('reset-error');
        setRecoveryChecked(true);
        
        // Clean URL
        window.history.replaceState(null, '', '/auth');
        return;
      }

      // If recovery type is set and there's an access token in the hash
      if (isRecoveryType && hasAccessToken) {
        console.log('Recovery token detected, waiting for session...');
        setViewMode('reset');
        setIsRecoverySession(true);
        
        // Clean URL hash after processing
        setTimeout(() => {
          window.history.replaceState(null, '', '/auth?type=recovery');
        }, 100);
      } else if (isRecoveryType) {
        // Just the type=recovery param without token (user might already have session)
        console.log('Recovery type without token, checking existing session...');
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          console.log('Existing session found for recovery');
          setViewMode('reset');
          setIsRecoverySession(true);
        } else {
          console.log('No session found for recovery, showing error');
          toast.error('Recovery link has expired or is invalid. Please request a new one.');
          setViewMode('reset-error');
        }
      }
      
      setRecoveryChecked(true);
    };

    checkRecovery();

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change in Auth page:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event received');
        setViewMode('reset');
        setIsRecoverySession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Role-based redirect after login (only if not in recovery mode)
  useEffect(() => {
    if (isRecoverySession || viewMode === 'reset') {
      // Don't redirect during recovery
      return;
    }
    
    if (user && !roleLoading && role && recoveryChecked) {
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
  }, [user, role, roleLoading, navigate, isRecoverySession, viewMode, recoveryChecked]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const validation = loginSchema.parse({ email, password });
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
      const validation = signupSchema.parse({ fullName, phone, email, password });
      await signUp(validation.email, validation.password, validation.fullName);
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
      
      console.log('Sending reset email to:', validation.email);
      console.log('Redirect URL:', `${window.location.origin}/auth?type=recovery`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(validation.email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (error) {
        console.error('Reset password email error:', error);
        // Don't reveal if email exists for security
        if (error.message.includes('rate limit')) {
          toast.error('Too many requests. Please try again later.');
        } else {
          // Always show success to prevent email enumeration
          setResetEmail(validation.email);
          setViewMode('reset-sent');
        }
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

  const handleResetPassword = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validation = newPasswordSchema.parse({ password: newPassword, confirmPassword });
      
      console.log('Updating password...');
      
      // Get current session to verify we have auth
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.error('No session found for password update');
        toast.error('Your session has expired. Please request a new password reset link.');
        setViewMode('reset-error');
        setIsLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.updateUser({ 
        password: validation.password 
      });

      if (error) {
        console.error('Password update error:', error);
        
        if (error.message.includes('same password') || error.message.includes('different from')) {
          toast.error('New password must be different from your current password');
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      console.log('Password updated successfully');
      
      // Show success state
      setViewMode('reset-success');
      setIsRecoverySession(false);
      
      // Clear URL params
      window.history.replaceState(null, '', '/auth');
      
      toast.success('Password updated successfully!');
      
      // Redirect to login after delay
      setTimeout(() => {
        setViewMode('auth');
        setNewPassword('');
        setConfirmPassword('');
      }, 3000);
      
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
  }, [newPassword, confirmPassword]);

  const passwordsMatch = useMemo(() => {
    return newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const passwordsDontMatch = useMemo(() => {
    return confirmPassword.length > 0 && newPassword !== confirmPassword;
  }, [newPassword, confirmPassword]);

  // Loading state while checking recovery
  if (!recoveryChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-primary/60">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset Error View
  if (viewMode === 'reset-error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
            >
              <AlertCircle className="h-8 w-8 text-destructive" />
            </motion.div>
            <CardTitle className="text-2xl font-serif">Link Expired</CardTitle>
            <CardDescription>
              This password reset link has expired or is invalid.
              Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => setViewMode('forgot')}>
              <Mail className="mr-2 h-4 w-4" />
              Request New Link
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setViewMode('auth')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Reset Success View
  if (viewMode === 'reset-success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
            >
              <ShieldCheck className="h-8 w-8 text-green-600" />
            </motion.div>
            <CardTitle className="text-2xl font-serif">Password Updated!</CardTitle>
            <CardDescription>
              Your password has been successfully updated.
              You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setViewMode('auth')}>
              Continue to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (viewMode === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" name="email" type="email" placeholder="your@email.com" required />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <Button type="submit" variant="accent" className="w-full" disabled={isLoading}>
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
            <Button variant="ghost" className="w-full" onClick={() => setViewMode('auth')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (viewMode === 'reset-sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
            >
              <CheckCircle className="h-8 w-8 text-green-600" />
            </motion.div>
            <CardTitle className="text-2xl font-serif">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to<br />
              <span className="font-medium text-foreground">{resetEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground space-y-2">
            <p>Click the link in the email to reset your password.</p>
            <p className="flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Don't forget to check your spam folder.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={() => setViewMode('forgot')}>
              Try Again
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setViewMode('auth')}>
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (viewMode === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-serif">Set New Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input 
                    id="new-password" 
                    name="password" 
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••" 
                    required 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={newPassword} />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input 
                    id="confirm-password" 
                    name="confirmPassword" 
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pr-10 ${
                      passwordsDontMatch ? 'border-destructive focus-visible:ring-destructive' :
                      passwordsMatch ? 'border-green-500 focus-visible:ring-green-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <AnimatePresence>
                  {confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={`flex items-center gap-1 text-xs ${
                        passwordsMatch ? 'text-green-600' : 'text-destructive'
                      }`}
                    >
                      {passwordsMatch ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          <span>Passwords don't match</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
              <Button 
                type="submit" 
                variant="accent" 
                className="w-full" 
                disabled={isLoading || !passwordsMatch}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => {
                setViewMode('auth');
                setIsRecoverySession(false);
                setNewPassword('');
                setConfirmPassword('');
                window.history.replaceState(null, '', '/auth');
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-serif">Meet Transfer</CardTitle>
          <CardDescription>Sign in to manage your bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Google Sign-In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl text-base font-medium mb-4 mt-4"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/customer/bookings`,
                    },
                  });
                  if (error) {
                    toast.error(error.message);
                  }
                } catch (error) {
                  toast.error('Failed to sign in with Google');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <GoogleIcon />
              <span className="ml-2">Continue with Google</span>
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" placeholder="your@email.com" required />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setViewMode('forgot')}
                      className="text-sm text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input id="login-password" name="password" type="password" placeholder="••••••••" required />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" name="fullName" type="text" placeholder="John Doe" required />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone</Label>
                  <Input id="signup-phone" name="phone" type="tel" placeholder="+90 5XX XXX XXXX" required />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" placeholder="your@email.com" required />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" placeholder="Ab2215" required />
                  <p className="text-xs text-muted-foreground">
                    1 uppercase, 1 lowercase, 4+ digits (e.g., Ab2215)
                  </p>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
