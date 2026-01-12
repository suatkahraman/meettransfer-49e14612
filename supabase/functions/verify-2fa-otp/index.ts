import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  userId: string;
  otpCode: string;
}

// Rate limiting: max 10 verification attempts per user per 5 minutes
const verifyRateLimit = new Map<string, { count: number; resetAt: number; blocked: boolean }>();

const checkRateLimit = (userId: string): { allowed: boolean; remaining: number; blocked: boolean } => {
  const now = Date.now();
  const limit = verifyRateLimit.get(userId);
  const maxAttempts = 10;
  const windowMs = 300000; // 5 minutes
  const blockDuration = 900000; // 15 minutes block after exceeding
  
  if (!limit || now > limit.resetAt) {
    verifyRateLimit.set(userId, { count: 1, resetAt: now + windowMs, blocked: false });
    return { allowed: true, remaining: maxAttempts - 1, blocked: false };
  }
  
  // Check if blocked
  if (limit.blocked && now < limit.resetAt) {
    return { allowed: false, remaining: 0, blocked: true };
  }
  
  if (limit.count >= maxAttempts) {
    // Block for longer period
    verifyRateLimit.set(userId, { count: limit.count, resetAt: now + blockDuration, blocked: true });
    return { allowed: false, remaining: 0, blocked: true };
  }
  
  limit.count++;
  return { allowed: true, remaining: maxAttempts - limit.count, blocked: false };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { userId, otpCode }: VerifyOTPRequest = body;

    // Validate required fields
    if (!userId || !otpCode) {
      return new Response(
        JSON.stringify({ success: false, error: "missing_fields", message: "Eksik alanlar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otpCode)) {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_format", message: "Kod 6 haneli olmalıdır" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      const message = rateLimit.blocked 
        ? "Çok fazla hatalı deneme. 15 dakika bekleyin."
        : "Çok fazla istek. Lütfen bekleyin.";
      
      console.warn(`Rate limit exceeded for user: ${userId}, blocked: ${rateLimit.blocked}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "rate_limit", 
          message,
          blocked: rateLimit.blocked
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify OTP using the database function
    const { data: result, error: verifyError } = await supabase.rpc('verify_otp', {
      p_user_id: userId,
      p_otp_code: otpCode,
    });

    if (verifyError) {
      console.error("OTP verification error:", verifyError);
      return new Response(
        JSON.stringify({ success: false, error: "verification_failed", message: "Doğrulama hatası" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!result || !result.success) {
      const errorType = result?.error || 'invalid';
      const duration = Date.now() - startTime;
      console.log(`OTP verification failed for user ${userId}: ${errorType} (remaining: ${rateLimit.remaining}, duration: ${duration}ms)`);
      
      // Map error types to user-friendly messages
      const errorMessages: Record<string, string> = {
        expired: 'Kod süresi dolmuş. Yeni kod gönderin.',
        invalid: 'Geçersiz kod.',
        not_found: 'Doğrulama kodu bulunamadı.',
        already_verified: 'Bu kod zaten kullanılmış.',
      };
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorType,
          message: errorMessages[errorType] || 'Doğrulama başarısız.',
          attemptsRemaining: rateLimit.remaining
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clear rate limit on successful verification
    verifyRateLimit.delete(userId);

    // Generate a magic link token for auto-login after 2FA
    // Use admin API to create a session for the user
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user) {
      console.error("Failed to get user for session:", userError);
      return new Response(
        JSON.stringify({ success: true, message: "Doğrulama başarılı", autoLogin: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link for the user to auto-login
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://meettransfer.app'}/auth/callback`,
      }
    });

    if (linkError) {
      console.error("Failed to generate magic link:", linkError);
      // Still return success, user will need to login manually
      return new Response(
        JSON.stringify({ success: true, message: "Doğrulama başarılı", autoLogin: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`2FA OTP verified successfully for user: ${userId} (duration: ${duration}ms)`);

    // Return the magic link token for client to use
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Doğrulama başarılı",
        autoLogin: true,
        // Extract the token from the magic link
        magicLinkToken: linkData.properties?.hashed_token,
        email: userData.user.email
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-2fa-otp function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "internal_error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
