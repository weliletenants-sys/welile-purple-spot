import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTenantStatusHistory = (tenantId: string) => {
  return useQuery({
    queryKey: ["tenant-status-history", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_status_history")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
};

export const useAllStatusHistory = () => {
  return useQuery({
    queryKey: ["all-status-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_status_history")
        .select(`
          *,
          tenants (
            name,
            contact
          )
        `)
        .order("changed_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
};
