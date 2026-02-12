import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { startOAuthSignIn } from '@/lib/oauthSignIn';
import {
  clearSupabaseAuthArtifacts,
  consumeAuthSessionSyncHint,
  waitForPersistedSession,
} from '@/lib/supabaseAuthSession';

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

    const applySessionState = (nextSession: Session | null) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    };

    const resolveHydratedSession = async (
      initialSession: Session | null,
      source: string,
    ): Promise<Session | null> => {
      if (initialSession?.user) return initialSession;

      const hasOAuthOrRecoveryParams = (() => {
        try {
          const url = new URL(window.location.href);
          const hash = url.hash || '';
          return (
            hash.includes('access_token=') ||
            url.searchParams.has('code') ||
            url.searchParams.get('type') === 'recovery'
          );
        } catch {
          return false;
        }
      })();

      const hadRecentSyncHint = consumeAuthSessionSyncHint();
      const isIOS = /iPhone|iPad|iPod|Macintosh.*Mobile/i.test(navigator.userAgent);

      if (!hasOAuthOrRecoveryParams && !hadRecentSyncHint && !isIOS) {
        return initialSession;
      }

      const timeoutMs = hasOAuthOrRecoveryParams || hadRecentSyncHint ? 5000 : 2500;
      const hydrated = await waitForPersistedSession({ timeoutMs, intervalMs: 150 });
      if (!hydrated && (hasOAuthOrRecoveryParams || hadRecentSyncHint)) {
        console.warn(`[AuthContext] Session hydration timed out (${source})`);
      }

      return hydrated ?? initialSession;
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        
        console.log('[AuthContext] onAuthStateChange event:', event);
        
        // Handle sign out - ensure clean state
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out, clearing state');
          applySessionState(null);
          clearSupabaseAuthArtifacts();
          return;
        }

        let resolvedSession = currentSession ?? null;

        // Rare race: event received before session is fully persisted.
        if (!resolvedSession && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          resolvedSession = await resolveHydratedSession(resolvedSession, `event:${event}`);
        }

        if (!isMounted) return;
        applySessionState(resolvedSession);
      }
    );

    // THEN check for existing session (including OAuth callback tokens in URL)
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        const hydratedSession = await resolveHydratedSession(existingSession ?? null, 'initialize');
        applySessionState(hydratedSession ?? null);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    void initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    let signOutError: unknown = null;

    try {
      console.log('[AuthContext] Signing out...');
      // Clear state immediately to unblock UI.
      setUser(null);
      setSession(null);
      
      // Use scope: 'global' to sign out from all tabs/windows
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        signOutError = error;
      }
    } catch (error) {
      signOutError = error;
    } finally {
      clearSupabaseAuthArtifacts();
      navigate('/auth', { replace: true });
    }

    if (signOutError) {
      console.error('[AuthContext] Sign out error:', signOutError);
      toast.error('Error signing out');
      return;
    }

    console.log('[AuthContext] Signed out successfully');
    toast.success('Signed out successfully');
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