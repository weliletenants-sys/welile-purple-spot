import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TransferRecord {
  id: string;
  action_type: string;
  action_description: string | null;
  metadata: {
    tenant_id?: string;
    tenant_name?: string;
    to_agent?: string;
    from_agent?: string;
    reason?: string;
  };
  created_at: string;
}

export const useAgentTransferHistory = (agentName: string) => {
  return useQuery({
    queryKey: ["agent-transfer-history", agentName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_activity_log")
        .select("*")
        .eq("agent_name", agentName)
        .in("action_type", ["tenant_transfer_out", "tenant_transfer_in"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TransferRecord[];
    },
    enabled: !!agentName,
  });
};
