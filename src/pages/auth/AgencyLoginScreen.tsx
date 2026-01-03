import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { z } from 'zod';
import { ArrowLeft, Loader2, Building2, User } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
});

const AgencyLoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { t } = useLanguage();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">{t("back") || "Back"}</span>
          </Link>
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
