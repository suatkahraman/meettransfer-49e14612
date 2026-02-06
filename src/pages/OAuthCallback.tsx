import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { consumePostOAuthRedirect } from "@/lib/postOAuthRedirect";
import { Button } from "@/components/ui/button";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const hasNavigated = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const safeNavigate = (to: string) => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    navigate(to, { replace: true });
  };

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const cleanupUrl = (url: URL) => {
      try {
        const cleanUrl = new URL(url.href);
        cleanUrl.hash = "";
        [
          "code",
          "state",
          "scope",
          "authuser",
          "prompt",
          "error",
          "error_description",
          "access_token",
          "refresh_token",
          "token_type",
          "expires_in",
        ].forEach((k) => {
          cleanUrl.searchParams.delete(k);
        });
        window.history.replaceState(null, "", cleanUrl.pathname + (cleanUrl.search || ""));
      } catch (e) {
        console.warn("[OAuthCallback] URL cleanup failed:", e);
      }
    };

    const resolveRedirectTarget = async (userId: string): Promise<string> => {
      console.log("[OAuthCallback] ====== ROLE RESOLUTION START ======");
      console.log("[OAuthCallback] User ID for role check:", userId);

      // Check for post-OAuth redirect first (fastest path)
      const postOAuthRedirect = consumePostOAuthRedirect();
      if (postOAuthRedirect) {
        console.log("[OAuthCallback] Found stored post-OAuth redirect path:", postOAuthRedirect);
        return postOAuthRedirect;
      }

      console.log("[OAuthCallback] No stored redirect path, checking user role in database...");

      try {
        console.log("[OAuthCallback] Role check query starting...");
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
          console.error("[OAuthCallback] Role fetch error:", roleError);
          return "/customer";
        }

        const role = roleData?.role;
        console.log("[OAuthCallback] User role:", role || "NO ROLE FOUND");

        if (role === "admin") return "/admin";
        if (role === "agency") return "/agency";
        if (role === "driver") return "/driver";
        return "/customer";
      } catch (err) {
        console.error("[OAuthCallback] Role resolution exception:", err);
        return "/customer";
      } finally {
        console.log("[OAuthCallback] ====== ROLE RESOLUTION END ======");
      }
    };

    const navigateAfterLogin = async (userId: string) => {
      console.log("[OAuthCallback] Starting redirect resolution with 3s timeout...");

      // Ensure we never get an unhandled rejection from the role promise, even if it loses the race.
      const rolePromise = resolveRedirectTarget(userId).catch((err) => {
        console.error("[OAuthCallback] resolveRedirectTarget rejected:", err);
        return "/customer";
      });

      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
      }, 3000);

      const target = await Promise.race<string>([
        rolePromise,
        new Promise<string>((resolve) => setTimeout(() => resolve("/customer"), 3000)),
      ]);

      clearTimeout(timer);

      console.log(
        timedOut
          ? "[OAuthCallback] Role resolution timed out -> redirecting to fallback:"
          : "[OAuthCallback] Role resolution completed -> redirecting to:",
        target,
      );

      safeNavigate(target);
    };

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
          const msg =
            url.searchParams.get("error_description") || url.searchParams.get("error") || "OAuth failed";
          console.error("[OAuthCallback] OAuth error from provider:", oauthError);
          cleanupUrl(url);
          setError(decodeURIComponent(msg.replace(/\+/g, " ")));
          return;
        }

        // Extract tokens from hash fragment (#access_token=...)
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        if (hash && hash.length > 1) {
          const hashParams = new URLSearchParams(hash.substring(1));
          accessToken = hashParams.get("access_token");
          refreshToken = hashParams.get("refresh_token");
          console.log(
            "[OAuthCallback] Tokens from hash - access_token:",
            !!accessToken,
            "refresh_token:",
            !!refreshToken,
          );
        }

        // Fallback: Check query params for tokens (some providers can send via GET)
        if (!accessToken) {
          accessToken = url.searchParams.get("access_token");
          refreshToken = url.searchParams.get("refresh_token");
          if (accessToken) {
            console.log("[OAuthCallback] Tokens from query params - access_token:", !!accessToken);
          }
        }

        // IMPORTANT: Clean URL early to prevent re-processing loops.
        // We already captured token/code values above.
        const shouldCleanupCallbackUrl = Boolean(accessToken) || Boolean(code) || (hash && hash.length > 1);
        if (shouldCleanupCallbackUrl) {
          console.log("[OAuthCallback] Cleaning callback URL params (early)...");
          cleanupUrl(url);
        }

        // Case 1: We have access_token - set session directly
        if (accessToken) {
          console.log("[OAuthCallback] ====== SESSION SETUP START ======");
          console.log("[OAuthCallback] setSession BEFORE");
          console.log("[OAuthCallback] Access token length:", accessToken.length);
          console.log("[OAuthCallback] Refresh token present:", !!refreshToken);

          const startTime = Date.now();
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          const duration = Date.now() - startTime;

          console.log("[OAuthCallback] setSession AFTER (", duration, "ms )");
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
            setError(
              `Oturum oluşturulamadı: ${sessionError.message} (Status: ${sessionError.status || "N/A"})`,
            );
            return;
          }

          console.log("[OAuthCallback] ====== SESSION SUCCESS ======");

          const userId = data?.user?.id;
          if (userId) {
            console.log("[OAuthCallback] Role check START (userId from setSession):", userId);
            await navigateAfterLogin(userId);
            return;
          }

          console.warn("[OAuthCallback] User is null after setSession; trying getSession fallback...");
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user?.id) {
            console.log("[OAuthCallback] Role check START (userId from getSession):", session.user.id);
            await navigateAfterLogin(session.user.id);
            return;
          }

          console.error("[OAuthCallback] No user after setSession + getSession fallback");
          safeNavigate("/customer");
          return;
        }

        // Case 2: We have PKCE code - exchange for session
        if (code) {
          console.log("[OAuthCallback] Exchanging code for session...");
          console.log("[OAuthCallback] Role check will be resolved with 3s timeout after exchange.");

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

          if (data?.user?.id) {
            console.log("[OAuthCallback] Role check START (userId from exchange):", data.user.id);
            await navigateAfterLogin(data.user.id);
          } else {
            console.error("[OAuthCallback] User is null after code exchange");
            setError("Oturum açıldı ancak kullanıcı bilgisi alınamadı");
          }
          return;
        }

        // Case 3: No tokens or code - wait for session (AuthContext/OAuthCallbackHandler may have processed it)
        console.log("[OAuthCallback] No tokens/code found, waiting for existing session...");
        const start = Date.now();
        while (Date.now() - start < 8000) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user?.id) {
            console.log("[OAuthCallback] Found existing session for:", session.user.email);
            // If we got here without parsing tokens, still ensure the URL is clean.
            cleanupUrl(url);
            console.log("[OAuthCallback] Role check START (userId from existing session):", session.user.id);
            await navigateAfterLogin(session.user.id);
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
