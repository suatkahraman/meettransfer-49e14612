import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteAccountRequest {
  userId: string;
  confirmationText: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Get authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "unauthorized", message: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { userId, confirmationText }: DeleteAccountRequest = body;

    // Validate required fields
    if (!userId || !confirmationText) {
      return new Response(
        JSON.stringify({ success: false, error: "missing_fields", message: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate confirmation text (SİL or DELETE)
    const validConfirmations = ['SİL', 'DELETE', 'SIL'];
    if (!validConfirmations.includes(confirmationText.toUpperCase())) {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_confirmation", message: "Invalid confirmation text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "unauthorized", message: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure the user is deleting their own account
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: "forbidden", message: "Cannot delete another user's account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting GDPR-compliant account deletion for user: ${userId}`);

    // Step 1: Anonymize reservations (keep for legal/accounting purposes)
    // Instead of deleting, we set customer info to anonymous values
    const { error: reservationError } = await supabase
      .from('reservations')
      .update({
        customer_name: 'Deleted User',
        customer_phone: '+00000000000',
        customer_id: null,
        customer_notes: null,
        passenger_names: null,
      })
      .eq('customer_id', userId);

    if (reservationError) {
      console.error('Error anonymizing reservations:', reservationError);
      // Continue with deletion even if this fails
    }

    // Step 2: Delete quick booking requests customer info
    const { error: quickBookingError } = await supabase
      .from('quick_booking_requests')
      .update({
        customer_name: 'Deleted User',
        customer_phone: '+00000000000',
        customer_email: null,
        customer_notes: null,
      })
      .eq('customer_email', user.email);

    if (quickBookingError) {
      console.error('Error anonymizing quick bookings:', quickBookingError);
    }

    // Step 3: Delete trusted devices
    const { error: devicesError } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('user_id', userId);

    if (devicesError) {
      console.error('Error deleting trusted devices:', devicesError);
    }

    // Step 4: Delete two factor OTPs
    const { error: otpError } = await supabase
      .from('two_factor_otp')
      .delete()
      .eq('user_id', userId);

    if (otpError) {
      console.error('Error deleting OTPs:', otpError);
    }

    // Step 5: Delete login attempts (anonymize for security logs)
    const { error: loginError } = await supabase
      .from('login_attempts')
      .update({
        email: 'deleted@user.com',
        user_id: null,
      })
      .eq('user_id', userId);

    if (loginError) {
      console.error('Error anonymizing login attempts:', loginError);
    }

    // Step 6: Delete notifications
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError);
    }

    // Step 7: Delete push subscriptions
    const { error: pushError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (pushError) {
      console.error('Error deleting push subscriptions:', pushError);
    }

    // Step 8: Delete user roles
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error deleting user roles:', rolesError);
    }

    // Step 9: Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // Step 10: Delete audit logs for user
    const { error: auditError } = await supabase
      .from('audit_logs')
      .update({
        user_email: 'deleted@user.com',
      })
      .eq('user_id', userId);

    if (auditError) {
      console.error('Error anonymizing audit logs:', auditError);
    }

    // Step 11: Delete the auth user (this is the final step)
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "deletion_failed", 
          message: "Failed to delete user account" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`Account deletion completed for user: ${userId} (duration: ${duration}ms)`);

    // Send confirmation email if possible
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY && user.email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Meet Transfer <onboarding@resend.dev>",
            to: [user.email],
            subject: "Account Deletion Confirmation - Meet Transfer",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
              </head>
              <body style="font-family: sans-serif; padding: 20px;">
                <h2>Account Deleted</h2>
                <p>Your Meet Transfer account has been permanently deleted as requested.</p>
                <p>All your personal data has been removed in accordance with GDPR regulations.</p>
                <p>If you did not request this deletion, please contact us immediately.</p>
                <br>
                <p>Best regards,<br>Meet Transfer Team</p>
              </body>
              </html>
            `,
          }),
        });
      }
    } catch (emailError) {
      console.error('Failed to send deletion confirmation email:', emailError);
      // Don't fail the deletion for email errors
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account deleted successfully",
        deletedAt: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in delete-user-account function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "internal_error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
