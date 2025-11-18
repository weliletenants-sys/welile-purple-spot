import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TransferRecord {
  id: string;
  action_type: string;
  action_description: string | null;
  agent_name: string;
  agent_phone: string;
  metadata: {
    tenant_id?: string;
    tenant_name?: string;
    to_agent?: string;
    from_agent?: string;
    reason?: string;
  };
  created_at: string;
}

export const useAllTransferHistory = () => {
  return useQuery({
    queryKey: ["all-transfer-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_activity_log")
        .select("*")
        .in("action_type", ["tenant_transfer_out", "tenant_transfer_in"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TransferRecord[];
    },
  });
};
