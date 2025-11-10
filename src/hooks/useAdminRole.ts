import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAdminRole = () => {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["admin-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      return data as boolean;
    },
    enabled: !!user?.id,
  });

  return { isAdmin, isLoading };
};