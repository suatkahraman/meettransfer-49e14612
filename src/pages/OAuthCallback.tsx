import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { consumePostOAuthRedirect } from "@/lib/postOAuthRedirect";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      // Clean up URL hash immediately
      if (window.location.hash.includes('access_token=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      // Check if we already have a session (AuthContext may have processed it)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Session exists - redirect immediately without role check
        const postOAuthRedirect = consumePostOAuthRedirect();
        navigate(postOAuthRedirect || '/customer', { replace: true });
        return;
      }

      // If no session yet, wait briefly for AuthContext to process
      // But still redirect to /customer as default after timeout
      setTimeout(() => {
        const redirect = consumePostOAuthRedirect();
        navigate(redirect || '/customer', { replace: true });
      }, 500);
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
