import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushRequest {
  user_id: string;
  title: string;
  body: string;
  url?: string;
}

// Base64URL encoding for VAPID
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Create VAPID JWT token
async function createVapidJwt(audience: string, privateKeyBase64: string, publicKeyBase64: string): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: "mailto:support@meettransfer.com"
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyRaw = Uint8Array.from(atob(privateKeyBase64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyRaw,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  return `${unsignedToken}.${signatureB64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, url }: PushRequest = await req.json();

    console.log(`Sending push notification to user: ${user_id}`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for user");
      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} subscription(s)`);

    const payload = JSON.stringify({
      title,
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      url: url || "/",
      timestamp: Date.now()
    });

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const endpoint = sub.endpoint;
          const endpointUrl = new URL(endpoint);
          const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

          // For simplicity, using basic authentication header approach
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Encoding": "aes128gcm",
              "TTL": "86400",
              "Authorization": `vapid t=${vapidPublicKey}, k=${vapidPublicKey}`,
            },
            body: payload
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Push failed for endpoint: ${response.status} - ${errorText}`);
            
            // Remove invalid subscriptions
            if (response.status === 404 || response.status === 410) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
              console.log("Removed invalid subscription");
            }
            return { success: false, endpoint };
          }

          console.log("Push notification sent successfully");
          return { success: true, endpoint };
        } catch (error) {
          console.error("Error sending push:", error);
          return { success: false, endpoint: sub.endpoint, error: String(error) };
        }
      })
    );

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
