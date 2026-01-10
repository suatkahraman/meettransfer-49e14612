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
const verifyRateLimit = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (userId: string): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  const limit = verifyRateLimit.get(userId);
  const maxAttempts = 10;
  const windowMs = 300000; // 5 minutes
  
  if (!limit || now > limit.resetAt) {
    verifyRateLimit.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  if (limit.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  
  limit.count++;
  return { allowed: true, remaining: maxAttempts - limit.count };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, otpCode }: VerifyOTPRequest = await req.json();

    // Validate required fields
    if (!userId || !otpCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otpCode)) {
      return new Response(
        JSON.stringify({ success: false, error: "invalid", message: "OTP must be 6 digits" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for user: ${userId}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "rate_limit", 
          message: "Too many verification attempts. Please wait 5 minutes." 
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
        JSON.stringify({ success: false, error: "verification_failed", message: verifyError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!result || !result.success) {
      const errorType = result?.error || 'invalid';
      console.log(`OTP verification failed for user ${userId}: ${errorType}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorType,
          attemptsRemaining: rateLimit.remaining
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clear rate limit on successful verification
    verifyRateLimit.delete(userId);

    console.log(`2FA OTP verified successfully for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true }),
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
