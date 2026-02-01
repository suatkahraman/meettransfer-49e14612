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
    const url = new URL(window.location.href);
    const hash = url.hash || "";
    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

    // code/type can appear in query OR hash depending on provider/link type
    const queryCode = url.searchParams.get("code");
    const queryType = url.searchParams.get("type");
    const hashCode = hashParams.get("code");
    const hashType = hashParams.get("type");

    const code = queryCode || hashCode;
    const type = queryType || hashType;

    const isHashSession = hash.includes("access_token=");
    const knownTypes = ["recovery", "magiclink", "signup", "invite", "email_change"];

    // We intentionally allow exchanging a code even if `type` is missing,
    // but only on auth-ish routes to avoid interfering with unrelated ?code= params.
    const path = url.pathname.toLowerCase();
    const isAuthPath =
      path.includes("/login") ||
      path.includes("/auth") ||
      path.includes("/signup") ||
      // localized variants (/tr/login etc.)
      /\/(tr|de|fr|ru|it|es|ar|uk|ja|pt)\/(login|auth|signup)(\/|$)/.test(path);

    const looksLikeAuthCode =
      !!code &&
      code.length >= 20 &&
      /^[a-z0-9_-]+$/i.test(code) &&
      // either explicit known type OR we're on an auth route
      ((!!type && knownTypes.includes(type)) || isAuthPath);

    // Check if this is an auth callback
    if (isHashSession || looksLikeAuthCode) {
      setIsProcessingOAuth(true);
      
      // Supabase client automatically handles the hash and sets the session
      // We just need to wait for it and then clean up the URL
      const handleOAuthCallback = async () => {
        try {
          if (code && looksLikeAuthCode) {
            // PKCE / recovery / magiclink code exchange
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) console.error("Auth code exchange error:", error);
          }

          // Always force a session read after any callback.
          // This helps on iOS where auth state propagation can be slightly delayed.
          const { error: sessionError } = await supabase.auth.getSession();
          if (sessionError) console.error("OAuth callback getSession error:", sessionError);

          // Clean up the URL by removing the hash and auth code.
          // Keep `type` (e.g. type=recovery) so the UI can show the correct screen.
          url.searchParams.delete("code");
          url.searchParams.delete("state");

          // Remove sensitive auth stuff from hash but preserve `type` if it exists there.
          hashParams.delete("access_token");
          hashParams.delete("refresh_token");
          hashParams.delete("token_type");
          hashParams.delete("expires_in");
          hashParams.delete("code");
          hashParams.delete("state");

          const nextHash = hashParams.toString();
          url.hash = nextHash ? `#${nextHash}` : "";
          window.history.replaceState(null, "", url.pathname + url.search + url.hash);
          
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
