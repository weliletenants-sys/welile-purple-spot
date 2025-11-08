import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting pipeline tenant alert check...');

    // Calculate date 70 days ago
    const seventyDaysAgo = new Date();
    seventyDaysAgo.setDate(seventyDaysAgo.getDate() - 70);
    const cutoffDate = seventyDaysAgo.toISOString();

    console.log(`Checking for pipeline tenants older than: ${cutoffDate}`);

    // Fetch pipeline tenants older than 70 days
    const { data: oldPipelineTenants, error: tenantsError } = await supabaseClient
      .from('tenants')
      .select('id, name, contact, address, rent_amount, created_at')
      .eq('status', 'pipeline')
      .lt('created_at', cutoffDate);

    if (tenantsError) {
      console.error('Error fetching pipeline tenants:', tenantsError);
      throw tenantsError;
    }

    console.log(`Found ${oldPipelineTenants?.length || 0} old pipeline tenants`);

    if (!oldPipelineTenants || oldPipelineTenants.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pipeline tenants requiring alerts',
          count: 0 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check for existing notifications to avoid duplicates (within last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: existingNotifications, error: notifError } = await supabaseClient
      .from('notifications')
      .select('tenant_id')
      .eq('type', 'pipeline_overdue')
      .gte('created_at', oneDayAgo.toISOString());

    if (notifError) {
      console.error('Error checking existing notifications:', notifError);
    }

    const existingTenantIds = new Set(
      existingNotifications?.map(n => n.tenant_id) || []
    );

    // Create notifications for tenants that don't have recent alerts
    const notificationsToCreate = oldPipelineTenants
      .filter(tenant => !existingTenantIds.has(tenant.id))
      .map(tenant => {
        const daysWaiting = Math.floor(
          (new Date().getTime() - new Date(tenant.created_at).getTime()) / 
          (1000 * 60 * 60 * 24)
        );

        return {
          type: 'pipeline_overdue',
          severity: daysWaiting > 90 ? 'error' : 'warning',
          title: `Pipeline Tenant Waiting ${daysWaiting} Days`,
          message: `${tenant.name} (${tenant.contact}) has been in pipeline status for ${daysWaiting} days. Rent: UGX ${Number(tenant.rent_amount).toLocaleString()}. Address: ${tenant.address}`,
          tenant_id: tenant.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 7 days
        };
      });

    console.log(`Creating ${notificationsToCreate.length} new notifications`);

    if (notificationsToCreate.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notificationsToCreate);

      if (insertError) {
        console.error('Error creating notifications:', insertError);
        throw insertError;
      }

      console.log('Successfully created notifications');
    }

    // Clean up expired notifications
    const { error: deleteError } = await supabaseClient
      .from('notifications')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (deleteError) {
      console.error('Error deleting expired notifications:', deleteError);
    } else {
      console.log('Cleaned up expired notifications');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        totalOldTenants: oldPipelineTenants.length,
        newNotifications: notificationsToCreate.length,
        message: `Created ${notificationsToCreate.length} new alerts for ${oldPipelineTenants.length} old pipeline tenants`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in check-pipeline-alerts:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
