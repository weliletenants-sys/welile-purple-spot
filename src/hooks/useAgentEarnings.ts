import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface AgentEarning {
  agentName: string;
  agentPhone: string;
  earnedCommission: number;
  expectedCommission: number;
  withdrawnCommission: number;
  earningsCount: number;
  tenantsCount: number;
}

export const useAgentEarnings = (period?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agentEarnings", period],
    queryFn: async () => {
      // Get all tenants grouped by agent
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("agent_name, agent_phone, rent_amount");

      if (tenantsError) {
        console.error("Error fetching tenants:", tenantsError);
        throw tenantsError;
      }

      // Get earnings filtered by period
      let earningsQuery = supabase
        .from("agent_earnings")
        .select("*");

      if (period && period !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
          case "daily":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "weekly":
            startDate.setDate(now.getDate() - 7);
            break;
          case "monthly":
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        earningsQuery = earningsQuery.gte("created_at", startDate.toISOString());
      }

      const { data: earnings, error: earningsError } = await earningsQuery;

      if (earningsError) {
        console.error("Error fetching agent earnings:", earningsError);
        throw earningsError;
      }

      // Group by agent name (to remove duplicates by name)
      const agentMap = new Map<string, AgentEarning>();
      
      // Calculate expected commission from tenants
      tenants?.forEach((tenant: any) => {
        if (!tenant.agent_name) return;
        
        const key = tenant.agent_name.trim().toUpperCase();
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            agentName: tenant.agent_name,
            agentPhone: tenant.agent_phone || "",
            earnedCommission: 0,
            expectedCommission: 0,
            withdrawnCommission: 0,
            earningsCount: 0,
            tenantsCount: 0,
          });
        }
        const agent = agentMap.get(key)!;
        agent.expectedCommission += Number(tenant.rent_amount) * 0.05;
        agent.tenantsCount += 1;
        // Use the first non-empty phone number found
        if (tenant.agent_phone && !agent.agentPhone) {
          agent.agentPhone = tenant.agent_phone;
        }
      });

      // Add earned and withdrawn commissions
      earnings?.forEach((earning: any) => {
        if (!earning.agent_name) return;
        
        const key = earning.agent_name.trim().toUpperCase();
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            agentName: earning.agent_name,
            agentPhone: earning.agent_phone || "",
            earnedCommission: 0,
            expectedCommission: 0,
            withdrawnCommission: 0,
            earningsCount: 0,
            tenantsCount: 0,
          });
        }
        
        const agent = agentMap.get(key)!;
        // Use the first non-empty phone number found
        if (earning.agent_phone && !agent.agentPhone) {
          agent.agentPhone = earning.agent_phone;
        }
        
        if (earning.earning_type === "commission") {
          agent.earnedCommission += Number(earning.amount);
          agent.earningsCount += 1;
        } else if (earning.earning_type === "withdrawal") {
          agent.withdrawnCommission += Number(earning.amount);
        }
      });

      return Array.from(agentMap.values()).sort((a, b) => b.earnedCommission - a.earnedCommission);
    },
  });

  // Subscribe to realtime changes for agent_earnings and tenants
  useEffect(() => {
    const earningsChannel = supabase
      .channel('agent-earnings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_earnings'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
        }
      )
      .subscribe();

    const tenantsChannel = supabase
      .channel('agent-tenants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(earningsChannel);
      supabase.removeChannel(tenantsChannel);
    };
  }, [queryClient]);

  return query;
};
