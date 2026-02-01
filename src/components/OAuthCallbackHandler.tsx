import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface OAuthCallbackHandlerProps {
  children: React.ReactNode;
}

/**
 * This component handles auth callbacks by:
 * - detecting access_token in URL hash (legacy implicit)
 * - detecting PKCE auth code in URL query (?code=...) (recovery/magic links)
 * and waiting for the client to establish a session before rendering children.
 */
const OAuthCallbackHandler = ({ children }: OAuthCallbackHandlerProps) => {
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const type = url.searchParams.get("type");

    const isHashSession = !!hash && hash.includes("access_token=");
    // Only exchange codes for known auth link types to avoid interfering with other ?code= usages.
    const isPkceAuthCode = !!code && !!type && ["recovery", "magiclink", "signup", "invite", "email_change"].includes(type);

    // Check if this is an auth callback
    if (isHashSession || isPkceAuthCode) {
      setIsProcessingOAuth(true);
      
      // Supabase client automatically handles the hash and sets the session
      // We just need to wait for it and then clean up the URL
      const handleOAuthCallback = async () => {
        try {
          if (isPkceAuthCode && code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error("Auth code exchange error:", error);
            }
          } else {
            // Wait for Supabase to process the hash and get the session
            const { error } = await supabase.auth.getSession();
            if (error) {
              console.error('OAuth callback error:', error);
            }
          }

          // Clean up the URL by removing the hash and auth code.
          // Keep `type` (e.g. type=recovery) so the UI can show the correct screen.
          url.hash = "";
          url.searchParams.delete("code");
          url.searchParams.delete("state");
          window.history.replaceState(null, "", url.pathname + url.search);
          
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
