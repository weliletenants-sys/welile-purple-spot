import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentSummary {
  agent_name: string;
  agent_phone: string;
  total_earnings: number;
  tenants_added: number;
  rank: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { period = 'daily' } = await req.json();
    
    console.log(`Generating ${period} earnings summary...`);

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Weekly - last 7 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    const startDateStr = startDate.toISOString();

    // Get all active agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('name, phone')
      .eq('is_active', true);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      throw agentsError;
    }

    console.log(`Found ${agents?.length || 0} active agents`);

    // Calculate summaries for each agent
    const summaries: AgentSummary[] = [];

    for (const agent of agents || []) {
      // Get earnings for the period (excluding withdrawals)
      const { data: earnings } = await supabase
        .from('agent_earnings')
        .select('amount')
        .eq('agent_phone', agent.phone)
        .neq('earning_type', 'withdrawal')
        .gte('created_at', startDateStr);

      const totalEarnings = earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Get tenants added in the period
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('agent_phone', agent.phone)
        .gte('created_at', startDateStr);

      const tenantsAdded = tenants?.length || 0;

      if (totalEarnings > 0 || tenantsAdded > 0) {
        summaries.push({
          agent_name: agent.name,
          agent_phone: agent.phone,
          total_earnings: totalEarnings,
          tenants_added: tenantsAdded,
          rank: 0, // Will be set after sorting
        });
      }
    }

    // Sort by earnings and assign ranks
    summaries.sort((a, b) => b.total_earnings - a.total_earnings);
    summaries.forEach((summary, index) => {
      summary.rank = index + 1;
    });

    console.log(`Generated ${summaries.length} summaries`);

    // Create notifications for each agent
    const notifications = summaries.map(summary => {
      const periodLabel = period === 'daily' ? 'Daily' : 'Weekly';
      const emoji = summary.rank === 1 ? '🏆' : summary.rank <= 3 ? '🥈' : '📊';
      
      return {
        type: 'earnings_summary',
        title: `${emoji} ${periodLabel} Earnings Summary`,
        message: `You earned UGX ${summary.total_earnings.toLocaleString()} and added ${summary.tenants_added} tenant${summary.tenants_added !== 1 ? 's' : ''}. You're ranked #${summary.rank} out of ${summaries.length} agents!`,
        severity: summary.rank <= 3 ? 'success' : 'info',
        metadata: {
          agent_name: summary.agent_name,
          agent_phone: summary.agent_phone,
          period,
          earnings: summary.total_earnings,
          tenants_added: summary.tenants_added,
          rank: summary.rank,
          total_agents: summaries.length,
        },
      };
    });

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
        throw notificationError;
      }
    }

    console.log(`Created ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        period,
        summaries_generated: summaries.length,
        notifications_sent: notifications.length,
        summaries: summaries.slice(0, 10), // Return top 10 for debugging
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-earnings-summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
