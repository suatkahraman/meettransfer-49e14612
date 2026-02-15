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

    const resolveRedirectTarget = async (
      userId: string,
      accessToken?: string | null
    ): Promise<{ path: string; actualRole: string }> => {
      console.log("[OAuthCallback] ====== ROLE RESOLUTION START ======");

      // postOAuthRedirect oncelikli - booking sayfasi vb. kesin korunur
      const postOAuthRedirect = consumePostOAuthRedirect();
      if (postOAuthRedirect) {
        console.log("[OAuthCallback] Found post-OAuth redirect (booking vb.):", postOAuthRedirect);
        return { path: postOAuthRedirect, actualRole: "customer" };
      }

      // get-user-role edge function - eski kullanicilar (drivers/agencies user_roles olmadan) icin
      let actualRole = "customer";
      const token = accessToken || (await supabase.auth.getSession()).data?.session?.access_token;
      if (token) {
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 200 * attempt));
          const { data } = await supabase.functions.invoke("get-user-role", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (data?.success && data?.role) {
            actualRole = data.role as string;
            const path = { admin: "/admin", driver: "/driver", agency: "/agency" }[actualRole] ?? "/customer";
            console.log("[OAuthCallback] get-user-role:", actualRole, "->", path);
            return { path, actualRole };
          }
        }
      }

      // Fallback: user_roles (eski yol)
      try {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        if (!roleError && roleData?.role) {
          actualRole = roleData.role as string;
          const path = { admin: "/admin", driver: "/driver", agency: "/agency" }[actualRole] ?? "/customer";
          return { path, actualRole };
        }
      } catch {
        // ignore
      }
      return { path: "/customer", actualRole };
    };

    const navigateAfterLogin = async (
      userId: string,
      accessToken?: string | null,
      expectedRole?: string | null
    ) => {
      console.log("[OAuthCallback] Starting redirect resolution...", { expectedRole });

      const rolePromise = resolveRedirectTarget(userId, accessToken).catch((err) => {
        console.error("[OAuthCallback] resolveRedirectTarget rejected:", err);
        return { path: "/customer", actualRole: "customer" };
      });

      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
      }, 3000);

      const result = await Promise.race<{ path: string; actualRole: string }>([
        rolePromise,
        new Promise<{ path: string; actualRole: string }>((resolve) =>
          setTimeout(() => resolve({ path: "/customer", actualRole: "customer" }), 3000)
        ),
      ]);

      clearTimeout(timer);

      const target = result.path;

      // Role validation: driver/agency sayfalarından Google ile giriş yapıldıysa, rol eşleşmeli
      if (expectedRole && (expectedRole === "driver" || expectedRole === "agency")) {
        if (result.actualRole !== expectedRole) {
          console.warn("[OAuthCallback] Role mismatch:", { expectedRole, actualRole: result.actualRole });
          await supabase.auth.signOut();
          const loginPath =
            expectedRole === "driver" ? "/login/driver" : "/login/agency";
          window.location.replace(`${loginPath}?error=role_mismatch`);
          return;
        }
      }

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
        const expectedRole = url.searchParams.get("expected_role");

        console.log("[OAuthCallback] Processing callback...", { expectedRole });
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

          try {
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
              
              // Check if this is a network error (Failed to fetch)
              const isNetworkError = 
                sessionError.message?.includes("Failed to fetch") ||
                sessionError.message?.includes("NetworkError") ||
                sessionError.message?.includes("fetch");
              
              if (isNetworkError) {
                console.warn("[OAuthCallback] Network error detected, will retry getSession...");
                // Wait a bit and try getSession as fallback
                await new Promise((r) => setTimeout(r, 1000));
              } else {
                setError(
                  `Oturum oluşturulamadı: ${sessionError.message} (Status: ${sessionError.status || "N/A"})`,
                );
                return;
              }
            }

            console.log("[OAuthCallback] ====== SESSION SUCCESS ======");

            const userId = data?.user?.id;
            const accessToken = data?.session?.access_token;
            if (userId) {
              await navigateAfterLogin(userId, accessToken, expectedRole);
              return;
            }
          } catch (fetchError: any) {
            console.error("[OAuthCallback] setSession fetch error:", fetchError);
            console.error("[OAuthCallback] Error type:", fetchError?.name);
            console.error("[OAuthCallback] Error message:", fetchError?.message);
            // Continue to getSession fallback
          }

          // Fallback: Try getSession if setSession failed or returned no user
          console.warn("[OAuthCallback] Trying getSession fallback...");
          
          // Give the auth system a moment to process
          await new Promise((r) => setTimeout(r, 500));
          
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (session?.user?.id) {
              await navigateAfterLogin(session.user.id, session.access_token, expectedRole);
              return;
            }
          } catch (getSessionError) {
            console.error("[OAuthCallback] getSession fallback error:", getSessionError);
          }

          // Last resort: DO NOT navigate to a protected page without a confirmed session.
          // This causes an infinite bounce (/customer -> ProtectedRoute -> /auth) when the real issue is CORS/network.
          console.error(
            "[OAuthCallback] All session methods failed (likely CORS/network). Staying on callback and showing error instead of redirecting.",
          );
          setError(
            "Giriş tamamlanamadı. Tarayıcı backend'e bağlanamıyor (CORS / ağ engeli). Lütfen Lovable Cloud > Authentication Settings > URL Configuration kısmında Site URL ve Redirect URL'leri kontrol edin ve /debug sayfasından 'Backend / Auth Bağlantı Testi'ni çalıştırın.",
          );
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
            await navigateAfterLogin(data.user.id, data.session?.access_token, expectedRole);
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
            cleanupUrl(url);
            await navigateAfterLogin(session.user.id, session.access_token, expectedRole);
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
