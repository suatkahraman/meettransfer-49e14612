import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface OAuthCallbackHandlerProps {
  children: React.ReactNode;
}

/**
 * This component handles OAuth callbacks by detecting access_token in URL hash
 * and waiting for the Supabase client to establish a session before rendering children.
 */
const OAuthCallbackHandler = ({ children }: OAuthCallbackHandlerProps) => {
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    // OAuth callback can be implicit (access_token in hash) or PKCE (code in query)
    const isOAuthCallback = hash.includes('access_token=') || !!code;

    if (isOAuthCallback) {
      setIsProcessingOAuth(true);
      
      // Supabase client automatically handles the hash and sets the session
      // We just need to wait for it and then clean up the URL
      const handleOAuthCallback = async () => {
        try {
          // PKCE flow: exchange code for session explicitly (prevents "Auth session missing")
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('OAuth code exchange error:', error);
            }
          } else {
            // Implicit flow: let the client parse hash
            const { error } = await supabase.auth.getSession();
            if (error) {
              console.error('OAuth callback error:', error);
            }
          }
          
          // Clean up the URL (remove OAuth params + hash) to avoid re-processing on refresh
          try {
            const clean = new URL(window.location.href);
            clean.hash = '';
            // OAuth noise params we don't want to keep
            ['code', 'state', 'scope', 'authuser', 'prompt'].forEach((k) => clean.searchParams.delete(k));
            window.history.replaceState(null, '', clean.pathname + (clean.search ? clean.search : ''));
          } catch {
            // ignore
          }
          
          // Small delay to ensure auth state is propagated
          setTimeout(() => {
            setIsProcessingOAuth(false);
          }, 100);
        } catch (error) {
          console.error('OAuth processing error:', error);
          setIsProcessingOAuth(false);
        }
      };
      
      handleOAuthCallback();
    }
  }, []);

  // Show loading state while processing OAuth callback
  if (isProcessingOAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Giriş yapılıyor...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OAuthCallbackHandler;
