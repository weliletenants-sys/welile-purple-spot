import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Agent {
  name: string;
  phone: string;
}

export const useAgents = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("agent_name, agent_phone")
        .not("agent_name", "is", null)
        .not("agent_name", "eq", "")
        .order("agent_name");

      if (error) throw error;

      // Get unique agents with their phone numbers
      const uniqueAgents = new Map<string, string>();
      data?.forEach((tenant) => {
        if (tenant.agent_name && tenant.agent_phone) {
          uniqueAgents.set(tenant.agent_name, tenant.agent_phone);
        }
      });

      // Convert to array and ensure MUHWEZI MARTIN is always first
      const agents: Agent[] = Array.from(uniqueAgents.entries()).map(
        ([name, phone]) => ({
          name,
          phone,
        })
      );

      // Sort to put MUHWEZI MARTIN first, then alphabetically
      agents.sort((a, b) => {
        if (a.name === "MUHWEZI MARTIN") return -1;
        if (b.name === "MUHWEZI MARTIN") return 1;
        return a.name.localeCompare(b.name);
      });

      // Ensure MUHWEZI MARTIN exists in the list
      const hasMuhweziMartin = agents.some(
        (agent) => agent.name === "MUHWEZI MARTIN"
      );
      if (!hasMuhweziMartin) {
        agents.unshift({ name: "MUHWEZI MARTIN", phone: "" });
      }

      return agents;
    },
  });

  // Subscribe to realtime changes for tenants (to update agent list)
  useEffect(() => {
    const channel = supabase
      .channel('agents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agents"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};
