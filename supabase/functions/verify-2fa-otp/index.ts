import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VerifyOTPRequest {
  userId: string;
  otpCode: string;
  email?: string;
}

// Rate limiting configuration
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout after exceeding

// Minimum response time to prevent timing attacks (ms)
const MIN_RESPONSE_TIME_MS = 200;

// In-memory rate limit store (keyed by email for better security)
const rateLimitStore = new Map<string, { 
  count: number; 
  windowStart: number; 
  lockedUntil: number | null;
}>();

// Clean up old entries periodically
function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    // Remove entries that are past their lockout and window
    if (value.lockedUntil && now > value.lockedUntil) {
      rateLimitStore.delete(key);
    } else if (!value.lockedUntil && now > value.windowStart + RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}

interface RateLimitResult {
  allowed: boolean;
  locked: boolean;
  attemptsRemaining: number;
  retryAfterSeconds?: number;
}

function checkRateLimit(email: string): RateLimitResult {
  const now = Date.now();
  const normalizedEmail = email.toLowerCase().trim();
  
  // Cleanup if store is getting large
  if (rateLimitStore.size > 1000) {
    cleanupRateLimitStore();
  }
  
  const record = rateLimitStore.get(normalizedEmail);
  
  // No record - first attempt
  if (!record) {
    rateLimitStore.set(normalizedEmail, { 
      count: 1, 
      windowStart: now, 
      lockedUntil: null 
    });
    return { 
      allowed: true, 
      locked: false, 
      attemptsRemaining: RATE_LIMIT_MAX_ATTEMPTS - 1 
    };
  }
  
  // Check if currently locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { 
      allowed: false, 
      locked: true, 
      attemptsRemaining: 0,
      retryAfterSeconds
    };
  }
  
  // If lock expired, reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    rateLimitStore.set(normalizedEmail, { 
      count: 1, 
      windowStart: now, 
      lockedUntil: null 
    });
    return { 
      allowed: true, 
      locked: false, 
      attemptsRemaining: RATE_LIMIT_MAX_ATTEMPTS - 1 
    };
  }
  
  // Check if window has expired
  if (now > record.windowStart + RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(normalizedEmail, { 
      count: 1, 
      windowStart: now, 
      lockedUntil: null 
    });
    return { 
      allowed: true, 
      locked: false, 
      attemptsRemaining: RATE_LIMIT_MAX_ATTEMPTS - 1 
    };
  }
  
  // Within window - check count
  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    // Lock the account
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    const retryAfterSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    return { 
      allowed: false, 
      locked: true, 
      attemptsRemaining: 0,
      retryAfterSeconds
    };
  }
  
  // Increment count
  record.count++;
  return { 
    allowed: true, 
    locked: false, 
    attemptsRemaining: RATE_LIMIT_MAX_ATTEMPTS - record.count 
  };
}

function clearRateLimit(email: string): void {
  rateLimitStore.delete(email.toLowerCase().trim());
}

// Ensure consistent response time to prevent timing attacks
async function delayResponse(startTime: number): Promise<void> {
  const elapsed = Date.now() - startTime;
  if (elapsed < MIN_RESPONSE_TIME_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Restrict to POST only
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "method_not_allowed", message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { userId, otpCode, email }: VerifyOTPRequest = body;

    // Validate required fields
    if (!userId || !otpCode) {
      await delayResponse(startTime);
      return new Response(
        JSON.stringify({ success: false, error: "missing_fields", message: "Eksik alanlar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otpCode)) {
      await delayResponse(startTime);
      return new Response(
        JSON.stringify({ success: false, error: "invalid_format", message: "Kod 6 haneli olmalıdır" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email for rate limiting (more secure than userId)
    let userEmail = email;
    if (!userEmail) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      userEmail = userData?.user?.email || userId; // Fallback to userId if no email
    }

    // Check rate limit BEFORE attempting verification
    const rateLimit = checkRateLimit(userEmail);
    if (!rateLimit.allowed) {
      const headers: Record<string, string> = {
        ...corsHeaders,
        "Content-Type": "application/json",
      };
      if (rateLimit.retryAfterSeconds) {
        headers["Retry-After"] = String(rateLimit.retryAfterSeconds);
      }
      
      console.warn(`Rate limit exceeded for email: ${userEmail.substring(0, 3)}***, locked: ${rateLimit.locked}`);
      
      await delayResponse(startTime);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "rate_limit", 
          // Generic message to avoid leaking info
          message: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin.",
          locked: rateLimit.locked,
          retryAfter: rateLimit.retryAfterSeconds
        }),
        { status: 429, headers }
      );
    }

    // Verify OTP using the database function
    const { data: result, error: verifyError } = await supabase.rpc('verify_otp', {
      p_user_id: userId,
      p_otp_code: otpCode,
    });

    if (verifyError) {
      console.error("OTP verification error:", verifyError);
      await delayResponse(startTime);
      // Generic error message to avoid leaking info
      return new Response(
        JSON.stringify({ success: false, error: "verification_failed", message: "Doğrulama hatası" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!result || !result.success) {
      const errorType = result?.error || 'invalid';
      const duration = Date.now() - startTime;
      console.log(`OTP verification failed for user ${userId.substring(0, 8)}***: ${errorType} (remaining: ${rateLimit.attemptsRemaining}, duration: ${duration}ms)`);
      
      await delayResponse(startTime);
      
      // Return generic message to avoid leaking whether OTP exists/expired
      // Only differentiate for user experience when safe
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "invalid_code",
          // Generic message - don't reveal if code was expired vs invalid
          message: "Geçersiz veya süresi dolmuş kod.",
          attemptsRemaining: rateLimit.attemptsRemaining
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clear rate limit on successful verification
    clearRateLimit(userEmail);

    // Get user data for session creation
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user) {
      console.error("Failed to get user for session:", userError);
      await delayResponse(startTime);
      return new Response(
        JSON.stringify({ success: true, message: "Doğrulama başarılı", autoLogin: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link and extract the token for OTP verification
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
    });

    if (linkError || !linkData) {
      console.error("Failed to generate magic link:", linkError);
      await delayResponse(startTime);
      return new Response(
        JSON.stringify({ success: true, message: "Doğrulama başarılı", autoLogin: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the OTP token from the action link
    const actionLink = linkData.properties?.action_link;
    let tokenHash = '';
    
    if (actionLink) {
      try {
        const url = new URL(actionLink);
        tokenHash = url.searchParams.get('token') || '';
      } catch (e) {
        console.error("Failed to parse action link:", e);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`2FA OTP verified successfully for user: ${userId.substring(0, 8)}***, autoLogin: ${!!tokenHash} (duration: ${duration}ms)`);

    await delayResponse(startTime);
    
    // Return the token for client to use with verifyOtp
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Doğrulama başarılı",
        autoLogin: !!tokenHash,
        tokenHash: tokenHash,
        email: userData.user.email
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-2fa-otp function:", error);
    await delayResponse(startTime);
    return new Response(
      JSON.stringify({ success: false, error: "internal_error", message: "Bir hata oluştu" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
