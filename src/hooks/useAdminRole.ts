import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminRole = () => {
  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ['adminRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error) return false;
      return !!data;
    },
  });

  return { isAdmin, isLoading };
};