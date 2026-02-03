import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OAuthCallbackHandlerProps {
  children: React.ReactNode;
}


/**
 * This component handles OAuth callbacks by detecting access_token in URL hash
 * and waiting for the Supabase client to establish a session before rendering children.
 */
const OAuthCallbackHandler = ({ children }: OAuthCallbackHandlerProps) => {
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const callbackParams = useMemo(() => {
    try {
      const url = new URL(window.location.href);
      return {
        code: url.searchParams.get('code'),
        error: url.searchParams.get('error'),
        errorDescription: url.searchParams.get('error_description'),
      };
    } catch {
      return { code: null, error: null, errorDescription: null };
    }
  }, []);

  const waitForSession = async (timeoutMs = 8000, intervalMs = 200) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) return session;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return null;
  };

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    // Some providers (or backend) can bounce back with explicit error params.
    // Treat these as OAuth callback too so we don't silently fall back to home.
    const explicitError = url.searchParams.get('error') || url.searchParams.get('error_description');

    // OAuth callback can be implicit (access_token in hash) or PKCE (code in query)
    const isOAuthCallback = hash.includes('access_token=') || !!code || !!explicitError;

    if (isOAuthCallback) {
      setIsProcessingOAuth(true);
      setOauthError(null);
      
      // Supabase client automatically handles the hash and sets the session
      // We just need to wait for it and then clean up the URL
      const handleOAuthCallback = async () => {
        try {
          let errMsg: string | null = null;

          // If backend returned an OAuth error, surface it.
          if (explicitError) {
            const msg = url.searchParams.get('error_description') || url.searchParams.get('error') || 'OAuth failed';
            errMsg = decodeURIComponent(msg.replace(/\+/g, ' '));
          }

          // PKCE flow: exchange code for session explicitly (prevents "Auth session missing")
          if (!errMsg) {
            if (code) {
              const { error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) {
                console.error('OAuth code exchange error:', error);
                errMsg = error.message || 'OAuth session kurulamadı';
              }
            } else {
              // Implicit flow: let the client parse hash
              const { error } = await supabase.auth.getSession();
              if (error) {
                console.error('OAuth callback error:', error);
                errMsg = error.message || 'OAuth session kurulamadı';
              }
            }
          }

          // Safari can be slow to persist the session after a fresh cookie clear.
          // Wait for the session to actually exist before we clean the URL / render routes.
          if (!errMsg) {
            const session = await waitForSession();
            if (!session?.user) {
              errMsg = 'Giriş tamamlanamadı. Safari’de çerez / takip engeli nedeniyle oturum kaydedilememiş olabilir. Lütfen tekrar deneyin.';
            }
          }
          
          if (errMsg) {
            setOauthError(errMsg);
            setIsProcessingOAuth(false);
            return;
          }

          // Clean up the URL (remove OAuth params + hash) to avoid re-processing on refresh
          try {
            const clean = new URL(window.location.href);
            clean.hash = '';
            // OAuth noise params we don't want to keep
            ['code', 'state', 'scope', 'authuser', 'prompt', 'error', 'error_description'].forEach((k) => clean.searchParams.delete(k));
            window.history.replaceState(null, '', clean.pathname + (clean.search ? clean.search : ''));
          } catch {
            // ignore
          }
          
          setIsProcessingOAuth(false);
        } catch (error) {
          console.error('OAuth processing error:', error);
          setOauthError(error instanceof Error ? error.message : 'OAuth processing error');
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

  if (oauthError) {
    const isCallbackPath = window.location.pathname.startsWith('/~oauth/callback') || window.location.pathname.startsWith('/oauth/callback');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md px-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-foreground mb-2">Giriş tamamlanamadı</h1>
            <p className="text-sm text-muted-foreground break-words">{oauthError}</p>
            <div className="mt-5 flex gap-3">
              <Button
                type="button"
                onClick={() => {
                  // Soft retry: go to login screen and let user initiate again.
                  // We keep this simple to avoid loops.
                  window.location.replace('/auth');
                }}
              >
                Tekrar dene
              </Button>
              {isCallbackPath ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.replace('/')}
                >
                  Anasayfa
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OAuthCallbackHandler;
