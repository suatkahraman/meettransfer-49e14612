import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PendingBookingStorage } from '@/hooks/usePendingBookingStorage';
import { consumePostOAuthRedirect } from '@/lib/postOAuthRedirect';
import { safeLocalGet } from '@/lib/safeStorage';
import { isSuppressAuthRedirect } from '@/lib/authRedirectGuard';

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
          // In that window we must prevent global redirects, otherwise the app navigates away
          // and the OTP entry screen never renders.
          const suppressRedirect = isSuppressAuthRedirect();
          if (suppressRedirect) return;

          // Defer role check to avoid Supabase deadlock
          setTimeout(async () => {
            if (!isMounted) return;
            
            try {
              // Clean up URL hash if present (OAuth callback)
              if (window.location.hash.includes('access_token=')) {
                const cleanUrl = window.location.pathname + window.location.search;
                window.history.replaceState(null, '', cleanUrl);
              }

              // If a flow requested a specific post-OAuth return location, honor it.
              // This avoids using path-based redirect_uri values that can trigger Google redirect_uri_mismatch.
              const postOAuthRedirect = consumePostOAuthRedirect();
              if (postOAuthRedirect) {
                navigate(postOAuthRedirect, { replace: true });
                return;
              }

              const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', currentSession.user.id)
                .maybeSingle();

              const userRole = roleData?.role || 'customer';
              
              // Check for pending booking data from sessionStorage (secure storage)
              const pendingBookingData = PendingBookingStorage.load();
              
              // Also check legacy localStorage (for backward compatibility, then migrate)
              const legacyToken = safeLocalGet('pending_booking_token');
              const legacyData = safeLocalGet('pending_booking_data');
              
              if (pendingBookingData || legacyToken || legacyData) {
                console.log('[Auth] Found pending booking, redirecting to /customer to complete reservation');
                
                // Migrate legacy data to sessionStorage if exists
                if ((legacyToken || legacyData) && !pendingBookingData) {
                  try {
                    const parsed = legacyData ? JSON.parse(legacyData) : {};
                    PendingBookingStorage.save(parsed);
                    localStorage.removeItem('pending_booking_token');
                    localStorage.removeItem('pending_booking_data');
                    console.log('[Auth] Migrated legacy booking data to sessionStorage');
                  } catch {
                    // Ignore parse errors
                  }
                }
                
                // Redirect to customer panel where they can complete missing info
                navigate('/customer', { replace: true });
                return;
              }

              // Check if on auth pages - need to redirect
              const currentPath = window.location.pathname;
              const isAuthPage = ['/login', '/signup', '/auth'].some(p => currentPath.includes(p));

              // Also redirect from home page after OAuth callback
              const isHomePage = currentPath === '/' || currentPath === '';
              const isOAuthCallback = window.location.hash.includes('access_token=') ||
                                     window.location.search.includes('code=');

              // Some providers (and our managed flow) can return to /~oauth/callback
              const isOAuthCallbackPath = currentPath.startsWith('/~oauth/callback') || currentPath.startsWith('/oauth/callback');

              if (isAuthPage || isOAuthCallbackPath || (isHomePage && isOAuthCallback)) {
                switch (userRole) {
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
            } catch (error) {
              console.error('Role fetch error:', error);
              if (isMounted) {
                navigate('/customer', { replace: true });
              }
            }
          }, 0);
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
      
      // Use Lovable Cloud managed OAuth
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      
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