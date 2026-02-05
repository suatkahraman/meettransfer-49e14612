import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

export type OAuthProvider = "google" | "apple";

/**
 * Detect custom domain (not lovable.app / lovableproject.com).
 */
function isCustomDomain(): boolean {
  const host = window.location.hostname;
  // Check for Lovable managed domains
  const isLovableDomain = 
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host === "localhost";
  
  return !isLovableDomain;
}

/**
 * Allowed OAuth provider hostnames for security validation
 */
const ALLOWED_OAUTH_HOSTS = [
  "accounts.google.com",
  "appleid.apple.com",
];

/**
 * Starts OAuth sign-in.
 * 
 * On custom domains: Uses Supabase native OAuth with skipBrowserRedirect
 * to bypass the Lovable auth-bridge 404 issue.
 * 
 * On Lovable domains: Uses Lovable Cloud managed OAuth.
 */
export async function startOAuthSignIn(provider: OAuthProvider): Promise<{ error: Error | null }> {
  try {
    const customDomain = isCustomDomain();

    if (customDomain) {
      // Custom domain: bypass auth-bridge by getting OAuth URL directly
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/oauth/callback`,
          skipBrowserRedirect: true, // Critical: prevents automatic redirect by auth-bridge
        },
      });

      if (error) {
        return { error };
      }

      // Validate OAuth URL before redirect (security: prevent open redirect)
      if (data?.url) {
        const oauthUrl = new URL(data.url);
        if (!ALLOWED_OAUTH_HOSTS.some((host) => oauthUrl.hostname === host)) {
          return { error: new Error("Invalid OAuth redirect URL") };
        }
        window.location.href = data.url; // Manually redirect
      }

      return { error: null };
    }

    // Lovable domains: use managed OAuth
    const lovableAuth = createLovableAuth({});
    const result = await lovableAuth.signInWithOAuth(provider);

    if (result.redirected) {
      return { error: null };
    }

    if (result.error) {
      return { error: result.error };
    }

    if (result.tokens) {
      try {
        await supabase.auth.setSession(result.tokens);
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    }

    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}
