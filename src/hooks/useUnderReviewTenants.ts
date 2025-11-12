import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUnderReviewTenants = () => {
  return useQuery({
    queryKey: ["under-review-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("status", "under_review")
        .order("rejected_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

export const useUnderReviewTenantsCount = () => {
  return useQuery({
    queryKey: ["under-review-tenants-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true })
        .eq("status", "under_review");

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
