import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { startOAuthSignIn } from '@/lib/oauthSignIn';
import {
  clearClientAuthStorage,
  ensureSessionPersistence,
  signOutAndClearClientAuth,
} from '@/lib/authSession';

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
      async (event, currentSession) => {
        if (!isMounted) return;
        
        console.log('[AuthContext] onAuthStateChange event:', event);
        
        // Handle sign out - ensure clean state
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out, clearing state');
          setSession(null);
          setUser(null);
          clearClientAuthStorage();
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        // INITIAL auth load controls loading; onAuthStateChange should not.

        // Do not auto-redirect on sign-in here.
        // Redirecting is handled by dedicated pages (OAuthCallback) and login screens.
        if (
          currentSession &&
          (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
        ) {
          ensureSessionPersistence(currentSession).then((persisted) => {
            if (!persisted) {
              console.warn('[AuthContext] Session persistence check failed after auth event:', event);
            }
          }).catch((error) => {
            console.warn('[AuthContext] Session persistence check error:', error);
          });
        }
      }
    );

    // THEN check for existing session (including OAuth callback tokens in URL)
    const initializeAuth = async () => {
      try {
        let { data: { session: existingSession } } = await supabase.auth.getSession();
        // iOS WebKit: getSession bazen ilk seferde null döner - birkaç kez kademeli olarak tekrar deneyin
        const isIOS = /iPhone|iPad|iPod|Macintosh.*Mobile/i.test(navigator.userAgent);
        if (!existingSession && isIOS) {
          const delays = [100, 250, 500, 1000]; // 4 deneme: 100ms, 250ms, 500ms, 1s
          for (const delay of delays) {
            await new Promise(r => setTimeout(r, delay));
            const retry = await supabase.auth.getSession();
            existingSession = retry.data.session;
            if (existingSession) break;
          }
        }
        if (isMounted) {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
        }
        if (existingSession) {
          ensureSessionPersistence(existingSession).catch((error) => {
            console.warn('[AuthContext] Initial session persistence check error:', error);
          });
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
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
        return { error };
      }

      const persisted = await ensureSessionPersistence(data?.session ?? null);
      if (!persisted) {
        clearClientAuthStorage();
        const persistenceError = new Error('Auth session could not be persisted');
        toast.error('Session could not be saved. Please enable cookies/storage and try again.');
        return { error: persistenceError };
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
      // IMPORTANT: Do not open OAuth in a separate tab/window for PWA.
      // iOS isolates storage between PWA and Safari, so auth session would not persist.
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
      console.log('[AuthContext] Signing out...');
      // Clear state immediately before calling signOut
      setUser(null);
      setSession(null);
      
      // Global sign out first (server token revocation), then local cleanup.
      const { error } = await signOutAndClearClientAuth({ global: true, clearRememberedLogin: true });
      
      if (error) {
        console.error('[AuthContext] Sign out error:', error);
        // Local cleanup is still done; continue to login page.
        toast.error('Signed out locally, but global session revocation failed.');
      } else {
        console.log('[AuthContext] Signed out successfully');
        toast.success('Signed out successfully');
      }
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('[AuthContext] Sign out exception:', error);
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