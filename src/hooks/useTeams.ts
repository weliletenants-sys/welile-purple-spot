import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  total_points?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_identifier: string;
  role: string;
  joined_at: string;
}

export const useTeams = () => {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (teamsError) throw teamsError;

      // Get member counts and total points for each team
      const teamsWithStats = await Promise.all(
        (teams || []).map(async (team) => {
          // Get member count
          const { count } = await supabase
            .from("team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id);

          // Get team members' user_identifiers
          const { data: members } = await supabase
            .from("team_members")
            .select("user_identifier")
            .eq("team_id", team.id);

          const userIdentifiers = members?.map((m) => m.user_identifier) || [];

          // Calculate total points from user achievements
          let totalPoints = 0;
          if (userIdentifiers.length > 0) {
            const { data: achievements } = await supabase
              .from("user_achievements")
              .select(`
                badges (
                  points
                )
              `)
              .in("user_identifier", userIdentifiers);

            totalPoints = achievements?.reduce(
              (sum, achievement: any) => sum + (achievement.badges?.points || 0),
              0
            ) || 0;
          }

          return {
            ...team,
            member_count: count || 0,
            total_points: totalPoints,
          };
        })
      );

      return teamsWithStats as Team[];
    },
  });
};

export const useTeamMembers = (teamId: string) => {
  return useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!teamId,
  });
};

export const useUserTeam = (userIdentifier: string) => {
  return useQuery({
    queryKey: ["user-team", userIdentifier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select(`
          *,
          teams (*)
        `)
        .eq("user_identifier", userIdentifier)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as any;
    },
    enabled: !!userIdentifier,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (team: {
      name: string;
      description?: string;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from("teams")
        .insert(team)
        .select()
        .single();

      if (error) throw error;

      // Auto-join creator to team
      await supabase.from("team_members").insert({
        team_id: data.id,
        user_identifier: team.created_by,
        role: "leader",
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create team");
    },
  });
};

export const useJoinTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      userIdentifier,
    }: {
      teamId: string;
      userIdentifier: string;
    }) => {
      const { data, error } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          user_identifier: userIdentifier,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["user-team"] });
      toast.success("Joined team successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to join team");
    },
  });
};

export const useLeaveTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      userIdentifier,
    }: {
      teamId: string;
      userIdentifier: string;
    }) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .eq("user_identifier", userIdentifier);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["user-team"] });
      toast.success("Left team successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to leave team");
    },
  });
};