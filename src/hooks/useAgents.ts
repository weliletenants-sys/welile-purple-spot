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
        .from("agents")
        .select("name, phone")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      const agents: Agent[] = data.map((agent) => ({
        name: agent.name,
        phone: agent.phone || "",
      }));

      // Sort to put MUHWEZI MARTIN first, then alphabetically
      agents.sort((a, b) => {
        if (a.name === "MUHWEZI MARTIN") return -1;
        if (b.name === "MUHWEZI MARTIN") return 1;
        return a.name.localeCompare(b.name);
      });

      return agents;
    },
  });

  // Subscribe to realtime changes for agents table
  useEffect(() => {
    const channel = supabase
      .channel('agents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents'
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
