import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isIOSDevice } from '@/lib/platformDetect';
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
    let retryCount = 0;
    const maxRetries = 5;

    // Enhanced iOS Safari session persistence
    const checkSessionWithRetry = async (isRetry = false): Promise<Session | null> => {
      try {
        let { data: { session } } = await supabase.auth.getSession();
        
        // iOS Safari specific: Handle storage delays and ITP issues
        if (!session && isIOSDevice() && retryCount < maxRetries) {
          console.log(`[AuthContext] Session check ${retryCount + 1}/${maxRetries} - iOS Safari retry`);
          
          // Progressive backoff for iOS Safari
          const delays = isRetry ? [100, 200, 400, 800, 1600] : [50, 100, 200, 400, 800];
          
          for (let i = 0; i < delays.length && !session && retryCount < maxRetries; i++) {
            await new Promise(r => setTimeout(r, delays[i]));
            retryCount++;
            
            try {
              const retry = await supabase.auth.getSession();
              session = retry.data.session;
              if (session) {
                console.log('[AuthContext] Session found on retry', retryCount);
                break;
              }
            } catch (retryErr) {
              console.warn(`[AuthContext] Retry ${retryCount} failed:`, retryErr);
            }
          }
        }
        
        return session;
      } catch (error) {
        console.error('[AuthContext] Session check error:', error);
        return null;
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        console.log('[AuthContext] Auth state change:', event);

        // Handle sign out - ensure clean state
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          retryCount = 0; // Reset retry count on sign out
          return;
        }

        // Handle sign in - update state but don't redirect
        if (event === 'SIGNED_IN') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          retryCount = 0; // Reset retry count on successful sign in
          return;
        }

        // Handle token refresh and other events
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
      }
    );

    // Enhanced session initialization for iOS Safari
    const initializeAuth = async () => {
      try {
        const existingSession = await checkSessionWithRetry();
        
        if (isMounted) {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
          
          // Additional check for iOS Safari after page load
          if (isIOSDevice() && !existingSession) {
            setTimeout(async () => {
              if (isMounted) {
                const lateSession = await checkSessionWithRetry(true);
                if (lateSession && !session) {
                  console.log('[AuthContext] Late session discovery on iOS Safari');
                  setSession(lateSession);
                  setUser(lateSession.user);
                }
              }
            }, 2000); // Check again after 2 seconds
          }
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    initializeAuth();

    // Cleanup function
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