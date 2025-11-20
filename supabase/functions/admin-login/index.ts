import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessCode } = await req.json();
    
    console.log('Admin login attempt received');

    // Verify access code
    const ADMIN_ACCESS_CODE = "Mypart@welile";
    
    if (accessCode !== ADMIN_ACCESS_CODE) {
      console.log('Invalid access code provided');
      return new Response(
        JSON.stringify({ error: 'Invalid access code' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with service role to check for admin user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the first admin user from user_roles
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (rolesError || !adminRoles) {
      console.error('No admin user found:', rolesError);
      return new Response(
        JSON.stringify({ error: 'No admin account exists. Please create one first.' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user details
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      adminRoles.user_id
    );

    if (userError || !user) {
      console.error('Error getting admin user:', userError);
      return new Response(
        JSON.stringify({ error: 'Admin user not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate access tokens for the admin user using recovery type
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: user.email!,
    });

    if (linkError || !linkData) {
      console.error('Error generating session:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract tokens from the action link URL
    const actionLinkUrl = new URL(linkData.properties.action_link);
    const accessToken = actionLinkUrl.searchParams.get('access_token');
    const refreshToken = actionLinkUrl.searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      console.error('Failed to extract tokens from action link');
      return new Response(
        JSON.stringify({ error: 'Failed to create session tokens' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Admin login successful for user:', user.email);

    return new Response(
      JSON.stringify({ 
        success: true,
        session: {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
        user: linkData.user
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in admin-login function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
