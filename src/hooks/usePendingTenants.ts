import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePendingTenants = () => {
  return useQuery({
    queryKey: ["pending-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

export const usePendingTenantsCount = () => {
  return useQuery({
    queryKey: ["pending-tenants-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
