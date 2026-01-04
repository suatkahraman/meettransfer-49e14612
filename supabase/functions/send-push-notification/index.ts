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

// Helper to convert Uint8Array to proper ArrayBuffer
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
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

// Convert raw private key (32 bytes) to PKCS8 format for P-256
function rawPrivateKeyToPKCS8(rawKey: Uint8Array): ArrayBuffer {
  const pkcs8Header = new Uint8Array([
    0x30, 0x41,
    0x02, 0x01, 0x00,
    0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
    0x04, 0x27,
    0x30, 0x25,
    0x02, 0x01, 0x01,
    0x04, 0x20,
  ]);
  
  const pkcs8 = new Uint8Array(pkcs8Header.length + rawKey.length);
  pkcs8.set(pkcs8Header);
  pkcs8.set(rawKey, pkcs8Header.length);
  return toArrayBuffer(pkcs8);
}

// Create VAPID JWT token
async function createVapidJwt(audience: string, subject: string, privateKeyBase64: string): Promise<string> {
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

  const privateKeyRaw = base64UrlDecode(privateKeyBase64);
  console.log("Private key length:", privateKeyRaw.length);
  
  let privateKey: CryptoKey;
  
  if (privateKeyRaw.length === 32) {
    const pkcs8Key = rawPrivateKeyToPKCS8(privateKeyRaw);
    privateKey = await crypto.subtle.importKey(
      "pkcs8",
      pkcs8Key,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );
  } else {
    const keyBuffer = toArrayBuffer(privateKeyRaw);
    privateKey = await crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );
  }

  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signature = new Uint8Array(signatureBuffer);
  let r: Uint8Array, s: Uint8Array;
  
  if (signature.length === 64) {
    r = signature.slice(0, 32);
    s = signature.slice(32, 64);
  } else {
    let offset = 2;
    if (signature[offset] !== 0x02) throw new Error("Invalid DER signature");
    offset++;
    const rLen = signature[offset++];
    const rBytes = signature.slice(offset, offset + rLen);
    offset += rLen;
    if (signature[offset] !== 0x02) throw new Error("Invalid DER signature");
    offset++;
    const sLen = signature[offset++];
    const sBytes = signature.slice(offset, offset + sLen);
    
    r = new Uint8Array(32);
    s = new Uint8Array(32);
    const rStart = rBytes[0] === 0 ? 1 : 0;
    const sStart = sBytes[0] === 0 ? 1 : 0;
    r.set(rBytes.slice(rStart), 32 - (rBytes.length - rStart));
    s.set(sBytes.slice(sStart), 32 - (sBytes.length - sStart));
  }
  
  const rawSignature = new Uint8Array(64);
  rawSignature.set(r, 0);
  rawSignature.set(s, 32);

  const signatureB64 = base64UrlEncode(rawSignature);
  return `${unsignedToken}.${signatureB64}`;
}

// HKDF for key derivation
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const saltBuffer: ArrayBuffer = salt.length > 0 
    ? toArrayBuffer(salt)
    : new ArrayBuffer(32);
  const ikmBuffer = toArrayBuffer(ikm);
  
  const key = await crypto.subtle.importKey("raw", ikmBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prkBuffer = await crypto.subtle.sign("HMAC", key, saltBuffer);
  const prk = new Uint8Array(prkBuffer);
  
  const prkKeyBuffer = toArrayBuffer(prk);
  const prkKey = await crypto.subtle.importKey("raw", prkKeyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = new Uint8Array(info.length + 1);
  infoWithCounter.set(info);
  infoWithCounter[info.length] = 1;
  const infoBuffer = toArrayBuffer(infoWithCounter);
  const okmBuffer = await crypto.subtle.sign("HMAC", prkKey, infoBuffer);
  return new Uint8Array(okmBuffer).slice(0, length);
}

// Encrypt payload using aes128gcm
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  
  const localPublicKeyBuffer = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyBuffer);
  
  const subscriberPublicKeyBytes = base64UrlDecode(p256dhKey);
  const subscriberKeyBuffer = toArrayBuffer(subscriberPublicKeyBytes);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberKeyBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  
  const sharedSecretBuffer = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBuffer);
  
  const authSecretBytes = base64UrlDecode(authSecret);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const encoder = new TextEncoder();
  const authInfo = encoder.encode("WebPush: info\x00");
  const authInfoFull = new Uint8Array(authInfo.length + subscriberPublicKeyBytes.length + localPublicKey.length);
  authInfoFull.set(authInfo);
  authInfoFull.set(subscriberPublicKeyBytes, authInfo.length);
  authInfoFull.set(localPublicKey, authInfo.length + subscriberPublicKeyBytes.length);
  
  const ikm = await hkdf(authSecretBytes, sharedSecret, authInfoFull, 32);
  
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\x00");
  const cek = await hkdf(salt, ikm, cekInfo, 16);
  
  const nonceInfo = encoder.encode("Content-Encoding: nonce\x00");
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);
  
  const payloadBytes = encoder.encode(payload);
  const plaintext = new Uint8Array(payloadBytes.length + 1);
  plaintext.set(payloadBytes);
  plaintext[payloadBytes.length] = 2;
  
  const cekBuffer = toArrayBuffer(cek);
  const nonceBuffer = toArrayBuffer(nonce);
  const plaintextBuffer = toArrayBuffer(plaintext);
  
  const aesKey = await crypto.subtle.importKey("raw", cekBuffer, { name: "AES-GCM" }, false, ["encrypt"]);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonceBuffer, tagLength: 128 },
    aesKey,
    plaintextBuffer
  );
  const encryptedData = new Uint8Array(encryptedBuffer);
  
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicKey.length);
  header.set(salt, 0);
  header[16] = (rs >> 24) & 0xff;
  header[17] = (rs >> 16) & 0xff;
  header[18] = (rs >> 8) & 0xff;
  header[19] = rs & 0xff;
  header[20] = localPublicKey.length;
  header.set(localPublicKey, 21);
  
  const encrypted = new Uint8Array(header.length + encryptedData.length);
  encrypted.set(header);
  encrypted.set(encryptedData, header.length);
  
  return { encrypted, salt, localPublicKey };
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

          console.log(`Sending to endpoint: ${endpoint.substring(0, 50)}...`);

          const jwt = await createVapidJwt(audience, "mailto:support@meettransfer.com", vapidPrivateKey);
          console.log("JWT created successfully");

          const { encrypted } = await encryptPayload(payload, sub.p256dh, sub.auth);
          console.log("Payload encrypted, size:", encrypted.length);

          const encryptedBuffer = toArrayBuffer(encrypted);

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
            body: encryptedBuffer
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Push failed: ${response.status} - ${errorText}`);
            
            if (response.status === 404 || response.status === 410) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
              console.log("Removed invalid subscription");
            }
            return { success: false, endpoint: endpoint.substring(0, 50), status: response.status, error: errorText };
          }

          console.log("Push notification sent successfully!");
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
