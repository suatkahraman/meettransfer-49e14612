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

      try {
        const url = new URL(window.location.href);
        const hash = url.hash;
        const code = url.searchParams.get("code");
        const oauthError = url.searchParams.get("error") || url.searchParams.get("error_description");

        console.log("[OAuthCallback] Processing callback...");
        console.log("[OAuthCallback] URL:", window.location.href);
        console.log("[OAuthCallback] Hash present:", !!hash);
        console.log("[OAuthCallback] Code present:", !!code);

        // Handle OAuth errors
        if (oauthError) {
          const msg = url.searchParams.get("error_description") || url.searchParams.get("error") || "OAuth failed";
          console.error("[OAuthCallback] OAuth error from provider:", oauthError);
          setError(decodeURIComponent(msg.replace(/\+/g, " ")));
          return;
        }

        // Extract tokens from hash fragment (#access_token=... for Google/Apple implicit flow)
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        if (hash && hash.length > 1) {
          const hashParams = new URLSearchParams(hash.substring(1));
          accessToken = hashParams.get("access_token");
          refreshToken = hashParams.get("refresh_token");
          console.log("[OAuthCallback] Tokens from hash - access_token:", !!accessToken, "refresh_token:", !!refreshToken);
        }

        // Fallback: Check query params for tokens (Apple sometimes sends via GET)
        if (!accessToken) {
          accessToken = url.searchParams.get("access_token");
          refreshToken = url.searchParams.get("refresh_token");
          if (accessToken) {
            console.log("[OAuthCallback] Tokens from query params - access_token:", !!accessToken);
          }
        }

        // Case 1: We have access_token - set session directly
        if (accessToken) {
          console.log("[OAuthCallback] ====== SESSION SETUP START ======");
          console.log("[OAuthCallback] Setting session with access_token...");
          console.log("[OAuthCallback] Access token length:", accessToken.length);
          console.log("[OAuthCallback] Refresh token present:", !!refreshToken);
          console.log("[OAuthCallback] Refresh token length:", refreshToken?.length || 0);
          
          const startTime = Date.now();
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          const duration = Date.now() - startTime;

          console.log("[OAuthCallback] setSession completed in", duration, "ms");
          console.log("[OAuthCallback] setSession response data:", {
            hasSession: !!data?.session,
            hasUser: !!data?.user,
            userEmail: data?.user?.email || "N/A",
            userId: data?.user?.id || "N/A",
            sessionExpiresAt: data?.session?.expires_at || "N/A",
          });

          if (sessionError) {
            console.error("[OAuthCallback] ====== SESSION ERROR ======");
            console.error("[OAuthCallback] setSession error:", sessionError);
            console.error("[OAuthCallback] Full error details:", {
              message: sessionError.message,
              status: sessionError.status,
              name: sessionError.name,
              stack: sessionError.stack,
              code: (sessionError as any).code,
              cause: (sessionError as any).cause,
            });
            console.error("[OAuthCallback] Raw error object:", JSON.stringify(sessionError, null, 2));
            setError(`Oturum oluşturulamadı: ${sessionError.message} (Status: ${sessionError.status || "N/A"})`);
            return;
          }

          console.log("[OAuthCallback] ====== SESSION SUCCESS ======");
          console.log("[OAuthCallback] Session set successfully!");
          console.log("[OAuthCallback] User email:", data?.user?.email);
          console.log("[OAuthCallback] User ID:", data?.user?.id);
          console.log("[OAuthCallback] Session expires at:", data?.session?.expires_at);
          
          // Clean up URL
          cleanupUrl(url);
          
          // Redirect based on role
          if (data?.user) {
            console.log("[OAuthCallback] Proceeding to role-based redirection...");
            await redirectBasedOnRole(data.user.id);
          } else {
            console.error("[OAuthCallback] User is null after setSession - this should not happen");
            console.error("[OAuthCallback] Full data object:", JSON.stringify(data, null, 2));
            // Fallback: Try to get session from Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              console.log("[OAuthCallback] Found session via getSession fallback:", session.user.email);
              await redirectBasedOnRole(session.user.id);
            } else {
              console.log("[OAuthCallback] No session found, redirecting to customer-dashboard as fallback");
              navigate("/customer-dashboard", { replace: true });
            }
          }
          return;
        }

        // Case 2: We have PKCE code - exchange for session
        if (code) {
          console.log("[OAuthCallback] Exchanging code for session...");
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("[OAuthCallback] exchangeCodeForSession error:", exchangeError);
            console.error("[OAuthCallback] Error details:", {
              message: exchangeError.message,
              status: exchangeError.status,
              name: exchangeError.name,
            });
            setError(exchangeError.message || "Oturum oluşturulamadı");
            return;
          }

          console.log("[OAuthCallback] Code exchanged successfully, user:", data?.user?.email);
          
          // Clean up URL
          cleanupUrl(url);
          
          // Redirect based on role
          if (data?.user) {
            await redirectBasedOnRole(data.user.id);
          } else {
            console.error("[OAuthCallback] User is null after code exchange");
            setError("Oturum açıldı ancak kullanıcı bilgisi alınamadı");
          }
          return;
        }

        // Case 3: No tokens or code - wait for session (AuthContext may have processed it)
        console.log("[OAuthCallback] No tokens/code found, waiting for existing session...");
        const start = Date.now();
        while (Date.now() - start < 8000) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log("[OAuthCallback] Found existing session for:", session.user.email);
            cleanupUrl(url);
            await redirectBasedOnRole(session.user.id);
            return;
          }
          await new Promise((r) => setTimeout(r, 200));
        }

        console.error("[OAuthCallback] No session established after timeout");
        setError("Giriş tamamlanamadı. Lütfen tekrar deneyin.");
        
      } catch (err: any) {
        console.error("[OAuthCallback] Unexpected error:", err);
        setError(`Beklenmeyen hata: ${err.message}`);
      }
    };

    const cleanupUrl = (url: URL) => {
      try {
        const cleanUrl = new URL(url.href);
        cleanUrl.hash = '';
        ['code', 'state', 'scope', 'authuser', 'prompt', 'error', 'error_description', 'access_token', 'refresh_token', 'token_type', 'expires_in'].forEach((k) => {
          cleanUrl.searchParams.delete(k);
        });
        window.history.replaceState(null, '', cleanUrl.pathname + (cleanUrl.search || ''));
      } catch (e) {
        console.warn("[OAuthCallback] URL cleanup failed:", e);
      }
    };

    const redirectBasedOnRole = async (userId: string) => {
      console.log("[OAuthCallback] ====== ROLE REDIRECT START ======");
      console.log("[OAuthCallback] User ID for role check:", userId);
      
      // Check for post-OAuth redirect first
      const postOAuthRedirect = consumePostOAuthRedirect();
      if (postOAuthRedirect) {
        console.log("[OAuthCallback] Found stored post-OAuth redirect path:", postOAuthRedirect);
        console.log("[OAuthCallback] Redirecting to stored path...");
        navigate(postOAuthRedirect, { replace: true });
        return;
      }

      console.log("[OAuthCallback] No stored redirect path, checking user role in database...");

      // Fetch user role and redirect accordingly
      try {
        console.log("[OAuthCallback] Querying user_roles table for user:", userId);
        const startTime = Date.now();
        
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        const duration = Date.now() - startTime;
        console.log("[OAuthCallback] Role query completed in", duration, "ms");
        console.log("[OAuthCallback] Role query response:", {
          hasData: !!roleData,
          role: roleData?.role || "N/A",
          hasError: !!roleError,
        });

        if (roleError) {
          console.error("[OAuthCallback] ====== ROLE FETCH ERROR ======");
          console.error("[OAuthCallback] Role fetch error:", roleError);
          console.error("[OAuthCallback] Role error details:", {
            message: roleError.message,
            code: roleError.code,
            details: roleError.details,
            hint: roleError.hint,
          });
          console.log("[OAuthCallback] Fallback: Redirecting to /customer-dashboard due to role fetch error");
          navigate("/customer-dashboard", { replace: true });
          return;
        }

        const role = roleData?.role;
        console.log("[OAuthCallback] ====== ROLE DETERMINATION ======");
        console.log("[OAuthCallback] User role from database:", role || "NO ROLE FOUND");

        if (!role) {
          console.log("[OAuthCallback] No role found in user_roles table for this user");
          console.log("[OAuthCallback] Fallback: Redirecting to /customer-dashboard (default for users without role)");
          navigate("/customer-dashboard", { replace: true });
          return;
        }

        console.log("[OAuthCallback] Role found:", role);
        
        if (role === "admin") {
          console.log("[OAuthCallback] Admin role detected, redirecting to /admin");
          navigate("/admin", { replace: true });
        } else if (role === "agency") {
          console.log("[OAuthCallback] Agency role detected, redirecting to /agency-dashboard");
          navigate("/agency-dashboard", { replace: true });
        } else if (role === "driver") {
          console.log("[OAuthCallback] Driver role detected, redirecting to /driver-dashboard");
          navigate("/driver-dashboard", { replace: true });
        } else {
          console.log("[OAuthCallback] Customer or unknown role, redirecting to /customer-dashboard");
          navigate("/customer-dashboard", { replace: true });
        }
        
        console.log("[OAuthCallback] ====== ROLE REDIRECT COMPLETE ======");
      } catch (err: any) {
        console.error("[OAuthCallback] ====== ROLE CHECK EXCEPTION ======");
        console.error("[OAuthCallback] Role check failed with exception:", err);
        console.error("[OAuthCallback] Exception details:", {
          message: err?.message,
          name: err?.name,
          stack: err?.stack,
        });
        console.log("[OAuthCallback] Fallback: Redirecting to /customer-dashboard due to exception");
        navigate("/customer-dashboard", { replace: true });
      }
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
          <p className="text-muted-foreground">Giriş yapılıyor…</p>
        </div>
      )}
    </div>
  );
}
