import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { useEffect } from "react";

export interface PeriodicEarning {
  period: string;
  expectedCommission: number;
  earnedCommission: number;
  withdrawnCommission: number;
}

export const useAgentPeriodicEarnings = (agentName: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agentPeriodicEarnings", agentName],
    queryFn: async () => {
      // Get all tenants for this agent
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("rent_amount")
        .ilike("agent_name", agentName);

      if (tenantsError) throw tenantsError;

      const expectedPerTenant = tenants?.reduce((sum, t) => sum + Number(t.rent_amount) * 0.05, 0) || 0;

      // Get all earnings for this agent
      const { data: earnings, error: earningsError } = await supabase
        .from("agent_earnings")
        .select("created_at, amount, earning_type")
        .ilike("agent_name", agentName)
        .order("created_at", { ascending: false });

      if (earningsError) throw earningsError;

      // Group by month
      const periodicMap = new Map<string, PeriodicEarning>();

      earnings?.forEach((earning) => {
        const date = new Date(earning.created_at);
        const monthKey = format(date, "MMM yyyy");

        if (!periodicMap.has(monthKey)) {
          periodicMap.set(monthKey, {
            period: monthKey,
            expectedCommission: expectedPerTenant,
            earnedCommission: 0,
            withdrawnCommission: 0,
          });
        }

        const periodic = periodicMap.get(monthKey)!;
        if (earning.earning_type === "commission") {
          periodic.earnedCommission += Number(earning.amount);
        } else if (earning.earning_type === "withdrawal") {
          periodic.withdrawnCommission += Number(earning.amount);
        }
      });

      return Array.from(periodicMap.values());
    },
    enabled: !!agentName,
  });

  // Subscribe to realtime changes for agent earnings
  useEffect(() => {
    if (!agentName) return;

    const channel = supabase
      .channel(`agent-periodic-earnings-${agentName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_earnings'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agentPeriodicEarnings", agentName] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentName, queryClient]);

  return query;
};
