import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentEarning {
  agentName: string;
  agentPhone: string;
  totalCommission: number;
  earningsCount: number;
}

export const useAgentEarnings = () => {
  return useQuery({
    queryKey: ["agentEarnings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_earnings")
        .select("*")
        .eq("earning_type", "commission");

      if (error) {
        console.error("Error fetching agent earnings:", error);
        throw error;
      }

      // Group earnings by agent
      const agentMap = new Map<string, AgentEarning>();
      
      data.forEach((earning: any) => {
        const key = earning.agent_phone;
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            agentName: earning.agent_name,
            agentPhone: earning.agent_phone,
            totalCommission: 0,
            earningsCount: 0,
          });
        }
        const agent = agentMap.get(key)!;
        agent.totalCommission += Number(earning.amount);
        agent.earningsCount += 1;
      });

      return Array.from(agentMap.values()).sort((a, b) => b.totalCommission - a.totalCommission);
    },
  });
};
