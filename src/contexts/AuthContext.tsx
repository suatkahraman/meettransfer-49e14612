import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
    let syncRunId = 0;

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const getSessionWithRetry = async (allowIOSRetry = false): Promise<Session | null> => {
      let { data: { session: existingSession } } = await supabase.auth.getSession();

      // iOS WebKit: getSession bazen ilk seferde null döner - kademeli tekrar dene
      if (!existingSession && allowIOSRetry) {
        const isIOS = /iPhone|iPad|iPod|Macintosh.*Mobile/i.test(navigator.userAgent);
        if (isIOS) {
          const delays = [100, 250, 500, 1000];
          for (const delay of delays) {
            await wait(delay);
            const retry = await supabase.auth.getSession();
            existingSession = retry.data.session;
            if (existingSession) break;
          }
        }
      }

      return existingSession;
    };

    // Next.js middleware kullanmayan bu istemcide, session'ı server tarafında doğrulamak
    // için getSession + getUser kombinasyonunu zorunlu tutuyoruz.
    const syncValidatedSession = async (
      reason: string,
      incomingSession?: Session | null,
      options?: { allowIOSRetry?: boolean }
    ) => {
      const runId = ++syncRunId;

      try {
        let candidateSession = incomingSession ?? null;
        if (!candidateSession) {
          candidateSession = await getSessionWithRetry(Boolean(options?.allowIOSRetry));
        }

        if (!candidateSession) {
          if (isMounted && runId === syncRunId) {
            setSession(null);
            setUser(null);
          }
          return;
        }

        const validationDelays = [0, 150, 300];
        let verifiedUser: User | null = null;
        for (const delay of validationDelays) {
          if (delay > 0) {
            await wait(delay);
          }

          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userData?.user) {
            verifiedUser = userData.user;
            break;
          }

          const errorMessage = (userError?.message || '').toLowerCase();
          const tokenLikelyInvalid = userError?.status === 401
            || errorMessage.includes('jwt')
            || errorMessage.includes('token')
            || errorMessage.includes('session');

          if (tokenLikelyInvalid) {
            break;
          }
        }

        if (!verifiedUser) {
          console.warn(`[AuthContext] ${reason}: getUser validation failed, clearing local auth state.`);
          await supabase.auth.signOut({ scope: 'local' });
          if (isMounted && runId === syncRunId) {
            setSession(null);
            setUser(null);
          }
          return;
        }

        // Fresh object refs ensure SIGNED_IN/TOKEN_REFRESHED always propagate to listeners.
        const normalizedUser = { ...verifiedUser } as User;
        const normalizedSession = {
          ...candidateSession,
          user: normalizedUser,
        } as Session;

        if (isMounted && runId === syncRunId) {
          setSession(normalizedSession);
          setUser(normalizedUser);
        }
      } catch (error) {
        console.error(`[AuthContext] ${reason} sync error:`, error);
        if (isMounted && runId === syncRunId) {
          setSession(null);
          setUser(null);
        }
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        console.log('[AuthContext] onAuthStateChange event:', event);

        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out, clearing state');
          setSession(null);
          setUser(null);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await syncValidatedSession(`onAuthStateChange:${event}`, currentSession);
          return;
        }

        await syncValidatedSession(`onAuthStateChange:${event}`, currentSession);
      }
    );

    // THEN check for existing session (including OAuth callback tokens in URL)
    const initializeAuth = async () => {
      try {
        await syncValidatedSession('initializeAuth', null, { allowIOSRetry: true });
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
      // Clean start: drop potentially stale local auth token before a new login attempt.
      const { error: cleanupError } = await supabase.auth.signOut({ scope: 'local' });
      if (cleanupError) {
        console.warn('[AuthContext] pre-login signOut warning:', cleanupError.message);
      }

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
      
      // Use scope: 'global' to sign out from all tabs/windows
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('[AuthContext] Sign out error:', error);
        toast.error('Error signing out');
        return;
      }
      
      console.log('[AuthContext] Signed out successfully');
      toast.success('Signed out successfully');
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