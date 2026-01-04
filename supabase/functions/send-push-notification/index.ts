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

// Helper to ensure proper ArrayBuffer type
function toBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

// Base64URL encoding/decoding utilities
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Create VAPID JWT using JWK format
async function createVapidJwt(audience: string, subject: string, privateKeyBase64: string, publicKeyBase64: string): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Decode the raw keys
  const privateKeyRaw = base64UrlDecode(privateKeyBase64);
  const publicKeyRaw = base64UrlDecode(publicKeyBase64);
  
  console.log("Private key length:", privateKeyRaw.length, "Public key length:", publicKeyRaw.length);
  
  // Extract x and y coordinates from uncompressed public key (65 bytes: 0x04 + 32 bytes x + 32 bytes y)
  let x: Uint8Array, y: Uint8Array;
  if (publicKeyRaw.length === 65 && publicKeyRaw[0] === 0x04) {
    x = publicKeyRaw.slice(1, 33);
    y = publicKeyRaw.slice(33, 65);
  } else {
    throw new Error(`Invalid public key format. Length: ${publicKeyRaw.length}`);
  }

  // Create JWK for the private key
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(x),
    y: base64UrlEncode(y),
    d: base64UrlEncode(privateKeyRaw),
  };

  console.log("Importing key with JWK...");
  
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  console.log("Key imported, signing...");

  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  // WebCrypto returns signature in IEEE P1363 format (r || s), which is what JWT needs
  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuffer));
  
  console.log("JWT signed successfully");
  return `${unsignedToken}.${signatureB64}`;
}

// HKDF implementation using native crypto
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  // Import IKM as HKDF key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toBuffer(ikm),
    "HKDF",
    false,
    ["deriveBits"]
  );

  // Use actual salt or default 32-byte zero salt
  const actualSalt = salt.length > 0 ? salt : new Uint8Array(32);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toBuffer(actualSalt),
      info: toBuffer(info),
    },
    keyMaterial,
    length * 8
  );

  return new Uint8Array(derivedBits);
}

// Encrypt payload using aes128gcm (RFC 8291)
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<Uint8Array> {
  // Generate local ephemeral key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  
  const localPublicKeyBuffer = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyBuffer);
  
  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64UrlDecode(p256dhKey);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    toBuffer(subscriberPublicKeyBytes),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  
  // Derive shared secret using ECDH
  const sharedSecretBuffer = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBuffer);
  
  // Auth secret and random salt
  const authSecretBytes = base64UrlDecode(authSecret);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const encoder = new TextEncoder();
  
  // Create auth_info for IKM derivation: "WebPush: info\0" + ua_public + as_public
  const authInfoPrefix = encoder.encode("WebPush: info\x00");
  const authInfo = new Uint8Array(authInfoPrefix.length + subscriberPublicKeyBytes.length + localPublicKey.length);
  authInfo.set(authInfoPrefix);
  authInfo.set(subscriberPublicKeyBytes, authInfoPrefix.length);
  authInfo.set(localPublicKey, authInfoPrefix.length + subscriberPublicKeyBytes.length);
  
  // Derive IKM from shared secret
  const ikm = await hkdf(authSecretBytes, sharedSecret, authInfo, 32);
  
  // Derive Content Encryption Key (CEK)
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\x00");
  const cek = await hkdf(salt, ikm, cekInfo, 16);
  
  // Derive nonce
  const nonceInfo = encoder.encode("Content-Encoding: nonce\x00");
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);
  
  // Prepare plaintext: payload + 0x02 (record delimiter)
  const payloadBytes = encoder.encode(payload);
  const plaintext = new Uint8Array(payloadBytes.length + 1);
  plaintext.set(payloadBytes);
  plaintext[payloadBytes.length] = 2; // Record delimiter
  
  // Encrypt with AES-GCM
  const aesKey = await crypto.subtle.importKey("raw", toBuffer(cek), { name: "AES-GCM" }, false, ["encrypt"]);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toBuffer(nonce), tagLength: 128 },
    aesKey,
    toBuffer(plaintext)
  );
  const encryptedData = new Uint8Array(encryptedBuffer);
  
  // Build aes128gcm header: salt (16) + rs (4) + idlen (1) + keyid (65)
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicKey.length);
  header.set(salt, 0);
  header[16] = (rs >> 24) & 0xff;
  header[17] = (rs >> 16) & 0xff;
  header[18] = (rs >> 8) & 0xff;
  header[19] = rs & 0xff;
  header[20] = localPublicKey.length;
  header.set(localPublicKey, 21);
  
  // Combine header + encrypted data
  const result = new Uint8Array(header.length + encryptedData.length);
  result.set(header);
  result.set(encryptedData, header.length);
  
  return result;
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

          console.log(`Sending to endpoint: ${endpoint.substring(0, 60)}...`);

          // Create VAPID JWT with both private and public keys
          const jwt = await createVapidJwt(audience, "mailto:support@meettransfer.com", vapidPrivateKey, vapidPublicKey);

          // Encrypt the payload
          const encrypted = await encryptPayload(payload, sub.p256dh, sub.auth);
          console.log("Payload encrypted, size:", encrypted.length);

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Encoding": "aes128gcm",
              "Content-Length": encrypted.length.toString(),
              "TTL": "86400",
              "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
              "Urgency": "high",
            },
            body: toBuffer(encrypted)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Push failed: ${response.status} - ${errorText}`);
            
            // Remove invalid subscriptions
            if (response.status === 404 || response.status === 410) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
              console.log("Removed invalid subscription");
            }
            return { success: false, endpoint: endpoint.substring(0, 50), status: response.status, error: errorText };
          }

          console.log("Push sent successfully to:", endpoint.substring(0, 50));
          return { success: true, endpoint: endpoint.substring(0, 50) };
        } catch (error) {
          console.error("Error sending push:", error);
          return { success: false, endpoint: sub.endpoint.substring(0, 50), error: String(error) };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`Push results: ${successCount}/${results.length} successful`);

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
