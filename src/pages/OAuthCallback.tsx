import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { consumePostOAuthRedirect } from "@/lib/postOAuthRedirect";
import { Button } from "@/components/ui/button";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      setError(null);

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const oauthError = url.searchParams.get("error") || url.searchParams.get("error_description");

      if (oauthError) {
        const msg = url.searchParams.get("error_description") || url.searchParams.get("error") || "OAuth failed";
        setError(decodeURIComponent(msg.replace(/\+/g, " ")));
        return;
      }

      // NOTE: We intentionally do NOT clear the URL hash here.
      // Supabase JS client reads tokens from the hash asynchronously.
      // Clearing the hash prematurely causes "no session" on iOS PWA.
      // The URL is cleaned after session is established (below).

      // Safety net: if callback arrives with PKCE code but handler hasn't processed for some reason,
      // exchange here and then wait until a session exists.
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("[OAuthCallback] code exchange error:", exchangeError);
          setError(exchangeError.message || "Oturum oluşturulamadı");
          return;
        }
      }

      // Check if we already have a session (AuthContext may have processed it)
      const start = Date.now();
      while (Date.now() - start < 8000) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Session established - now safe to clean up URL
          try {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.hash = '';
            ['code', 'state', 'scope', 'authuser', 'prompt', 'error', 'error_description'].forEach((k) => cleanUrl.searchParams.delete(k));
            window.history.replaceState(null, '', cleanUrl.pathname + (cleanUrl.search || ''));
          } catch { /* ignore */ }

          // Check for post-OAuth redirect first
          const postOAuthRedirect = consumePostOAuthRedirect();
          if (postOAuthRedirect) {
            navigate(postOAuthRedirect, { replace: true });
            return;
          }

          // Fetch user role and redirect accordingly
          try {
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .maybeSingle();

            const role = roleData?.role;
            
            if (role === "admin") {
              navigate("/admin", { replace: true });
            } else if (role === "agency") {
              navigate("/agency", { replace: true });
            } else if (role === "driver") {
              navigate("/driver", { replace: true });
            } else {
              navigate("/customer", { replace: true });
            }
          } catch {
            // Fallback to customer if role check fails
            navigate("/customer", { replace: true });
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      setError("Giriş tamamlanamadı. Lütfen tekrar deneyin.");
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {error ? (
        <div className="w-full max-w-md px-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-foreground mb-2">Giriş tamamlanamadı</h1>
            <p className="text-sm text-muted-foreground break-words">{error}</p>
            <div className="mt-5 flex gap-3">
              <Button type="button" onClick={() => window.location.replace("/auth")}>Tekrar dene</Button>
              <Button type="button" variant="outline" onClick={() => window.location.replace("/")}>Anasayfa</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Signing you in…</p>
        </div>
      )}
    </div>
  );
}
