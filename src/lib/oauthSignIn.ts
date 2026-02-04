import { lovable } from "@/integrations/lovable/index";

export type OAuthProvider = "google" | "apple";

/**
 * Starts OAuth sign-in using Lovable Cloud managed OAuth.
 * 
 * CRITICAL: Always use lovable.auth.signInWithOAuth() for social login.
 * Do NOT use supabase.auth.signInWithOAuth() directly - it requires BYOK setup.
 * 
 * The managed OAuth handles:
 * - OAuth client credentials (no BYOK needed)
 * - Redirect URI management
 * - Token exchange and session creation
 */
export async function startOAuthSignIn(provider: OAuthProvider): Promise<{ error: Error | null }> {
  // ALWAYS use Lovable managed OAuth - it handles credentials automatically.
  // iOS PWA fix: ensure we always land on our dedicated callback route.
  // This prevents "returned to homepage without being logged in" and makes the flow deterministic.
  const { error } = await lovable.auth.signInWithOAuth(provider, {
    redirect_uri: `${window.location.origin}/~oauth/callback`,
  });
  return { error: error ?? null };
}
