import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { setup_key } = await req.json();
    
    // Verify the setup key
    const validSetupKey = Deno.env.get('ADMIN_SETUP_KEY');
    if (!setup_key || setup_key !== validSetupKey) {
      console.error('Invalid setup key provided');
      return new Response(
        JSON.stringify({ error: 'Invalid setup key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Find the admin user by email
    const adminEmail = 'sautkahraman@gmail.com';
    const newPassword = 'Meet2025';

    console.log('Looking up admin user by email:', adminEmail);

    // List users to find the admin
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to list users', details: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminUser = usersData.users.find(u => u.email === adminEmail);
    
    if (!adminUser) {
      console.error('Admin user not found with email:', adminEmail);
      return new Response(
        JSON.stringify({ error: 'Admin user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found admin user, updating password for user ID:', adminUser.id);

    // Update the password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update password', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password successfully reset for admin user');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin password has been reset successfully',
        email: adminEmail
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
