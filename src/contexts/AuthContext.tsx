import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PendingBookingStorage } from '@/hooks/usePendingBookingStorage';
import { consumePostOAuthRedirect } from '@/lib/postOAuthRedirect';
import { safeLocalGet } from '@/lib/safeStorage';
import { isSuppressAuthRedirect } from '@/lib/authRedirectGuard';
import { startOAuthSignIn } from '@/lib/oauthSignIn';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        // INITIAL auth load controls loading; onAuthStateChange should not.

        // Handle successful sign in - redirect based on role
        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Some flows (like our 2FA pre-check) intentionally sign in and immediately sign out.
          if (isSuppressAuthRedirect()) return;

          // Clean up URL hash immediately (non-blocking)
          if (window.location.hash.includes('access_token=')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }

          // Check current path first
          const currentPath = window.location.pathname;
          const isOAuthCallbackPath = currentPath.startsWith('/~oauth/callback') || currentPath.startsWith('/oauth/callback');
          
          // OAuth callback page handles its own redirect - don't interfere
          if (isOAuthCallbackPath) return;

          // Check for post-OAuth redirect first (fastest path - sync)
          const postOAuthRedirect = consumePostOAuthRedirect();
          if (postOAuthRedirect) {
            navigate(postOAuthRedirect, { replace: true });
            return;
          }

          // Check pending booking (sessionStorage - instant, no network)
          const pendingBookingData = PendingBookingStorage.load();
          const legacyToken = safeLocalGet('pending_booking_token');
          const legacyData = safeLocalGet('pending_booking_data');
          
          if (pendingBookingData || legacyToken || legacyData) {
            // Migrate legacy data if needed
            if ((legacyToken || legacyData) && !pendingBookingData) {
              try {
                PendingBookingStorage.save(legacyData ? JSON.parse(legacyData) : {});
                localStorage.removeItem('pending_booking_token');
                localStorage.removeItem('pending_booking_data');
              } catch { /* ignore */ }
            }
            navigate('/customer', { replace: true });
            return;
          }

          const isAuthPage = ['/login', '/signup', '/auth'].some(p => currentPath.includes(p));
          const isHomePage = currentPath === '/' || currentPath === '';
          const hasOAuthParams = window.location.hash.includes('access_token=') || window.location.search.includes('code=');
          
          const needsRedirect = isAuthPage || (isHomePage && hasOAuthParams);
          
          // Only fetch role if we actually need to redirect from auth pages
          if (!needsRedirect) return;

          // For auth pages, redirect immediately to customer, then let dashboard handle role check
          navigate('/customer', { replace: true });
        }
      }
    );

    // THEN check for existing session (including OAuth callback tokens in URL)
    const initializeAuth = async () => {
      try {
        // This call will also process any access_token in the URL hash
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
        return { error };
      }
      
      toast.success('Welcome back!');
      // Navigation handled by Auth page based on role
      return { error: null };
    } catch (error: any) {
      toast.error('An error occurred during sign in');
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Account created successfully!');
      // Navigation handled by Auth page based on role
      return { error: null };
    } catch (error: any) {
      toast.error('An error occurred during sign up');
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Check if running as installed PWA (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      if (isStandalone) {
        // For iOS PWA standalone mode, open in system browser
        const authUrl = `${window.location.origin}/login?oauth=google`;
        const opened = window.open(authUrl, '_blank');
        if (!opened) {
          toast.error('Lütfen tarayıcınızda açın');
          return { error: new Error('Cannot open browser') };
        }
        toast.info('Lütfen açılan tarayıcıda Google ile giriş yapın');
        return { error: null };
      }
      
      const { error } = await startOAuthSignIn('google');
      
      if (error) {
        console.error('Google OAuth error:', error);
        toast.error(error.message || 'Google ile giriş yapılırken hata oluştu');
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error('Google ile giriş yapılırken hata oluştu');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signInWithGoogle, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};