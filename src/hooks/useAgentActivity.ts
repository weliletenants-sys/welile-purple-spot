import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LogActivityParams {
  agentId: string;
  agentName: string;
  agentPhone: string;
  actionType: string;
  actionDescription?: string;
  metadata?: Record<string, any>;
}

export const useAgentActivity = () => {
  const logActivity = async ({
    agentId,
    agentName,
    agentPhone,
    actionType,
    actionDescription,
    metadata = {},
  }: LogActivityParams) => {
    try {
      const { error } = await supabase.rpc("log_agent_activity", {
        p_agent_id: agentId,
        p_agent_name: agentName,
        p_agent_phone: agentPhone,
        p_action_type: actionType,
        p_action_description: actionDescription || null,
        p_metadata: metadata,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error logging agent activity:", error);
    }
  };

  const recordLogin = async (
    agentId: string,
    agentName: string,
    agentPhone: string
  ) => {
    try {
      const { error } = await supabase.rpc("record_agent_login", {
        p_agent_id: agentId,
        p_agent_name: agentName,
        p_agent_phone: agentPhone,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error recording agent login:", error);
    }
  };

  return {
    logActivity,
    recordLogin,
  };
};
