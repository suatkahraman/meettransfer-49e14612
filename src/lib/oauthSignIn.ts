import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export type OAuthProvider = "google" | "apple";

// Helper to detect if we're on a custom domain (not Lovable's domains)
export const isCustomDomain = () => {
  const hostname = window.location.hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isLovableHosted = hostname.endsWith("lovable.app") || hostname.endsWith("lovableproject.com");
  return !isLocal && !isLovableHosted;
};

const getOAuthReturnTo = () => `${window.location.origin}/~oauth/callback`;

const isSafeOAuthRedirectUrl = (url: string) => {
  try {
    const u = new URL(url);
    const backendHost = new URL(import.meta.env.VITE_SUPABASE_URL).hostname;
    // Expect the provider authorization URL served by our backend
    return u.hostname === backendHost && u.pathname.startsWith("/auth/v1/authorize");
  } catch {
    return false;
  }
};

/**
 * Gets the OAuth authorization URL using the backend authorize endpoint.
 * We use skipBrowserRedirect so we can validate the URL before redirecting.
 */
export async function getOAuthUrl(provider: OAuthProvider): Promise<{ url: string | null; error: Error | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getOAuthReturnTo(),
      skipBrowserRedirect: true,
    },
  });

  if (error) return { url: null, error };

  if (!data?.url || !isSafeOAuthRedirectUrl(data.url)) {
    return { url: null, error: new Error("Unsafe OAuth redirect URL") };
  }

  return { url: data.url, error: null };
}

/**
 * Starts OAuth sign-in.
 *
 * We prefer the backend "authorize -> code" flow (via getOAuthUrl) because some environments
 * can reject the managed id_token grant with an "Unacceptable audience" error.
 * If the provider isn't enabled for the standard flow, we fall back to managed OAuth.
 */
export async function startOAuthSignIn(provider: OAuthProvider): Promise<{ error: Error | null }> {
  const isIOSDevice = (() => {
    try {
      const ua = navigator.userAgent || "";
      const iOS = /iPad|iPhone|iPod/i.test(ua);
      const iPadOS = ua.includes("Mac") && (navigator as any).maxTouchPoints > 1;
      return iOS || iPadOS;
    } catch {
      return false;
    }
  })();

  // 1) Prefer standard OAuth (PKCE/code) and manually redirect after validating returned URL.
  try {
    const { url, error } = await getOAuthUrl(provider);
    if (!error && url) {
      window.location.assign(url);
      return { error: null };
    }

    // On iOS, managed OAuth can lead to a "redirect but not signed in" experience.
    // If standard OAuth fails, surface the error instead of silently falling back.
    if (isIOSDevice && error) {
      return { error };
    }
  } catch {
    // ignore and fall back to managed OAuth
  }

  // 2) Fallback: managed OAuth (no redirect_uri passed; library manages state).
  const { error } = await lovable.auth.signInWithOAuth(provider);
  return { error: error ?? null };
}
