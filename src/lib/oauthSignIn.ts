import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

export type OAuthProvider = "google" | "apple";

/**
 * Detect custom domain (not lovable.app / lovableproject.com).
 */
function isCustomDomain(): boolean {
  const host = window.location.hostname;
  return (
    !host.endsWith(".lovable.app") &&
    !host.endsWith(".lovableproject.com") &&
    host !== "localhost"
  );
}

/**
 * We create our own LovableAuth instance with an ABSOLUTE broker URL when on a custom domain.
 * This bypasses any proxy issues on the custom domain and ensures /~oauth/initiate reaches Lovable infra.
 */
function getLovableAuth() {
  const useAbsoluteBroker = isCustomDomain();
  return createLovableAuth({
    // On custom domain, point directly to the published lovable.app backend where the broker exists.
    // On lovable.app domains the default relative /~oauth/initiate works fine.
    oauthBrokerUrl: useAbsoluteBroker
      ? "https://meettransfer.lovable.app/~oauth/initiate"
      : undefined,
  });
}

/**
 * Starts OAuth sign-in using Lovable Cloud managed OAuth.
 *
 * CRITICAL: Always use this function for social login (Google/Apple).
 * Do NOT use supabase.auth.signInWithOAuth() directly - it requires BYOK setup.
 *
 * The managed OAuth handles:
 * - OAuth client credentials (no BYOK needed)
 * - Redirect URI management
 * - Token exchange and session creation
 */
export async function startOAuthSignIn(provider: OAuthProvider): Promise<{ error: Error | null }> {
  const lovableAuth = getLovableAuth();

  // CRITICAL: Do NOT pass redirect_uri explicitly!
  // Passing redirect_uri breaks the library's internal state parameter management,
  // causing "Missing state parameter" errors on callback.
  // The library handles redirect_uri internally and returns to current origin.
  const result = await lovableAuth.signInWithOAuth(provider);

  // If the library redirected (full-page navigation), nothing more to do here.
  if (result.redirected) {
    return { error: null };
  }

  // Handle popup / web_message flow (iframe scenario)
  if (result.error) {
    return { error: result.error };
  }

  // Set session from tokens
  if (result.tokens) {
    try {
      await supabase.auth.setSession(result.tokens);
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  }

  return { error: null };
}
