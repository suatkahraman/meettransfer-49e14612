import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
    // Handle OAuth callback - clean up URL hash if present
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        // Let Supabase handle the hash - it will update the session
        // Clean up the URL after processing
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', cleanUrl);
      }
    };
    
    handleOAuthCallback();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle OAuth callback - redirect based on role
        if (event === 'SIGNED_IN' && session?.user) {
          // Defer role check to avoid Supabase deadlock
          setTimeout(async () => {
            try {
              const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .maybeSingle();

              const userRole = roleData?.role || 'customer';
              
              // Check if URL has OAuth hash (callback) or is on auth pages
              const currentPath = window.location.pathname;
              const hasOAuthHash = window.location.hash.includes('access_token=');
              const isAuthPage = ['/login', '/signup', '/auth'].some(p => currentPath.includes(p));
              
              if (isAuthPage || hasOAuthHash) {
                // Clean up URL hash
                if (hasOAuthHash) {
                  const cleanUrl = currentPath + window.location.search;
                  window.history.replaceState(null, '', cleanUrl);
                }
                
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
              navigate('/customer', { replace: true });
            }
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
      const redirectUrl = `${window.location.origin}/login`;
      
      // Check if running as installed PWA (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      if (isStandalone) {
        // For PWA standalone mode, we need to get the OAuth URL and open it in system browser
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
            skipBrowserRedirect: true, // Don't auto-redirect, we'll handle it
          },
        });
        
        if (error) {
          toast.error(error.message);
          return { error };
        }
        
        // Open OAuth URL in system browser
        if (data?.url) {
          window.open(data.url, '_blank');
          toast.info('Lütfen açılan tarayıcıda Google ile giriş yapın, ardından uygulamayı tekrar açın.');
        }
        
        return { error: null };
      } else {
        // Normal browser flow
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });
        
        if (error) {
          toast.error(error.message);
          return { error };
        }
        
        return { error: null };
      }
    } catch (error: any) {
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