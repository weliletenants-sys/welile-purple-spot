import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { reportType } = await req.json();
    const today = new Date().toISOString().split('T')[0];
    
    let startDate: string;
    let endDate: string = today;

    // Calculate date range based on report type
    if (reportType === 'daily') {
      startDate = today;
    } else if (reportType === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
    } else if (reportType === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
    } else {
      throw new Error('Invalid report type');
    }

    // Fetch tenants
    const { data: tenants } = await supabase
      .from('tenants')
      .select('*');

    // Fetch payments for the period
    const { data: payments } = await supabase
      .from('daily_payments')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    // Fetch withdrawals for the period
    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Calculate statistics
    const totalTenants = tenants?.length || 0;
    const totalPayments = payments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0;
    const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
    const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending').length || 0;

    // Top performing agents
    const agentStats: Record<string, number> = {};
    
    for (const payment of payments || []) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('agent_name')
        .eq('id', payment.tenant_id)
        .single();
      
      if (tenant?.agent_name) {
        agentStats[tenant.agent_name] = (agentStats[tenant.agent_name] || 0) + (Number(payment.paid_amount) || 0);
      }
    }

    const topAgents = Object.entries(agentStats)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount: amount as number }));

    const reportData = {
      period: { startDate, endDate },
      totalTenants,
      totalPayments,
      totalWithdrawals,
      pendingWithdrawals,
      topAgents,
      generatedAt: new Date().toISOString()
    };

    // Save report to database
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        report_type: reportType,
        report_date: today,
        data: reportData
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, data: reportData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
