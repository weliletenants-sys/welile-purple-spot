import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface TeamActivity {
  id: string;
  team_id: string;
  user_identifier: string;
  user_name: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export const useTeamActivities = (teamId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["team-activities", teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from("team_activities")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as TeamActivity[];
    },
    enabled: !!teamId,
  });

  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`team-activities-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_activities',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["team-activities", teamId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient]);

  const logActivity = useMutation({
    mutationFn: async (activity: {
      team_id: string;
      user_identifier: string;
      user_name: string;
      activity_type: string;
      description: string;
      metadata?: Record<string, any>;
    }) => {
      const { error } = await supabase.from("team_activities").insert(activity);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-activities"] });
    },
  });

  return {
    activities: activities || [],
    isLoading,
    logActivity: logActivity.mutate,
  };
};
